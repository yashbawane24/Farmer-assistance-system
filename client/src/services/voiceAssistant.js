// Web Speech API Voice Recognition and SpeechSynthesis Controller

export class VoiceAssistant {
  static isSpeechSupported() {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  static isSynthesisSupported() {
    return 'speechSynthesis' in window;
  }

  /**
   * Listen to microphone and convert speech to text
   */
  static startListening({ onResult, onError, onEnd, lang = 'en-IN' }) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (onError) onError('Speech recognition is not supported in this browser. You can type your question.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    // Language code map
    const langMap = {
      en: 'en-IN',
      hi: 'hi-IN',
      mr: 'mr-IN'
    };
    recognition.lang = langMap[lang] || 'en-IN';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (onResult) {
        onResult({ finalTranscript: final, interimTranscript: interim });
      }
    };

    recognition.onerror = (event) => {
      if (onError) onError(event.error);
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    try {
      recognition.start();
      return recognition;
    } catch (e) {
      if (onError) onError(e.message);
      return null;
    }
  }

  /**
   * Speak text aloud using browser SpeechSynthesis
   */
  static speak(text, lang = 'en', onComplete = null) {
    if (!this.isSynthesisSupported()) return;

    window.speechSynthesis.cancel(); // Stop any active speech

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate voice/language
    if (lang === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (lang === 'mr') {
      utterance.lang = 'mr-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.rate = 0.92; // Slightly slower for clear agricultural comprehension
    utterance.pitch = 1.0;

    if (onComplete) {
      utterance.onend = onComplete;
      utterance.onerror = onComplete;
    }

    window.speechSynthesis.speak(utterance);
  }

  static stopSpeaking() {
    if (this.isSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  }
}
