/**
 * @file src/components/organisms/ProfileSelector/ProfileSelector.tsx
 * @description ProfileSelector — dropdown to switch profiles or enter guest mode.
 *
 * Shows the active profile with name + role badge, or "Gast Modus" if no profile.
 * Tapping opens an inline panel to switch, create, or enter guest mode.
 *
 * @example
 * <ProfileSelector />
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useProfiles } from '@/hooks/useProfiles';
import { useShifts } from '@/hooks/useShifts';
import { Icon } from '@/components/atoms/Icon/Icon';
import { Badge } from '@/components/atoms/Badge/Badge';
import { Button } from '@/components/atoms/Button/Button';
import { cn } from '@/lib/utils';

/**
 * Profile selector with inline dropdown panel.
 */
export function ProfileSelector() {
  const { t } = useTranslation(['common', 'screens']);
  const { profiles, activeProfile, isGuestMode, switchProfile, createProfile, enterGuestMode } =
    useProfiles();
  const { shifts } = useShifts();

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  function handleSwitch(id: string) {
    switchProfile(id);
    setIsOpen(false);
  }

  function handleGuestMode() {
    enterGuestMode();
    setIsOpen(false);
  }

  function handleCreate() {
    if (!newName.trim()) return;
    createProfile(newName.trim(), 'service', true);
    setNewName('');
    setIsCreating(false);
    setIsOpen(false);
  }

  const displayName =
    isGuestMode || !activeProfile ? t('common:profile.guestBadge') : activeProfile.name;

  const displayRole = activeProfile?.role ?? null;

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-4 py-3',
          'bg-surface-raised shadow-elevation-1 transition-all',
          'hover:shadow-elevation-2 active:shadow-elevation-1',
          'min-h-14',
        )}
        aria-expanded={isOpen}
      >
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            isGuestMode || !activeProfile ? 'bg-surface-overlay' : 'bg-accent/10',
          )}
        >
          <Icon
            name={isGuestMode || !activeProfile ? 'user' : 'user'}
            size={18}
            className={isGuestMode || !activeProfile ? 'text-text-secondary' : 'text-accent'}
          />
        </div>

        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary">{displayName}</span>
            {isGuestMode && (
              <Badge
                variant="default"
                className="bg-status-warning/20 border-0 text-xs text-status-warning"
              >
                {t('common:profile.guestBadge')}
              </Badge>
            )}
            {displayRole && !isGuestMode && (
              <Badge variant={displayRole === 'kitchen' ? 'kitchen' : 'service'}>
                {displayRole === 'kitchen'
                  ? t('common:profile.role.kitchen')
                  : t('common:profile.role.service')}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-text-secondary">{t('common:actions.switchProfile')}</p>
        </div>

        <Icon
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={16}
          className="shrink-0 text-text-secondary"
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-border bg-surface-raised shadow-elevation-4">
          {/* Existing profiles */}
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => handleSwitch(profile.id)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-overlay',
                activeProfile?.id === profile.id && 'bg-accent-subtle',
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  activeProfile?.id === profile.id
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-surface-overlay text-text-secondary',
                )}
              >
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-text-primary">{profile.name}</p>
                <p className="text-xs text-text-secondary">
                  {profile.role === 'kitchen'
                    ? t('common:profile.role.kitchen')
                    : t('common:profile.role.service')}
                  {' · '}
                  {shifts.filter((s) => s.profileId === profile.id).length}{' '}
                  {t('screens:shifts.title').toLowerCase()}
                </p>
              </div>
              {activeProfile?.id === profile.id && (
                <Icon name="check" size={16} className="text-accent" />
              )}
            </button>
          ))}

          {/* Guest mode */}
          <button
            type="button"
            onClick={handleGuestMode}
            className={cn(
              'flex w-full items-center gap-3 border-t border-border px-4 py-3 transition-colors hover:bg-surface-overlay',
              isGuestMode && 'bg-accent-subtle',
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-overlay">
              <Icon name="user" size={16} className="text-text-secondary" />
            </div>
            <span className="flex-1 text-left text-sm font-medium text-text-primary">
              {t('common:actions.guestMode')}
            </span>
            {isGuestMode && <Icon name="check" size={16} className="text-accent" />}
          </button>

          {/* Create new profile */}
          <div className="border-t border-border p-3">
            {!isCreating ? (
              <Button
                type="button"
                variant="ghost"
                className="min-h-10 w-full gap-2 text-sm"
                onClick={() => setIsCreating(true)}
              >
                <Icon name="plus" size={14} />
                {t('common:actions.createProfile')}
              </Button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder={t('screens:profile.namePlaceholder')}
                  className="h-10 flex-1 rounded-lg border border-border bg-surface-overlay px-3 text-sm text-text-primary focus:border-accent focus:outline-none"
                  autoFocus
                />
                <Button type="button" onClick={handleCreate} className="min-h-10 px-3 text-sm">
                  <Icon name="check" size={14} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsCreating(false);
                    setNewName('');
                  }}
                  className="min-h-10 px-3 text-sm"
                >
                  <Icon name="x" size={14} />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
