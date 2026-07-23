import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';

const VoiceAssistant: React.FC = () => {
  const { language } = useLanguage();
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
        setVoiceText('Listening...');
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setVoiceText(`You said: "${transcript}"`);
        handleVoiceCommand(transcript);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setVoiceText('Error listening. Try again.');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [language]);

  const handleVoiceCommand = (command: string) => {
    // English Commands
    if (command.includes('weather') || command.includes('forecast') || command.includes('मौसम') || command.includes('வானிலை') || command.includes('हवामान')) {
      readTextAloud('Opening weather details page. Loading current forecast...');
      navigate('/weather');
    } 
    else if (command.includes('recommend') || command.includes('crop') || command.includes('सलाहकार') || command.includes('ஆலோசகர்') || command.includes('पीक सल्ला')) {
      readTextAloud('Opening crop advisor page. You can input your soil and season to get recommendations.');
      navigate('/recommendation');
    }
    else if (command.includes('disease') || command.includes('scan') || command.includes('बीमारी') || command.includes('நோய்') || command.includes('रोग')) {
      readTextAloud('Opening crop disease detection page. You can upload an image here to scan for crop diseases.');
      navigate('/disease-detection');
    }
    else if (command.includes('price') || command.includes('mandi') || command.includes('दर') || command.includes('விலை') || command.includes('भाव')) {
      readTextAloud('Opening market prices page. Loading today\'s crop rates.');
      navigate('/market-prices');
    }
    else if (command.includes('scheme') || command.includes('yojana') || command.includes('योजना') || command.includes('திட்டம்')) {
      readTextAloud('Opening government schemes page. Viewing latest agricultural schemes.');
      navigate('/schemes');
    }
    else if (command.includes('dashboard') || command.includes('home') || command.includes('घर') || command.includes('முகப்பு')) {
      readTextAloud('Navigating back to farmer dashboard.');
      navigate('/dashboard');
    }
    else if (command.includes('profile') || command.includes('खाता') || command.includes('சுயவிவரம்')) {
      readTextAloud('Opening your profile settings.');
      navigate('/profile');
    }
    else if (command.includes('stop') || command.includes('शांत') || command.includes('நிறுத்து') || command.includes('थांब')) {
      stopReading();
      setVoiceText('Voice read stopped.');
    }
    else {
      readTextAloud('Command not recognized. Try saying "weather", "mandi prices", "crop advisor", or "government schemes".');
      setVoiceText(`Unrecognized: "${command}"`);
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
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
              : 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600'
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
