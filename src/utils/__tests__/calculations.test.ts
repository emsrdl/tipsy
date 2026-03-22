import { describe, it, expect } from 'vitest';
import {
  percentageOf,
  roundToNearest,
  clampInt,
  proportionalSplit,
  mean,
  tipPerHour,
  rmsd,
} from '@/utils/calculations';

describe('percentageOf', () => {
  it('calculates 30% of €100', () => {
    expect(percentageOf(10000, 30)).toBe(3000);
  });

  it('calculates 33% of €100', () => {
    expect(percentageOf(10000, 33)).toBe(3300);
  });

  it('floors fractional results', () => {
    expect(percentageOf(999, 50)).toBe(499); // 999 * 50 / 100 = 499.5 → 499
  });

  it('returns 0 for 0%', () => {
    expect(percentageOf(10000, 0)).toBe(0);
  });

  it('returns the total for 100%', () => {
    expect(percentageOf(10000, 100)).toBe(10000);
  });

  it('handles zero total', () => {
    expect(percentageOf(0, 50)).toBe(0);
  });
});

describe('roundToNearest', () => {
  it('rounds to nearest €1 (100ct)', () => {
    expect(roundToNearest(1234, 100)).toBe(1200);
  });

  it('rounds up at midpoint', () => {
    expect(roundToNearest(1250, 100)).toBe(1300);
  });

  it('rounds to nearest 50ct', () => {
    expect(roundToNearest(1234, 50)).toBe(1250);
  });

  it('returns unchanged at 1ct precision', () => {
    expect(roundToNearest(1234, 1)).toBe(1234);
  });

  it('returns unchanged for unitCents <= 0', () => {
    expect(roundToNearest(1234, 0)).toBe(1234);
    expect(roundToNearest(1234, -5)).toBe(1234);
  });

  it('rounds to nearest €5 (500ct)', () => {
    expect(roundToNearest(1749, 500)).toBe(1500);
    expect(roundToNearest(1750, 500)).toBe(2000);
  });
});

describe('clampInt', () => {
  it('floors positive floats', () => {
    expect(clampInt(3.7)).toBe(3);
  });

  it('clamps negative to 0', () => {
    expect(clampInt(-5)).toBe(0);
  });

  it('returns 0 for 0', () => {
    expect(clampInt(0)).toBe(0);
  });

  it('passes through positive integers', () => {
    expect(clampInt(100)).toBe(100);
  });

  it('handles very small positive float', () => {
    expect(clampInt(0.001)).toBe(0);
  });
});

describe('proportionalSplit', () => {
  it('splits evenly with equal weights', () => {
    expect(proportionalSplit(10000, [1, 1])).toEqual([5000, 5000]);
  });

  it('splits proportionally with 8:4:4 weights', () => {
    const result = proportionalSplit(10000, [8, 4, 4]);
    expect(result).toEqual([5000, 2500, 2500]);
    expect(result.reduce((s, v) => s + v, 0)).toBe(10000);
  });

  it('distributes remainder via largest-remainder method', () => {
    const result = proportionalSplit(100, [1, 1, 1]);
    // 100/3 = 33.33... each; remainder = 1 cent
    expect(result).toEqual([34, 33, 33]);
    expect(result.reduce((s, v) => s + v, 0)).toBe(100);
  });

  it('handles single weight', () => {
    expect(proportionalSplit(5000, [3])).toEqual([5000]);
  });

  it('returns empty for empty weights', () => {
    expect(proportionalSplit(5000, [])).toEqual([]);
  });

  it('returns zeros for zero totalCents', () => {
    expect(proportionalSplit(0, [5, 5])).toEqual([0, 0]);
  });

  it('returns zeros for all-zero weights', () => {
    expect(proportionalSplit(1000, [0, 0, 0])).toEqual([0, 0, 0]);
  });

  it('returns zeros for negative totalCents', () => {
    expect(proportionalSplit(-100, [1, 1])).toEqual([0, 0]);
  });

  it('sum always equals totalCents', () => {
    const result = proportionalSplit(9999, [3, 5, 7, 11]);
    expect(result.reduce((s, v) => s + v, 0)).toBe(9999);
  });

  it('handles uneven split with large remainder', () => {
    const result = proportionalSplit(10, [1, 1, 1, 1, 1, 1, 1]);
    // 10/7 = 1.4285... each; floor = 1, remainder = 3
    expect(result.reduce((s, v) => s + v, 0)).toBe(10);
    expect(result.filter((v) => v === 2).length).toBe(3);
    expect(result.filter((v) => v === 1).length).toBe(4);
  });
});

describe('mean', () => {
  it('computes mean of array', () => {
    expect(mean([10, 20, 30])).toBe(20);
  });

  it('returns 0 for empty array', () => {
    expect(mean([])).toBe(0);
  });

  it('returns the value for single element', () => {
    expect(mean([5])).toBe(5);
  });

  it('handles non-integer mean', () => {
    expect(mean([1, 2])).toBe(1.5);
  });
});

describe('tipPerHour', () => {
  it('computes per-hour rate', () => {
    expect(tipPerHour(8000, 8)).toBe(1000);
  });

  it('returns 0 for zero hours', () => {
    expect(tipPerHour(8000, 0)).toBe(0);
  });

  it('returns 0 for negative hours', () => {
    expect(tipPerHour(8000, -1)).toBe(0);
  });

  it('handles non-integer result', () => {
    expect(tipPerHour(1000, 3)).toBeCloseTo(333.333, 2);
  });
});

describe('rmsd', () => {
  it('computes root-mean-square deviation', () => {
    const result = rmsd([5, -5, 0, 0]);
    expect(result).toBeCloseTo(Math.sqrt(50 / 4), 5);
  });

  it('returns 0 for all-zero deviations', () => {
    expect(rmsd([0, 0, 0])).toBe(0);
  });

  it('returns 0 for empty array', () => {
    expect(rmsd([])).toBe(0);
  });

  it('handles single deviation', () => {
    expect(rmsd([10])).toBe(10);
  });

  it('handles uniform positive deviations', () => {
    expect(rmsd([3, 3, 3])).toBe(3);
  });
});
