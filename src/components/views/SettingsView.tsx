import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Settings,
  Building,
  Percent,
  Shield,
  Database,
  Globe,
  Bell,
  Save,
  CheckCircle
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { systemSettings, updateSystemSettings } = useApp();
  const { language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'company' | 'discount' | 'tax' | 'system'>('company');

  const [companyName, setCompanyName] = useState(systemSettings.companyName);
  const [address, setAddress] = useState(systemSettings.address);
  const [npwp, setNpwp] = useState(systemSettings.npwp);
  const [taxRate, setTaxRate] = useState(systemSettings.taxRate);

  useEffect(() => {
    setCompanyName(systemSettings.companyName);
    setAddress(systemSettings.address);
    setNpwp(systemSettings.npwp);
    setTaxRate(systemSettings.taxRate);
  }, [systemSettings]);

  const handleSave = () => {
    updateSystemSettings({
      id: 'company',
      companyName: companyName.trim(),
      address: address.trim(),
      npwp: npwp.trim(),
      taxRate,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">Pengaturan & Konfigurasi Sistem ERP</h2>
          <p className="text-xs text-slate-500">Konfigurasi data perusahaan, aturan pajak PPN, dan parameter skema diskon</p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Simpan Perubahan
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('company')}
          className={`pb-3 transition-colors ${
            activeTab === 'company'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Profil Perusahaan
        </button>
        <button
          onClick={() => setActiveTab('discount')}
          className={`pb-3 transition-colors ${
            activeTab === 'discount'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Aturan Diskon & Pembayaran
        </button>
        <button
          onClick={() => setActiveTab('tax')}
          className={`pb-3 transition-colors ${
            activeTab === 'tax'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Perpajakan & PPN
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'company' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 max-w-2xl text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Perusahaan Agen / Distributor</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap Kantor & Gudang Utama</label>
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nomor NPWP Badan Perusahaan</label>
            <input
              type="text"
              value={npwp}
              onChange={(e) => setNpwp(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            />
          </div>
        </div>
      )}

      {activeTab === 'discount' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 max-w-2xl text-xs">
          <p className="text-slate-600">
            Sistem ERP ini menggunakan kalkulator diskon beruntun secara otomatis pada setiap baris item faktur (misal: Diskon 10% + 5% + 2% + Rp 1,000).
          </p>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-medium">
            Aturan kalkulasi diskon beruntun bersifat multiplicative (bertingkat), dimana setiap persentase diskon dihitung berdasarkan sisa harga bersih dari step sebelumnya.
          </div>
        </div>
      )}

      {activeTab === 'tax' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 max-w-2xl text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tarif Pajak PPN (%)</label>
            <input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
            />
            <p className="text-[11px] text-slate-500 mt-1">PPN dihitung secara otomatis 11% dari Total Net setelah diskon beruntun.</p>
          </div>
        </div>
      )}
    </div>
  );
};
