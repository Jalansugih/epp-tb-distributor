/**
 * One-time script to load the app's bundled demo data into a fresh
 * Supabase project, so the app has something to show before real data
 * is entered.
 *
 * Usage:
 *   1. Run supabase/schema.sql in your project's SQL editor first.
 *   2. Set these two env vars (service role key, NOT the anon key —
 *      seeding needs to bypass RLS on an empty, unauthenticated table):
 *        SUPABASE_URL=https://xxxx.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=eyJ....
 *      (Find both under Project Settings → API in the Supabase dashboard.)
 *   3. npx tsx scripts/seed.ts
 *
 * Safe to re-run: every row is upserted by id, so running it twice just
 * overwrites the same demo rows instead of duplicating them.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import {
  mockCustomers, mockSuppliers, mockProducts, mockCategories, mockBrands,
  mockUoms, mockPriceLists, mockDiscountRules, mockPaymentTerms,
  mockSalespersons, mockWarehouses, mockSalesOrders, mockQuotations,
  mockDeliveries, mockInvoices, mockPayments, mockPurchaseRequests,
  mockPurchaseOrders, mockGoodsReceipts, mockPurchaseInvoices,
  mockSupplierPayments, mockReceivables, mockPayables, mockStockMovements,
  mockStockTransfers, mockStockAdjustments, mockBatchSerials, mockNotifications
} from '../src/data/mockData';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    'Missing env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.'
  );
  process.exit(1);
}

const supabase = createClient(url, key);

type SeedEntry = { table: string; rows: { id: string }[] };

const seeds: SeedEntry[] = [
  { table: 'customers', rows: mockCustomers },
  { table: 'suppliers', rows: mockSuppliers },
  { table: 'products', rows: mockProducts },
  { table: 'categories', rows: mockCategories },
  { table: 'brands', rows: mockBrands },
  { table: 'uoms', rows: mockUoms },
  { table: 'price_lists', rows: mockPriceLists },
  { table: 'discount_rules', rows: mockDiscountRules },
  { table: 'payment_terms', rows: mockPaymentTerms },
  { table: 'salespersons', rows: mockSalespersons },
  { table: 'warehouses', rows: mockWarehouses },
  { table: 'sales_orders', rows: mockSalesOrders },
  { table: 'quotations', rows: mockQuotations },
  { table: 'deliveries', rows: mockDeliveries },
  { table: 'invoices', rows: mockInvoices },
  { table: 'payments', rows: mockPayments },
  { table: 'purchase_requests', rows: mockPurchaseRequests },
  { table: 'purchase_orders', rows: mockPurchaseOrders },
  { table: 'goods_receipts', rows: mockGoodsReceipts },
  { table: 'purchase_invoices', rows: mockPurchaseInvoices },
  { table: 'supplier_payments', rows: mockSupplierPayments },
  { table: 'receivables', rows: mockReceivables },
  { table: 'payables', rows: mockPayables },
  { table: 'stock_movements', rows: mockStockMovements },
  { table: 'stock_transfers', rows: mockStockTransfers },
  { table: 'stock_adjustments', rows: mockStockAdjustments },
  { table: 'batch_serials', rows: mockBatchSerials },
  { table: 'notifications', rows: mockNotifications }
];

async function main() {
  for (const { table, rows } of seeds) {
    if (!rows || rows.length === 0) {
      console.log(`- ${table}: nothing to seed, skipped`);
      continue;
    }
    const payload = rows.map((row) => ({ id: row.id, data: row }));
    const { error } = await supabase.from(table).upsert(payload);
    if (error) {
      console.error(`✗ ${table}: ${error.message}`);
    } else {
      console.log(`✓ ${table}: ${rows.length} row(s) seeded`);
    }
  }
  console.log('\nDone.');
}

main();
