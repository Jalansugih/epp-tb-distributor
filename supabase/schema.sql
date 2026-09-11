-- ============================================================================
-- Distributor ERP — Supabase schema
-- ============================================================================
-- Design choice: each business entity is stored as ONE row with its full
-- object kept in a JSONB `data` column, keyed by the same `id` the app
-- already generates client-side (e.g. "cust-1", "so-1712345678").
--
-- Why: the app's ~30 entities (SalesOrder, PurchaseInvoice, StockMovement,
-- etc.) already carry their nested arrays (items, discounts, activities) as
-- plain objects in TypeScript. Mirroring that as JSONB means the front end
-- can persist/read the exact same shape it already works with, with no
-- object/relational mapping layer to write and keep in sync. It also means
-- the whole schema fits in one migration instead of ~15 join tables.
--
-- Trade-off: you lose SQL-level joins/aggregation on nested fields (e.g. you
-- can't easily "SUM item.qty across all sales_orders" in plain SQL). Today
-- every report in this app is already computed in the browser from the full
-- arrays, so that isn't a regression — but if you later want server-side
-- reporting or multi-app access to this data, normalizing the hot tables
-- (sales_orders, products, customers first) is the natural next step.
-- ============================================================================

create extension if not exists "pgcrypto";

-- Generic "updated_at" trigger, reused by every table below.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- Table generator: run once per entity. `id` is TEXT (not uuid) because the
-- app already mints its own ids (e.g. `cust-${Date.now()}`) — keeping TEXT
-- avoids rewriting every id-generation call site in the app.
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'customers', 'suppliers', 'products', 'categories', 'brands', 'uoms',
    'price_lists', 'discount_rules', 'payment_terms', 'salespersons',
    'warehouses', 'sales_orders', 'quotations', 'deliveries', 'invoices',
    'payments', 'purchase_requests', 'purchase_orders', 'goods_receipts',
    'purchase_invoices', 'supplier_payments', 'receivables', 'payables',
    'stock_movements', 'stock_transfers', 'stock_adjustments',
    'batch_serials', 'notifications'
  ];
begin
  foreach t in array tables loop
    execute format($f$
      create table if not exists %I (
        id text primary key,
        data jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    $f$, t);

    execute format($f$
      drop trigger if exists trg_%1$s_updated_at on %1$I;
      create trigger trg_%1$s_updated_at
      before update on %1$I
      for each row execute function set_updated_at();
    $f$, t);

    execute format('alter table %I enable row level security;', t);

    -- Permissive policy: this app has no login screen yet, so every request
    -- goes through the Supabase anon key. If you add Supabase Auth later,
    -- tighten these to `using (auth.uid() is not null)` per table.
    execute format($f$
      drop policy if exists "allow_all_%1$s" on %1$I;
      create policy "allow_all_%1$s" on %1$I
        for all using (true) with check (true);
    $f$, t);
  end loop;
end $$;

-- Helpful indexes for the fields the UI actually filters/sorts by.
create index if not exists idx_sales_orders_customer on sales_orders ((data->>'customerId'));
create index if not exists idx_sales_orders_status on sales_orders ((data->>'status'));
create index if not exists idx_purchase_orders_supplier on purchase_orders ((data->>'supplierId'));
create index if not exists idx_products_code on products ((data->>'code'));
create index if not exists idx_receivables_status on receivables ((data->>'status'));
create index if not exists idx_payables_status on payables ((data->>'status'));
create index if not exists idx_stock_movements_product on stock_movements ((data->>'productCode'));

-- ============================================================================
-- Done. Next steps:
--   1. Run this whole file once in the Supabase project's SQL editor.
--   2. Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in your .env (see
--      .env.example) and in your hosting provider's env settings.
--   3. Run `npm run seed` once to load the app's starter data into these
--      tables (see scripts/seed.ts) — optional, only if you want the demo
--      data instead of starting empty.
-- ============================================================================
