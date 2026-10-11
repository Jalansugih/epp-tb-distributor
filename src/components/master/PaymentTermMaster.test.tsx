// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const addPaymentTerm = vi.fn();
const updatePaymentTerm = vi.fn();
const deletePaymentTerm = vi.fn();
let customers: { paymentTermId: string }[] = [];

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    paymentTerms: [{ id: 'pt-1', code: 'NET30', name: 'NET 30', days: 30, description: '', status: 'active', isDefault: false }],
    customers,
    suppliers: [],
    addPaymentTerm, updatePaymentTerm, deletePaymentTerm,
  }),
}));

import { PaymentTermMaster } from './PriceListTermSalespersonWarehouseMasters';

afterEach(() => { cleanup(); vi.clearAllMocks(); customers = []; });

const openForm = () => {
  const view = render(<PaymentTermMaster />);
  fireEvent.click(screen.getByText('Tambah Payment Term'));
  const form = view.container.querySelector('form') as HTMLFormElement;
  const inputs = Array.from(form.querySelectorAll('input')) as HTMLInputElement[];
  return { form, code: inputs[0], name: inputs[1] };
};

describe('PaymentTermMaster', () => {
  it('suggests a code that is not already taken, and saves after typing a name', () => {
    const { form, code, name } = openForm();
    expect(code.value).toBe('NET30-2');
    fireEvent.change(name, { target: { value: 'NET 30 Dealer' } });
    expect(form.checkValidity()).toBe(true);
    fireEvent.click(screen.getByText('Simpan'));
    expect(addPaymentTerm).toHaveBeenCalledTimes(1);
    expect(addPaymentTerm.mock.calls[0][0]).toMatchObject({ code: 'NET30-2', name: 'NET 30 Dealer', days: 30 });
  });

  it('refuses a duplicate code and keeps the form open with a message', () => {
    const { code, name } = openForm();
    fireEvent.change(code, { target: { value: 'net30' } });
    fireEvent.change(name, { target: { value: 'Lain' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(addPaymentTerm).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('sudah dipakai');
  });

  it('does not delete a term that customers still use', () => {
    customers = [{ paymentTermId: 'pt-1' }];
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { container } = render(<PaymentTermMaster />);
    const trash = Array.from(container.querySelectorAll('button')).find((b) => b.className.includes('text-rose-600'))!;
    fireEvent.click(trash);
    expect(alertSpy).toHaveBeenCalled();
    expect(deletePaymentTerm).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
