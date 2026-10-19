import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Users, ShieldCheck, Search, RefreshCw, Ban, CheckCircle2, Clock, UserPlus, Hourglass, CalendarClock, Package, Star, Tag, Pencil } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  fetchPlans,
  fetchPlatformOrgs,
  fetchPlatformStats,
  fetchPlatformUsers,
  fetchPromotions,
  promotionInput,
  savePromotion,
  setOrganizationStatus,
  setUserActive,
  superAdminErrorMessage,
  type PlatformOrg,
  type PlatformStats,
  type PlatformUser,
} from '../../lib/superAdmin';
import {
  daysLeftLabel,
  formatDate,
  formatLimit,
  formatRupiah,
  formatUsage,
  isAtLimit,
  describePromo,
  promoStatus,
  PROMO_STATUS_LABEL,
  subscriptionStateLabel,
  type Plan,
  type Promotion,
} from '../../lib/subscription';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PlanDialog } from './PlanDialog';
import { PromoDialog } from './PromoDialog';
import { SubscriptionDialog } from './SubscriptionDialog';

type Tab = 'orgs' | 'users' | 'plans' | 'promos';

/** Aksi yang menunggu konfirmasi super admin. */
type Pending =
  | { kind: 'suspend-org'; org: PlatformOrg }
  | { kind: 'activate-org'; org: PlatformOrg }
  | { kind: 'deactivate-user'; user: PlatformUser };

const StatCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode; tone?: string }> = ({
  label,
  value,
  icon,
  tone = 'text-slate-900',
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4">
    <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase">
      {label}
      {icon}
    </div>
    <div className={`mt-2 text-2xl font-black ${tone}`}>{value}</div>
  </div>
);

export const SuperAdminView: React.FC = () => {
  const { addToast } = useApp();
  const [tab, setTab] = useState<Tab>('orgs');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [orgs, setOrgs] = useState<PlatformOrg[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [subscribeOrg, setSubscribeOrg] = useState<PlatformOrg | null>(null);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  /** undefined = tertutup, null = promo baru, objek = ubah promo. */
  const [promoDialog, setPromoDialog] = useState<Promotion | null | undefined>(undefined);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState<PlatformOrg | null>(null);
  const [onlyPending, setOnlyPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, o, u, p, pr] = await Promise.all([
        fetchPlatformStats(),
        fetchPlatformOrgs(),
        fetchPlatformUsers(null),
        fetchPlans(),
        fetchPromotions(),
      ]);
      setStats(s);
      setOrgs(o);
      setUsers(u);
      setPlans(p);
      setPromos(pr);
    } catch (err) {
      setError(superAdminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const term = search.trim().toLowerCase();

  const filteredOrgs = useMemo(
    () =>
      orgs.filter(
        (o) =>
          !term ||
          o.org_name.toLowerCase().includes(term) ||
          (o.admin_email ?? '').toLowerCase().includes(term) ||
          (o.admin_name ?? '').toLowerCase().includes(term)
      ),
    [orgs, term]
  );

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          (!orgFilter || u.org_id === orgFilter.org_id) &&
          (!onlyPending || (!u.active && !!u.org_id)) &&
          (!term ||
            u.full_name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            (u.org_name ?? '').toLowerCase().includes(term))
      ),
    [users, orgFilter, onlyPending, term]
  );

  const askToggleOrg = (org: PlatformOrg) => {
    setPendingError(null);
    setPending({ kind: org.org_status === 'active' ? 'suspend-org' : 'activate-org', org });
  };

  const toggleUser = async (user: PlatformUser) => {
    if (user.active) {
      setPendingError(null);
      setPending({ kind: 'deactivate-user', user });
      return;
    }
    setBusyId(user.user_id);
    try {
      await setUserActive(user.user_id, true);
      addToast(`${user.full_name} diaktifkan.`, 'success');
      await load();
    } catch (err) {
      addToast(superAdminErrorMessage(err), 'danger');
    } finally {
      setBusyId(null);
    }
  };

  /** Menjalankan aksi yang sudah dikonfirmasi; dialog tetap terbuka (dengan pesan galat) bila gagal. */
  const runPending = async (reason: string) => {
    if (!pending) return;
    const id = pending.kind === 'deactivate-user' ? pending.user.user_id : pending.org.org_id;
    setBusyId(id);
    setPendingError(null);
    try {
      if (pending.kind === 'suspend-org') {
        await setOrganizationStatus(pending.org.org_id, 'suspended', reason);
        addToast(`${pending.org.org_name} ditangguhkan.`, 'success');
      } else if (pending.kind === 'activate-org') {
        await setOrganizationStatus(pending.org.org_id, 'active');
        addToast(`${pending.org.org_name} diaktifkan kembali.`, 'success');
      } else {
        await setUserActive(pending.user.user_id, false);
        addToast(`${pending.user.full_name} dinonaktifkan.`, 'success');
      }
      setPending(null);
      await load();
    } catch (err) {
      setPendingError(superAdminErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const onSubscriptionSaved = async (org: PlatformOrg, newEndIso: string) => {
    setSubscribeOrg(null);
    addToast(`Langganan ${org.org_name} aktif sampai ${formatDate(newEndIso)}.`, 'success');
    await load();
  };

  const onPlanSaved = async (name: string) => {
    setEditPlan(null);
    addToast(`Paket ${name} disimpan.`, 'success');
    await load();
  };

  const onPromoSaved = async (code: string) => {
    setPromoDialog(undefined);
    addToast(`Promo ${code} disimpan.`, 'success');
    await load();
  };

  const togglePromo = async (promo: Promotion) => {
    setBusyId(promo.id);
    try {
      await savePromotion(promotionInput(promo, { active: !promo.active }));
      addToast(promo.active ? `Promo ${promo.code} dinonaktifkan.` : `Promo ${promo.code} diaktifkan.`, 'success');
      await load();
    } catch (err) {
      addToast(superAdminErrorMessage(err), 'danger');
    } finally {
      setBusyId(null);
    }
  };

  const showOrgUsers = (org: PlatformOrg) => {
    setOrgFilter(org);
    setOnlyPending(false);
    setSearch('');
    setTab('users');
  };

  const tabBtn = (key: Tab, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
        tab === key ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Super Admin
          </h2>
          <p className="text-xs text-slate-500">
            Pantau semua perusahaan yang terdaftar. Isi transaksi tiap perusahaan tidak ditampilkan di sini.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Muat ulang
        </button>
      </div>

      {error && (
        <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl p-3">
          {error}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard label="Total Perusahaan" value={stats.orgs_total} icon={<Building2 className="w-4 h-4 text-blue-600" />} />
          <StatCard label="Aktif" value={stats.orgs_active} icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} tone="text-emerald-700" />
          <StatCard label="Ditangguhkan" value={stats.orgs_suspended} icon={<Ban className="w-4 h-4 text-rose-600" />} tone="text-rose-700" />
          <StatCard label="Masa Trial" value={stats.orgs_trial} icon={<Hourglass className="w-4 h-4 text-sky-600" />} />
          <StatCard label="Segera Berakhir (7 hari)" value={stats.orgs_expiring_7d} icon={<CalendarClock className="w-4 h-4 text-amber-600" />} tone="text-amber-700" />
          <StatCard label="Daftar 7 Hari" value={stats.orgs_new_7d} icon={<UserPlus className="w-4 h-4 text-indigo-600" />} />
          <StatCard label="Daftar 30 Hari" value={stats.orgs_new_30d} icon={<UserPlus className="w-4 h-4 text-indigo-600" />} />
          <StatCard label="Total Pengguna" value={stats.users_total} icon={<Users className="w-4 h-4 text-blue-600" />} />
          <StatCard label="Menunggu Persetujuan" value={stats.users_pending} icon={<Clock className="w-4 h-4 text-amber-600" />} tone="text-amber-700" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {tabBtn('orgs', `Perusahaan (${orgs.length})`, <Building2 className="w-3.5 h-3.5" />)}
        {tabBtn('users', `Pengguna (${users.length})`, <Users className="w-3.5 h-3.5" />)}
        {tabBtn('plans', `Paket (${plans.length})`, <Package className="w-3.5 h-3.5" />)}
        {tabBtn('promos', `Promo (${promos.length})`, <Tag className="w-3.5 h-3.5" />)}
        <div className={`relative ml-auto w-full sm:w-72 ${tab === 'plans' || tab === 'promos' ? 'hidden' : ''}`}>
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'orgs' ? 'Cari perusahaan / admin / email…' : 'Cari nama / email / perusahaan…'}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {tab === 'orgs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <th className="p-3">Perusahaan</th>
                <th className="p-3">Admin</th>
                <th className="p-3">Paket</th>
                <th className="p-3 text-center">Pengguna</th>
                <th className="p-3 text-center">Produk</th>
                <th className="p-3">Trial s/d</th>
                <th className="p-3">Langganan s/d</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filteredOrgs.map((o) => {
                const expired = o.subscription_state === 'expired';
                return (
                  <tr key={o.org_id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{o.org_name}</div>
                      <div className="text-[10px] text-slate-500">Daftar {formatDate(o.created_at)}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-800">{o.admin_name ?? '-'}</div>
                      <div className="text-[10px] text-slate-500">{o.admin_email ?? ''}</div>
                      <div className="text-[10px] text-slate-400">Login terakhir {formatDate(o.last_sign_in_at)}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{o.plan_name}</div>
                      <div className="text-[10px] text-slate-500">{subscriptionStateLabel(o.subscription_state)}</div>
                    </td>
                    <td className={`p-3 text-center ${isAtLimit(o.active_user_count, o.max_users) ? 'text-rose-700 font-bold' : ''}`}>
                      {formatUsage(o.active_user_count, o.max_users)}
                      {o.user_count !== o.active_user_count && (
                        <div className="text-[10px] font-medium text-slate-400">{o.user_count} terdaftar</div>
                      )}
                    </td>
                    <td className={`p-3 text-center ${isAtLimit(o.product_count, o.max_products) ? 'text-rose-700 font-bold' : ''}`}>
                      {formatUsage(o.product_count, o.max_products)}
                    </td>
                    <td className="p-3 text-slate-600">{formatDate(o.trial_ends_at)}</td>
                    <td className="p-3 text-slate-600">
                      {formatDate(o.subscription_ends_at)}
                      {o.subscription_ends_at && (
                        <div className={`text-[10px] ${expired ? 'text-rose-600' : 'text-slate-400'}`}>{daysLeftLabel(o.days_left)}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          o.org_status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {o.org_status === 'active' ? 'Aktif' : 'Ditangguhkan'}
                      </span>
                      {o.org_status === 'suspended' && o.suspended_reason && (
                        <div className="text-[10px] text-slate-500 mt-1">{o.suspended_reason}</div>
                      )}
                      {o.org_status === 'active' && o.subscription_state === 'trial' && (
                        <div className="text-[10px] text-slate-500 mt-1">Trial · {daysLeftLabel(o.days_left)}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSubscribeOrg(o)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 font-bold text-white whitespace-nowrap"
                        >
                          {o.subscription_state === 'active' ? 'Perpanjang' : 'Aktifkan Langganan'}
                        </button>
                        <button
                          type="button"
                          onClick={() => showOrgUsers(o)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-800"
                        >
                          Pengguna
                        </button>
                        {/* Perusahaan yang langganannya habis hanya bisa dibuka lewat pencatatan pembayaran. */}
                        {!expired && (
                          <button
                            type="button"
                            disabled={busyId === o.org_id}
                            onClick={() => askToggleOrg(o)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-white disabled:opacity-60 ${
                              o.org_status === 'active' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                          >
                            {o.org_status === 'active' ? 'Tangguhkan' : 'Aktifkan'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filteredOrgs.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-500">
                    Belum ada perusahaan yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'plans' && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {plans.map((p) => (
            <div
              key={p.code}
              className={`bg-white rounded-2xl border shadow-2xs p-4 flex flex-col gap-2 ${
                p.badge ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-black text-slate-900">{p.name}</h3>
                {p.badge && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    <Star className="w-3 h-3" />
                    {p.badge}
                  </span>
                )}
              </div>
              <div className="text-xl font-black text-slate-900">
                {formatRupiah(p.price_monthly)}
                <span className="text-xs font-medium text-slate-500"> / bulan</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-1">
                <li>
                  Pengguna aktif: <strong>{formatLimit(p.max_users)}</strong>
                </li>
                <li>
                  Produk: <strong>{formatLimit(p.max_products)}</strong>
                </li>
              </ul>
              {p.description && <p className="text-xs text-slate-500">{p.description}</p>}
              <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500">
                  {orgs.filter((o) => o.plan === p.code).length} perusahaan memakai paket ini
                </span>
                <button
                  type="button"
                  onClick={() => setEditPlan(p)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'promos' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setPromoDialog(null)}
              className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
            >
              Promo baru
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-3">Kode</th>
                  <th className="p-3">Promo</th>
                  <th className="p-3">Berlaku untuk</th>
                  <th className="p-3">Periode</th>
                  <th className="p-3 text-center">Dipakai</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {promos.map((p) => {
                  const status = promoStatus(p);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-black text-slate-900">{p.code}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-[10px] text-slate-500">{describePromo(p)}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-800">{p.plan_name ?? 'Semua paket'}</div>
                        {p.min_months > 1 && <div className="text-[10px] text-slate-500">Min. {p.min_months} bulan</div>}
                      </td>
                      <td className="p-3 text-slate-600">
                        {p.starts_at || p.ends_at ? `${formatDate(p.starts_at)} – ${formatDate(p.ends_at)}` : 'Tanpa batas waktu'}
                      </td>
                      <td className="p-3 text-center">
                        {p.used_count}/{p.max_uses ?? '∞'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            status === 'active' ? 'bg-emerald-100 text-emerald-800' : status === 'scheduled' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {PROMO_STATUS_LABEL[status]}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button type="button" onClick={() => setPromoDialog(p)} className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-800">
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={() => void togglePromo(p)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-white disabled:opacity-60 ${p.active ? 'bg-slate-600 hover:bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                          >
                            {p.active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && promos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      Belum ada promo. Klik "Promo baru" untuk membuat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {orgFilter && (
              <span className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-bold flex items-center gap-2">
                Perusahaan: {orgFilter.org_name}
                <button type="button" onClick={() => setOrgFilter(null)} className="text-blue-600 hover:text-blue-800" aria-label="Hapus filter perusahaan">
                  ×
                </button>
              </span>
            )}
            <label className="flex items-center gap-1.5 font-bold text-slate-700">
              <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} />
              Hanya yang belum aktif / menunggu persetujuan
            </label>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-3">Nama</th>
                  <th className="p-3">Perusahaan</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Terdaftar</th>
                  <th className="p-3">Login Terakhir</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{u.full_name}</div>
                      <div className="text-[10px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="p-3 text-slate-700">{u.org_name ?? '-'}</td>
                    <td className="p-3 text-slate-700">{u.role}</td>
                    <td className="p-3 text-slate-600">{formatDate(u.created_at)}</td>
                    <td className="p-3 text-slate-600">{formatDate(u.last_sign_in_at)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {u.active ? 'Aktif' : 'Belum aktif'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        disabled={busyId === u.user_id}
                        onClick={() => void toggleUser(u)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-white disabled:opacity-60 ${
                          u.active ? 'bg-slate-600 hover:bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {u.active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      Belum ada pengguna yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pending && (
        <ConfirmDialog
          title={
            pending.kind === 'suspend-org'
              ? 'Tangguhkan perusahaan?'
              : pending.kind === 'activate-org'
                ? 'Aktifkan kembali perusahaan?'
                : 'Nonaktifkan pengguna?'
          }
          message={
            pending.kind === 'suspend-org' ? (
              <>
                Seluruh pengguna <strong>{pending.org.org_name}</strong> tidak bisa mengakses aplikasi sampai diaktifkan kembali.
              </>
            ) : pending.kind === 'activate-org' ? (
              <>
                <strong>{pending.org.org_name}</strong> dan seluruh penggunanya bisa mengakses aplikasi lagi.
              </>
            ) : (
              <>
                <strong>{pending.user.full_name}</strong> ({pending.user.email}) tidak akan bisa masuk ke aplikasi.
              </>
            )
          }
          confirmLabel={pending.kind === 'suspend-org' ? 'Tangguhkan' : pending.kind === 'activate-org' ? 'Aktifkan' : 'Nonaktifkan'}
          tone={pending.kind === 'activate-org' ? 'success' : 'danger'}
          askReason={pending.kind === 'suspend-org'}
          busy={busyId !== null}
          error={pendingError}
          onConfirm={(reason) => void runPending(reason)}
          onCancel={() => setPending(null)}
        />
      )}

      {subscribeOrg && (
        <SubscriptionDialog
          org={subscribeOrg}
          plans={plans}
          promos={promos}
          onClose={() => setSubscribeOrg(null)}
          onSaved={(endIso) => void onSubscriptionSaved(subscribeOrg, endIso)}
        />
      )}

      {editPlan && <PlanDialog plan={editPlan} orgs={orgs} onClose={() => setEditPlan(null)} onSaved={(name) => void onPlanSaved(name)} />}

      {promoDialog !== undefined && (
        <PromoDialog promo={promoDialog} plans={plans} onClose={() => setPromoDialog(undefined)} onSaved={(code) => void onPromoSaved(code)} />
      )}
    </div>
  );
};
