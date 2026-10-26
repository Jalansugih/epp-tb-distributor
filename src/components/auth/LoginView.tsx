import React, { FormEvent, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  LifeBuoy,
  Loader2,
  LockKeyhole,
  Mail,
  Moon,
  School,
  Store,
  Sun,
  User,
  type LucideIcon,
} from 'lucide-react';
import { lookupInviteCode, signIn, signUp } from '../../lib/auth';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { APP_NAME } from '../../lib/appInfo';

type Mode = 'login' | 'register';
type RegisterType = 'create' | 'join';

type ProductInfo = {
  id: string;
  name: string;
  tagline: string;
  url: string;
  icon: LucideIcon;
  accent: string;
};

const THEME_KEY = 'login_theme';

const PRODUCTS: ProductInfo[] = [
  {
    id: 'rajakas-id',
    name: 'Rajakas.id',
    tagline: 'Aplikasi Kasir Lengkap',
    url: 'https://rajakas.id',
    icon: Store,
    accent: 'bg-blue-500/10 text-blue-600 ldark:text-blue-400',
  },
  {
    id: 'rajakas-com',
    name: 'Rajakas.com',
    tagline: 'ERP & Distributor Management',
    url: 'https://rajakas.com',
    icon: Boxes,
    accent: 'bg-indigo-500/10 text-indigo-600 ldark:text-indigo-400',
  },
  {
    id: 'rajakas-my-id',
    name: 'Rajakas.my.id',
    tagline: 'Aplikasi Bendahara Sekolah',
    url: 'https://rajakas.my.id',
    icon: School,
    accent: 'bg-teal-500/10 text-teal-600 ldark:text-teal-400',
  },
  {
    id: 'invoice-system',
    name: 'Aplikasi Invoice System',
    tagline: 'Pembuatan & Pengelolaan Invoice',
    url: 'https://invoice-system-lilac-eta.vercel.app/',
    icon: FileText,
    accent: 'bg-violet-500/10 text-violet-600 ldark:text-violet-400',
  },
];

type FieldProps = { icon: LucideIcon; right?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>;

const Field: React.FC<FieldProps> = ({ icon: Icon, right, className = '', ...props }) => (
  <div className="relative flex items-center">
    <Icon className="absolute left-4 w-4 h-4 text-slate-400 ldark:text-slate-500 pointer-events-none" aria-hidden />
    <input
      {...props}
      className={`w-full py-3 pl-11 ${right ? 'pr-11' : 'pr-4'} rounded-xl neu-input text-base sm:text-sm font-semibold text-slate-800 ldark:text-slate-100 placeholder:text-slate-400 ldark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60 ${className}`}
    />
    {right}
  </div>
);

const Heading: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="text-center mb-5">
    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 ldark:text-white mb-0.5">{title}</h2>
    <p className="text-[10px] font-semibold text-slate-500 ldark:text-slate-400 login-tracking uppercase">{subtitle}</p>
  </div>
);

