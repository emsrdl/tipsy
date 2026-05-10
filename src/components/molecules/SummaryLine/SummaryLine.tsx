/**
 * @file src/components/molecules/SummaryLine/SummaryLine.tsx
 * @description SummaryLine molecule — a label/amount pair for totals and subtotals.
 *
 * @example
 * <SummaryLine label="Gesamt" amountInCents={12050} />
 * <SummaryLine label="Küchenpool (30%)" amountInCents={3615} muted />
 */

import { formatEurFromCents } from '@/config/currency';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/utils';

export interface SummaryLineProps {
  /** Label text. */
  label: string;
  /** Amount in euro cents. */
  amountInCents: number;
  /** Whether to render in a muted/secondary style. @default false */
  muted?: boolean;
  /** Whether to render in a bold/prominent style. @default false */
  prominent?: boolean;
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Renders a label + formatted EUR amount on one line.
 *
 * @param props - SummaryLineProps
 * @returns div with flex layout
 *
 * @example
 * <SummaryLine label="Gesamt" amountInCents={totalInCents} prominent />
 */
export function SummaryLine({
  label,
  amountInCents,
  muted,
  prominent,
  className,
}: SummaryLineProps) {
  const { fmtLocale } = useLocale();

  return (
    <div
      className={cn(
        'flex items-center justify-between',
        muted && 'text-sm text-text-secondary',
        prominent && 'font-semibold',
        className,
      )}
    >
      <span>{label}</span>
      <span>{formatEurFromCents(amountInCents, fmtLocale)}</span>
    </div>
  );
}
