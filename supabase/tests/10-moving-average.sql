\set ON_ERROR_STOP on
do $$
declare o uuid := gen_random_uuid(); u uuid := gen_random_uuid(); r numeric;
begin
  insert into organizations(id,name) values (o,'Test Org');
  insert into auth.users(id,email) values (u,'a@test.id') on conflict do nothing;
  insert into profiles(id,email,full_name,role,active,organization_id) values (u,'a@test.id','Admin','Admin',true,o)
    on conflict (id) do update set role='Admin', active=true, organization_id=o;
  perform set_config('request.jwt.claim.sub', u::text, false);
  perform set_config('request.jwt.claim.role','authenticated', false);
  insert into warehouses(organization_id,id,data) values (o,'w1','{"id":"w1","name":"Gudang A"}');
  -- p1: 100 @1000 ; p2: 0 @800 ; p3: 100 @1000
  insert into products(organization_id,id,data) values
   (o,'p1','{"id":"p1","code":"P1","name":"P1","stock":100,"buyPrice":1000,"warehouses":[{"warehouseId":"w1","warehouseName":"Gudang A","stock":100}]}'),
   (o,'p2','{"id":"p2","code":"P2","name":"P2","stock":0,"buyPrice":800,"warehouses":[]}'),
   (o,'p3','{"id":"p3","code":"P3","name":"P3","stock":100,"buyPrice":1000,"warehouses":[{"warehouseId":"w1","warehouseName":"Gudang A","stock":100}]}');
  insert into purchase_orders(organization_id,id,data) values (o,'po1','{"id":"po1","code":"PO-1","status":"Sent","items":[
     {"productId":"p1","qty":150,"unitPrice":1300,"netPrice":1300},
     {"productId":"p2","qty":50,"unitPrice":1300,"netPrice":1300},
     {"productId":"p3","qty":150,"unitPrice":1100,"netPrice":1100}]}');
  insert into goods_receipts(organization_id,id,data) values
   (o,'gr1','{"id":"gr1","code":"GR-1","poCode":"PO-1","warehouseId":"w1","warehouseName":"Gudang A","status":"Stored","items":[
      {"productId":"p1","qtyReceived":50,"unitCost":1300},
      {"productId":"p2","qtyReceived":50,"unitCost":1300},
      {"productId":"p3","qtyReceived":50,"unitCost":1100}]}');
  perform adjust_product_stock('p1', 50, 'gr1:p1','w1','goods_receipt','gr1');
  perform adjust_product_stock('p2', 50, 'gr1:p2','w1','goods_receipt','gr1');
  perform adjust_product_stock('p3', 50, 'gr1:p3','w1','goods_receipt','gr1');
end $$;
select id, data->>'stock' stock, data->>'buyPrice' cost from products order by id;
select reverse_inventory_document('rev1','goods_receipt','gr1','Voided','uji pembalikan') ;
select id, data->>'stock' stock, data->>'buyPrice' cost from products order by id;
