/**
 * @file src/config/env.ts
 * @description Validated, typed environment configuration.
 *
 * Reads VITE_* variables from import.meta.env, validates them,
 * and exports a single typed `env` object. Components and hooks
 * should import from here rather than accessing import.meta.env directly.
 *
 * Throws at startup if VITE_APP_DOMAIN is missing — the app cannot
 * function without knowing its own domain.
 *
 * Auth is considered configured only when all four OIDC variables are set.
 * Partial OIDC configuration is ignored with a console warning.
 *
 * @see src/config/auth.ts for OpenID config assembly
 * @see src/vite-env.d.ts for TypeScript declarations of VITE_* variables
 *
 * @example
 * import { env, isAuthConfigured } from '@/config/env'
 * console.log(env.APP_DOMAIN)     // "tipsy.emsr.cc"
 * console.log(isAuthConfigured()) // false (v1)
 */

import type { ThemeId } from '@/types/theme';
import type { LocaleId } from '@/types/i18n';

/** Valid theme ids for type narrowing. */
const VALID_THEMES: ThemeId[] = ['tipsy', 'katzentempel'];
/** Valid locale ids for type narrowing. */
const VALID_LOCALES: LocaleId[] = ['de', 'en'];

function isThemeId(value: string): value is ThemeId {
  return (VALID_THEMES as string[]).includes(value);
}

function isLocaleId(value: string): value is LocaleId {
  return (VALID_LOCALES as string[]).includes(value);
}

/**
 * Validated environment configuration.
 * All properties are guaranteed to be correct types.
 */
export interface Env {
  /** Full deployment domain (e.g. "tipsy.emsr.cc"). */
  APP_DOMAIN: string;
  /** App display name. */
  APP_NAME: string;
  /** Initial theme. */
  DEFAULT_THEME: ThemeId;
  /** Initial locale. */
  DEFAULT_LANG: LocaleId;
  /** OIDC authority URL, or undefined if auth not configured. */
  OIDC_AUTHORITY: string | undefined;
  /** OIDC client ID, or undefined if auth not configured. */
  OIDC_CLIENT_ID: string | undefined;
  /** OIDC redirect URI, or undefined if auth not configured. */
  OIDC_REDIRECT_URI: string | undefined;
  /** OIDC scope string, or undefined if auth not configured. */
  OIDC_SCOPE: string | undefined;
}

function buildEnv(): Env {
  const domain = import.meta.env.VITE_APP_DOMAIN;
  if (!domain || domain.trim() === '') {
    throw new Error(
      '[Tipsy] VITE_APP_DOMAIN is required but not set. ' +
        'Copy .env.example to .env and set VITE_APP_DOMAIN.',
    );
  }

  const rawTheme = import.meta.env.VITE_DEFAULT_THEME ?? 'tipsy';
  const defaultTheme: ThemeId = isThemeId(rawTheme) ? rawTheme : 'tipsy';

  const rawLang = import.meta.env.VITE_DEFAULT_LANG ?? 'de';
  const defaultLang: LocaleId = isLocaleId(rawLang) ? rawLang : 'de';

  // Auth: only active when all four OIDC vars are present
  const oidcVars = {
    OIDC_AUTHORITY: import.meta.env.VITE_OIDC_AUTHORITY,
    OIDC_CLIENT_ID: import.meta.env.VITE_OIDC_CLIENT_ID,
    OIDC_REDIRECT_URI: import.meta.env.VITE_OIDC_REDIRECT_URI,
    OIDC_SCOPE: import.meta.env.VITE_OIDC_SCOPE,
  };
  const oidcDefined = Object.values(oidcVars).filter(Boolean);
  if (oidcDefined.length > 0 && oidcDefined.length < 4) {
    console.warn(
      '[Tipsy] Partial OIDC configuration detected — auth will not activate. ' +
        'All four VITE_OIDC_* variables must be set.',
    );
  }
  const authActive = oidcDefined.length === 4;

  return {
    APP_DOMAIN: domain,
    APP_NAME: import.meta.env.VITE_APP_NAME ?? 'Tipsy',
    DEFAULT_THEME: defaultTheme,
    DEFAULT_LANG: defaultLang,
    OIDC_AUTHORITY: authActive ? oidcVars.OIDC_AUTHORITY : undefined,
    OIDC_CLIENT_ID: authActive ? oidcVars.OIDC_CLIENT_ID : undefined,
    OIDC_REDIRECT_URI: authActive ? oidcVars.OIDC_REDIRECT_URI : undefined,
    OIDC_SCOPE: authActive ? oidcVars.OIDC_SCOPE : undefined,
  };
}

/**
 * Validated environment configuration singleton.
 * Throws at module load time if mandatory variables are missing.
 *
 * @example
 * import { env } from '@/config/env'
 * const appName = env.APP_NAME // "Tipsy"
 */
export const env: Env = buildEnv();

/**
 * Returns true when all four OIDC variables are present and valid.
 * Auth is not active in v1.
 *
 * @returns boolean
 *
 * @example
 * if (isAuthConfigured()) {
 *   // show login button
 * }
 */
export function isAuthConfigured(): boolean {
  return (
    env.OIDC_AUTHORITY !== undefined &&
    env.OIDC_CLIENT_ID !== undefined &&
    env.OIDC_REDIRECT_URI !== undefined &&
    env.OIDC_SCOPE !== undefined
  );
}
