/**
 * @file src/components/molecules/ProfileRoleBadge/ProfileRoleBadge.tsx
 * @description Single source of truth for profile role/status badges.
 *
 * Renders a role badge (kitchen / service) for regular profiles,
 * or a "Abgemeldet" badge for guest mode (role === null).
 *
 * @example
 * <ProfileRoleBadge role="service" />
 * <ProfileRoleBadge role="kitchen" />
 * <ProfileRoleBadge role={null} />  // guest → "Abgemeldet"
 */

import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/atoms/Badge/Badge';
import type { ProfileRole } from '@/types/profile';

interface ProfileRoleBadgeProps {
  /** Profile role, or null for guest mode. */
  role: ProfileRole | null;
  className?: string;
}

/**
 * Badge for a profile's role or guest status.
 *
 * @param props - ProfileRoleBadgeProps
 * @returns Badge element
 *
 * @example
 * <ProfileRoleBadge role="service" />
 * <ProfileRoleBadge role={null} />
 */
export function ProfileRoleBadge({ role, className }: ProfileRoleBadgeProps) {
  const { t } = useTranslation('common');

  if (role === null) {
    return (
      <Badge variant="signed-out" className={className}>
        {t('profile.headerMenu.signedOut')}
      </Badge>
    );
  }

  return (
    <Badge variant={role === 'kitchen' ? 'kitchen' : 'service'} className={className}>
      {role === 'kitchen' ? t('profile.role.kitchen') : t('profile.role.service')}
    </Badge>
  );
}
