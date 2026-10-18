// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';

const addSalesOrder = vi.fn();
const addToast = vi.fn();
const setNewOrderModalOpen = vi.fn();

const customer = { id: 'c1', code: 'C-1', name: 'Toko Maju', address: 'Jl. Merdeka 1', creditLimit: 1_000_000_000 };
const product = { id: 'p1', code: 'PRD-1', name: 'Semen 50kg', series: '', brand: 'Tiga', uom: 'Sak', sellPrice: 60000, minOrder: 1, stock: 500 };
let state: any;

vi.mock('../../context/AppContext', () => ({ useApp: () => state }));
vi.mock('../../context/LanguageContext', () => ({ useLanguage: () => ({ t: (k: string) => k }) }));

import { NewOrderModal } from './NewOrderModal';

const base = () => ({
  isNewOrderModalOpen: true,
  setNewOrderModalOpen,
  customers: [customer],
  products: [] as any[],
  paymentTerms: [{ id: 'pt1', name: 'NET 30' }],
  salespersons: [{ id: 's1', name: 'Budi', area: 'Bandung' }],
  warehouses: [{ id: 'w1', name: 'Gudang Utama', code: 'GU' }],
  addSalesOrder,
  addQuotation: vi.fn(),
  addToast,
  getCustomerOutstanding: () => 0,
  systemSettings: { taxRate: 11 },
});

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('NewOrderModal', () => {
  it('can submit an SO even when products finish loading AFTER the modal mounted', () => {
    state = base();
    const view = render(<NewOrderModal />);
    // produk baru datang dari database setelah modal sudah ter-mount
    state = { ...base(), products: [product] };
    view.rerender(<NewOrderModal />);

    fireEvent.submit(view.container.querySelector('form') as HTMLFormElement);

    expect(addToast).not.toHaveBeenCalledWith(expect.stringContaining('belum memilih produk'), expect.anything());
    expect(addSalesOrder).toHaveBeenCalledTimes(1);
    const so = addSalesOrder.mock.calls[0][0];
    expect(so).toMatchObject({ status: 'Approved', deliveryStatus: 'Pending', warehouseName: 'Gudang Utama', address: 'Jl. Merdeka 1' });
    expect(so.items[0]).toMatchObject({ productId: 'p1', qty: 100 });
  });
});
