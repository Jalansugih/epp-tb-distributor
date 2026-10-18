import { describe, expect, it } from 'vitest';
import {
  addMonths,
  daysLeftLabel,
  formatLimit,
  formatRupiah,
  formatUsage,
  isAtLimit,
  nextEndDate,
  planLimitErrorMessage,
  subscriptionNotice,
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
