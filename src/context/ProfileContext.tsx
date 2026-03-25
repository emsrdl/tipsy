/**
 * @file src/context/ProfileContext.tsx
 * @description React context for multi-user profile management.
 *
 * Manages profiles in localStorage and the active profile selection.
 * When no profile is active (activeProfile === null) the user is signed out.
 *
 * @see src/types/profile.ts for Profile type
 * @see src/hooks/useProfiles.ts for the consumer hook
 */

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Profile, ProfileRole, ProfileStats } from '@/types/profile';

const PROFILES_KEY = 'tipsy_profiles';
const ACTIVE_PROFILE_KEY = 'tipsy_active_profile_id';

const EMPTY_STATS: ProfileStats = {
  totalShifts: 0,
  totalTipsInCents: 0,
  hourlyRateAvgInCents: 0,
};

function generateId(): string {
  return `prof-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface ProfileContextValue {
  /** All saved profiles. */
  profiles: Profile[];
  /** Currently active profile, or null when signed out. */
  activeProfile: Profile | null;
  /** Create a new profile and optionally activate it. */
  createProfile: (name: string, role: ProfileRole, activate?: boolean) => Profile;
  /** Switch to an existing profile by ID. */
  switchProfile: (profileId: string) => void;
  /** Update a profile's name or role. */
  updateProfile: (profileId: string, updates: Partial<Pick<Profile, 'name' | 'role'>>) => void;
  /** Update a profile's stats. */
  updateProfileStats: (profileId: string, stats: ProfileStats) => void;
  /** Delete a profile. Clears the active profile if it was the deleted one. */
  deleteProfile: (profileId: string) => void;
  /** Reset a profile's stats to zero. */
  resetProfileStats: (profileId: string) => void;
  /** Sign out — clears the active profile. */
  signOut: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

interface ProfileProviderProps {
  children: ReactNode;
}

/**
 * Provides profile management to the component tree.
 */
export function ProfileProvider({ children }: ProfileProviderProps) {
  const [profiles, setProfiles] = useLocalStorage<Profile[]>(PROFILES_KEY, []);
  const [activeProfileId, setActiveProfileId] = useLocalStorage<string | null>(
    ACTIVE_PROFILE_KEY,
    null,
  );

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  const createProfile = useCallback(
    (name: string, role: ProfileRole, activate = true): Profile => {
      const now = new Date().toISOString();
      const profile: Profile = {
        id: generateId(),
        name,
        role,
        createdAt: now,
        lastUsedAt: now,
        isActive: activate,
        stats: { ...EMPTY_STATS },
      };
      setProfiles((prev) => {
        const updated = activate ? prev.map((p) => ({ ...p, isActive: false })) : prev;
        return [...updated, profile];
      });
      if (activate) {
        setActiveProfileId(profile.id);
      }
      return profile;
    },
    [setProfiles, setActiveProfileId],
  );

  const switchProfile = useCallback(
    (profileId: string) => {
      const now = new Date().toISOString();
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId ? { ...p, isActive: true, lastUsedAt: now } : { ...p, isActive: false },
        ),
      );
      setActiveProfileId(profileId);
    },
    [setProfiles, setActiveProfileId],
  );

  const updateProfile = useCallback(
    (profileId: string, updates: Partial<Pick<Profile, 'name' | 'role'>>) => {
      setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, ...updates } : p)));
    },
    [setProfiles],
  );

  const updateProfileStats = useCallback(
    (profileId: string, stats: ProfileStats) => {
      setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, stats } : p)));
    },
    [setProfiles],
  );

  const deleteProfile = useCallback(
    (profileId: string) => {
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      if (activeProfileId === profileId) {
        setActiveProfileId(null);
      }
    },
    [setProfiles, activeProfileId, setActiveProfileId],
  );

  const resetProfileStats = useCallback(
    (profileId: string) => {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, stats: { ...EMPTY_STATS } } : p)),
      );
    },
    [setProfiles],
  );

  const signOut = useCallback(() => {
    setActiveProfileId(null);
    setProfiles((prev) => prev.map((p) => ({ ...p, isActive: false })));
  }, [setActiveProfileId, setProfiles]);

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        createProfile,
        switchProfile,
        updateProfile,
        updateProfileStats,
        deleteProfile,
        resetProfileStats,
        signOut,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfileContext must be used inside ProfileProvider');
  return ctx;
}
