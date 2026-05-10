/**
 * @file src/components/molecules/ChartTooltip/ChartTooltip.tsx
 * @description Custom Recharts tooltip with themed styling.
 *
 * Replaces the default Recharts tooltip formatter + contentStyle approach
 * for consistent dark/light theme support and clean layout.
 *
 * @example
 * <Tooltip content={<ChartTooltip suffix="€" />} />
 */

import { useTranslation } from 'react-i18next';
import { formatEurFromCents } from '@/config/currency';
import { useLocale } from '@/hooks/useLocale';

export interface ChartTooltipProps {
  /** Whether the tooltip is currently active/visible. Injected by Recharts. */
  active?: boolean;
  /** Data entries for the hovered point. Injected by Recharts. */
  payload?: { value: unknown; payload: unknown }[];
  /** X-axis label for the hovered point. Injected by Recharts. */
  label?: string;
  /** Unit suffix shown after the value ("€" or "€/h"). */
  suffix?: string;
}

/**
 * Themed tooltip for Recharts charts.
 * Renders label, formatted value, and optional metadata from the data point.
 */
export function ChartTooltip({ active, payload, label, suffix = '€' }: ChartTooltipProps) {
  const { t } = useTranslation('common');
  const { locale } = useLocale();
  const fmtLocale = locale === 'en' ? 'en-US' : 'de-DE';

  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0]!;
  const extra = entry.payload as Record<string, unknown>;
  const cents =
    typeof extra.totalCents === 'number'
      ? extra.totalCents
      : Math.round((entry.value as number) * 100);

  const shiftCount = typeof extra.shiftCount === 'number' ? extra.shiftCount : undefined;
  const totalHours = typeof extra.totalHours === 'number' ? extra.totalHours : undefined;

  const formatted = formatEurFromCents(cents, fmtLocale);
  const display = suffix === '€/h' ? `${formatted}/h` : formatted;

  return (
    <div className="rounded-lg border border-border bg-surface-overlay px-3 py-2 shadow-elevation-2">
      <p className="mb-0.5 text-xs font-medium text-text-secondary">{label}</p>
      <p className="font-mono text-sm font-bold text-text-primary">{display}</p>
      {shiftCount !== undefined && shiftCount > 0 && (
        <p className="mt-0.5 text-xs text-text-secondary">
          {t('history.shiftsCount', { count: shiftCount })}
        </p>
      )}
      {totalHours !== undefined && totalHours > 0 && (
        <p className="mt-0.5 text-xs text-text-secondary">{totalHours.toFixed(1)}h</p>
      )}
    </div>
  );
}
