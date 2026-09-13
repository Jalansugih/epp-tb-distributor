import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Every table created by supabase/schema.sql has the same shape:
 *   id text primary key, data jsonb, created_at, updated_at
 * These helpers read/write that shape so AppContext can treat Supabase
 * persistence as a thin, uniform layer on top of its existing local state.
 */

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
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(table)
    .select('data')
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
  const { error } = await supabase.from(table).upsert({ id: row.id, data: row });
  if (error) {
    console.error(`[Supabase] upsertRow(${table}, ${row.id}) failed:`, error.message);
    throw error;
  }
}

/** Insert or update many rows of the same table in one round trip. */
export async function upsertRows<T extends { id: string }>(table: TableName, rows: T[]): Promise<void> {
  if (!supabase || rows.length === 0) return;
  const { error } = await supabase.from(table).upsert(rows.map((row) => ({ id: row.id, data: row })));
  if (error) {
    console.error(`[Supabase] upsertRows(${table}) failed:`, error.message);
    throw error;
  }
}

export async function deleteRow(table: TableName, id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    console.error(`[Supabase] deleteRow(${table}, ${id}) failed:`, error.message);
    throw error;
  }
}

/**
 * Fire a persistence call without blocking the UI (state is already updated
 * optimistically by the caller). Failures are surfaced via `onError` so the
 * caller can toast them, instead of failing silently.
 */
export function persist(promise: Promise<void>, onError: (message: string) => void) {
  if (!isSupabaseConfigured) return;
  promise.catch((err) => {
    onError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan ke database.');
  });
}
