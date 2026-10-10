// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const importCustomers = vi.fn();
const importProducts = vi.fn();

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    customers: [
      {
        id: 'cust-1', code: 'CUST-101', name: 'Toko Lama', group: 'Retail Modern', phone: '', address: '', city: 'Bandung',
        salespersonId: '', salespersonName: 'Unassigned', creditLimit: 0, usedCredit: 0, paymentTermId: 'pt-1',
        paymentTermName: 'NET 30', status: 'active',
      },
    ],
    salespersons: [{ id: 'sp-1', name: 'Andi', code: 'S1' }],
    paymentTerms: [{ id: 'pt-1', name: 'NET 30', code: 'N30' }],
    products: [],
    categories: [{ id: 'c1', name: 'Semen' }],
    brands: [{ id: 'b1', name: 'Merek A' }],
    uoms: [{ id: 'u1', name: 'Sak' }],
    warehouses: [{ id: 'w1', name: 'Gudang Utama' }],
    importCustomers,
    importProducts,
  }),
}));

import { CustomerImportModal } from './CustomerImportModal';
import { ProductImportModal } from './ProductImportModal';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const csvFile = (name: string, text: string) => {
  const file = new File([text], name, { type: 'text/csv' });
  // jsdom may not implement Blob.arrayBuffer
  if (typeof file.arrayBuffer !== 'function') {
    (file as any).arrayBuffer = async () => new TextEncoder().encode(text).buffer;
  }
  return file;
};

const upload = (container: HTMLElement, file: File) => {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
};

describe('Customer mass upload modal', () => {
  it('previews a file, then imports only the valid rows', async () => {
    const onClose = vi.fn();
    const { container } = render(<CustomerImportModal onClose={onClose} />);
    const csv = [
      'Kode Pelanggan;Nama Toko;Grup;Kota;Telepon',
      'CUST-200;Toko Baru Satu;Retail Modern;Cimahi;081234567890',
      ';Toko Lama;Retail Modern;Bandung;', // matches existing by name+city -> skipped
      'CUST-201;;Retail Modern;Cimahi;', // error: no name
    ].join('\n');
    upload(container, csvFile('pelanggan.csv', csv));

    await waitFor(() => expect(screen.getByText(/Baru: 1/)).toBeTruthy());
    expect(screen.getByText(/Dilewati: 1/)).toBeTruthy();
    expect(screen.getByText(/Error: 1/)).toBeTruthy();
    expect(screen.getByText('Nama Toko wajib diisi.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Impor 1 Pelanggan' }));
    expect(importCustomers).toHaveBeenCalledTimes(1);
    const items = importCustomers.mock.calls[0][0];
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ code: 'CUST-200', name: 'Toko Baru Satu', city: 'Cimahi', phone: '081234567890' });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows a clear error and keeps Impor disabled for a file with missing columns', async () => {
    const { container } = render(<CustomerImportModal onClose={() => undefined} />);
    upload(container, csvFile('salah.csv', 'Kode;Kota\nA;B'));
    await waitFor(() => expect(screen.getByText(/Kolom wajib tidak ditemukan/)).toBeTruthy());
    expect((screen.getByRole('button', { name: 'Impor' }) as HTMLButtonElement).disabled).toBe(true);
    expect(importCustomers).not.toHaveBeenCalled();
  });

  it('rejects non-CSV files', async () => {
    const { container } = render(<CustomerImportModal onClose={() => undefined} />);
    upload(container, csvFile('data.xlsx', 'x'));
    await waitFor(() => expect(screen.getByText(/Format file harus CSV/)).toBeTruthy());
  });

  it('switching to Perbarui re-evaluates the existing customer', async () => {
    const { container } = render(<CustomerImportModal onClose={() => undefined} />);
    upload(container, csvFile('p.csv', 'Nama Toko;Grup;Kota;Alamat\nToko Lama;Retail Modern;Bandung;Jl. Baru 1'));
    await waitFor(() => expect(screen.getByText(/Dilewati: 1/)).toBeTruthy());
    fireEvent.click(screen.getByLabelText(/Perbarui/));
    await waitFor(() => expect(screen.getByText(/Perbarui: 1/)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Impor 1 Pelanggan' }));
    expect(importCustomers.mock.calls[0][0][0]).toMatchObject({ id: 'cust-1', address: 'Jl. Baru 1' });
  });
});

describe('Product mass upload modal', () => {
  it('imports valid products and reports unknown master values', async () => {
    const { container } = render(<ProductImportModal onClose={() => undefined} />);
    const csv = [
      'Kode Produk;Nama Produk;Kategori;Merek;Satuan;Harga Beli;Harga Jual;Stok Awal',
      'P-1;Semen A;Semen;Merek A;Sak;45.000;52000;100',
      'P-2;Cat X;Cat;Merek A;Sak;1;2;3', // unknown category
    ].join('\r\n');
    upload(container, csvFile('produk.csv', csv));
    await waitFor(() => expect(screen.getByText(/Baru: 1/)).toBeTruthy());
    expect(screen.getByText(/Kategori "Cat" belum ada di Master Kategori/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Impor 1 Produk' }));
    const items = importProducts.mock.calls[0][0];
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ code: 'P-1', buyPrice: 45000, sellPrice: 52000, stock: 100 });
  });
});
