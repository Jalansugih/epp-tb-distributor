import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Star } from 'lucide-react';
import {
  activateSubscription,
  fetchSubscriptionPayments,
  superAdminErrorMessage,
  type PlatformOrg,
  type SubscriptionPayment,
} from '../../lib/superAdmin';
import {
  MONTH_OPTIONS,
  formatDate,
  formatLimit,
  formatRupiah,
  nextEndDate,
  type Plan,
} from '../../lib/subscription';

type Props = {
  org: PlatformOrg;
  plans: Plan[];
  onClose: () => void;
  /** Dipanggil setelah berhasil disimpan; parent memuat ulang datanya. */
  onSaved: (newEndIso: string) => void;
};

/** Mencatat transfer: pilih paket + lama langganan, lalu aktifkan / perpanjang. */
export const SubscriptionDialog: React.FC<Props> = ({ org, plans, onClose, onSaved }) => {
  const [planCode, setPlanCode] = useState(org.plan);
  const [months, setMonths] = useState<number>(1);
  const [amountText, setAmountText] = useState('');
  const [amountTouched, setAmountTouched] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SubscriptionPayment[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const plan = useMemo(() => plans.find((p) => p.code === planCode) ?? null, [plans, planCode]);
  const renewing = org.subscription_state === 'active';
  const newEnd = useMemo(
    () => nextEndDate(org.subscription_ends_at, months),
    [org.subscription_ends_at, months]
  );

  // Nominal terisi otomatis (harga x bulan) selama belum diubah manual.
  useEffect(() => {
    if (!amountTouched) setAmountText(plan ? String(plan.price_monthly * months) : '');
  }, [plan, months, amountTouched]);

  useEffect(() => {
    panelRef.current?.focus();
    let cancelled = false;
    fetchSubscriptionPayments(org.org_id)
      .then((rows) => !cancelled && setHistory(rows))
      .catch(() => undefined); // riwayat hanyalah pelengkap; galat tidak menghalangi aktivasi
    return () => {
      cancelled = true;
    };
  }, [org.org_id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

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
      });
      onSaved(endIso);
    } catch (err) {
      setError(superAdminErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sub-dialog-title"
        className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto bg-white rounded-2xl shadow-xl outline-none"
      >
        <form onSubmit={submit} className="p-5 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 id="sub-dialog-title" className="text-base font-black text-slate-900">
                {renewing ? 'Perpanjang Langganan' : 'Aktifkan Langganan'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {org.org_name} · berlaku sampai {formatDate(org.subscription_ends_at ?? org.trial_ends_at)}
              </p>
            </div>
            <button type="button" onClick={onClose} disabled={busy} aria-label="Tutup" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <X className="w-4 h-4" />
            </button>
          </div>

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
                    <input
                      type="radio"
                      name="plan"
                      value={p.code}
                      checked={selected}
                      onChange={() => setPlanCode(p.code)}
                      className="sr-only"
                    />
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
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m} bulan
                  </option>
                ))}
              </select>
            </label>
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
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 font-medium"
              />
            </label>
          </div>

          <label className="block text-xs font-bold text-slate-700">
            Catatan (mis. nomor referensi transfer)
            <input
              value={note}
              maxLength={300}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 font-medium"
            />
          </label>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700">
            Langganan akan berlaku sampai <strong className="text-slate-900">{formatDate(newEnd)}</strong>
            {renewing ? ' (dihitung dari tanggal berakhir saat ini).' : ' (dihitung mulai hari ini).'}
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
                      {h.plan_name} · {h.months} bulan{h.amount !== null ? ` · ${formatRupiah(h.amount)}` : ''}
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
      </div>
    </div>
  );
};
