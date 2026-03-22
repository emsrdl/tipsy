/**
 * @file src/components/organisms/ThemeSwitcher/ThemeSwitcher.tsx
 * @description ThemeSwitcher organism — theme selection dialog.
 *
 * Opens a dialog with:
 * - Tipsy ↔ Katzentempel toggle
 * - Color picker (only shown for Tipsy theme)
 *
 * @example
 * <ThemeSwitcher />
 */

import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/atoms/Button/Button';
import { ColorSwatch } from '@/components/molecules/ColorSwatch/ColorSwatch';
import { useTheme } from '@/hooks/useTheme';
import { THEME_IDS } from '@/config/themes';
import type { ThemeId } from '@/types/theme';

/**
 * Theme selection button that opens a dialog.
 *
 * @returns DialogTrigger + Dialog with theme options
 *
 * @example
 * <ThemeSwitcher />
 */
export function ThemeSwitcher() {
  const { t } = useTranslation('common');
  const { theme, accentColor, setTheme, setAccentColor } = useTheme();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" aria-label={t('theme.switchTheme')}>
          <span
            className="h-4 w-4 rounded-full border border-border"
            style={{ backgroundColor: accentColor.hex }}
          />
          <span className="ml-1 text-xs">{t(`theme.${theme.id}`)}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>{t('theme.switchTheme')}</DialogTitle>
        </DialogHeader>

        {/* Theme selection */}
        <div className="flex gap-2">
          {THEME_IDS.map((id) => (
            <Button
              key={id}
              type="button"
              variant={theme.id === id ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setTheme(id as ThemeId)}
            >
              {t(`theme.${id}`)}
            </Button>
          ))}
        </div>

        {/* Accent color picker — only for Tipsy */}
        {theme.hasAccentPicker && (
          <div>
            <p className="mb-2 text-sm text-text-secondary">
              {t('theme.accent.blue').replace('Blau', '').trim() || 'Farbe'}
            </p>
            <div className="flex gap-3">
              {theme.accentColors.map((color) => (
                <ColorSwatch
                  key={color.id}
                  colorId={color.id}
                  hex={color.hex}
                  label={t(color.labelKey)}
                  selected={accentColor.id === color.id}
                  onClick={setAccentColor}
                />
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
