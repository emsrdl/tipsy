/**
 * @file src/hooks/__tests__/useProfiles.test.ts
 * @description Tests for profile management context and hook.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { type ReactNode } from 'react';
import { ProfileProvider, useProfileContext } from '@/context/ProfileContext';

function wrapper({ children }: { children: ReactNode }) {
  return <ProfileProvider>{children}</ProfileProvider>;
}

beforeEach(() => {
  localStorage.clear();
});

describe('useProfileContext', () => {
  it('starts with empty profiles and no active profile', () => {
    const { result } = renderHook(() => useProfileContext(), { wrapper });
    expect(result.current.profiles).toEqual([]);
    expect(result.current.activeProfile).toBeNull();
  });

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useProfileContext());
    }).toThrow('useProfileContext must be used inside ProfileProvider');
  });

  describe('createProfile', () => {
    it('creates a profile with correct fields', () => {
      const { result } = renderHook(() => useProfileContext(), { wrapper });

      act(() => {
        result.current.createProfile('Anna', 'service');
      });

      expect(result.current.profiles).toHaveLength(1);
      expect(result.current.profiles[0]!.name).toBe('Anna');
      expect(result.current.profiles[0]!.role).toBe('service');
      expect(result.current.profiles[0]!.stats.totalShifts).toBe(0);
    });

    it('activates profile by default', () => {
      const { result } = renderHook(() => useProfileContext(), { wrapper });

      act(() => {
        result.current.createProfile('Anna', 'service');
      });

      expect(result.current.activeProfile).not.toBeNull();
      expect(result.current.activeProfile!.name).toBe('Anna');
    });

    it('can create without activating', () => {
      const { result } = renderHook(() => useProfileContext(), { wrapper });

      act(() => {
        result.current.createProfile('Anna', 'service', false);
      });

      expect(result.current.profiles).toHaveLength(1);
      expect(result.current.activeProfile).toBeNull();
    });

    it('deactivates previous profile when creating new active one', () => {
      const { result } = renderHook(() => useProfileContext(), { wrapper });

      act(() => {
        result.current.createProfile('Anna', 'service');
      });
      act(() => {
        result.current.createProfile('Bob', 'kitchen');
      });

      expect(result.current.profiles).toHaveLength(2);
      expect(result.current.activeProfile!.name).toBe('Bob');
    });

    it('sets active profile when creating active profile', () => {
      const { result } = renderHook(() => useProfileContext(), { wrapper });

      act(() => {
        result.current.signOut();
      });
      expect(result.current.activeProfile).toBeNull();

      act(() => {
        result.current.createProfile('Anna', 'service');
      });
      expect(result.current.activeProfile).not.toBeNull();
    });
  });

  describe('switchProfile', () => {
    it('switches to specified profile', () => {
      const { result } = renderHook(() => useProfileContext(), { wrapper });

      act(() => {
        result.current.createProfile('Anna', 'service');
      });
      act(() => {
        result.current.createProfile('Bob', 'kitchen');
      });

      const annaId = result.current.profiles.find((p) => p.name === 'Anna')!.id;

      act(() => {
        result.current.switchProfile(annaId);
      });

      expect(result.current.activeProfile!.name).toBe('Anna');
    });

    it('sets active profile on switch after sign-out', () => {
      const { result } = renderHook(() => useProfileContext(), { wrapper });

      act(() => {
        result.current.createProfile('Anna', 'service');
      });
      const annaId = result.current.profiles[0]!.id;

      act(() => {
        result.current.signOut();
      });
      expect(result.current.activeProfile).toBeNull();

      act(() => {
        result.current.switchProfile(annaId);
      });
      expect(result.current.activeProfile).not.toBeNull();
      expect(result.current.activeProfile!.name).toBe('Anna');
    });
  });

  describe('updateProfile', () => {
    it('updates profile name', () => {
      const { result } = renderHook(() => useProfileContext(), { wrapper });

      act(() => {
        result.current.createProfile('Anna', 'service');
      });
      const id = result.current.profiles[0]!.id;

      act(() => {
        result.current.updateProfile(id, { name: 'Anna M.' });
      });

      expect(result.current.profiles[0]!.name).toBe('Anna M.');
    });

    it('updates profile role', () => {
      const { result } = renderHook(() => useProfileContext(), { wrapper });

      act(() => {
        result.current.createProfile('Anna', 'service');
      });
      const id = result.current.profiles[0]!.id;

      act(() => {
        result.current.updateProfile(id, { role: 'kitchen' });
      });

      expect(result.current.profiles[0]!.role).toBe('kitchen');
    });
  });

  describe('deleteProfile', () => {
    it('removes profile from list', () => {
      const { result } = renderHook(() => useProfileContext(), { wrapper });

      act(() => {
        result.current.createProfile('Anna', 'service');
      });
      const id = result.current.profiles[0]!.id;

      act(() => {
        result.current.deleteProfile(id);
      });

      expect(result.current.profiles).toHaveLength(0);
    });

    it('clears active profile if deleting the active one', () => {
      const { result } = renderHook(() => useProfileContext(), { wrapper });

      act(() => {
        result.current.createProfile('Anna', 'service');
      });
      const id = result.current.profiles[0]!.id;

      act(() => {
        result.current.deleteProfile(id);
      });

      expect(result.current.activeProfile).toBeNull();
    });
  });

  describe('resetProfileStats', () => {
    it('resets stats to zero', () => {
      const { result } = renderHook(() => useProfileContext(), { wrapper });

      act(() => {
        result.current.createProfile('Anna', 'service');
      });
      const id = result.current.profiles[0]!.id;

      act(() => {
        result.current.updateProfileStats(id, {
          totalShifts: 10,
          totalTipsInCents: 50000,
          hourlyRateAvgInCents: 1200,
        });
      });

      act(() => {
        result.current.resetProfileStats(id);
      });

      const stats = result.current.profiles[0]!.stats;
      expect(stats.totalShifts).toBe(0);
      expect(stats.totalTipsInCents).toBe(0);
      expect(stats.hourlyRateAvgInCents).toBe(0);
    });
  });

  describe('signOut', () => {
    it('clears the active profile', () => {
      const { result } = renderHook(() => useProfileContext(), { wrapper });

      act(() => {
        result.current.createProfile('Anna', 'service');
      });
      expect(result.current.activeProfile).not.toBeNull();

      act(() => {
        result.current.signOut();
      });

      expect(result.current.activeProfile).toBeNull();
    });

    it('deactivates all profiles when signing out', () => {
      const { result } = renderHook(() => useProfileContext(), { wrapper });

      act(() => {
        result.current.createProfile('Anna', 'service');
      });

      act(() => {
        result.current.signOut();
      });

      expect(result.current.activeProfile).toBeNull();
      expect(result.current.profiles.every((p) => !p.isActive)).toBe(true);
    });
  });

  describe('updateProfileStats', () => {
    it('updates stats for specified profile', () => {
      const { result } = renderHook(() => useProfileContext(), { wrapper });

      act(() => {
        result.current.createProfile('Anna', 'service');
      });
      const id = result.current.profiles[0]!.id;

      act(() => {
        result.current.updateProfileStats(id, {
          totalShifts: 5,
          totalTipsInCents: 25000,
          hourlyRateAvgInCents: 1100,
        });
      });

      const stats = result.current.profiles[0]!.stats;
      expect(stats.totalShifts).toBe(5);
      expect(stats.totalTipsInCents).toBe(25000);
      expect(stats.hourlyRateAvgInCents).toBe(1100);
    });
  });
});
