export const SCROLL_CONTAINER_ID = 'main-scroll';

export function getScrollEl(): HTMLElement | null {
  return document.getElementById(SCROLL_CONTAINER_ID);
}
