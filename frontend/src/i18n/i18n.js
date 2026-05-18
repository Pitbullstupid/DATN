import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HOME_EN from "../locales/en/home.json";
import HOME_VI from "../locales/vi/home.json";
import COMMON_EN from "../locales/en/common.json";
import COMMON_VI from "../locales/vi/common.json";
import TOAST_EN from "../locales/en/toast.json";
import TOAST_VI from "../locales/vi/toast.json";
import TUTORS_EN from "../locales/en/tutors.json";
import TUTORS_VI from "../locales/vi/tutors.json";
import BOOKINGS_EN from "../locales/en/bookings.json";
import BOOKINGS_VI from "../locales/vi/bookings.json";
import DASHBOARD_EN from "../locales/en/dashboard.json";
import DASHBOARD_VI from "../locales/vi/dashboard.json";
import PROFILE_EN from "../locales/en/profile.json";
import PROFILE_VI from "../locales/vi/profile.json";
import COURSES_EN from "../locales/en/courses.json";
import COURSES_VI from "../locales/vi/courses.json";

const resources = {
  en: {
    home: HOME_EN,
    common: COMMON_EN,
    toast: TOAST_EN,
    tutors: TUTORS_EN,
    bookings: BOOKINGS_EN,
    dashboard: DASHBOARD_EN,
    profile: PROFILE_EN,
    courses: COURSES_EN,
  },
  vi: {
    home: HOME_VI,
    common: COMMON_VI,
    toast: TOAST_VI,
    tutors: TUTORS_VI,
    bookings: BOOKINGS_VI,
    dashboard: DASHBOARD_VI,
    profile: PROFILE_VI,
    courses: COURSES_VI,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  ns: ["home", "common", "toast", "tutors", "bookings", "dashboard", "profile", "courses"],
  defaultNS: "home",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
