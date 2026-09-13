import { describe, expect, it } from 'vitest';
import { calculateCogs, calculateDeliveryStock, calculateGoodsReceiptStock } from './inventoryEngine';
import type { Product } from '../types';

const product = (stock: number, buyPrice = 10000): Product => ({
  id: 'p1', code: 'BRG-001', sku: 'SKU-1', barcode: '123',
  name: 'Barang', category: 'cat', brand: 'brand', uom: 'PCS',
  buyPrice, sellPrice: 15000, stock, minStock: 1, warehouseId: 'w1',
  warehouseName: 'Gudang',
});

describe('inventory engine', () => {
  it('adds goods receipt quantity to stock', () => {
    expect(calculateGoodsReceiptStock([product(10)], [{ productId: 'p1', productCode: 'BRG-001', qtyReceived: 5 }])[0].newStock).toBe(15);
  });
  it('rejects delivery that would make stock negative', () => {
    expect(() => calculateDeliveryStock([product(10)], [{ productId: 'p1', productCode: 'BRG-001', qty: 11 }])).toThrow('INSUFFICIENT_STOCK');
  });
  it('aggregates duplicate delivery lines before validation', () => {
    expect(calculateDeliveryStock([product(10)], [
      { productId: 'p1', productCode: 'BRG-001', qty: 4 },
      { productId: 'p1', productCode: 'BRG-001', qty: 3 },
    ])[0].newStock).toBe(3);
  });
  it('calculates COGS from product purchase cost', () => {
    expect(calculateCogs([product(10, 12500)], [{ productId: 'p1', productCode: 'BRG-001', qty: 4 }])).toBe(50000);
  });
});
