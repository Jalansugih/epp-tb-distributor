import React, { FormEvent, useState } from 'react';
import { Building2, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { signIn } from '../../lib/auth';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { APP_NAME } from '../../lib/appInfo';

export const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) return setError('Email dan password wajib diisi.');
    try {
      setLoading(true);
      await signIn(email.trim(), password);
    } catch (err: any) {
      setError(err?.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

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
          <h2 className="text-lg font-black text-slate-900">Masuk ke sistem</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">Gunakan akun yang terdaftar di Supabase Authentication.</p>
          {!isSupabaseConfigured && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Supabase belum dikonfigurasi. Isi variabel environment Supabase terlebih dahulu.</div>}
          {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <label className="block"><span className="block text-xs font-bold text-slate-700 mb-1.5">Email</span><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@perusahaan.com" className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" disabled={loading || !isSupabaseConfigured} /></div></label>
            <label className="block"><span className="block text-xs font-bold text-slate-700 mb-1.5">Password</span><div className="relative"><LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan password" className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" disabled={loading || !isSupabaseConfigured} /><button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700" aria-label="Tampilkan password">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></label>
            <button type="submit" disabled={loading || !isSupabaseConfigured} className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black flex items-center justify-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}{loading ? 'Memproses…' : 'Masuk'}</button>
          </form>
          <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500 text-center">Akun pengguna dibuat dan dikelola melalui Supabase Authentication.</div>
        </div>
      </div>
    </div>
  );
};
