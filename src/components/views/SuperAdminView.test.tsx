// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const addToast = vi.fn();
vi.mock('../../context/AppContext', () => ({ useApp: () => ({ addToast }) }));

const api = vi.hoisted(() => ({
  fetchPlatformStats: vi.fn(),
  fetchPlatformOrgs: vi.fn(),
  fetchPlatformUsers: vi.fn(),
  fetchPlans: vi.fn(),
  setOrganizationStatus: vi.fn(),
  setUserActive: vi.fn(),
  activateSubscription: vi.fn(),
  fetchSubscriptionPayments: vi.fn(),
}));
vi.mock('../../lib/superAdmin', async (orig) => ({ ...(await orig<typeof import('../../lib/superAdmin')>()), ...api }));

import { SuperAdminView } from './SuperAdminView';

const baseOrg = { suspended_reason: null, last_sign_in_at: null, trial_ends_at: '2026-11-01T00:00:00Z', subscription_ends_at: null };
const orgs = [
  { ...baseOrg, org_id: 'o1', org_name: 'Toko Maju', org_status: 'active', created_at: '2026-10-01T00:00:00Z', user_count: 3, active_user_count: 2, admin_name: 'Budi', admin_email: 'budi@maju.com', plan: 'the_manager', plan_name: 'The Manager', subscription_state: 'trial', days_left: 14, max_users: 10, max_products: 1000, product_count: 120 },
  { ...baseOrg, org_id: 'o2', org_name: 'CV Jaya', org_status: 'suspended', suspended_reason: 'Belum bayar', created_at: '2026-10-05T00:00:00Z', user_count: 1, active_user_count: 1, admin_name: 'Sari', admin_email: 'sari@jaya.com', plan: 'eksekutor', plan_name: 'Eksekutor', subscription_state: 'active', subscription_ends_at: '2027-01-01T00:00:00Z', days_left: 75, max_users: 3, max_products: 200, product_count: 200 },
  { ...baseOrg, org_id: 'o3', org_name: 'PT Habis', org_status: 'suspended', suspended_reason: 'Langganan berakhir', created_at: '2026-09-01T00:00:00Z', user_count: 2, active_user_count: 2, admin_name: 'Andi', admin_email: 'andi@habis.com', plan: 'eksekutor', plan_name: 'Eksekutor', subscription_state: 'expired', subscription_ends_at: '2026-10-10T00:00:00Z', days_left: 0, max_users: 3, max_products: 200, product_count: 250 },
];
const plans = [
  { code: 'eksekutor', name: 'Eksekutor', sort_order: 1, max_users: 3, max_products: 200, price_monthly: 99000, badge: null, description: null },
  { code: 'the_manager', name: 'The Manager', sort_order: 2, max_users: 10, max_products: 1000, price_monthly: 249000, badge: 'Rekomendasi', description: null },
  { code: 'the_high_table', name: 'The High Table', sort_order: 3, max_users: 25, max_products: 5000, price_monthly: 499000, badge: null, description: null },
  { code: 'the_elder', name: 'The Elder', sort_order: 4, max_users: null, max_products: null, price_monthly: 999000, badge: 'Paling Direkomendasikan', description: null },
];
const users = [
  { user_id: 'u1', full_name: 'Budi', email: 'budi@maju.com', role: 'Admin', active: true, org_id: 'o1', org_name: 'Toko Maju', created_at: '2026-10-01T00:00:00Z', last_sign_in_at: null },
  { user_id: 'u2', full_name: 'Tono', email: 'tono@maju.com', role: 'User', active: false, org_id: 'o1', org_name: 'Toko Maju', created_at: '2026-10-02T00:00:00Z', last_sign_in_at: null },
  { user_id: 'u3', full_name: 'Sari', email: 'sari@jaya.com', role: 'Admin', active: true, org_id: 'o2', org_name: 'CV Jaya', created_at: '2026-10-05T00:00:00Z', last_sign_in_at: null },
];

