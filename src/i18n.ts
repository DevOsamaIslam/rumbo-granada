import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

// the translations
import enTranslation from '../locales/en/translation.json';
import esTranslation from '../locales/es/translation.json';

/**
 * Device language: `'es'` when the device is set to Spanish, `'en'` otherwise.
 * Used as the initial language when the user has never chosen one in settings.
 */
export function getDeviceLanguage(): 'es' | 'en' {
  try {
    return getLocales()[0]?.languageCode === 'es' ? 'es' : 'en';
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
    },
    debug: __DEV__,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;