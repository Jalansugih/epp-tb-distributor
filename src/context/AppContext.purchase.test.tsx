// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

vi.mock('../lib/supabaseClient', () => ({ isSupabaseConfigured: false, supabase: null }));
vi.mock('../lib/db', () => ({
  fetchTable: vi.fn(async () => []),
  upsertRow: vi.fn(),
  upsertRowsInChunks: vi.fn(),
  deleteRow: vi.fn(),
  deleteAllRows: vi.fn(),
  applyStockChanges: vi.fn(async () => {}),
  createProductsWithOpeningStock: vi.fn(async () => {}),
  persist: vi.fn(),
}));
vi.mock('./AuthContext', () => ({
  useAuth: () => ({ profile: { id: 'u1', full_name: 'Admin Test', role: 'admin' }, user: { id: 'u1' } }),
}));

import { AppProvider, useApp } from './AppContext';
import type { GoodsReceipt, PurchaseInvoice, PurchaseOrder } from '../types';

const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;

function setup() {
  const hook = renderHook(() => useApp(), { wrapper });
  const app = () => hook.result.current;
  act(() => {
    app().addWarehouse({ id: 'w1', code: 'GU', name: 'Gudang Utama', address: '-' } as any);
  });
  act(() =>
    app().addProduct({
      id: 'prod-test', code: 'PRD-T1', sku: 'PRD-T1', barcode: '', name: 'Semen Test 50kg', category: 'Semen', brand: 'Tiga',
      uom: 'Sak', buyPrice: 1000, sellPrice: 1500, stock: 100, minStock: 5, warehouseId: 'w1', warehouseName: 'Gudang Utama',
    } as any)
  );
  const product = app().products.find((p) => p.id === 'prod-test')!;
  const supplier = { id: 'sup-test', name: 'PT Supplier Test' };
  const po: PurchaseOrder = {
    id: 'po-test',
    code: 'PO/TEST/0001',
    date: '2026-10-18',
    dueDate: '2026-11-17',
    supplierId: supplier.id,
    supplierName: supplier.name,
    warehouseName: 'Gudang Utama',
    paymentTermName: 'NET 30',
    buyerName: 'Admin Test',
    items: [{ productId: product.id, productCode: product.code, productName: product.name, uom: product.uom, qty: 10, unitPrice: 1000, discounts: [], netPrice: 1000, subtotal: 10000 }],
    subtotal: 10000,
    taxAmount: 1100,
    totalAmount: 11100,
    status: 'Sent',
    paymentStatus: 'Unpaid',
    paidAmount: 0,
    receiptStatus: 'Pending',
  };
  act(() => app().addPurchaseOrder(po));
  const gr = (n: number, qty: number, poCode = po.code): GoodsReceipt => ({
    id: `gr-${n}`,
    code: `GR/TEST/${n}`,
    poCode,
    date: '2026-10-18',
    supplierName: supplier.name,
    warehouseName: 'Gudang Utama',
    receivedBy: 'Admin Test',
    status: 'Stored',
    items: [{ productId: product.id, productCode: product.code, productName: product.name, uom: product.uom, qtyOrdered: 10, qtyReceived: qty }],
  });
  const receive = (g: GoodsReceipt) => {
    let ok = false;
    act(() => { ok = app().addGoodsReceipt(g); });
    return ok;
  };
  const invoice = (n: number, supplierInvoiceNo = `SUP-${n}`): PurchaseInvoice => ({
    id: `pinv-${n}`, code: `PINV/TEST/${n}`, poCode: po.code, supplierInvoiceNo, date: '2026-10-18', dueDate: '2026-11-17',
    supplierId: supplier.id, supplierName: supplier.name, paymentTermName: 'NET 30', items: po.items,
    subtotal: 10000, taxAmount: 1100, totalAmount: 11100, paidAmount: 0, remainingAmount: 11100,
    paymentStatus: 'Unpaid', status: 'Issued',
  });
  const stock = () => app().products.find((p) => p.id === product.id)!.stock;
  const currentPO = () => app().purchaseOrders.find((p) => p.id === po.id)!;
  return { app, po, gr, receive, invoice, stock, currentPO, hook };
}

describe('purchase flow: PO -> goods receipt -> invoice', () => {
  it('records partial receipts, blocks over-receiving, and completes the PO when fully received', () => {
    const t = setup();
    const start = t.stock();

    expect(t.receive(t.gr(1, 4))).toBe(true);
    expect(t.currentPO()).toMatchObject({ status: 'Sent', receiptStatus: 'Partial' });
    expect(t.stock()).toBe(start + 4);

    expect(t.receive(t.gr(2, 7))).toBe(false); // 4 + 7 > 10
    expect(t.stock()).toBe(start + 4);

    expect(t.receive(t.gr(3, 6))).toBe(true);
    expect(t.currentPO()).toMatchObject({ status: 'Received', receiptStatus: 'Full' });
    expect(t.stock()).toBe(start + 10);

    expect(t.receive(t.gr(4, 1))).toBe(false); // PO sudah penuh, tidak boleh dobel
    expect(t.stock()).toBe(start + 10);
  });

  it('rejects receipts for a Draft PO and receipts with zero quantity', () => {
    const t = setup();
    act(() => t.app().updatePOStatus(t.po.id, 'Draft'));
    expect(t.receive(t.gr(1, 5))).toBe(false);
    act(() => t.app().updatePOStatus(t.po.id, 'Sent'));
    expect(t.receive(t.gr(2, 0))).toBe(false);
  });

  it('only allows one purchase invoice, and only after the goods are fully received', () => {
    const t = setup();
    let ok = false;
    act(() => { ok = t.app().addPurchaseInvoice(t.invoice(1)); });
    expect(ok).toBe(false); // belum diterima

    t.receive(t.gr(1, 10));
    act(() => { ok = t.app().addPurchaseInvoice(t.invoice(1)); });
    expect(ok).toBe(true);
    expect(t.currentPO().status).toBe('Invoiced');
    expect(t.app().payables.some((p) => p.invoiceNo === 'SUP-1' && p.outstanding === 11100)).toBe(true);

    act(() => { ok = t.app().addPurchaseInvoice(t.invoice(2, 'SUP-2')); });
    expect(ok).toBe(false); // PO sudah punya faktur
  });
});
