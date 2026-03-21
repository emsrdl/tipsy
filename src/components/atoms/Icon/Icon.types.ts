/**
 * @file src/components/atoms/Icon/Icon.types.ts
 * @description Icon name union type and Icon props.
 *
 * Thin wrapper around lucide-react icons to keep the icon set curated.
 * Add new icon names here when a new icon is needed.
 */

/** Curated set of icon names used in the app. Maps to lucide-react exports. */
export type IconName =
  | 'plus'
  | 'minus'
  | 'trash'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-up'
  | 'chevron-down'
  | 'download'
  | 'file-text'
  | 'sun'
  | 'moon'
  | 'check'
  | 'x'
  | 'alert-circle'
  | 'info'
  | 'refresh-cw'
  | 'banknote'
  | 'coins'
  | 'share-2'
  | 'copy'
  | 'users'
  | 'clock'
  | 'utensils-crossed'
  | 'calculator'
  | 'settings'
  | 'history'
  | 'toggle-left'
  | 'toggle-right'
  | 'bar-chart-2'
  | 'save'
  | 'upload'
  | 'arrow-right'
  | 'user'
  | 'star'
  | 'zap'
  | 'edit-2'

export interface IconProps {
  /** Which icon to render. */
  name: IconName
  /** Visual size in pixels. @default 16 */
  size?: number
  /** Additional CSS classes. */
  className?: string
  /** Accessible label (omit for decorative icons). */
  'aria-label'?: string
}
