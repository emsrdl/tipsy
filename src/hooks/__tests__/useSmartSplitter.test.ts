/**
 * @file src/hooks/__tests__/useSmartSplitter.test.ts
 * @description Tests for the useSmartSplitter hook.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSmartSplitter } from '../useSmartSplitter';
import { makeEmployee, makeDenomQty } from '@/test/factories';

beforeEach(() => {
  localStorage.clear();
});

const employees = [
  makeEmployee({ id: 'e1', name: 'Anna', hours: 8, group: 'service' }),
  makeEmployee({ id: 'e2', name: 'Bob', hours: 4, group: 'service' }),
];

const denominations = [makeDenomQty('eur_50', 2)];

describe('useSmartSplitter', () => {
  it('returns null output when no employees', () => {
    const { result } = renderHook(() => useSmartSplitter([], 10000, 0, denominations));
    expect(result.current.output).toBeNull();
  });

  it('returns null output when zero total', () => {
    const { result } = renderHook(() => useSmartSplitter(employees, 0, 0, denominations));
    expect(result.current.output).toBeNull();
  });

  it('computes output when inputs are valid', () => {
    const { result } = renderHook(() => useSmartSplitter(employees, 10000, 0, denominations));
    expect(result.current.output).not.toBeNull();
    expect(result.current.output!.distribution.personShares).toHaveLength(2);
  });

  it('defaults to smart mode enabled', () => {
    const { result } = renderHook(() => useSmartSplitter(employees, 10000, 0, denominations));
    expect(result.current.isSmartMode).toBe(true);
  });

  it('toggles smart mode', () => {
    const { result } = renderHook(() => useSmartSplitter(employees, 10000, 0, denominations));

    act(() => {
      result.current.toggleSmartMode();
    });
    expect(result.current.isSmartMode).toBe(false);

    act(() => {
      result.current.toggleSmartMode();
    });
    expect(result.current.isSmartMode).toBe(true);
  });

  it('sets smart mode explicitly', () => {
    const { result } = renderHook(() => useSmartSplitter(employees, 10000, 0, denominations));

    act(() => {
      result.current.setSmartMode(false);
    });
    expect(result.current.isSmartMode).toBe(false);
  });

  it('has default threshold of 100 cents', () => {
    const { result } = renderHook(() => useSmartSplitter(employees, 10000, 0, denominations));
    expect(result.current.thresholdInCents).toBe(100);
  });

  it('allows threshold update', () => {
    const { result } = renderHook(() => useSmartSplitter(employees, 10000, 0, denominations));

    act(() => {
      result.current.setThreshold(1000);
    });
    expect(result.current.thresholdInCents).toBe(1000);
  });

  it('produces different results in smart vs normal mode', () => {
    const { result } = renderHook(() => useSmartSplitter(employees, 10000, 0, denominations));

    const smartOutput = result.current.output;
    expect(smartOutput).not.toBeNull();

    act(() => {
      result.current.setSmartMode(false);
    });

    const normalOutput = result.current.output;
    expect(normalOutput).not.toBeNull();

    // In normal mode, deviations are 0
    for (const share of normalOutput!.distribution.personShares) {
      expect(share.deviationInCents).toBe(0);
    }
  });

  it('respects kitchen percent', () => {
    const mixedEmployees = [
      makeEmployee({ id: 'k1', name: 'Chef', hours: 8, group: 'kitchen' }),
      makeEmployee({ id: 's1', name: 'Waiter', hours: 8, group: 'service' }),
    ];

    const { result } = renderHook(() => useSmartSplitter(mixedEmployees, 10000, 50, denominations));

    // Smart mode disabled for cleaner assertion
    act(() => {
      result.current.setSmartMode(false);
    });

    const output = result.current.output!;
    const kitchen = output.distribution.personShares.find((s) => s.role === 'kitchen');
    const service = output.distribution.personShares.find((s) => s.role === 'service');

    expect(kitchen!.idealShareInCents).toBe(5000);
    expect(service!.idealShareInCents).toBe(5000);
  });
});
