import React, { FormEvent, useState } from 'react';
import { Building2, Eye, EyeOff, KeyRound, Loader2, LockKeyhole, Mail, ShieldCheck, User, UserPlus } from 'lucide-react';
import { lookupInviteCode, signIn, signUp } from '../../lib/auth';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { APP_NAME } from '../../lib/appInfo';

type Mode = 'login' | 'register';
type RegisterType = 'create' | 'join';

const inputClass =
  'w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export const LoginView: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [registerType, setRegisterType] = useState<RegisterType>('create');
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const disabled = loading || !isSupabaseConfigured;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setInfo('');
    setPassword('');
    setConfirmPassword('');
  };

  const register = async () => {
    if (!fullName.trim()) return setError('Nama lengkap wajib diisi.');
    if (registerType === 'create' && !organizationName.trim()) return setError('Nama perusahaan wajib diisi.');
    if (registerType === 'join' && !inviteCode.trim()) return setError('Kode undangan wajib diisi.');
    if (password.length < 8) return setError('Password minimal 8 karakter.');
    if (password !== confirmPassword) return setError('Konfirmasi password tidak sama.');

    let joinedCompany = '';
    if (registerType === 'join') {
      const name = await lookupInviteCode(inviteCode.trim());
      if (!name) return setError('Kode undangan tidak ditemukan. Minta kode yang benar ke administrator perusahaan.');
      joinedCompany = name;
    }

    const { needsEmailConfirmation } = await signUp(
      registerType === 'create'
        ? { type: 'create', fullName: fullName.trim(), email: email.trim(), password, organizationName: organizationName.trim() }
        : { type: 'join', fullName: fullName.trim(), email: email.trim(), password, inviteCode: inviteCode.trim() }
    );

    const nextStep =
      registerType === 'create'
        ? 'Setelah itu Anda bisa langsung masuk sebagai administrator perusahaan Anda.'
        : `Setelah itu, tunggu administrator ${joinedCompany} mengaktifkan akun Anda.`;
    setInfo(
      needsEmailConfirmation
        ? `Pendaftaran berhasil. Cek email Anda untuk konfirmasi. ${nextStep}`
        : registerType === 'create'
          ? 'Perusahaan dan akun administrator berhasil dibuat.'
          : `Pendaftaran berhasil. Akun Anda menunggu persetujuan administrator ${joinedCompany}.`
    );
    if (needsEmailConfirmation) {
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim() || !password) return setError('Email dan password wajib diisi.');
    try {
      setLoading(true);
      if (mode === 'register') await register();
      else await signIn(email.trim(), password);
    } catch (err: any) {
      setError(
        err?.message ||
          (mode === 'register' ? 'Pendaftaran gagal. Coba lagi.' : 'Login gagal. Periksa email dan password Anda.')
      );
    } finally {
      setLoading(false);
    }
  };

  const tabClass = (active: boolean) =>
    `flex-1 h-9 rounded-lg text-xs font-bold transition-colors ${
      active ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
    }`;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-600/20">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">{APP_NAME}</h1>
          <p className="text-sm text-slate-400 mt-1">Distributor Management System</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-7">
          <h2 className="text-lg font-black text-slate-900">{mode === 'login' ? 'Masuk ke sistem' : 'Daftar akun baru'}</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            {mode === 'login'
              ? 'Gunakan akun yang sudah terdaftar dan aktif.'
              : 'Buat perusahaan baru, atau bergabung ke perusahaan yang sudah ada dengan kode undangan.'}
          </p>
          {!isSupabaseConfigured && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Supabase belum dikonfigurasi. Isi variabel environment Supabase terlebih dahulu.
            </div>
          )}
          {info && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{info}</div>}
          {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="flex gap-1 p-1 rounded-xl bg-slate-100" role="tablist" aria-label="Jenis pendaftaran">
                  <button type="button" className={tabClass(registerType === 'create')} onClick={() => setRegisterType('create')} disabled={disabled}>
                    Buat perusahaan baru
                  </button>
                  <button type="button" className={tabClass(registerType === 'join')} onClick={() => setRegisterType('join')} disabled={disabled}>
                    Gabung dengan kode
                  </button>
                </div>

                {registerType === 'create' ? (
                  <label className="block">
                    <span className="block text-xs font-bold text-slate-700 mb-1.5">Nama perusahaan</span>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={organizationName} onChange={e => setOrganizationName(e.target.value)} placeholder="PT Contoh Distribusi" className={inputClass} disabled={disabled} />
                    </div>
                    <span className="block text-[11px] text-slate-500 mt-1">Anda otomatis menjadi administrator perusahaan ini.</span>
                  </label>
                ) : (
                  <label className="block">
                    <span className="block text-xs font-bold text-slate-700 mb-1.5">Kode undangan</span>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="Kode dari administrator" autoCapitalize="none" autoCorrect="off" spellCheck={false} className={`${inputClass} font-mono tracking-wide`} disabled={disabled} />
                    </div>
                    <span className="block text-[11px] text-slate-500 mt-1">Akun perlu disetujui administrator perusahaan tersebut.</span>
                  </label>
                )}

                <label className="block">
                  <span className="block text-xs font-bold text-slate-700 mb-1.5">Nama lengkap</span>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nama Anda" className={inputClass} disabled={disabled} />
                  </div>
                </label>
              </>
            )}

            <label className="block">
              <span className="block text-xs font-bold text-slate-700 mb-1.5">Email</span>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@perusahaan.com" className={inputClass} disabled={disabled} />
              </div>
            </label>

            <label className="block">
              <span className="block text-xs font-bold text-slate-700 mb-1.5">Password</span>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan password" className={`${inputClass} pr-11`} disabled={disabled} />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700" aria-label="Tampilkan password">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            {mode === 'register' && (
              <label className="block">
                <span className="block text-xs font-bold text-slate-700 mb-1.5">Konfirmasi password</span>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Ulangi password" className={inputClass} disabled={disabled} />
                </div>
              </label>
            )}

            <button type="submit" disabled={disabled} className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'login' ? <ShieldCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {loading ? 'Memproses…' : mode === 'login' ? 'Masuk' : 'Daftar'}
            </button>
          </form>
          <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-600 text-center">
            {mode === 'login' ? (
              <>Belum punya akun? <button type="button" onClick={() => switchMode('register')} className="font-bold text-blue-600 hover:text-blue-700">Daftar akun baru</button></>
            ) : (
              <>Sudah punya akun? <button type="button" onClick={() => switchMode('login')} className="font-bold text-blue-600 hover:text-blue-700">Masuk</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
