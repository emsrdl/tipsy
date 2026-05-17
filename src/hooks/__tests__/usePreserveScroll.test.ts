import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/utils/scrollContainer', () => ({
  getScrollEl: vi.fn(),
  SCROLL_CONTAINER_ID: 'main-scroll',
}));

import { getScrollEl } from '@/utils/scrollContainer';
import {
  usePreserveScroll,
  getScrollRatio,
  saveScrollPosition,
  markFlowReset,
  getLastCalculateRoute,
  updateLastCalculateRoute,
} from '@/hooks/usePreserveScroll';

const mockGetScrollEl = vi.mocked(getScrollEl);

function makeScrollEl(scrollTop = 0, scrollHeight = 1000, clientHeight = 500) {
  const el = {
    scrollTop,
    scrollHeight,
    clientHeight,
    scrollTo: vi.fn(),
  };
  return el as unknown as HTMLElement;
}

function wrapWithRouter(pathname: string, state?: Record<string, unknown>) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(MemoryRouter, { initialEntries: [{ pathname, state }] }, children);
}

// Use unique pathnames per test to avoid cross-test visitedRoutes contamination.
// Counter ensures each test gets a fresh route that has never been visited.
let routeCounter = 0;
function freshRoute() {
  return `/test-route-${++routeCounter}`;
}

describe('getScrollRatio', () => {
  beforeEach(() => {
    mockGetScrollEl.mockReturnValue(null);
  });

  it('returns 0 when scroll element is absent', () => {
    mockGetScrollEl.mockReturnValue(null);
    expect(getScrollRatio()).toBe(0);
  });

  it('returns 0 when page is not scrollable (maxScroll = 0)', () => {
    mockGetScrollEl.mockReturnValue(makeScrollEl(0, 500, 500));
    expect(getScrollRatio()).toBe(0);
  });

  it('returns correct ratio at top', () => {
    mockGetScrollEl.mockReturnValue(makeScrollEl(0, 1000, 500));
    expect(getScrollRatio()).toBe(0);
  });

  it('returns correct ratio mid-page', () => {
    mockGetScrollEl.mockReturnValue(makeScrollEl(250, 1000, 500));
    expect(getScrollRatio()).toBe(0.5);
  });

  it('returns 1 at the bottom', () => {
    mockGetScrollEl.mockReturnValue(makeScrollEl(500, 1000, 500));
    expect(getScrollRatio()).toBe(1);
  });
});

describe('saveScrollPosition', () => {
  it('persists current scrollTop so the hook can restore it later', () => {
    const el = makeScrollEl(300, 1000, 500);
    mockGetScrollEl.mockReturnValue(el);

    saveScrollPosition('/some-page');

    // Verify by rendering the hook on a "second visit" to that page.
    // The hook should call scrollTo with the saved value (300).
    const restoreEl = makeScrollEl(0, 1000, 500);
    mockGetScrollEl.mockReturnValue(restoreEl);

    renderHook(() => usePreserveScroll(), {
      wrapper: wrapWithRouter('/some-page'),
    });

    // Second render so it's treated as a revisit.
    renderHook(() => usePreserveScroll(), {
      wrapper: wrapWithRouter('/some-page'),
    });

    expect(restoreEl.scrollTo).toHaveBeenCalledWith(0, 300);
  });

  it('falls back to 0 when no scrollTop is readable', () => {
    mockGetScrollEl.mockReturnValue(null);
    // Should not throw.
    expect(() => saveScrollPosition('/missing')).not.toThrow();
  });
});

describe('markFlowReset', () => {
  it('resets _lastCalculateRoute to /calculate', () => {
    updateLastCalculateRoute('/calculate/cash');
    expect(getLastCalculateRoute()).toBe('/calculate/cash');

    markFlowReset();
    expect(getLastCalculateRoute()).toBe('/calculate');
  });
});

describe('updateLastCalculateRoute / getLastCalculateRoute', () => {
  it('stores and retrieves the last calculate route', () => {
    updateLastCalculateRoute('/calculate/employees');
    expect(getLastCalculateRoute()).toBe('/calculate/employees');
  });

  it('does not update when value is unchanged', () => {
    updateLastCalculateRoute('/calculate/summary');
    updateLastCalculateRoute('/calculate/summary');
    expect(getLastCalculateRoute()).toBe('/calculate/summary');
  });
});

describe('usePreserveScroll hook', () => {
  beforeEach(() => {
    mockGetScrollEl.mockReturnValue(null);
  });

  it('scrolls to top on first visit', () => {
    const el = makeScrollEl(400, 1000, 500);
    mockGetScrollEl.mockReturnValue(el);
    const route = freshRoute();

    renderHook(() => usePreserveScroll(), { wrapper: wrapWithRouter(route) });

    expect(el.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('restores scroll from scrollRatio state on revisit', () => {
    const route = freshRoute();
    const el = makeScrollEl(0, 1000, 500);
    mockGetScrollEl.mockReturnValue(el);

    // First visit — marks the route as visited.
    renderHook(() => usePreserveScroll(), { wrapper: wrapWithRouter(route) });

    // Second visit with scrollRatio 0.6 → should restore to 300px (0.6 * 500).
    renderHook(() => usePreserveScroll(), {
      wrapper: wrapWithRouter(route, { scrollRatio: 0.6 }),
    });

    expect(el.scrollTo).toHaveBeenCalledWith(0, 300);
  });

  it('uses savedScrollPositions when revisiting without scrollRatio state', () => {
    const route = freshRoute();
    const el = makeScrollEl(150, 1000, 500);
    mockGetScrollEl.mockReturnValue(el);

    saveScrollPosition(route);

    // First visit.
    renderHook(() => usePreserveScroll(), { wrapper: wrapWithRouter(route) });

    // Revisit without state → should restore from savedScrollPositions.
    renderHook(() => usePreserveScroll(), { wrapper: wrapWithRouter(route) });

    expect(el.scrollTo).toHaveBeenCalledWith(0, 150);
  });

  it('treats isBack flag as a revisit even on first navigation to the route', () => {
    const route = freshRoute();
    const el = makeScrollEl(0, 1000, 500);
    mockGetScrollEl.mockReturnValue(el);

    // isBack: true + scrollRatio should restore the ratio, not scroll to top.
    renderHook(() => usePreserveScroll(), {
      wrapper: wrapWithRouter(route, { isBack: true, scrollRatio: 0.4 }),
    });

    // 0.4 × 500 maxScroll = 200
    expect(el.scrollTo).toHaveBeenCalledWith(0, 200);
  });

  it('does nothing when scroll element is absent', () => {
    mockGetScrollEl.mockReturnValue(null);
    const route = freshRoute();

    // First visit with null element — mark as visited.
    renderHook(() => usePreserveScroll(), { wrapper: wrapWithRouter(route) });

    // Should not throw on revisit either.
    expect(() =>
      renderHook(() => usePreserveScroll(), {
        wrapper: wrapWithRouter(route, { scrollRatio: 0.5 }),
      }),
    ).not.toThrow();
  });
});
