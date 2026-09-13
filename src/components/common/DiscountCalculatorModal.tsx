import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { DiscountItem } from '../../types';
import { calculateSequentialDiscounts, formatRupiah, formatNumber } from '../../utils/discountEngine';
import {
  X,
  Plus,
  Trash2,
  Percent,
  Banknote,
  ArrowRight,
  Sparkles,
  Layers,
  Check,
  RotateCcw
} from 'lucide-react';

export const DiscountCalculatorModal: React.FC = () => {
  const { isDiscountModalOpen, closeDiscountModal, discountModalInitialPrice, discountModalDiscounts, addToast } = useApp();
  const { t } = useLanguage();

  const [initialPrice, setInitialPrice] = useState<number>(discountModalInitialPrice);
  const [discounts, setDiscounts] = useState<DiscountItem[]>(discountModalDiscounts);

  useEffect(() => {
    setInitialPrice(discountModalInitialPrice);
    if (discountModalDiscounts && discountModalDiscounts.length > 0) {
      setDiscounts(discountModalDiscounts);
    }
  }, [discountModalInitialPrice, discountModalDiscounts, isDiscountModalOpen]);

  if (!isDiscountModalOpen) return null;

  const result = calculateSequentialDiscounts(initialPrice, discounts);

  const handleAddDiscount = () => {
    const nextSeq = discounts.length + 1;
    const newDisc: DiscountItem = {
      id: crypto.randomUUID(),
      sequence: nextSeq,
      type: 'percentage',
      value: 5,
      label: `Diskon Step ${nextSeq}`
    };
    setDiscounts([...discounts, newDisc]);
  };

  const handleRemoveDiscount = (id: string) => {
    const filtered = discounts.filter((d) => d.id !== id);
    // Re-sequence remaining
    const resequenced = filtered.map((d, idx) => ({ ...d, sequence: idx + 1 }));
    setDiscounts(resequenced);
  };

  const handleUpdateDiscount = (id: string, field: keyof DiscountItem, val: any) => {
    setDiscounts(
      discounts.map((d) => {
        if (d.id === id) {
          return { ...d, [field]: val };
        }
        return d;
      })
    );
  };

  const handleResetDefaults = () => {
    setInitialPrice(100000);
    setDiscounts([
      { id: 'd1', sequence: 1, type: 'percentage', value: 10, label: 'Diskon Tier 1' },
      { id: 'd2', sequence: 2, type: 'percentage', value: 5, label: 'Diskon Volume' },
      { id: 'd3', sequence: 3, type: 'percentage', value: 2, label: 'Diskon Cash 14 Hari' },
      { id: 'd4', sequence: 4, type: 'fixed', value: 1000, label: 'Potongan Freight' },
      { id: 'd5', sequence: 5, type: 'percentage', value: 3, label: 'Bonus Toko VIP' }
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {t('discount.title')}
              </h2>
              <p className="text-xs text-blue-200">{t('discount.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={closeDiscountModal}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Base Price Input Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('discount.initial_price')} (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  value={initialPrice}
                  onChange={(e) => setInitialPrice(Number(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex items-center justify-between gap-4 bg-white p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Total Potongan Diskon</span>
                <span className="text-lg font-bold text-rose-600">
                  - {formatRupiah(result.totalDeduction)}
                </span>
                <span className="ml-2 text-xs font-semibold text-rose-500">
                  ({result.effectivePercentage.toFixed(2)}% Efektif)
                </span>
              </div>
              <div className="text-right border-l pl-4 border-slate-200">
                <span className="text-xs font-semibold text-slate-500 block">Harga Bersih Akhir</span>
                <span className="text-xl font-black text-emerald-600">
                  {formatRupiah(result.finalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Sequential Steps Builder List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Diskon Beruntun ({discounts.length} Steps)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetDefaults}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Contoh
                </button>
                <button
                  onClick={handleAddDiscount}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  {t('discount.add_step')}
                </button>
              </div>
            </div>

            {/* Steps Form List */}
            <div className="space-y-2.5">
              {discounts.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                  Belum ada step diskon. Tekan "+ Tambah Diskon" untuk menambahkan.
                </div>
              ) : (
                discounts.map((disc, idx) => {
                  const stepRes = result.steps[idx];
                  return (
                    <div
                      key={disc.id}
                      className="flex flex-col md:flex-row items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all"
                    >
                      {/* Sequence Badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                      </div>

                      {/* Label Input */}
                      <div className="w-full md:w-48">
                        <input
                          type="text"
                          value={disc.label || ''}
                          placeholder="Label diskon (misal: Tier 1)"
                          onChange={(e) => handleUpdateDiscount(disc.id, 'label', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Type Selector (Percentage vs Fixed) */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
                        <button
                          onClick={() => handleUpdateDiscount(disc.id, 'type', 'percentage')}
                          className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all ${
                            disc.type === 'percentage'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Percent className="w-3 h-3" />
                          %
                        </button>
                        <button
                          onClick={() => handleUpdateDiscount(disc.id, 'type', 'fixed')}
                          className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all ${
                            disc.type === 'fixed'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Banknote className="w-3 h-3" />
                          Rp
                        </button>
                      </div>

                      {/* Value Input */}
                      <div className="w-full md:w-32">
                        <input
                          type="number"
                          value={disc.value}
                          onChange={(e) =>
                            handleUpdateDiscount(disc.id, 'value', Number(e.target.value) || 0)
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Calculated Step Result */}
                      <div className="flex-1 w-full bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Potongan Step #{idx + 1}</span>
                          <span className="font-bold text-rose-600">
                            - {formatRupiah(stepRes?.deductionAmount || 0)}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 mx-2 shrink-0" />
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Harga Setelah Step</span>
                          <span className="font-bold text-slate-900">
                            {formatRupiah(stepRes?.resultingPrice || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveDiscount(disc.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                        title="Hapus Step"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sequential Breakdown Calculation Audit Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Rincian Perhitungan Beruntun (Sequential Calculation Table)
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-2.5">Seq</th>
                    <th className="p-2.5">Label Diskon</th>
                    <th className="p-2.5 text-right">Harga Sebelum</th>
                    <th className="p-2.5">Formula Diskon</th>
                    <th className="p-2.5 text-right">Potongan Nominal</th>
                    <th className="p-2.5 text-right">Harga Sesudah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  <tr className="bg-blue-50/50">
                    <td className="p-2.5 font-bold text-slate-500">#0</td>
                    <td className="p-2.5 font-bold text-slate-900" colSpan={2}>
                      Harga Dasar Katalog (List Price)
                    </td>
                    <td className="p-2.5 text-slate-400">-</td>
                    <td className="p-2.5 text-right text-slate-400">-</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">
                      {formatRupiah(initialPrice)}
                    </td>
                  </tr>
                  {result.steps.map((st) => (
                    <tr key={st.sequence} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">#{st.sequence}</td>
                      <td className="p-2.5 font-semibold text-slate-800">
                        {st.label || `Diskon Step ${st.sequence}`}
                      </td>
                      <td className="p-2.5 text-right text-slate-600">
                        {formatRupiah(st.previousPrice)}
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded bg-slate-200 font-mono text-[11px] font-bold text-slate-800">
                          {st.type === 'percentage' ? `${st.value}%` : `Rp ${formatNumber(st.value)}`}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-bold text-rose-600">
                        - {formatRupiah(st.deductionAmount)}
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        {formatRupiah(st.resultingPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Sistem ERP secara otomatis menerapkan aturan diskon beruntun ini pada Sales Order & Purchase Order.
          </div>
          <button
            onClick={() => {
              addToast('Skema diskon beruntun berhasil dikonfigurasi!', 'success');
              closeDiscountModal();
            }}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Terapkan Skema Diskon
          </button>
        </div>
      </div>
    </div>
  );
};
