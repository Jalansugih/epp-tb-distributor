import React from 'react';
import { CalendarClock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscriptionNotice } from '../../lib/subscription';

/**
 * Pengingat masa trial / langganan hampir habis. Hanya untuk admin perusahaan
 * (yang berwenang berlangganan); tidak tampil untuk super admin.
 */
export const SubscriptionBanner: React.FC = () => {
  const { profile } = useAuth();
  if (!profile || profile.is_super_admin || profile.role?.toLowerCase() !== 'admin') return null;

  const notice = subscriptionNotice(profile);
  if (!notice) return null;

  const tone = notice.tone === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-sky-50 border-sky-200 text-sky-900';
  return (
    <div role="status" className={`border-b px-4 py-2 text-xs font-semibold flex items-center gap-2 ${tone}`}>
      <CalendarClock className="w-4 h-4 shrink-0" />
      <span>{notice.text}</span>
    </div>
  );
};
