/**
 * @file src/lib/__tests__/formatCurrency.test.ts
 * @description Tests for EUR currency formatting utilities.
 */

import { describe, it, expect } from 'vitest'
import { formatEurFromCents, parseCentsFromInput } from '../formatCurrency'

describe('formatEurFromCents', () => {
  it('formats a typical amount in de-DE locale', () => {
    const result = formatEurFromCents(1250)
    // de-DE uses comma as decimal separator
    expect(result).toBe('12,50\u00a0€')
  })

  it('formats zero', () => {
    const result = formatEurFromCents(0)
    expect(result).toBe('0,00\u00a0€')
  })

  it('formats a large amount with thousands separator', () => {
    const result = formatEurFromCents(1000000)
    // 10000 EUR = "10.000,00 €" in de-DE
    expect(result).toContain('10.000')
  })

  it('formats a single cent', () => {
    const result = formatEurFromCents(1)
    expect(result).toBe('0,01\u00a0€')
  })

  it('formats in en-US locale', () => {
    const result = formatEurFromCents(4599, 'en-US')
    // en-US uses dot as decimal separator
    expect(result).toContain('45.99')
  })

  it('formats whole euros', () => {
    const result = formatEurFromCents(5000)
    expect(result).toBe('50,00\u00a0€')
  })
})

describe('parseCentsFromInput', () => {
  it('parses a decimal with comma separator', () => {
    expect(parseCentsFromInput('12,50')).toBe(1250)
  })

  it('parses a decimal with dot separator', () => {
    expect(parseCentsFromInput('12.50')).toBe(1250)
  })

  it('parses a whole number', () => {
    expect(parseCentsFromInput('10')).toBe(1000)
  })

  it('parses zero', () => {
    expect(parseCentsFromInput('0')).toBe(0)
  })

  it('returns null for non-numeric input', () => {
    expect(parseCentsFromInput('abc')).toBeNull()
  })

  it('returns null for negative input', () => {
    expect(parseCentsFromInput('-1')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseCentsFromInput('')).toBeNull()
  })

  it('handles whitespace around input', () => {
    expect(parseCentsFromInput('  5,00  ')).toBe(500)
  })

  it('rounds to nearest cent', () => {
    expect(parseCentsFromInput('1.555')).toBe(156)
  })
})
