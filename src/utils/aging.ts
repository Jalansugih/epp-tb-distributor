/**
 * Aging helpers shared by the AR / AP reports. Buckets are based on days past
 * the due date: not yet due or up to 30 days late is "Lancar", then 31-60,
 * 61-90 and over 90 days late.
 */
export type AgingRow = { current: number; d31_60: number; d61_90: number; d90plus: number; total: number };

export const emptyAging = (): AgingRow => ({ current: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 0 });

export function daysPastDue(dueDate: string, today = new Date()): number {
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return 0;
  return Math.floor((today.getTime() - due.getTime()) / 86400000);
}

export function addToAging(row: AgingRow, amount: number, dueDate: string, today = new Date()): AgingRow {
  if (!(amount > 0)) return row;
  const days = daysPastDue(dueDate, today);
  const next = { ...row, total: row.total + amount };
  if (days <= 30) next.current += amount;
  else if (days <= 60) next.d31_60 += amount;
  else if (days <= 90) next.d61_90 += amount;
  else next.d90plus += amount;
  return next;
}

/** Group open items by party name and bucket them. */
export function buildAging<T>(
  items: T[],
  partyOf: (item: T) => string,
  remainingOf: (item: T) => number,
  dueDateOf: (item: T) => string,
  today = new Date()
): Array<{ party: string } & AgingRow> {
  const map = new Map<string, AgingRow>();
  for (const item of items) {
    const party = partyOf(item) || '-';
    map.set(party, addToAging(map.get(party) ?? emptyAging(), remainingOf(item), dueDateOf(item), today));
  }
  return [...map.entries()].map(([party, row]) => ({ party, ...row })).filter((r) => r.total > 0);
}

/** Live label for a receivable/payable (stored status goes stale as time passes). */
export function liveAgingLabel(remaining: number, dueDate: string, today = new Date()): 'Lunas' | 'Lancar' | 'Jatuh Tempo' {
  if (!(remaining > 0)) return 'Lunas';
  return daysPastDue(dueDate, today) > 0 ? 'Jatuh Tempo' : 'Lancar';
}
