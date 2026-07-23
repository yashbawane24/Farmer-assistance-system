import React, { createContext, useState, useContext, useEffect } from 'react';
import { useLanguage } from './LanguageContext';

type FontSize = 'normal' | 'large' | 'xlarge';

interface AccessibilityContextProps {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
  readTextAloud: (text: string) => void;
  stopReading: () => void;
  isReading: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextProps | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('farmer_font_size') as FontSize) || 'normal';
  });
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('farmer_high_contrast') === 'true';
  });
  const [isReading, setIsReading] = useState(false);

  useEffect(() => {
    const body = window.document.body;
    // Clear scaling classes
    body.classList.remove('text-scale-normal', 'text-scale-large', 'text-scale-xlarge');
    body.classList.add(`text-scale-${fontSize}`);
    localStorage.setItem('farmer_font_size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    const body = window.document.body;
    if (highContrast) {
      body.classList.add('high-contrast-mode');
    } else {
      body.classList.remove('high-contrast-mode');
    }
    localStorage.setItem('farmer_high_contrast', String(highContrast));
  }, [highContrast]);

  const toggleHighContrast = () => setHighContrast(!highContrast);
  const setFontSize = (size: FontSize) => setFontSizeState(size);

  const readTextAloud = (text: string) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Terminate ongoing speech
    
    // Clean text by stripping HTML
    const cleanText = text.replace(/<[^>]*>/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Pick appropriate lang code matching active state
    if (language === 'hi') utterance.lang = 'hi-IN';
    else if (language === 'ta') utterance.lang = 'ta-IN';
    else if (language === 'mr') utterance.lang = 'mr-IN';
    else utterance.lang = 'en-IN';

    utterance.rate = 0.95; // Slightly slower for clarity
    
    utterance.onstart = () => setIsReading(true);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopReading = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsReading(false);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        highContrast,
        toggleHighContrast,
        readTextAloud,
        stopReading,
        isReading
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
