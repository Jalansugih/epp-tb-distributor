import React from 'react';
import { CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useOnlineStatus, useSyncStatus } from '../../hooks/useOffline';
import { retryRejected, discardRejected } from '../../lib/offline';

/**
 * Thin status strip under the top bar:
 *  - offline: explains that changes are kept on the device
 *  - online with queued changes: shows the sync progress
 *  - server rejected some queued changes: tells the user
 * Renders nothing when everything is normal.
 */
export const OfflineBanner: React.FC = () => {
  const online = useOnlineStatus();
  const { pending, syncing, rejected, lastError, retry } = useSyncStatus();

  let tone = '';
  let icon: React.ReactNode = null;
  let text = '';
  let action: React.ReactNode = null;

  if (!online) {
    tone = 'bg-amber-500 text-slate-950';
    icon = <CloudOff className="w-4 h-4 shrink-0" />;
    text = pending > 0
      ? `Mode offline — ${pending} perubahan tersimpan di perangkat & dikirim otomatis saat online.`
      : 'Mode offline — data terakhir tetap bisa dilihat. Perubahan disimpan di perangkat dan dikirim otomatis saat online.';
  } else if (pending > 0) {
    tone = 'bg-blue-600 text-white';
    icon = <RefreshCw className={`w-4 h-4 shrink-0 ${syncing ? 'animate-spin' : ''}`} />;
    text = syncing ? `Menyinkronkan ${pending} perubahan ke server…` : `${pending} perubahan menunggu dikirim ke server.`;
    action = !syncing && (
      <button onClick={retry} className="ml-2 underline font-bold shrink-0">Coba lagi</button>
    );
  } else if (rejected > 0) {
    tone = 'bg-rose-600 text-white';
    icon = <AlertTriangle className="w-4 h-4 shrink-0" />;
    text = `${rejected} perubahan ditolak server${lastError ? `: ${lastError}` : ''}. Data masih tersimpan di perangkat ini.`;
    action = (
      <span className="ml-2 flex gap-3 shrink-0">
        <button onClick={() => void retryRejected()} className="underline font-bold">Kirim ulang</button>
        <button
          onClick={() => { if (window.confirm('Hapus permanen perubahan yang ditolak ini dari perangkat?')) void discardRejected(); }}
          className="underline font-bold"
        >
          Hapus
        </button>
      </span>
    );
  } else {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`sticky top-14 sm:top-16 z-20 flex items-center gap-2 px-3 sm:px-6 py-1.5 text-[11px] sm:text-xs font-semibold ${tone}`}
    >
      {icon}
      <span className="min-w-0 flex-1">{text}</span>
      {action}
    </div>
  );
};
