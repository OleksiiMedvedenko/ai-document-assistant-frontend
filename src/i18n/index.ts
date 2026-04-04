import { en } from "@/i18n/resources/en";
import { pl } from "@/i18n/resources/pl";
import { ua } from "@/i18n/resources/ua";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pl: { translation: pl },
    ua: { translation: ua },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
