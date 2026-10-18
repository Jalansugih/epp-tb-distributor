import { supabase } from './supabaseClient';
import type { Plan, SubscriptionState } from './subscription';

export type PlatformStats = {
  orgs_total: number;
  orgs_active: number;
  orgs_suspended: number;
  /** Perusahaan aktif yang masih dalam masa trial. */
  orgs_trial: number;
  /** Perusahaan aktif yang langganan/trial-nya berakhir dalam 7 hari. */
  orgs_expiring_7d: number;
  orgs_new_7d: number;
  orgs_new_30d: number;
  users_total: number;
  users_pending: number;
};

export type OrgStatus = 'active' | 'suspended';

export type PlatformOrg = {
  org_id: string;
  org_name: string;
  /** Status efektif: 'suspended' juga bila langganan sudah habis. */
  org_status: OrgStatus;
  suspended_reason: string | null;
  created_at: string;
  user_count: number;
  active_user_count: number;
  admin_name: string | null;
  admin_email: string | null;
  last_sign_in_at: string | null;
  plan: string;
  plan_name: string;
  subscription_state: SubscriptionState;
  trial_ends_at: string;
  subscription_ends_at: string | null;
  days_left: number;
  max_users: number | null;
  max_products: number | null;
  product_count: number;
};

export type PlatformUser = {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  active: boolean;
  org_id: string | null;
  org_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

export type SubscriptionPayment = {
  id: string;
  plan: string;
  plan_name: string;
  months: number;
  amount: number | null;
  note: string | null;
  period_start: string;
  period_end: string;
  created_at: string;
  created_by_email: string | null;
};

export type ActivateSubscriptionInput = {
  orgId: string;
  plan: string;
  months: number;
  /** Nominal transfer dalam rupiah (opsional, untuk catatan). */
  amount?: number | null;
  /** Catatan, mis. nomor referensi transfer (opsional). */
  note?: string;
};

function requireClient() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  return supabase;
}

/** Pesan galat yang ramah untuk kode galat dari fungsi sa_* di database. */
export function superAdminErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String((err as { message: unknown }).message) : String(err);
  if (raw.includes('FORBIDDEN')) return 'Akses ditolak: akun ini bukan super admin.';
  if (raw.includes('CANNOT_DEACTIVATE_SELF')) return 'Anda tidak bisa menonaktifkan akun Anda sendiri.';
  if (raw.includes('ORG_NOT_FOUND')) return 'Perusahaan tidak ditemukan.';
  if (raw.includes('USER_NOT_FOUND')) return 'Pengguna tidak ditemukan.';
  if (raw.includes('PLAN_NOT_FOUND')) return 'Paket tidak ditemukan.';
  if (raw.includes('INVALID_MONTHS')) return 'Lama langganan harus antara 1 dan 36 bulan.';
  if (raw.includes('INVALID_AMOUNT')) return 'Nominal tidak boleh negatif.';
  if (raw.includes('SUBSCRIPTION_EXPIRED')) {
    return 'Langganan perusahaan ini sudah habis. Gunakan "Aktifkan Langganan" untuk mencatat pembayaran.';
  }
  const exceeds = raw.match(/USAGE_EXCEEDS_PLAN:\s*([^\n]+)/);
  if (exceeds) return `Paket tujuan terlalu kecil: ${exceeds[1].trim()}.`;
  if (raw.includes('does not exist') || raw.includes('Could not find the')) {
    return 'Fungsi super admin belum terpasang di database. Jalankan supabase/patch-super-admin.sql lalu supabase/patch-subscription.sql.';
  }
  return raw || 'Terjadi kesalahan.';
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const { data, error } = await requireClient().rpc('sa_platform_stats');
  if (error) throw error;
  return data as PlatformStats;
}

export async function fetchPlatformOrgs(): Promise<PlatformOrg[]> {
  const { data, error } = await requireClient().rpc('sa_list_organizations');
  if (error) throw error;
  return (data ?? []) as PlatformOrg[];
}

export async function fetchPlatformUsers(orgId?: string | null): Promise<PlatformUser[]> {
  const { data, error } = await requireClient().rpc('sa_list_users', { p_org: orgId ?? null });
  if (error) throw error;
  return (data ?? []) as PlatformUser[];
}

export async function fetchPlans(): Promise<Plan[]> {
  const { data, error } = await requireClient()
    .from('subscription_plans')
    .select('code,name,sort_order,max_users,max_products,price_monthly,badge,description')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Plan[];
}

export async function setOrganizationStatus(orgId: string, status: OrgStatus, reason?: string) {
  const { error } = await requireClient().rpc('sa_set_organization_status', {
    p_org: orgId,
    p_status: status,
    p_reason: reason ?? null,
  });
  if (error) throw error;
}

export async function setUserActive(userId: string, active: boolean) {
  const { error } = await requireClient().rpc('sa_set_user_active', { p_user: userId, p_active: active });
  if (error) throw error;
}

/** Aktifkan atau perpanjang langganan setelah transfer diterima. Mengembalikan tanggal berakhir baru (ISO). */
export async function activateSubscription(input: ActivateSubscriptionInput): Promise<string> {
  const { data, error } = await requireClient().rpc('sa_activate_subscription', {
    p_org: input.orgId,
    p_plan: input.plan,
    p_months: input.months,
    p_amount: input.amount ?? null,
    p_note: input.note?.trim() || null,
  });
  if (error) throw error;
  return data as string;
}

export async function fetchSubscriptionPayments(orgId: string): Promise<SubscriptionPayment[]> {
  const { data, error } = await requireClient().rpc('sa_list_subscription_payments', { p_org: orgId });
  if (error) throw error;
  return (data ?? []) as SubscriptionPayment[];
}
