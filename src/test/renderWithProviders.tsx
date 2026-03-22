/**
 * @file src/test/renderWithProviders.tsx
 * @description Test utility: renders a component wrapped in all app providers.
 *
 * Use this instead of RTL's plain render() when testing organisms or screens
 * that depend on ThemeContext, TipSessionContext, or react-i18next.
 *
 * @see src/context/ThemeContext.tsx
 * @see src/context/TipSessionContext.tsx
 *
 * @example
 * import { renderWithProviders } from '@/test/renderWithProviders'
 * const { getByText } = renderWithProviders(<MyOrganism />)
 */

import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { TipSessionProvider } from '@/context/TipSessionContext';
import type { TipSession } from '@/types/session';
import { makeSession } from './factories';

interface ProvidersProps {
  children: ReactNode;
  initialSession: Partial<TipSession> | undefined;
}

function AllProviders({ children, initialSession }: ProvidersProps) {
  return (
    <MemoryRouter>
      <ThemeProvider>
        <TipSessionProvider initialSession={makeSession(initialSession)}>
          {children}
        </TipSessionProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  initialSession?: Partial<TipSession>;
}

/**
 * Renders a React element wrapped in all app context providers.
 *
 * @param ui - The component to render
 * @param options - RTL render options plus optional initialSession
 * @returns RTL render result
 *
 * @example
 * const { getByRole } = renderWithProviders(<HeaderBar />)
 */
export function renderWithProviders(
  ui: ReactElement,
  { initialSession, ...options }: RenderWithProvidersOptions = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialSession={initialSession}>{children}</AllProviders>
    ),
    ...options,
  });
}
