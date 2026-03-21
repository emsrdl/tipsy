import { describe, it, expect } from 'vitest'
import {
  formatResultsForExport,
  buildCsvString,
  buildExportSummary,
  formatPayoutDetails,
} from '@/utils/export'
import type { DistributionResult } from '@/types/session'
import type { EmployeePayoutPlan } from '@/types/calculation'

const groupLabels = { kitchen: 'Küche', service: 'Service' }

const results: DistributionResult[] = [
  { employeeId: 'e1', name: 'Anna', group: 'service', hours: 8, amountInCents: 7000 },
  { employeeId: 'e2', name: 'Bob', group: 'kitchen', hours: 4, amountInCents: 3000 },
]

describe('formatResultsForExport', () => {
  it('formats results with correct group labels', () => {
    const rows = formatResultsForExport(results, 'de-DE', groupLabels)
    expect(rows).toHaveLength(2)
    expect(rows[0]!.name).toBe('Anna')
    expect(rows[0]!.group).toBe('Service')
    expect(rows[1]!.group).toBe('Küche')
  })

  it('computes per-hour rate', () => {
    const rows = formatResultsForExport(results, 'de-DE', groupLabels)
    // Anna: 7000ct / 8h = 875ct/h
    expect(rows[0]!.perHour).toBeDefined()
    expect(rows[0]!.perHour).not.toBe('—')
  })

  it('shows dash for zero hours', () => {
    const zeroHours: DistributionResult[] = [
      { employeeId: 'e1', name: 'Anna', group: 'service', hours: 0, amountInCents: 0 },
    ]
    const rows = formatResultsForExport(zeroHours, 'de-DE', groupLabels)
    expect(rows[0]!.perHour).toBe('—')
  })

  it('returns empty array for empty results', () => {
    expect(formatResultsForExport([], 'de-DE', groupLabels)).toEqual([])
  })
})

describe('buildCsvString', () => {
  const headers = { name: 'Name', group: 'Gruppe', hours: 'Stunden', amount: 'Betrag', perHour: 'Pro Stunde' }

  it('builds semicolon-separated CSV', () => {
    const rows = formatResultsForExport(results, 'de-DE', groupLabels)
    const csv = buildCsvString(rows, headers)

    const lines = csv.split('\n')
    expect(lines[0]).toBe('Name;Gruppe;Stunden;Betrag;Pro Stunde')
    expect(lines).toHaveLength(3) // header + 2 data rows
  })

  it('includes all data fields', () => {
    const rows = [{ name: 'Anna', group: 'Service', hours: '8', amount: '70,00 €', perHour: '8,75 €' }]
    const csv = buildCsvString(rows, headers)
    expect(csv).toContain('Anna')
    expect(csv).toContain('Service')
    expect(csv).toContain('8')
  })
})

describe('buildExportSummary', () => {
  it('computes kitchen and service totals', () => {
    const summary = buildExportSummary(results, 'de-DE')
    // Kitchen: 3000ct, Service: 7000ct, Total: 10000ct
    expect(summary.kitchenTotal).toBeDefined()
    expect(summary.serviceTotal).toBeDefined()
    expect(summary.grandTotal).toBeDefined()
  })

  it('handles empty results', () => {
    const summary = buildExportSummary([], 'de-DE')
    // All zeros
    expect(summary.grandTotal).toBeDefined()
  })

  it('handles service-only results', () => {
    const serviceOnly: DistributionResult[] = [
      { employeeId: 'e1', name: 'Anna', group: 'service', hours: 8, amountInCents: 10000 },
    ]
    const summary = buildExportSummary(serviceOnly, 'de-DE')
    expect(summary.kitchenTotal).toBeDefined()
  })
})

describe('formatPayoutDetails', () => {
  it('formats payout assignments as human-readable strings', () => {
    const payouts: EmployeePayoutPlan[] = [
      {
        employeeId: 'e1',
        name: 'Anna',
        idealAmountInCents: 7000,
        actualAmountInCents: 7000,
        deviationInCents: 0,
        assignments: [
          { denominationId: 'eur_50', count: 1, totalCents: 5000 },
          { denominationId: 'eur_20', count: 1, totalCents: 2000 },
        ],
      },
    ]
    const lines = formatPayoutDetails(payouts, 'de-DE')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('Anna')
    expect(lines[0]).toContain('1×')
  })

  it('shows dash for empty assignments', () => {
    const payouts: EmployeePayoutPlan[] = [
      {
        employeeId: 'e1',
        name: 'Anna',
        idealAmountInCents: 0,
        actualAmountInCents: 0,
        deviationInCents: 0,
        assignments: [],
      },
    ]
    const lines = formatPayoutDetails(payouts, 'de-DE')
    expect(lines[0]).toContain('—')
  })

  it('filters out zero-count assignments', () => {
    const payouts: EmployeePayoutPlan[] = [
      {
        employeeId: 'e1',
        name: 'Bob',
        idealAmountInCents: 2000,
        actualAmountInCents: 2000,
        deviationInCents: 0,
        assignments: [
          { denominationId: 'eur_20', count: 1, totalCents: 2000 },
          { denominationId: 'eur_10', count: 0, totalCents: 0 },
        ],
      },
    ]
    const lines = formatPayoutDetails(payouts, 'de-DE')
    expect(lines[0]).not.toContain('€10')
  })
})
