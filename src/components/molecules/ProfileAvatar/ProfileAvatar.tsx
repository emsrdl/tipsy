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

import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useProfiles } from '@/hooks/useProfiles'
import { Badge } from '@/components/atoms/Badge/Badge'
import { cn } from '@/lib/utils'

/** Derives initials from a display name (e.g. "Elias Meyer" → "EM", "Anna" → "A"). */
function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}

/**
 * Header profile avatar with dropdown.
 * Clicking opens a small menu with profile actions.
 */
export function ProfileAvatar() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { activeProfile, isGuestMode, enterGuestMode } = useProfiles()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  const initials = isGuestMode || !activeProfile
    ? t('profile.guest')[0]?.toUpperCase() ?? 'G'
    : getInitials(activeProfile.name) || '?'

  const displayName = isGuestMode || !activeProfile
    ? t('profile.guestBadge')
    : activeProfile.name

  const displayRole = !isGuestMode && activeProfile?.role

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-label={displayName}
        className={cn(
          'h-10 w-10 rounded-full flex items-center justify-center',
          'text-xs font-bold transition-all',
          'ring-2 ring-offset-2 ring-offset-surface',
          isGuestMode || !activeProfile
            ? 'bg-surface-overlay text-text-secondary ring-border'
            : 'bg-accent text-accent-foreground ring-accent/40',
          isOpen && 'scale-95'
        )}
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-surface-raised rounded-xl shadow-elevation-4 border border-border overflow-hidden">
          {/* Profile info header */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-text-primary truncate flex-1">{displayName}</p>
              {isGuestMode && (
                <Badge variant="default" className="text-xs bg-status-warning/20 text-status-warning border-0 flex-shrink-0">
                  {t('profile.guestBadge')}
                </Badge>
              )}
              {displayRole && (
                <Badge variant={displayRole === 'kitchen' ? 'kitchen' : 'service'} className="flex-shrink-0">
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
              onClick={() => { setIsOpen(false); void navigate('/settings') }}
              className="w-full text-left px-4 py-3 text-sm text-text-primary hover:bg-surface-overlay transition-colors"
            >
              {t('profile.headerMenu.editProfile')}
            </button>
            <button
              type="button"
              onClick={() => { setIsOpen(false); void navigate('/settings') }}
              className="w-full text-left px-4 py-3 text-sm text-text-primary hover:bg-surface-overlay transition-colors"
            >
              {t('profile.headerMenu.switchProfile')}
            </button>

            {!isGuestMode && (
              <button
                type="button"
                onClick={() => { enterGuestMode(); setIsOpen(false) }}
                className="w-full text-left px-4 py-3 text-sm text-status-error hover:bg-status-error/5 transition-colors"
              >
                {t('actions.signOut')}
              </button>
            )}

            <div className="border-t border-border mt-1 pt-1">
              <button
                type="button"
                onClick={() => { setIsOpen(false); void navigate('/settings') }}
                className="w-full text-left px-4 py-3 text-sm text-text-secondary hover:bg-surface-overlay transition-colors"
              >
                {t('profile.headerMenu.settings')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
