-- ============================================================================
-- DISTRIBUTOR ERP — FINAL SUPABASE SCHEMA
-- Generated from the actual source in distributor.zip
-- Date: 2026-09-11
--
-- IMPORTANT:
-- The current React/Vite application persists each TypeScript entity through
-- src/lib/db.ts as:
--     id TEXT PRIMARY KEY
--     data JSONB
-- Therefore this schema intentionally keeps the JSONB persistence contract.
-- Replacing these tables with normalized columns would break the current
-- application until src/lib/db.ts and AppContext are rewritten.
--
-- This file is idempotent: it can be run on an existing Supabase project.
-- It creates/repairs all persistence tables actually used by AppContext,
-- enables RLS with policies compatible with the current no-login application,
-- adds useful indexes over fields actually present in the source objects,
-- and provides a verification function.
--
-- Persisted source entities:
-- MASTER:
-- customers, suppliers, products, categories, brands, uoms, price_lists,
-- discount_rules, payment_terms, salespersons, warehouses
--
-- SALES:
-- sales_orders, quotations, deliveries, invoices, payments, receivables
--
-- PURCHASE:
-- purchase_requests, purchase_orders, goods_receipts, purchase_invoices,
-- supplier_payments, payables
--
-- INVENTORY:
-- stock_movements, stock_transfers, stock_adjustments, batch_serials
--
-- SYSTEM:
-- notifications
--
-- Finance/Reports/Settings screens in the current source derive/display data
-- from the persisted entities above; they do NOT call a separate accounts,
-- journal_entries, cash_bank, or settings table through db.ts.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Generic updated_at trigger
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Common JSONB entity table contract
-- ----------------------------------------------------------------------------

