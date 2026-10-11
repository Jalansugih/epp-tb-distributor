import { useEffect, useState, useSyncExternalStore } from 'react';
import { getSyncState, subscribeSync, flushOutbox, type SyncState } from '../lib/offline';

/** Live online/offline status of the device. */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

/** Pending/syncing state of changes made while offline. */
export function useSyncStatus(): SyncState & { retry: () => void } {
  const st = useSyncExternalStore(subscribeSync, getSyncState, getSyncState);
  return { ...st, retry: () => { void flushOutbox(); } };
}

// ---------------------------------------------------------------------------
// "Install app" support. The browser fires `beforeinstallprompt` once, early,
// so it is captured at module load (main.tsx imports this file) and handed to
// whichever component asks for it later.
// ---------------------------------------------------------------------------

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

let deferredPrompt: InstallEvent | null = null;
const installListeners = new Set<() => void>();
const notifyInstall = () => installListeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as InstallEvent;
    notifyInstall();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notifyInstall();
  });
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
}

export type InstallState = {
  /** Already running as an installed app. */
  installed: boolean;
  /** One tap install is available (Chrome/Edge/Android/desktop). */
  canPrompt: boolean;
  /** iPhone/iPad Safari: needs manual "Add to Home Screen". */
  needsManualIos: boolean;
  install: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
};

export function useInstallApp(): InstallState {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    installListeners.add(l);
    return () => { installListeners.delete(l); };
  }, []);

  const installed = isStandalone();
  return {
    installed,
    canPrompt: !installed && deferredPrompt !== null,
    needsManualIos: !installed && deferredPrompt === null && isIos(),
    install: async () => {
      if (!deferredPrompt) return 'unavailable';
      const ev = deferredPrompt;
      await ev.prompt();
      const choice = await ev.userChoice;
      deferredPrompt = null;
      notifyInstall();
      return choice.outcome;
    },
  };
}
