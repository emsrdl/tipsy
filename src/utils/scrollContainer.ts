/**
 * @file src/utils/scrollContainer.ts
 * Centralises the container ID so that both `usePreserveScroll` and any component
 * that needs to programmatically scroll share a single source of truth without
 * importing hook modules that carry global side effects.
 */

export const SCROLL_CONTAINER_ID = 'main-scroll';

export function getScrollEl(): HTMLElement | null {
  return document.getElementById(SCROLL_CONTAINER_ID);
}
