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
  fetchPromotions: vi.fn(),
  updatePlan: vi.fn(),
  savePromotion: vi.fn(),
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
const promoBase = { bonus_months: 0, plan: null, plan_name: null, min_months: 1, starts_at: null, ends_at: '2099-01-01T00:00:00Z', max_uses: null, used_count: 0, active: true, created_at: '2026-10-01T00:00:00Z' };
const promos = [
  { ...promoBase, id: 'pr1', code: 'HEMAT25', name: 'Diskon 25 persen', discount_type: 'percent', discount_value: 25, plan: 'the_manager', plan_name: 'The Manager', min_months: 3, max_uses: 10, used_count: 4 },
  { ...promoBase, id: 'pr2', code: 'BONUS2', name: 'Bayar 12 gratis 2', discount_type: 'fixed', discount_value: 0, bonus_months: 2, min_months: 12 },
  { ...promoBase, id: 'pr3', code: 'LAWAS', name: 'Promo lama', discount_type: 'percent', discount_value: 10, ends_at: '2020-01-01T00:00:00Z' },
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
  api.fetchPromotions.mockResolvedValue(promos);
  api.updatePlan.mockResolvedValue(undefined);
  api.savePromotion.mockResolvedValue('pr-new');
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
      expect(api.activateSubscription).toHaveBeenCalledWith({ orgId: 'o1', plan: 'the_high_table', months: 3, amount: 1497000, note: 'TF BCA 123', promoId: null })
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

  it('applies a promo: only valid promos are offered, the total drops and the promo id is sent', async () => {
    render(<SuperAdminView />);
    await screen.findByText('Toko Maju');
    fireEvent.click(within(rowOf('Toko Maju')).getByText('Aktifkan Langganan'));
    const dialog = await screen.findByRole('dialog');
    const promoSelect = within(dialog).getByLabelText('Promo') as HTMLSelectElement;
    const offered = () => Array.from(promoSelect.options).map((o) => o.value);

    expect(offered()).toEqual(['']); // 1 bulan: HEMAT25 butuh min. 3 bulan, LAWAS kedaluwarsa
    fireEvent.change(within(dialog).getByLabelText('Lama langganan'), { target: { value: '3' } });
    expect(offered()).toEqual(['', 'pr1']); // paket bawaan The Manager

    fireEvent.change(promoSelect, { target: { value: 'pr1' } });
    // 3 x 249.000 = 747.000, diskon 25% = 186.750
    expect((within(dialog).getByLabelText(/Nominal transfer/) as HTMLInputElement).value).toBe('560250');
    expect(within(dialog).getByText('-Rp186.750')).toBeTruthy();

    fireEvent.click(within(dialog).getByLabelText(/The High Table/)); // promo hanya untuk The Manager
    expect(offered()).toEqual(['']);
    fireEvent.click(within(dialog).getByLabelText(/The Manager/));
    fireEvent.change(within(dialog).getByLabelText('Lama langganan'), { target: { value: '12' } });
    expect(offered()).toEqual(['', 'pr1', 'pr2']);
    fireEvent.change(promoSelect, { target: { value: 'pr2' } });
    expect(within(dialog).getByText('+2 bulan gratis')).toBeTruthy();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Aktifkan' }));
    await waitFor(() =>
      expect(api.activateSubscription).toHaveBeenCalledWith({ orgId: 'o1', plan: 'the_manager', months: 12, amount: 2988000, note: '', promoId: 'pr2' })
    );
  });

  it('edits a plan: price, limits (blank = unlimited) and badge are sent', async () => {
    render(<SuperAdminView />);
    await screen.findByText('Toko Maju');
    fireEvent.click(screen.getByText(/^Paket \(4\)/));
    const card = (await screen.findByText('The Manager')).closest('div.flex-col') as HTMLElement;
    fireEvent.click(within(card).getByText('Edit'));

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Harga per bulan/), { target: { value: '299000' } });
    fireEvent.change(within(dialog).getByLabelText(/Maks. pengguna/), { target: { value: '' } });
    fireEvent.change(within(dialog).getByLabelText(/Maks. produk/), { target: { value: '2000' } });
    fireEvent.change(within(dialog).getByLabelText(/Badge/), { target: { value: 'Terlaris' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan paket' }));

    await waitFor(() =>
      expect(api.updatePlan).toHaveBeenCalledWith({
        code: 'the_manager', name: 'The Manager', maxUsers: null, maxProducts: 2000, price: 299000, badge: 'Terlaris', description: '',
      })
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(api.fetchPlans).toHaveBeenCalledTimes(2)); // dimuat ulang
  });

  it('warns when a lower limit leaves companies above it, and blocks a zero limit', async () => {
    render(<SuperAdminView />);
    await screen.findByText('Toko Maju');
    fireEvent.click(screen.getByText(/^Paket \(4\)/));
    const card = (await screen.findByText('Eksekutor')).closest('div.flex-col') as HTMLElement;
    fireEvent.click(within(card).getByText('Edit'));
    const dialog = await screen.findByRole('dialog');
    // CV Jaya (200 produk) dan PT Habis (250 produk) memakai Eksekutor; batas 220 -> hanya PT Habis terlampaui
    fireEvent.change(within(dialog).getByLabelText(/Maks. produk/), { target: { value: '220' } });
    expect(within(dialog).getByRole('status').textContent).toContain('1 perusahaan sudah melebihi batas baru');
    fireEvent.change(within(dialog).getByLabelText(/Maks. produk/), { target: { value: '0' } });
    expect((within(dialog).getByRole('button', { name: 'Simpan paket' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('lists promos with their status and toggles one on and off', async () => {
    render(<SuperAdminView />);
    await screen.findByText('Toko Maju');
    fireEvent.click(screen.getByText(/^Promo \(3\)/));
    const hemat = within((await screen.findByText('HEMAT25')).closest('tr') as HTMLElement);
    expect(hemat.getByText('Diskon 25%')).toBeTruthy();
    expect(hemat.getByText('4/10')).toBeTruthy();
    expect(hemat.getByText('Aktif')).toBeTruthy();
    expect(within(screen.getByText('LAWAS').closest('tr') as HTMLElement).getByText('Kedaluwarsa')).toBeTruthy();

    fireEvent.click(hemat.getByText('Nonaktifkan'));
    await waitFor(() =>
      expect(api.savePromotion).toHaveBeenCalledWith(expect.objectContaining({ id: 'pr1', code: 'HEMAT25', active: false, discountValue: 25 }))
    );
    await waitFor(() => expect(api.fetchPromotions).toHaveBeenCalledTimes(2));
  });

  it('creates a promo, validating the code before it is sent', async () => {
    render(<SuperAdminView />);
    await screen.findByText('Toko Maju');
    fireEvent.click(screen.getByText(/^Promo \(3\)/));
    fireEvent.click(await screen.findByText('Promo baru'));
    const dialog = await screen.findByRole('dialog');
    const save = () => within(dialog).getByRole('button', { name: 'Simpan promo' }) as HTMLButtonElement;

    fireEvent.change(within(dialog).getByLabelText('Kode promo'), { target: { value: 'ab' } });
    fireEvent.change(within(dialog).getByLabelText('Nama promo'), { target: { value: 'Promo Oktober' } });
    fireEvent.change(within(dialog).getByLabelText('Nilai diskon'), { target: { value: '15' } });
    expect(save().disabled).toBe(true); // kode terlalu pendek
    fireEvent.change(within(dialog).getByLabelText('Kode promo'), { target: { value: 'okt15' } });
    expect(save().disabled).toBe(false);
    fireEvent.change(within(dialog).getByLabelText('Nilai diskon'), { target: { value: '150' } });
    expect(save().disabled).toBe(true); // persen > 100
    fireEvent.change(within(dialog).getByLabelText('Nilai diskon'), { target: { value: '15' } });
    fireEvent.change(within(dialog).getByLabelText('Berlaku untuk paket'), { target: { value: 'the_elder' } });
    fireEvent.change(within(dialog).getByLabelText(/Kuota/), { target: { value: '5' } });
    fireEvent.click(save());

    await waitFor(() =>
      expect(api.savePromotion).toHaveBeenCalledWith({
        id: null, code: 'OKT15', name: 'Promo Oktober', discountType: 'percent', discountValue: 15, bonusMonths: 0,
        plan: 'the_elder', minMonths: 1, startsAt: null, endsAt: null, maxUses: 5, active: true,
      })
    );
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
