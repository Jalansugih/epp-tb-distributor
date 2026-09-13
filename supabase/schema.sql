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
    'batch_serials', 'notifications', 'system_settings'
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

    -- Remove any policy created by an older version of this schema, then
    -- enforce authenticated-only CRUD for the current application.
    for pol in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on %I;', pol.policyname, t);
    end loop;

    execute format($f$
      create policy "allow_authenticated_%1$s" on %1$I
        for all to authenticated
        using (auth.role() = 'authenticated')
        with check (auth.role() = 'authenticated');
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
-- ROLE / ACTIVE USER ENFORCEMENT
-- ============================================================================
-- The UI is not a security boundary. These helpers are SECURITY DEFINER so
-- table policies can safely consult profiles without exposing profile writes.
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and active = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and active = true and lower(role) = 'admin'
  );
$$;

revoke all on function public.is_active_user() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.is_admin() to authenticated;

do $$
declare
  t text;
  master_tables text[] := array[
    'customers','suppliers','products','categories','brands','uoms',
    'price_lists','discount_rules','payment_terms','salespersons','warehouses'
  ];
  all_tables text[] := array[
    'customers','suppliers','products','categories','brands','uoms',
    'price_lists','discount_rules','payment_terms','salespersons','warehouses',
    'sales_orders','quotations','deliveries','invoices','payments',
    'purchase_requests','purchase_orders','goods_receipts','purchase_invoices',
    'supplier_payments','receivables','payables','stock_movements',
    'stock_transfers','stock_adjustments','batch_serials','notifications',
    'system_settings'
  ];
begin
  foreach t in array all_tables loop
    execute format('drop policy if exists "allow_authenticated_%1$s" on %1$I;', t);
    execute format('drop policy if exists "active_%1$s_select" on %1$I;', t);
    execute format('drop policy if exists "active_%1$s_insert" on %1$I;', t);
    execute format('drop policy if exists "active_%1$s_update" on %1$I;', t);
    execute format('drop policy if exists "admin_%1$s_delete" on %1$I;', t);
    execute format($f$
      create policy "active_%1$s_select" on %1$I
        for select to authenticated
        using (public.is_active_user());
    $f$, t);
    if t = any(master_tables) then
      execute format($f$
        create policy "active_%1$s_insert" on %1$I
          for insert to authenticated
          with check (public.is_admin());
        create policy "active_%1$s_update" on %1$I
          for update to authenticated
          using (public.is_admin())
          with check (public.is_admin());
      $f$, t);
    else
      execute format($f$
        create policy "active_%1$s_insert" on %1$I
          for insert to authenticated
          with check (public.is_active_user());
        create policy "active_%1$s_update" on %1$I
          for update to authenticated
          using (public.is_active_user())
          with check (public.is_active_user());
      $f$, t);
    end if;
    execute format($f$
      create policy "admin_%1$s_delete" on %1$I
        for delete to authenticated
        using (public.is_admin());
    $f$, t);
  end loop;
end $$;

-- Settings are company-wide configuration and therefore Admin-only for writes.
drop policy if exists "active_system_settings_insert" on public.system_settings;
drop policy if exists "active_system_settings_update" on public.system_settings;
create policy "active_system_settings_insert" on public.system_settings
for insert to authenticated with check (public.is_admin());
create policy "active_system_settings_update" on public.system_settings
for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Profiles remain self-readable; administrators can maintain role/status.
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================================
-- Done. Next steps:
--   1. Run this whole file once in the Supabase project's SQL editor.
--   2. In Supabase Authentication > Users, create the first user account.
--   3. Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in your .env and in
--      your hosting provider's env settings.
--   4. The application now requires an authenticated user before showing
--      the ERP shell. `npm run seed` is optional and must be run with a
--      service-role/server-side setup if RLS blocks anon writes.
-- ============================================================================


-- ============================================================================
-- AUTHENTICATION / PROFILES
-- ============================================================================
-- Supabase Auth owns credentials in auth.users. public.profiles stores only
-- application-facing identity/role/status. Users are created in Supabase
-- Authentication; no password is stored in this table.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  role text not null default 'User',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_email on public.profiles (lower(email));
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_active on public.profiles (active);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, active)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'User'),
    true
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_profile_updated_at();

alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select to authenticated
using (id = auth.uid());

-- Role and active status are administrative fields. Do not expose UPDATE
-- permission to normal client sessions; manage them from a trusted admin path.
drop policy if exists "profiles_update_own" on public.profiles;

-- Backfill profiles for users that already existed before this script.
insert into public.profiles (id, email, full_name, role, active)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data->>'full_name', split_part(coalesce(u.email, ''), '@', 1)),
  coalesce(u.raw_user_meta_data->>'role', 'User'),
  true
from auth.users u
on conflict (id) do update set
  email = excluded.email,
  updated_at = now();


-- ============================================================================
-- ACCOUNTING ENGINE
-- One company / shared dataset. Journal data is normalized so financial
-- reports never depend on hardcoded numbers in the UI.
-- ============================================================================

