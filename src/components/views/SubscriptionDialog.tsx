import React, { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { Modal } from '../common/Modal';
import {
  activateSubscription,
  fetchSubscriptionPayments,
  superAdminErrorMessage,
  type PlatformOrg,
  type SubscriptionPayment,
} from '../../lib/superAdmin';
import {
  MONTH_OPTIONS,
  computePricing,
  describePromo,
  formatDate,
  formatLimit,
  formatRupiah,
  nextEndDate,
  promoProblem,
  type Plan,
  type Promotion,
} from '../../lib/subscription';

type Props = {
  org: PlatformOrg;
  plans: Plan[];
  promos: Promotion[];
  onClose: () => void;
  /** Dipanggil setelah berhasil disimpan; parent memuat ulang datanya. */
  onSaved: (newEndIso: string) => void;
};

const fieldClass = 'mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 font-medium bg-white';

/** Mencatat transfer: pilih paket, lama, dan promo, lalu aktifkan / perpanjang. */
export const SubscriptionDialog: React.FC<Props> = ({ org, plans, promos, onClose, onSaved }) => {
  const [planCode, setPlanCode] = useState(org.plan);
  const [months, setMonths] = useState<number>(1);
  const [promoId, setPromoId] = useState('');
  const [amountText, setAmountText] = useState('');
  const [amountTouched, setAmountTouched] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SubscriptionPayment[]>([]);

  const plan = useMemo(() => plans.find((p) => p.code === planCode) ?? null, [plans, planCode]);
  const renewing = org.subscription_state === 'active';

  // Hanya promo yang berlaku untuk paket + lama yang sedang dipilih.
  const usablePromos = useMemo(
    () => promos.filter((p) => promoProblem(p, planCode, months) === null),
    [promos, planCode, months]
  );
  const promo = usablePromos.find((p) => p.id === promoId) ?? null;

  const pricing = useMemo(() => computePricing(plan, months, promo), [plan, months, promo]);
  const newEnd = useMemo(
    () => nextEndDate(org.subscription_ends_at, months + pricing.bonusMonths),
    [org.subscription_ends_at, months, pricing.bonusMonths]
  );

  // Nominal terisi otomatis (total setelah promo) selama belum diubah manual.
  useEffect(() => {
    if (!amountTouched) setAmountText(plan ? String(pricing.total) : '');
  }, [plan, pricing.total, amountTouched]);

  useEffect(() => {
    let cancelled = false;
    fetchSubscriptionPayments(org.org_id)
      .then((rows) => !cancelled && setHistory(rows))
      .catch(() => undefined); // riwayat hanyalah pelengkap; galat tidak menghalangi aktivasi
    return () => {
      cancelled = true;
    };
  }, [org.org_id]);

  const tooManyUsers = !!plan && plan.max_users !== null && org.active_user_count > plan.max_users;
  const tooManyProducts = !!plan && plan.max_products !== null && org.product_count > plan.max_products;
  const overLimit = tooManyUsers || tooManyProducts;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || overLimit) return;
    setBusy(true);
    setError(null);
    try {
      const digits = amountText.replace(/\D/g, '');
      const endIso = await activateSubscription({
        orgId: org.org_id,
        plan: plan.code,
        months,
        amount: digits ? Number(digits) : null,
        note,
        promoId: promo?.id ?? null,
      });
      onSaved(endIso);
    } catch (err) {
      setError(superAdminErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal
      title={renewing ? 'Perpanjang Langganan' : 'Aktifkan Langganan'}
      subtitle={`${org.org_name} · berlaku sampai ${formatDate(org.subscription_ends_at ?? org.trial_ends_at)}`}
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-5">
        <fieldset className="space-y-2">
          <legend className="text-[11px] font-bold uppercase text-slate-500 mb-1.5">Paket</legend>
          <div className="grid sm:grid-cols-2 gap-2">
            {plans.map((p) => {
              const selected = p.code === planCode;
              return (
                <label
                  key={p.code}
                  className={`relative cursor-pointer rounded-xl border p-3 text-xs transition-colors ${
                    selected ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input type="radio" name="plan" value={p.code} checked={selected} onChange={() => setPlanCode(p.code)} className="sr-only" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-slate-900 text-sm">{p.name}</span>
                    {p.badge && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        <Star className="w-3 h-3" />
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 font-bold text-slate-800">{formatRupiah(p.price_monthly)} / bulan</div>
                  <div className="mt-1 text-slate-600">
                    {formatLimit(p.max_users)} pengguna · {formatLimit(p.max_products)} produk
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-xs font-bold text-slate-700">
            Lama langganan
            <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className={fieldClass}>
              {MONTH_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} bulan
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Promo
            <select value={promo?.id ?? ''} onChange={(e) => setPromoId(e.target.value)} className={fieldClass}>
              <option value="">Tanpa promo</option>
              {usablePromos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {describePromo(p)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 space-y-1">
          <div className="flex justify-between">
            <span>
              Harga {plan?.name} × {months} bulan
            </span>
            <span className="font-bold text-slate-900">{formatRupiah(pricing.subtotal)}</span>
          </div>
          {promo && (
            <div className="flex justify-between text-emerald-700">
              <span>Promo {promo.code}</span>
              <span className="font-bold">
                {pricing.discount > 0 ? `-${formatRupiah(pricing.discount)}` : ''}
                {pricing.discount > 0 && pricing.bonusMonths > 0 ? ' ' : ''}
                {pricing.bonusMonths > 0 ? `+${pricing.bonusMonths} bulan gratis` : ''}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-1">
            <span className="font-bold">Total yang harus dibayar</span>
            <span className="font-black text-slate-900">{formatRupiah(pricing.total)}</span>
          </div>
          <div>
            Langganan akan berlaku sampai <strong className="text-slate-900">{formatDate(newEnd)}</strong>
            {renewing ? ' (dihitung dari tanggal berakhir saat ini).' : ' (dihitung mulai hari ini).'}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-xs font-bold text-slate-700">
            Nominal transfer (Rp)
            <input
              inputMode="numeric"
              value={amountText}
              onChange={(e) => {
                setAmountTouched(true);
                setAmountText(e.target.value.replace(/\D/g, ''));
              }}
              placeholder="Opsional"
              className={fieldClass}
            />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Catatan (mis. nomor referensi transfer)
            <input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} className={fieldClass} />
          </label>
        </div>

        {overLimit && (
          <div role="alert" className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold p-3">
            Paket {plan?.name} terlalu kecil untuk pemakaian saat ini:
            {tooManyUsers && ` ${org.active_user_count} pengguna aktif (batas ${plan?.max_users}).`}
            {tooManyProducts && ` ${org.product_count} produk (batas ${plan?.max_products}).`}
          </div>
        )}
        {error && (
          <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3">
            {error}
          </div>
        )}

        {history.length > 0 && (
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-500 mb-1.5">Riwayat pembayaran</div>
            <ul className="divide-y divide-slate-100 text-xs border border-slate-200 rounded-xl">
              {history.slice(0, 5).map((h) => (
                <li key={h.id} className="p-2.5 flex flex-wrap justify-between gap-x-3 gap-y-0.5">
                  <span className="font-bold text-slate-800">
                    {h.plan_name} · {h.months} bulan{h.bonus_months > 0 ? ` (+${h.bonus_months} gratis)` : ''}
                    {h.amount !== null ? ` · ${formatRupiah(h.amount)}` : ''}
                    {h.promo_code ? ` · promo ${h.promo_code}` : ''}
                  </span>
                  <span className="text-slate-500">
                    {formatDate(h.created_at)} → s/d {formatDate(h.period_end)}
                  </span>
                  {h.note && <span className="w-full text-slate-500">{h.note}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50">
            Batal
          </button>
          <button
            type="submit"
            disabled={busy || !plan || overLimit}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-60"
          >
            {busy ? 'Menyimpan…' : renewing ? 'Perpanjang' : 'Aktifkan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
