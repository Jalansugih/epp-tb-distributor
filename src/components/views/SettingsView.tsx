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
  CheckCircle,
  AlertTriangle,
  Trash2,
  Loader2
} from 'lucide-react';

const RESET_CONFIRM_PHRASE = 'HAPUS SEMUA DATA';

export const SettingsView: React.FC = () => {
  const { systemSettings, updateSystemSettings, resetAllData, isResettingData } = useApp();
  const { language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'company' | 'discount' | 'tax' | 'data'>('company');
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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

  const handleConfirmReset = async () => {
    if (resetConfirmText.trim().toUpperCase() !== RESET_CONFIRM_PHRASE) return;
    await resetAllData();
    setResetConfirmText('');
    setShowResetConfirm(false);
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
        <button
          onClick={() => setActiveTab('data')}
          className={`pb-3 transition-colors ${
            activeTab === 'data'
              ? 'border-b-2 border-rose-600 text-rose-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Kelola Data
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

      {activeTab === 'data' && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-rose-800 text-sm">Zona Berbahaya — Hapus Semua Data</h3>
                <p className="text-xs text-rose-700/90 mt-1 leading-relaxed">
                  Tindakan ini menghapus <strong>seluruh</strong> data master (pelanggan, supplier, produk, dst.)
                  dan seluruh transaksi (Sales Order, Invoice, PO, Stok, dll) dari database — termasuk angka yang
                  masih tampil di Dashboard. Profil perusahaan di tab &quot;Profil Perusahaan&quot; dan akun login
                  tidak ikut terhapus. <strong>Tidak bisa dibatalkan.</strong> Pastikan Anda benar-benar ingin
                  memulai dari nol sebelum melanjutkan.
                </p>
              </div>
            </div>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Semua Data
              </button>
            ) : (
              <div className="bg-white border border-rose-200 rounded-lg p-4 space-y-3">
                <p className="text-xs font-medium text-slate-700">
                  Ketik <span className="font-mono font-bold text-rose-700">{RESET_CONFIRM_PHRASE}</span> di
                  bawah ini untuk mengonfirmasi:
                </p>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder={RESET_CONFIRM_PHRASE}
                  disabled={isResettingData}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs tracking-wide focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none disabled:opacity-60"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleConfirmReset}
                    disabled={resetConfirmText.trim().toUpperCase() !== RESET_CONFIRM_PHRASE || isResettingData}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-2"
                  >
                    {isResettingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {isResettingData ? 'Menghapus…' : 'Ya, Hapus Permanen'}
                  </button>
                  <button
                    onClick={() => {
                      setShowResetConfirm(false);
                      setResetConfirmText('');
                    }}
                    disabled={isResettingData}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition-colors disabled:opacity-60"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 text-xs text-slate-600 leading-relaxed space-y-2">
            <p className="font-bold text-slate-800">Kenapa angka di Dashboard masih muncul walau aplikasi &quot;bersih&quot;?</p>
            <p>
              Semua angka di Dashboard dihitung langsung dari data yang tersimpan di database (Supabase), bukan
              dari kode aplikasi. Jika sebelumnya sempat ada transaksi/data uji coba yang tersimpan, angka itu
              akan tetap tampil sampai baris datanya benar-benar dihapus — baik lewat tombol di atas, atau manual
              melalui Supabase Dashboard → Table Editor.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
