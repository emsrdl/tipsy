/**
 * @file src/components/molecules/Alert/Alert.tsx
 * @description Alert molecule — wraps shadcn Alert with status variant mapping.
 *
 * Maps semantic status types (error | warning | success | info) to the
 * appropriate visual variant and icon.
 *
 * @example
 * <Alert status="error" message="Bitte mindestens einen Mitarbeiter hinzufügen." />
 * <Alert status="warning" message="Der Gesamtbetrag beträgt €0,00." />
 */

import { Alert as ShadcnAlert, AlertDescription } from '@/components/ui/alert'
import { Icon } from '@/components/atoms/Icon/Icon'
import type { IconName } from '@/components/atoms/Icon/Icon.types'
import { cn } from '@/lib/utils'

export type AlertStatus = 'error' | 'warning' | 'success' | 'info'

export interface AlertProps {
  /** Semantic status type (controls icon and color). */
  status: AlertStatus
  /** The message to display. */
  message: string
  /** Additional CSS classes. */
  className?: string
}

const STATUS_CONFIG: Record<AlertStatus, { icon: IconName; className: string }> = {
  error:   { icon: 'alert-circle', className: 'border-status-error/50 text-status-error' },
  warning: { icon: 'alert-circle', className: 'border-status-warning/50 text-status-warning' },
  success: { icon: 'check',        className: 'border-status-success/50 text-status-success' },
  info:    { icon: 'info',         className: 'border-border' },
}

/**
 * Semantic alert banner.
 *
 * @param props - AlertProps
 * @returns Alert element with icon and message
 *
 * @example
 * <Alert status="error" message="Küche + Service muss 100 % ergeben." />
 */
export function Alert({ status, message, className }: AlertProps) {
  const { icon, className: statusClass } = STATUS_CONFIG[status]

  return (
    <ShadcnAlert className={cn(statusClass, className)}>
      <Icon name={icon} size={16} />
      <AlertDescription>{message}</AlertDescription>
    </ShadcnAlert>
  )
}
