// Layout-direction helpers for right-to-left languages.
//
// React Native mirrors `flexDirection: 'row'`, `start`/`end` styles and text
// alignment automatically once the native layout direction is RTL. Changing
// that direction is a native/global setting, so it takes effect after the app
// reloads; `applyLayoutDirection` reports whether a reload is needed.
import { I18nManager } from 'react-native';

/** Language bases that are written right-to-left. */
export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'] as const;

/** True when the language tag belongs to a right-to-left script. */
export function isRtlLanguage(language: string | null | undefined): boolean {
  if (!language) return false;
  const base = language.toLowerCase().split('-')[0];
  return (RTL_LANGUAGES as readonly string[]).includes(base);
}

export interface LayoutDirectionResult {
  /** Whether the language is RTL. */
  rtl: boolean;
  /** Whether the native layout direction had to change (a reload is needed). */
  changed: boolean;
}

/**
 * Allows RTL globally and forces the native layout direction to match
 * `language`. Returns `changed: true` when the app must restart to apply it.
 */
export function applyLayoutDirection(language: string): LayoutDirectionResult {
  const rtl = isRtlLanguage(language);
  // Must be enabled once so `forceRTL` is honoured on both platforms.
  I18nManager.allowRTL(true);
  const changed = I18nManager.isRTL !== rtl;
  if (changed) {
    I18nManager.forceRTL(rtl);
  }
  return { rtl, changed };
}
