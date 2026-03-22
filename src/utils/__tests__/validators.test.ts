import { describe, it, expect } from 'vitest';
import {
  validateEmployees,
  validateSplit,
  validateDenominations,
  validateSession,
} from '@/utils/validators';
import { makeEmployee, makeSplit, makeDenomQty } from '@/test/factories';

describe('validateEmployees', () => {
  it('accepts valid employees', () => {
    const result = validateEmployees([makeEmployee({ name: 'Anna', hours: 8 })]);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('rejects empty employee list', () => {
    const result = validateEmployees([]);
    expect(result.valid).toBe(false);
    expect(result.errors['employees']).toBe('errors:validation.noEmployees');
  });

  it('rejects employee with empty name', () => {
    const result = validateEmployees([makeEmployee({ name: '' })]);
    expect(result.valid).toBe(false);
    expect(result.errors['employees[0].name']).toBe('errors:validation.required');
  });

  it('rejects employee with whitespace-only name', () => {
    const result = validateEmployees([makeEmployee({ name: '   ' })]);
    expect(result.valid).toBe(false);
    expect(result.errors['employees[0].name']).toBe('errors:validation.required');
  });

  it('rejects employee name over 50 characters', () => {
    const longName = 'A'.repeat(51);
    const result = validateEmployees([makeEmployee({ name: longName })]);
    expect(result.valid).toBe(false);
    expect(result.errors['employees[0].name']).toBe('errors:validation.nameTooLong');
  });

  it('accepts name of exactly 50 characters', () => {
    const name = 'A'.repeat(50);
    const result = validateEmployees([makeEmployee({ name })]);
    expect(result.valid).toBe(true);
  });

  it('rejects zero hours', () => {
    const result = validateEmployees([makeEmployee({ hours: 0 })]);
    expect(result.valid).toBe(false);
    expect(result.errors['employees[0].hours']).toBe('errors:validation.hoursZero');
  });

  it('rejects negative hours', () => {
    const result = validateEmployees([makeEmployee({ hours: -1 })]);
    expect(result.valid).toBe(false);
    expect(result.errors['employees[0].hours']).toBe('errors:validation.hoursZero');
  });

  it('rejects NaN hours', () => {
    const result = validateEmployees([makeEmployee({ hours: NaN })]);
    expect(result.valid).toBe(false);
    expect(result.errors['employees[0].hours']).toBeDefined();
  });

  it('reports multiple errors for multiple invalid employees', () => {
    const result = validateEmployees([
      makeEmployee({ name: '', hours: 8 }),
      makeEmployee({ name: 'Bob', hours: 0 }),
    ]);
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).length).toBe(2);
  });
});

describe('validateSplit', () => {
  it('accepts valid 30/70 split', () => {
    const result = validateSplit(makeSplit({ kitchenPercent: 30, servicePercent: 70 }));
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('accepts 0/100 split', () => {
    const result = validateSplit(makeSplit({ kitchenPercent: 0, servicePercent: 100 }));
    expect(result.valid).toBe(true);
  });

  it('accepts 100/0 split', () => {
    const result = validateSplit(makeSplit({ kitchenPercent: 100, servicePercent: 0 }));
    expect(result.valid).toBe(true);
  });

  it('rejects split not summing to 100', () => {
    const result = validateSplit(makeSplit({ kitchenPercent: 30, servicePercent: 60 }));
    expect(result.valid).toBe(false);
    expect(result.errors['split']).toBe('errors:validation.splitMustEqual100');
  });

  it('rejects negative kitchen percent', () => {
    const result = validateSplit(makeSplit({ kitchenPercent: -10, servicePercent: 110 }));
    expect(result.valid).toBe(false);
    expect(result.errors['split.kitchenPercent']).toBe('errors:validation.negativeNotAllowed');
  });

  it('rejects negative service percent', () => {
    const result = validateSplit(makeSplit({ kitchenPercent: 110, servicePercent: -10 }));
    expect(result.valid).toBe(false);
    expect(result.errors['split.servicePercent']).toBe('errors:validation.negativeNotAllowed');
  });

  it('rejects NaN percentages', () => {
    const result = validateSplit({ kitchenPercent: NaN, servicePercent: 70 });
    expect(result.valid).toBe(false);
    expect(result.errors['split']).toBe('errors:validation.invalidNumber');
  });
});

describe('validateDenominations', () => {
  const denomValues = new Map([
    ['eur_10', 1000],
    ['eur_5', 500],
    ['eur_1', 100],
  ]);

  it('accepts valid denominations with positive total', () => {
    const result = validateDenominations([makeDenomQty('eur_10', 5)], denomValues);
    expect(result.valid).toBe(true);
  });

  it('rejects all-zero quantities', () => {
    const result = validateDenominations([makeDenomQty('eur_10', 0)], denomValues);
    expect(result.valid).toBe(false);
    expect(result.errors['total']).toBe('errors:validation.zeroTotal');
  });

  it('rejects negative quantity', () => {
    const result = validateDenominations([makeDenomQty('eur_10', -1)], denomValues);
    expect(result.valid).toBe(false);
    expect(result.errors['denominations[0]']).toBe('errors:validation.negativeNotAllowed');
  });

  it('rejects NaN quantity', () => {
    const result = validateDenominations([makeDenomQty('eur_10', NaN)], denomValues);
    expect(result.valid).toBe(false);
    expect(result.errors['denominations[0]']).toBe('errors:validation.invalidNumber');
  });

  it('accepts multiple denominations with positive total', () => {
    const result = validateDenominations(
      [makeDenomQty('eur_10', 2), makeDenomQty('eur_5', 3)],
      denomValues,
    );
    expect(result.valid).toBe(true);
  });
});

describe('validateSession', () => {
  const denomValues = new Map([['eur_10', 1000]]);

  it('returns valid for a complete valid session', () => {
    const result = validateSession(
      [makeEmployee({ name: 'Anna', hours: 8 })],
      makeSplit(),
      [makeDenomQty('eur_10', 5)],
      denomValues,
    );
    expect(result.valid).toBe(true);
  });

  it('combines errors from all validators', () => {
    const result = validateSession(
      [], // invalid: no employees
      makeSplit({ kitchenPercent: 30, servicePercent: 60 }), // invalid: doesn't sum to 100
      [makeDenomQty('eur_10', 0)], // invalid: zero total
      denomValues,
    );
    expect(result.valid).toBe(false);
    expect(result.errors['employees']).toBeDefined();
    expect(result.errors['split']).toBeDefined();
    expect(result.errors['total']).toBeDefined();
  });
});
