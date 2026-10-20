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
  persist: vi.fn(),
}));
vi.mock('./AuthContext', () => ({
  useAuth: () => ({ profile: { id: 'u1', full_name: 'Admin Test', role: 'admin' }, user: { id: 'u1' } }),
}));

import { AppProvider, useApp } from './AppContext';
import { applyStockChanges } from '../lib/db';

const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;

function setup() {
  const hook = renderHook(() => useApp(), { wrapper });
  const app = () => hook.result.current;
  act(() =>
    app().addProduct({
      id: 'prod-inv', code: 'PRD-I1', sku: 'PRD-I1', barcode: '', name: 'Cat Test', category: 'Cat', brand: 'X',
      uom: 'Kaleng', buyPrice: 1000, sellPrice: 1500, stock: 20, minStock: 1, warehouseId: 'w1', warehouseName: 'Gudang A',
    } as any)
  );
  const adj = (n: number, type: 'Increase' | 'Decrease', qty: number) => ({
    id: `adj-${n}`, adjustmentNo: `ADJ/${n}`, date: '2026-10-18', type, warehouseId: 'w1', warehouseName: 'Gudang A',
    productId: 'prod-inv', productCode: 'PRD-I1', productName: 'Cat Test', uom: 'Kaleng', qty, reason: 'opname', reference: '', user: 'Admin Test',
  });
  const stock = () => app().products.find((p) => p.id === 'prod-inv')!.stock;
  return { app, adj, stock };
}

describe('stock adjustment', () => {
  it('rejects zero/negative quantities and duplicate document numbers', () => {
    const t = setup();
    act(() => t.app().addStockAdjustment(t.adj(1, 'Increase', -5))); // sebelumnya malah mengurangi stok
    act(() => t.app().addStockAdjustment(t.adj(2, 'Increase', 0)));
    expect(t.stock()).toBe(20);

    act(() => t.app().addStockAdjustment(t.adj(3, 'Increase', 5)));
    expect(t.stock()).toBe(25);
    act(() => t.app().addStockAdjustment(t.adj(3, 'Increase', 5))); // dobel klik / nomor sama
    expect(t.stock()).toBe(25);

    act(() => t.app().addStockAdjustment(t.adj(4, 'Decrease', 999))); // melebihi stok
    expect(t.stock()).toBe(25);
  });
});

describe('stock persistence', () => {
  it('sends a delta + idempotency ref to the server instead of overwriting the product row', () => {
    const t = setup();
    vi.mocked(applyStockChanges).mockClear();
    act(() => t.app().addStockAdjustment(t.adj(7, 'Decrease', 4)));
    expect(applyStockChanges).toHaveBeenCalledWith([{ productId: 'prod-inv', delta: -4, ref: 'ADJ/7:prod-inv' }]);
  });
});

describe('stock transfer', () => {
  const transfer = (over: Record<string, unknown> = {}) => ({
    id: 'st-1', transferNo: 'TRF/1', date: '2026-10-18', fromWarehouseId: 'w1', fromWarehouseName: 'Gudang A',
    toWarehouseId: 'w2', toWarehouseName: 'Gudang B', status: 'Draft', createdUser: 'Admin Test',
    items: [{ productId: 'prod-inv', productCode: 'PRD-I1', productName: 'Cat Test', uom: 'Kaleng', qty: 3 }],
    ...over,
  }) as any;

  it('rejects same-warehouse and empty/zero-quantity transfers', () => {
    const t = setup();
    act(() => t.app().addStockTransfer(transfer({ toWarehouseName: 'Gudang A' })));
    act(() => t.app().addStockTransfer(transfer({ id: 'st-2', transferNo: 'TRF/2', items: [] })));
    act(() => t.app().addStockTransfer(transfer({ id: 'st-3', transferNo: 'TRF/3', items: [{ productId: 'prod-inv', productCode: 'PRD-I1', productName: 'Cat Test', uom: 'Kaleng', qty: 0 }] })));
    expect(t.app().stockTransfers).toHaveLength(0);
    act(() => t.app().addStockTransfer(transfer()));
    expect(t.app().stockTransfers).toHaveLength(1);
  });

  it('logs both the outgoing and incoming movement even when status jumps straight to Received', () => {
    const t = setup();
    act(() => t.app().addStockTransfer(transfer()));
    act(() => t.app().updateStockTransferStatus('st-1', 'Received'));
    const moves = t.app().stockMovements.filter((m) => m.documentNo === 'TRF/1');
    expect(moves.map((m) => [m.qtyOut, m.qtyIn]).sort()).toEqual([[0, 3], [3, 0]]);
  });
});
