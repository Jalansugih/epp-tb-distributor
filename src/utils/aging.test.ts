import { describe, expect, it } from 'vitest';
import { buildAging, liveAgingLabel } from './aging';

const today = new Date('2026-10-09T00:00:00Z');

describe('aging', () => {
  it('buckets open items by days past due and groups by party', () => {
    const rows = buildAging(
      [
        { p: 'A', r: 100, d: '2026-10-20' }, // not due -> current
        { p: 'A', r: 50, d: '2026-08-20' },  // 50 days late -> 31-60
        { p: 'B', r: 70, d: '2026-06-01' },  // >90
        { p: 'B', r: 0, d: '2026-06-01' },   // paid -> ignored
      ],
      (x) => x.p, (x) => x.r, (x) => x.d, today
    );
    const a = rows.find((r) => r.party === 'A')!;
    expect(a.current).toBe(100);
    expect(a.d31_60).toBe(50);
    expect(a.total).toBe(150);
    expect(rows.find((r) => r.party === 'B')!.d90plus).toBe(70);
  });

  it('labels live status from due date', () => {
    expect(liveAgingLabel(0, '2026-01-01', today)).toBe('Lunas');
    expect(liveAgingLabel(10, '2026-12-01', today)).toBe('Lancar');
    expect(liveAgingLabel(10, '2026-09-01', today)).toBe('Jatuh Tempo');
  });
});
