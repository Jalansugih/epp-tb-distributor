import React, { useEffect, useState } from 'react';
import { User, Save, KeyRound, Building, Shield, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { changeMyPassword, profileErrorCode, updateMyFullName, type ProfileErrorCode } from '../../lib/auth';

type Msg = { type: 'ok' | 'err'; text: string } | null;

const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 100;

const inputClass =
  'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 text-xs focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none';

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  showLabel: string;
  hideLabel: string;
};

/** Password input with a show/hide toggle. */
const PasswordField: React.FC<PasswordFieldProps> = ({ label, value, onChange, autoComplete, showLabel, hideLabel }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="block font-bold text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className={`${inputClass} pr-9`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
          title={visible ? hideLabel : showLabel}
          className="absolute inset-y-0 right-0 px-2.5 text-slate-400 hover:text-slate-600"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export const ProfileView: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMsg, setNameMsg] = useState<Msg>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<Msg>(null);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
  }, [profile?.full_name]);

  /** Translates a known error code; unknown errors fall back to their message. */
  const describeError = (err: unknown, fallbackKey: string): string => {
    const code: ProfileErrorCode | null = profileErrorCode(err);
    switch (code) {
      case 'NAME_EMPTY':
        return t('profile.name_empty');
      case 'PROFILE_NOT_FOUND':
        return t('profile.profile_not_found');
      case 'NOT_AUTHENTICATED':
        return t('profile.session_expired');
      case 'CURRENT_PASSWORD_WRONG':
        return t('profile.password_wrong');
      case 'PASSWORD_SAME':
        return t('profile.password_same');
      default: {
        const message = (err as { message?: string } | null)?.message;
        return message || t(fallbackKey);
      }
    }
  };

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nameBusy) return;
    const name = fullName.trim();
    if (!name) return setNameMsg({ type: 'err', text: t('profile.name_empty') });
    if (name === (profile?.full_name ?? '')) return;
    try {
      setNameBusy(true);
      setNameMsg(null);
      await updateMyFullName(name);
      // The name is already saved at this point; a failed refresh must not be
      // reported as a failed save.
      await refreshProfile().catch((err) => console.error('[Profile] refresh failed:', err));
      setNameMsg({ type: 'ok', text: t('profile.name_saved') });
    } catch (err) {
      setNameMsg({ type: 'err', text: describeError(err, 'profile.name_failed') });
    } finally {
      setNameBusy(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwBusy) return;
    if (!currentPassword) return setPwMsg({ type: 'err', text: t('profile.password_wrong') });
    if (password.length < MIN_PASSWORD_LENGTH) return setPwMsg({ type: 'err', text: t('profile.password_min') });
    if (password !== confirm) return setPwMsg({ type: 'err', text: t('profile.password_mismatch') });
    if (password === currentPassword) return setPwMsg({ type: 'err', text: t('profile.password_same') });
    try {
      setPwBusy(true);
      setPwMsg(null);
      await changeMyPassword(currentPassword, password);
      setCurrentPassword('');
      setPassword('');
      setConfirm('');
      setPwMsg({ type: 'ok', text: t('profile.password_saved') });
    } catch (err) {
      setPwMsg({ type: 'err', text: describeError(err, 'profile.password_failed') });
    } finally {
      setPwBusy(false);
    }
  };

  const banner = (m: Msg) =>
    m && (
      <div
        role={m.type === 'err' ? 'alert' : 'status'}
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

  const nameUnchanged = fullName.trim() === (profile?.full_name ?? '');

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-base font-bold text-slate-800">{t('profile.title')}</h2>
        <p className="text-xs text-slate-500">{t('profile.subtitle')}</p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg ring-2 ring-blue-500/30">
          {(profile?.full_name || user?.email || 'U').slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 space-y-1 text-xs">
          <div className="text-sm font-bold text-slate-900 truncate">{profile?.full_name || t('profile.default_name')}</div>
          <div className="text-slate-500 truncate">{user?.email}</div>
          <div className="flex flex-wrap items-center gap-3 text-slate-600">
            <span className="flex items-center gap-1" title="Role"><Shield className="w-3.5 h-3.5 text-slate-400" />{profile?.role ?? 'User'}</span>
            <span className="flex items-center gap-1" title={t('profile.company')}><Building className="w-3.5 h-3.5 text-slate-400" />{profile?.organization_name ?? '—'}</span>
          </div>
        </div>
      </div>

      <form onSubmit={saveName} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-800"><User className="w-4 h-4 text-blue-600" />{t('profile.display_name')}</div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">{t('profile.full_name')}</label>
          <input
            className={inputClass}
            value={fullName}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="name"
            onChange={(e) => {
              setFullName(e.target.value);
              if (nameMsg) setNameMsg(null);
            }}
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">{t('profile.email')}</label>
          <input className={`${inputClass} opacity-60`} value={user?.email ?? ''} disabled />
        </div>
        {banner(nameMsg)}
        <button
          type="submit"
          disabled={nameBusy || nameUnchanged || !fullName.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl flex items-center gap-2"
        >
          {nameBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{t('profile.save_name')}
        </button>
      </form>

      <form onSubmit={savePassword} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-800"><KeyRound className="w-4 h-4 text-blue-600" />{t('profile.change_password')}</div>
        <PasswordField
          label={t('profile.current_password')}
          value={currentPassword}
          onChange={(v) => { setCurrentPassword(v); if (pwMsg) setPwMsg(null); }}
          autoComplete="current-password"
          showLabel={t('profile.show_password')}
          hideLabel={t('profile.hide_password')}
        />
        <PasswordField
          label={t('profile.new_password')}
          value={password}
          onChange={(v) => { setPassword(v); if (pwMsg) setPwMsg(null); }}
          autoComplete="new-password"
          showLabel={t('profile.show_password')}
          hideLabel={t('profile.hide_password')}
        />
        <PasswordField
          label={t('profile.confirm_password')}
          value={confirm}
          onChange={(v) => { setConfirm(v); if (pwMsg) setPwMsg(null); }}
          autoComplete="new-password"
          showLabel={t('profile.show_password')}
          hideLabel={t('profile.hide_password')}
        />
        {banner(pwMsg)}
        <button
          type="submit"
          disabled={pwBusy || !currentPassword || !password || !confirm}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl flex items-center gap-2"
        >
          {pwBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}{t('profile.change_password')}
        </button>
      </form>
    </div>
  );
};
