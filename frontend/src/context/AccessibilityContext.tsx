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
    let targetLang = 'en-IN';
    if (language === 'hi') targetLang = 'hi-IN';
    else if (language === 'ta') targetLang = 'ta-IN';
    else if (language === 'mr') targetLang = 'mr-IN';

    utterance.lang = targetLang;

    // Explicitly query and bind browser TTS voice
    if (window.speechSynthesis.getVoices) {
      const voices = window.speechSynthesis.getVoices();
      
      // Look for exact match (e.g. hi-IN)
      let selectedVoice = voices.find(v => v.lang === targetLang || v.lang.replace('_', '-') === targetLang);
      
      // Fallback: match language code prefix (e.g., 'hi' or 'ta')
      if (!selectedVoice) {
        const prefix = targetLang.split('-')[0];
        selectedVoice = voices.find(v => v.lang.startsWith(prefix));
      }

      // Fallback: warn and fallback to any english voice
      if (!selectedVoice && language !== 'en') {
        console.warn(`Voice for ${targetLang} is not installed on this browser. Falling back to default voice.`);
        selectedVoice = voices.find(v => v.lang.startsWith('en'));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utterance.rate = 0.95; // Slightly slower for clarity
    
    utterance.onstart = () => setIsReading(true);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      setIsReading(false);
    };

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
