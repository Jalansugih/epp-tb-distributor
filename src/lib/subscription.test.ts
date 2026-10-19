import { describe, expect, it } from 'vitest';
import {
  addMonths,
  computePricing,
  dateInputToIso,
  daysLeftLabel,
  describePromo,
  formatLimit,
  formatRupiah,
  formatUsage,
  isAtLimit,
  nextEndDate,
  parseWholeNumber,
  planLimitErrorMessage,
  promoProblem,
  promoStatus,
  subscriptionNotice,
  toDateInput,
  type Promotion,
} from './subscription';

const utc = (iso: string) => new Date(iso);

describe('addMonths', () => {
  it('adds calendar months', () => {
    expect(addMonths(utc('2026-10-18T10:00:00Z'), 3).toISOString()).toBe('2027-01-18T10:00:00.000Z');
    expect(addMonths(utc('2026-10-18T10:00:00Z'), 12).toISOString()).toBe('2027-10-18T10:00:00.000Z');
  });
  it('clamps to the end of a shorter month, like PostgreSQL', () => {
    expect(addMonths(utc('2026-01-31T00:00:00Z'), 1).toISOString()).toBe('2026-02-28T00:00:00.000Z');
    expect(addMonths(utc('2028-01-31T00:00:00Z'), 1).toISOString()).toBe('2028-02-29T00:00:00.000Z'); // kabisat
    expect(addMonths(utc('2026-08-31T00:00:00Z'), 1).toISOString()).toBe('2026-09-30T00:00:00.000Z');
  });
});