create table if not exists public.customers (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brands (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.uoms (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.price_lists (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discount_rules (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_terms (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.salespersons (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.warehouses (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_orders (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotations (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deliveries (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_requests (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_orders (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goods_receipts (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_invoices (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supplier_payments (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.receivables (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payables (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_transfers (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_adjustments (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.batch_serials (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Normalize legacy tables if they existed with the expected columns missing.
-- This does NOT destroy existing data.
-- ----------------------------------------------------------------------------

alter table public.customers
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.customers
  add column if not exists created_at timestamptz not null default now();
alter table public.customers
  add column if not exists updated_at timestamptz not null default now();

alter table public.suppliers
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.suppliers
  add column if not exists created_at timestamptz not null default now();
alter table public.suppliers
  add column if not exists updated_at timestamptz not null default now();

alter table public.products
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.products
  add column if not exists created_at timestamptz not null default now();
alter table public.products
  add column if not exists updated_at timestamptz not null default now();

alter table public.categories
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.categories
  add column if not exists created_at timestamptz not null default now();
alter table public.categories
  add column if not exists updated_at timestamptz not null default now();

alter table public.brands
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.brands
  add column if not exists created_at timestamptz not null default now();
alter table public.brands
  add column if not exists updated_at timestamptz not null default now();

alter table public.uoms
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.uoms
  add column if not exists created_at timestamptz not null default now();
alter table public.uoms
  add column if not exists updated_at timestamptz not null default now();

alter table public.price_lists
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.price_lists
  add column if not exists created_at timestamptz not null default now();
alter table public.price_lists
  add column if not exists updated_at timestamptz not null default now();

alter table public.discount_rules
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.discount_rules
  add column if not exists created_at timestamptz not null default now();
alter table public.discount_rules
  add column if not exists updated_at timestamptz not null default now();

alter table public.payment_terms
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.payment_terms
  add column if not exists created_at timestamptz not null default now();
alter table public.payment_terms
  add column if not exists updated_at timestamptz not null default now();

alter table public.salespersons
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.salespersons
  add column if not exists created_at timestamptz not null default now();
alter table public.salespersons
  add column if not exists updated_at timestamptz not null default now();

alter table public.warehouses
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.warehouses
  add column if not exists created_at timestamptz not null default now();
alter table public.warehouses
  add column if not exists updated_at timestamptz not null default now();

alter table public.sales_orders
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.sales_orders
  add column if not exists created_at timestamptz not null default now();
alter table public.sales_orders
  add column if not exists updated_at timestamptz not null default now();

alter table public.quotations
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.quotations
  add column if not exists created_at timestamptz not null default now();
alter table public.quotations
  add column if not exists updated_at timestamptz not null default now();

alter table public.deliveries
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.deliveries
  add column if not exists created_at timestamptz not null default now();
alter table public.deliveries
  add column if not exists updated_at timestamptz not null default now();

alter table public.invoices
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.invoices
  add column if not exists created_at timestamptz not null default now();
alter table public.invoices
  add column if not exists updated_at timestamptz not null default now();

alter table public.payments
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.payments
  add column if not exists created_at timestamptz not null default now();
alter table public.payments
  add column if not exists updated_at timestamptz not null default now();

alter table public.purchase_requests
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.purchase_requests
  add column if not exists created_at timestamptz not null default now();
alter table public.purchase_requests
  add column if not exists updated_at timestamptz not null default now();

alter table public.purchase_orders
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.purchase_orders
  add column if not exists created_at timestamptz not null default now();
alter table public.purchase_orders
  add column if not exists updated_at timestamptz not null default now();

alter table public.goods_receipts
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.goods_receipts
  add column if not exists created_at timestamptz not null default now();
alter table public.goods_receipts
  add column if not exists updated_at timestamptz not null default now();

alter table public.purchase_invoices
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.purchase_invoices
  add column if not exists created_at timestamptz not null default now();
alter table public.purchase_invoices
  add column if not exists updated_at timestamptz not null default now();

alter table public.supplier_payments
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.supplier_payments
  add column if not exists created_at timestamptz not null default now();
alter table public.supplier_payments
  add column if not exists updated_at timestamptz not null default now();

alter table public.receivables
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.receivables
  add column if not exists created_at timestamptz not null default now();
alter table public.receivables
  add column if not exists updated_at timestamptz not null default now();

alter table public.payables
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.payables
  add column if not exists created_at timestamptz not null default now();
alter table public.payables
  add column if not exists updated_at timestamptz not null default now();

alter table public.stock_movements
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.stock_movements
  add column if not exists created_at timestamptz not null default now();
alter table public.stock_movements
  add column if not exists updated_at timestamptz not null default now();

alter table public.stock_transfers
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.stock_transfers
  add column if not exists created_at timestamptz not null default now();
alter table public.stock_transfers
  add column if not exists updated_at timestamptz not null default now();

alter table public.stock_adjustments
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.stock_adjustments
  add column if not exists created_at timestamptz not null default now();
alter table public.stock_adjustments
  add column if not exists updated_at timestamptz not null default now();

alter table public.batch_serials
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.batch_serials
  add column if not exists created_at timestamptz not null default now();
alter table public.batch_serials
  add column if not exists updated_at timestamptz not null default now();

alter table public.notifications
  add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.notifications
  add column if not exists created_at timestamptz not null default now();
alter table public.notifications
  add column if not exists updated_at timestamptz not null default now();

-- ----------------------------------------------------------------------------
-- Triggers
-- ----------------------------------------------------------------------------

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists trg_suppliers_updated_at on public.suppliers;
create trigger trg_suppliers_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists trg_brands_updated_at on public.brands;
create trigger trg_brands_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

drop trigger if exists trg_uoms_updated_at on public.uoms;
create trigger trg_uoms_updated_at
before update on public.uoms
for each row execute function public.set_updated_at();

drop trigger if exists trg_price_lists_updated_at on public.price_lists;
create trigger trg_price_lists_updated_at
before update on public.price_lists
for each row execute function public.set_updated_at();

drop trigger if exists trg_discount_rules_updated_at on public.discount_rules;
create trigger trg_discount_rules_updated_at
before update on public.discount_rules
for each row execute function public.set_updated_at();

drop trigger if exists trg_payment_terms_updated_at on public.payment_terms;
create trigger trg_payment_terms_updated_at
before update on public.payment_terms
for each row execute function public.set_updated_at();

drop trigger if exists trg_salespersons_updated_at on public.salespersons;
create trigger trg_salespersons_updated_at
before update on public.salespersons
for each row execute function public.set_updated_at();

drop trigger if exists trg_warehouses_updated_at on public.warehouses;
create trigger trg_warehouses_updated_at
before update on public.warehouses
for each row execute function public.set_updated_at();

drop trigger if exists trg_sales_orders_updated_at on public.sales_orders;
create trigger trg_sales_orders_updated_at
before update on public.sales_orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_quotations_updated_at on public.quotations;
create trigger trg_quotations_updated_at
before update on public.quotations
for each row execute function public.set_updated_at();

drop trigger if exists trg_deliveries_updated_at on public.deliveries;
create trigger trg_deliveries_updated_at
before update on public.deliveries
for each row execute function public.set_updated_at();

drop trigger if exists trg_invoices_updated_at on public.invoices;
create trigger trg_invoices_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

drop trigger if exists trg_purchase_requests_updated_at on public.purchase_requests;
create trigger trg_purchase_requests_updated_at
before update on public.purchase_requests
for each row execute function public.set_updated_at();

drop trigger if exists trg_purchase_orders_updated_at on public.purchase_orders;
create trigger trg_purchase_orders_updated_at
before update on public.purchase_orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_goods_receipts_updated_at on public.goods_receipts;
create trigger trg_goods_receipts_updated_at
before update on public.goods_receipts
for each row execute function public.set_updated_at();

drop trigger if exists trg_purchase_invoices_updated_at on public.purchase_invoices;
create trigger trg_purchase_invoices_updated_at
before update on public.purchase_invoices
for each row execute function public.set_updated_at();

drop trigger if exists trg_supplier_payments_updated_at on public.supplier_payments;
create trigger trg_supplier_payments_updated_at
before update on public.supplier_payments
for each row execute function public.set_updated_at();

drop trigger if exists trg_receivables_updated_at on public.receivables;
create trigger trg_receivables_updated_at
before update on public.receivables
for each row execute function public.set_updated_at();

drop trigger if exists trg_payables_updated_at on public.payables;
create trigger trg_payables_updated_at
before update on public.payables
for each row execute function public.set_updated_at();

drop trigger if exists trg_stock_movements_updated_at on public.stock_movements;
create trigger trg_stock_movements_updated_at
before update on public.stock_movements
for each row execute function public.set_updated_at();

drop trigger if exists trg_stock_transfers_updated_at on public.stock_transfers;
create trigger trg_stock_transfers_updated_at
before update on public.stock_transfers
for each row execute function public.set_updated_at();

drop trigger if exists trg_stock_adjustments_updated_at on public.stock_adjustments;
create trigger trg_stock_adjustments_updated_at
before update on public.stock_adjustments
for each row execute function public.set_updated_at();

drop trigger if exists trg_batch_serials_updated_at on public.batch_serials;
create trigger trg_batch_serials_updated_at
before update on public.batch_serials
for each row execute function public.set_updated_at();

drop trigger if exists trg_notifications_updated_at on public.notifications;
create trigger trg_notifications_updated_at
before update on public.notifications
for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS
--
-- The current source has no Supabase Auth login and uses the anon client.
-- Therefore authenticated-only policies would make the existing application
-- unable to save data. These policies preserve current application behavior.
--
-- When Auth/tenant isolation is implemented, replace these policies with
-- auth.uid()/organization_id based policies. Do NOT simply leave public write
-- access in a production multi-user deployment.
-- ----------------------------------------------------------------------------

alter table public.customers enable row level security;

drop policy if exists "distributor_select_customers" on public.customers;
create policy "distributor_select_customers"
on public.customers
for select
using (true);

drop policy if exists "distributor_insert_customers" on public.customers;
create policy "distributor_insert_customers"
on public.customers
for insert
with check (true);

drop policy if exists "distributor_update_customers" on public.customers;
create policy "distributor_update_customers"
on public.customers
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_customers" on public.customers;
create policy "distributor_delete_customers"
on public.customers
for delete
using (true);

alter table public.suppliers enable row level security;

drop policy if exists "distributor_select_suppliers" on public.suppliers;
create policy "distributor_select_suppliers"
on public.suppliers
for select
using (true);

drop policy if exists "distributor_insert_suppliers" on public.suppliers;
create policy "distributor_insert_suppliers"
on public.suppliers
for insert
with check (true);

drop policy if exists "distributor_update_suppliers" on public.suppliers;
create policy "distributor_update_suppliers"
on public.suppliers
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_suppliers" on public.suppliers;
create policy "distributor_delete_suppliers"
on public.suppliers
for delete
using (true);

alter table public.products enable row level security;

drop policy if exists "distributor_select_products" on public.products;
create policy "distributor_select_products"
on public.products
for select
using (true);

drop policy if exists "distributor_insert_products" on public.products;
create policy "distributor_insert_products"
on public.products
for insert
with check (true);

drop policy if exists "distributor_update_products" on public.products;
create policy "distributor_update_products"
on public.products
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_products" on public.products;
create policy "distributor_delete_products"
on public.products
for delete
using (true);

alter table public.categories enable row level security;

drop policy if exists "distributor_select_categories" on public.categories;
create policy "distributor_select_categories"
on public.categories
for select
using (true);

drop policy if exists "distributor_insert_categories" on public.categories;
create policy "distributor_insert_categories"
on public.categories
for insert
with check (true);

drop policy if exists "distributor_update_categories" on public.categories;
create policy "distributor_update_categories"
on public.categories
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_categories" on public.categories;
create policy "distributor_delete_categories"
on public.categories
for delete
using (true);

alter table public.brands enable row level security;

drop policy if exists "distributor_select_brands" on public.brands;
create policy "distributor_select_brands"
on public.brands
for select
using (true);

drop policy if exists "distributor_insert_brands" on public.brands;
create policy "distributor_insert_brands"
on public.brands
for insert
with check (true);

drop policy if exists "distributor_update_brands" on public.brands;
create policy "distributor_update_brands"
on public.brands
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_brands" on public.brands;
create policy "distributor_delete_brands"
on public.brands
for delete
using (true);

alter table public.uoms enable row level security;

drop policy if exists "distributor_select_uoms" on public.uoms;
create policy "distributor_select_uoms"
on public.uoms
for select
using (true);

drop policy if exists "distributor_insert_uoms" on public.uoms;
create policy "distributor_insert_uoms"
on public.uoms
for insert
with check (true);

drop policy if exists "distributor_update_uoms" on public.uoms;
create policy "distributor_update_uoms"
on public.uoms
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_uoms" on public.uoms;
create policy "distributor_delete_uoms"
on public.uoms
for delete
using (true);

alter table public.price_lists enable row level security;

drop policy if exists "distributor_select_price_lists" on public.price_lists;
create policy "distributor_select_price_lists"
on public.price_lists
for select
using (true);

drop policy if exists "distributor_insert_price_lists" on public.price_lists;
create policy "distributor_insert_price_lists"
on public.price_lists
for insert
with check (true);

drop policy if exists "distributor_update_price_lists" on public.price_lists;
create policy "distributor_update_price_lists"
on public.price_lists
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_price_lists" on public.price_lists;
create policy "distributor_delete_price_lists"
on public.price_lists
for delete
using (true);

alter table public.discount_rules enable row level security;

drop policy if exists "distributor_select_discount_rules" on public.discount_rules;
create policy "distributor_select_discount_rules"
on public.discount_rules
for select
using (true);

drop policy if exists "distributor_insert_discount_rules" on public.discount_rules;
create policy "distributor_insert_discount_rules"
on public.discount_rules
for insert
with check (true);

drop policy if exists "distributor_update_discount_rules" on public.discount_rules;
create policy "distributor_update_discount_rules"
on public.discount_rules
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_discount_rules" on public.discount_rules;
create policy "distributor_delete_discount_rules"
on public.discount_rules
for delete
using (true);

alter table public.payment_terms enable row level security;

drop policy if exists "distributor_select_payment_terms" on public.payment_terms;
create policy "distributor_select_payment_terms"
on public.payment_terms
for select
using (true);

drop policy if exists "distributor_insert_payment_terms" on public.payment_terms;
create policy "distributor_insert_payment_terms"
on public.payment_terms
for insert
with check (true);

drop policy if exists "distributor_update_payment_terms" on public.payment_terms;
create policy "distributor_update_payment_terms"
on public.payment_terms
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_payment_terms" on public.payment_terms;
create policy "distributor_delete_payment_terms"
on public.payment_terms
for delete
using (true);

alter table public.salespersons enable row level security;

drop policy if exists "distributor_select_salespersons" on public.salespersons;
create policy "distributor_select_salespersons"
on public.salespersons
for select
using (true);

drop policy if exists "distributor_insert_salespersons" on public.salespersons;
create policy "distributor_insert_salespersons"
on public.salespersons
for insert
with check (true);

drop policy if exists "distributor_update_salespersons" on public.salespersons;
create policy "distributor_update_salespersons"
on public.salespersons
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_salespersons" on public.salespersons;
create policy "distributor_delete_salespersons"
on public.salespersons
for delete
using (true);

alter table public.warehouses enable row level security;

drop policy if exists "distributor_select_warehouses" on public.warehouses;
create policy "distributor_select_warehouses"
on public.warehouses
for select
using (true);

drop policy if exists "distributor_insert_warehouses" on public.warehouses;
create policy "distributor_insert_warehouses"
on public.warehouses
for insert
with check (true);

drop policy if exists "distributor_update_warehouses" on public.warehouses;
create policy "distributor_update_warehouses"
on public.warehouses
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_warehouses" on public.warehouses;
create policy "distributor_delete_warehouses"
on public.warehouses
for delete
using (true);

alter table public.sales_orders enable row level security;

drop policy if exists "distributor_select_sales_orders" on public.sales_orders;
create policy "distributor_select_sales_orders"
on public.sales_orders
for select
using (true);

drop policy if exists "distributor_insert_sales_orders" on public.sales_orders;
create policy "distributor_insert_sales_orders"
on public.sales_orders
for insert
with check (true);

drop policy if exists "distributor_update_sales_orders" on public.sales_orders;
create policy "distributor_update_sales_orders"
on public.sales_orders
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_sales_orders" on public.sales_orders;
create policy "distributor_delete_sales_orders"
on public.sales_orders
for delete
using (true);

alter table public.quotations enable row level security;

drop policy if exists "distributor_select_quotations" on public.quotations;
create policy "distributor_select_quotations"
on public.quotations
for select
using (true);

drop policy if exists "distributor_insert_quotations" on public.quotations;
create policy "distributor_insert_quotations"
on public.quotations
for insert
with check (true);

drop policy if exists "distributor_update_quotations" on public.quotations;
create policy "distributor_update_quotations"
on public.quotations
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_quotations" on public.quotations;
create policy "distributor_delete_quotations"
on public.quotations
for delete
using (true);

alter table public.deliveries enable row level security;

drop policy if exists "distributor_select_deliveries" on public.deliveries;
create policy "distributor_select_deliveries"
on public.deliveries
for select
using (true);

drop policy if exists "distributor_insert_deliveries" on public.deliveries;
create policy "distributor_insert_deliveries"
on public.deliveries
for insert
with check (true);

drop policy if exists "distributor_update_deliveries" on public.deliveries;
create policy "distributor_update_deliveries"
on public.deliveries
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_deliveries" on public.deliveries;
create policy "distributor_delete_deliveries"
on public.deliveries
for delete
using (true);

alter table public.invoices enable row level security;

drop policy if exists "distributor_select_invoices" on public.invoices;
create policy "distributor_select_invoices"
on public.invoices
for select
using (true);

drop policy if exists "distributor_insert_invoices" on public.invoices;
create policy "distributor_insert_invoices"
on public.invoices
for insert
with check (true);

drop policy if exists "distributor_update_invoices" on public.invoices;
create policy "distributor_update_invoices"
on public.invoices
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_invoices" on public.invoices;
create policy "distributor_delete_invoices"
on public.invoices
for delete
using (true);

alter table public.payments enable row level security;

drop policy if exists "distributor_select_payments" on public.payments;
create policy "distributor_select_payments"
on public.payments
for select
using (true);

drop policy if exists "distributor_insert_payments" on public.payments;
create policy "distributor_insert_payments"
on public.payments
for insert
with check (true);

drop policy if exists "distributor_update_payments" on public.payments;
create policy "distributor_update_payments"
on public.payments
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_payments" on public.payments;
create policy "distributor_delete_payments"
on public.payments
for delete
using (true);

alter table public.purchase_requests enable row level security;

drop policy if exists "distributor_select_purchase_requests" on public.purchase_requests;
create policy "distributor_select_purchase_requests"
on public.purchase_requests
for select
using (true);

drop policy if exists "distributor_insert_purchase_requests" on public.purchase_requests;
create policy "distributor_insert_purchase_requests"
on public.purchase_requests
for insert
with check (true);

drop policy if exists "distributor_update_purchase_requests" on public.purchase_requests;
create policy "distributor_update_purchase_requests"
on public.purchase_requests
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_purchase_requests" on public.purchase_requests;
create policy "distributor_delete_purchase_requests"
on public.purchase_requests
for delete
using (true);

alter table public.purchase_orders enable row level security;

drop policy if exists "distributor_select_purchase_orders" on public.purchase_orders;
create policy "distributor_select_purchase_orders"
on public.purchase_orders
for select
using (true);

drop policy if exists "distributor_insert_purchase_orders" on public.purchase_orders;
create policy "distributor_insert_purchase_orders"
on public.purchase_orders
for insert
with check (true);

drop policy if exists "distributor_update_purchase_orders" on public.purchase_orders;
create policy "distributor_update_purchase_orders"
on public.purchase_orders
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_purchase_orders" on public.purchase_orders;
create policy "distributor_delete_purchase_orders"
on public.purchase_orders
for delete
using (true);

alter table public.goods_receipts enable row level security;

drop policy if exists "distributor_select_goods_receipts" on public.goods_receipts;
create policy "distributor_select_goods_receipts"
on public.goods_receipts
for select
using (true);

drop policy if exists "distributor_insert_goods_receipts" on public.goods_receipts;
create policy "distributor_insert_goods_receipts"
on public.goods_receipts
for insert
with check (true);

drop policy if exists "distributor_update_goods_receipts" on public.goods_receipts;
create policy "distributor_update_goods_receipts"
on public.goods_receipts
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_goods_receipts" on public.goods_receipts;
create policy "distributor_delete_goods_receipts"
on public.goods_receipts
for delete
using (true);

alter table public.purchase_invoices enable row level security;

drop policy if exists "distributor_select_purchase_invoices" on public.purchase_invoices;
create policy "distributor_select_purchase_invoices"
on public.purchase_invoices
for select
using (true);

drop policy if exists "distributor_insert_purchase_invoices" on public.purchase_invoices;
create policy "distributor_insert_purchase_invoices"
on public.purchase_invoices
for insert
with check (true);

drop policy if exists "distributor_update_purchase_invoices" on public.purchase_invoices;
create policy "distributor_update_purchase_invoices"
on public.purchase_invoices
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_purchase_invoices" on public.purchase_invoices;
create policy "distributor_delete_purchase_invoices"
on public.purchase_invoices
for delete
using (true);

alter table public.supplier_payments enable row level security;

drop policy if exists "distributor_select_supplier_payments" on public.supplier_payments;
create policy "distributor_select_supplier_payments"
on public.supplier_payments
for select
using (true);

drop policy if exists "distributor_insert_supplier_payments" on public.supplier_payments;
create policy "distributor_insert_supplier_payments"
on public.supplier_payments
for insert
with check (true);

drop policy if exists "distributor_update_supplier_payments" on public.supplier_payments;
create policy "distributor_update_supplier_payments"
on public.supplier_payments
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_supplier_payments" on public.supplier_payments;
create policy "distributor_delete_supplier_payments"
on public.supplier_payments
for delete
using (true);

alter table public.receivables enable row level security;

drop policy if exists "distributor_select_receivables" on public.receivables;
create policy "distributor_select_receivables"
on public.receivables
for select
using (true);

drop policy if exists "distributor_insert_receivables" on public.receivables;
create policy "distributor_insert_receivables"
on public.receivables
for insert
with check (true);

drop policy if exists "distributor_update_receivables" on public.receivables;
create policy "distributor_update_receivables"
on public.receivables
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_receivables" on public.receivables;
create policy "distributor_delete_receivables"
on public.receivables
for delete
using (true);

alter table public.payables enable row level security;

drop policy if exists "distributor_select_payables" on public.payables;
create policy "distributor_select_payables"
on public.payables
for select
using (true);

drop policy if exists "distributor_insert_payables" on public.payables;
create policy "distributor_insert_payables"
on public.payables
for insert
with check (true);

drop policy if exists "distributor_update_payables" on public.payables;
create policy "distributor_update_payables"
on public.payables
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_payables" on public.payables;
create policy "distributor_delete_payables"
on public.payables
for delete
using (true);

alter table public.stock_movements enable row level security;

drop policy if exists "distributor_select_stock_movements" on public.stock_movements;
create policy "distributor_select_stock_movements"
on public.stock_movements
for select
using (true);

drop policy if exists "distributor_insert_stock_movements" on public.stock_movements;
create policy "distributor_insert_stock_movements"
on public.stock_movements
for insert
with check (true);

drop policy if exists "distributor_update_stock_movements" on public.stock_movements;
create policy "distributor_update_stock_movements"
on public.stock_movements
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_stock_movements" on public.stock_movements;
create policy "distributor_delete_stock_movements"
on public.stock_movements
for delete
using (true);

alter table public.stock_transfers enable row level security;

drop policy if exists "distributor_select_stock_transfers" on public.stock_transfers;
create policy "distributor_select_stock_transfers"
on public.stock_transfers
for select
using (true);

drop policy if exists "distributor_insert_stock_transfers" on public.stock_transfers;
create policy "distributor_insert_stock_transfers"
on public.stock_transfers
for insert
with check (true);

drop policy if exists "distributor_update_stock_transfers" on public.stock_transfers;
create policy "distributor_update_stock_transfers"
on public.stock_transfers
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_stock_transfers" on public.stock_transfers;
create policy "distributor_delete_stock_transfers"
on public.stock_transfers
for delete
using (true);

alter table public.stock_adjustments enable row level security;

drop policy if exists "distributor_select_stock_adjustments" on public.stock_adjustments;
create policy "distributor_select_stock_adjustments"
on public.stock_adjustments
for select
using (true);

drop policy if exists "distributor_insert_stock_adjustments" on public.stock_adjustments;
create policy "distributor_insert_stock_adjustments"
on public.stock_adjustments
for insert
with check (true);

drop policy if exists "distributor_update_stock_adjustments" on public.stock_adjustments;
create policy "distributor_update_stock_adjustments"
on public.stock_adjustments
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_stock_adjustments" on public.stock_adjustments;
create policy "distributor_delete_stock_adjustments"
on public.stock_adjustments
for delete
using (true);

alter table public.batch_serials enable row level security;

drop policy if exists "distributor_select_batch_serials" on public.batch_serials;
create policy "distributor_select_batch_serials"
on public.batch_serials
for select
using (true);

drop policy if exists "distributor_insert_batch_serials" on public.batch_serials;
create policy "distributor_insert_batch_serials"
on public.batch_serials
for insert
with check (true);

drop policy if exists "distributor_update_batch_serials" on public.batch_serials;
create policy "distributor_update_batch_serials"
on public.batch_serials
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_batch_serials" on public.batch_serials;
create policy "distributor_delete_batch_serials"
on public.batch_serials
for delete
using (true);

alter table public.notifications enable row level security;

drop policy if exists "distributor_select_notifications" on public.notifications;
create policy "distributor_select_notifications"
on public.notifications
for select
using (true);

drop policy if exists "distributor_insert_notifications" on public.notifications;
create policy "distributor_insert_notifications"
on public.notifications
for insert
with check (true);

drop policy if exists "distributor_update_notifications" on public.notifications;
create policy "distributor_update_notifications"
on public.notifications
for update
using (true)
with check (true);

drop policy if exists "distributor_delete_notifications" on public.notifications;
create policy "distributor_delete_notifications"
on public.notifications
for delete
using (true);

-- ----------------------------------------------------------------------------
-- Indexes matching fields actually used by the source UI.
-- JSONB remains the source of truth; these indexes only accelerate filtering.
-- ----------------------------------------------------------------------------

create index if not exists idx_customers_code
  on public.customers ((data->>'code'));
create index if not exists idx_customers_salesperson
  on public.customers ((data->>'salespersonId'));
create index if not exists idx_customers_status
  on public.customers ((data->>'status'));

create index if not exists idx_suppliers_code
  on public.suppliers ((data->>'code'));
create index if not exists idx_suppliers_status
  on public.suppliers ((data->>'status'));

create index if not exists idx_products_code
  on public.products ((data->>'code'));
create index if not exists idx_products_sku
  on public.products ((data->>'sku'));
create index if not exists idx_products_barcode
  on public.products ((data->>'barcode'));
create index if not exists idx_products_category
  on public.products ((data->>'category'));
create index if not exists idx_products_brand
  on public.products ((data->>'brand'));
create index if not exists idx_products_warehouse
  on public.products ((data->>'warehouseId'));
create index if not exists idx_products_status
  on public.products ((data->>'status'));

create index if not exists idx_categories_code
  on public.categories ((data->>'code'));
create index if not exists idx_brands_code
  on public.brands ((data->>'code'));
create index if not exists idx_uoms_code
  on public.uoms ((data->>'code'));

create index if not exists idx_price_lists_code
  on public.price_lists ((data->>'code'));
create index if not exists idx_discount_rules_code
  on public.discount_rules ((data->>'code'));
create index if not exists idx_payment_terms_code
  on public.payment_terms ((data->>'code'));
create index if not exists idx_salespersons_code
  on public.salespersons ((data->>'code'));
create index if not exists idx_warehouses_code
  on public.warehouses ((data->>'code'));

create index if not exists idx_sales_orders_code
  on public.sales_orders ((data->>'code'));
create index if not exists idx_sales_orders_customer
  on public.sales_orders ((data->>'customerId'));
create index if not exists idx_sales_orders_status
  on public.sales_orders ((data->>'status'));
create index if not exists idx_sales_orders_payment_status
  on public.sales_orders ((data->>'paymentStatus'));
create index if not exists idx_sales_orders_delivery_status
  on public.sales_orders ((data->>'deliveryStatus'));
create index if not exists idx_sales_orders_date
  on public.sales_orders ((data->>'date'));

create index if not exists idx_quotations_code
  on public.quotations ((data->>'code'));
create index if not exists idx_quotations_customer
  on public.quotations ((data->>'customerId'));
create index if not exists idx_quotations_status
  on public.quotations ((data->>'status'));

create index if not exists idx_deliveries_code
  on public.deliveries ((data->>'code'));
create index if not exists idx_deliveries_so_code
  on public.deliveries ((data->>'soCode'));
create index if not exists idx_deliveries_customer
  on public.deliveries ((data->>'customerId'));
create index if not exists idx_deliveries_status
  on public.deliveries ((data->>'status'));
create index if not exists idx_deliveries_date
  on public.deliveries ((data->>'date'));

create index if not exists idx_invoices_code
  on public.invoices ((data->>'code'));
create index if not exists idx_invoices_so_code
  on public.invoices ((data->>'soCode'));
create index if not exists idx_invoices_sj_code
  on public.invoices ((data->>'sjCode'));
create index if not exists idx_invoices_customer
  on public.invoices ((data->>'customerId'));
create index if not exists idx_invoices_payment_status
  on public.invoices ((data->>'paymentStatus'));

create index if not exists idx_payments_code
  on public.payments ((data->>'code'));
create index if not exists idx_payments_invoice
  on public.payments ((data->>'invoiceNo'));
create index if not exists idx_payments_customer
  on public.payments ((data->>'customerId'));
create index if not exists idx_payments_date
  on public.payments ((data->>'date'));

create index if not exists idx_receivables_invoice
  on public.receivables ((data->>'invoiceNo'));
create index if not exists idx_receivables_customer
  on public.receivables ((data->>'customerId'));
create index if not exists idx_receivables_status
  on public.receivables ((data->>'status'));
create index if not exists idx_receivables_due_date
  on public.receivables ((data->>'dueDate'));

create index if not exists idx_purchase_requests_code
  on public.purchase_requests ((data->>'code'));
create index if not exists idx_purchase_requests_status
  on public.purchase_requests ((data->>'status'));

create index if not exists idx_purchase_orders_code
  on public.purchase_orders ((data->>'code'));
create index if not exists idx_purchase_orders_supplier
  on public.purchase_orders ((data->>'supplierId'));
create index if not exists idx_purchase_orders_status
  on public.purchase_orders ((data->>'status'));
create index if not exists idx_purchase_orders_payment_status
  on public.purchase_orders ((data->>'paymentStatus'));

create index if not exists idx_goods_receipts_code
  on public.goods_receipts ((data->>'code'));
create index if not exists idx_goods_receipts_po_code
  on public.goods_receipts ((data->>'poCode'));
create index if not exists idx_goods_receipts_status
  on public.goods_receipts ((data->>'status'));

create index if not exists idx_purchase_invoices_code
  on public.purchase_invoices ((data->>'code'));
create index if not exists idx_purchase_invoices_po_code
  on public.purchase_invoices ((data->>'poCode'));
create index if not exists idx_purchase_invoices_supplier
  on public.purchase_invoices ((data->>'supplierId'));
create index if not exists idx_purchase_invoices_payment_status
  on public.purchase_invoices ((data->>'paymentStatus'));

create index if not exists idx_supplier_payments_code
  on public.supplier_payments ((data->>'paymentNumber'));
create index if not exists idx_supplier_payments_invoice
  on public.supplier_payments ((data->>'invoice'));
create index if not exists idx_supplier_payments_supplier
  on public.supplier_payments ((data->>'supplierId'));

create index if not exists idx_payables_invoice
  on public.payables ((data->>'invoiceNo'));
create index if not exists idx_payables_supplier
  on public.payables ((data->>'supplierId'));
create index if not exists idx_payables_status
  on public.payables ((data->>'status'));
create index if not exists idx_payables_due_date
  on public.payables ((data->>'dueDate'));

create index if not exists idx_stock_movements_product
  on public.stock_movements ((data->>'productCode'));
create index if not exists idx_stock_movements_product_id
  on public.stock_movements ((data->>'productId'));
create index if not exists idx_stock_movements_document
  on public.stock_movements ((data->>'documentNo'));
create index if not exists idx_stock_movements_reference
  on public.stock_movements ((data->>'referenceNo'));
create index if not exists idx_stock_movements_warehouse
  on public.stock_movements ((data->>'warehouseId'));
create index if not exists idx_stock_movements_date
  on public.stock_movements ((data->>'date'));

create index if not exists idx_stock_transfers_no
  on public.stock_transfers ((data->>'transferNo'));
create index if not exists idx_stock_transfers_from_warehouse
  on public.stock_transfers ((data->>'fromWarehouseId'));
create index if not exists idx_stock_transfers_to_warehouse
  on public.stock_transfers ((data->>'toWarehouseId'));
create index if not exists idx_stock_transfers_status
  on public.stock_transfers ((data->>'status'));

create index if not exists idx_stock_adjustments_no
  on public.stock_adjustments ((data->>'adjustmentNo'));
create index if not exists idx_stock_adjustments_product
  on public.stock_adjustments ((data->>'productId'));
create index if not exists idx_stock_adjustments_warehouse
  on public.stock_adjustments ((data->>'warehouseId'));
create index if not exists idx_stock_adjustments_date
  on public.stock_adjustments ((data->>'date'));

create index if not exists idx_batch_serials_product
  on public.batch_serials ((data->>'productId'));
create index if not exists idx_batch_serials_batch
  on public.batch_serials ((data->>'batchNumber'));
create index if not exists idx_batch_serials_serial
  on public.batch_serials ((data->>'serialNumber'));
create index if not exists idx_batch_serials_expiry
  on public.batch_serials ((data->>'expiryDate'));
create index if not exists idx_batch_serials_status
  on public.batch_serials ((data->>'status'));

create index if not exists idx_notifications_read
  on public.notifications ((data->>'read'));

-- Generic GIN indexes for searches over nested item/discount/activity arrays.
create index if not exists idx_sales_orders_data_gin
  on public.sales_orders using gin (data);
create index if not exists idx_quotations_data_gin
  on public.quotations using gin (data);
create index if not exists idx_deliveries_data_gin
  on public.deliveries using gin (data);
create index if not exists idx_invoices_data_gin
  on public.invoices using gin (data);
create index if not exists idx_purchase_orders_data_gin
  on public.purchase_orders using gin (data);
create index if not exists idx_goods_receipts_data_gin
  on public.goods_receipts using gin (data);
create index if not exists idx_purchase_invoices_data_gin
  on public.purchase_invoices using gin (data);
create index if not exists idx_stock_transfers_data_gin
  on public.stock_transfers using gin (data);

-- ----------------------------------------------------------------------------
-- Schema verification
--
-- Run:
--   select * from public.verify_distributor_schema();
--
-- Expected: every table has exists = true and compatible = true.
-- ----------------------------------------------------------------------------

create or replace function public.verify_distributor_schema()
returns table (
  table_name text,
  exists_ok boolean,
  has_id boolean,
  has_data boolean,
  has_created_at boolean,
  has_updated_at boolean,
  compatible boolean
)
language sql
security definer
set search_path = public
as $$
  with expected(table_name) as (
    values
      ('customers'), ('suppliers'), ('products'), ('categories'), ('brands'),
      ('uoms'), ('price_lists'), ('discount_rules'), ('payment_terms'),
      ('salespersons'), ('warehouses'), ('sales_orders'), ('quotations'),
      ('deliveries'), ('invoices'), ('payments'), ('purchase_requests'),
      ('purchase_orders'), ('goods_receipts'), ('purchase_invoices'),
      ('supplier_payments'), ('receivables'), ('payables'), ('stock_movements'),
      ('stock_transfers'), ('stock_adjustments'), ('batch_serials'),
      ('notifications')
  ),
  cols as (
    select
      c.table_name,
      bool_or(c.column_name = 'id') as has_id,
      bool_or(c.column_name = 'data') as has_data,
      bool_or(c.column_name = 'created_at') as has_created_at,
      bool_or(c.column_name = 'updated_at') as has_updated_at
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name in (select table_name from expected)
    group by c.table_name
  )
  select
    e.table_name,
    (c.table_name is not null) as exists_ok,
    coalesce(c.has_id, false),
    coalesce(c.has_data, false),
    coalesce(c.has_created_at, false),
    coalesce(c.has_updated_at, false),
    coalesce(c.has_id and c.has_data and c.has_created_at and c.has_updated_at, false)
  from expected e
  left join cols c using (table_name)
  order by e.table_name;
$$;

-- ----------------------------------------------------------------------------
-- Final sanity check / documentation
-- ----------------------------------------------------------------------------

comment on function public.verify_distributor_schema() is
'Verifies the persistence schema required by the Distributor ERP source.';

