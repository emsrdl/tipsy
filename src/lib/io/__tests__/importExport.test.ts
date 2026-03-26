/**
 * @file src/lib/io/__tests__/importExport.test.ts
 * @description Tests for shift import/export functions.
 */

import { describe, it, expect } from 'vitest';
import { exportShiftsCsv, exportBackupJson, importShiftsJson } from '../importExport';
import { makeShift, makePersonShare, makeSmartDistribution } from '@/test/factories';
import type { Shift } from '@/types/shift';

describe('exportShiftsCsv', () => {
  it('generates CSV with correct headers', () => {
    const csv = exportShiftsCsv([makeShift()]);
    expect(csv).toContain('Date;Employee;Role;Hours;Amount (€);Notes');
  });

  it('includes UTF-8 BOM', () => {
    const csv = exportShiftsCsv([]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('generates one row per employee per shift', () => {
    const shift = makeShift({
      distribution: makeSmartDistribution({
        personShares: [
          makePersonShare({
            name: 'Anna',
            role: 'service',
            hoursWorked: 8,
            actualShareInCents: 5000,
          }),
          makePersonShare({
            name: 'Bob',
            role: 'kitchen',
            hoursWorked: 6,
            actualShareInCents: 3000,
          }),
        ],
      }),
    });
    const csv = exportShiftsCsv([shift]);
    const lines = csv.split('\n');
    // BOM + header + 2 data rows
    expect(lines).toHaveLength(3); // header + 2 rows
  });

  it('formats date as ISO date part', () => {
    const shift = makeShift({ date: '2026-03-21T18:00:00.000Z' });
    const csv = exportShiftsCsv([shift]);
    expect(csv).toContain('2026-03-21');
  });

  it('labels roles correctly', () => {
    const shift = makeShift({
      distribution: makeSmartDistribution({
        personShares: [makePersonShare({ role: 'kitchen' }), makePersonShare({ role: 'service' })],
      }),
    });
    const csv = exportShiftsCsv([shift]);
    expect(csv).toContain('Küche');
    expect(csv).toContain('Service');
  });

  it('indicates smart split mode', () => {
    const shift = makeShift({ smartSplitting: true });
    const csv = exportShiftsCsv([shift]);
    expect(csv).toContain('Smart Split');
  });

  it('indicates normal mode', () => {
    const shift = makeShift({ smartSplitting: false });
    const csv = exportShiftsCsv([shift]);
    expect(csv).toContain('Normal');
  });

  it('handles empty shifts array', () => {
    const csv = exportShiftsCsv([]);
    expect(csv).toContain('Date;Employee;Role;Hours;Amount (€);Notes');
    // Header ends with \n, so split gives 2 entries (header + empty trailing)
    const lines = csv.split('\n').filter((l) => l.replace('\uFEFF', '').trim().length > 0);
    expect(lines).toHaveLength(1); // just header
  });
});

describe('exportBackupJson', () => {
  it('wraps shifts in versioned envelope', () => {
    const shifts = [makeShift()];
    const json = exportBackupJson(shifts);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed.version).toBe(1);
    expect(parsed.exportedAt).toBeTruthy();
    expect(Array.isArray(parsed.shifts)).toBe(true);
    expect(parsed.shifts as Shift[]).toHaveLength(1);
  });

  it('includes all shift data', () => {
    const shift = makeShift({ id: 'test-shift-123' });
    const json = exportBackupJson([shift]);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const exported = (parsed.shifts as Shift[])[0]!;
    expect(exported.id).toBe('test-shift-123');
  });

  it('produces valid JSON', () => {
    const json = exportBackupJson([makeShift()]);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe('importShiftsJson', () => {
  it('imports valid shifts', () => {
    const shift = makeShift({ id: 'import-1' });
    const json = exportBackupJson([shift]);
    const { shifts, result } = importShiftsJson(json, new Set());
    expect(result.added).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(shifts).toHaveLength(1);
    expect(shifts[0]!.id).toBe('import-1');
  });

  it('deduplicates by shift ID', () => {
    const shift = makeShift({ id: 'existing-1' });
    const json = exportBackupJson([shift]);
    const existingIds = new Set(['existing-1']);
    const { shifts, result } = importShiftsJson(json, existingIds);
    expect(result.added).toBe(0);
    expect(result.skipped).toBe(1);
    expect(shifts).toHaveLength(0);
  });

  it('handles invalid JSON', () => {
    const { shifts, result } = importShiftsJson('not json', new Set());
    expect(result.added).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Invalid JSON');
    expect(shifts).toHaveLength(0);
  });

  it('handles non-array non-object JSON', () => {
    const { shifts, result } = importShiftsJson('"hello"', new Set());
    expect(result.errors).toHaveLength(1);
    expect(shifts).toHaveLength(0);
  });

  it('handles raw array format', () => {
    const shift = makeShift({ id: 'raw-1' });
    const json = JSON.stringify([shift]);
    const { shifts, result } = importShiftsJson(json, new Set());
    expect(result.added).toBe(1);
    expect(shifts).toHaveLength(1);
  });

  it('skips invalid shift entries', () => {
    const validShift = makeShift({ id: 'valid-1' });
    const json = JSON.stringify({
      version: 1,
      shifts: [validShift, { id: 123, invalid: true }, validShift],
    });
    // Two valid copies (same ID but not in existingIds), one invalid
    const { shifts, result } = importShiftsJson(json, new Set());
    expect(result.added).toBe(2); // both valid copies (dedup is against existingIds only)
    expect(result.errors).toHaveLength(1); // the invalid entry
    expect(shifts).toHaveLength(2);
  });

  it('handles empty shifts array', () => {
    const json = JSON.stringify({ version: 1, shifts: [] });
    const { shifts, result } = importShiftsJson(json, new Set());
    expect(result.added).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(shifts).toHaveLength(0);
  });

  it('validates shift required fields', () => {
    const invalidShifts = [
      { id: '', date: '2026-01-01' }, // empty id
      { date: '2026-01-01' }, // missing id
      { id: 'x', totalTipsInCents: 'not a number' }, // wrong type
    ];
    const json = JSON.stringify(invalidShifts);
    const { result } = importShiftsJson(json, new Set());
    expect(result.errors.length).toBe(3);
    expect(result.added).toBe(0);
  });

  it('mixes added, skipped, and errors correctly', () => {
    const valid1 = makeShift({ id: 'new-1' });
    const valid2 = makeShift({ id: 'existing-1' });
    const invalid = { id: 123 };

    const json = JSON.stringify([valid1, valid2, invalid]);
    const existingIds = new Set(['existing-1']);
    const { shifts, result } = importShiftsJson(json, existingIds);
    expect(result.added).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(shifts).toHaveLength(1);
  });
});
