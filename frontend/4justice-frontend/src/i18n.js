
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslation from "./locales/en/translation.json";
import svTranslation from "./locales/sv/translation.json";

const savedLanguage = localStorage.getItem("appeelLanguage") || "en";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation,
      },
      sv: {
        translation: svTranslation,
      },
    },
    lng: savedLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