beforeEach(() => {
  api.fetchPlatformStats.mockResolvedValue({ orgs_total: 3, orgs_active: 1, orgs_suspended: 2, orgs_trial: 1, orgs_expiring_7d: 1, orgs_new_7d: 2, orgs_new_30d: 3, users_total: 3, users_pending: 1 });
  api.fetchPlatformOrgs.mockResolvedValue(orgs);
  api.fetchPlatformUsers.mockResolvedValue(users);
  api.fetchPlans.mockResolvedValue(plans);
  api.fetchSubscriptionPayments.mockResolvedValue([]);
  api.activateSubscription.mockResolvedValue('2027-02-01T00:00:00Z');
  api.setOrganizationStatus.mockResolvedValue(undefined);
  api.setUserActive.mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); });

const rowOf = (name: string) => screen.getByText(name).closest('tr') as HTMLElement;

describe('SuperAdminView', () => {
  it('lists every company with its status and admin', async () => {
    render(<SuperAdminView />);
    expect(await screen.findByText('Toko Maju')).toBeTruthy();
    expect(within(rowOf('Toko Maju')).getByText('budi@maju.com')).toBeTruthy();
    expect(within(rowOf('CV Jaya')).getByText('Ditangguhkan')).toBeTruthy();
    expect(within(rowOf('CV Jaya')).getByText('Belum bayar')).toBeTruthy();
  });

  it('shows plan, usage limits, trial and subscription dates per company', async () => {
    render(<SuperAdminView />);
    await screen.findByText('Toko Maju');
    const maju = within(rowOf('Toko Maju'));
    expect(maju.getByText('The Manager')).toBeTruthy();
    expect(maju.getByText('2/10')).toBeTruthy(); // pengguna aktif / batas paket
    expect(maju.getByText('120/1.000')).toBeTruthy(); // produk / batas paket
    expect(maju.getByText(/Trial · 14 hari lagi/)).toBeTruthy();
    const jaya = within(rowOf('CV Jaya'));
    expect(jaya.getByText('1/3')).toBeTruthy();
    expect(jaya.getByText('75 hari lagi')).toBeTruthy();
  });

  it('lets only the payment flow reopen a company whose subscription has expired', async () => {
    render(<SuperAdminView />);
    await screen.findByText('PT Habis');
    const habis = within(rowOf('PT Habis'));
    expect(habis.getByText('Langganan berakhir')).toBeTruthy();
    expect(habis.getByText('Aktifkan Langganan')).toBeTruthy();
    expect(habis.queryByText('Aktifkan')).toBeNull(); // tombol aktifkan-manual disembunyikan
    expect(habis.queryByText('Tangguhkan')).toBeNull();
    // perusahaan yang ditangguhkan manual (belum habis) masih bisa diaktifkan kembali
    expect(within(rowOf('CV Jaya')).getByText('Aktifkan')).toBeTruthy();
  });

  it('activates a subscription after a transfer: plan, months and amount are sent', async () => {
    render(<SuperAdminView />);
    await screen.findByText('Toko Maju');
    fireEvent.click(within(rowOf('Toko Maju')).getByText('Aktifkan Langganan'));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByLabelText(/The High Table/));
    fireEvent.change(within(dialog).getByLabelText('Lama langganan'), { target: { value: '3' } });
    fireEvent.change(within(dialog).getByLabelText(/Catatan/), { target: { value: 'TF BCA 123' } });
    expect((within(dialog).getByLabelText(/Nominal transfer/) as HTMLInputElement).value).toBe('1497000'); // 3 x 499.000

    fireEvent.click(within(dialog).getByRole('button', { name: 'Aktifkan' }));
    await waitFor(() =>
      expect(api.activateSubscription).toHaveBeenCalledWith({ orgId: 'o1', plan: 'the_high_table', months: 3, amount: 1497000, note: 'TF BCA 123' })
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(addToast).toHaveBeenCalledWith(expect.stringContaining('Toko Maju'), 'success');
    await waitFor(() => expect(api.fetchPlatformOrgs).toHaveBeenCalledTimes(2)); // daftar dimuat ulang
  });

  it('refuses a plan that is too small for the current usage', async () => {
    render(<SuperAdminView />);
    await screen.findByText('PT Habis');
    fireEvent.click(within(rowOf('PT Habis')).getByText('Aktifkan Langganan'));
    const dialog = await screen.findByRole('dialog');
    // paket bawaan Eksekutor (batas 200 produk) < 250 produk yang dipakai
    expect(within(dialog).getByRole('alert').textContent).toContain('250 produk');
    expect((within(dialog).getByRole('button', { name: 'Aktifkan' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(within(dialog).getByLabelText(/The Manager/));
    expect(within(dialog).queryByRole('alert')).toBeNull();
    expect((within(dialog).getByRole('button', { name: 'Aktifkan' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('shows the database error inside the dialog when activation fails', async () => {
    api.activateSubscription.mockRejectedValue(new Error('USAGE_EXCEEDS_PLAN: 250 produk melebihi batas 200 milik paket Eksekutor'));
    render(<SuperAdminView />);
    await screen.findByText('Toko Maju');
    fireEvent.click(within(rowOf('Toko Maju')).getByText('Aktifkan Langganan'));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Aktifkan' }));
    expect((await within(dialog).findByRole('alert')).textContent).toContain('Paket tujuan terlalu kecil');
    expect(screen.getByRole('dialog')).toBeTruthy(); // dialog tetap terbuka agar bisa dikoreksi
  });

  it('lists the plans with their limits and recommendation badges', async () => {
    render(<SuperAdminView />);
    await screen.findByText('Toko Maju');
    fireEvent.click(screen.getByText(/^Paket \(4\)/));
    expect(await screen.findByText('The High Table')).toBeTruthy();
    expect(screen.getByText('Rekomendasi')).toBeTruthy();
    expect(screen.getByText('Paling Direkomendasikan')).toBeTruthy();
    expect(screen.getAllByText('Tanpa batas').length).toBe(2); // The Elder: pengguna & produk
    expect(screen.getByText('Rp999.000')).toBeTruthy();
  });

  it('suspends a company with a reason, and does nothing when the prompt is cancelled', async () => {
    render(<SuperAdminView />);
    await screen.findByText('Toko Maju');

    vi.stubGlobal('prompt', vi.fn(() => null));
    fireEvent.click(within(rowOf('Toko Maju')).getByText('Tangguhkan'));
    expect(api.setOrganizationStatus).not.toHaveBeenCalled();

    vi.stubGlobal('prompt', vi.fn(() => 'Belum bayar'));
    fireEvent.click(within(rowOf('Toko Maju')).getByText('Tangguhkan'));
    await waitFor(() => expect(api.setOrganizationStatus).toHaveBeenCalledWith('o1', 'suspended', 'Belum bayar'));
    await waitFor(() => expect(api.fetchPlatformOrgs).toHaveBeenCalledTimes(2)); // daftar dimuat ulang
  });

  it('shows one company\'s users, and only the pending ones when filtered', async () => {
    render(<SuperAdminView />);
    await screen.findByText('Toko Maju');
    fireEvent.click(within(rowOf('Toko Maju')).getByText('Pengguna'));

    expect(await screen.findByText('Tono')).toBeTruthy();
    expect(screen.queryByText('Sari')).toBeNull(); // pengguna perusahaan lain tersembunyi

    fireEvent.click(screen.getByLabelText(/Hanya yang belum aktif/));
    expect(screen.queryByText('Budi')).toBeNull();
    expect(screen.getByText('Tono')).toBeTruthy();

    fireEvent.click(within(rowOf('Tono')).getByText('Aktifkan'));
    await waitFor(() => expect(api.setUserActive).toHaveBeenCalledWith('u2', true));
  });

  it('explains a missing database patch instead of failing silently', async () => {
    api.fetchPlatformStats.mockRejectedValue(new Error('Could not find the function public.sa_platform_stats'));
    render(<SuperAdminView />);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('patch-super-admin.sql');
  });
});
