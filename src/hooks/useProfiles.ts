/**
 * @file src/hooks/useProfiles.ts
 * @description Consumer hook for profile management.
 *
 * @see src/context/ProfileContext.tsx for the provider
 * @see src/types/profile.ts for Profile type
 *
 * @example
 * const { profiles, activeProfile, createProfile } = useProfiles()
 */

import { useProfileContext } from '@/context/ProfileContext';

/**
 * Hook to access and manage user profiles.
 * Must be used within a ProfileProvider.
 */
export function useProfiles() {
  return useProfileContext();
}
