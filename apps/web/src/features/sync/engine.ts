// apps/web/src/features/sync/engine.ts
import { useAuth } from '../auth/useAuth';
import { pushSnapshot, pullSnapshot } from './syncApi';
import { mergeProgress } from './merge';

class SyncEngine {
  private timer: number | null = null;
  private syncing = false;
  private dirty = false;
  private revision = 0;
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
    this.dirty = true;
    if (this.timer) window.clearTimeout(this.timer);
    // Debounce pushes 3 seconds
    this.timer = window.setTimeout(() => this.push(), 3000);
  }

  async pull() {
    const auth = useAuth.getState();
    if (auth.status !== 'signed-in' || !this.getStoreData || !this.setStoreData) return;

    try {
      const result = await pullSnapshot();
      if (result.ok && !result.empty && result.data) {
        const local = this.getStoreData();
        const merged = mergeProgress(local, result.data, { preferLocalPrefs: false });
        this.setStoreData(merged);
        this.revision = result.revision || this.revision;
        this.saveMeta();
      }
    } catch {
      // Offline / network failure
    }
  }

  async push() {
    const auth = useAuth.getState();
    if (auth.status !== 'signed-in' || !this.dirty || this.syncing || !this.getStoreData) return;

    this.syncing = true;
    try {
      const current = this.getStoreData();
      const result = await pushSnapshot(current, this.schemaVersion, this.revision);

      if (result.ok) {
        this.dirty = false;
        if (typeof result.revision === 'number') {
          this.revision = result.revision;
          this.saveMeta();
        }
      } else if (result.code === 'conflict') {
        // Revision conflict: pull, merge, and retry
        await this.pull();
        this.dirty = true;
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
