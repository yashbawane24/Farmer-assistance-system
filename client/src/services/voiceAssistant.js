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

  // Queue for streaming and long text playback
  static queue = [];
  static isQueueSpeaking = false;
  static currentLanguage = 'en';
  static activeUtterances = new Set();
  static heartbeatTimer = null;

  /**
   * Splits long text into short, natural sentences for reliable browser speech synthesis.
   * Prevents browser 15-second speech cutoffs and buffer overflow.
   */
  static splitIntoSentences(text) {
    if (!text) return [];
    const cleaned = String(text)
      .replace(/===[A-Z]+===/g, ' ')
      .replace(/[*#_`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Match sentences ending in ., !, ?, or Devanagari danda ।
    const matches = cleaned.match(/[^.!?।\n]+[.!?।\n]*/g);
    if (!matches || matches.length === 0) return [cleaned];
    return matches.map(s => s.trim()).filter(s => s.length > 0);
  }

  /**
   * Speak text aloud using browser SpeechSynthesis.
   * Splits long text into sequential sentences so the browser does not stop in the middle.
   */
  static speak(text, lang = 'en', onComplete = null) {
    if (!this.isSynthesisSupported()) {
      if (onComplete) onComplete();
      return;
    }

    this.stopSpeaking();

    const sentences = this.splitIntoSentences(text);
    if (sentences.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    this.currentLanguage = lang;
    sentences.forEach((sentence, idx) => {
      const isLast = idx === sentences.length - 1;
      this.enqueueSentence(sentence, lang, null, isLast ? onComplete : null);
    });
  }

  /**
   * Enqueues sentences as they arrive and ensures continuous playback
   */
  static enqueueSentence(sentence, lang = 'en', onStartFirst = null, onSentenceEnd = null) {
    if (!this.isSynthesisSupported()) return;
    const clean = String(sentence || '')
      .replace(/===[A-Z]+===/g, ' ')
      .replace(/[*#_`]/g, '')
      .trim();
    if (!clean) return;

    this.currentLanguage = lang;
    this.queue.push({ text: clean, onStartFirst, onSentenceEnd });

    this.startHeartbeat();

    if (!this.isQueueSpeaking) {
      this.playNextInQueue();
    }
  }

  static startHeartbeat() {
    if (this.heartbeatTimer || typeof window === 'undefined') return;
    // Chromium has a bug where speech pauses after ~14 seconds unless briefly toggled
    this.heartbeatTimer = setInterval(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 8000);
  }

  static stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  static playNextInQueue() {
    if (!this.isSynthesisSupported() || this.queue.length === 0) {
      this.isQueueSpeaking = false;
      this.stopHeartbeat();
      return;
    }

    this.isQueueSpeaking = true;
    const item = this.queue.shift();
    if (!item || !item.text) {
      this.playNextInQueue();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(item.text);
    // Keep reference in Set so browser garbage collection does not abort speech mid-sentence
    this.activeUtterances.add(utterance);

    const langMap = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
    utterance.lang = langMap[this.currentLanguage] || 'en-IN';
    utterance.rate = 0.94;
    utterance.pitch = 1.0;

    let started = false;
    utterance.onstart = () => {
      if (!started && item.onStartFirst) {
        started = true;
        try { item.onStartFirst(); } catch (e) {}
      }
    };

    const finish = () => {
      this.activeUtterances.delete(utterance);
      if (item.onSentenceEnd) {
        try { item.onSentenceEnd(); } catch (e) {}
      }
      this.playNextInQueue();
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      finish();
    }
  }

  static stopSpeaking() {
    this.queue = [];
    this.isQueueSpeaking = false;
    this.stopHeartbeat();
    this.activeUtterances.clear();
    if (this.isSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }
}
