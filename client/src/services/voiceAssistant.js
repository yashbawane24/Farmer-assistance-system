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
   * Pre-processes and cleans text for speech synthesis:
   * 1. Strips all emojis and pictographs so the TTS engine doesn't read their descriptions aloud.
   * 2. Replaces currency, units, chemical acronyms and abbreviations with native spoken phrases.
   * 3. Cleans markdown and strange punctuation.
   */
  static normalizeTextForSpeech(text, lang = 'en') {
    if (!text) return '';
    let s = String(text)
      .replace(/===[A-Z]+===/g, ' ')
      .replace(/[*#_`~>]/g, '')
      // Remove all emojis (smileys, symbols, pictographs)
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F2FF}]/gu, '')
      .replace(/\s+/g, ' ');

    const isMarathi = lang === 'mr';
    const isHindi = lang === 'hi';

    if (isMarathi || isHindi) {
      s = s
        .replace(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, '$1 रुपये')
        .replace(/\/quintal|\/q|\/क्विंटल/gi, ' प्रति क्विंटल')
        .replace(/(\d+)\s*g\/[Ll]/gi, '$1 ग्रॅम प्रति लिटर')
        .replace(/(\d+)\s*ml\/[Ll]/gi, '$1 मिली प्रति लिटर')
        .replace(/15\s*[Ll]\b/gi, '15 लिटर')
        .replace(/CIB&RC|CIB & RC/gi, isMarathi ? 'केंद्रीय कीटकनाशक मंडळ' : 'केंद्रीय कीटनाशक मंडल')
        .replace(/\bPHI\b/gi, isMarathi ? 'काढणी अंतर' : 'तुड़ाई अंतर')
        .replace(/\bWP\b/gi, 'डब्ल्यु पी')
        .replace(/\bEC\b/gi, 'ई सी')
        .replace(/\bSC\b/gi, 'एस सी')
        .replace(/\bKVK\b/gi, 'कृषी विज्ञान केंद्र')
        .replace(/\bAPMC\b/gi, isMarathi ? 'बाजार समिती' : 'कृषि मंडी');
    } else {
      s = s
        .replace(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, 'Rs. $1')
        .replace(/\/quintal|\/q/gi, ' per quintal')
        .replace(/(\d+)\s*g\/[Ll]/gi, '$1 grams per litre')
        .replace(/(\d+)\s*ml\/[Ll]/gi, '$1 ml per litre')
        .replace(/15\s*[Ll]\b/gi, '15 litre')
        .replace(/CIB&RC|CIB & RC/gi, 'CIB and RC')
        .replace(/\bKVK\b/gi, 'Krishi Vigyan Kendra');
    }

    return s.trim();
  }

  /**
   * Finds the best matching voice installed on the user's OS/browser.
   * If Marathi voice is not installed (e.g. on macOS or Windows default),
   * falls back to a high-quality Hindi Devanagari voice (e.g. Lekha, Google हिन्दी)
   * instead of falling back to English (which sounds completely garbled/weird).
   */
  static getBestVoice(targetLang = 'en') {
    if (!this.isSynthesisSupported()) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (voices.length === 0) return null;

    const normalizedLang = (targetLang || 'en').toLowerCase();

    // 1. Marathi requested:
    if (normalizedLang.startsWith('mr')) {
      // Direct Marathi voice
      const mrVoice = voices.find(v => 
        (v.lang && (v.lang.toLowerCase() === 'mr-in' || v.lang.toLowerCase() === 'mr_in' || v.lang.toLowerCase().startsWith('mr'))) ||
        /marathi|मराठी/i.test(v.name)
      );
      if (mrVoice) return { voice: mrVoice, lang: mrVoice.lang || 'mr-IN' };

      // Devanagari Hindi voice fallback (Lekha on Mac, Google हिन्दी in Chrome, Microsoft Swara on Windows)
      // Both languages share the Devanagari phonetic alphabet and read Marathi text clearly
      const hiVoice = voices.find(v => 
        (v.lang && (v.lang.toLowerCase() === 'hi-in' || v.lang.toLowerCase() === 'hi_in' || v.lang.toLowerCase().startsWith('hi'))) ||
        /hindi|हिन्दी|lekha|nilam|swara|madhur|kalpana|hemant/i.test(v.name)
      );
      if (hiVoice) return { voice: hiVoice, lang: 'hi-IN' };

      // Other Indian voice
      const inVoice = voices.find(v => v.lang && (v.lang.includes('-IN') || v.lang.includes('_IN')));
      if (inVoice) return { voice: inVoice, lang: inVoice.lang };
    }

    // 2. Hindi requested:
    if (normalizedLang.startsWith('hi')) {
      const hiVoice = voices.find(v => 
        (v.lang && (v.lang.toLowerCase() === 'hi-in' || v.lang.toLowerCase() === 'hi_in' || v.lang.toLowerCase().startsWith('hi'))) ||
        /hindi|हिन्दी|lekha|nilam|swara|madhur|kalpana|hemant/i.test(v.name)
      );
      if (hiVoice) return { voice: hiVoice, lang: hiVoice.lang || 'hi-IN' };

      const mrVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('mr'));
      if (mrVoice) return { voice: mrVoice, lang: mrVoice.lang };
    }

    // 3. English requested:
    if (normalizedLang.startsWith('en')) {
      const enInVoice = voices.find(v => 
        (v.lang && (v.lang.toLowerCase() === 'en-in' || v.lang.toLowerCase() === 'en_in')) ||
        /india|rishi|heera|veena|neerja|prabhat/i.test(v.name)
      );
      if (enInVoice) return { voice: enInVoice, lang: 'en-IN' };

      const enVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en'));
      if (enVoice) return { voice: enVoice, lang: enVoice.lang };
    }

    return { voice: voices[0], lang: 'en-IN' };
  }

  /**
   * Splits long text into short, natural sentences for reliable browser speech synthesis.
   * Prevents browser 15-second speech cutoffs and buffer overflow.
   */
  static splitIntoSentences(text, lang = 'en') {
    if (!text) return [];
    const cleaned = this.normalizeTextForSpeech(text, lang);

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

    const sentences = this.splitIntoSentences(text, lang);
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
    const clean = this.normalizeTextForSpeech(sentence, lang);
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

    const voiceInfo = this.getBestVoice(this.currentLanguage);
    if (voiceInfo && voiceInfo.voice) {
      utterance.voice = voiceInfo.voice;
      utterance.lang = voiceInfo.lang || (this.currentLanguage === 'mr' ? 'mr-IN' : 'en-IN');
    } else {
      const langMap = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
      utterance.lang = langMap[this.currentLanguage] || 'en-IN';
    }

    // Calibrated rate (0.90) ensures crisp, unhurried articulation for Marathi & Hindi Devanagari phonemes
    utterance.rate = this.currentLanguage === 'mr' || this.currentLanguage === 'hi' ? 0.90 : 0.94;
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

// Pre-load and cache browser voices as soon as they become ready
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        try { window.speechSynthesis.getVoices(); } catch (e) {}
      };
    }
  } catch (e) {}
}