create table if not exists public.accounting_accounts (
  code text primary key,
  name text not null,
  type text not null check (type in ('Asset','Liability','Equity','Revenue','Expense')),
  normal_balance text not null check (normal_balance in ('debit','credit')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.accounting_accounts (code,name,type,normal_balance) values
('1101','Kas','Asset','debit'),
('1102','Bank','Asset','debit'),
('1201','Piutang Usaha','Asset','debit'),
('1301','Persediaan Barang Dagang','Asset','debit'),
('1401','Pajak Masukan','Asset','debit'),
('2101','Hutang Usaha','Liability','credit'),
('2201','Pajak Keluaran','Liability','credit'),
('3101','Modal / Ekuitas','Equity','credit'),
('3201','Laba Ditahan','Equity','credit'),
('4101','Penjualan','Revenue','credit'),
('4102','Retur / Potongan Penjualan','Revenue','debit'),
('5101','Harga Pokok Penjualan','Expense','debit'),
('6101','Beban Operasional','Expense','debit'),
('6201','Beban Pengiriman','Expense','debit'),
('6301','Beban Komisi Penjualan','Expense','debit')
on conflict (code) do update set
  name = excluded.name,
  type = excluded.type,
  normal_balance = excluded.normal_balance,
  updated_at = now();

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  voucher_no text not null unique,
  date date not null,
  description text not null,
  reference_type text,
  reference_id text,
  reference_no text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(reference_type, reference_id)
);

create table if not exists public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references public.journal_entries(id) on delete cascade,
  account_code text not null references public.accounting_accounts(code),
  account_name text not null,
  debit numeric(18,2) not null default 0 check (debit >= 0),
  credit numeric(18,2) not null default 0 check (credit >= 0),
  created_at timestamptz not null default now(),
  check ((debit = 0 and credit > 0) or (credit = 0 and debit > 0))
);

create index if not exists idx_journal_entries_date on public.journal_entries(date);
create index if not exists idx_journal_entries_reference on public.journal_entries(reference_type, reference_id);
create index if not exists idx_journal_lines_entry on public.journal_lines(journal_entry_id);
create index if not exists idx_journal_lines_account on public.journal_lines(account_code);

alter table public.accounting_accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines enable row level security;

drop policy if exists "accounting_accounts_authenticated_read" on public.accounting_accounts;
create policy "accounting_accounts_authenticated_read" on public.accounting_accounts
for select to authenticated using (true);

drop policy if exists "journal_entries_authenticated_read" on public.journal_entries;
create policy "journal_entries_authenticated_read" on public.journal_entries
for select to authenticated using (true);

drop policy if exists "journal_lines_authenticated_read" on public.journal_lines;
create policy "journal_lines_authenticated_read" on public.journal_lines
for select to authenticated using (true);

create or replace function public.post_journal_entry(
  p_voucher_no text,
  p_date date,
  p_description text,
  p_reference_type text,
  p_reference_id text,
  p_reference_no text,
  p_lines jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry_id uuid;
  v_total_debit numeric(18,2);
  v_total_credit numeric(18,2);
  v_line jsonb;
  v_account public.accounting_accounts%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if not public.is_active_user() then
    raise exception 'USER_NOT_ACTIVE';
  end if;

  if coalesce(jsonb_array_length(p_lines), 0) < 2 then
    raise exception 'JURNAL_MINIMAL_2_BARIS';
  end if;

  select coalesce(sum((x->>'debit')::numeric),0), coalesce(sum((x->>'credit')::numeric),0)
  into v_total_debit, v_total_credit
  from jsonb_array_elements(p_lines) x;

  if v_total_debit <= 0 or round(v_total_debit,2) <> round(v_total_credit,2) then
    raise exception 'JURNAL_TIDAK_BALANCE: debit %, credit %', v_total_debit, v_total_credit;
  end if;

  if exists (
    select 1 from public.journal_entries
    where reference_type = p_reference_type and reference_id = p_reference_id
  ) then
    select id into v_entry_id from public.journal_entries
    where reference_type = p_reference_type and reference_id = p_reference_id;
    return v_entry_id;
  end if;

  insert into public.journal_entries
    (voucher_no,date,description,reference_type,reference_id,reference_no,created_by)
  values
    (p_voucher_no,p_date,p_description,p_reference_type,p_reference_id,p_reference_no,auth.uid())
  returning id into v_entry_id;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    select * into v_account from public.accounting_accounts
    where code = v_line->>'accountCode' and is_active = true;

    if not found then
      raise exception 'AKUN_TIDAK_DITEMUKAN: %', v_line->>'accountCode';
    end if;

    insert into public.journal_lines
      (journal_entry_id,account_code,account_name,debit,credit)
    values (
      v_entry_id,
      v_account.code,
      v_account.name,
      coalesce((v_line->>'debit')::numeric,0),
      coalesce((v_line->>'credit')::numeric,0)
    );
  end loop;

  return v_entry_id;
exception when unique_violation then
  select id into v_entry_id from public.journal_entries
  where reference_type = p_reference_type and reference_id = p_reference_id;
  if v_entry_id is not null then return v_entry_id; end if;
  raise;
end;
$$;

grant execute on function public.post_journal_entry(text,date,text,text,text,text,jsonb) to authenticated;

-- Prevent clients from modifying journal history directly.
drop policy if exists "journal_entries_authenticated_insert" on public.journal_entries;
drop policy if exists "journal_entries_authenticated_update" on public.journal_entries;
drop policy if exists "journal_entries_authenticated_delete" on public.journal_entries;
drop policy if exists "journal_lines_authenticated_insert" on public.journal_lines;
drop policy if exists "journal_lines_authenticated_update" on public.journal_lines;
drop policy if exists "journal_lines_authenticated_delete" on public.journal_lines;
