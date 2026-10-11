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
  Loader2,
  Users,
  Copy,
  RefreshCw
} from 'lucide-react';
import { getInviteCode, listProfiles, regenerateInviteCode, setProfileActive, type AppProfile } from '../../lib/auth';
import { useAuth } from '../../context/AuthContext';

const RESET_CONFIRM_PHRASE = 'HAPUS SEMUA DATA';

export const SettingsView: React.FC = () => {
  const { systemSettings, updateSystemSettings, resetAllData, isResettingData } = useApp();
  const { language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'company' | 'discount' | 'tax' | 'accounts' | 'data'>('company');
  const { user, profile } = useAuth();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [accounts, setAccounts] = useState<AppProfile[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadAccounts = async () => {
    try {
      setAccountsLoading(true);
      setAccountsError('');
      const [list, code] = await Promise.all([listProfiles(), getInviteCode()]);
      setAccounts(list);
      setInviteCode(code);
    } catch (err: any) {
      setAccountsError(err?.message || 'Gagal memuat daftar akun.');
    } finally {
      setAccountsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'accounts') void loadAccounts();
  }, [activeTab]);

  const copyInviteCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      setAccountsError('Gagal menyalin. Salin kode secara manual.');
    }
  };

  const regenerateCode = async () => {
    if (!window.confirm('Buat kode undangan baru? Kode lama langsung tidak berlaku.')) return;
    try {
      setInviteBusy(true);
      setAccountsError('');
      setInviteCode(await regenerateInviteCode());
    } catch (err: any) {
      setAccountsError(err?.message || 'Gagal membuat kode undangan baru.');
    } finally {
      setInviteBusy(false);
    }
  };

  const toggleAccount = async (a: AppProfile) => {
    try {
      setBusyId(a.id);
      setAccountsError('');
      await setProfileActive(a.id, !a.active);
      setAccounts(list => list.map(x => (x.id === a.id ? { ...x, active: !a.active } : x)));
    } catch (err: any) {
      setAccountsError(err?.message || 'Gagal mengubah status akun.');
    } finally {
      setBusyId(null);
    }
  };
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
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold overflow-x-auto whitespace-nowrap [&>button]:shrink-0">
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
          onClick={() => setActiveTab('accounts')}
          className={`pb-3 transition-colors ${
            activeTab === 'accounts'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Akun Pengguna
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

      {activeTab === 'accounts' && (
        <div className="max-w-3xl space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-slate-700">Kode undangan {profile?.organization_name ?? 'perusahaan'}</div>
            <p className="text-[11px] text-slate-500">Bagikan kode ini ke karyawan. Mereka daftar lewat &quot;Gabung dengan kode&quot;, lalu akunnya muncul di bawah untuk Anda aktifkan.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 truncate rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm tracking-wider text-slate-800">{inviteCode ?? '—'}</code>
              <button onClick={() => void copyInviteCode()} disabled={!inviteCode} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 disabled:opacity-40">
                <Copy className="w-3.5 h-3.5" />{inviteCopied ? 'Tersalin' : 'Salin'}
              </button>
              <button onClick={() => void regenerateCode()} disabled={inviteBusy} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 disabled:opacity-40">
                <RefreshCw className={`w-3.5 h-3.5 ${inviteBusy ? 'animate-spin' : ''}`} />Buat ulang
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Akun yang bergabung dengan kode berstatus <strong>Menunggu</strong> sampai Anda mengaktifkannya.</p>
            <button onClick={() => void loadAccounts()} className="text-xs font-bold text-blue-600 hover:text-blue-700">Muat ulang</button>
          </div>
          {accountsError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{accountsError}</div>}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {accountsLoading ? (
              <div className="p-6 flex items-center justify-center text-xs text-slate-500 gap-2"><Loader2 className="w-4 h-4 animate-spin" />Memuat…</div>
            ) : accounts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">Belum ada akun.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {accounts.map(a => (
                  <li key={a.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"><Users className="w-4 h-4" /></div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-800 truncate">{a.full_name || a.email}</div>
                        <div className="text-[11px] text-slate-500 truncate">{a.email} · {a.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${a.active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{a.active ? 'Aktif' : 'Menunggu / nonaktif'}</span>
                      <button
                        onClick={() => void toggleAccount(a)}
                        disabled={busyId === a.id || a.id === user?.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed ${a.active ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                      >
                        {a.active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
