/** Paket & langganan: tipe serta fungsi murni (tanpa akses jaringan) agar mudah diuji. */

export type SubscriptionState = 'trial' | 'active' | 'expired';

export type Plan = {
  code: string;
  name: string;
  sort_order: number;
  /** null = tanpa batas */
  max_users: number | null;
  /** null = tanpa batas */
  max_products: number | null;
  /** rupiah per bulan */
  price_monthly: number;
  badge: string | null;
  description: string | null;
};

/** Lama langganan yang bisa dipilih super admin saat mencatat transfer. */
export const MONTH_OPTIONS = [1, 3, 6, 12] as const;

/** Hari terakhir sebelum langganan berakhir yang memunculkan peringatan. */
export const EXPIRY_WARNING_DAYS = 7;

const idDate = (d: Date) => d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

export const formatDate = (iso: string | Date | null | undefined): string => {
  if (!iso) return '-';
  const d = iso instanceof Date ? iso : new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : idDate(d);
};

export const formatRupiah = (n: number): string => `Rp${Math.round(n).toLocaleString('id-ID')}`;

export const formatLimit = (limit: number | null): string =>
  limit === null ? 'Tanpa batas' : limit.toLocaleString('id-ID');

/** "3/10" atau "3/∞" */
export const formatUsage = (used: number, limit: number | null): string =>
  `${used.toLocaleString('id-ID')}/${limit === null ? '∞' : limit.toLocaleString('id-ID')}`;

export const isAtLimit = (used: number, limit: number | null): boolean => limit !== null && used >= limit;

export const subscriptionStateLabel = (state: SubscriptionState): string =>
  state === 'trial' ? 'Trial' : state === 'active' ? 'Berlangganan' : 'Langganan habis';

export const daysLeftLabel = (days: number): string => (days <= 0 ? 'Habis' : `${days} hari lagi`);

/**
 * Tambah bulan kalender (UTC). Tanggal 31 + 1 bulan menjadi akhir bulan berikutnya
 * (bukan meluber ke bulan sesudahnya), sama seperti `timestamptz + interval` di PostgreSQL.
 */
export function addMonths(base: Date, months: number): Date {
  const d = new Date(base.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

/**
 * Tanggal berakhir baru bila langganan dicatat sekarang. Cermin dari
 * sa_activate_subscription: diperpanjang dari tanggal berakhir saat ini bila
 * masih berjalan, selain itu (trial/habis) dihitung dari sekarang.
 */
export function nextEndDate(currentEndIso: string | null, months: number, now: Date = new Date()): Date {
  const current = currentEndIso ? new Date(currentEndIso) : null;
  const base = current && current.getTime() > now.getTime() ? current : now;
  return addMonths(base, months);
}

/** Pesan ramah untuk galat batas paket dari trigger database; null bila bukan galat batas. */
export function planLimitErrorMessage(err: unknown): string | null {
  const raw =
    err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String((err as { message: unknown }).message) : '';
  const match = raw.match(/PLAN_(?:USER|PRODUCT)_LIMIT:\s*([^\n]+)/);
  return match ? match[1].trim() : null;
}

export type SubscriptionNotice = { tone: 'info' | 'warning'; text: string };

type NoticeInput = {
  subscription_state?: SubscriptionState | null;
  plan_name?: string | null;
  access_ends_at?: string | null;
  days_left?: number | null;
};

/**
 * Pengingat untuk admin perusahaan: selama trial, dan menjelang langganan berakhir.
 * Mengembalikan null bila tidak ada yang perlu ditampilkan (atau data belum tersedia).
 */
export function subscriptionNotice(info: NoticeInput): SubscriptionNotice | null {
  const { subscription_state: state, days_left: days, access_ends_at: ends, plan_name: plan } = info;
  if (!state || days == null || state === 'expired') return null;
  const until = `${days} hari lagi (berakhir ${formatDate(ends)})`;
  const tone = days <= EXPIRY_WARNING_DAYS ? 'warning' : 'info';
  if (state === 'trial') {
    return { tone, text: `Masa trial berakhir ${until}. Hubungi pengelola platform untuk memilih paket dan berlangganan.` };
  }
  if (days > EXPIRY_WARNING_DAYS) return null;
  const planText = plan ? ` paket ${plan}` : '';
  return { tone, text: `Langganan${planText} berakhir ${until}. Hubungi pengelola platform untuk memperpanjang.` };
}
