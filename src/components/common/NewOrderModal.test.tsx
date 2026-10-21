// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

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
  salesOrders: [] as any[],
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
  it('can submit an SO even when products finish loading AFTER the modal mounted', async () => {
    state = base();
    const view = render(<NewOrderModal />);
    // produk baru datang dari database setelah modal sudah ter-mount
    state = { ...base(), products: [product] };
    view.rerender(<NewOrderModal />);

    fireEvent.submit(view.container.querySelector('form') as HTMLFormElement);

    expect(addToast).not.toHaveBeenCalledWith(expect.stringContaining('belum memilih produk'), expect.anything());
    await waitFor(() => expect(addSalesOrder).toHaveBeenCalledTimes(1));
    const so = addSalesOrder.mock.calls[0][0];
    expect(so).toMatchObject({ status: 'Approved', deliveryStatus: 'Pending', warehouseName: 'Gudang Utama', address: 'Jl. Merdeka 1' });
    expect(so.items[0]).toMatchObject({ productId: 'p1', qty: 100 });
  });

  const submit = (view: ReturnType<typeof render>) =>
    fireEvent.submit(view.container.querySelector('form') as HTMLFormElement);

  it('blocks an SO when on-hand stock is below the requested qty', () => {
    state = { ...base(), products: [{ ...product, stock: 80 }] };
    const view = render(<NewOrderModal />);
    submit(view);
    expect(addSalesOrder).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledWith(expect.stringContaining('Stok tidak cukup'), 'warning');
  });

  it('subtracts quantities reserved by other open SOs from available stock', () => {
    state = {
      ...base(),
      products: [{ ...product, stock: 500 }],
      salesOrders: [
        { status: 'Approved', deliveryStatus: 'Pending', items: [{ productCode: 'PRD-1', qty: 450 }] },
        { status: 'Submitted', deliveryStatus: 'Pending', items: [{ productCode: 'PRD-1', qty: 0 }] },
      ],
    };
    const view = render(<NewOrderModal />);
    submit(view);
    expect(addSalesOrder).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledWith(expect.stringContaining('tersedia 50, diminta 100'), 'warning');
  });

  it('ignores reservations from shipped orders (stock already deducted)', async () => {
    state = {
      ...base(),
      products: [{ ...product, stock: 500 }],
      salesOrders: [{ status: 'Processing', deliveryStatus: 'Shipped', items: [{ productCode: 'PRD-1', qty: 450 }] }],
    };
    const view = render(<NewOrderModal />);
    submit(view);
    await waitFor(() => expect(addSalesOrder).toHaveBeenCalledTimes(1));
  });

  it('sums duplicate lines of the same product before checking stock', () => {
    // 100 (baris default) + 50 (baris tambahan) = 150 > 120
    state = { ...base(), products: [{ ...product, stock: 120 }] };
    const view = render(<NewOrderModal />);
    fireEvent.click(screen.getByText('Tambah Material'));
    submit(view);
    expect(addSalesOrder).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledWith(expect.stringContaining('tersedia 120, diminta 150'), 'warning');
  });
});
