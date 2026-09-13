import type { Product, SalesOrderItem } from '../types';

export type StockDelta = {
  productId: string;
  productCode: string;
  qty: number;
  newStock: number;
};

/**
 * Calculates receipt stock increases without mutating source products.
 */
export function calculateGoodsReceiptStock(
  products: Product[],
  items: Array<{ productId: string; productCode: string; qtyReceived: number }>
): StockDelta[] {
  const deltas = new Map<string, number>();
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId || p.code === item.productCode);
    if (!product) throw new Error(`PRODUCT_NOT_FOUND:${item.productCode}`);
    deltas.set(product.id, (deltas.get(product.id) || 0) + Math.max(0, item.qtyReceived));
  }
  return products
    .filter((p) => deltas.has(p.id))
    .map((p) => ({
      productId: p.id,
      productCode: p.code,
      qty: deltas.get(p.id) || 0,
      newStock: p.stock + (deltas.get(p.id) || 0),
    }));
}

/**
 * Validates a complete delivery and calculates the stock after shipment.
 * Throws before any mutation when requested stock is unavailable.
 */
export function calculateDeliveryStock(
  products: Product[],
  items: Array<{ productId: string; productCode: string; qty: number }>
): StockDelta[] {
  const requested = new Map<string, number>();
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId || p.code === item.productCode);
    if (!product) throw new Error(`PRODUCT_NOT_FOUND:${item.productCode}`);
    requested.set(product.id, (requested.get(product.id) || 0) + Math.max(0, item.qty));
  }
  return products
    .filter((p) => requested.has(p.id))
    .map((p) => {
      const qty = requested.get(p.id) || 0;
      if (p.stock < qty) throw new Error(`INSUFFICIENT_STOCK:${p.code}:${p.stock}:${qty}`);
      return { productId: p.id, productCode: p.code, qty, newStock: p.stock - qty };
    });
}

export function calculateCogs(
  products: Product[],
  items: Pick<SalesOrderItem, 'productId' | 'productCode' | 'qty'>[]
): number {
  return items.reduce((total, item) => {
    const product = products.find((p) => p.id === item.productId || p.code === item.productCode);
    return total + Math.max(0, item.qty) * Math.max(0, product?.buyPrice ?? 0);
  }, 0);
}
