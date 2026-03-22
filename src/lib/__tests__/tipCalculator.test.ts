/**
 * @file src/lib/__tests__/tipCalculator.test.ts
 * @description Tests for the tip distribution algorithm.
 *
 * Critical invariants tested:
 * - Sum of all results === totalInCents (no loss or gain)
 * - Proportional distribution by hours
 * - Kitchen/service split
 * - Rounding: remainder goes to employees with largest fractional parts
 * - Edge cases: zero total, single employee, empty groups
 */

import { describe, it, expect } from 'vitest';
import { calculateDistribution } from '../tipCalculator';
import { makeEmployee } from '@/test/factories';

/** Helper: sum all amountInCents from results */
function sumResults(results: ReturnType<typeof calculateDistribution>): number {
  return results.reduce((s, r) => s + r.amountInCents, 0);
}

describe('calculateDistribution', () => {
  describe('basic distribution', () => {
    it('returns empty array when totalInCents is 0', () => {
      const results = calculateDistribution({
        totalInCents: 0,
        employees: [makeEmployee()],
        split: { kitchenPercent: 0, servicePercent: 100 },
      });
      expect(results).toHaveLength(0);
    });

    it('returns empty array when employees list is empty', () => {
      const results = calculateDistribution({
        totalInCents: 10000,
        employees: [],
        split: { kitchenPercent: 0, servicePercent: 100 },
      });
      expect(results).toHaveLength(0);
    });

    it('gives everything to a single employee', () => {
      const emp = makeEmployee({ hours: 8, group: 'service' });
      const results = calculateDistribution({
        totalInCents: 10000,
        employees: [emp],
        split: { kitchenPercent: 0, servicePercent: 100 },
      });
      expect(results).toHaveLength(1);
      expect(results[0]!.amountInCents).toBe(10000);
    });

    it('distributes proportionally by hours (equal hours = equal amounts)', () => {
      const emp1 = makeEmployee({ hours: 8, group: 'service' });
      const emp2 = makeEmployee({ hours: 8, group: 'service' });
      const results = calculateDistribution({
        totalInCents: 10000,
        employees: [emp1, emp2],
        split: { kitchenPercent: 0, servicePercent: 100 },
      });
      expect(results[0]!.amountInCents).toBe(5000);
      expect(results[1]!.amountInCents).toBe(5000);
    });

    it('distributes proportionally by hours (2:1 ratio)', () => {
      const emp1 = makeEmployee({ hours: 8, group: 'service' });
      const emp2 = makeEmployee({ hours: 4, group: 'service' });
      const results = calculateDistribution({
        totalInCents: 12000,
        employees: [emp1, emp2],
        split: { kitchenPercent: 0, servicePercent: 100 },
      });
      // emp1 should get 8000, emp2 should get 4000
      const emp1Result = results.find((r) => r.employeeId === emp1.id)!;
      const emp2Result = results.find((r) => r.employeeId === emp2.id)!;
      expect(emp1Result.amountInCents).toBe(8000);
      expect(emp2Result.amountInCents).toBe(4000);
    });
  });

  describe('kitchen/service split', () => {
    it('applies 30/70 kitchen-service split', () => {
      const kitchen = makeEmployee({ hours: 8, group: 'kitchen' });
      const service = makeEmployee({ hours: 8, group: 'service' });
      const results = calculateDistribution({
        totalInCents: 10000,
        employees: [kitchen, service],
        split: { kitchenPercent: 30, servicePercent: 70 },
      });
      const kResult = results.find((r) => r.employeeId === kitchen.id)!;
      const sResult = results.find((r) => r.employeeId === service.id)!;
      expect(kResult.amountInCents).toBe(3000);
      expect(sResult.amountInCents).toBe(7000);
    });

    it('handles 0% kitchen split (all to service)', () => {
      const kitchen = makeEmployee({ hours: 8, group: 'kitchen' });
      const service = makeEmployee({ hours: 8, group: 'service' });
      const results = calculateDistribution({
        totalInCents: 10000,
        employees: [kitchen, service],
        split: { kitchenPercent: 0, servicePercent: 100 },
      });
      const kResult = results.find((r) => r.employeeId === kitchen.id)!;
      const sResult = results.find((r) => r.employeeId === service.id)!;
      expect(kResult.amountInCents).toBe(0);
      expect(sResult.amountInCents).toBe(10000);
    });

    it('handles 100% kitchen split (all to kitchen)', () => {
      const kitchen = makeEmployee({ hours: 8, group: 'kitchen' });
      const service = makeEmployee({ hours: 8, group: 'service' });
      const results = calculateDistribution({
        totalInCents: 10000,
        employees: [kitchen, service],
        split: { kitchenPercent: 100, servicePercent: 0 },
      });
      const kResult = results.find((r) => r.employeeId === kitchen.id)!;
      const sResult = results.find((r) => r.employeeId === service.id)!;
      expect(kResult.amountInCents).toBe(10000);
      expect(sResult.amountInCents).toBe(0);
    });

    it('gives all tips to service when no kitchen employees exist', () => {
      // When no kitchen staff, the kitchen pool should redirect to service
      const service = makeEmployee({ hours: 8, group: 'service' });
      const results = calculateDistribution({
        totalInCents: 10000,
        employees: [service],
        split: { kitchenPercent: 30, servicePercent: 70 },
      });
      expect(results).toHaveLength(1);
      expect(results[0]!.amountInCents).toBe(10000);
    });

    it('gives all tips to kitchen when no service employees exist', () => {
      const kitchen = makeEmployee({ hours: 8, group: 'kitchen' });
      const results = calculateDistribution({
        totalInCents: 10000,
        employees: [kitchen],
        split: { kitchenPercent: 30, servicePercent: 70 },
      });
      expect(results).toHaveLength(1);
      expect(results[0]!.amountInCents).toBe(10000);
    });
  });

  describe('rounding invariant', () => {
    it('sum of results always equals totalInCents', () => {
      const employees = [
        makeEmployee({ hours: 7, group: 'service' }),
        makeEmployee({ hours: 5, group: 'service' }),
        makeEmployee({ hours: 3, group: 'service' }),
      ];
      const results = calculateDistribution({
        totalInCents: 10000,
        employees,
        split: { kitchenPercent: 0, servicePercent: 100 },
      });
      expect(sumResults(results)).toBe(10000);
    });

    it('sum equals total with kitchen/service split and odd amounts', () => {
      const employees = [
        makeEmployee({ hours: 9, group: 'kitchen' }),
        makeEmployee({ hours: 6, group: 'kitchen' }),
        makeEmployee({ hours: 11, group: 'service' }),
        makeEmployee({ hours: 4, group: 'service' }),
      ];
      const results = calculateDistribution({
        totalInCents: 9999,
        employees,
        split: { kitchenPercent: 33, servicePercent: 67 },
      });
      expect(sumResults(results)).toBe(9999);
    });

    it('sum equals total for a single cent', () => {
      const emp = makeEmployee({ hours: 1, group: 'service' });
      const results = calculateDistribution({
        totalInCents: 1,
        employees: [emp],
        split: { kitchenPercent: 0, servicePercent: 100 },
      });
      expect(sumResults(results)).toBe(1);
    });

    it('distributes rounding remainder to employee with largest fractional share', () => {
      // 10 cents split among 3 employees with equal hours: 3 + 3 + 3 = 9, remainder 1
      // All have equal fractional parts, so tiebreak by hours (equal) then name
      const employees = [
        makeEmployee({ name: 'Alpha', hours: 8, group: 'service' }),
        makeEmployee({ name: 'Beta', hours: 8, group: 'service' }),
        makeEmployee({ name: 'Gamma', hours: 8, group: 'service' }),
      ];
      const results = calculateDistribution({
        totalInCents: 10,
        employees,
        split: { kitchenPercent: 0, servicePercent: 100 },
      });
      expect(sumResults(results)).toBe(10);
      // Each gets at least 3, one gets 4
      const amounts = results.map((r) => r.amountInCents).sort();
      expect(amounts).toEqual([3, 3, 4]);
    });
  });

  describe('result shape', () => {
    it('includes all required fields on each result', () => {
      const emp = makeEmployee({ name: 'Anna', hours: 8, group: 'service' });
      const results = calculateDistribution({
        totalInCents: 10000,
        employees: [emp],
        split: { kitchenPercent: 0, servicePercent: 100 },
      });
      expect(results[0]).toMatchObject({
        employeeId: emp.id,
        name: 'Anna',
        group: 'service',
        hours: 8,
        amountInCents: 10000,
      });
    });

    it('preserves group information in results', () => {
      const kitchen = makeEmployee({ group: 'kitchen', hours: 4 });
      const service = makeEmployee({ group: 'service', hours: 4 });
      const results = calculateDistribution({
        totalInCents: 10000,
        employees: [kitchen, service],
        split: { kitchenPercent: 50, servicePercent: 50 },
      });
      const groups = results.map((r) => r.group).sort();
      expect(groups).toEqual(['kitchen', 'service']);
    });
  });
});
