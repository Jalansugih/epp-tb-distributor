import { supabase } from './supabaseClient';
import type { DiscountType, Plan, Promotion, SubscriptionState } from './subscription';

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
  promo_code: string | null;
  discount: number;
  bonus_months: number;
};

export type ActivateSubscriptionInput = {
  orgId: string;
  plan: string;
  months: number;
  /** Nominal transfer dalam rupiah (opsional, untuk catatan). */
  amount?: number | null;
  /** Catatan, mis. nomor referensi transfer (opsional). */
  note?: string;
  /** Promo yang dipakai (opsional). Diskon dan bonus bulan dihitung ulang di server. */
  promoId?: string | null;
};

export type UpdatePlanInput = {
  code: string;
  name: string;
  /** null = tanpa batas */
  maxUsers: number | null;
  /** null = tanpa batas */
  maxProducts: number | null;
  price: number;
  badge: string;
  description: string;
};

export type SavePromotionInput = {
  /** null = promo baru */
  id: string | null;
  code: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  bonusMonths: number;
  /** null = semua paket */
  plan: string | null;
  minMonths: number;
  startsAt: string | null;
  endsAt: string | null;
  maxUses: number | null;
  active: boolean;
};

/** Bentuk input simpan dari promo yang sudah ada, dengan perubahan sebagian. */
export function promotionInput(p: Promotion, patch: Partial<SavePromotionInput> = {}): SavePromotionInput {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    discountType: p.discount_type,
    discountValue: p.discount_value,
    bonusMonths: p.bonus_months,
    plan: p.plan,
    minMonths: p.min_months,
    startsAt: p.starts_at,
    endsAt: p.ends_at,
    maxUses: p.max_uses,
    active: p.active,
    ...patch,
  };
}

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
  if (raw.includes('INVALID_NAME')) return 'Nama tidak boleh kosong.';
  if (raw.includes('INVALID_LIMIT')) return 'Batas pengguna/produk minimal 1 (kosongkan untuk tanpa batas).';
  if (raw.includes('INVALID_PRICE')) return 'Harga tidak valid.';
  if (raw.includes('INVALID_PROMO_CODE')) return 'Kode promo 3-30 karakter: huruf, angka, tanda - atau _.';
  if (raw.includes('INVALID_DISCOUNT')) return 'Nilai promo tidak valid (diskon persen maksimal 100, bonus maksimal 12 bulan).';
  if (raw.includes('PROMO_NO_EFFECT')) return 'Isi diskon atau bonus bulan.';
  if (raw.includes('INVALID_PROMO_DATES')) return 'Tanggal berakhir harus setelah tanggal mulai.';
  if (raw.includes('PROMO_CODE_EXISTS')) return 'Kode promo sudah dipakai.';
  if (raw.includes('PROMO_NOT_FOUND')) return 'Promo tidak ditemukan.';
  if (raw.includes('PROMO_INACTIVE')) return 'Promo tidak aktif.';
  if (raw.includes('PROMO_NOT_VALID_NOW')) return 'Promo di luar masa berlakunya.';
  if (raw.includes('PROMO_QUOTA_REACHED')) return 'Kuota pemakaian promo sudah habis.';
  if (raw.includes('PROMO_PLAN_MISMATCH')) return 'Promo ini tidak berlaku untuk paket yang dipilih.';
  if (raw.includes('PROMO_MIN_MONTHS')) return 'Lama langganan kurang dari syarat minimal promo.';
  const exceeds = raw.match(/USAGE_EXCEEDS_PLAN:\s*([^\n]+)/);
  if (exceeds) return `Paket tujuan terlalu kecil: ${exceeds[1].trim()}.`;
  if (raw.includes('does not exist') || raw.includes('Could not find the')) {
    return 'Fungsi super admin belum terpasang di database. Jalankan supabase/patch-super-admin.sql, patch-subscription.sql, lalu patch-plans-promos.sql.';
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
    p_promo: input.promoId ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function fetchSubscriptionPayments(orgId: string): Promise<SubscriptionPayment[]> {
  const { data, error } = await requireClient().rpc('sa_list_subscription_payments', { p_org: orgId });
  if (error) throw error;
  return (data ?? []) as SubscriptionPayment[];
}

export async function fetchPromotions(): Promise<Promotion[]> {
  const { data, error } = await requireClient().rpc('sa_list_promotions');
  if (error) throw error;
  return (data ?? []) as Promotion[];
}

export async function updatePlan(input: UpdatePlanInput) {
  const { error } = await requireClient().rpc('sa_update_plan', {
    p_code: input.code,
    p_name: input.name,
    p_max_users: input.maxUsers,
    p_max_products: input.maxProducts,
    p_price: input.price,
    p_badge: input.badge.trim() || null,
    p_description: input.description.trim() || null,
  });
  if (error) throw error;
}

/** Buat (id null) atau ubah promo. Mengembalikan id promo. */
export async function savePromotion(input: SavePromotionInput): Promise<string> {
  const { data, error } = await requireClient().rpc('sa_save_promotion', {
    p_id: input.id,
    p_code: input.code,
    p_name: input.name,
    p_discount_type: input.discountType,
    p_discount_value: input.discountValue,
    p_bonus_months: input.bonusMonths,
    p_plan: input.plan,
    p_min_months: input.minMonths,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_max_uses: input.maxUses,
    p_active: input.active,
  });
  if (error) throw error;
  return data as string;
}
