import { describe, expect, it } from 'vitest';
import { calculateSequentialDiscounts, formatRupiah } from './discountEngine';
import type { DiscountItem } from '../types';

function disc(partial: Partial<DiscountItem>): DiscountItem {
  return {
    sequence: 1,
    type: 'percentage',
    value: 0,
    ...partial,
  } as DiscountItem;
}

describe('calculateSequentialDiscounts', () => {
  it('returns the original price unchanged when there are no discounts', () => {
    const result = calculateSequentialDiscounts(100_000, []);
    expect(result.finalPrice).toBe(100_000);
    expect(result.totalDeduction).toBe(0);
    expect(result.steps).toHaveLength(0);
  });

  it('applies a single percentage discount correctly', () => {
    const result = calculateSequentialDiscounts(100_000, [
      disc({ sequence: 1, type: 'percentage', value: 10 }),
    ]);
    expect(result.finalPrice).toBe(90_000);
    expect(result.totalDeduction).toBe(10_000);
  });

  it('compounds multiple discounts in sequence order, not input order', () => {
    // Given out of order on purpose: sequence 2 then sequence 1.
    const result = calculateSequentialDiscounts(100_000, [
      disc({ sequence: 2, type: 'percentage', value: 10 }), // applied second
      disc({ sequence: 1, type: 'fixed', value: 20_000 }), // applied first
    ]);
    // Step 1: 100,000 - 20,000 = 80,000
    // Step 2: 80,000 - 10% of 80,000 (8,000) = 72,000
    expect(result.steps[0].sequence).toBe(1);
    expect(result.steps[0].resultingPrice).toBe(80_000);
    expect(result.steps[1].sequence).toBe(2);
    expect(result.finalPrice).toBe(72_000);
  });

  it('never lets the price go below zero, even with an oversized fixed discount', () => {
    const result = calculateSequentialDiscounts(50_000, [
      disc({ sequence: 1, type: 'fixed', value: 999_999 }),
    ]);
    expect(result.finalPrice).toBe(0);
    expect(result.totalDeduction).toBe(50_000); // capped at the price itself
  });

  it('computes 0% effective discount when initial price is 0 (avoids divide-by-zero)', () => {
    const result = calculateSequentialDiscounts(0, [disc({ sequence: 1, value: 10 })]);
    expect(result.effectivePercentage).toBe(0);
  });
});

describe('formatRupiah', () => {
  it('formats a whole number as IDR currency without decimals', () => {
    expect(formatRupiah(1_500_000)).toContain('1.500.000');
  });
});
