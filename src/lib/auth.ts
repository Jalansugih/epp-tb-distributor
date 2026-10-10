import { supabase } from './supabaseClient';

export type AppProfile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  active: boolean;
  organization_id: string | null;
  organization_name: string | null;
};

const PROFILE_COLUMNS = 'id,email,full_name,role,active,organization_id,organizations(name)';

function mapProfile(row: any): AppProfile {
  const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    active: row.active,
    organization_id: row.organization_id ?? null,
    organization_name: org?.name ?? null,
  };
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export type SignUpResult = { needsEmailConfirmation: boolean };

export type SignUpInput = {
  fullName: string;
  email: string;
  password: string;
} & (
  | { type: 'create'; organizationName: string }
  | { type: 'join'; inviteCode: string }
);

/**
 * Returns the company name for an invite code, or null when the code is
 * unknown. Lets the sign-up form confirm WHICH company the person is joining.
 */
export async function lookupInviteCode(code: string): Promise<string | null> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const { data, error } = await supabase.rpc('lookup_invite_code', { p_code: code });
  if (error) throw error;
  return (data as string | null) ?? null;
}

/**
 * Self-registration. Only the name plus EITHER a new company name OR an invite
 * code is sent. The role is never sent: the database trigger makes the creator
 * of a new company its active Admin, and anyone joining by invite code a 'User'
 * who stays inactive until that company's Admin approves them.
 */
export async function signUp(input: SignUpInput): Promise<SignUpResult> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const metadata: Record<string, string> = { full_name: input.fullName };
  if (input.type === 'create') metadata.org_name = input.organizationName;
  else metadata.invite_code = input.inviteCode;
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: metadata },
  });
  if (error) throw error;
  return { needsEmailConfirmation: !data.session };
}

export async function listProfiles(): Promise<AppProfile[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapProfile);
}

export async function setProfileActive(userId: string, active: boolean) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const { error } = await supabase.from('profiles').update({ active }).eq('id', userId);
  if (error) throw error;
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
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data) : null;
}

/** Admin only. Returns null for non-admins. */
export async function getInviteCode(): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_invite_code');
  if (error) throw error;
  return (data as string | null) ?? null;
}

/** Admin only. Invalidates the old code and returns the new one. */
export async function regenerateInviteCode(): Promise<string> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const { data, error } = await supabase.rpc('regenerate_invite_code');
  if (error) throw error;
  return data as string;
}

/** Admin only (enforced by RLS): rename the current company. */
export async function renameOrganization(organizationId: string, name: string) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const { error } = await supabase.from('organizations').update({ name }).eq('id', organizationId);
  if (error) throw error;
}

/**
 * Error codes thrown by the profile helpers below. The UI maps them to
 * translated messages (see ProfileView); anything else is shown as-is.
 */
export type ProfileErrorCode =
  | 'NAME_EMPTY'
  | 'PROFILE_NOT_FOUND'
  | 'NOT_AUTHENTICATED'
  | 'CURRENT_PASSWORD_WRONG'
  | 'PASSWORD_SAME';

const PROFILE_ERROR_CODES: ProfileErrorCode[] = [
  'NAME_EMPTY',
  'PROFILE_NOT_FOUND',
  'NOT_AUTHENTICATED',
  'CURRENT_PASSWORD_WRONG',
  'PASSWORD_SAME',
];

/** Returns the known error code contained in an error message, if any. */
export function profileErrorCode(err: unknown): ProfileErrorCode | null {
  const message = String((err as { message?: unknown } | null)?.message ?? '');
  return PROFILE_ERROR_CODES.find((code) => message.includes(code)) ?? null;
}

/**
 * Updates the signed-in user's own display name (via RPC, since profiles has
 * no client UPDATE policy). The RPC raises NAME_EMPTY / PROFILE_NOT_FOUND
 * instead of silently updating nothing.
 */
export async function updateMyFullName(fullName: string) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const name = fullName.trim().slice(0, 100);
  if (!name) throw new Error('NAME_EMPTY');
  const { error } = await supabase.rpc('update_my_full_name', { p_full_name: name });
  if (error) {
    const code = profileErrorCode(error);
    throw code ? new Error(code) : error;
  }
}

/**
 * Changes the signed-in user's password. The CURRENT password must be
 * supplied and is verified first, so an unattended open session cannot be
 * used to take over the account.
 */
export async function changeMyPassword(currentPassword: string, newPassword: string) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const email = userData.user?.email;
  if (!email) throw new Error('NOT_AUTHENTICATED');

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (verifyError) {
    // Only a credentials problem means "wrong password"; network/rate-limit
    // errors are surfaced as they are.
    const code = (verifyError as { code?: string }).code;
    const status = (verifyError as { status?: number }).status;
    if (code === 'invalid_credentials' || status === 400) throw new Error('CURRENT_PASSWORD_WRONG');
    throw verifyError;
  }

  if (newPassword === currentPassword) throw new Error('PASSWORD_SAME');

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    if ((error as { code?: string }).code === 'same_password') throw new Error('PASSWORD_SAME');
    throw error;
  }
}
