/**
 * @file src/config/storageKeys.ts
 * @description Single source of truth for localStorage keys used by the app.
 *
 * Keys are also referenced from the pre-paint boot script in index.html;
 * those references are templated at build time from this module via the
 * `tipsy:theme-palette` Vite plugin (see vite.config.ts).
 */

export const LS_THEME_KEY = 'tipsy-theme';
export const LS_ACCENT_KEY = 'tipsy-accent';
export const LS_MODE_KEY = 'tipsy-mode';
export const LS_LANG_KEY = 'tipsy-lang';
