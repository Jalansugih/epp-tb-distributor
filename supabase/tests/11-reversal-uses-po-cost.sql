\set ON_ERROR_STOP on
do $$
declare o uuid; u uuid;
begin
  select organization_id, id into o,u from profiles where role='Admin' limit 1;
  perform set_config('request.jwt.claim.sub', u::text, false);
  perform set_config('request.jwt.claim.role','authenticated', false);
  insert into goods_receipts(organization_id,id,data) values
   (o,'gr2','{"id":"gr2","code":"GR-2","poCode":"PO-1","warehouseId":"w1","warehouseName":"Gudang A","status":"Stored","items":[
      {"productId":"p1","qtyReceived":50,"unitCost":1300}]}');
  perform adjust_product_stock('p1', 50, 'gr2:p1','w1','goods_receipt','gr2');
  -- manipulasi: unitCost di dokumen GR diubah klien setelah posting
  update goods_receipts set data = jsonb_set(data,'{items,0,unitCost}','5') where id='gr2';
end $$;
select 'sesudah GR2' k, data->>'stock' stock, data->>'buyPrice' cost from products where id='p1';
select 1 from reverse_inventory_document('rev2','goods_receipt','gr2','Voided','uji manipulasi');
select 'sesudah reversal GR2' k, data->>'stock' stock, data->>'buyPrice' cost from products where id='p1';
