// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const addSupplier = vi.fn();
const updateSupplier = vi.fn();
const deleteSupplier = vi.fn();
let existing: { id: string; code: string; name: string; category: string; city: string; contactPerson: string }[] = [];

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    suppliers: existing,
    paymentTerms: [{ id: 'pt-1', name: 'NET 45', code: 'N45' }],
    purchaseOrders: [],
    payables: [],
    addSupplier,
    updateSupplier,
    deleteSupplier,
  }),
}));

import { SupplierMaster } from './SupplierMaster';

afterEach(() => { cleanup(); vi.clearAllMocks(); existing = []; });

const open = () => {
  const view = render(<SupplierMaster />);
  fireEvent.click(screen.getByText('+ Tambah Pabrik / Supplier'));
  const form = view.container.querySelector('form') as HTMLFormElement;
  const inputs = Array.from(form.querySelectorAll('input[type=text]')) as HTMLInputElement[];
  const name = inputs.find((i) => i.placeholder.startsWith('Contoh'))!;
  const city = inputs.find((i) => i.required && !i.placeholder && i.value === '')!;
  return { form, inputs, name, city };
};

describe('SupplierMaster add flow', () => {
  it('has a valid category by default, so only name and city must be typed', () => {
    const { form, name, city } = open();
    fireEvent.change(name, { target: { value: 'PT Test Pabrik' } });
    fireEvent.change(city, { target: { value: 'Bandung' } });
    expect(form.checkValidity()).toBe(true);
    fireEvent.click(screen.getByText('Tambah Supplier'));
    expect(addSupplier).toHaveBeenCalledTimes(1);
    expect(addSupplier.mock.calls[0][0]).toMatchObject({ name: 'PT Test Pabrik', city: 'Bandung', category: 'Semen & Pasir', code: 'SUPP-101' });
  });

  it('never reuses a code, even if suppliers were deleted before', () => {
    existing = [
      { id: 'a', code: 'SUPP-101', name: 'A', category: 'x', city: 'x', contactPerson: '' },
      { id: 'b', code: 'SUPP-105', name: 'B', category: 'x', city: 'x', contactPerson: '' },
    ];
    const { inputs } = open();
    expect(inputs[0].value).toBe('SUPP-106');
  });

  it('keeps the form open and explains when the code is already used', () => {
    existing = [{ id: 'a', code: 'SUPP-101', name: 'A', category: 'x', city: 'x', contactPerson: '' }];
    const { inputs, name, city } = open();
    fireEvent.change(inputs[0], { target: { value: 'supp-101' } });
    fireEvent.change(name, { target: { value: 'PT Lain' } });
    fireEvent.change(city, { target: { value: 'Bogor' } });
    fireEvent.click(screen.getByText('Tambah Supplier'));
    expect(addSupplier).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('sudah dipakai');
  });
});
