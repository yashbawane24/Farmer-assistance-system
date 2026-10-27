// Web Speech API Voice Recognition and SpeechSynthesis Controller

export class VoiceAssistant {
  static isSpeechSupported() {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  static isSynthesisSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Listen to microphone and convert speech to text
   */
  static startListening({ onResult, onError, onEnd, lang = 'en-IN' }) {
    if (typeof window === 'undefined') return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (onError) onError('unsupported');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Language code map (en -> en-IN, hi -> hi-IN, mr -> mr-IN)
    const langMap = {
      en: 'en-IN',
      hi: 'hi-IN',
      mr: 'mr-IN'
    };
    recognition.lang = langMap[lang] || lang || 'en-IN';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      // Build full transcript across ALL results (loop from 0 to results.length)
      for (let i = 0; i < event.results.length; ++i) {
        const item = event.results[i];
        if (!item || !item[0]) continue;
        const piece = item[0].transcript || '';
        if (item.isFinal) {
          final += (final ? ' ' : '') + piece;
        } else {
          interim += (interim ? ' ' : '') + piece;
        }
      }

      const currentTranscript = (final + (interim ? ' ' + interim : '')).trim();

      if (onResult) {
        const lastResult = event.results[event.results.length - 1];
        const isFinal = Boolean(lastResult?.isFinal && final.trim().length > 0);
        onResult({
          finalTranscript: final.trim(),
          interimTranscript: interim.trim(),
          currentTranscript,
          isFinal
        });
      }
    };

    recognition.onerror = (event) => {
      const errCode = event.error || (typeof event === 'string' ? event : 'unknown');
      if (onError) onError(errCode);
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    try {
      recognition.start();
      return recognition;
    } catch (e) {
      if (onError) onError(e.error || e.name || e.message);
      return null;
    }
  }

  // Queue for streaming sentence-by-sentence playback
  static queue = [];
  static isQueueSpeaking = false;
  static currentLanguage = 'en';

  /**
   * Speak text aloud using browser SpeechSynthesis
   */
  static speak(text, lang = 'en', onComplete = null) {
    if (!this.isSynthesisSupported()) return;

    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate voice/language
    if (lang === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (lang === 'mr') {
      utterance.lang = 'mr-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.rate = 0.94; // Optimized rate for clear agricultural comprehension
    utterance.pitch = 1.0;

    if (onComplete) {
      utterance.onend = onComplete;
      utterance.onerror = onComplete;
    }

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Enqueues sentences as they arrive from streaming and begins speaking immediately
   */
  static enqueueSentence(sentence, lang = 'en', onStartFirst = null) {
    if (!this.isSynthesisSupported()) return;
    const clean = String(sentence || '').trim();
    if (!clean) return;

    this.currentLanguage = lang;
    this.queue.push({ text: clean, onStartFirst });

    if (!this.isQueueSpeaking) {
      this.playNextInQueue();
    }
  }

  static playNextInQueue() {
    if (!this.isSynthesisSupported() || this.queue.length === 0) {
      this.isQueueSpeaking = false;
      return;
    }

    this.isQueueSpeaking = true;
    const item = this.queue.shift();
    if (!item || !item.text) {
      this.playNextInQueue();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(item.text);
    const langMap = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
    utterance.lang = langMap[this.currentLanguage] || 'en-IN';
    utterance.rate = 0.94;
    utterance.pitch = 1.0;

    let started = false;
    utterance.onstart = () => {
      if (!started && item.onStartFirst) {
        started = true;
        item.onStartFirst();
      }
    };

    utterance.onend = () => {
      this.playNextInQueue();
    };

    utterance.onerror = () => {
      this.playNextInQueue();
    };

    window.speechSynthesis.speak(utterance);
  }

  static stopSpeaking() {
    this.queue = [];
    this.isQueueSpeaking = false;
    if (this.isSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  }
}
