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
import { ProfileRoleBadge } from '@/components/molecules/ProfileRoleBadge/ProfileRoleBadge';
import { Icon } from '@/components/atoms/Icon/Icon';
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
  const { profiles, activeProfile, isGuestMode, enterGuestMode, switchProfile } = useProfiles();
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

  const displayName = isGuestMode || !activeProfile ? t('profile.guest') : activeProfile.name;

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
              <ProfileRoleBadge
                role={isGuestMode ? null : (activeProfile?.role ?? null)}
                className="flex-shrink-0"
              />
            </div>
          </div>

          {/* Profile quick-switch list — up to 3 most recent by creation date */}
          <div className="py-1">
            {[...profiles]
              .filter((p) => p.id !== activeProfile?.id)
              .sort(
                (a, b) =>
                  new Date(b.lastUsedAt ?? b.createdAt).getTime() -
                  new Date(a.lastUsedAt ?? a.createdAt).getTime(),
              )
              .slice(0, 3)
              .map((profile) => {
                const isActive = !isGuestMode && activeProfile?.id === profile.id;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => {
                      switchProfile(profile.id);
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-text-primary transition-colors hover:bg-surface-overlay"
                  >
                    <span className="flex-1 truncate">{profile.name}</span>
                    {isActive && (
                      <Icon name="check" size={14} className="text-accent flex-shrink-0" />
                    )}
                  </button>
                );
              })}

            {/* Create profile — only shown in guest mode with no profiles */}
            {isGuestMode && profiles.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  void navigate('/settings');
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-accent transition-colors hover:bg-surface-overlay"
              >
                <Icon name="user-plus" size={14} className="flex-shrink-0" />
                <span className="flex-1">{t('actions.createProfile')}</span>
              </button>
            )}

            {/* Sign out — only shown when a profile is active */}
            {!isGuestMode && (
              <button
                type="button"
                onClick={() => {
                  enterGuestMode();
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-status-error transition-colors hover:bg-status-error/5"
              >
                <span className="flex-1">{t('actions.signOut')}</span>
              </button>
            )}
          </div>

          {/* More profiles → Settings */}
          <div className="border-t border-border">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                void navigate('/settings');
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-text-secondary transition-colors hover:bg-surface-overlay"
            >
              <Icon name="users" size={14} className="flex-shrink-0" />
              <span className="flex-1">{t('profile.headerMenu.moreProfiles')}</span>
              <Icon name="chevron-right" size={14} className="flex-shrink-0" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
