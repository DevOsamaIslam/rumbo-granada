import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

// the translations
import enTranslation from '../locales/en/translation.json';
import esTranslation from '../locales/es/translation.json';
import arTranslation from '../locales/ar/translation.json';

export type AppLanguage = 'es' | 'en' | 'ar';

/**
 * Device language: `'es'` for Spanish, `'ar'` for Arabic, otherwise `'en'`.
 * Used as the initial language when the user has never chosen one in settings.
 */
export function getDeviceLanguage(): AppLanguage {
  try {
    const code = getLocales()[0]?.languageCode;
    if (code === 'es') return 'es';
    if (code === 'ar') return 'ar';
    return 'en';
  } catch {
    return 'en';
  }
}

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    // Initial language from the device; `app/_layout.tsx` overrides it with
    // the user's persisted choice from the settings store right after mount.
    lng: getDeviceLanguage(),
    fallbackLng: 'en',
    resources: {
      en: {
        translation: enTranslation,
      },
      es: {
        translation: esTranslation,
      },
      ar: {
        translation: arTranslation,
      },
    },
    debug: __DEV__,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;