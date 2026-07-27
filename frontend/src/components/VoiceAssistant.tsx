import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';

const VoiceAssistant: React.FC = () => {
  const { language, t } = useLanguage();
  const { readTextAloud, stopReading, isReading } = useAccessibility();
  const navigate = useNavigate();

  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [voiceText, setVoiceText] = useState('');

  useEffect(() => {
    // Check SpeechRecognition compatibility
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      // Set language codes
      if (language === 'hi') rec.lang = 'hi-IN';
      else if (language === 'ta') rec.lang = 'ta-IN';
      else if (language === 'mr') rec.lang = 'mr-IN';
      else rec.lang = 'en-IN';

      rec.onstart = () => {
        setIsListening(true);
        setVoiceText(t('voice.listening'));
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setVoiceText(`"${transcript}"`);
        handleVoiceCommand(transcript);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setVoiceText(t('voice.error'));
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [language]);

  const handleVoiceCommand = (command: string) => {
    // Multilingual Commands
    if (command.includes('weather') || command.includes('forecast') || command.includes('मौसम') || command.includes('வானிலை') || command.includes('हवामान')) {
      readTextAloud(t('voice.weather'));
      navigate('/weather');
    } 
    else if (command.includes('recommend') || command.includes('crop') || command.includes('सलाहकार') || command.includes('ஆலோசகர்') || command.includes('पीक सल्ला')) {
      readTextAloud(t('voice.crop'));
      navigate('/recommendation');
    }
    else if (command.includes('disease') || command.includes('scan') || command.includes('बीमारी') || command.includes('நோய்') || command.includes('रोग')) {
      readTextAloud(t('voice.disease'));
      navigate('/disease-detection');
    }
    else if (command.includes('price') || command.includes('mandi') || command.includes('दर') || command.includes('விலை') || command.includes('भाव')) {
      readTextAloud(t('voice.mandi'));
      navigate('/market-prices');
    }
    else if (command.includes('scheme') || command.includes('yojana') || command.includes('योजना') || command.includes('திட்டம்')) {
      readTextAloud(t('voice.scheme'));
      navigate('/schemes');
    }
    else if (command.includes('dashboard') || command.includes('home') || command.includes('घर') || command.includes('முகப்பு')) {
      readTextAloud(t('voice.dashboard'));
      navigate('/dashboard');
    }
    else if (command.includes('profile') || command.includes('खाता') || command.includes('சுயவிவரம்')) {
      readTextAloud(t('voice.profile'));
      navigate('/profile');
    }
    else if (command.includes('stop') || command.includes('शांत') || command.includes('நிறுத்து') || command.includes('थांब')) {
      stopReading();
      setVoiceText(t('voice.stop'));
    }
    else {
      readTextAloud(t('voice.unrecognized'));
      setVoiceText(t('voice.unrecognized'));
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      alert(t('voice.unsupported'));
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      stopReading(); // Stop any ongoing text-to-speech reads
      recognition.start();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {voiceText && (
        <div className="glass-panel max-w-xs rounded-xl px-4 py-2 text-xs font-semibold shadow-md dark:text-slate-200 animate-fade-in transition-all">
          {voiceText}
        </div>
      )}
      
      <div className="flex gap-2">
        {/* Toggle Reading Stop Button */}
        {isReading && (
          <button
            onClick={stopReading}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            title="Stop Text-to-Speech"
          >
            <VolumeX className="h-5 w-5" />
          </button>
        )}

        {/* Primary Microphone Float Button */}
        <button
          onClick={toggleListening}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
            isListening 
              ? 'bg-red-500 text-white voice-pulse-btn' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600'
          }`}
          title="Voice Assistant (Talk to me)"
        >
          {isListening ? <Mic className="h-6 w-6 animate-pulse" /> : <MicOff className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
};

export default VoiceAssistant;
