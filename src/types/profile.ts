/**
 * @file src/types/profile.ts
 * @description Types for multi-user profile system.
 *
 * Profiles persist in localStorage and track per-user stats.
 * Guest mode uses no profile (in-memory only).
 *
 * @see src/context/ProfileContext.tsx for runtime state
 * @see src/hooks/useProfiles.ts for profile management
 */

/** Employee role for profiles. */
export type ProfileRole = 'kitchen' | 'service';

/**
 * Aggregated statistics for a user profile.
 *
 * @example
 * const stats: ProfileStats = { totalShifts: 12, totalTipsInCents: 450000, hourlyRateAvgInCents: 1250 }
 */
export interface ProfileStats {
  /** Total number of completed shifts. */
  totalShifts: number;
  /** Total tips received across all shifts, in cents. */
  totalTipsInCents: number;
  /** Average hourly rate across all shifts, in cents. */
  hourlyRateAvgInCents: number;
}

/**
 * A user profile stored in localStorage.
 *
 * @example
 * const profile: Profile = {
 *   id: 'p-abc123',
 *   name: 'Anna',
 *   role: 'service',
 *   createdAt: '2026-03-21T10:00:00.000Z',
 *   isActive: true,
 *   stats: { totalShifts: 5, totalTipsInCents: 150000, hourlyRateAvgInCents: 1100 },
 * }
 */
export interface Profile {
  /** Unique identifier (UUID-style). */
  id: string;
  /** Display name. */
  name: string;
  /** Default role for this profile. */
  role: ProfileRole;
  /** ISO 8601 creation timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp of the last time this profile was activated. */
  lastUsedAt: string;
  /** Whether this profile is currently active. */
  isActive: boolean;
  /** Aggregated career stats. */
  stats: ProfileStats;
}
