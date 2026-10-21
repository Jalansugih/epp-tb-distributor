-- Uji: kartu stok dari RPC (GR, SJ, adjustment, transfer, opening) harus cocok dengan stok;
-- manipulasi langsung ke products terdeteksi oleh stock_reconciliation().
\set ON_ERROR_STOP on
do $$
declare o uuid := gen_random_uuid(); u uuid := gen_random_uuid(); n int; r record;
begin
  insert into organizations(id,name) values (o,'Rekon Org');
  insert into auth.users(id,email) values (u,'r@test.id');
  insert into profiles(id,email,full_name,role,active,organization_id) values (u,'r@test.id','Admin','Admin',true,o)
    on conflict (id) do update set role='Admin', active=true, organization_id=o;
  perform set_config('request.jwt.claim.sub', u::text, false);
  perform set_config('request.jwt.claim.role','authenticated', false);
  insert into warehouses(organization_id,id,data) values (o,'w1','{"id":"w1","name":"Gudang A"}'),(o,'w2','{"id":"w2","name":"Gudang B"}');
  -- produk dibuat lewat RPC resmi (membuat kartu stok saldo awal)
  perform create_products_with_opening_stock('[{"id":"p1","code":"P1","name":"Semen","uom":"Sak","stock":100,"buyPrice":1000,"minStock":10,
      "warehouseId":"w1","warehouseName":"Gudang A",
      "warehouses":[{"warehouseId":"w1","warehouseName":"Gudang A","stock":100}]}]'::jsonb);
  insert into purchase_orders(organization_id,id,data) values (o,'po1','{"id":"po1","code":"PO-1","status":"Sent","items":[{"productId":"p1","qty":100,"unitPrice":1000,"netPrice":1000}]}');
  insert into goods_receipts(organization_id,id,data) values (o,'gr1','{"id":"gr1","code":"GR-1","poCode":"PO-1","warehouseId":"w1","warehouseName":"Gudang A","status":"Stored","items":[{"productId":"p1","qtyReceived":40,"unitCost":1000}]}');
  perform adjust_product_stock('p1', 40, 'gr1:p1','w1','goods_receipt','gr1');
  insert into sales_orders(organization_id,id,data) values (o,'so1','{"id":"so1","code":"SO-1","status":"Approved","deliveryStatus":"Pending","items":[{"productId":"p1","productCode":"P1","qty":30}]}');
  -- dua baris produk yang sama dalam satu SJ harus digabung, bukan menggandakan saldo
  perform create_delivery_with_stock('{"id":"d1","code":"SJ-1","soCode":"SO-1","status":"In Transit","warehouseId":"w1","warehouseName":"Gudang A","date":"2026-10-20",
     "items":[{"productId":"p1","productCode":"P1","qty":10},{"productId":"p1","productCode":"P1","qty":20}]}'::jsonb);
  select count(*) into n from stock_movements where organization_id=o and data->>'productId'='p1' and data->>'documentNo'='SJ-1';
  if n <> 1 then raise exception 'GAGAL: 2 baris produk sama menghasilkan % kartu stok (harus 1)', n; end if;
  raise notice 'OK A: dua baris produk sama -> 1 kartu stok, saldo %', (select data->>'balance' from stock_movements where organization_id=o and data->>'documentNo'='SJ-1');

  select count(*) into n from stock_reconciliation();
  if n <> 0 then
    for r in select * from stock_reconciliation() loop raise notice 'selisih: % % % stok=% kartu=%', r.kind, r.product_code, r.warehouse_id, r.stock_qty, r.ledger_qty; end loop;
    raise exception 'GAGAL: data sehat tapi rekonsiliasi melaporkan % selisih', n;
  end if;
  raise notice 'OK B: alur resmi (opening, GR, SJ) -> rekonsiliasi bersih';

  -- manipulasi langsung (mis. UPDATE manual / bug) harus terdeteksi
  update products set data = jsonb_set(data,'{stock}','105') where organization_id=o and id='p1';
  select count(*) into n from stock_reconciliation() where kind='total' and product_id='p1' and diff = 5;
  if n <> 1 then raise exception 'GAGAL: selisih total 5 (105 vs 110) tidak terdeteksi'; end if;
  select count(*) into n from stock_reconciliation() where kind='alokasi' and product_id='p1';
  if n <> 1 then raise exception 'GAGAL: selisih alokasi gudang tidak terdeteksi'; end if;
  raise notice 'OK C: perubahan stok tanpa kartu stok terdeteksi (total + alokasi)';
end $$;
