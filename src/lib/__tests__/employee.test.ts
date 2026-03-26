/**
 * @file src/lib/__tests__/employee.test.ts
 * @description Unit tests for employee utility helpers.
 */

import { describe, it, expect } from 'vitest';
import { resolveEmployeeName } from '../employee';

describe('resolveEmployeeName', () => {
  it('returns the name when it is non-empty', () => {
    expect(resolveEmployeeName('Anna', 'Mitarbeiter 1')).toBe('Anna');
  });

  it('returns the fallback when name is an empty string', () => {
    expect(resolveEmployeeName('', 'Mitarbeiter 1')).toBe('Mitarbeiter 1');
  });

  it('returns the fallback when name is whitespace-only', () => {
    expect(resolveEmployeeName('   ', 'Mitarbeiter 2')).toBe('Mitarbeiter 2');
  });

  it('trims surrounding whitespace before checking', () => {
    expect(resolveEmployeeName('  Bob  ', 'Mitarbeiter 3')).toBe('Bob');
  });
});
