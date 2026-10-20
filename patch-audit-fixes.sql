-- ============================================================================
-- PATCH AUDIT FIXES  (jalankan PALING AKHIR; aman dijalankan ulang)
-- ============================================================================
-- Urutan eksekusi yang benar untuk database baru:
--   1. supabase/schema.sql
--   2. supabase/patch-super-admin.sql
--   3. supabase/patch-subscription.sql
--   4. supabase/patch-plans-promos.sql   (jika dipakai)
--   5. supabase/patch-audit-fixes.sql    <- file ini
-- Backup database dulu, uji di staging.
--
-- Isi:
--   A. is_active_user()/is_admin() versi final (status + masa langganan).
--   B. Stok atomik: adjust_product_stock() + log idempotensi.
--   C. post_journal_entry(): non-Admin hanya boleh jurnal otomatis transaksi.
--   D. Penomoran dokumen atomik per perusahaan + unique index kode dokumen.
--   E. Admin terakhir tidak boleh dinonaktifkan / diturunkan.
--   F. update_product_masters(): edit master tidak dapat menimpa stok/gudang.
-- ============================================================================

-- A. Definisi final hak akses ------------------------------------------------
-- schema.sql mendefinisikan ulang dua fungsi ini TANPA cek status/langganan.
-- Menjalankan ulang file ini memastikan perusahaan yang disuspend atau
-- langganannya habis tetap terkunci di level database.
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.organizations o on o.id = p.organization_id
    where p.id = auth.uid()
      and p.active = true
      and o.status = 'active'
      and coalesce(o.subscription_ends_at, o.trial_ends_at) > now()
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
    from public.profiles p
    join public.organizations o on o.id = p.organization_id
    where p.id = auth.uid()
      and p.active = true
      and o.status = 'active'
      and coalesce(o.subscription_ends_at, o.trial_ends_at) > now()
      and lower(p.role) = 'admin'
  );
$$;

revoke all on function public.is_active_user() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- B. Stok atomik dan saldo per gudang -----------------------------------------
-- Sebelum mutasi stok per gudang dipakai, saldo legacy yang tidak dapat
-- direkonstruksi dari data lama dire-baseline ke gudang utama setiap produk.
-- Baseline dicatat sekali; rerun patch tidak meratakan mutasi setelah cutover.
create table if not exists public.inventory_migration_log (
  migration_key text primary key,
  applied_at timestamptz not null default now()
);
alter table public.inventory_migration_log enable row level security;
revoke all on public.inventory_migration_log from anon, authenticated;

do $$
declare
  r record;
  v_warehouse_id text;
  v_warehouse_name text;
  v_stock numeric;
  v_data jsonb;
begin
  if not exists (select 1 from public.inventory_migration_log where migration_key = 'warehouse-stock-baseline-v1') then
    for r in select organization_id, id, data from public.products loop
      v_stock := coalesce(nullif(r.data->>'stock', '')::numeric, 0);
      select w.id, coalesce(nullif(w.data->>'name', ''), 'Gudang')
        into v_warehouse_id, v_warehouse_name
        from public.warehouses w
       where w.organization_id = r.organization_id
       order by coalesce(w.id = r.data->>'warehouseId', false) desc,
                coalesce(w.data->>'status' = 'active', false) desc,
                w.created_at asc
       limit 1;

      if v_warehouse_id is null then
        v_data := jsonb_set(r.data, '{warehouses}', '[]'::jsonb, true);
      else
        v_data := jsonb_set(r.data, '{warehouseId}', to_jsonb(v_warehouse_id), true);
        v_data := jsonb_set(v_data, '{warehouseName}', to_jsonb(v_warehouse_name), true);
        v_data := jsonb_set(v_data, '{warehouses}', jsonb_build_array(jsonb_build_object(
          'warehouseId', v_warehouse_id, 'warehouseName', v_warehouse_name, 'stock', v_stock
        )), true);

        if v_stock > 0 then
          insert into public.stock_movements (organization_id, id, data)
          values (
            r.organization_id,
            'warehouse-opening-v1:' || r.id,
            jsonb_build_object(
              'id', 'warehouse-opening-v1:' || r.id,
              'date', to_char(now(), 'YYYY-MM-DD HH24:MI'),
              'documentNo', 'BASELINE-GUDANG-' || (r.data->>'code'),
              'referenceNo', 'warehouse-stock-baseline-v1',
              'type', 'Opening Balance',
              'productId', r.id,
              'productCode', r.data->>'code',
              'productName', r.data->>'name',
              'warehouseId', v_warehouse_id,
              'warehouseName', v_warehouse_name,
              'qtyIn', v_stock,
              'qtyOut', 0,
              'qty', v_stock,
              'balance', v_stock,
              'user', 'Migrasi Sistem',
              'operator', 'Migrasi Sistem',
              'uom', r.data->>'uom',
              'notes', 'Baseline saldo sebelum pencatatan stok per gudang diaktifkan.'
            )
          ) on conflict (organization_id, id) do nothing;
        end if;
      end if;
      update public.products set data = v_data
       where organization_id = r.organization_id and id = r.id;
    end loop;
    insert into public.inventory_migration_log (migration_key)
    values ('warehouse-stock-baseline-v1') on conflict do nothing;
  end if;
end $$;

create table if not exists public.stock_change_log (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  ref             text not null,
  product_id      text not null,
  delta           numeric not null,
  warehouse_id    text,
  source_type     text,
  source_id       text,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  primary key (organization_id, ref)
);
alter table public.stock_change_log add column if not exists warehouse_id text;
alter table public.stock_change_log add column if not exists source_type text;
alter table public.stock_change_log add column if not exists source_id text;
alter table public.stock_change_log enable row level security;
revoke all on public.stock_change_log from anon, authenticated;
-- Sengaja tanpa policy: hanya fungsi SECURITY DEFINER di bawah yang menulis.

create or replace function public.change_warehouse_allocation(
  p_allocations jsonb,
  p_warehouse_id text,
  p_warehouse_name text,
  p_delta numeric
)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  v_allocations jsonb := case when jsonb_typeof(p_allocations) = 'array' then p_allocations else '[]'::jsonb end;
  v_result jsonb := '[]'::jsonb;
  v_entry jsonb;
  v_found boolean := false;
  v_current numeric;
  v_next numeric;
begin
  for v_entry in select value from jsonb_array_elements(v_allocations) as entries(value) loop
    if v_entry->>'warehouseId' = p_warehouse_id then
      v_found := true;
      v_current := coalesce(nullif(v_entry->>'stock', '')::numeric, 0);
      v_next := v_current + p_delta;
      if v_next < 0 then
        raise exception 'INSUFFICIENT_WAREHOUSE_STOCK: tersedia %, perubahan %', v_current, p_delta;
      end if;
      v_result := v_result || jsonb_build_array(jsonb_set(
        jsonb_set(v_entry, '{warehouseName}', to_jsonb(p_warehouse_name), true),
        '{stock}', to_jsonb(v_next), true
      ));
    else
      v_result := v_result || jsonb_build_array(v_entry);
    end if;
  end loop;
  if not v_found then
    if p_delta < 0 then
      raise exception 'INSUFFICIENT_WAREHOUSE_STOCK: tersedia 0, perubahan %', p_delta;
    end if;
    v_result := v_result || jsonb_build_array(jsonb_build_object(
      'warehouseId', p_warehouse_id, 'warehouseName', p_warehouse_name, 'stock', p_delta
    ));
  end if;
  return v_result;
end;
$$;
revoke all on function public.change_warehouse_allocation(jsonb, text, text, numeric) from public, anon, authenticated;

drop function if exists public.adjust_product_stock(text, numeric, text);

