/**
 * @file src/hooks/useLocalStorage.ts
 * @description Generic typed localStorage hook with JSON serialization.
 *
 * Provides React state that is automatically persisted to localStorage.
 * On initial render, reads from localStorage (falling back to the initial value).
 * On state change, writes to localStorage synchronously.
 *
 * Handles:
 * - JSON parse/stringify for complex values
 * - Graceful fallback when localStorage is unavailable (e.g. SSR, private browsing)
 * - Storage event listening for cross-tab synchronization
 * - Type safety via generics
 *
 * @see src/hooks/useCalculation.ts which uses this for history persistence
 *
 * @example
 * // Store a primitive
 * const [count, setCount] = useLocalStorage('my-count', 0)
 *
 * @example
 * // Store an object
 * const [prefs, setPrefs] = useLocalStorage('user-prefs', { theme: 'tipsy' })
 *
 * @example
 * // Store an array with history
 * const [history, setHistory] = useLocalStorage<HistoryEntry[]>('tipsy-history', [])
 */

import { useState, useEffect, useCallback } from 'react'

/**
 * React hook that synchronizes state with localStorage.
 *
 * @typeParam T - The type of the stored value. Must be JSON-serializable.
 * @param key - The localStorage key.
 * @param initialValue - Default value when nothing is stored yet.
 * @returns A tuple of [value, setValue, removeValue], mirroring useState.
 *
 * @example
 * function MyComponent() {
 *   const [name, setName, removeName] = useLocalStorage('user-name', '')
 *   return <input value={name} onChange={(e) => setName(e.target.value)} />
 * }
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Lazy initializer reads from localStorage once on mount
  const [storedValue, setStoredValue] = useState<T>(() => {
    return readFromStorage(key, initialValue)
  })

  // Write to localStorage whenever the value changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value
        writeToStorage(key, nextValue)
        return nextValue
      })
    },
    [key]
  )

  // Remove the key from localStorage and reset to initial
  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key)
    } catch {
      // localStorage unavailable — silently ignore
    }
    setStoredValue(initialValue)
  }, [key, initialValue])

  // Listen for storage events from other tabs
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key !== key) return
      if (e.newValue === null) {
        setStoredValue(initialValue)
      } else {
        try {
          setStoredValue(JSON.parse(e.newValue) as T)
        } catch {
          setStoredValue(initialValue)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

/**
 * Reads a value from localStorage, returning initialValue on any failure.
 *
 * @internal
 * @param key - localStorage key
 * @param initialValue - Fallback value
 * @returns Parsed value or initialValue
 */
function readFromStorage<T>(key: string, initialValue: T): T {
  try {
    const item = localStorage.getItem(key)
    if (item === null) return initialValue
    return JSON.parse(item) as T
  } catch {
    // localStorage unavailable or JSON parse error — use initial value
    return initialValue
  }
}

/**
 * Writes a value to localStorage as JSON.
 *
 * @internal
 * @param key - localStorage key
 * @param value - Value to store
 */
function writeToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage unavailable or quota exceeded — silently ignore
  }
}
