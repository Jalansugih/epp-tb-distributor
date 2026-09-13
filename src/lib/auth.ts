import { supabase } from './supabaseClient';

export type AppProfile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  active: boolean;
};

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId: string): Promise<AppProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,full_name,role,active')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as AppProfile | null;
}
