import React, { createContext, useContext, useEffect, useState } from "react";

import en from "../translations/en";
import kn from "../translations/kn";
import hi from "../translations/hi";
import te from "../translations/te";
import ta from "../translations/ta";
import ml from "../translations/ml";
import mr from "../translations/mr";
import bn from "../translations/bn";
import productTranslations from "../translations/product";

const translations = { en, kn, hi, te, ta, ml, mr, bn };

const languageNames = {
  en: "English",
  kn: "ಕನ್ನಡ",
  hi: "हिन्दी",
  te: "తెలుగు",
  ta: "தமிழ்",
  ml: "മലയാളം",
  mr: "मराठी",
  bn: "বাংলা",
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("tomato-ai-language");
    return saved && translations[saved] ? saved : "en";
  });
  const [mode, setMode] = useState(() => localStorage.getItem("tomato-ai-mode") || "farmer");

  useEffect(() => {
    localStorage.setItem("tomato-ai-language", language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem("tomato-ai-mode", mode);
  }, [mode]);

  const changeLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage);
    }
  };

  const t = (key, fallback) => {
    const keys = key.split(".");
    let value = keys[0] === "ui" ? productTranslations[language] : translations[language];

    for (const item of (keys[0] === "ui" ? keys.slice(1) : keys)) {
      value = value?.[item];
    }

    if (value === undefined) {
      value = keys[0] === "ui" ? productTranslations.en : translations.en;
      for (const item of (keys[0] === "ui" ? keys.slice(1) : keys)) {
        value = value?.[item];
      }
    }

    return value || fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        t,
        languageNames,
        languages: Object.keys(translations),
        mode,
        changeMode: (newMode) => {
          if (newMode === "farmer" || newMode === "research") setMode(newMode);
        },
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
};

export default LanguageContext;