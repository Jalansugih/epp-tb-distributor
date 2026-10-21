-- Uji poin 9: dua perangkat membuat Surat Jalan dengan NOMOR yang sama (id berbeda).
-- Harapan: dokumen kedua ditolak SELURUHNYA (stok tidak berkurang, SO tidak berubah, tak ada log),
-- sedangkan replay payload yang sama persis (antrean offline) bersifat idempoten.
\set ON_ERROR_STOP on
do $$
declare
  o uuid := gen_random_uuid(); u uuid := gen_random_uuid();
  ok boolean := true; msg text; st numeric; so2 jsonb; n int;
  d1 jsonb := '{"id":"d1","code":"SJ-DUP","soCode":"SO-1","status":"In Transit","warehouseId":"w1","warehouseName":"Gudang A","date":"2026-10-21","items":[{"productId":"p1","productCode":"P1","qty":10}]}';
  d2 jsonb := '{"id":"d2","code":"SJ-DUP","soCode":"SO-2","status":"In Transit","warehouseId":"w1","warehouseName":"Gudang A","date":"2026-10-21","items":[{"productId":"p1","productCode":"P1","qty":10}]}';
begin
  insert into organizations(id,name) values (o,'Dup Org');
  insert into auth.users(id,email) values (u,'d@test.id');
  insert into profiles(id,email,full_name,role,active,organization_id) values (u,'d@test.id','Admin','Admin',true,o)
    on conflict (id) do update set role='Admin', active=true, organization_id=o;
  perform set_config('request.jwt.claim.sub', u::text, false);
  perform set_config('request.jwt.claim.role','authenticated', false);
  insert into warehouses(organization_id,id,data) values (o,'w1','{"id":"w1","name":"Gudang A"}');
  insert into products(organization_id,id,data) values
    (o,'p1','{"id":"p1","code":"P1","name":"P1","stock":100,"buyPrice":1000,"warehouses":[{"warehouseId":"w1","warehouseName":"Gudang A","stock":100}]}');
  insert into sales_orders(organization_id,id,data) values
    (o,'so1','{"id":"so1","code":"SO-1","status":"Approved","deliveryStatus":"Pending","items":[{"productId":"p1","qty":10}]}'),
    (o,'so2','{"id":"so2","code":"SO-2","status":"Approved","deliveryStatus":"Pending","items":[{"productId":"p1","qty":10}]}');

  perform create_delivery_with_stock(d1);
  select (data->>'stock')::numeric into st from products where organization_id=o and id='p1';
  if st <> 90 then raise exception 'GAGAL: SJ pertama harus menghasilkan stok 90, dapat %', st; end if;

  -- perangkat B: nomor sama, id berbeda
  begin
    perform create_delivery_with_stock(d2);
  exception when others then ok := false; msg := sqlerrm; end;
  if ok then raise exception 'GAGAL: SJ dengan nomor kembar diterima'; end if;
  raise notice 'OK 1: SJ nomor kembar ditolak -> %', msg;

  select (data->>'stock')::numeric into st from products where organization_id=o and id='p1';
  if st <> 90 then raise exception 'GAGAL: stok berubah menjadi % padahal SJ kedua ditolak', st; end if;
  select data into so2 from sales_orders where organization_id=o and id='so2';
  if so2->>'deliveryStatus' <> 'Pending' or so2->>'status' <> 'Approved' then raise exception 'GAGAL: SO-2 berubah walau SJ ditolak'; end if;
  select count(*) into n from stock_change_log where organization_id=o and source_id='d2';
  if n <> 0 then raise exception 'GAGAL: ada % log stok untuk SJ yang ditolak', n; end if;
  raise notice 'OK 2: stok tetap 90, SO-2 tetap Approved/Pending, tidak ada log untuk SJ ditolak';

  -- replay payload sama persis (antrean offline mengirim ulang) = idempoten, tidak mengurangi dua kali
  perform create_delivery_with_stock(d1);
  select (data->>'stock')::numeric into st from products where organization_id=o and id='p1';
  if st <> 90 then raise exception 'GAGAL: replay mengurangi stok lagi (%)', st; end if;
  raise notice 'OK 3: replay SJ yang sama idempoten (stok tetap 90)';
end $$;
