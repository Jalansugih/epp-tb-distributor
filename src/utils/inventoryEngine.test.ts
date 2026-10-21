import { describe, expect, it } from 'vitest';
import {
  calculateCogs,
  calculateDeliveryStock,
  calculateGoodsReceiptStock,
  calculateReservedByProduct,
  getProductMinimumStock,
  getStockStatus,
  needsRestock,
  calculateMovingAverageCost,
  reverseMovingAverageCost,
} from './inventoryEngine';
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

describe('calculateReservedByProduct', () => {
  it('reserves Approved and Submitted orders still waiting for delivery (shipped stock is already deducted)', () => {
    const reserved = calculateReservedByProduct([
      { status: 'Approved', deliveryStatus: 'Pending', items: [{ productCode: 'A', qty: 5 }] },
      { status: 'Approved', deliveryStatus: 'Pending', items: [{ productCode: 'A', qty: 2 }, { productCode: 'B', qty: 1 }] },
      { status: 'Processing', deliveryStatus: 'Shipped', items: [{ productCode: 'A', qty: 100 }] },
      { status: 'Completed', deliveryStatus: 'Shipped', items: [{ productCode: 'A', qty: 100 }] },
      { status: 'Submitted', deliveryStatus: 'Pending', items: [{ productCode: 'A', qty: 100 }] },
    ]);
    expect(reserved).toEqual({ A: 107, B: 1 });
  });

  it('ignores Draft and Cancelled orders and treats a missing deliveryStatus as Pending', () => {
    const reserved = calculateReservedByProduct([
      { status: 'Draft', deliveryStatus: 'Pending', items: [{ productCode: 'A', qty: 9 }] },
      { status: 'Cancelled', deliveryStatus: 'Pending', items: [{ productCode: 'A', qty: 9 }] },
      { status: 'Approved', items: [{ productCode: 'A', qty: 3 }] },
    ]);
    expect(reserved).toEqual({ A: 3 });
  });
});

describe('minimum stock and stock status', () => {
  it('treats empty/invalid minStock as 0 without turning an explicit 0 into a default', () => {
    expect(getProductMinimumStock(0)).toBe(0);
    expect(getProductMinimumStock(undefined)).toBe(0);
    expect(getProductMinimumStock(null)).toBe(0);
    expect(getProductMinimumStock(NaN)).toBe(0);
    expect(getProductMinimumStock(-5)).toBe(0);
    expect(getProductMinimumStock(25)).toBe(25);
  });

  it('classifies out / low / normal consistently', () => {
    expect(getStockStatus(0, 10)).toBe('out');
    expect(getStockStatus(-3, 10)).toBe('out');
    expect(getStockStatus(undefined, 10)).toBe('out');
    expect(getStockStatus(10, 10)).toBe('low');
    expect(getStockStatus(4, 10)).toBe('low');
    expect(getStockStatus(11, 10)).toBe('normal');
    // minStock 0 is not "50": a product with stock 5 is normal
    expect(getStockStatus(5, 0)).toBe('normal');
    expect(getStockStatus(5, undefined)).toBe('normal');
  });

  it('needsRestock includes both low and out-of-stock products', () => {
    expect(needsRestock(0, 10)).toBe(true);
    expect(needsRestock(0, 0)).toBe(true);
    expect(needsRestock(7, 10)).toBe(true);
    expect(needsRestock(11, 10)).toBe(false);
    expect(needsRestock(5, 0)).toBe(false);
  });
});

describe('moving average cost', () => {
  it('blends the incoming cost into the existing balance', () => {
    // 100 @ 1.000 + 50 @ 1.300 = 165.000 / 150
    expect(calculateMovingAverageCost(100, 1000, 50, 1300)).toBe(1100);
  });

  it('takes the incoming cost when nothing was on hand, and ignores negative stock', () => {
    expect(calculateMovingAverageCost(0, 1000, 40, 1500)).toBe(1500);
    expect(calculateMovingAverageCost(-10, 1000, 40, 1500)).toBe(1500);
  });

  it('keeps the last cost when nothing is received and nothing is on hand', () => {
    expect(calculateMovingAverageCost(0, 1234, 0, 0)).toBe(1234);
  });

  it('rounds the average to 2 decimals instead of carrying long fractions', () => {
    // (100*1000 + 50*1100) / 150 = 1033,3333...
    expect(calculateMovingAverageCost(100, 1000, 50, 1100)).toBe(1033.33);
  });

  it('reversing a receipt restores the previous average', () => {
    const after = calculateMovingAverageCost(100, 1000, 50, 1300); // 1100 on 150
    expect(reverseMovingAverageCost(150, after, 50, 1300)).toBe(1000);
  });

  it('keeps the last known cost when a reversal empties the stock', () => {
    expect(reverseMovingAverageCost(50, 1300, 50, 1300)).toBe(1300);
  });
});

describe('calculateCogs', () => {
  const products = [{ id: 'p1', code: 'A', buyPrice: 1033.33 }] as any;

  it('prefers the frozen unitCost snapshot over the current product cost', () => {
    expect(calculateCogs(products, [{ productId: 'p1', productCode: 'A', qty: 10, unitCost: 900 }])).toBe(9000);
  });

  it('falls back to the product cost and returns whole rupiah', () => {
    // 7 x 1033,33 = 7233,31 -> 7233
    expect(calculateCogs(products, [{ productId: 'p1', productCode: 'A', qty: 7 }])).toBe(7233);
  });
});
