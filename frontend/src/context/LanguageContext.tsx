import React, { createContext, useState, useContext, useEffect } from 'react';
import i18n from 'i18next';

export type Language = 'en' | 'hi' | 'ta' | 'mr';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('farmer_language');
    return (saved as Language) || 'en';
  });

  // Keep i18n language in sync with state
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('farmer_language', lang);
  };

  const t = (key: string, options?: any): string => {
    // If the key has dots (like nesting), i18next supports it. 
    // To support flat lookups or fallback, we call i18n.t
    return (i18n.t(key, options) as string) || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
