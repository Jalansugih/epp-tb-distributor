import { describe, it, expect, vi, beforeEach } from 'vitest';

// Simulasi PostgREST: satu respons dibatasi 1.000 baris, klien harus meminta halaman berikutnya via range().
const TOTAL = 2500;
const calls: Array<[number, number]> = [];

vi.mock('./supabaseClient', () => {
  const builder = () => {
    let range: [number, number] = [0, 999];
    const q: any = {
      select: () => q,
      eq: () => q,
      order: () => q,
      range: (from: number, to: number) => { range = [from, to]; calls.push([from, to]); return q; },
      then: (resolve: (v: unknown) => void) => {
        const [from, to] = range;
        const end = Math.min(to, TOTAL - 1);
        const rows = [];
        for (let i = from; i <= end; i++) rows.push({ data: { id: `m-${i}` } });
        resolve({ data: rows, error: null });
      },
    };
    return q;
  };
  return { supabase: { from: () => builder() }, isSupabaseConfigured: true };
});

vi.mock('./offline', () => ({
  cacheGet: vi.fn(async () => null),
  cacheSet: vi.fn(async () => {}),
  flushOutbox: vi.fn(async () => {}),
  hasPending: vi.fn(() => false),
  isNetworkError: vi.fn(() => false),
  isOffline: vi.fn(() => false),
  setOfflineOrganization: vi.fn(),
  submitOrQueue: vi.fn(),
}));

import { fetchTable, setActiveOrganization } from './db';

describe('fetchTable pagination', () => {
  beforeEach(() => { calls.length = 0; setActiveOrganization('org-1'); });

  it('reads every page instead of silently stopping at the 1.000-row response cap', async () => {
    const rows = await fetchTable<{ id: string }>('stock_movements');
    expect(rows).toHaveLength(TOTAL);
    expect(new Set(rows.map((r) => r.id)).size).toBe(TOTAL);
    expect(calls).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
  });
});
