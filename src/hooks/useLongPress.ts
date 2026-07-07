/**
 * @file src/hooks/useLongPress.ts
 * @description Distinguishes a sustained pointer press from a normal click.
 *
 * When the hold duration elapses, `onLongPress` fires and the subsequent
 * `click` event is suppressed so `onPress` does not also run. Short presses
 * call `onPress` normally. The `pressing` boolean is `true` while the hold is
 * charging — use it for visual feedback.
 *
 * Returns spread-ready handlers for a `<button>` and a `pressing` flag.
 *
 * @example
 * const { handlers, pressing } = useLongPress(decrement, resetToMin);
 * <button {...handlers} className={pressing ? 'text-red-500' : ''} />
 */

import { useEffect, useRef, useState } from 'react';

export interface LongPressHandlers {
  onClick: () => void;
  onPointerDown: () => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
}

export interface UseLongPressResult {
  handlers: LongPressHandlers;
  /** True while the hold is charging (between pointerdown and the duration elapsing). */
  pressing: boolean;
}

/**
 * Distinguishes a long press from a normal click on a button element.
 *
 * @param onPress - called on a normal (short) click
 * @param onLongPress - called after `durationMs` of sustained pressing
 * @param durationMs - hold duration in ms before long press fires. @default 600
 */
export function useLongPress(
  onPress: () => void,
  onLongPress: () => void,
  durationMs = 600,
): UseLongPressResult {
  const [pressing, setPressing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedRef = useRef(false);

  // Keep callback refs current so closures never go stale.
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;
  const onLongPressRef = useRef(onLongPress);
  onLongPressRef.current = onLongPress;

  useEffect(
    () => () => { if (timerRef.current) clearTimeout(timerRef.current); },
    [],
  );

  function start() {
    longPressedRef.current = false;
    setPressing(true);
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true;
      setPressing(false);
      onLongPressRef.current();
    }, durationMs);
  }

  function cancel() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPressing(false);
  }

  function handleClick() {
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    onPressRef.current();
  }

  return {
    handlers: {
      onClick: handleClick,
      onPointerDown: start,
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
    },
    pressing,
  };
}
