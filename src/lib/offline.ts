import { supabase } from './supabaseClient';

/**
 * Offline support layer.
 *
 *  - READ CACHE: every table fetched from Supabase is mirrored into IndexedDB,
 *    so the app can still show the last known data with no connection.
 *  - OUTBOX: writes made while offline (or when the network drops mid-request)
 *    are stored in IndexedDB and replayed, in order, once the connection is
 *    back. The UI already updates optimistically, and the read cache is
 *    patched too, so a reload while offline still shows the user's changes.
 *
 * Conflict policy is "last write wins" (same as the online behaviour: rows are
 * upserted by id). Rows rejected by the database for a non-network reason
 * (e.g. RLS, constraint) are dropped from the outbox and reported, so one bad
 * row can never block the rest of the queue.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RowOf = { id: string };

export type OutboxOp =
  | { type: 'upsert'; org: string; table: string; rows: RowOf[] }
  | { type: 'delete'; org: string; table: string; id: string }
  | { type: 'deleteAll'; org: string; table: string }
  | { type: 'rpc'; org: string; fn: string; args: Record<string, unknown> };

type StoredOp = OutboxOp & { seq?: number; createdAt: number };

/** A change the server refused, kept on the device so it can be reviewed or re-sent. */
export type RejectedOp = StoredOp & { rejectedAt: number; error: string };

export type SyncState = {
  /** Number of changes waiting to be sent to the server. */
  pending: number;
  /** True while the outbox is being replayed. */
  syncing: boolean;
  /** Changes the server rejected (not a connectivity problem) and that are still kept on the device. */
  rejected: number;
  lastError: string | null;
};

// ---------------------------------------------------------------------------
// Tiny IndexedDB wrapper (no dependency)
// ---------------------------------------------------------------------------