create or replace function public.adjust_product_stock(
  p_product_id text,
  p_delta      numeric,
  p_ref        text,
  p_warehouse_id text,
  p_source_type text,
  p_source_id text
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_data jsonb;
  v_doc jsonb;
  v_order jsonb;
  v_cur numeric;
  v_new numeric;
  v_warehouse_cur numeric;
  v_rows integer;
  v_expected numeric := 0;
  v_ordered numeric := 0;
  v_cumulative numeric := 0;
  v_qty numeric;
  v_warehouse_name text;
  v_logged_product text;
  v_logged_delta numeric;
  v_logged_warehouse text;
  v_logged_source_type text;
  v_logged_source_id text;
  v_item jsonb;
  v_unit_cost numeric;
  v_old_cost numeric;
  v_new_cost numeric;
  v_movement_id text;
  v_movement_type text;
  v_movement_qty numeric;
  v_movement jsonb;
  v_ref    text := nullif(trim(coalesce(p_ref, '')), '');
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if not public.is_active_user() then
    raise exception 'USER_NOT_ACTIVE';
  end if;
  v_org := public.current_org_id();
  if v_org is null then
    raise exception 'ORGANIZATION_REQUIRED';
  end if;
  if v_ref is null or char_length(v_ref) > 200 then
    raise exception 'STOCK_REF_REQUIRED';
  end if;
  if p_product_id is null or p_delta is null or p_delta = 0 or abs(p_delta) > 1000000000
     or nullif(trim(coalesce(p_warehouse_id, '')), '') is null
     or nullif(trim(coalesce(p_source_id, '')), '') is null then
    raise exception 'STOCK_DELTA_INVALID';
  end if;
  select data->>'name' into v_warehouse_name
    from public.warehouses where organization_id = v_org and id = p_warehouse_id;
  if v_warehouse_name is null then
    raise exception 'WAREHOUSE_NOT_FOUND: %', p_warehouse_id;
  end if;

  if p_source_type = 'delivery' then
    select data into v_doc from public.deliveries where organization_id = v_org and id = p_source_id;
    if v_doc is null or (v_doc->>'warehouseId' is not null and v_doc->>'warehouseId' <> p_warehouse_id)
       or (v_doc->>'warehouseId' is null and v_doc->>'warehouseName' is distinct from v_warehouse_name)
       or v_ref not in ((v_doc->>'code') || ':' || p_product_id, p_source_id || ':' || p_product_id)
       or v_doc->>'status' is null
       or v_doc->>'status' not in ('In Transit', 'Delivered') then
      raise exception 'STOCK_SOURCE_DOCUMENT_INVALID';
    end if;
    select coalesce(sum(coalesce(nullif(i->>'qty', '')::numeric, 0)), 0) into v_expected
      from jsonb_array_elements(coalesce(v_doc->'items', '[]'::jsonb)) i
     where i->>'productId' = p_product_id;
    if p_delta <> -v_expected or v_expected <= 0 then raise exception 'STOCK_DELTA_DOES_NOT_MATCH_DOCUMENT'; end if;
    select data into v_order from public.sales_orders
     where organization_id = v_org and (data->>'code') = (v_doc->>'soCode') limit 1 for update;
    if v_order is null then raise exception 'STOCK_SOURCE_ORDER_NOT_FOUND'; end if;
    select coalesce(sum(coalesce(nullif(i->>'qty', '')::numeric, 0)), 0) into v_ordered
      from jsonb_array_elements(coalesce(v_order->'items', '[]'::jsonb)) i
     where i->>'productId' = p_product_id;
    select coalesce(sum(coalesce(nullif(i->>'qty', '')::numeric, 0)), 0) into v_cumulative
      from public.deliveries d
      cross join lateral jsonb_array_elements(coalesce(d.data->'items', '[]'::jsonb)) i
     where d.organization_id = v_org and d.data->>'soCode' = v_doc->>'soCode'
       and i->>'productId' = p_product_id;
    if v_ordered <= 0 or v_cumulative > v_ordered then
      raise exception 'DELIVERY_EXCEEDS_SALES_ORDER';
    end if;
  elsif p_source_type = 'goods_receipt' then
    select data into v_doc from public.goods_receipts where organization_id = v_org and id = p_source_id;
    if v_doc is null or (v_doc->>'warehouseId' is not null and v_doc->>'warehouseId' <> p_warehouse_id)
       or (v_doc->>'warehouseId' is null and v_doc->>'warehouseName' is distinct from v_warehouse_name)
       or v_ref not in ((v_doc->>'code') || ':' || p_product_id, p_source_id || ':' || p_product_id) then
      raise exception 'STOCK_SOURCE_DOCUMENT_INVALID';
    end if;
    select coalesce(sum(coalesce(nullif(i->>'qtyReceived', '')::numeric, 0)), 0) into v_expected
      from jsonb_array_elements(coalesce(v_doc->'items', '[]'::jsonb)) i
     where i->>'productId' = p_product_id;
    if p_delta <> v_expected or v_expected <= 0 then raise exception 'STOCK_DELTA_DOES_NOT_MATCH_DOCUMENT'; end if;
    select data into v_order from public.purchase_orders
     where organization_id = v_org and (data->>'code') = (v_doc->>'poCode') limit 1 for update;
    if v_order is null or v_order->>'status' in ('Draft', 'Cancelled') then
      raise exception 'STOCK_SOURCE_ORDER_NOT_FOUND_OR_INVALID';
    end if;
    select coalesce(sum(coalesce(nullif(i->>'qty', '')::numeric, 0)), 0) into v_ordered
      from jsonb_array_elements(coalesce(v_order->'items', '[]'::jsonb)) i
     where i->>'productId' = p_product_id;
    select sum(coalesce(nullif(i->>'qty','')::numeric,0)
             * coalesce(nullif(i->>'netPrice','')::numeric, nullif(i->>'unitPrice','')::numeric,0))
           / nullif(sum(coalesce(nullif(i->>'qty','')::numeric,0)),0)
      into v_unit_cost
      from jsonb_array_elements(coalesce(v_order->'items','[]'::jsonb)) i
     where i->>'productId' = p_product_id;
    select coalesce(sum(coalesce(nullif(i->>'qtyReceived', '')::numeric, 0)), 0) into v_cumulative
      from public.goods_receipts g
      cross join lateral jsonb_array_elements(coalesce(g.data->'items', '[]'::jsonb)) i
     where g.organization_id = v_org and g.data->>'poCode' = v_doc->>'poCode'
       and coalesce(g.data->>'status', '') not in ('Voided', 'Returned')
       and i->>'productId' = p_product_id;
    if v_ordered <= 0 or v_cumulative > v_ordered then
      raise exception 'GOODS_RECEIPT_EXCEEDS_PURCHASE_ORDER';
    end if;
  elsif p_source_type = 'adjustment' then
    if not public.is_admin() then raise exception 'STOCK_ADJUSTMENT_ADMIN_ONLY'; end if;
    select data into v_doc from public.stock_adjustments where organization_id = v_org and id = p_source_id;
    if v_doc is null
       or v_doc->>'productId' <> p_product_id
       or v_doc->>'warehouseId' <> p_warehouse_id
       or v_ref not in ((v_doc->>'adjustmentNo') || ':' || p_product_id, p_source_id || ':' || p_product_id) then
      raise exception 'STOCK_SOURCE_DOCUMENT_INVALID';
    end if;
    v_qty := coalesce(nullif(v_doc->>'qty', '')::numeric, 0);
    if v_qty <= 0 or v_doc->>'type' is null
       or (v_doc->>'type' = 'Increase' and p_delta <> v_qty)
       or (v_doc->>'type' = 'Decrease' and p_delta <> -v_qty)
       or v_doc->>'type' not in ('Increase', 'Decrease') then
      raise exception 'STOCK_DELTA_DOES_NOT_MATCH_DOCUMENT';
    end if;
  else
    raise exception 'STOCK_SOURCE_TYPE_INVALID';
  end if;

  -- Idempotensi per dokumen dan produk; ref yang sama tidak boleh mengubah
  -- gudang, sumber, produk, atau delta pada replay.
  insert into public.stock_change_log (organization_id, ref, product_id, delta, warehouse_id, source_type, source_id, created_by)
  values (v_org, v_ref, p_product_id, p_delta, p_warehouse_id, p_source_type, p_source_id, auth.uid())
  on conflict (organization_id, ref) do nothing;
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    select product_id, delta, warehouse_id, source_type, source_id
      into v_logged_product, v_logged_delta, v_logged_warehouse, v_logged_source_type, v_logged_source_id
      from public.stock_change_log
     where organization_id = v_org and ref = v_ref;
    if v_logged_product is distinct from p_product_id or v_logged_delta is distinct from p_delta
       or v_logged_warehouse is distinct from p_warehouse_id
       or v_logged_source_type is distinct from p_source_type
       or v_logged_source_id is distinct from p_source_id then
      raise exception 'STOCK_REF_CONFLICT';
    end if;
    select coalesce((data->>'stock')::numeric, 0) into v_cur
      from public.products where organization_id = v_org and id = p_product_id;
    return v_cur;
  end if;

  select data into v_data
    from public.products
   where organization_id = v_org and id = p_product_id
     for update;
  if not found then
    raise exception 'PRODUCT_NOT_FOUND: %', p_product_id;
  end if;

  v_cur := coalesce(nullif(v_data->>'stock', '')::numeric, 0);
  v_new := v_cur + p_delta;
  if v_new < 0 then
    raise exception 'INSUFFICIENT_STOCK: tersedia %, perubahan %', v_cur, p_delta;
  end if;
  v_warehouse_cur := coalesce((
    select sum(coalesce(nullif(a->>'stock', '')::numeric, 0))
      from jsonb_array_elements(coalesce(v_data->'warehouses', '[]'::jsonb)) a
     where a->>'warehouseId' = p_warehouse_id
  ), 0);
  if v_warehouse_cur + p_delta < 0 then
    raise exception 'INSUFFICIENT_WAREHOUSE_STOCK: tersedia %, perubahan %', v_warehouse_cur, p_delta;
  end if;

  v_data := jsonb_set(
    jsonb_set(v_data, '{stock}', to_jsonb(v_new), true),
    '{warehouses}',
    public.change_warehouse_allocation(v_data->'warehouses', p_warehouse_id, v_warehouse_name, p_delta),
    true
  );
  if p_source_type = 'goods_receipt' and v_unit_cost is not null then
    v_old_cost := coalesce(nullif(v_data->>'buyPrice','')::numeric,0);
    v_new_cost := case when v_new > 0
      then ((v_cur * v_old_cost) + (p_delta * v_unit_cost)) / v_new
      else v_unit_cost end;
    v_data := jsonb_set(v_data, '{buyPrice}', to_jsonb(v_new_cost), true);
  end if;
  update public.products
     set data = v_data
   where organization_id = v_org and id = p_product_id;

  -- Keep the movement ledger in the same transaction as the stock mutation.
  -- Aggregate document lines by product in this RPC, so repeated lines never
  -- receive a duplicate ending balance.
  v_movement_id := 'stock-posting-v1:' || v_ref;
  v_movement_qty := abs(p_delta);
  v_movement_type := case p_source_type
    when 'delivery' then 'Out'
    when 'goods_receipt' then 'In'
    else 'Adjustment'
  end;
  v_movement := jsonb_build_object(
    'id', v_movement_id,
    'date', coalesce(nullif(v_doc->>'date', ''), to_char(now(), 'YYYY-MM-DD')) || ' 00:00',
    'documentNo', coalesce(v_doc->>'code', v_doc->>'adjustmentNo', v_ref),
    'referenceNo', coalesce(v_doc->>'code', v_doc->>'adjustmentNo', v_ref),
    'type', v_movement_type,
    'productId', p_product_id,
    'productCode', v_data->>'code',
    'productName', v_data->>'name',
    'warehouseId', p_warehouse_id,
    'warehouseName', v_warehouse_name,
    'qtyIn', case when p_delta > 0 then v_movement_qty else 0 end,
    'qtyOut', case when p_delta < 0 then v_movement_qty else 0 end,
    'qty', v_movement_qty,
    'balance', v_warehouse_cur + p_delta,
    'user', coalesce(v_doc->>'receivedBy', v_doc->>'driverName', auth.uid()::text),
    'operator', coalesce(v_doc->>'receivedBy', v_doc->>'driverName', auth.uid()::text),
    'uom', v_data->>'uom',
    'notes', case p_source_type
      when 'delivery' then 'Pengeluaran barang melalui Surat Jalan ' || coalesce(v_doc->>'code', '')
      when 'goods_receipt' then 'Penerimaan barang melalui Goods Receipt ' || coalesce(v_doc->>'code', '')
      else 'Adjustment (' || coalesce(v_doc->>'type', '') || '): ' || coalesce(v_doc->>'reason', '')
    end
  );
  insert into public.stock_movements (organization_id, id, data)
  values (v_org, v_movement_id, v_movement)
  on conflict (organization_id, id) do nothing;

  return v_new;
end;
$$;

revoke all on function public.adjust_product_stock(text, numeric, text, text, text, text) from public, anon;
grant execute on function public.adjust_product_stock(text, numeric, text, text, text, text) to authenticated;

-- Surat Jalan dan semua pengurangan stok diposting atomik. Kegagalan kode
-- dokumen, validasi SO, atau satu produk membatalkan seluruh transaksi.
create or replace function public.create_delivery_with_stock(p_delivery jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_id text;
  v_existing jsonb;
  v_is_existing boolean := false;
  v_order_id text;
  v_order jsonb;
  v_item record;
  v_warehouse_id text;
  v_rows integer;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.is_active_user() then raise exception 'USER_NOT_ACTIVE'; end if;
  v_org := public.current_org_id();
  if v_org is null then raise exception 'ORGANIZATION_REQUIRED'; end if;
  if p_delivery is null or jsonb_typeof(p_delivery) is distinct from 'object'
     or jsonb_typeof(p_delivery->'items') is distinct from 'array'
     or jsonb_array_length(p_delivery->'items') = 0
     or p_delivery->>'status' not in ('In Transit', 'Delivered') then
    raise exception 'DELIVERY_DOCUMENT_INVALID';
  end if;
  v_id := nullif(trim(coalesce(p_delivery->>'id', '')), '');
  v_warehouse_id := nullif(trim(coalesce(p_delivery->>'warehouseId', '')), '');
  if v_id is null or v_warehouse_id is null or nullif(trim(coalesce(p_delivery->>'code', '')), '') is null then
    raise exception 'DELIVERY_FIELDS_INVALID';
  end if;

  select data into v_existing from public.deliveries
   where organization_id = v_org and id = v_id for update;
  if found then
    v_is_existing := true;
    if v_existing is distinct from p_delivery then raise exception 'DELIVERY_ID_CONFLICT'; end if;
  else
    insert into public.deliveries (organization_id, id, data) values (v_org, v_id, p_delivery);
  end if;

  select id, data into v_order_id, v_order from public.sales_orders
   where organization_id = v_org and data->>'code' = p_delivery->>'soCode'
   for update;
  if v_order is null then raise exception 'STOCK_SOURCE_ORDER_NOT_FOUND'; end if;
  if not v_is_existing and (v_order->>'status' is distinct from 'Approved'
     or v_order->>'deliveryStatus' is distinct from 'Pending') then
    raise exception 'SALES_ORDER_ALREADY_DELIVERED_OR_NOT_APPROVED';
  end if;

  for v_item in
    select i->>'productId' as product_id,
           sum(coalesce(nullif(i->>'qty', '')::numeric, 0)) as qty
      from jsonb_array_elements(p_delivery->'items') i
     group by i->>'productId'
  loop
    if nullif(trim(coalesce(v_item.product_id, '')), '') is null or v_item.qty <= 0 then
      raise exception 'DELIVERY_ITEM_INVALID';
    end if;
    perform public.adjust_product_stock(
      v_item.product_id,
      -v_item.qty,
      v_id || ':' || v_item.product_id,
      v_warehouse_id,
      'delivery',
      v_id
    );
  end loop;
  update public.sales_orders
     set data = jsonb_set(jsonb_set(data, '{deliveryStatus}', '"Shipped"'::jsonb, true), '{status}', '"Processing"'::jsonb, true)
   where organization_id = v_org and id = v_order_id;
end;
$$;
revoke all on function public.create_delivery_with_stock(jsonb) from public, anon;
grant execute on function public.create_delivery_with_stock(jsonb) to authenticated;

-- Kompatibilitas aman untuk RPC lama yang masih ada di antrean offline.
-- Sumber/gudang tetap diturunkan dari dokumen tersimpan; tidak ada jalur ref bebas.
create or replace function public.adjust_product_stock(p_product_id text, p_delta numeric, p_ref text)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_doc record;
  v_warehouse_id text;
  v_warehouse_name text;
  v_count integer;
  v_stock numeric;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.is_active_user() then raise exception 'USER_NOT_ACTIVE'; end if;
  v_org := public.current_org_id();
  if v_org is null then raise exception 'ORGANIZATION_REQUIRED'; end if;

  select product_id, delta into v_doc
    from public.stock_change_log
   where organization_id = v_org and ref = p_ref and warehouse_id is null;
  if found then
    if v_doc.product_id is distinct from p_product_id or v_doc.delta is distinct from p_delta then
      raise exception 'STOCK_REF_CONFLICT';
    end if;
    select coalesce(nullif(data->>'stock', '')::numeric, 0) into v_stock
      from public.products where organization_id = v_org and id = p_product_id;
    return v_stock;
  end if;

  select count(*) into v_count from (
    select id, data, 'delivery'::text as source_type from public.deliveries
     where organization_id = v_org and data->>'code' = split_part(p_ref, ':', 1)
    union all
    select id, data, 'goods_receipt'::text from public.goods_receipts
     where organization_id = v_org and data->>'code' = split_part(p_ref, ':', 1)
    union all
    select id, data, 'adjustment'::text from public.stock_adjustments
     where organization_id = v_org and data->>'adjustmentNo' = split_part(p_ref, ':', 1)
  ) d;
  if v_count <> 1 then raise exception 'STOCK_SOURCE_DOCUMENT_NOT_FOUND_OR_AMBIGUOUS'; end if;
  select id, data, source_type into v_doc from (
    select id, data, 'delivery'::text as source_type from public.deliveries
     where organization_id = v_org and data->>'code' = split_part(p_ref, ':', 1)
    union all
    select id, data, 'goods_receipt'::text from public.goods_receipts
     where organization_id = v_org and data->>'code' = split_part(p_ref, ':', 1)
    union all
    select id, data, 'adjustment'::text from public.stock_adjustments
     where organization_id = v_org and data->>'adjustmentNo' = split_part(p_ref, ':', 1)
  ) d limit 1;
  v_warehouse_id := nullif(v_doc.data->>'warehouseId', '');
  if v_warehouse_id is null then
    select id into v_warehouse_id from public.warehouses
     where organization_id = v_org and data->>'name' = v_doc.data->>'warehouseName' limit 1;
  end if;
  if v_warehouse_id is null then raise exception 'WAREHOUSE_NOT_FOUND'; end if;

  return public.adjust_product_stock(
    p_product_id, p_delta, p_ref, v_warehouse_id, v_doc.source_type, v_doc.id
  );
end;
$$;
revoke all on function public.adjust_product_stock(text, numeric, text) from public, anon;
grant execute on function public.adjust_product_stock(text, numeric, text) to authenticated;

create table if not exists public.stock_transfer_log (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  transfer_id text not null,
  phase text not null check (phase in ('dispatch', 'receive')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (organization_id, transfer_id, phase)
);
alter table public.stock_transfer_log enable row level security;
revoke all on public.stock_transfer_log from anon, authenticated;

-- Transfer mengubah alokasi gudang asal/tujuan saja; total stok produk tetap.
-- Satu panggilan memproses semua item dan seluruhnya rollback bila stok asal
-- salah satu produk tidak cukup. Referensi dan item dibaca dari dokumen tersimpan.
create or replace function public.apply_stock_transfer(p_transfer_id text, p_phase text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_transfer jsonb;
  v_item record;
  v_product jsonb;
  v_qty numeric;
  v_warehouse_id text;
  v_warehouse_name text;
  v_from_id text;
  v_to_id text;
  v_from_name text;
  v_to_name text;
  v_rows integer;
  v_balance numeric;
  v_movement_id text;
  v_movement jsonb;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.is_active_user() then raise exception 'USER_NOT_ACTIVE'; end if;
  v_org := public.current_org_id();
  if v_org is null then raise exception 'ORGANIZATION_REQUIRED'; end if;
  if p_phase is null or p_phase not in ('dispatch', 'receive') then raise exception 'TRANSFER_PHASE_INVALID'; end if;

  select data into v_transfer
    from public.stock_transfers where organization_id = v_org and id = p_transfer_id;
  if v_transfer is null then raise exception 'TRANSFER_DOCUMENT_NOT_FOUND'; end if;

  -- Replay yang sudah sukses tidak mengulang mutasi, meski status dokumen telah maju.
  if exists (select 1 from public.stock_transfer_log
             where organization_id = v_org and transfer_id = p_transfer_id and phase = p_phase) then
    return;
  end if;

  v_from_id := nullif(v_transfer->>'fromWarehouseId', '');
  v_to_id := nullif(v_transfer->>'toWarehouseId', '');
  if v_from_id is null or v_to_id is null or v_from_id = v_to_id
     or jsonb_typeof(v_transfer->'items') is distinct from 'array'
     or jsonb_array_length(v_transfer->'items') = 0 then
    raise exception 'TRANSFER_DOCUMENT_INVALID';
  end if;
  select data->>'name' into v_from_name from public.warehouses where organization_id = v_org and id = v_from_id;
  select data->>'name' into v_to_name from public.warehouses where organization_id = v_org and id = v_to_id;
  if v_from_name is null or v_to_name is null then raise exception 'TRANSFER_WAREHOUSE_NOT_FOUND'; end if;
  if p_phase = 'dispatch' and (v_transfer->>'status') is distinct from 'Approved' then
    raise exception 'TRANSFER_MUST_BE_APPROVED';
  end if;
  if p_phase = 'dispatch' and not public.is_admin() then
    raise exception 'TRANSFER_DISPATCH_ADMIN_ONLY';
  end if;
  if p_phase = 'receive' then
    if not exists (select 1 from public.stock_transfer_log
                   where organization_id = v_org and transfer_id = p_transfer_id and phase = 'dispatch') then
      raise exception 'TRANSFER_NOT_DISPATCHED';
    end if;
    if v_transfer->>'status' is null or v_transfer->>'status' not in ('In Transit', 'Received', 'Completed') then
      raise exception 'TRANSFER_NOT_IN_TRANSIT';
    end if;
  end if;

  insert into public.stock_transfer_log (organization_id, transfer_id, phase, created_by)
  values (v_org, p_transfer_id, p_phase, auth.uid())
  on conflict (organization_id, transfer_id, phase) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then return; end if;

  if p_phase = 'dispatch' then
    v_warehouse_id := v_from_id;
    v_warehouse_name := v_from_name;
  else
    v_warehouse_id := v_to_id;
    v_warehouse_name := v_to_name;
  end if;

  for v_item in
    select i->>'productId' as product_id,
           max(i->>'productCode') as product_code,
           max(i->>'productName') as product_name,
           max(i->>'uom') as uom,
           sum(coalesce(nullif(i->>'qty', '')::numeric, 0)) as qty
      from jsonb_array_elements(v_transfer->'items') i
     group by i->>'productId'
  loop
    if nullif(trim(coalesce(v_item.product_id, '')), '') is null then
      raise exception 'TRANSFER_ITEM_INVALID';
    end if;
    v_qty := coalesce(v_item.qty, 0);
    if v_qty <= 0 then raise exception 'TRANSFER_QTY_INVALID'; end if;

    select data into v_product from public.products
     where organization_id = v_org and id = v_item.product_id
     for update;
    if v_product is null then raise exception 'PRODUCT_NOT_FOUND: %', v_item.product_id; end if;

    update public.products
       set data = jsonb_set(data, '{warehouses}', public.change_warehouse_allocation(
         data->'warehouses', v_warehouse_id, v_warehouse_name,
         case when p_phase = 'dispatch' then -v_qty else v_qty end
       ), true)
     where organization_id = v_org and id = v_item.product_id
     returning data into v_product;
    select coalesce(sum(coalesce(nullif(a->>'stock', '')::numeric, 0)), 0)
      into v_balance from jsonb_array_elements(coalesce(v_product->'warehouses', '[]'::jsonb)) a
     where a->>'warehouseId' = v_warehouse_id;
    v_movement_id := 'transfer-' || p_transfer_id || '-' || p_phase || '-' || v_item.product_id;
    v_movement := jsonb_build_object(
      'id', v_movement_id,
      'date', coalesce(nullif(v_transfer->>'date', ''), to_char(now(), 'YYYY-MM-DD')) || ' 00:00',
      'documentNo', coalesce(v_transfer->>'transferNo', p_transfer_id),
      'referenceNo', coalesce(v_transfer->>'transferNo', p_transfer_id),
      'type', 'Transfer',
      'productId', v_item.product_id,
      'productCode', coalesce(v_item.product_code, v_product->>'code'),
      'productName', coalesce(v_item.product_name, v_product->>'name'),
      'warehouseId', v_warehouse_id,
      'warehouseName', v_warehouse_name,
      'qtyIn', case when p_phase = 'receive' then v_qty else 0 end,
      'qtyOut', case when p_phase = 'dispatch' then v_qty else 0 end,
      'qty', v_qty,
      'balance', v_balance,
      'operator', auth.uid()::text,
      'uom', coalesce(v_item.uom, v_product->>'uom'),
      'notes', case when p_phase = 'dispatch'
        then 'Transfer ' || coalesce(v_transfer->>'transferNo', p_transfer_id) || ': keluar dari ' || v_from_name || ' menuju ' || v_to_name
        else 'Transfer ' || coalesce(v_transfer->>'transferNo', p_transfer_id) || ': diterima di ' || v_to_name || ' dari ' || v_from_name end
    );
    insert into public.stock_movements (organization_id, id, data)
    values (v_org, v_movement_id, v_movement)
    on conflict (organization_id, id) do nothing;
  end loop;
end;
$$;

revoke all on function public.apply_stock_transfer(text, text) from public, anon;
grant execute on function public.apply_stock_transfer(text, text) to authenticated;

-- Pembalikan stok wajib terikat ke dokumen yang sudah mem-posting mutasi.
-- Satu reversal menutup seluruh kuantitas DO atau GR, menyimpan alasan, dan
-- menulis perubahan stok + status sumber dalam satu transaksi.
create table if not exists public.inventory_reversals (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, id)
);
alter table public.inventory_reversals enable row level security;
revoke all on public.inventory_reversals from anon, authenticated;

create or replace function public.reverse_inventory_document(
  p_reversal_id text,
  p_source_type text,
  p_source_id text,
  p_disposition text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_doc jsonb;
  v_product jsonb;
  v_item record;
  v_warehouse_id text;
  v_warehouse_name text;
  v_old_status text;
  v_qty numeric;
  v_original_delta numeric;
  v_delta numeric;
  v_total numeric;
  v_unit_cost numeric;
  v_old_cost numeric;
  v_new_cost numeric;
  v_ref text;
  v_reverse jsonb;
  v_warehouse_balance numeric;
  v_movement_id text;
  v_movement jsonb;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.is_active_user() then raise exception 'USER_NOT_ACTIVE'; end if;
  if not public.is_admin() then raise exception 'INVENTORY_REVERSAL_ADMIN_ONLY'; end if;
  v_org := public.current_org_id();
  if v_org is null then raise exception 'ORGANIZATION_REQUIRED'; end if;
  if nullif(trim(coalesce(p_reversal_id, '')), '') is null
     or nullif(trim(coalesce(p_source_id, '')), '') is null
     or nullif(trim(coalesce(p_reason, '')), '') is null
     or char_length(p_reason) > 500 then raise exception 'REVERSAL_FIELDS_INVALID'; end if;
  if p_source_type = 'delivery' and p_disposition = 'Returned' then
    select data into v_doc from public.deliveries where organization_id = v_org and id = p_source_id for update;
  elsif p_source_type = 'goods_receipt' and p_disposition in ('Voided', 'Returned') then
    select data into v_doc from public.goods_receipts where organization_id = v_org and id = p_source_id for update;
  else
    raise exception 'REVERSAL_SOURCE_OR_DISPOSITION_INVALID';
  end if;
  if v_doc is null then raise exception 'REVERSAL_SOURCE_NOT_FOUND'; end if;
  if exists (select 1 from public.inventory_reversals where organization_id = v_org and id = p_reversal_id) then
    select data into v_reverse from public.inventory_reversals where organization_id = v_org and id = p_reversal_id;
    if v_reverse->>'sourceId' is distinct from p_source_id
       or v_reverse->>'sourceType' is distinct from p_source_type
       or v_reverse->>'disposition' is distinct from p_disposition
       or v_reverse->>'reason' is distinct from trim(p_reason) then
      raise exception 'REVERSAL_ID_CONFLICT';
    end if;
    return v_reverse;
  end if;
  v_old_status := v_doc->>'status';
  if p_source_type = 'delivery' and (v_old_status is null or v_old_status not in ('In Transit', 'Delivered')) then
    raise exception 'DELIVERY_NOT_REVERSIBLE';
  elsif p_source_type = 'goods_receipt' and (v_old_status is null or v_old_status not in ('Pending', 'Inspected', 'Stored')) then
    raise exception 'GOODS_RECEIPT_NOT_REVERSIBLE';
  end if;
  if p_source_type = 'goods_receipt' and p_disposition = 'Voided'
     and exists (select 1 from public.purchase_invoices where organization_id = v_org
       and data->>'poCode' = v_doc->>'poCode' and coalesce(data->>'status', '') <> 'Cancelled') then
    raise exception 'GR_HAS_PURCHASE_INVOICE_USE_PURCHASE_RETURN';
  end if;
  if p_source_type = 'goods_receipt' and p_disposition = 'Returned'
     and exists (select 1 from public.purchase_invoices where organization_id = v_org
       and data->>'poCode' = v_doc->>'poCode' and coalesce(data->>'status', '') <> 'Cancelled') then
    raise exception 'GR_HAS_PURCHASE_INVOICE_CANCEL_INVOICE_FIRST';
  end if;
  if p_source_type = 'delivery'
     and exists (select 1 from public.invoices where organization_id = v_org
       and data->>'soCode' = v_doc->>'soCode' and coalesce(data->>'status', '') <> 'Cancelled') then
    raise exception 'DELIVERY_HAS_SALES_INVOICE_CANCEL_INVOICE_FIRST';
  end if;
  v_warehouse_id := nullif(v_doc->>'warehouseId', '');
  v_warehouse_name := v_doc->>'warehouseName';
  if v_warehouse_id is null then
    select id into v_warehouse_id from public.warehouses
     where organization_id = v_org and data->>'name' = v_warehouse_name limit 1;
  end if;
  if v_warehouse_id is null or v_warehouse_name is null then raise exception 'REVERSAL_WAREHOUSE_NOT_FOUND'; end if;

  v_reverse := jsonb_build_object(
    'id', p_reversal_id, 'sourceType', p_source_type, 'sourceId', p_source_id,
    'sourceNo', v_doc->>'code', 'disposition', p_disposition,
    'reason', trim(p_reason), 'warehouseId', v_warehouse_id,
    'warehouseName', v_warehouse_name, 'date', now(), 'items', '[]'::jsonb
  );
  insert into public.inventory_reversals (organization_id, id, data)
  values (v_org, p_reversal_id, v_reverse);

  for v_item in
    select i->>'productId' as product_id,
           sum(coalesce(nullif(i->>'qty', '')::numeric, nullif(i->>'qtyReceived', '')::numeric, 0)) as qty,
           sum(coalesce(nullif(i->>'qty', '')::numeric, nullif(i->>'qtyReceived', '')::numeric, 0)
               * nullif(i->>'unitCost','')::numeric)
             / nullif(sum(case when nullif(i->>'unitCost','') is not null
                                then coalesce(nullif(i->>'qty', '')::numeric, nullif(i->>'qtyReceived', '')::numeric, 0)
                                else 0 end),0) as unit_cost,
           max(i->>'productCode') as product_code,
           max(i->>'productName') as product_name,
           max(i->>'uom') as uom
      from jsonb_array_elements(coalesce(v_doc->'items', '[]'::jsonb)) i
     where nullif(i->>'productId', '') is not null
     group by i->>'productId'
  loop
    v_qty := v_item.qty;
    v_unit_cost := v_item.unit_cost;
    if v_qty <= 0 then continue; end if;
    v_ref := (v_doc->>'code') || ':' || v_item.product_id;
    v_original_delta := case when p_source_type = 'delivery' then -v_qty else v_qty end;
    if not exists (
      select 1 from public.stock_change_log
       where organization_id = v_org and ref in (v_ref, p_source_id || ':' || v_item.product_id) and product_id = v_item.product_id
         and delta = v_original_delta and warehouse_id = v_warehouse_id
         and source_type = p_source_type and source_id = p_source_id
    ) then raise exception 'REVERSAL_ORIGINAL_STOCK_POSTING_NOT_FOUND: %', v_ref; end if;

    v_delta := -v_original_delta;
    select data into v_product from public.products
     where organization_id = v_org and id = v_item.product_id for update;
    if v_product is null then raise exception 'PRODUCT_NOT_FOUND: %', v_item.product_id; end if;
    v_total := coalesce(nullif(v_product->>'stock', '')::numeric, 0) + v_delta;
    if v_total < 0 then raise exception 'INSUFFICIENT_STOCK_FOR_REVERSAL'; end if;
    if p_source_type = 'goods_receipt' then
      v_old_cost := coalesce(nullif(v_product->>'buyPrice','')::numeric,0);
      v_unit_cost := coalesce(v_unit_cost,v_old_cost);
      v_new_cost := case when v_total > 0
        then greatest(0, ((v_total - v_delta) * v_old_cost - v_qty * v_unit_cost) / v_total)
        else 0 end;
    end if;
    v_product := jsonb_set(
      jsonb_set(v_product, '{stock}', to_jsonb(v_total), true),
      '{warehouses}',
      public.change_warehouse_allocation(v_product->'warehouses', v_warehouse_id, v_warehouse_name, v_delta),
      true
    );
    if p_source_type = 'goods_receipt' then
      v_product := jsonb_set(v_product, '{buyPrice}', to_jsonb(v_new_cost), true);
    end if;
    update public.products set data = v_product
     where organization_id = v_org and id = v_item.product_id;

    select coalesce(sum(coalesce(nullif(a->>'stock', '')::numeric, 0)), 0)
      into v_warehouse_balance from jsonb_array_elements(coalesce(v_product->'warehouses', '[]'::jsonb)) a
     where a->>'warehouseId' = v_warehouse_id;
    v_movement_id := 'reversal-' || p_reversal_id || '-' || v_item.product_id;
    v_movement := jsonb_build_object(
      'id', v_movement_id,
      'date', to_char(now(), 'YYYY-MM-DD HH24:MI'),
      'documentNo', p_reversal_id,
      'referenceNo', v_doc->>'code',
      'type', 'Return',
      'productId', v_item.product_id,
      'productCode', v_item.product_code,
      'productName', v_item.product_name,
      'warehouseId', v_warehouse_id,
      'warehouseName', v_warehouse_name,
      'qtyIn', case when v_delta > 0 then v_qty else 0 end,
      'qtyOut', case when v_delta < 0 then v_qty else 0 end,
      'qty', v_qty,
      'balance', v_warehouse_balance,
      'operator', auth.uid()::text,
      'uom', v_item.uom,
      'notes', coalesce(p_disposition, '') || ': ' || trim(p_reason)
    );
    insert into public.stock_movements (organization_id, id, data)
    values (v_org, v_movement_id, v_movement)
    on conflict (organization_id, id) do nothing;

    insert into public.stock_change_log
      (organization_id, ref, product_id, delta, warehouse_id, source_type, source_id, created_by)
    values (v_org, 'REV:' || p_reversal_id || ':' || v_item.product_id, v_item.product_id,
      v_delta, v_warehouse_id, 'reversal', p_reversal_id, auth.uid());
    v_reverse := jsonb_set(v_reverse, '{items}', (v_reverse->'items') || jsonb_build_array(jsonb_build_object(
      'productId', v_item.product_id, 'productCode', v_item.product_code,
      'productName', v_item.product_name, 'uom', v_item.uom, 'qty', v_qty, 'delta', v_delta
    )), true);
  end loop;
  if jsonb_array_length(v_reverse->'items') = 0 then raise exception 'REVERSAL_HAS_NO_POSTED_ITEMS'; end if;

  v_doc := jsonb_set(v_doc, '{status}', to_jsonb(p_disposition), true);
  v_doc := jsonb_set(v_doc, '{reversalId}', to_jsonb(p_reversal_id), true);
  v_doc := jsonb_set(v_doc, '{reversalReason}', to_jsonb(trim(p_reason)), true);
  if p_source_type = 'delivery' then
    update public.deliveries set data = v_doc where organization_id = v_org and id = p_source_id;
  else
    update public.goods_receipts set data = v_doc where organization_id = v_org and id = p_source_id;
  end if;
  update public.inventory_reversals set data = v_reverse, updated_at = now()
   where organization_id = v_org and id = p_reversal_id;
  return v_reverse;
end;
$$;
revoke all on function public.reverse_inventory_document(text, text, text, text, text) from public, anon;
grant execute on function public.reverse_inventory_document(text, text, text, text, text) to authenticated;

-- Pembatalan faktur adalah pembalikan finansial (bukan mutasi stok). Faktur
-- hanya dapat dibatalkan sebelum ada pembayaran; jurnal asal dibalik otomatis.
create or replace function public.cancel_inventory_invoice(
  p_invoice_type text,
  p_invoice_id text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_doc jsonb;
  v_reference_type text;
  v_reference_no text;
  v_voucher text;
  v_entry_id uuid;
  v_line record;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.is_active_user() then raise exception 'USER_NOT_ACTIVE'; end if;
  if not public.is_admin() then raise exception 'INVOICE_CANCELLATION_ADMIN_ONLY'; end if;
  v_org := public.current_org_id();
  if v_org is null then raise exception 'ORGANIZATION_REQUIRED'; end if;
  if nullif(trim(coalesce(p_invoice_id, '')), '') is null
     or nullif(trim(coalesce(p_reason, '')), '') is null
     or char_length(p_reason) > 500 then raise exception 'INVOICE_CANCELLATION_FIELDS_INVALID'; end if;

  if p_invoice_type = 'sales' then
    v_reference_type := 'sales_invoice';
    select data into v_doc from public.invoices where organization_id = v_org and id = p_invoice_id for update;
    if exists (select 1 from public.payments where organization_id = v_org and data->>'invoiceNo' = v_doc->>'code') then
      raise exception 'INVOICE_HAS_PAYMENTS';
    end if;
  elsif p_invoice_type = 'purchase' then
    v_reference_type := 'purchase_invoice';
    select data into v_doc from public.purchase_invoices where organization_id = v_org and id = p_invoice_id for update;
    if exists (select 1 from public.supplier_payments where organization_id = v_org
      and coalesce(data->>'invoice', data->>'invoiceNo') in (v_doc->>'code', v_doc->>'supplierInvoiceNo')) then
      raise exception 'INVOICE_HAS_PAYMENTS';
    end if;
  else
    raise exception 'INVOICE_TYPE_INVALID';
  end if;
  if v_doc is null then raise exception 'INVOICE_NOT_FOUND'; end if;
  if v_doc->>'status' = 'Cancelled' then return; end if;
  if v_doc->>'status' = 'Paid' or coalesce(nullif(v_doc->>'paidAmount', '')::numeric, 0) > 0 then raise exception 'INVOICE_HAS_PAYMENTS'; end if;

  v_reference_no := v_doc->>'code';
  v_voucher := 'JU-CANCEL-' || upper(p_invoice_type) || '-' || p_invoice_id;
  select id into v_entry_id from public.journal_entries
   where organization_id = v_org and reference_type = v_reference_type and reference_id = p_invoice_id;
  if v_entry_id is not null and not exists (
    select 1 from public.journal_entries where organization_id = v_org
      and reference_type = 'invoice_cancellation' and reference_id = p_invoice_type || ':' || p_invoice_id
  ) then
    insert into public.journal_entries
      (organization_id, voucher_no, date, description, reference_type, reference_id, reference_no, created_by)
    values (v_org, v_voucher, current_date,
      'Pembatalan faktur ' || (v_doc->>'code') || ': ' || trim(p_reason),
      'invoice_cancellation', p_invoice_type || ':' || p_invoice_id, v_reference_no, auth.uid())
    returning id into v_entry_id;
    for v_line in
      select account_code, account_name, debit, credit from public.journal_lines
       where journal_entry_id = (select id from public.journal_entries where organization_id = v_org
         and reference_type = v_reference_type and reference_id = p_invoice_id)
    loop
      insert into public.journal_lines (journal_entry_id, account_code, account_name, debit, credit)
      values (v_entry_id, v_line.account_code, v_line.account_name, v_line.credit, v_line.debit);
    end loop;
  end if;

  v_doc := jsonb_set(v_doc, '{status}', '"Cancelled"'::jsonb, true);
  v_doc := jsonb_set(v_doc, '{remainingAmount}', '0'::jsonb, true);
  v_doc := jsonb_set(v_doc, '{cancellationReason}', to_jsonb(trim(p_reason)), true);
  if p_invoice_type = 'sales' then
    update public.invoices set data = v_doc where organization_id = v_org and id = p_invoice_id;
    update public.receivables set data = jsonb_set(jsonb_set(jsonb_set(data, '{status}', '"Cancelled"'::jsonb, true), '{outstanding}', '0'::jsonb, true), '{remainingAmount}', '0'::jsonb, true)
     where organization_id = v_org and data->>'invoiceNo' = v_doc->>'code';
    update public.sales_orders set data = jsonb_set(data, '{status}', '"Processing"'::jsonb, true)
     where organization_id = v_org and data->>'code' = v_doc->>'soCode';
  else
    update public.purchase_invoices set data = v_doc where organization_id = v_org and id = p_invoice_id;
    update public.payables set data = jsonb_set(jsonb_set(jsonb_set(data, '{status}', '"Cancelled"'::jsonb, true), '{outstanding}', '0'::jsonb, true), '{remainingAmount}', '0'::jsonb, true)
     where organization_id = v_org and data->>'invoiceNo' in (v_doc->>'code', v_doc->>'supplierInvoiceNo');
    update public.purchase_orders set data = jsonb_set(data, '{status}', '"Received"'::jsonb, true)
     where organization_id = v_org and data->>'code' = v_doc->>'poCode';
  end if;
end;
$$;
revoke all on function public.cancel_inventory_invoice(text, text, text) from public, anon;
grant execute on function public.cancel_inventory_invoice(text, text, text) to authenticated;

-- Edit data katalog tanpa menulis ulang stok atau pembagian stok per gudang.
-- Pengurangan key dilakukan terhadap JSON di database saat update berlangsung,
-- sehingga transaksi stok yang masuk bersamaan tidak dapat tertimpa snapshot UI.
create or replace function public.update_product_masters(p_products jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_item jsonb;
  v_id text;
  v_updated integer;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if not public.is_active_user() then
    raise exception 'USER_NOT_ACTIVE';
  end if;
  if not public.is_admin() then
    raise exception 'PRODUCT_MASTER_ADMIN_ONLY';
  end if;
  v_org := public.current_org_id();
  if v_org is null then
    raise exception 'ORGANIZATION_REQUIRED';
  end if;
  if p_products is null or jsonb_typeof(p_products) <> 'array' then
    raise exception 'PRODUCTS_MUST_BE_ARRAY_OF_MAX_1000';
  end if;
  if jsonb_array_length(p_products) > 1000 then
    raise exception 'PRODUCTS_MUST_BE_ARRAY_OF_MAX_1000';
  end if;

  for v_item in select value from jsonb_array_elements(p_products) as items(value) loop
    if jsonb_typeof(v_item) is distinct from 'object' then
      raise exception 'PRODUCT_DATA_INVALID';
    end if;
    v_id := nullif(trim(coalesce(v_item->>'id', '')), '');
    if v_id is null then
      raise exception 'PRODUCT_ID_REQUIRED';
    end if;

    update public.products
       set data = (data - 'stock' - 'warehouses') || (v_item - 'stock' - 'warehouses')
     where organization_id = v_org and id = v_id;
    get diagnostics v_updated = row_count;
    if v_updated <> 1 then
      raise exception 'PRODUCT_NOT_FOUND: %', v_id;
    end if;
  end loop;
end;
$$;

revoke all on function public.update_product_masters(jsonb) from public, anon;
grant execute on function public.update_product_masters(jsonb) to authenticated;

-- Produk baru dan movement saldo awal dibuat dalam satu transaksi.
create or replace function public.create_products_with_opening_stock(p_products jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_product jsonb;
  v_id text;
  v_stock numeric;
  v_movement_id text;
  v_existing jsonb;
  v_rows integer;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.is_active_user() then raise exception 'USER_NOT_ACTIVE'; end if;
  if not public.is_admin() then raise exception 'PRODUCT_MASTER_ADMIN_ONLY'; end if;
  v_org := public.current_org_id();
  if v_org is null then raise exception 'ORGANIZATION_REQUIRED'; end if;
  if p_products is null or jsonb_typeof(p_products) <> 'array' or jsonb_array_length(p_products) > 1000 then
    raise exception 'PRODUCTS_MUST_BE_ARRAY_OF_MAX_1000';
  end if;

  for v_product in select value from jsonb_array_elements(p_products) as items(value) loop
    v_id := nullif(trim(coalesce(v_product->>'id', '')), '');
    v_stock := coalesce(nullif(v_product->>'stock', '')::numeric, 0);
    if v_id is null or v_stock < 0 then raise exception 'PRODUCT_DATA_INVALID'; end if;
    insert into public.products (organization_id, id, data) values (v_org, v_id, v_product)
    on conflict (organization_id, id) do nothing;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      select data into v_existing from public.products where organization_id = v_org and id = v_id;
      if v_existing is distinct from v_product then raise exception 'PRODUCT_ID_CONFLICT: %', v_id; end if;
    end if;
    if v_stock > 0 then
      v_movement_id := 'opening-stock-v1:' || v_id;
      insert into public.stock_movements (organization_id, id, data)
      values (v_org, v_movement_id, jsonb_build_object(
        'id', v_movement_id,
        'date', to_char(now(), 'YYYY-MM-DD HH24:MI'),
        'documentNo', 'SALDO-AWAL-' || coalesce(v_product->>'code', v_id),
        'referenceNo', v_product->>'code',
        'type', 'Opening Balance',
        'productId', v_id,
        'productCode', v_product->>'code',
        'productName', v_product->>'name',
        'warehouseId', v_product->>'warehouseId',
        'warehouseName', coalesce(v_product->>'warehouseName', 'Belum ditentukan'),
        'qtyIn', v_stock,
        'qtyOut', 0,
        'qty', v_stock,
        'balance', v_stock,
        'operator', auth.uid()::text,
        'uom', v_product->>'uom',
        'notes', 'Saldo awal saat produk dibuat.'
      )) on conflict (organization_id, id) do nothing;
    end if;
  end loop;
end;
$$;
revoke all on function public.create_products_with_opening_stock(jsonb) from public, anon;
grant execute on function public.create_products_with_opening_stock(jsonb) to authenticated;

-- D. Penomoran dokumen atomik -------------------------------------------------
create table if not exists public.document_counters (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  counter_key     text not null,
  last_value      integer not null default 0,
  primary key (organization_id, counter_key)
);
alter table public.document_counters enable row level security;
revoke all on public.document_counters from anon, authenticated;

create or replace function public.next_document_no(p_prefix text, p_date date default current_date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org    uuid;
  v_prefix text := upper(regexp_replace(coalesce(p_prefix, ''), '[^A-Za-z0-9-]', '', 'g'));
  v_key    text;
  v_next   integer;
  v_seed   integer;
  v_period text := to_char(coalesce(p_date, current_date), 'YYYY/MM');
  v_doc_no text;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if not public.is_active_user() then
    raise exception 'USER_NOT_ACTIVE';
  end if;
  v_org := public.current_org_id();
  if v_org is null then
    raise exception 'ORGANIZATION_REQUIRED';
  end if;
  if v_prefix !~ '^[A-Z0-9-]{1,20}$' then
    raise exception 'DOC_PREFIX_INVALID';
  end if;

  v_key := v_prefix || ':' || to_char(coalesce(p_date, current_date), 'YYYY-MM');

  select coalesce(max(split_part(doc_no, '/', 4)::integer), 0) + 1
    into v_seed
    from (
      select data->>'code' as doc_no from public.sales_orders where organization_id = v_org
      union all select data->>'code' from public.quotations where organization_id = v_org
      union all select data->>'code' from public.deliveries where organization_id = v_org
      union all select data->>'code' from public.invoices where organization_id = v_org
      union all select data->>'code' from public.payments where organization_id = v_org
      union all select data->>'code' from public.purchase_orders where organization_id = v_org
      union all select data->>'code' from public.goods_receipts where organization_id = v_org
      union all select data->>'code' from public.purchase_invoices where organization_id = v_org
      union all select data->>'transferNo' from public.stock_transfers where organization_id = v_org
      union all select data->>'adjustmentNo' from public.stock_adjustments where organization_id = v_org
      union all select data->>'paymentNumber' from public.supplier_payments where organization_id = v_org
    ) docs
   where doc_no ~ ('^' || v_prefix || '/' || v_period || '/[0-9]+$');

  insert into public.document_counters (organization_id, counter_key, last_value)
  values (v_org, v_key, v_seed)
  on conflict (organization_id, counter_key)
  do update set last_value = greatest(public.document_counters.last_value, excluded.last_value - 1) + 1
  returning last_value into v_next;

  return v_prefix || '/' || to_char(coalesce(p_date, current_date), 'YYYY/MM') || '/' || lpad(v_next::text, 4, '0');
end;
$$;

revoke all on function public.next_document_no(text, date) from public, anon;
grant execute on function public.next_document_no(text, date) to authenticated;

-- Jaring pengaman: kode dokumen unik per perusahaan. Dilewati (dengan NOTICE)
-- bila data lama sudah memuat duplikat; rapikan duplikatnya lalu jalankan ulang.
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('sales_orders',       'code'),
      ('quotations',         'code'),
      ('deliveries',         'code'),
      ('invoices',           'code'),
      ('payments',           'code'),
      ('purchase_orders',    'code'),
      ('goods_receipts',     'code'),
      ('purchase_invoices',  'code'),
      ('stock_transfers',    'transferNo'),
      ('stock_adjustments',  'adjustmentNo'),
      ('supplier_payments',  'paymentNumber')
    ) as v(tbl, fld)
  loop
    begin
      execute format(
        'create unique index if not exists %I on public.%I (organization_id, (data->>%L)) where coalesce(data->>%L, '''') <> ''''',
        'uq_' || r.tbl || '_doc_no', r.tbl, r.fld, r.fld);
    exception when unique_violation then
      raise notice 'Index unik kode dokumen % dilewati: sudah ada duplikat di %.', r.fld, r.tbl;
    end;
  end loop;
end $$;

-- Tetap cegah kode ganda bila index unik di atas dilewati karena data historis
-- sudah mengandung duplikat. Advisory lock membuat pemeriksaan aman saat dua
-- perangkat menyimpan kode yang sama bersamaan.
create or replace function public.enforce_unique_document_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_exists boolean;
begin
  v_code := nullif(trim(coalesce(new.data->>tg_argv[0], '')), '');
  if v_code is null then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text || ':' || tg_table_name || ':' || tg_argv[0] || ':' || v_code, 0));
  execute format(
    'select exists(select 1 from public.%I where organization_id = $1 and id <> $2 and data->>$3 = $4)',
    tg_table_name
  ) into v_exists using new.organization_id, new.id, tg_argv[0], v_code;
  if v_exists then raise exception 'DOCUMENT_NUMBER_ALREADY_EXISTS: %', v_code; end if;
  return new;
end;
$$;
revoke all on function public.enforce_unique_document_number() from public, anon, authenticated;

do $$
declare
  r record;
  v_trigger_name text;
begin
  for r in select * from (values
    ('sales_orders', 'code'), ('quotations', 'code'), ('deliveries', 'code'),
    ('invoices', 'code'), ('payments', 'code'), ('purchase_orders', 'code'),
    ('goods_receipts', 'code'), ('purchase_invoices', 'code'),
    ('stock_transfers', 'transferNo'), ('stock_adjustments', 'adjustmentNo'),
    ('supplier_payments', 'paymentNumber')
  ) as v(tbl, fld) loop
    v_trigger_name := 'trg_unique_' || r.tbl || '_document_no';
    if not exists (select 1 from pg_trigger where tgname = v_trigger_name and not tgisinternal) then
      execute format('create trigger %I before insert or update of data on public.%I for each row execute function public.enforce_unique_document_number(%L)', v_trigger_name, r.tbl, r.fld);
    end if;
  end loop;
end $$;

-- E. Admin terakhir tidak boleh hilang ---------------------------------------
create or replace function public.protect_last_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_others integer;
begin
  -- Hanya berlaku bila yang diubah adalah Admin aktif yang akan turun/nonaktif.
  if old.organization_id is null
     or not (old.active and lower(old.role) = 'admin')
     or (new.active and lower(new.role) = 'admin' and new.organization_id is not distinct from old.organization_id) then
    return new;
  end if;
  -- Super admin / service role (auth.uid() null) boleh mengatasi kasus khusus.
  if auth.uid() is null or public.is_super_admin() then
    return new;
  end if;
  select count(*) into v_others
    from public.profiles
   where organization_id = old.organization_id
     and active and lower(role) = 'admin' and id <> old.id;
  if v_others = 0 then
    raise exception 'LAST_ADMIN: perusahaan harus memiliki minimal satu Admin aktif.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_last_admin on public.profiles;
create trigger trg_protect_last_admin
  before update of role, active, organization_id on public.profiles
  for each row execute function public.protect_last_admin();


-- C. Jurnal: non-Admin hanya jurnal otomatis yang COCOK dengan dokumennya -----
-- Admin tetap bebas memposting jurnal apa pun. Untuk User biasa, jurnal harus
-- merujuk dokumen yang SUDAH tersimpan di perusahaannya dan nominal per akun
-- harus sama dengan hasil hitung dari dokumen itu (toleransi Rp 1):
--   sales_invoice    : 1201 D total | 4101 K subtotal | 2201 K pajak
--                      | 5101 D + 1301 K = HPP (snapshot invoice / biaya DO)
--   sales_payment    : kas/bank D amount | 1201 K amount (total bayar <= faktur)
--   purchase_invoice : 1301 D subtotal | 1401 D pajak | 2101 K total
--   supplier_payment : 2101 D amount | kas/bank K amount
create or replace function public.validate_auto_journal(
  p_org  uuid,
  p_type text,
  p_ref  text,
  p_lines jsonb
)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  d        jsonb;
  inv      jsonb;
  exp_d    jsonb := '{}'::jsonb;   -- akun -> debit yang diharapkan
  exp_c    jsonb := '{}'::jsonb;   -- akun -> kredit yang diharapkan
  act_d    jsonb;
  act_c    jsonb;
  v_total  numeric;
  v_sub    numeric;
  v_tax    numeric;
  v_amt    numeric;
  v_cogs   numeric;
  v_cash   text;
  v_paid   numeric;
  k        text;
begin
  if p_type = 'sales_invoice' then
    select data into d from public.invoices where organization_id = p_org and id = p_ref;
  elsif p_type = 'sales_payment' then
    select data into d from public.payments where organization_id = p_org and id = p_ref;
  elsif p_type = 'purchase_invoice' then
    select data into d from public.purchase_invoices where organization_id = p_org and id = p_ref;
  elsif p_type = 'supplier_payment' then
    select data into d from public.supplier_payments where organization_id = p_org and id = p_ref;
  else
    raise exception 'JURNAL_HANYA_ADMIN';
  end if;
  if d is null then
    raise exception 'JURNAL_DOKUMEN_TIDAK_DITEMUKAN: % %', p_type, p_ref;
  end if;
  if p_type in ('sales_invoice', 'purchase_invoice') and d->>'status' = 'Cancelled' then
    raise exception 'JURNAL_FAKTUR_DIBATALKAN';
  end if;

  v_total := coalesce(nullif(d->>'totalAmount', '')::numeric, 0);
  v_sub   := coalesce(nullif(d->>'subtotal', '')::numeric, 0);
  v_tax   := coalesce(nullif(d->>'taxAmount', '')::numeric, 0);
  v_amt   := coalesce(nullif(d->>'amount', '')::numeric, 0);
  v_cash  := case when d->>'paymentMethod' in ('Tunai', 'Cash') then '1101' else '1102' end;

  if p_type = 'sales_invoice' then
    exp_d := jsonb_build_object('1201', v_total);
    exp_c := jsonb_build_object('4101', greatest(0, v_sub));
    if v_tax > 0 then exp_c := exp_c || jsonb_build_object('2201', v_tax); end if;
    if nullif(d->>'cogsAmount','') is not null then
      v_cogs := greatest(0, coalesce(nullif(d->>'cogsAmount','')::numeric,0));
    else
      select coalesce(sum(
               greatest(0, coalesce(nullif(i->>'qty', '')::numeric, 0))
               * greatest(0, coalesce(nullif(i->>'unitCost','')::numeric, nullif(pr.data->>'buyPrice', '')::numeric, 0))
             ), 0)
        into v_cogs
        from jsonb_array_elements(coalesce(d->'items', '[]'::jsonb)) i
        left join lateral (
          select p.data from public.products p
           where p.organization_id = p_org
             and (p.id = i->>'productId' or p.data->>'code' = i->>'productCode')
           limit 1
        ) pr on true;
    end if;
    if v_cogs > 0 then
      exp_d := exp_d || jsonb_build_object('5101', v_cogs);
      exp_c := exp_c || jsonb_build_object('1301', v_cogs);
    end if;

  elsif p_type = 'sales_payment' then
    if v_amt <= 0 then raise exception 'JURNAL_NOMINAL_DOKUMEN_TIDAK_VALID'; end if;
    select data into inv from public.invoices
     where organization_id = p_org and data->>'code' = d->>'invoiceNo' limit 1;
    if inv is not null then
      select coalesce(sum(coalesce(nullif(data->>'amount', '')::numeric, 0)), 0) into v_paid
        from public.payments
       where organization_id = p_org and data->>'invoiceNo' = d->>'invoiceNo';
      if v_paid > coalesce(nullif(inv->>'totalAmount', '')::numeric, 0) + 1 then
        raise exception 'JURNAL_PEMBAYARAN_MELEBIHI_FAKTUR';
      end if;
    end if;
    exp_d := jsonb_build_object(v_cash, v_amt);
    exp_c := jsonb_build_object('1201', v_amt);

  elsif p_type = 'purchase_invoice' then
    exp_d := jsonb_build_object('1301', greatest(0, v_sub));
    if v_tax > 0 then exp_d := exp_d || jsonb_build_object('1401', v_tax); end if;
    exp_c := jsonb_build_object('2101', v_total);

  elsif p_type = 'supplier_payment' then
    if v_amt <= 0 then raise exception 'JURNAL_NOMINAL_DOKUMEN_TIDAK_VALID'; end if;
    exp_d := jsonb_build_object('2101', v_amt);
    exp_c := jsonb_build_object(v_cash, v_amt);
  end if;

  -- Total per akun dari baris yang dikirim klien.
  select coalesce(jsonb_object_agg(acc, sd), '{}'::jsonb),
         coalesce(jsonb_object_agg(acc, sc), '{}'::jsonb)
    into act_d, act_c
    from (
      select l->>'accountCode' as acc,
             sum(coalesce(nullif(l->>'debit', '')::numeric, 0))  as sd,
             sum(coalesce(nullif(l->>'credit', '')::numeric, 0)) as sc
        from jsonb_array_elements(p_lines) l
       group by 1
    ) t;

  for k in select jsonb_object_keys(exp_d || act_d) loop
    if abs(coalesce((exp_d->>k)::numeric, 0) - coalesce((act_d->>k)::numeric, 0)) > 1 then
      raise exception 'JURNAL_TIDAK_SESUAI_DOKUMEN: akun % debit % (seharusnya %)',
        k, coalesce((act_d->>k)::numeric, 0), coalesce((exp_d->>k)::numeric, 0);
    end if;
  end loop;
  for k in select jsonb_object_keys(exp_c || act_c) loop
    if abs(coalesce((exp_c->>k)::numeric, 0) - coalesce((act_c->>k)::numeric, 0)) > 1 then
      raise exception 'JURNAL_TIDAK_SESUAI_DOKUMEN: akun % kredit % (seharusnya %)',
        k, coalesce((act_c->>k)::numeric, 0), coalesce((exp_c->>k)::numeric, 0);
    end if;
  end loop;
end;
$$;

revoke all on function public.validate_auto_journal(uuid, text, text, jsonb) from public, anon, authenticated;

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
  v_org uuid;
  v_source_doc jsonb;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if not public.is_active_user() then
    raise exception 'USER_NOT_ACTIVE';
  end if;

  v_org := public.current_org_id();
  if v_org is null then
    raise exception 'ORGANIZATION_REQUIRED';
  end if;

  if p_lines is null or jsonb_typeof(p_lines) <> 'array' then
    raise exception 'JURNAL_LINES_HARUS_ARRAY';
  end if;
  if jsonb_array_length(p_lines) < 2 then
    raise exception 'JURNAL_MINIMAL_2_BARIS';
  end if;
  if jsonb_array_length(p_lines) > 500 then
    raise exception 'JURNAL_TERLALU_BANYAK_BARIS';
  end if;

  -- Validate every line before totaling or writing anything. Totals alone do
  -- not prevent negative values or a line carrying both debit and credit.
  for v_line in select value from jsonb_array_elements(p_lines) as lines(value) loop
    if jsonb_typeof(v_line) is distinct from 'object' then
      raise exception 'JURNAL_BARIS_TIDAK_VALID';
    end if;
    if nullif(trim(coalesce(v_line->>'accountCode', '')), '') is null then
      raise exception 'KODE_AKUN_WAJIB';
    end if;
    if nullif(v_line->>'debit', '') is not null
      and (v_line->>'debit') !~ '^[0-9]+([.][0-9]+)?$' then
      raise exception 'JURNAL_NOMINAL_DEBIT_TIDAK_VALID';
    end if;
    if nullif(v_line->>'credit', '') is not null
      and (v_line->>'credit') !~ '^[0-9]+([.][0-9]+)?$' then
      raise exception 'JURNAL_NOMINAL_KREDIT_TIDAK_VALID';
    end if;
    if coalesce((nullif(v_line->>'debit', '')::numeric), 0) < 0
      or coalesce((nullif(v_line->>'credit', '')::numeric), 0) < 0 then
      raise exception 'JURNAL_NOMINAL_TIDAK_BOLEH_NEGATIF';
    end if;
    if coalesce((nullif(v_line->>'debit', '')::numeric), 0) > 0
      and coalesce((nullif(v_line->>'credit', '')::numeric), 0) > 0 then
      raise exception 'JURNAL_SATU_BARIS_TIDAK_BOLEH_DEBIT_DAN_KREDIT';
    end if;
    if coalesce((nullif(v_line->>'debit', '')::numeric), 0) = 0
      and coalesce((nullif(v_line->>'credit', '')::numeric), 0) = 0 then
      raise exception 'JURNAL_NOMINAL_BARIS_HARUS_POSITIF';
    end if;
  end loop;

  select coalesce(sum(coalesce(nullif(x->>'debit', '')::numeric, 0)),0),
         coalesce(sum(coalesce(nullif(x->>'credit', '')::numeric, 0)),0)
  into v_total_debit, v_total_credit
  from jsonb_array_elements(p_lines) x;

  if v_total_debit <= 0 or round(v_total_debit,2) <> round(v_total_credit,2) then
    raise exception 'JURNAL_TIDAK_BALANCE: debit %, credit %', v_total_debit, v_total_credit;
  end if;

  -- Serialisasi dengan pembatalan faktur: jurnal invoice tidak dapat terbit
  -- setelah transaksi pembatalan membaca dan membalik jurnal asal.
  if p_reference_type = 'sales_invoice' then
    select data into v_source_doc from public.invoices
     where organization_id = v_org and id = p_reference_id for update;
  elsif p_reference_type = 'purchase_invoice' then
    select data into v_source_doc from public.purchase_invoices
     where organization_id = v_org and id = p_reference_id for update;
  end if;
  if p_reference_type in ('sales_invoice', 'purchase_invoice')
     and (v_source_doc is null or v_source_doc->>'status' = 'Cancelled') then
    raise exception 'JURNAL_FAKTUR_DIBATALKAN_ATAU_TIDAK_DITEMUKAN';
  end if;

  -- Non-Admin: jurnal harus cocok dengan dokumen sumbernya (lihat bagian C).
  if not public.is_admin() then
    if nullif(trim(coalesce(p_reference_id, '')), '') is null then
      raise exception 'JURNAL_REFERENSI_WAJIB';
    end if;
    perform public.validate_auto_journal(v_org, p_reference_type, p_reference_id, p_lines);
  end if;

  select id into v_entry_id from public.journal_entries
  where organization_id = v_org
    and reference_type = p_reference_type and reference_id = p_reference_id;
  if v_entry_id is not null then
    return v_entry_id;
  end if;

  insert into public.journal_entries
    (organization_id,voucher_no,date,description,reference_type,reference_id,reference_no,created_by)
  values
    (v_org,p_voucher_no,p_date,p_description,p_reference_type,p_reference_id,p_reference_no,auth.uid())
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
  where organization_id = v_org
    and reference_type = p_reference_type and reference_id = p_reference_id;
  if v_entry_id is not null then return v_entry_id; end if;
  raise;
end;
$$;

revoke all on function public.post_journal_entry(text,date,text,text,text,text,jsonb) from public, anon;
grant execute on function public.post_journal_entry(text,date,text,text,text,text,jsonb) to authenticated;

-- ============================================================================
-- POIN 5: atomic Sales Order stock reservation
-- ============================================================================
-- Serialize SO creation against product stock updates, count Submitted/Approved
-- undelivered orders as reservations, and reject overselling in the database.
create or replace function public.create_sales_order_with_stock_check(p_order jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org uuid := public.current_org_id();
  v_existing jsonb;
  v_item record;
  v_stock numeric;
  v_reserved numeric;
  v_requested numeric;
  v_code text;
  v_product_id text;
begin
  if not public.is_active_user() then raise exception 'USER_NOT_ACTIVE'; end if;
  if v_org is null then raise exception 'ORGANISASI_AKTIF_TIDAK_DITEMUKAN'; end if;
  if coalesce(jsonb_typeof(p_order),'') <> 'object'
     or nullif(trim(coalesce(p_order->>'id','')), '') is null
     or nullif(trim(coalesce(p_order->>'code','')), '') is null
     or coalesce(jsonb_typeof(p_order->'items'),'') <> 'array'
     or jsonb_array_length(p_order->'items') = 0 then
    raise exception 'SALES_ORDER_TIDAK_VALID';
  end if;
  if coalesce(p_order->>'status','') not in ('Submitted','Approved')
     or coalesce(p_order->>'deliveryStatus','') <> 'Pending' then
    raise exception 'STATUS_SALES_ORDER_TIDAK_VALID';
  end if;

  select data into v_existing from public.sales_orders
   where organization_id = v_org and id = p_order->>'id';
  if v_existing is not null then
    if v_existing->>'code' = p_order->>'code' then return; end if;
    raise exception 'ID_SALES_ORDER_SUDAH_DIGUNAKAN';
  end if;

  -- Lock every product row in a stable order. Stock adjustment and receipt RPCs
  -- take the same row locks, so the stock/reservation snapshot cannot race.
  perform id from public.products
   where organization_id = v_org order by id for update;

  for v_item in
    select product_id, product_code, sum(qty)::numeric as qty
    from (
      select coalesce(nullif(x->>'productId',''), '') as product_id,
             coalesce(nullif(x->>'productCode',''), '') as product_code,
             case when coalesce(x->>'qty','') ~ '^[0-9]+([.][0-9]+)?$'
                  then (x->>'qty')::numeric else -1 end as qty
      from jsonb_array_elements(p_order->'items') x
    ) requested_items
    group by product_id, product_code
  loop
    if v_item.qty <= 0 or (v_item.product_id = '' and v_item.product_code = '') then
      raise exception 'KUANTITAS_SALES_ORDER_TIDAK_VALID';
    end if;

    select id, data->>'code', coalesce(nullif(data->>'stock','')::numeric,0)
      into v_product_id, v_code, v_stock
      from public.products
     where organization_id = v_org
       and ((v_item.product_id <> '' and id = v_item.product_id)
         or (v_item.product_id = '' and data->>'code' = v_item.product_code));
    if not found then raise exception 'PRODUK_SALES_ORDER_TIDAK_DITEMUKAN: %', v_item.product_code; end if;
    if v_item.product_code <> '' and v_code <> v_item.product_code then
      raise exception 'KODE_PRODUK_SALES_ORDER_TIDAK_COCOK: %', v_item.product_code;
    end if;

    select coalesce(sum(case
      when coalesce(item->>'qty','') ~ '^[0-9]+([.][0-9]+)?$'
        then (item->>'qty')::numeric
      else 0 end),0)
      into v_reserved
      from public.sales_orders so
      cross join lateral jsonb_array_elements(case when jsonb_typeof(so.data->'items') = 'array' then so.data->'items' else '[]'::jsonb end) item
     where so.organization_id = v_org
       and so.data->>'status' in ('Submitted','Approved')
       and coalesce(so.data->>'deliveryStatus','Pending') = 'Pending'
       and ((v_item.product_id <> '' and item->>'productId' = v_item.product_id)
         or (item->>'productCode' = v_item.product_code));

    v_requested := v_item.qty;
    if v_stock - v_reserved < v_requested then
      raise exception 'STOK_SALES_ORDER_TIDAK_CUKUP: %, tersedia %, diminta %', v_item.product_code, v_stock-v_reserved, v_requested;
    end if;
  end loop;

  insert into public.sales_orders (organization_id, id, data)
  values (v_org, p_order->>'id', p_order);
end;
$$;

revoke all on function public.create_sales_order_with_stock_check(jsonb) from public, anon;
grant execute on function public.create_sales_order_with_stock_check(jsonb) to authenticated;

-- Freeze COGS for pre-existing invoices. Prefer the original posted journal's
-- 5101 debit; if no COGS journal exists, use the best available product cost
-- snapshot at patch time. New invoices store their own cogsAmount.
with invoice_costs as (
  select i.organization_id, i.id,
         coalesce(sum(
           case when coalesce(item->>'qty','') ~ '^[0-9]+([.][0-9]+)?$'
                then (item->>'qty')::numeric else 0 end
           * case when coalesce(p.data->>'buyPrice','') ~ '^[0-9]+([.][0-9]+)?$'
                  then (p.data->>'buyPrice')::numeric else 0 end
         ),0) as cogs_amount
    from public.invoices i
    left join lateral jsonb_array_elements(
      case when jsonb_typeof(i.data->'items') = 'array' then i.data->'items' else '[]'::jsonb end
    ) as invoice_items(item) on true
    left join public.products p on p.organization_id = i.organization_id and p.id = item->>'productId'
   where not (i.data ? 'cogsAmount')
   group by i.organization_id, i.id
), journal_costs as (
  select e.organization_id, e.reference_id as id, sum(l.debit) as cogs_amount
    from public.journal_entries e
    join public.journal_lines l on l.journal_entry_id = e.id and l.account_code = '5101'
   where e.reference_type = 'sales_invoice'
   group by e.organization_id, e.reference_id
)
update public.invoices i
   set data = jsonb_set(i.data, '{cogsAmount}', to_jsonb(coalesce(j.cogs_amount,c.cogs_amount)), true)
  from invoice_costs c
  left join journal_costs j on j.organization_id = c.organization_id and j.id = c.id
 where i.organization_id = c.organization_id and i.id = c.id
   and not (i.data ? 'cogsAmount');
