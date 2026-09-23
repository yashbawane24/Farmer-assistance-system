import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { VoiceAssistant } from '../services/voiceAssistant.js';

export function AudioSpeaker({ text, lang = 'en', label }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const defaultLabel = label !== undefined && label !== null && label !== ''
    ? label
    : (lang === 'mr' ? 'ऐका' : lang === 'hi' ? 'सुनें' : 'Listen');

  const stopLabel = lang === 'mr' ? 'थांबवा' : lang === 'hi' ? 'रोकें' : 'Stop';

  const handleToggle = () => {
    if (isPlaying) {
      VoiceAssistant.stopSpeaking();
      setIsPlaying(false);
    } else {
      if (!text) return;
      setIsPlaying(true);
      VoiceAssistant.speak(text, lang, () => {
        setIsPlaying(false);
      });
    }
  };

  return (
    <button
      type="button"
      className={`audio-speaker-btn ${isPlaying ? 'playing' : ''}`}
      onClick={handleToggle}
      aria-label={isPlaying ? stopLabel : defaultLabel}
      title={isPlaying ? stopLabel : (lang === 'mr' ? 'तुमच्या भाषेत ऐका' : lang === 'hi' ? 'अपनी भाषा में सुनें' : 'Read aloud in your language')}
    >
      {isPlaying ? <VolumeX size={15} /> : <Volume2 size={15} />}
      {defaultLabel && <span>{isPlaying ? stopLabel : defaultLabel}</span>}
    </button>
  );
}