const Hint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[11px] text-slate-500 ldark:text-slate-400 px-1 -mt-1">{children}</p>
);

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

  // Tema khusus halaman login (default gelap), disimpan terpisah dari bagian aplikasi lain.
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_KEY) !== 'light';
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      /* storage tidak tersedia — abaikan */
    }
  }, [isDark]);

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
    `flex-1 h-9 rounded-lg text-[11px] font-bold transition-all cursor-pointer disabled:cursor-not-allowed ${
      active
        ? 'neu-flat text-blue-600 ldark:text-blue-400'
        : 'text-slate-500 ldark:text-slate-400 hover:text-slate-800 ldark:hover:text-slate-200'
    }`;

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword(v => !v)}
      className="absolute right-3 p-1.5 text-slate-400 ldark:text-slate-500 hover:text-slate-600 ldark:hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
    >
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div
      className={`login-theme ${isDark ? 'login-dark' : ''} min-h-screen w-full relative overflow-x-hidden flex items-center justify-center px-3 pb-6 pt-16 lg:p-6 text-slate-800 ldark:text-slate-100`}
    >
      {/* Lingkaran ambient latar */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
      </div>

      {/* Tombol tema */}
      <button
        type="button"
        onClick={() => setIsDark(v => !v)}
        className="fixed top-4 right-4 w-10 h-10 rounded-full neu-flat flex items-center justify-center text-slate-600 ldark:text-amber-400 hover:scale-105 active:scale-95 transition-all duration-300 z-40 cursor-pointer"
        aria-label={isDark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center relative z-10">
        {/* ============ PANEL KIRI: EKOSISTEM (desktop) ============ */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full neu-flat">
              <span className="text-[10px] font-black tracking-widest text-blue-600 ldark:text-blue-400 uppercase">
                Digital Business Ecosystem
              </span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black text-slate-900 ldark:text-white tracking-tight leading-none">
              BINA<span className="text-blue-600 ldark:text-blue-400">USAHA</span>
            </h1>
            <h2 className="text-lg font-bold text-blue-600 ldark:text-blue-400">Satu Ekosistem. Beragam Solusi Bisnis.</h2>
            <p className="text-slate-600 ldark:text-slate-300 text-xs xl:text-sm leading-relaxed max-w-lg">
              Kelola bisnis, distribusi, dan administrasi sekolah melalui solusi digital yang dirancang untuk mempermudah pekerjaan Anda.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 my-6">
            {PRODUCTS.map(item => {
              const Icon = item.icon;
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neu-flat p-3.5 rounded-2xl flex flex-col justify-between gap-3 border border-white/40 ldark:border-slate-800 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 transition-transform cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${item.accent} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-900 ldark:text-white text-sm leading-tight">{item.name}</h3>
                      <p className="text-[11px] font-semibold text-slate-500 ldark:text-slate-400 leading-tight">{item.tagline}</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 group-hover:text-blue-600 ldark:group-hover:text-blue-400 transition-colors flex items-center gap-1 font-bold">
                    <span>Lihat Detail</span>
                    <ChevronRight className="w-3 h-3" aria-hidden />
                  </div>
                </a>
              );
            })}
          </div>

          <a
            href="https://binausaha.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-blue-glow w-full py-3 px-5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
          >
            <LifeBuoy className="w-4 h-4" aria-hidden />
            <span>Lengkapi Bisnismu Disini</span>
            <ChevronRight className="w-4 h-4" aria-hidden />
          </a>

          <div className="pt-3 mt-4 text-[11px] font-medium text-slate-500 ldark:text-slate-400">
            &copy; 2026 Binausaha.com &middot; All rights reserved.
          </div>
        </div>

        {/* ============ PANEL KANAN: KARTU LOGIN ============ */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center w-full max-w-sm mx-auto">
          <main className="w-full neu-card-container p-5 sm:p-6 rounded-3xl flex flex-col items-center">
            <div className="w-[72px] h-[72px] rounded-2xl neu-badge flex items-center justify-center p-2 mb-3">
              <img
                src={isDark ? '/logo-drak-mode.png' : '/logo-rk-bendahara.png'}
                alt={APP_NAME}
                width={56}
                height={56}
                decoding="async"
                className="w-full h-full object-contain"
              />
            </div>

            <div key={mode} className="w-full flex flex-col items-center login-fade">
              {mode === 'login' ? (
                <Heading title="Selamat Datang" subtitle="Masuk untuk melanjutkan" />
              ) : (
                <Heading title="Buat Akun Baru" subtitle="Bergabung dengan ekosistem" />
              )}

              {!isSupabaseConfigured && (
                <div className="w-full mb-4 rounded-xl neu-input p-3 text-xs text-amber-700 ldark:text-amber-300 flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                  <span>Supabase belum dikonfigurasi. Isi variabel environment Supabase terlebih dahulu.</span>
                </div>
              )}
              {info && (
                <div role="status" className="w-full mb-4 rounded-xl neu-input p-3 text-xs text-emerald-700 ldark:text-emerald-300 flex gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" />
                  <span>{info}</span>
                </div>
              )}
              {error && (
                <div role="alert" className="w-full mb-4 rounded-xl neu-input p-3 text-xs text-rose-600 ldark:text-rose-300 flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={submit} className="w-full space-y-3 px-1">
                {mode === 'register' && (
                  <>
                    <div className="flex gap-1 p-1 rounded-xl neu-input" role="tablist" aria-label="Jenis pendaftaran">
                      <button type="button" role="tab" aria-selected={registerType === 'create'} className={tabClass(registerType === 'create')} onClick={() => setRegisterType('create')} disabled={disabled}>
                        Buat perusahaan baru
                      </button>
                      <button type="button" role="tab" aria-selected={registerType === 'join'} className={tabClass(registerType === 'join')} onClick={() => setRegisterType('join')} disabled={disabled}>
                        Gabung dengan kode
                      </button>
                    </div>

                    {registerType === 'create' ? (
                      <>
                        <Field icon={Building2} type="text" aria-label="Nama perusahaan" value={organizationName} onChange={e => setOrganizationName(e.target.value)} placeholder="Nama perusahaan" disabled={disabled} />
                        <Hint>Anda otomatis menjadi administrator perusahaan ini. Password minimal 8 karakter.</Hint>
                      </>
                    ) : (
                      <>
                        <Field icon={KeyRound} type="text" aria-label="Kode undangan" value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="Kode undangan dari administrator" autoCapitalize="none" autoCorrect="off" spellCheck={false} className="font-mono tracking-wide" disabled={disabled} />
                        <Hint>Akun perlu disetujui administrator perusahaan tersebut.</Hint>
                      </>
                    )}

                    <Field icon={User} type="text" aria-label="Nama lengkap" autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nama lengkap" disabled={disabled} />
                  </>
                )}

                <Field icon={Mail} type="email" aria-label="Email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@perusahaan.com" disabled={disabled} />

                <Field
                  icon={LockKeyhole}
                  type={showPassword ? 'text' : 'password'}
                  aria-label="Password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'login' ? 'Password' : 'Buat password'}
                  disabled={disabled}
                  right={passwordToggle}
                />

                {mode === 'register' && (
                  <Field icon={LockKeyhole} type={showPassword ? 'text' : 'password'} aria-label="Konfirmasi password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Ulangi password" disabled={disabled} />
                )}

                <button
                  type="submit"
                  disabled={disabled}
                  className="w-full py-3 px-5 rounded-xl btn-blue-glow text-white font-bold text-sm flex items-center justify-center relative overflow-hidden mt-2 cursor-pointer group"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Memproses…
                    </span>
                  ) : (
                    <>
                      <span className="tracking-wide">{mode === 'login' ? 'Masuk' : 'Daftar Sekarang'}</span>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all">
                        <ArrowRight className="w-3.5 h-3.5 text-white" />
                      </span>
                    </>
                  )}
                </button>
              </form>

              <footer className="w-full text-center space-y-1.5 mt-5">
                <p className="text-[9px] font-extrabold text-slate-500 ldark:text-slate-400 login-tracking uppercase">
                  Distributor Management System
                </p>
                <div className="flex items-center justify-center gap-1 text-[11px]">
                  <span className="font-medium text-slate-500 ldark:text-slate-400">
                    {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
                  </span>
                  <button
                    type="button"
                    onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                    className="font-bold text-blue-600 ldark:text-blue-400 hover:underline cursor-pointer bg-transparent border-0"
                  >
                    {mode === 'login' ? 'Daftar Sekarang' : 'Masuk di sini'}
                  </button>
                </div>
                <p className="lg:hidden text-[9px] text-slate-400 ldark:text-slate-500 font-medium pt-1">
                  &copy; 2026 Binausaha.com &middot; All rights reserved.
                </p>
              </footer>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
