import React, { useMemo, useState } from 'react';
import { Modal } from '../common/Modal';
import { superAdminErrorMessage, updatePlan, type PlatformOrg } from '../../lib/superAdmin';
import { parseWholeNumber, type Plan } from '../../lib/subscription';

type Props = {
  plan: Plan;
  /** Dipakai untuk memperingatkan perusahaan yang sudah melebihi batas baru. */
  orgs: PlatformOrg[];
  onClose: () => void;
  /** Nama paket setelah disimpan. */
  onSaved: (name: string) => void;
};

const fieldClass = 'mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 font-medium bg-white';

/** Ubah nama, batas, harga, badge, dan deskripsi sebuah paket. */
export const PlanDialog: React.FC<Props> = ({ plan, orgs, onClose, onSaved }) => {
  const [name, setName] = useState(plan.name);
  const [maxUsers, setMaxUsers] = useState(plan.max_users === null ? '' : String(plan.max_users));
  const [maxProducts, setMaxProducts] = useState(plan.max_products === null ? '' : String(plan.max_products));
  const [price, setPrice] = useState(String(plan.price_monthly));
  const [badge, setBadge] = useState(plan.badge ?? '');
  const [description, setDescription] = useState(plan.description ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const users = parseWholeNumber(maxUsers);
  const products = parseWholeNumber(maxProducts);
  const priceValue = parseWholeNumber(price);
  const limitInvalid = users === 0 || products === 0;
  const valid = name.trim() !== '' && priceValue !== null && !limitInvalid;

  const overLimitCount = useMemo(
    () =>
      orgs.filter(
        (o) =>
          o.plan === plan.code &&
          ((users !== null && o.active_user_count > users) || (products !== null && o.product_count > products))
      ).length,
    [orgs, plan.code, users, products]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || priceValue === null) return;
    setBusy(true);
    setError(null);
    try {
      await updatePlan({
        code: plan.code,
        name,
        maxUsers: users,
        maxProducts: products,
        price: priceValue,
        badge,
        description,
      });
      onSaved(name.trim());
    } catch (err) {
      setError(superAdminErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={`Edit paket ${plan.name}`} subtitle="Perubahan berlaku untuk semua perusahaan yang memakai paket ini." busy={busy} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-xs font-bold text-slate-700">
          Nama paket
          <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className={fieldClass} />
        </label>

        <div className="grid sm:grid-cols-3 gap-4">
          <label className="block text-xs font-bold text-slate-700">
            Harga per bulan (Rp)
            <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} className={fieldClass} />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Maks. pengguna aktif
            <input
              inputMode="numeric"
              value={maxUsers}
              placeholder="Tanpa batas"
              onChange={(e) => setMaxUsers(e.target.value.replace(/\D/g, ''))}
              className={fieldClass}
            />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Maks. produk
            <input
              inputMode="numeric"
              value={maxProducts}
              placeholder="Tanpa batas"
              onChange={(e) => setMaxProducts(e.target.value.replace(/\D/g, ''))}
              className={fieldClass}
            />
          </label>
        </div>

        <label className="block text-xs font-bold text-slate-700">
          Badge (mis. Rekomendasi, kosongkan bila tidak ada)
          <input value={badge} maxLength={40} onChange={(e) => setBadge(e.target.value)} className={fieldClass} />
        </label>

        <label className="block text-xs font-bold text-slate-700">
          Deskripsi
          <input value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} className={fieldClass} />
        </label>

        {!limitInvalid && !valid && (
          <div role="status" className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold p-3">
            Nama paket dan harga per bulan wajib diisi (harga boleh 0).
          </div>
        )}
        {limitInvalid && (
          <div role="alert" className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold p-3">
            Batas minimal 1. Kosongkan kolom untuk tanpa batas.
          </div>
        )}
        {overLimitCount > 0 && (
          <div role="status" className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold p-3">
            {overLimitCount} perusahaan sudah melebihi batas baru. Data mereka tidak dihapus, tetapi mereka tidak bisa menambah pengguna/produk lagi.
          </div>
        )}
        {error && (
          <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50">
            Batal
          </button>
          <button type="submit" disabled={busy || !valid} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-60">
            {busy ? 'Menyimpan…' : 'Simpan paket'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
