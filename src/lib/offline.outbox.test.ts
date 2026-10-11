import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Fake Supabase: records upserts, and refuses rows whose id starts with "bad".
const calls: string[] = [];
let networkDown = false;
let gate: Promise<void> | null = null;
vi.mock('./supabaseClient', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: () => ({
      upsert: async (rows: { id: string }[]) => {
        if (networkDown) throw new TypeError('Failed to fetch');
        if (gate) { const g = gate; gate = null; await g; }
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
    gate = null;
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
    await vi.waitFor(() => expect(getSyncState().rejected).toBe(1));
    expect(calls).toEqual(['ok1']);
    expect(getSyncState().pending).toBe(0);
    expect((await getRejectedOps())[0].error).toContain('row-level security');

    await retryRejected();
    await flushOutbox();
    await vi.waitFor(() => expect(getSyncState().rejected).toBe(1)); // refused again, still kept

    await discardRejected();
    expect(getSyncState().rejected).toBe(0);
  });

  it('also sends a change that is queued while a flush is already running', async () => {
    let release!: () => void;
    gate = new Promise<void>((r) => { release = r; });
    await enqueue(up('m1'));
    const running = flushOutbox(); // blocks inside the first upsert
    await vi.waitFor(() => expect(getSyncState().syncing).toBe(true));
    await enqueue(up('m2')); // arrives mid-flush
    release();
    await running;
    await vi.waitFor(() => expect(calls).toEqual(['m1', 'm2']));
    expect(getSyncState().pending).toBe(0);
  });
});
