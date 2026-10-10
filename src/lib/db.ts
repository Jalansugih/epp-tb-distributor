import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Every table created by supabase/schema.sql has the same shape:
 *   organization_id uuid, id text, data jsonb, created_at, updated_at
 *   (primary key = organization_id + id)
 * These helpers read/write that shape so AppContext can treat Supabase
 * persistence as a thin, uniform layer on top of its existing local state.
 */

/**
 * Multi-tenant: every row carries organization_id and RLS only exposes the
 * caller's own organization. The active organization is set by AuthContext
 * once the profile is loaded; it is sent explicitly on writes (the composite
 * primary key is (organization_id, id)) and used as a defensive filter on
 * reads/deletes on top of RLS.
 */
let activeOrganizationId: string | null = null;

export function setActiveOrganization(id: string | null) {
  activeOrganizationId = id;
}

function requireOrganization(): string {
  if (!activeOrganizationId) throw new Error('Perusahaan aktif belum ditentukan. Silakan login ulang.');
  return activeOrganizationId;
}

export type TableName =
  | 'customers'
  | 'suppliers'
  | 'products'
  | 'categories'
  | 'brands'
  | 'uoms'
  | 'price_lists'
  | 'discount_rules'
  | 'payment_terms'
  | 'salespersons'
  | 'warehouses'
  | 'sales_orders'
  | 'quotations'
  | 'deliveries'
  | 'invoices'
  | 'payments'
  | 'purchase_requests'
  | 'purchase_orders'
  | 'goods_receipts'
  | 'purchase_invoices'
  | 'supplier_payments'
  | 'receivables'
  | 'payables'
  | 'stock_movements'
  | 'stock_transfers'
  | 'stock_adjustments'
  | 'batch_serials'
  | 'notifications'
  | 'system_settings';

/** Fetch every row of a table, unwrapped back into plain app objects. */
export async function fetchTable<T extends { id: string }>(table: TableName): Promise<T[]> {
  if (!supabase || !activeOrganizationId) return [];
  const { data, error } = await supabase
    .from(table)
    .select('data')
    .eq('organization_id', activeOrganizationId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error(`[Supabase] fetchTable(${table}) failed:`, error.message);
    return [];
  }
  return (data ?? []).map((row) => row.data as T);
}

/** Insert or update a single row, keyed by the object's own `id`. */
export async function upsertRow<T extends { id: string }>(table: TableName, row: T): Promise<void> {
  if (!supabase) return;
  const organization_id = requireOrganization();
  const { error } = await supabase
    .from(table)
    .upsert({ organization_id, id: row.id, data: row }, { onConflict: 'organization_id,id' });
  if (error) {
    console.error(`[Supabase] upsertRow(${table}, ${row.id}) failed:`, error.message);
    throw new Error(error.message);
  }
}

/** Insert or update many rows of the same table in one round trip. */
export async function upsertRows<T extends { id: string }>(table: TableName, rows: T[]): Promise<void> {
  if (!supabase || rows.length === 0) return;
  const organization_id = requireOrganization();
  const { error } = await supabase
    .from(table)
    .upsert(
      rows.map((row) => ({ organization_id, id: row.id, data: row })),
      { onConflict: 'organization_id,id' }
    );
  if (error) {
    console.error(`[Supabase] upsertRows(${table}) failed:`, error.message);
    throw new Error(error.message);
  }
}

/**
 * Upsert many rows in sequential chunks, so a large import never exceeds the
 * request size limit. Stops at the first failing chunk and throws.
 */
export async function upsertRowsInChunks<T extends { id: string }>(table: TableName, rows: T[], chunkSize = 200): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    await upsertRows(table, rows.slice(i, i + chunkSize));
  }
}

export async function deleteRow(table: TableName, id: string): Promise<void> {
  if (!supabase) return;
  const organization_id = requireOrganization();
  const { error } = await supabase.from(table).delete().eq('organization_id', organization_id).eq('id', id);
  if (error) {
    console.error(`[Supabase] deleteRow(${table}, ${id}) failed:`, error.message);
    throw new Error(error.message);
  }
}

/**
 * Delete every row of the CURRENT organization in a table. Used by the
 * admin-only "reset all data" action. Other organizations are never touched.
 */
export async function deleteAllRows(table: TableName): Promise<void> {
  if (!supabase) return;
  const organization_id = requireOrganization();
  const { error } = await supabase.from(table).delete().eq('organization_id', organization_id);
  if (error) {
    console.error(`[Supabase] deleteAllRows(${table}) failed:`, error.message);
    throw new Error(error.message);
  }
}

/**
 * Fire a persistence call without blocking the UI (state is already updated
 * optimistically by the caller). Failures are surfaced via `onError` so the
 * caller can toast them, instead of failing silently.
 *
 * Note: every helper above now throws a real `Error` (not the raw Supabase
 * PostgrestError object), so `err.message` here is always the actual
 * database error text (RLS violation, missing table/column, etc.) — never
 * the generic fallback below, which now only fires for a genuinely unknown
 * (non-Error) failure.
 */
export function persist(promise: Promise<void>, onError: (message: string) => void) {
  if (!isSupabaseConfigured) return;
  promise.catch((err) => {
    onError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan ke database.');
  });
}
