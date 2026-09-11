import { DiscountItem } from '../types';

export interface DiscountStepResult {
  sequence: number;
  type: 'percentage' | 'fixed';
  value: number;
  label?: string;
  previousPrice: number;
  deductionAmount: number;
  resultingPrice: number;
}

export interface SequentialDiscountCalculation {
  initialPrice: number;
  steps: DiscountStepResult[];
  totalDeduction: number;
  finalPrice: number;
  effectivePercentage: number;
}

/**
 * Calculates sequential discounts compound step by step
 */
export function calculateSequentialDiscounts(
  initialPrice: number,
  discounts: DiscountItem[]
): SequentialDiscountCalculation {
  let currentPrice = initialPrice;
  let totalDeduction = 0;
  const steps: DiscountStepResult[] = [];

  // Sort discounts by sequence ascending
  const sortedDiscounts = [...discounts].sort((a, b) => a.sequence - b.sequence);

  for (const disc of sortedDiscounts) {
    const prevPrice = currentPrice;
    let deduction = 0;

    if (disc.type === 'percentage') {
      deduction = (currentPrice * disc.value) / 100;
    } else {
      // Fixed rupiah discount
      deduction = disc.value;
    }

    // Ensure price doesn't go below 0
    if (deduction > currentPrice) {
      deduction = currentPrice;
    }

    currentPrice = Math.max(0, currentPrice - deduction);
    totalDeduction += deduction;

    steps.push({
      sequence: disc.sequence,
      type: disc.type,
      value: disc.value,
      label: disc.label,
      previousPrice: prevPrice,
      deductionAmount: deduction,
      resultingPrice: currentPrice,
    });
  }

  const finalPrice = Math.max(0, currentPrice);
  const effectivePercentage = initialPrice > 0 ? (totalDeduction / initialPrice) * 100 : 0;

  return {
    initialPrice,
    steps,
    totalDeduction,
    finalPrice,
    effectivePercentage,
  };
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount);
}
