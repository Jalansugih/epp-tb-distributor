import type { Product, SalesOrderItem } from '../types';

export type StockDelta = {
  productId: string;
  productCode: string;
  qty: number;
  newStock: number;
};

export type ProductWarehouseStock = { warehouseId: string; warehouseName: string; stock: number };
export type StockStatus = 'out' | 'low' | 'normal';

/** Normalize legacy/empty minimum stock values to zero without overriding explicit 0. */
export function getProductMinimumStock(minStock: number | null | undefined): number {
  const value = Number(minStock);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/** Shared stock classification used by the product master, inventory, and reports. */
export function getStockStatus(stock: number | null | undefined, minStock: number | null | undefined): StockStatus {
  const onHand = Number(stock);
  if (!Number.isFinite(onHand) || onHand <= 0) return 'out';
  return onHand <= getProductMinimumStock(minStock) ? 'low' : 'normal';
}

/** Moving-average inventory cost after a receipt at the PO's net unit cost. */
export function calculateMovingAverageCost(
  currentStock: number,
  currentUnitCost: number,
  receivedQty: number,
  receivedUnitCost: number,
): number {
  const oldQty = Math.max(0, Number(currentStock) || 0);
  const oldCost = Math.max(0, Number(currentUnitCost) || 0);
  const incomingQty = Math.max(0, Number(receivedQty) || 0);
  const incomingCost = Math.max(0, Number(receivedUnitCost) || 0);
  const totalQty = oldQty + incomingQty;
  if (totalQty === 0) return 0;
  return (oldQty * oldCost + incomingQty * incomingCost) / totalQty;
}

/** Remove returned/voided GR value from a moving-average inventory balance. */
export function reverseMovingAverageCost(
  currentStock: number,
  currentUnitCost: number,
  returnedQty: number,
  returnedUnitCost: number,
): number {
  const oldQty = Math.max(0, Number(currentStock) || 0);
  const oldCost = Math.max(0, Number(currentUnitCost) || 0);
  const removeQty = Math.max(0, Number(returnedQty) || 0);
  const removeCost = Math.max(0, Number(returnedUnitCost) || 0);
  const remainingQty = Math.max(0, oldQty - removeQty);
  if (remainingQty === 0) return 0;
  return Math.max(0, oldQty * oldCost - removeQty * removeCost) / remainingQty;
}

/** Read a warehouse allocation, falling back to the legacy single-warehouse fields. */
export function getWarehouseStock(product: Product, warehouseId: string): number {
  if (!warehouseId) return 0;
  const allocation = product.warehouses?.find((item: ProductWarehouseStock) => item.warehouseId === warehouseId);
  if (allocation) return Math.max(0, Number(allocation.stock) || 0);
  if (product.warehouses?.length) return 0;
  return product.warehouseId === warehouseId ? Math.max(0, Number(product.stock) || 0) : 0;
}

/** Return a product with one warehouse allocation changed, leaving total stock untouched. */
export function changeWarehouseStock(
  product: Product,
  warehouseId: string,
  warehouseName: string,
  delta: number,
): Product {
  const allocations: ProductWarehouseStock[] = (product.warehouses ?? []).map((item: ProductWarehouseStock) => ({
    warehouseId: item.warehouseId,
    warehouseName: item.warehouseName,
    stock: Math.max(0, Number(item.stock) || 0),
  }));
  const index = allocations.findIndex((item) => item.warehouseId === warehouseId);
  if (index >= 0) {
    allocations[index] = { ...allocations[index], warehouseName, stock: allocations[index].stock + delta };
  } else {
    allocations.push({ warehouseId, warehouseName, stock: Math.max(0, getWarehouseStock(product, warehouseId) + delta) });
  }
  return { ...product, warehouses: allocations };
}

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
  items: (Pick<SalesOrderItem, 'productId' | 'productCode' | 'qty'> & { unitCost?: number })[]
): number {
  return items.reduce((total, item) => {
    const product = products.find((p) => p.id === item.productId || p.code === item.productCode);
    const unitCost = item.unitCost ?? product?.buyPrice ?? 0;
    return total + Math.max(0, item.qty) * Math.max(0, Number(unitCost) || 0);
  }, 0);
}

/**
 * Quantity promised to customers but not yet shipped, keyed by product code.
 * Approved and submitted orders still waiting for a delivery count: once the Surat Jalan
 * is made the stock has already been deducted (and the SO is "Processing"),
 * so counting it again would subtract the same goods twice from "available".
 */
export function calculateReservedByProduct(
  salesOrders: Array<{ status: string; deliveryStatus?: string; items: Array<{ productCode: string; qty: number }> }>
): Record<string, number> {
  const reserved: Record<string, number> = {};
  for (const so of salesOrders) {
    if (!['Approved', 'Submitted'].includes(so.status) || (so.deliveryStatus && so.deliveryStatus !== 'Pending')) continue;
    for (const item of so.items) {
      reserved[item.productCode] = (reserved[item.productCode] || 0) + Math.max(0, item.qty);
    }
  }
  return reserved;
}
