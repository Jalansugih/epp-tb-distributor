import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { savePromotion, superAdminErrorMessage } from '../../lib/superAdmin';
import { dateInputToIso, parseWholeNumber, toDateInput, type DiscountType, type Plan, type Promotion } from '../../lib/subscription';

type Props = {
  /** null = promo baru */
  promo: Promotion | null;
  plans: Plan[];
  onClose: () => void;
  onSaved: (code: string) => void;
};

const fieldClass = 'mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 font-medium bg-white';
const CODE_PATTERN = /^[A-Z0-9_-]{3,30}$/;

/** Buat atau ubah promo: diskon persen/nominal dan/atau bonus bulan gratis. */
export const PromoDialog: React.FC<Props> = ({ promo, plans, onClose, onSaved }) => {
  const [code, setCode] = useState(promo?.code ?? '');
  const [name, setName] = useState(promo?.name ?? '');
  const [discountType, setDiscountType] = useState<DiscountType>(promo?.discount_type ?? 'percent');
  const [discountValue, setDiscountValue] = useState(promo ? String(promo.discount_value) : '');
  const [bonusMonths, setBonusMonths] = useState(promo ? String(promo.bonus_months) : '0');
  const [plan, setPlan] = useState(promo?.plan ?? '');
  const [minMonths, setMinMonths] = useState(promo ? String(promo.min_months) : '1');
  const [startsAt, setStartsAt] = useState(toDateInput(promo?.starts_at ?? null));
  const [endsAt, setEndsAt] = useState(toDateInput(promo?.ends_at ?? null));
  const [maxUses, setMaxUses] = useState(promo?.max_uses == null ? '' : String(promo.max_uses));
  const [active, setActive] = useState(promo?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = parseWholeNumber(discountValue) ?? 0;
  const bonus = parseWholeNumber(bonusMonths) ?? 0;
  const min = parseWholeNumber(minMonths) ?? 1;
  const uses = parseWholeNumber(maxUses);

  const problem = !CODE_PATTERN.test(code.trim().toUpperCase())
    ? 'Kode promo 3-30 karakter: huruf, angka, tanda - atau _.'
    : name.trim() === ''
      ? 'Nama promo wajib diisi.'
      : discountType === 'percent' && value > 100
        ? 'Diskon persen maksimal 100.'
        : value === 0 && bonus === 0
          ? 'Isi diskon atau bonus bulan.'
          : bonus > 12
            ? 'Bonus maksimal 12 bulan.'
            : min < 1 || min > 36
              ? 'Minimal lama langganan 1-36 bulan.'
              : uses === 0
                ? 'Kuota minimal 1 (kosongkan untuk tanpa batas).'
                : startsAt && endsAt && endsAt < startsAt
                  ? 'Tanggal berakhir harus setelah tanggal mulai.'
                  : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (problem) return;
    setBusy(true);
    setError(null);
    try {
      const cleanCode = code.trim().toUpperCase();
      await savePromotion({
        id: promo?.id ?? null,
        code: cleanCode,
        name,
        discountType,
        discountValue: value,
        bonusMonths: bonus,
        plan: plan || null,
        minMonths: min,
        startsAt: dateInputToIso(startsAt, false),
        endsAt: dateInputToIso(endsAt, true),
        maxUses: uses,
        active,
      });
      onSaved(cleanCode);
    } catch (err) {
      setError(superAdminErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={promo ? `Edit promo ${promo.code}` : 'Promo baru'} subtitle="Promo dipilih super admin saat mencatat pembayaran." busy={busy} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-xs font-bold text-slate-700">
            Kode promo
            <input value={code} maxLength={30} onChange={(e) => setCode(e.target.value.toUpperCase())} className={fieldClass} />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Nama promo
            <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className={fieldClass} />
          </label>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <label className="block text-xs font-bold text-slate-700">
            Jenis diskon
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType)} className={fieldClass}>
              <option value="percent">Persen (%)</option>
              <option value="fixed">Nominal (Rp)</option>
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Nilai diskon
            <input inputMode="numeric" value={discountValue} placeholder="0" onChange={(e) => setDiscountValue(e.target.value.replace(/\D/g, ''))} className={fieldClass} />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Bonus bulan gratis
            <input inputMode="numeric" value={bonusMonths} onChange={(e) => setBonusMonths(e.target.value.replace(/\D/g, ''))} className={fieldClass} />
          </label>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <label className="block text-xs font-bold text-slate-700">
            Berlaku untuk paket
            <select value={plan} onChange={(e) => setPlan(e.target.value)} className={fieldClass}>
              <option value="">Semua paket</option>
              {plans.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Minimal lama (bulan)
            <input inputMode="numeric" value={minMonths} onChange={(e) => setMinMonths(e.target.value.replace(/\D/g, ''))} className={fieldClass} />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Kuota pemakaian
            <input inputMode="numeric" value={maxUses} placeholder="Tanpa batas" onChange={(e) => setMaxUses(e.target.value.replace(/\D/g, ''))} className={fieldClass} />
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-xs font-bold text-slate-700">
            Mulai (opsional)
            <input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={fieldClass} />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Berakhir (opsional)
            <input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={fieldClass} />
          </label>
        </div>

        <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Promo aktif
        </label>

        {problem && (code !== '' || name !== '' || discountValue !== '') && (
          <div role="status" className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold p-3">
            {problem}
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
          <button type="submit" disabled={busy || problem !== null} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-60">
            {busy ? 'Menyimpan…' : 'Simpan promo'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
