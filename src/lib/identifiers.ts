/**
 * Production-safe identifiers for browser-generated ERP records.
 * UUIDs avoid Date.now()/Math.random() collisions when multiple users
 * create records concurrently.
 */
export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

const memoryCounters = new Map<string, number>();

/**
 * Generate a human-readable sequential document number.
 * Counter scope is prefix + year + month, so INV/2026/09/0001, 0002, ...
 *
 * In browser mode localStorage keeps the sequence across refreshes. The
 * production database schema also contains a document_counters table/RPC;
 * callers that need cross-user atomic numbering should use nextDocumentNo().
 */
export function generateDocumentNo(prefix: string, date = new Date()): string {
  const normalizedPrefix = prefix.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const key = `distributor:doc-counter:${normalizedPrefix}:${yyyy}-${mm}`;

  let next = 1;
  try {
    const storage = typeof window !== 'undefined' ? window.localStorage : null;
    const current = Number(storage?.getItem(key) ?? memoryCounters.get(key) ?? 0);
    next = Number.isFinite(current) && current >= 0 ? current + 1 : 1;
    if (storage) storage.setItem(key, String(next));
    else memoryCounters.set(key, next);
  } catch {
    const current = memoryCounters.get(key) ?? 0;
    next = current + 1;
    memoryCounters.set(key, next);
  }

  return `${normalizedPrefix}/${yyyy}/${mm}/${String(next).padStart(4, '0')}`;
}

export function generateNumericCode(prefix: string, digits = 9): string {
  const raw = crypto.randomUUID().replace(/\D/g, '');
  const fallback = Date.now().toString();
  const value = (raw + fallback).slice(-digits);
  return `${prefix}${value}`;
}
