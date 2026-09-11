import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatRupiah } from '../../utils/discountEngine';
import { mockChartOfAccounts } from '../../data/mockData';
import {
  Wallet,
  BookOpen,
  Receipt,
  PieChart,
  BarChart3,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const { addToast, currentView, setCurrentView } = useApp();
  const { t } = useLanguage();

  const getActiveTab = () => {
    if (currentView.includes('chart')) return 'chart';
    if (currentView.includes('journal')) return 'journal';
    if (currentView.includes('pnl')) return 'pnl';
    if (currentView.includes('balance')) return 'balance';
    return 'cashbank';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab: string) => {
    if (tab === 'cashbank') setCurrentView('finance-cashbank');
    else if (tab === 'chart') setCurrentView('finance-chart-accounts');
    else if (tab === 'journal') setCurrentView('finance-journal');
    else if (tab === 'pnl') setCurrentView('finance-pnl');
    else if (tab === 'balance') setCurrentView('finance-balance');
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => handleTabChange('cashbank')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'cashbank'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Kas & Rekening Bank</span>
          </button>
          <button
            onClick={() => handleTabChange('chart')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'chart'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Bagan Akun (CoA)</span>
          </button>
          <button
            onClick={() => handleTabChange('journal')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'journal'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Jurnal Umum</span>
          </button>
          <button
            onClick={() => handleTabChange('pnl')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'pnl'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Laba Rugi (P&L)</span>
          </button>
          <button
            onClick={() => handleTabChange('balance')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'balance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Neraca Keuangan</span>
          </button>
        </div>

        <button
          onClick={() => addToast('Form Tambah Ayat Jurnal baru telah dibuka', 'info')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Jurnal Umum</span>
        </button>
      </div>

      {/* CASH & BANK OVERVIEW */}
      {activeTab === 'cashbank' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 block mb-1">Kas Brankas Kasir</span>
              <p className="text-xl font-black text-slate-900">Rp 45.000.000</p>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">Operational Daily Cash</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 block mb-1">Bank BCA Operational</span>
              <p className="text-xl font-black text-slate-900">Rp 185.000.000</p>
              <p className="text-[10px] text-blue-600 font-bold mt-1">A/C 088-291-8899</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 block mb-1">Bank Mandiri GIRO</span>
              <p className="text-xl font-black text-slate-900">Rp 200.000.000</p>
              <p className="text-[10px] text-indigo-600 font-bold mt-1">A/C 120-001-2299</p>
            </div>
          </div>
        </div>
      )}

      {/* CHART OF ACCOUNTS TABLE */}
      {activeTab === 'chart' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">Bagan Akun Standard ERP (Chart of Accounts)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-3">Kode Akun</th>
                  <th className="p-3">Nama Akun Buku Besar</th>
                  <th className="p-3">Kategori Akun</th>
                  <th className="p-3 text-right">Saldo Terakhir (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {mockChartOfAccounts.map((coa) => (
                  <tr key={coa.code} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-700">{coa.code}</td>
                    <td className="p-3 font-bold text-slate-900">{coa.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                        {coa.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">{formatRupiah(coa.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROFIT & LOSS STATEMENT */}
      {activeTab === 'pnl' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-2xs max-w-3xl mx-auto space-y-6 text-xs">
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <h2 className="text-base font-black text-slate-900 uppercase">
              PT BAHAN BANGUNAN JAYA DISTRIBUTOR
            </h2>
            <h3 className="text-sm font-bold text-blue-700">LAPORAN LABA RUGI (PROFIT & LOSS STATEMENT)</h3>
            <p className="text-slate-500 text-[11px]">Periode 1 Januari - 12 Agustus 2026</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-sm text-slate-900 border-b pb-1">
                <span>1. PENJUALAN KOTOR MATERIAL</span>
                <span>Rp 1.850.000.000</span>
              </div>
              <div className="flex justify-between text-slate-600 pl-4">
                <span>Potongan Diskon Beruntun Toko</span>
                <span>- Rp 120.000.000</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pl-4 border-t pt-1">
                <span>Penjualan Bersih (Net Revenue)</span>
                <span className="text-blue-700">Rp 1.730.000.000</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between font-bold text-sm text-slate-900 border-b pb-1">
                <span>2. HARGA POKOK PENJUALAN (HPP)</span>
                <span>- Rp 1.420.000.000</span>
              </div>
            </div>

            <div className="flex justify-between font-black text-sm text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              <span>LABA KOTOR (GROSS PROFIT)</span>
              <span>Rp 310.000.000</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between font-bold text-sm text-slate-900 border-b pb-1">
                <span>3. BEBAN OPERASIONAL & PENGIRIMAN</span>
                <span>- Rp 65.000.000</span>
              </div>
              <div className="flex justify-between text-slate-600 pl-4">
                <span>Biaya Bahan Bakar & Sewa Truk Fuso</span>
                <span>Rp 45.000.000</span>
              </div>
              <div className="flex justify-between text-slate-600 pl-4">
                <span>Gaji Salesperson & Komisi</span>
                <span>Rp 20.000.000</span>
              </div>
            </div>

            <div className="flex justify-between font-black text-base text-blue-900 bg-blue-50 p-4 rounded-xl border border-blue-200">
              <span>LABA BERSIH SEBELUM PAJAK (NET PROFIT)</span>
              <span className="text-blue-700">Rp 245.000.000</span>
            </div>
          </div>
        </div>
      )}

      {/* BALANCE SHEET */}
      {activeTab === 'balance' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-2xs max-w-3xl mx-auto space-y-6 text-xs">
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <h2 className="text-base font-black text-slate-900 uppercase">
              PT BAHAN BANGUNAN JAYA DISTRIBUTOR
            </h2>
            <h3 className="text-sm font-bold text-blue-700">NERACA KEUANGAN (BALANCE SHEET)</h3>
            <p className="text-slate-500 text-[11px]">Per 12 Agustus 2026</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm border-b pb-1 text-blue-700">ASET (ASSETS)</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Kas & Bank</span>
                  <span className="font-bold">Rp 430.000.000</span>
                </div>
                <div className="flex justify-between">
                  <span>Piutang Toko (AR)</span>
                  <span className="font-bold">Rp 540.000.000</span>
                </div>
                <div className="flex justify-between">
                  <span>Persediaan Material</span>
                  <span className="font-bold">Rp 820.000.000</span>
                </div>
              </div>
              <div className="flex justify-between font-black text-slate-900 border-t pt-2">
                <span>TOTAL ASET</span>
                <span className="text-blue-700">Rp 1.790.000.000</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm border-b pb-1 text-rose-700">KEWAJIBAN & EKUITAS</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Hutang Pabrik (AP)</span>
                  <span className="font-bold">Rp 320.000.000</span>
                </div>
                <div className="flex justify-between">
                  <span>Modal Disetor</span>
                  <span className="font-bold">Rp 1.225.000.000</span>
                </div>
                <div className="flex justify-between">
                  <span>Laba Ditahan</span>
                  <span className="font-bold">Rp 245.000.000</span>
                </div>
              </div>
              <div className="flex justify-between font-black text-slate-900 border-t pt-2">
                <span>TOTAL PASIVA</span>
                <span className="text-rose-700">Rp 1.790.000.000</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
