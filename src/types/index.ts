/**
 * @file src/types/index.ts
 * @description Barrel export for all application types.
 *
 * Import from '@/types' for convenience instead of individual files.
 *
 * @example
 * import type { Employee, TipSession, DenominationMatchResult } from '@/types'
 */

export type { Employee, EmployeeGroup } from './employee'

export type {
  DenominationQuantity,
  TipSplit,
  DistributionResult,
  TipSession,
} from './session'

export type { ThemeId, ColorMode, AccentColor, Theme } from './theme'

export type { LocaleId, I18nNamespace } from './i18n'

export type {
  AvailableDenomination,
  DenominationAssignment,
  EmployeePayoutPlan,
  FairnessScore,
  DenominationMatchResult,
  DenominationMatchInput,
  HistoryEntry,
  ValidationResult,
} from './calculation'
