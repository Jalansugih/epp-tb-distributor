import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getProfile, signOut, type AppProfile } from '../lib/auth';
import { setActiveOrganization } from '../lib/db';
import { clearReadCache, isNetworkError, isOffline } from '../lib/offline';

// Last signed-in user + profile, so the installed app can open with no internet.
const AUTH_CACHE_KEY = 'rajakas_auth_cache_v1';
type AuthCache = { user: { id: string; email?: string }; profile: AppProfile };

function readAuthCache(): AuthCache | null {
  try {
    const raw = window.localStorage.getItem(AUTH_CACHE_KEY);
    return raw ? (JSON.parse(raw) as AuthCache) : null;
  } catch {
    return null;
  }
}
function writeAuthCache(value: AuthCache | null) {
  try {
    if (value) window.localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(value));
    else window.localStorage.removeItem(AUTH_CACHE_KEY);
  } catch {
    /* storage unavailable */
  }
}

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: AppProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    const useCachedSession = () => {
      const cached = readAuthCache();
      if (!cached) return false;
      setActiveOrganization(cached.profile.organization_id ?? null);
      setUser(cached.user as unknown as User);
      setProfile(cached.profile);
      setLoading(false);
      return true;
    };

    const load = async (nextSession: Session | null) => {
      if (!active) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession?.user) {
        // Offline with no usable session (e.g. the access token expired while
        // the device had no internet): keep the user in using the cached login.
        if (isOffline() && useCachedSession()) return;
        setActiveOrganization(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      // No connection: skip the (slow, retried) network call and use the saved profile.
      if (isOffline()) {
        const cached = readAuthCache();
        if (cached && cached.user.id === nextSession.user.id) {
          setActiveOrganization(cached.profile.organization_id ?? null);
          if (active) setProfile(cached.profile);
          if (active) setLoading(false);
          return;
        }
      }
      try {
        const nextProfile = await getProfile(nextSession.user.id);
        // Set the tenant BEFORE the profile state so AppProvider (which only
        // mounts once a profile exists) always loads the right company.
        setActiveOrganization(nextProfile?.organization_id ?? null);
        if (active) setProfile(nextProfile);
        if (nextProfile) writeAuthCache({ user: { id: nextSession.user.id, email: nextSession.user.email }, profile: nextProfile });
      } catch (err) {
        const cached = readAuthCache();
        if (isNetworkError(err) && cached && cached.user.id === nextSession.user.id) {
          setActiveOrganization(cached.profile.organization_id ?? null);
          if (active) setProfile(cached.profile);
        } else {
          console.error('[Auth] profile load failed:', err);
          setActiveOrganization(null);
          if (active) setProfile(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data }) => load(data.session)).catch(() => load(null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void load(nextSession);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    // Clear first so the auth-state listener cannot restore the cached login.
    writeAuthCache(null);
    try {
      await signOut();
    } catch (err) {
      // Offline: the server cannot be told, but this device must still be signed out.
      if (!isNetworkError(err)) throw err;
      await supabase?.auth.signOut({ scope: 'local' });
    }
    // Do not leave company data readable on this device after logout.
    // (Unsent offline changes stay queued and are sent on the next login of the same company.)
    void clearReadCache();
    setUser(null);
    setSession(null);
    setProfile(null);
    setActiveOrganization(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const next = await getProfile(user.id);
    setProfile(next);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut: handleSignOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
