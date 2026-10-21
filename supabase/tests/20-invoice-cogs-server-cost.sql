-- Uji: HPP faktur divalidasi terhadap biaya yang dicatat server saat Surat Jalan.
\set ON_ERROR_STOP on
do $$
declare
  o uuid := gen_random_uuid(); u uuid := gen_random_uuid();
  lines jsonb; ok boolean; msg text;
  function_dummy int;
begin
  insert into organizations(id,name) values (o,'COGS Org');
  insert into auth.users(id,email) values (u,'c@test.id');
  insert into profiles(id,email,full_name,role,active,organization_id) values (u,'c@test.id','Admin','Admin',true,o)
    on conflict (id) do update set role='Admin', active=true, organization_id=o;
  perform set_config('request.jwt.claim.sub', u::text, false);
  perform set_config('request.jwt.claim.role','authenticated', false);
  insert into warehouses(organization_id,id,data) values (o,'w1','{"id":"w1","name":"Gudang A"}');
  insert into products(organization_id,id,data) values
    (o,'p1','{"id":"p1","code":"P1","name":"P1","uom":"Sak","stock":100,"buyPrice":1000,"warehouses":[{"warehouseId":"w1","warehouseName":"Gudang A","stock":100}]}');
  insert into sales_orders(organization_id,id,data) values
    (o,'so1','{"id":"so1","code":"SO-1","status":"Approved","deliveryStatus":"Pending","items":[{"productId":"p1","productCode":"P1","qty":10}]}');
  perform create_delivery_with_stock('{"id":"d1","code":"SJ-1","soCode":"SO-1","status":"In Transit","warehouseId":"w1","warehouseName":"Gudang A","date":"2026-10-20",
     "items":[{"productId":"p1","productCode":"P1","qty":10,"unitCost":1000}]}'::jsonb);
  -- biaya setelah SJ berubah (mis. GR baru menaikkan rata-rata)
  update products set data = jsonb_set(data,'{buyPrice}','1100') where id='p1';

  lines := '[{"accountCode":"1201","debit":20000,"credit":0},{"accountCode":"4101","debit":0,"credit":20000},
              {"accountCode":"5101","debit":10000,"credit":0},{"accountCode":"1301","debit":0,"credit":10000}]';

  -- 1) faktur jujur: HPP = 10 x 1000 (biaya saat SJ), bukan 10 x 1100
  insert into invoices(organization_id,id,data) values
    (o,'inv1','{"id":"inv1","code":"INV-1","soCode":"SO-1","status":"Unpaid","subtotal":20000,"taxAmount":0,"totalAmount":20000,"cogsAmount":10000,
                "items":[{"productId":"p1","productCode":"P1","qty":10,"unitCost":1000}]}');
  perform validate_auto_journal(o,'sales_invoice','inv1',lines);
  raise notice 'OK 1: faktur jujur lolos';

  -- 2) klien memalsukan HPP jadi 1.000 (dan jurnalnya ikut dipalsukan)
  insert into invoices(organization_id,id,data) values
    (o,'inv2','{"id":"inv2","code":"INV-2","soCode":"SO-1","status":"Unpaid","subtotal":20000,"taxAmount":0,"totalAmount":20000,"cogsAmount":1000,
                "items":[{"productId":"p1","productCode":"P1","qty":10,"unitCost":100}]}');
  ok := true;
  begin
    perform validate_auto_journal(o,'sales_invoice','inv2',
      '[{"accountCode":"1201","debit":20000,"credit":0},{"accountCode":"4101","debit":0,"credit":20000},
        {"accountCode":"5101","debit":1000,"credit":0},{"accountCode":"1301","debit":0,"credit":1000}]');
  exception when others then ok := false; msg := sqlerrm; end;
  if ok then raise exception 'GAGAL 2: HPP palsu lolos'; end if;
  raise notice 'OK 2: HPP palsu ditolak -> %', msg;

  -- 3) selisih kecil (pembulatan/cache) masih diterima: 10.040 <= 0,5%% x 10.000 = 50
  insert into invoices(organization_id,id,data) values
    (o,'inv3','{"id":"inv3","code":"INV-3","soCode":"SO-1","status":"Unpaid","subtotal":20000,"taxAmount":0,"totalAmount":20000,"cogsAmount":10040,
                "items":[{"productId":"p1","productCode":"P1","qty":10,"unitCost":1004}]}');
  perform validate_auto_journal(o,'sales_invoice','inv3',
    '[{"accountCode":"1201","debit":20000,"credit":0},{"accountCode":"4101","debit":0,"credit":20000},
      {"accountCode":"5101","debit":10040,"credit":0},{"accountCode":"1301","debit":0,"credit":10040}]');
  raise notice 'OK 3: selisih kecil diterima';

  -- 4) tanpa cogsAmount: server memakai biaya pengiriman (10.000), bukan buyPrice sekarang (11.000)
  insert into invoices(organization_id,id,data) values
    (o,'inv4','{"id":"inv4","code":"INV-4","soCode":"SO-1","status":"Unpaid","subtotal":20000,"taxAmount":0,"totalAmount":20000,
                "items":[{"productId":"p1","productCode":"P1","qty":10}]}');
  perform validate_auto_journal(o,'sales_invoice','inv4',lines);
  raise notice 'OK 4: tanpa cogsAmount memakai biaya SJ';

  -- 5) data lama (SO tanpa catatan biaya server) tetap memakai perilaku lama
  insert into invoices(organization_id,id,data) values
    (o,'inv5','{"id":"inv5","code":"INV-5","soCode":"SO-LAMA","status":"Unpaid","subtotal":20000,"taxAmount":0,"totalAmount":20000,"cogsAmount":7000,
                "items":[{"productId":"p1","productCode":"P1","qty":10,"unitCost":700}]}');
  perform validate_auto_journal(o,'sales_invoice','inv5',
    '[{"accountCode":"1201","debit":20000,"credit":0},{"accountCode":"4101","debit":0,"credit":20000},
      {"accountCode":"5101","debit":7000,"credit":0},{"accountCode":"1301","debit":0,"credit":7000}]');
  raise notice 'OK 5: data lama tanpa catatan server tetap diterima (fallback)';
end $$;
select 'unit_cost tercatat' k, product_id, delta, unit_cost from stock_change_log where source_type='delivery';
