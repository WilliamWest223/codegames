/**
 * Export / import of all local progress as a JSON file, so learners can move between
 * browsers or computers, and teachers can collect progress (round-1 teacher audit).
 */
import { downloadText } from '../../lib/download';
import { migrateProgress, PROGRESS_VERSION, sanitize } from './store';

const KEY = 'codegames-progress';
const FORMAT = 'codegames-progress-backup';
/** Real saves are well under 1 MB; anything bigger is not one of ours. */
export const MAX_BACKUP_BYTES = 2_000_000;

export interface Backup {
  format: typeof FORMAT;
  exportedAt: string;
  data: unknown;
}

export interface BackupData {
  state: Record<string, unknown>;
  version: number;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function exportProgress(): void {
  let data: unknown = null;
  try {
    const raw = localStorage.getItem(KEY);
    data = raw ? JSON.parse(raw) : null;
  } catch {
    // Unreadable save (corrupted or storage blocked): export an empty backup rather than crash.
    data = null;
  }
  const backup: Backup = { format: FORMAT, exportedAt: new Date().toISOString(), data };
  downloadText(`codegames-progress-${backup.exportedAt.slice(0, 10)}.json`, JSON.stringify(backup, null, 2), 'application/json');
}

/** Validate a backup file's envelope. Returns `{ state, version }` or throws a readable error. */
export function parseBackup(text: string): BackupData {
  if (typeof text !== 'string' || text.length > MAX_BACKUP_BYTES) throw new Error('That file is too big to be a CodeGames progress file.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  if (!isRecord(parsed) || parsed.format !== FORMAT) throw new Error("That doesn't look like a CodeGames progress file.");
  const data = parsed.data;
  if (!isRecord(data) || !isRecord(data.state) || typeof data.version !== 'number' || !Number.isInteger(data.version) || data.version < 0) {
    throw new Error('The progress file is missing its data.');
  }
  if (data.version > PROGRESS_VERSION) throw new Error('That progress file is from a newer version of CodeGames. Update the app and try again.');
  return { state: data.state, version: data.version };
}

/** Envelope contents → the clean persisted payload (migrated to the current version, then sanitized). */
export function cleanBackup(data: BackupData): { state: Record<string, unknown>; version: number } {
  return { state: sanitize(migrateProgress(data.state, data.version)) as Record<string, unknown>, version: PROGRESS_VERSION };
}

/** Replace local progress with a backup and reload so the store re-hydrates. Only sanitized data is stored. */
export function importProgress(text: string): void {
  const clean = cleanBackup(parseBackup(text));
  try {
    localStorage.setItem(KEY, JSON.stringify(clean));
  } catch {
    throw new Error("Couldn't save the imported progress (the browser's storage is full or blocked).");
  }
  window.location.reload();
}
