/**
 * IndexedDB wrapper for persisting quincena data.
 *
 * DB name  : qf_db
 * Version  : 2
 * Stores   :
 *   - periods  (keyPath = 'id')  — one record per quincena
 *   - meta     (keyPath = 'key') — key-value pairs (e.g. current_period_id)
 *
 * Migration: v1 had a single 'state' store with a blob. On upgrade to v2,
 * if old data is found it is migrated to the new stores automatically.
 */

import type { Period, FinanceState } from './useFinanceData';

const DB_NAME = 'qf_db';
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      const tx = (e.target as IDBOpenDBRequest).transaction!;
      const oldVersion = e.oldVersion;

      // Create new stores if they don't exist
      if (!db.objectStoreNames.contains('periods')) {
        db.createObjectStore('periods', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }

      // Migrate from v1: read old 'state' blob and import into new stores
      if (oldVersion < 2 && db.objectStoreNames.contains('state')) {
        const stateStore = tx.objectStore('state');
        const getReq = stateStore.get('qf_state');
        getReq.onsuccess = () => {
          const raw = getReq.result;
          if (!raw) return;
          const oldState: FinanceState = raw.value;

          const periodsStore = tx.objectStore('periods');
          const metaStore = tx.objectStore('meta');

          // Save all historical periods
          (oldState.history || []).forEach((p) => periodsStore.put(p));

          // Save current period and mark it as active
          if (oldState.currentPeriod) {
            periodsStore.put(oldState.currentPeriod);
            metaStore.put({ key: 'current_period_id', value: oldState.currentPeriod.id });
          }
        };
        // Note: we intentionally leave the old 'state' store intact
        // (deleting it would require it being listed in objectStoreNames during upgrade)
      }
    };

    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

// ── Period CRUD ───────────────────────────────────────────────────────────────

export async function getAllPeriods(): Promise<Period[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('periods', 'readonly');
      const req = tx.objectStore('periods').getAll();
      req.onsuccess = () => resolve(req.result as Period[]);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] getAllPeriods failed', err);
    return [];
  }
}

export async function getPeriod(id: string): Promise<Period | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('periods', 'readonly');
      const req = tx.objectStore('periods').get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] getPeriod failed', err);
    return null;
  }
}

export async function savePeriod(period: Period): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('periods', 'readwrite');
      const req = tx.objectStore('periods').put(period);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] savePeriod failed', err);
  }
}

export async function deletePeriodFromDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('periods', 'readwrite');
      const req = tx.objectStore('periods').delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] deletePeriod failed', err);
  }
}

// ── Meta (current period id) ──────────────────────────────────────────────────

export async function getCurrentPeriodId(): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('meta', 'readonly');
      const req = tx.objectStore('meta').get('current_period_id');
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] getCurrentPeriodId failed', err);
    return null;
  }
}

export async function setCurrentPeriodId(id: string | null): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('meta', 'readwrite');
      const store = tx.objectStore('meta');
      const req = id
        ? store.put({ key: 'current_period_id', value: id })
        : store.delete('current_period_id');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] setCurrentPeriodId failed', err);
  }
}
