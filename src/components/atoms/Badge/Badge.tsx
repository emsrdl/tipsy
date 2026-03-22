/**
 * @file src/components/atoms/Badge/Badge.tsx
 * @description Badge atom for small status/group labels.
 *
 * Used to display employee group (Küche / Service) in the results table.
 *
 * @example
 * <Badge variant="kitchen">Küche</Badge>
 * <Badge variant="service">Service</Badge>
 * <Badge>Default</Badge>
 */

import { cn } from '@/lib/utils';

export interface BadgeProps {
  /** Visual style variant. @default "default" */
  variant?: 'default' | 'kitchen' | 'service' | 'accent';
  children: React.ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-surface-overlay text-text-secondary',
  kitchen: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  service: 'bg-accent-subtle text-accent',
  accent: 'bg-accent text-accent-foreground',
};

/**
 * Small inline badge.
 *
 * @param props - BadgeProps
 * @returns span element
 *
 * @example
 * <Badge variant="kitchen">Küche</Badge>
 */
export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
