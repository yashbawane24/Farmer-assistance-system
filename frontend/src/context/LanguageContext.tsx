import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import i18n from 'i18next';

export type Language = 'en' | 'hi' | 'ta' | 'mr';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// Maps legacy flat translation keys to the new structured translation keys
const legacyKeyMap: Record<string, string> = {
  'brandName': 'common.brandName',
  'dashboard': 'common.dashboard',
  'weather': 'common.weather',
  'weatherDetails': 'common.weather',
  'recommendation': 'common.recommendation',
  'diseaseDetection': 'common.diseaseDetection',
  'marketPrices': 'common.marketPrices',
  'schemes': 'common.schemes',
  'helpCenterTitle': 'helpCenter.title',
  'todayAdvisory': 'dashboard.todayAdvisory',
  'welcomeBack': 'dashboard.welcome',
  'logout': 'common.logout',
  'signIn': 'common.signIn',
  'createAccount': 'common.createAccount',
  'forgotPasswordLabel': 'common.forgotPasswordLabel',
  'rememberMe': 'common.rememberMe',
  'confirmPassword': 'common.confirmPassword',
  'soilTypeLabel': 'common.soilTypeLabel',
  'primaryCropLabel': 'common.primaryCropLabel',
  'preferredLanguage': 'common.preferredLanguage',
  'stateLabel': 'common.stateLabel',
  'districtLabel': 'common.districtLabel',
  'villageLabel': 'common.villageLabel',
  'farmSizeLabel': 'common.farmSizeLabel',
  'verification': 'common.verification',
  'back': 'common.back',
  'irrigationOk': 'weather.suitableIrrigation',
  'harvestOk': 'weather.suitableHarvest',
  'sprayAvoid': 'weather.avoidSpray'
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('farmer_language');
    return (saved as Language) || 'en';
  });

  // Keep i18n language in sync with state on mount
  useEffect(() => {
    i18n.changeLanguage(language);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    // Change language synchronously so it's ready when the React state update triggers a re-render
    i18n.changeLanguage(lang);
    setLanguageState(lang);
    localStorage.setItem('farmer_language', lang);
  }, []);

  const t = useCallback((key: string, options?: any): string => {
    const resolvedKey = legacyKeyMap[key] || key;
    const result = i18n.t(resolvedKey, options);
    
    if (typeof result === 'string') {
      return result;
    }
    
    // In case it resolved to an object or undefined, try English fallback explicitly
    const enResult = i18n.t(resolvedKey, { ...options, lng: 'en' });
    if (typeof enResult === 'string') {
      return enResult;
    }
    
    // Fallback safely to key name rather than crashing with an object
    return key;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
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
