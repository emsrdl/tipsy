/**
 * @file src/context/TipSessionContext.tsx
 * @description React context for the active tip distribution session.
 *
 * Manages the full session state: employees, split config, denomination
 * quantities, and calculated results. Persists to sessionStorage so page
 * reloads during calculation don't lose data.
 *
 * State flows through three steps:
 *   1. Setup → update employees and split
 *   2. Cash input → update denominations
 *   3. Calculate → run tipCalculator and store results
 *
 * The session can be reset at any time (e.g. "new shift").
 *
 * @see src/types/session.ts for TipSession type
 * @see src/lib/calc/tipCalculator.ts for the calculation logic
 * @see src/hooks/useTipCalculator.ts for the consumer hook
 *
 * @example
 * <TipSessionProvider><App /></TipSessionProvider>
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { TipSession, TipSplit, DistributionResult } from '@/types/session';
import type { Employee } from '@/types/employee';
import type { CashPieces, CashSplitSuggestion, AppliedCashSplit } from '@/types/cashSplit';
import { calculateDistribution } from '@/lib/calc/tipCalculator';
import { sumDenominations } from '@/lib/calc/denominationParser';
import { DENOMINATIONS } from '@/config/currency';
import { readDefaultKitchenPercent } from '@/config/smartSplit';

const SESSION_STORAGE_KEY = 'tipsy_session';

const DEFAULT_SESSION_DENOMINATIONS = DENOMINATIONS.map((d) => ({
  denominationId: d.id,
  quantity: 0,
}));

function makeDefaultSession(): TipSession {
  const k = readDefaultKitchenPercent();
  return {
    employees: [],
    split: { kitchenPercent: k, servicePercent: 100 - k },
    denominations: DEFAULT_SESSION_DENOMINATIONS,
    results: null,
    appliedCashSplits: [],
  };
}

function loadPersistedSession(): TipSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TipSession>;
    // Validate minimal shape
    if (!Array.isArray(parsed.employees) || !parsed.split || !Array.isArray(parsed.denominations)) {
      return null;
    }
    // Backfill field added in v0.6.6 for older persisted sessions
    if (!Array.isArray(parsed.appliedCashSplits)) {
      parsed.appliedCashSplits = [];
    }
    return parsed as TipSession;
  } catch {
    return null;
  }
}

export interface TipSessionContextValue {
  session: TipSession;
  /** Total cash in euro cents (derived from denominations). */
  totalInCents: number;
  addEmployee: (employee: Employee) => void;
  removeEmployee: (id: string) => void;
  updateEmployee: (id: string, updates: Partial<Omit<Employee, 'id'>>) => void;
  setSplit: (split: TipSplit) => void;
  setDenominationQuantity: (denominationId: string, quantity: number) => void;
  calculate: () => DistributionResult[];
  reset: () => void;
  /** Apply a cash split — consumes one source bill, adds the chosen pieces. */
  applyCashSplit: (suggestion: CashSplitSuggestion, actualPieces: CashPieces) => void;
  /** Revert a previously applied cash split by id. */
  revertCashSplit: (splitId: string) => void;
  /** Whether session was restored from sessionStorage on mount. */
  wasRestored: boolean;
}

const TipSessionContext = createContext<TipSessionContextValue | null>(null);

interface TipSessionProviderProps {
  children: ReactNode;
  /** Optional initial session (used in tests via renderWithProviders). */
  initialSession?: TipSession;
}

/**
 * Provides tip session state and mutation actions to the component tree.
 * Persists session to sessionStorage on every change for reload recovery.
 */
