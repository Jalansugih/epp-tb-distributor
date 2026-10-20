import { supabase } from './supabaseClient';
import { getActiveOrganization } from './db';

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
 * Generate a human-readable sequential document number (offline-safe fallback).
 * Counter scope is organization + prefix + year + month, so INV/2026/09/0001, ...
 *
 * This counter lives in localStorage, i.e. it is per browser: two users or two
 * devices can still produce the same number. The database therefore enforces
 * unique document codes per organization (supabase/patch-audit-fixes.sql), and
 * `nextDocumentNo()` below asks the server for an atomic number when online.
 */
export function generateDocumentNo(prefix: string, date = new Date()): string {
  const normalizedPrefix = prefix.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const org = getActiveOrganization();
  const key = `distributor:doc-counter:${org ? `${org}:` : ''}${normalizedPrefix}:${yyyy}-${mm}`;

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

/**
 * Atomic, cross-user document number from the `next_document_no` RPC. Falls back
 * to the local counter when Supabase is not configured or the network is down.
 */
export async function nextDocumentNo(prefix: string, date = new Date()): Promise<string> {
  if (supabase && getActiveOrganization() && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    try {
      const { data, error } = await supabase.rpc('next_document_no', { p_prefix: prefix, p_date: day });
      if (!error && typeof data === 'string' && data) return data;
    } catch {
      /* network problem: use the local counter below */
    }
  }
  // Offline devices cannot coordinate counters. Add a short random suffix so
  // their fallback number is still distinct when it reaches the server later.
  return `${generateDocumentNo(prefix, date)}-OFF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export function generateNumericCode(prefix: string, digits = 9): string {
  const raw = crypto.randomUUID().replace(/\D/g, '');
  const fallback = Date.now().toString();
  const value = (raw + fallback).slice(-digits);
  return `${prefix}${value}`;
}
