import React, { useEffect, useState } from 'react';
import { User, Save, KeyRound, Building, Shield, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { changeMyPassword, updateMyFullName } from '../../lib/auth';

type Msg = { type: 'ok' | 'err'; text: string } | null;

export const ProfileView: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMsg, setNameMsg] = useState<Msg>(null);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<Msg>(null);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
  }, [profile?.full_name]);

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = fullName.trim();
    if (!name) return setNameMsg({ type: 'err', text: 'Nama tidak boleh kosong.' });
    try {
      setNameBusy(true);
      setNameMsg(null);
      await updateMyFullName(name);
      await refreshProfile();
      setNameMsg({ type: 'ok', text: 'Nama berhasil diperbarui.' });
    } catch (err: any) {
      setNameMsg({ type: 'err', text: err?.message || 'Gagal memperbarui nama.' });
    } finally {
      setNameBusy(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setPwMsg({ type: 'err', text: 'Password minimal 8 karakter.' });
    if (password !== confirm) return setPwMsg({ type: 'err', text: 'Konfirmasi password tidak sama.' });
    try {
      setPwBusy(true);
      setPwMsg(null);
      await changeMyPassword(password);
      setPassword('');
      setConfirm('');
      setPwMsg({ type: 'ok', text: 'Password berhasil diganti.' });
    } catch (err: any) {
      setPwMsg({ type: 'err', text: err?.message || 'Gagal mengganti password.' });
    } finally {
      setPwBusy(false);
    }
  };

  const banner = (m: Msg) =>
    m && (
      <div
        className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs ${
          m.type === 'ok'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-rose-200 bg-rose-50 text-rose-700'
        }`}
      >
        {m.type === 'ok' && <CheckCircle className="w-4 h-4 shrink-0" />}
        {m.text}
      </div>
    );

  const input =
    'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 text-xs focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none';

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-base font-bold text-slate-800">Profil Saya</h2>
        <p className="text-xs text-slate-500">Kelola nama tampilan dan password akun Anda</p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg ring-2 ring-blue-500/30">
          {(profile?.full_name || user?.email || 'U').slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 space-y-1 text-xs">
          <div className="text-sm font-bold text-slate-900 truncate">{profile?.full_name || 'Pengguna'}</div>
          <div className="text-slate-500 truncate">{user?.email}</div>
          <div className="flex flex-wrap items-center gap-3 text-slate-600">
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-slate-400" />{profile?.role ?? 'User'}</span>
            <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5 text-slate-400" />{profile?.organization_name ?? '—'}</span>
          </div>
        </div>
      </div>

      <form onSubmit={saveName} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-800"><User className="w-4 h-4 text-blue-600" />Nama Tampilan</div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
          <input className={input} value={fullName} maxLength={100} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Email</label>
          <input className={`${input} opacity-60`} value={user?.email ?? ''} disabled />
        </div>
        {banner(nameMsg)}
        <button
          type="submit"
          disabled={nameBusy || fullName.trim() === (profile?.full_name ?? '')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl flex items-center gap-2"
        >
          {nameBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Simpan Nama
        </button>
      </form>

      <form onSubmit={savePassword} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-800"><KeyRound className="w-4 h-4 text-blue-600" />Ganti Password</div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Password Baru</label>
          <input type="password" autoComplete="new-password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Ulangi Password Baru</label>
          <input type="password" autoComplete="new-password" className={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {banner(pwMsg)}
        <button
          type="submit"
          disabled={pwBusy || !password}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl flex items-center gap-2"
        >
          {pwBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}Ganti Password
        </button>
      </form>
    </div>
  );
};
