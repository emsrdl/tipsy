/**
 * @file src/lib/utils.ts
 * @description Tailwind class merging utility (required by shadcn/ui).
 *
 * @example
 * cn('px-4 py-2', condition && 'bg-accent', className)
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS class names, resolving conflicts intelligently.
 *
 * @param inputs - Any number of class values (strings, objects, arrays)
 * @returns Merged class string
 *
 * @example
 * cn('px-2 py-1', 'px-4') // "py-1 px-4" (px-4 wins)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
