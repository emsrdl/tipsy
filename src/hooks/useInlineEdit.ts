/**
 * @file src/hooks/useInlineEdit.ts
 * @description Manages the edit/display toggle for an inline number input.
 *
 * Handles the blur-on-unmount race: both Escape (cancel) and Enter (commit)
 * set a guard ref before triggering the re-render that unmounts the input,
 * so the `onBlur` that the browser fires on unmount is safely ignored.
 *
 * Returns `inputProps` to spread directly onto a `<input type="number">` and
 * a `startEdit(initialDraft)` function to open the edit mode.
 *
 * @example
 * const { editing, startEdit, inputProps } = useInlineEdit((draft) => {
 *   const n = parseInt(draft, 10);
 *   if (!isNaN(n)) onChange(n);
 * });
 *
 * {editing
 *   ? <input type="number" {...inputProps} />
 *   : <button onClick={() => startEdit(String(value))}>{value}</button>}
 */

import { useRef, useState } from 'react';
import type { ChangeEvent, FocusEvent, KeyboardEvent } from 'react';

export interface InlineEditInputProps {
  autoFocus: true;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onFocus: (e: FocusEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}

export interface UseInlineEditResult {
  /** Whether the inline input is currently active. */
  editing: boolean;
  /** Opens the inline input with the given initial string. */
  startEdit: (initialDraft: string) => void;
  /** Spread onto the `<input>` element. */
  inputProps: InlineEditInputProps;
}

/**
 * Toggle between a display value and an inline `<input>` with correct
 * Escape / Enter / blur behaviour.
 *
 * @param onCommit - called with the raw draft string when the user confirms.
 *   Parsing and validation belong in the caller.
 */
export function useInlineEdit(onCommit: (draft: string) => void): UseInlineEditResult {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;
  const draftRef = useRef(draft);
  draftRef.current = draft;

  // Escape sets escapedRef before setEditing(false) so the blur that fires on
  // unmount is ignored. Enter sets committedRef for the same reason.
  const escapedRef = useRef(false);
  const committedRef = useRef(false);

  function startEdit(initialDraft: string) {
    escapedRef.current = false;
    committedRef.current = false;
    setDraft(initialDraft);
    setEditing(true);
  }

  function commit() {
    if (escapedRef.current || committedRef.current) return;
    committedRef.current = true;
    onCommitRef.current(draftRef.current);
    setEditing(false);
  }

  function cancel() {
    escapedRef.current = true;
    setEditing(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { commit(); return; }
    if (e.key === 'Escape') cancel();
  }

  return {
    editing,
    startEdit,
    inputProps: {
      autoFocus: true,
      value: draft,
      onChange: (e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value),
      onFocus: (e: FocusEvent<HTMLInputElement>) => e.target.select(),
      onBlur: commit,
      onKeyDown: handleKeyDown,
    },
  };
}
