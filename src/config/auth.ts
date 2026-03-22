/**
 * @file src/config/auth.ts
 * @description OpenID Connect configuration (prepared for v2, inactive in v1).
 *
 * getOidcConfig() assembles an OIDC config object shaped for oidc-client-ts.
 * Returns null when auth is not configured (which is always the case in v1).
 *
 * To activate auth in a future version:
 *   1. Set all four VITE_OIDC_* environment variables
 *   2. Call getOidcConfig() from AuthContext and pass to UserManager
 *   3. Remove the "not active" guard from AuthContext
 *
 * @see src/config/env.ts for isAuthConfigured() and OIDC variable access
 * @see src/context/AuthContext.tsx for the React context (noop in v1)
 *
 * @example
 * import { getOidcConfig } from '@/config/auth'
 * const config = getOidcConfig() // null in v1
 */

import { env, isAuthConfigured } from '@/config/env';

/**
 * OIDC configuration shaped for oidc-client-ts UserManager.
 *
 * @property authority - The OIDC provider URL
 * @property client_id - The registered client ID
 * @property redirect_uri - URI to redirect to after login
 * @property scope - Space-separated OIDC scopes
 * @property response_type - Always "code" (PKCE flow)
 */
export interface OidcConfig {
  authority: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  response_type: 'code';
}

/**
 * Returns the OIDC configuration if auth is configured, otherwise null.
 * In v1 this always returns null.
 *
 * @returns OidcConfig | null
 *
 * @example
 * const config = getOidcConfig()
 * if (config) {
 *   const userManager = new UserManager(config)
 * }
 */
export function getOidcConfig(): OidcConfig | null {
  if (!isAuthConfigured()) return null;

  // These are guaranteed non-undefined when isAuthConfigured() is true
  return {
    authority: env.OIDC_AUTHORITY as string,
    client_id: env.OIDC_CLIENT_ID as string,
    redirect_uri: env.OIDC_REDIRECT_URI as string,
    scope: env.OIDC_SCOPE as string,
    response_type: 'code',
  };
}