describe('nextEndDate', () => {
  const now = utc('2026-10-18T00:00:00Z');
  it('extends from the current end date while the subscription is still running', () => {
    expect(nextEndDate('2026-12-01T00:00:00Z', 1, now).toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });
  it('counts from now when expired or never subscribed', () => {
    expect(nextEndDate('2026-10-01T00:00:00Z', 1, now).toISOString()).toBe('2026-11-18T00:00:00.000Z');
    expect(nextEndDate(null, 6, now).toISOString()).toBe('2027-04-18T00:00:00.000Z');
  });
});

describe('formatters', () => {
  it('formats limits and usage, with null meaning unlimited', () => {
    expect(formatLimit(null)).toBe('Tanpa batas');
    expect(formatLimit(1000)).toBe('1.000');
    expect(formatUsage(3, 10)).toBe('3/10');
    expect(formatUsage(3, null)).toBe('3/∞');
    expect(formatRupiah(249000)).toBe('Rp249.000');
    expect(daysLeftLabel(0)).toBe('Habis');
    expect(daysLeftLabel(5)).toBe('5 hari lagi');
  });
  it('flags a company that has reached its limit (never when unlimited)', () => {
    expect(isAtLimit(3, 3)).toBe(true);
    expect(isAtLimit(2, 3)).toBe(false);
    expect(isAtLimit(99999, null)).toBe(false);
  });
});

describe('planLimitErrorMessage', () => {
  it('extracts the readable text from database limit errors', () => {
    const err = { message: 'PLAN_USER_LIMIT: Paket Eksekutor hanya mengizinkan 3 pengguna aktif. Tingkatkan paket untuk menambah pengguna.' };
    expect(planLimitErrorMessage(err)).toBe('Paket Eksekutor hanya mengizinkan 3 pengguna aktif. Tingkatkan paket untuk menambah pengguna.');
    expect(planLimitErrorMessage(new Error('PLAN_PRODUCT_LIMIT: Paket X hanya mengizinkan 5 produk.'))).toBe('Paket X hanya mengizinkan 5 produk.');
  });
  it('returns null for unrelated errors', () => {
    expect(planLimitErrorMessage(new Error('boom'))).toBeNull();
    expect(planLimitErrorMessage(null)).toBeNull();
  });
});

describe('subscriptionNotice', () => {
  const ends = '2026-11-01T00:00:00Z';
  it('stays quiet when there is no data yet (patch not installed) or access already ended', () => {
    expect(subscriptionNotice({})).toBeNull();
    expect(subscriptionNotice({ subscription_state: 'expired', days_left: 0 })).toBeNull();
  });
  it('always reminds during trial, and escalates in the last 7 days', () => {
    expect(subscriptionNotice({ subscription_state: 'trial', days_left: 12, access_ends_at: ends })?.tone).toBe('info');
    const last = subscriptionNotice({ subscription_state: 'trial', days_left: 7, access_ends_at: ends });
    expect(last?.tone).toBe('warning');
    expect(last?.text).toContain('7 hari lagi');
  });
  it('warns paying companies only in the last 7 days', () => {
    expect(subscriptionNotice({ subscription_state: 'active', plan_name: 'The Manager', days_left: 30, access_ends_at: ends })).toBeNull();
    const n = subscriptionNotice({ subscription_state: 'active', plan_name: 'The Manager', days_left: 3, access_ends_at: ends });
    expect(n?.tone).toBe('warning');
    expect(n?.text).toContain('paket The Manager');
  });
});

const promo = (over: Partial<Promotion> = {}): Promotion => ({
  id: 'p1', code: 'X', name: 'X', discount_type: 'percent', discount_value: 20, bonus_months: 0, plan: null, plan_name: null,
  min_months: 1, starts_at: null, ends_at: null, max_uses: null, used_count: 0, active: true, created_at: '2026-01-01T00:00:00Z', ...over,
});

describe('promoStatus / promoProblem', () => {
  const now = new Date('2026-10-18T00:00:00Z');
  it('derives the status from flag, dates and quota', () => {
    expect(promoStatus(promo(), now)).toBe('active');
    expect(promoStatus(promo({ active: false }), now)).toBe('inactive');
    expect(promoStatus(promo({ starts_at: '2026-11-01T00:00:00Z' }), now)).toBe('scheduled');
    expect(promoStatus(promo({ ends_at: '2026-10-01T00:00:00Z' }), now)).toBe('expired');
    expect(promoStatus(promo({ max_uses: 3, used_count: 3 }), now)).toBe('exhausted');
  });
  it('explains why a promo cannot be used, or returns null', () => {
    expect(promoProblem(promo(), 'the_manager', 1, now)).toBeNull();
    expect(promoProblem(promo({ plan: 'the_elder', plan_name: 'The Elder' }), 'the_manager', 1, now)).toContain('The Elder');
    expect(promoProblem(promo({ min_months: 6 }), 'the_manager', 3, now)).toBe('Minimal 6 bulan');
    expect(promoProblem(promo({ min_months: 6 }), 'the_manager', 6, now)).toBeNull();
    expect(promoProblem(promo({ active: false }), 'the_manager', 1, now)).toBe('Nonaktif');
  });
});

describe('computePricing', () => {
  const plan = { price_monthly: 249000 };
  it('has no discount without a promo', () => {
    expect(computePricing(plan, 3, null)).toEqual({ subtotal: 747000, discount: 0, total: 747000, bonusMonths: 0 });
    expect(computePricing(null, 3, null).total).toBe(0);
  });
  it('applies percent discounts, rounded to whole rupiah', () => {
    expect(computePricing(plan, 3, promo({ discount_value: 25 }))).toEqual({ subtotal: 747000, discount: 186750, total: 560250, bonusMonths: 0 });
    expect(computePricing({ price_monthly: 99999 }, 1, promo({ discount_value: 15 })).discount).toBe(15000); // 14999.85
  });
  it('caps fixed discounts at the subtotal and carries bonus months', () => {
    expect(computePricing(plan, 1, promo({ discount_type: 'fixed', discount_value: 999999 })).total).toBe(0);
    expect(computePricing(plan, 12, promo({ discount_value: 0, bonus_months: 2 }))).toEqual({ subtotal: 2988000, discount: 0, total: 2988000, bonusMonths: 2 });
  });
});

describe('describePromo / date + number inputs', () => {
  it('describes discount and bonus', () => {
    expect(describePromo(promo({ discount_value: 25 }))).toBe('Diskon 25%');
    expect(describePromo(promo({ discount_type: 'fixed', discount_value: 50000, bonus_months: 2 }))).toBe('Potongan Rp50.000 + 2 bulan gratis');
    expect(describePromo(promo({ discount_value: 0, bonus_months: 1 }))).toBe('1 bulan gratis');
  });
  it('round-trips date inputs; an end date runs to the end of that day', () => {
    expect(toDateInput(null)).toBe('');
    expect(toDateInput(dateInputToIso('2026-12-31', false))).toBe('2026-12-31');
    expect(toDateInput(dateInputToIso('2026-12-31', true))).toBe('2026-12-31');
    expect(dateInputToIso('', false)).toBeNull();
    expect(dateInputToIso('31/12/2026', false)).toBeNull();
    const start = new Date(dateInputToIso('2026-12-31', false) as string);
    const end = new Date(dateInputToIso('2026-12-31', true) as string);
    expect(end.getTime() - start.getTime()).toBe((23 * 3600 + 59 * 60 + 59) * 1000);
  });
  it('parses whole numbers, blank as null', () => {
    expect(parseWholeNumber('')).toBeNull();
    expect(parseWholeNumber('1.000')).toBe(1000);
    expect(parseWholeNumber('0')).toBe(0);
  });
});