const DB_NAME = 'rajakas-offline';
const DB_VERSION = 2;
const STORE_CACHE = 'cache';
const STORE_OUTBOX = 'outbox';
const STORE_REJECTED = 'rejected';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB tidak tersedia'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_CACHE)) db.createObjectStore(STORE_CACHE);
      if (!db.objectStoreNames.contains(STORE_OUTBOX)) db.createObjectStore(STORE_OUTBOX, { keyPath: 'seq', autoIncrement: true });
      if (!db.objectStoreNames.contains(STORE_REJECTED)) db.createObjectStore(STORE_REJECTED, { keyPath: 'seq', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  // If opening failed once (private mode etc.) allow a later retry.
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await openDb();
  return new Promise<T | undefined>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => resolve(req ? (req.result as T) : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

// ---------------------------------------------------------------------------
// Network error detection
// ---------------------------------------------------------------------------

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/** True when the failure is about connectivity, not about the data itself. */
export function isNetworkError(err: unknown): boolean {
  if (isOffline()) return true;
  const msg = (err instanceof Error ? err.message : typeof err === 'string' ? err : (err as { message?: string })?.message ?? '').toLowerCase();
  const status = (err as { status?: number } | null)?.status;
  if (status === 0 || status === 502 || status === 503 || status === 504) return true;
  return /failed to fetch|networkerror|network request failed|load failed|fetch failed|network error|timeout|timed out|err_internet|err_network|connection (closed|reset|refused)/.test(msg);
}

// ---------------------------------------------------------------------------
// Active organisation (the outbox only replays ops of the signed-in company)
// ---------------------------------------------------------------------------

let activeOrg: string | null = null;

export function setOfflineOrganization(id: string | null) {
  activeOrg = id;
  if (id) {
    void refreshPending().then(() => scheduleFlush(0));
  } else {
    void refreshPending();
  }
}

// ---------------------------------------------------------------------------
// Sync state (observable for the UI)
// ---------------------------------------------------------------------------

let state: SyncState = { pending: 0, syncing: false, rejected: 0, lastError: null };
const listeners = new Set<() => void>();

function setState(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const getSyncState = () => state;
export function subscribeSync(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

// ---------------------------------------------------------------------------
// Read cache
// ---------------------------------------------------------------------------

const cacheKey = (org: string, name: string) => `${org}:${name}`;

export async function cacheGet<T>(org: string, name: string): Promise<T | undefined> {
  try {
    await settlePatches();
    return (await tx<T>(STORE_CACHE, 'readonly', (s) => s.get(cacheKey(org, name)))) as T | undefined;
  } catch {
    return undefined;
  }
}

export async function cacheSet<T>(org: string, name: string, value: T): Promise<void> {
  try {
    await settlePatches();
    await tx(STORE_CACHE, 'readwrite', (s) => { s.put(value, cacheKey(org, name)); });
  } catch {
    /* cache is best-effort */
  }
}

/** Remove all cached data (used on sign-out so data does not linger on shared devices). */
export async function clearReadCache(): Promise<void> {
  try {
    await settlePatches();
    await tx(STORE_CACHE, 'readwrite', (s) => { s.clear(); });
  } catch {
    /* ignore */
  }
}

// Row patches are coalesced per table so a bulk import of thousands of rows
// results in ONE read-modify-write instead of thousands.
type Patch = (rows: RowOf[]) => RowOf[];
const pendingPatches = new Map<string, { org: string; table: string; fns: Patch[] }>();
let patchTimer: ReturnType<typeof setTimeout> | null = null;
let patchRun: Promise<void> = Promise.resolve();

function schedulePatch(org: string, table: string, fn: Patch) {
  const key = cacheKey(org, table);
  const entry = pendingPatches.get(key) ?? { org, table, fns: [] };
  entry.fns.push(fn);
  pendingPatches.set(key, entry);
  if (!patchTimer) patchTimer = setTimeout(() => { patchTimer = null; patchRun = patchRun.then(applyPatches); }, 0);
}

async function applyPatches() {
  const batch = [...pendingPatches.values()];
  pendingPatches.clear();
  for (const { org, table, fns } of batch) {
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const t = db.transaction(STORE_CACHE, 'readwrite');
        const store = t.objectStore(STORE_CACHE);
        const getReq = store.get(cacheKey(org, table));
        getReq.onsuccess = () => {
          // Nothing cached yet = the table was never loaded; there is no base to patch.
          if (getReq.result === undefined) return;
          let rows = getReq.result as RowOf[];
          for (const fn of fns) rows = fn(rows);
          store.put(rows, cacheKey(org, table));
        };
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      });
    } catch {
      /* best-effort */
    }
  }
}

async function settlePatches() {
  if (patchTimer) { clearTimeout(patchTimer); patchTimer = null; patchRun = patchRun.then(applyPatches); }
  await patchRun;
}

export function patchCacheUpsert(org: string, table: string, rows: RowOf[]) {
  schedulePatch(org, table, (cur) => {
    const incoming = new Map(rows.map((r) => [r.id, r]));
    const next = cur.map((r) => (incoming.has(r.id) ? incoming.get(r.id)! : r));
    const existing = new Set(cur.map((r) => r.id));
    const added = rows.filter((r) => !existing.has(r.id));
    return [...added, ...next];
  });
}
export function patchCacheDelete(org: string, table: string, id: string) {
  schedulePatch(org, table, (cur) => cur.filter((r) => r.id !== id));
}
export function patchCacheClear(org: string, table: string) {
  schedulePatch(org, table, () => []);
}

// ---------------------------------------------------------------------------
// Outbox
// ---------------------------------------------------------------------------

async function outboxAll(): Promise<StoredOp[]> {
  try {
    return ((await tx<StoredOp[]>(STORE_OUTBOX, 'readonly', (s) => s.getAll())) ?? []) as StoredOp[];
  } catch {
    return [];
  }
}

async function rejectedAll(): Promise<RejectedOp[]> {
  try {
    return ((await tx<RejectedOp[]>(STORE_REJECTED, 'readonly', (s) => s.getAll())) ?? []) as RejectedOp[];
  } catch {
    return [];
  }
}

async function refreshPending() {
  const [ops, bad] = await Promise.all([outboxAll(), rejectedAll()]);
  setState({
    pending: activeOrg ? ops.filter((o) => o.org === activeOrg).length : 0,
    rejected: activeOrg ? bad.filter((o) => o.org === activeOrg).length : 0,
  });
}

export async function enqueue(op: OutboxOp): Promise<void> {
  await tx(STORE_OUTBOX, 'readwrite', (s) => { s.add({ ...op, createdAt: Date.now() }); });
  await refreshPending();
  scheduleFlush(isOffline() ? 15000 : 1500);
}

export const hasPending = () => state.pending > 0;

/** Changes the server refused for the signed-in company (newest last). */
export async function getRejectedOps(): Promise<RejectedOp[]> {
  return (await rejectedAll()).filter((o) => !activeOrg || o.org === activeOrg);
}

/** Put every refused change back in the queue and try again (e.g. after fixing permissions). */
export async function retryRejected(): Promise<void> {
  const bad = (await rejectedAll()).filter((o) => o.org === activeOrg);
  for (const item of bad) {
    const { seq, rejectedAt: _at, error: _e, createdAt, ...op } = item;
    await tx(STORE_OUTBOX, 'readwrite', (s) => { s.add({ ...op, createdAt }); });
    await tx(STORE_REJECTED, 'readwrite', (s) => { s.delete(seq!); });
  }
  setState({ lastError: null });
  await refreshPending();
  scheduleFlush(0);
}

/** Permanently forget the refused changes of the signed-in company. */
export async function discardRejected(): Promise<void> {
  const bad = (await rejectedAll()).filter((o) => o.org === activeOrg);
  for (const item of bad) await tx(STORE_REJECTED, 'readwrite', (s) => { s.delete(item.seq!); });
  setState({ lastError: null });
  await refreshPending();
}

async function execute(op: OutboxOp): Promise<void> {
  if (!supabase) return;
  if (op.type === 'upsert') {
    for (let i = 0; i < op.rows.length; i += 200) {
      const chunk = op.rows.slice(i, i + 200);
      const { error } = await supabase
        .from(op.table)
        .upsert(chunk.map((row) => ({ organization_id: op.org, id: row.id, data: row })), { onConflict: 'organization_id,id' });
      if (error) throw error;
    }
  } else if (op.type === 'delete') {
    const { error } = await supabase.from(op.table).delete().eq('organization_id', op.org).eq('id', op.id);
    if (error) throw error;
  } else if (op.type === 'deleteAll') {
    const { error } = await supabase.from(op.table).delete().eq('organization_id', op.org);
    if (error) throw error;
  } else {
    const { error } = await supabase.rpc(op.fn, op.args);
    if (error) throw error;
  }
}

let flushing: Promise<void> | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleFlush(delayMs = 0) {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => { flushTimer = null; void flushOutbox(); }, delayMs);
}

/** Replay queued changes in order. Resolves when the queue is empty or the network is down. */
export function flushOutbox(): Promise<void> {
  if (flushing) return flushing;
  flushing = (async () => {
    if (!supabase || !activeOrg || isOffline()) { await refreshPending(); return; }
    setState({ syncing: true });
    try {
      // Keep going until the queue is empty: changes enqueued while we were sending
      // must not have to wait for the next timer.
      for (;;) {
      const ops = (await outboxAll()).filter((o) => o.org === activeOrg);
      if (ops.length === 0) break;
      for (const op of ops) {
        try {
          await execute(op);
          await tx(STORE_OUTBOX, 'readwrite', (s) => { s.delete(op.seq!); });
        } catch (err) {
          if (isNetworkError(err)) {
            // Still offline / flaky: keep everything, try again later.
            scheduleFlush(15000);
            return;
          }
          // The server refused this change. Move it out of the queue (so it cannot block the
          // rest) but KEEP it on the device, so the user can re-send or discard it later.
          const message = err instanceof Error ? err.message : (err as { message?: string })?.message ?? 'Ditolak server';
          console.error('[Offline] change rejected by server:', op, message);
          const { seq: _seq, ...rest } = op;
          await tx(STORE_REJECTED, 'readwrite', (s) => { s.add({ ...rest, rejectedAt: Date.now(), error: message }); });
          await tx(STORE_OUTBOX, 'readwrite', (s) => { s.delete(op.seq!); });
          setState({ lastError: message });
        }
        await refreshPending();
      }
      }
    } finally {
      await refreshPending();
      setState({ syncing: false });
    }
  })().finally(() => { flushing = null; });
  return flushing;
}

/**
 * Run a write now; if the network is unavailable (or older changes are still
 * waiting, to keep their order) store it in the outbox instead.
 * Resolves normally in both cases; throws only for real database errors.
 */
export async function submitOrQueue(op: OutboxOp, direct: () => Promise<void>): Promise<void> {
  if (op.type === 'upsert') patchCacheUpsert(op.org, op.table, op.rows);
  else if (op.type === 'delete') patchCacheDelete(op.org, op.table, op.id);
  else if (op.type === 'deleteAll') patchCacheClear(op.org, op.table);

  if (isOffline() || hasPending()) {
    await enqueue(op);
    return;
  }
  try {
    await direct();
  } catch (err) {
    if (isNetworkError(err)) {
      await enqueue(op);
      return;
    }
    throw err;
  }
}

/** Read through the cache: network first, cached copy when offline. */
export async function cachedRead<T>(org: string | null, name: string, fetcher: () => Promise<T>): Promise<T> {
  try {
    const fresh = await fetcher();
    if (org) void cacheSet(org, name, fresh);
    return fresh;
  } catch (err) {
    if (org && isNetworkError(err)) {
      const cached = await cacheGet<T>(org, name);
      if (cached !== undefined) return cached;
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Connectivity listeners
// ---------------------------------------------------------------------------

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => scheduleFlush(500));
  window.addEventListener('offline', () => setState({}));
  // Safety net for flaky connections: retry while something is waiting.
  setInterval(() => { if (state.pending > 0 && !isOffline()) void flushOutbox(); }, 30000);
}
