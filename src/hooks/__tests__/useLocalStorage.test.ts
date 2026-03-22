import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns the initial value when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 42));
    expect(result.current[0]).toBe(42);
  });

  it('reads existing value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify(99));
    const { result } = renderHook(() => useLocalStorage('test-key', 42));
    expect(result.current[0]).toBe(99);
  });

  it('writes to localStorage on setValue', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0));

    act(() => {
      result.current[1](123);
    });

    expect(result.current[0]).toBe(123);
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe(123);
  });

  it('supports functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 10));

    act(() => {
      result.current[1]((prev) => prev + 5);
    });

    expect(result.current[0]).toBe(15);
  });

  it('stores complex objects', () => {
    const initial = { name: 'test', items: [1, 2, 3] };
    const { result } = renderHook(() => useLocalStorage('test-obj', initial));

    act(() => {
      result.current[1]({ name: 'updated', items: [4, 5] });
    });

    expect(result.current[0]).toEqual({ name: 'updated', items: [4, 5] });
    expect(JSON.parse(localStorage.getItem('test-obj')!)).toEqual({
      name: 'updated',
      items: [4, 5],
    });
  });

  it('stores arrays', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>('test-arr', []));

    act(() => {
      result.current[1](['a', 'b', 'c']);
    });

    expect(result.current[0]).toEqual(['a', 'b', 'c']);
  });

  it('removeValue clears the key and resets to initial', () => {
    localStorage.setItem('test-key', JSON.stringify(99));
    const { result } = renderHook(() => useLocalStorage('test-key', 42));

    expect(result.current[0]).toBe(99);

    act(() => {
      result.current[2](); // removeValue
    });

    expect(result.current[0]).toBe(42);
    expect(localStorage.getItem('test-key')).toBeNull();
  });

  it('falls back to initial when localStorage has invalid JSON', () => {
    localStorage.setItem('test-key', 'not-json');
    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('handles storage event from another tab', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0));

    act(() => {
      // Simulate storage event from another tab
      const event = new StorageEvent('storage', {
        key: 'test-key',
        newValue: JSON.stringify(999),
      });
      window.dispatchEvent(event);
    });

    expect(result.current[0]).toBe(999);
  });

  it('resets to initial on storage event with null newValue', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 42));

    act(() => {
      result.current[1](100);
    });

    act(() => {
      const event = new StorageEvent('storage', {
        key: 'test-key',
        newValue: null,
      });
      window.dispatchEvent(event);
    });

    expect(result.current[0]).toBe(42);
  });

  it('ignores storage events for different keys', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 42));

    act(() => {
      result.current[1](100);
    });

    act(() => {
      const event = new StorageEvent('storage', {
        key: 'other-key',
        newValue: JSON.stringify(999),
      });
      window.dispatchEvent(event);
    });

    expect(result.current[0]).toBe(100);
  });

  it('handles storage event with invalid JSON gracefully', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 42));

    act(() => {
      const event = new StorageEvent('storage', {
        key: 'test-key',
        newValue: 'invalid-json',
      });
      window.dispatchEvent(event);
    });

    expect(result.current[0]).toBe(42);
  });
});
