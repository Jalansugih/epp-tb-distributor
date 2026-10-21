// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

// Database yang "terhubung": nomor dokumen kembar dari perangkat lain membuat upsert ditolak server.
vi.mock('../lib/supabaseClient', () => ({ isSupabaseConfigured: true, supabase: {} }));
const serverProduct = {
  id: 'prod-inv', code: 'PRD-I1', sku: 'PRD-I1', barcode: '', name: 'Cat Test', category: 'Cat', brand: 'X',
  uom: 'Kaleng', buyPrice: 1000, sellPrice: 1500, stock: 20, minStock: 1, warehouseId: 'w1', warehouseName: 'Gudang A',
  warehouses: [{ warehouseId: 'w1', warehouseName: 'Gudang A', stock: 20 }],
};
const serverWarehouse = { id: 'w1', code: 'GA', name: 'Gudang A', address: '-' };

vi.mock('../lib/db', () => ({
  fetchTable: vi.fn(async (table: string) => {
    if (table === 'products') return [serverProduct];
    if (table === 'warehouses') return [serverWarehouse];
    return [];
  }),
  upsertRow: vi.fn(async (table: string) => {
    if (table === 'stock_adjustments') throw new Error('duplicate key value violates unique constraint "uq_document_code"');
  }),
  upsertRowsInChunks: vi.fn(),
  deleteRow: vi.fn(),
  deleteAllRows: vi.fn(),
  applyStockChanges: vi.fn(async () => {}),
  createProductsWithOpeningStock: vi.fn(async () => {}),
  applyStockTransfer: vi.fn(async () => {}),
  // sama seperti persist asli: error dari server diteruskan ke handler
  persist: (promise: Promise<void>, onError: (m: string) => void) => {
    promise.catch((err) => onError(err instanceof Error ? err.message : 'gagal'));
  },
}));
vi.mock('./AuthContext', () => ({
  useAuth: () => ({ profile: { id: 'u1', full_name: 'Admin Test', role: 'admin' }, user: { id: 'u1' } }),
}));

import { AppProvider, useApp } from './AppContext';
import { applyStockChanges } from '../lib/db';

const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;

describe('stock document rejected by the server', () => {
  it('rolls the on-screen stock back to the database value instead of keeping a phantom increase', async () => {
    const hook = renderHook(() => useApp(), { wrapper });
    const app = () => hook.result.current;
    await waitFor(() => expect(app().products.find((p) => p.id === 'prod-inv')?.stock).toBe(20));

    act(() => app().addStockAdjustment({
      id: 'adj-9', adjustmentNo: 'ADJ/2026/10/0009', date: '2026-10-21', type: 'Increase', warehouseId: 'w1', warehouseName: 'Gudang A',
      productId: 'prod-inv', productCode: 'PRD-I1', productName: 'Cat Test', uom: 'Kaleng', qty: 5, reason: 'opname', reference: '', user: 'Admin Test',
    } as any));

    // server menolak dokumen -> layar kembali ke 20, RPC stok tidak pernah dipanggil
    await waitFor(() => expect(app().products.find((p) => p.id === 'prod-inv')?.stock).toBe(20));
    expect(applyStockChanges).not.toHaveBeenCalled();
  });
});
