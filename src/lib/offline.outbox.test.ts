import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Fake Supabase: records upserts, and refuses rows whose id starts with "bad".
const calls: string[] = [];
let networkDown = false;
vi.mock('./supabaseClient', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: () => ({
      upsert: async (rows: { id: string }[]) => {
        if (networkDown) throw new TypeError('Failed to fetch');
        if (rows.some((r) => r.id.startsWith('bad'))) return { error: { message: 'violates row-level security policy' } };
        rows.forEach((r) => calls.push(r.id));
        return { error: null };
      },
    }),
  },
}));

import { enqueue, flushOutbox, getSyncState, setOfflineOrganization, getRejectedOps, retryRejected, discardRejected } from './offline';

const up = (id: string) => ({ type: 'upsert' as const, org: 'org1', table: 'customers', rows: [{ id }] });

describe('outbox', () => {
  beforeEach(async () => {
    calls.length = 0;
    networkDown = false;
    setOfflineOrganization('org1');
    await discardRejected();
  });

  it('keeps changes while network is down, then sends them in order', async () => {
    networkDown = true;
    await enqueue(up('a1'));
    await enqueue(up('a2'));
    await flushOutbox();
    expect(getSyncState().pending).toBe(2);
    expect(calls).toEqual([]);

    networkDown = false;
    await flushOutbox();
    expect(calls).toEqual(['a1', 'a2']);
    expect(getSyncState().pending).toBe(0);
  });

  it('keeps a server-refused change for review instead of losing it, without blocking the rest', async () => {
    await enqueue(up('bad1'));
    await enqueue(up('ok1'));
    await flushOutbox();
    expect(calls).toEqual(['ok1']);
    expect(getSyncState().pending).toBe(0);
    expect(getSyncState().rejected).toBe(1);
    expect((await getRejectedOps())[0].error).toContain('row-level security');

    await retryRejected();
    await flushOutbox();
    expect(getSyncState().rejected).toBe(1); // refused again, still kept

    await discardRejected();
    expect(getSyncState().rejected).toBe(0);
  });
});
