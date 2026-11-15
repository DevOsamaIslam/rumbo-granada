import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// the translations
import enTranslation from '../locales/en/translation.json';
import esTranslation from '../locales/es/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    lng: 'en',
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