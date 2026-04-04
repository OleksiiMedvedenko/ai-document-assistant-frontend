import { en } from "@/i18n/resources/en";
import { pl } from "@/i18n/resources/pl";
import { ua } from "@/i18n/resources/ua";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const savedLanguage = localStorage.getItem("app-language");
const initialLanguage =
  savedLanguage === "en" || savedLanguage === "pl" || savedLanguage === "ua"
    ? savedLanguage
    : "en";

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pl: { translation: pl },
    ua: { translation: ua },
  },
  lng: initialLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (language) => {
  localStorage.setItem("app-language", language);
});

export default i18n;
