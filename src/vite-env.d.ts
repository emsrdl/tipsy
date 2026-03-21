/// <reference types="vite/client" />

/**
 * Type declarations for Vite environment variables.
 * All VITE_* variables are available via import.meta.env.
 *
 * @see src/config/env.ts for validated, typed exports of these values
 */
interface ImportMetaEnv {
  /** Full domain where the app is deployed. Required. */
  readonly VITE_APP_DOMAIN: string
  /** App display name. Optional, defaults to "Tipsy". */
  readonly VITE_APP_NAME?: string
  /** Initial theme. Optional, defaults to "tipsy". */
  readonly VITE_DEFAULT_THEME?: string
  /** Initial locale. Optional, defaults to "de". */
  readonly VITE_DEFAULT_LANG?: string
  /** OIDC provider URL. Optional, auth not active in v1. */
  readonly VITE_OIDC_AUTHORITY?: string
  /** OIDC client ID. Optional, auth not active in v1. */
  readonly VITE_OIDC_CLIENT_ID?: string
  /** OIDC redirect URI. Optional, auth not active in v1. */
  readonly VITE_OIDC_REDIRECT_URI?: string
  /** OIDC scope string. Optional, auth not active in v1. */
  readonly VITE_OIDC_SCOPE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
