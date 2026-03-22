/**
 * @file src/context/AuthContext.tsx
 * @description Authentication context — prepared for v2, noop in v1.
 *
 * In v1, this context always reports the user as unauthenticated.
 * Authentication is not required to use the app.
 *
 * To activate in a future version:
 *   1. Install oidc-client-ts and react-oidc-context
 *   2. Replace the noop provider with a real OIDC provider
 *   3. Uncomment the getOidcConfig() usage below
 *
 * @see src/config/auth.ts for getOidcConfig()
 * @see src/config/env.ts for isAuthConfigured()
 *
 * @example
 * <AuthProvider><App /></AuthProvider>
 */

import { createContext, useContext, type ReactNode } from 'react';

export interface AuthContextValue {
  /** Whether the user is authenticated. Always false in v1. */
  isAuthenticated: boolean;
  /** The authenticated user's name, or null. Always null in v1. */
  userName: string | null;
  /** Trigger login flow. Noop in v1. */
  login: () => void;
  /** Trigger logout flow. Noop in v1. */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  userName: null,
  login: () => undefined,
  logout: () => undefined,
});

/**
 * Auth provider stub. In v1 this provides unauthenticated state only.
 * Replace the internals in a future version when OIDC is activated.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // v1: always unauthenticated. Auth activation: replace this with real OIDC logic.
  const value: AuthContextValue = {
    isAuthenticated: false,
    userName: null,
    login: () => undefined,
    logout: () => undefined,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