export function TipSessionProvider({ children, initialSession }: TipSessionProviderProps) {
  const persisted = !initialSession ? loadPersistedSession() : null;
  const [session, setSession] = useState<TipSession>(
    () => initialSession ?? persisted ?? makeDefaultSession(),
  );
  const [wasRestored, setWasRestored] = useState(() => persisted !== null && !initialSession);

  const totalInCents = sumDenominations(session.denominations, DENOMINATIONS);

  // Persist to sessionStorage on every change (skip in test environments)
  useEffect(() => {
    if (initialSession !== undefined) return; // don't persist test sessions
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // sessionStorage unavailable (private browsing restriction)
    }
  }, [session, initialSession]);

  const addEmployee = useCallback((employee: Employee) => {
    setSession((s) => {
      if (s.employees.some((e) => e.id === employee.id)) return s;
      return { ...s, results: null, employees: [...s.employees, employee] };
    });
  }, []);

  const removeEmployee = useCallback((id: string) => {
    setSession((s) => ({
      ...s,
      results: null,
      employees: s.employees.filter((e) => e.id !== id),
    }));
  }, []);

  const updateEmployee = useCallback((id: string, updates: Partial<Omit<Employee, 'id'>>) => {
    setSession((s) => ({
      ...s,
      results: null,
      employees: s.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  }, []);

  const setSplit = useCallback(
    (split: TipSplit) => {
      setSession((s) => {
        if (s.results !== null) {
          const results = calculateDistribution({ totalInCents, employees: s.employees, split });
          return { ...s, results, split };
        }
        return { ...s, results: null, split };
      });
    },
    [totalInCents],
  );

  const setDenominationQuantity = useCallback((denominationId: string, quantity: number) => {
    setSession((s) => ({
      ...s,
      results: null,
      denominations: s.denominations.map((d) =>
        d.denominationId === denominationId ? { ...d, quantity } : d,
      ),
    }));
  }, []);

  const calculate = useCallback((): DistributionResult[] => {
    const results = calculateDistribution({
      totalInCents,
      employees: session.employees,
      split: session.split,
    });
    setSession((s) => ({ ...s, results }));
    return results;
  }, [totalInCents, session.employees, session.split]);

  const applyCashSplit = useCallback(
    (suggestion: CashSplitSuggestion, actualPieces: CashPieces) => {
      setSession((s) => {
        const sourceQty =
          s.denominations.find((d) => d.denominationId === suggestion.sourceDenominationId)?.quantity ?? 0;
        if (sourceQty < 1) return s;

        const pieceMap = new Map<string, number>();
        for (const piece of actualPieces) {
          if (piece.count <= 0) continue;
          pieceMap.set(piece.denominationId, (pieceMap.get(piece.denominationId) ?? 0) + piece.count);
        }

        let newDenominations = s.denominations.map((d) => {
          if (d.denominationId === suggestion.sourceDenominationId) {
            return { ...d, quantity: d.quantity - 1 };
          }
          const add = pieceMap.get(d.denominationId);
          if (add !== undefined) return { ...d, quantity: d.quantity + add };
          return d;
        });

        // Add any pieces for denominations not yet in the pool
        const presentIds = new Set(newDenominations.map((d) => d.denominationId));
        for (const [denominationId, count] of pieceMap) {
          if (!presentIds.has(denominationId)) {
            newDenominations = [...newDenominations, { denominationId, quantity: count }];
          }
        }

        // Own id, not suggestion.id — the same bill can be split repeatedly
        // and each applied entry must be revertible individually.
        const applied: AppliedCashSplit = {
          id: `split-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          sourceDenominationId: suggestion.sourceDenominationId,
          actualPieces,
          appliedAt: new Date().toISOString(),
        };

        return {
          ...s,
          denominations: newDenominations,
          appliedCashSplits: [...s.appliedCashSplits, applied],
        };
      });
    },
    [],
  );

  const revertCashSplit = useCallback((splitId: string) => {
    setSession((s) => {
      const applied = s.appliedCashSplits.find((a) => a.id === splitId);
      if (!applied) return s;

      const pieceMap = new Map<string, number>();
      for (const piece of applied.actualPieces) {
        if (piece.count <= 0) continue;
        pieceMap.set(piece.denominationId, (pieceMap.get(piece.denominationId) ?? 0) + piece.count);
      }

      const newDenominations = s.denominations.map((d) => {
        if (d.denominationId === applied.sourceDenominationId) return { ...d, quantity: d.quantity + 1 };
        const remove = pieceMap.get(d.denominationId);
        if (remove !== undefined) return { ...d, quantity: Math.max(0, d.quantity - remove) };
        return d;
      });

      return {
        ...s,
        denominations: newDenominations,
        appliedCashSplits: s.appliedCashSplits.filter((a) => a.id !== splitId),
      };
    });
  }, []);

  const reset = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
    setSession(makeDefaultSession());
    setWasRestored(false);
  }, []);

  return (
    <TipSessionContext.Provider
      value={{
        session,
        totalInCents,
        addEmployee,
        removeEmployee,
        updateEmployee,
        setSplit,
        setDenominationQuantity,
        calculate,
        reset,
        applyCashSplit,
        revertCashSplit,
        wasRestored,
      }}
    >
      {children}
    </TipSessionContext.Provider>
  );
}

export function useTipSessionContext(): TipSessionContextValue {
  const ctx = useContext(TipSessionContext);
  if (!ctx) throw new Error('useTipSessionContext must be used inside TipSessionProvider');
  return ctx;
}
