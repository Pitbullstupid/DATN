import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HOME_EN from "../locales/en/home.json";
import HOME_VI from "../locales/vi/home.json";

const resources = {
  en: {
    home: HOME_EN,
  },
  // Add more languages here
  vi: {
    home: HOME_VI,
  },
};
i18n.use(initReactI18next).init({
  resources,
  lng: "en", // default language
  ns: ['home'],
  defaultNS: 'home',
  fallbackLng: "vi",
  interpolation: {
    escapeValue: false,
  },
});
