// apps/web/src/features/sync/engine.ts
import { useAuth } from '../auth/useAuth';
import { sanitize } from '../progress/store';
import { pushSnapshot, pullSnapshot } from './syncApi';
import { mergeProgress } from './merge';

const MAX_CONFLICT_RETRIES = 4;

class SyncEngine {
  private timer: number | null = null;
  private syncing = false;
  private dirty = false;
  private revision = 0;
  /** Bumped on every local change; lets push() tell whether edits landed mid-flight. */
  private changeVersion = 0;
  /** True while a pulled snapshot is being written to the store, so it is not echoed back as a push. */
  private applyingRemote = false;
  private conflictRetries = 0;
  private schemaVersion = 5;
  private getStoreData: (() => any) | null = null;
  private setStoreData: ((data: any) => void) | null = null;

  init(getStoreData: () => any, setStoreData: (data: any) => void) {
    this.getStoreData = getStoreData;
    this.setStoreData = setStoreData;

    // Load saved revision from sync meta
    try {
      const meta = JSON.parse(localStorage.getItem('codegames-sync-meta') || '{}');
      if (typeof meta.revision === 'number') {
        this.revision = meta.revision;
      }
    } catch {
      // Ignore parse errors
    }

    // Pull when tab becomes visible
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.pull();
      }
    });

    // Re-sync when back online
    window.addEventListener('online', () => {
      this.triggerSync();
    });
  }

  notifyChange() {
    if (this.applyingRemote) return;
    this.dirty = true;
    this.changeVersion++;
    this.schedulePush(3000);
  }

  /** Forget everything tied to the signed-in account (call on sign-out). */
  reset() {
    if (this.timer) window.clearTimeout(this.timer);
    this.timer = null;
    this.dirty = false;
    this.revision = 0;
    this.changeVersion++;
    this.conflictRetries = 0;
    try {
      localStorage.removeItem('codegames-sync-meta');
    } catch {
      // Ignore storage errors
    }
  }

  private schedulePush(delayMs: number) {
    if (this.timer) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => void this.push(), delayMs);
  }

  async pull() {
    const auth = useAuth.getState();
    if (auth.status !== 'signed-in' || auth.isGuest || !this.getStoreData || !this.setStoreData) return;

    try {
      const result = await pullSnapshot();
      if (result.ok && result.empty) {
        // Server has no row (admin reset or different account): next push must start at revision 0.
        this.revision = 0;
        this.saveMeta();
      } else if (result.ok && result.data) {
        const local = this.getStoreData();
        // Sanitize remote before merge and again after — never trust the blob.
        const merged = mergeProgress(local, sanitize(result.data), { preferLocalPrefs: false });
        this.applyingRemote = true;
        try {
          this.setStoreData(sanitize(merged));
        } finally {
          this.applyingRemote = false;
        }
        this.revision = result.revision || this.revision;
        this.saveMeta();
      }
    } catch {
      // Offline / network failure
    }
  }

  async push() {
    const auth = useAuth.getState();
    if (auth.status !== 'signed-in' || auth.isGuest || !this.dirty || this.syncing || !this.getStoreData) return;

    this.syncing = true;
    const versionAtStart = this.changeVersion;
    try {
      const current = this.getStoreData();
      const result = await pushSnapshot(current, this.schemaVersion, this.revision);

      if (result.ok) {
        this.conflictRetries = 0;
        if (this.changeVersion === versionAtStart) {
          this.dirty = false;
        } else {
          // Edits arrived while the push was in flight: upload them too.
          this.schedulePush(3000);
        }
        if (typeof result.revision === 'number') {
          this.revision = result.revision;
          this.saveMeta();
        }
      } else if (result.code === 'conflict') {
        // Revision conflict: pull, merge, and retry with bounded backoff
        await this.pull();
        this.dirty = true;
        if (this.conflictRetries < MAX_CONFLICT_RETRIES) {
          this.schedulePush(2000 * 2 ** this.conflictRetries);
          this.conflictRetries++;
        }
      }
    } catch {
      // Retry next cycle
    } finally {
      this.syncing = false;
    }
  }

  private triggerSync() {
    if (this.dirty) {
      this.push();
    } else {
      this.pull();
    }
  }

  private saveMeta() {
    try {
      localStorage.setItem('codegames-sync-meta', JSON.stringify({ revision: this.revision }));
    } catch {
      // Ignore storage errors
    }
  }
}

export const syncEngine = new SyncEngine();
