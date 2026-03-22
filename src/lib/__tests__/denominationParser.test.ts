/**
 * @file src/lib/__tests__/denominationParser.test.ts
 * @description Tests for denomination sum calculation.
 */

import { describe, it, expect } from 'vitest';
import { sumDenominations } from '../denominationParser';
import { DENOMINATIONS } from '@/config/currency';

describe('sumDenominations', () => {
  it('sums a single denomination correctly', () => {
    const total = sumDenominations([{ denominationId: 'eur_10', quantity: 5 }], DENOMINATIONS);
    expect(total).toBe(5000); // 5 × €10 = €50 = 5000 cents
  });

  it('sums multiple denominations', () => {
    const total = sumDenominations(
      [
        { denominationId: 'eur_20', quantity: 3 },
        { denominationId: 'eur_1', quantity: 2 },
      ],
      DENOMINATIONS,
    );
    expect(total).toBe(6200); // 3 × 2000 + 2 × 100
  });

  it('handles coins correctly', () => {
    const total = sumDenominations(
      [
        { denominationId: 'eur_50ct', quantity: 4 },
        { denominationId: 'eur_1ct', quantity: 3 },
      ],
      DENOMINATIONS,
    );
    expect(total).toBe(203); // 4 × 50 + 3 × 1
  });

  it('returns 0 for empty quantities', () => {
    expect(sumDenominations([], DENOMINATIONS)).toBe(0);
  });

  it('returns 0 for all-zero quantities', () => {
    const total = sumDenominations(
      DENOMINATIONS.map((d) => ({ denominationId: d.id, quantity: 0 })),
      DENOMINATIONS,
    );
    expect(total).toBe(0);
  });

  it('skips unknown denomination ids silently', () => {
    const total = sumDenominations(
      [{ denominationId: 'unknown_denom', quantity: 5 }],
      DENOMINATIONS,
    );
    expect(total).toBe(0);
  });

  it('floors fractional quantities', () => {
    const total = sumDenominations([{ denominationId: 'eur_10', quantity: 2.9 }], DENOMINATIONS);
    expect(total).toBe(2000); // floor(2.9) = 2 × 1000
  });

  it('covers all 15 denominations', () => {
    expect(DENOMINATIONS).toHaveLength(15);
    const allOne = DENOMINATIONS.map((d) => ({ denominationId: d.id, quantity: 1 }));
    const total = sumDenominations(allOne, DENOMINATIONS);
    // Sum of all EUR denominations × 1:
    // 50000+20000+10000+5000+2000+1000+500+200+100+50+20+10+5+2+1 = 88888
    expect(total).toBe(88888);
  });

  it('handles large quantities correctly', () => {
    const total = sumDenominations([{ denominationId: 'eur_500', quantity: 100 }], DENOMINATIONS);
    expect(total).toBe(5000000); // 100 × €500 = €50,000
  });
});
