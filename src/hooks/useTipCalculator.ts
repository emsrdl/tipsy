/**
 * @file src/hooks/useTipCalculator.ts
 * @description Hook for accessing and triggering tip calculation.
 *
 * @see src/context/TipSessionContext.tsx for the provider
 *
 * @example
 * const { session, totalInCents, calculate, reset } = useTipCalculator()
 */

export { useTipSessionContext as useTipCalculator } from '@/context/TipSessionContext';
