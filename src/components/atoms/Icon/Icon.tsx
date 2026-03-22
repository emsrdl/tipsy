/**
 * @file src/components/atoms/Icon/Icon.tsx
 * @description Icon atom — renders a curated lucide-react icon by name.
 *
 * All icons used in the app should go through this component, keeping
 * the icon set controlled and the bundle size predictable.
 *
 * @see src/components/atoms/Icon/Icon.types.ts for available IconName values
 *
 * @example
 * <Icon name="plus" size={20} aria-label="Hinzufügen" />
 * <Icon name="trash" className="text-status-error" />
 */

import {
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Download,
  FileText,
  Sun,
  Moon,
  Check,
  X,
  AlertCircle,
  Info,
  RefreshCw,
  Banknote,
  Coins,
  Share2,
  Copy,
  Users,
  Clock,
  UtensilsCrossed,
  Calculator,
  Settings,
  History,
  ToggleLeft,
  ToggleRight,
  BarChart2,
  Save,
  Upload,
  ArrowRight,
  User,
  Star,
  Zap,
  Edit2,
  type LucideIcon,
} from 'lucide-react';
import type { IconName, IconProps } from './Icon.types';

const ICON_MAP: Record<IconName, LucideIcon> = {
  plus: Plus,
  minus: Minus,
  trash: Trash2,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  download: Download,
  'file-text': FileText,
  sun: Sun,
  moon: Moon,
  check: Check,
  x: X,
  'alert-circle': AlertCircle,
  info: Info,
  'refresh-cw': RefreshCw,
  banknote: Banknote,
  coins: Coins,
  'share-2': Share2,
  copy: Copy,
  users: Users,
  clock: Clock,
  'utensils-crossed': UtensilsCrossed,
  calculator: Calculator,
  settings: Settings,
  history: History,
  'toggle-left': ToggleLeft,
  'toggle-right': ToggleRight,
  'bar-chart-2': BarChart2,
  save: Save,
  upload: Upload,
  'arrow-right': ArrowRight,
  user: User,
  star: Star,
  zap: Zap,
  'edit-2': Edit2,
};

/**
 * Renders a named icon from the curated icon set.
 *
 * @param props - IconProps
 * @returns SVG icon element
 *
 * @example
 * <Icon name="plus" size={20} aria-label="Mitarbeiter hinzufügen" />
 */
export function Icon({ name, size = 16, className, 'aria-label': ariaLabel }: IconProps) {
  const IconComponent = ICON_MAP[name];
  return (
    <IconComponent
      size={size}
      className={className}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    />
  );
}
