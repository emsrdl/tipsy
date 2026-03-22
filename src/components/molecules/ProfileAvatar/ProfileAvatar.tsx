/**
 * @file src/components/molecules/ProfileAvatar/ProfileAvatar.tsx
 * @description ProfileAvatar — circular avatar in the header with inline dropdown menu.
 *
 * Shows initials derived from the active profile name (up to 2 letters).
 * Guest mode shows "G" with muted styling.
 * On click: toggles an inline dropdown with profile actions.
 *
 * @example
 * <ProfileAvatar />
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useProfiles } from '@/hooks/useProfiles';
import { Badge } from '@/components/atoms/Badge/Badge';
import { cn } from '@/lib/utils';

/** Derives initials from a display name (e.g. "Elias Meyer" → "EM", "Anna" → "A"). */
function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

/**
 * Header profile avatar with dropdown.
 * Clicking opens a small menu with profile actions.
 */
export function ProfileAvatar() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { activeProfile, isGuestMode, enterGuestMode } = useProfiles();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const initials =
    isGuestMode || !activeProfile
      ? (t('profile.guest')[0]?.toUpperCase() ?? 'G')
      : getInitials(activeProfile.name) || '?';

  const displayName = isGuestMode || !activeProfile ? t('profile.guestBadge') : activeProfile.name;

  const displayRole = !isGuestMode && activeProfile?.role;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-label={displayName}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full',
          'text-xs font-bold transition-all',
          'ring-2 ring-offset-2 ring-offset-surface',
          isGuestMode || !activeProfile
            ? 'bg-surface-overlay text-text-secondary ring-border'
            : 'ring-accent/40 bg-accent text-accent-foreground',
          isOpen && 'scale-95',
        )}
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface-raised shadow-elevation-4">
          {/* Profile info header */}
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="flex-1 truncate text-sm font-semibold text-text-primary">
                {displayName}
              </p>
              {isGuestMode && (
                <Badge
                  variant="default"
                  className="bg-status-warning/20 flex-shrink-0 border-0 text-xs text-status-warning"
                >
                  {t('profile.guestBadge')}
                </Badge>
              )}
              {displayRole && (
                <Badge
                  variant={displayRole === 'kitchen' ? 'kitchen' : 'service'}
                  className="flex-shrink-0"
                >
                  {displayRole === 'kitchen'
                    ? t('profile.role.kitchen')
                    : t('profile.role.service')}
                </Badge>
              )}
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                void navigate('/settings');
              }}
              className="w-full px-4 py-3 text-left text-sm text-text-primary transition-colors hover:bg-surface-overlay"
            >
              {t('profile.headerMenu.editProfile')}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                void navigate('/settings');
              }}
              className="w-full px-4 py-3 text-left text-sm text-text-primary transition-colors hover:bg-surface-overlay"
            >
              {t('profile.headerMenu.switchProfile')}
            </button>

            {!isGuestMode && (
              <button
                type="button"
                onClick={() => {
                  enterGuestMode();
                  setIsOpen(false);
                }}
                className="hover:bg-status-error/5 w-full px-4 py-3 text-left text-sm text-status-error transition-colors"
              >
                {t('actions.signOut')}
              </button>
            )}

            <div className="mt-1 border-t border-border pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  void navigate('/settings');
                }}
                className="w-full px-4 py-3 text-left text-sm text-text-secondary transition-colors hover:bg-surface-overlay"
              >
                {t('profile.headerMenu.settings')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
