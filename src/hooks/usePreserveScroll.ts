/**
 * @file src/hooks/usePreserveScroll.ts
 * @description Relative scroll preservation for multi-step flows.
 *
 * Tracks which routes have been visited in the current flow pass. On the first
 * visit, the page scrolls to the top. On subsequent visits (e.g. back→forward),
 * the stored scroll ratio is applied to the new page's scroll height so that
 * "at the bottom" always means "at the bottom of the destination page".
 *
 * Call `markFlowReset()` in any handler that starts a new pass (reset, save & finish)
 * so the next navigation treats every step as a first visit again.
 */

import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Disable browser scroll restoration so this hook has full control.
history.scrollRestoration = 'manual';

/** Routes visited in the current flow pass. Cleared on reset. */
const visitedRoutes = new Set<string>();

/** Absolute scroll positions saved on tab-switch, keyed by pathname. */
const savedScrollPositions = new Map<string, number>();

// Persists the active calculate route across AppLayout re-renders so markFlowReset()
// can signal "go back to step 1" without requiring an explicit navigate('/calculate').
let _lastCalculateRoute = '/calculate';

export function getLastCalculateRoute() {
  return _lastCalculateRoute;
}

export function updateLastCalculateRoute(route: string) {
  _lastCalculateRoute = route;
}

/** Call before navigating away (e.g. tab click) to persist the current scroll position. */
export function saveScrollPosition(pathname: string) {
  savedScrollPositions.set(pathname, window.scrollY);
}

/** Call in reset/save handlers to restart first-visit behaviour for the next calculate pass. */
export function markFlowReset() {
  for (const route of Array.from(visitedRoutes)) {
    if (route.startsWith('/calculate')) visitedRoutes.delete(route);
  }
  _lastCalculateRoute = '/calculate';
}

/** Returns the current scroll position as a 0–1 ratio of the page's max scroll. */
export function getScrollRatio(): number {
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  return maxScroll > 0 ? window.scrollY / maxScroll : 0;
}

/**
 * On mount: scrolls to top on first visit, or restores a relative position
 * (from `location.state.scrollRatio`) on subsequent visits to the same route.
 *
 * @example
 * // In navigate calls:
 * navigate('/calculate/cash', { state: { scrollRatio: getScrollRatio() } });
 * // In screen component:
 * usePreserveScroll();
 */
export function usePreserveScroll() {
  const location = useLocation();
  const hasRun = useRef(false);
  useLayoutEffect(() => {
    // StrictMode runs effects twice — skip the second invocation.
    if (hasRun.current) return;
    hasRun.current = true;

    const isFirstVisit = !visitedRoutes.has(location.pathname);
    visitedRoutes.add(location.pathname);

    const state = location.state as { scrollRatio?: number; isBack?: boolean } | null;

    if (isFirstVisit && !state?.isBack) {
      window.scrollTo(0, 0);
      return;
    }

    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    if (state?.scrollRatio !== undefined) {
      window.scrollTo(0, Math.round(state.scrollRatio * maxScroll));
    } else {
      window.scrollTo(0, savedScrollPositions.get(location.pathname) ?? 0);
    }
  // Mount-only: location is stable on first render; re-running on nav changes would defeat the hook's purpose.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
