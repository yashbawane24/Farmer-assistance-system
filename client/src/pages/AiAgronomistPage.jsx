import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  CheckCircle2,
  Circle,
  AlertTriangle,
  CloudSun,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sprout,
  Square,
  HelpCircle,
  Camera,
  Calendar,
  Layers
} from 'lucide-react';
import { VoiceAssistant } from '../services/voiceAssistant.js';
import { api } from '../services/api.js';
import { getTranslation, translateCropName, translateCropStage, translateSoilType } from '../services/i18n.js';

const DEBUG_PERF = true;

function getVoiceErrorMessage(code, lang) {
  const isLanIp = typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    window.location.protocol !== 'https:';

  if (code === 'not-allowed' || code === 'service-not-allowed') {
    if (lang === 'mr') {
      return isLanIp
        ? 'मायक्रोफोन ॲक्सेस ब्लॉक केला आहे. (टीप: ब्राउझर मायक्रोफोन फक्त HTTPS किंवा localhost वर चालतो).'
        : 'मायक्रोफोन परवानगी ब्लॉक केली आहे. कृपया ब्राऊझर ॲड्रेस बारमध्ये जाऊन मायक्रोफोन सुरू करा.';
    }
    if (lang === 'hi') {
      return isLanIp
        ? 'माइक्रोफ़ोन अनुमति अवरुद्ध है। (ब्राउज़र माइक केवल HTTPS या localhost पर कार्य करता है)।'
        : 'माइक्रोफ़ोन अनुमति अवरुद्ध है। कृपया ब्राउज़र सेटिंग्स में जाकर माइक की अनुमति दें।';
    }
    return isLanIp
      ? 'Microphone blocked. (Browser mic requires HTTPS or http://localhost).'
      : 'Microphone permission blocked. Please allow microphone access in your browser settings.';
  }

  if (code === 'no-speech') {
    if (lang === 'mr') return 'काहीही ऐकू आले नाही. कृपया माइकजवळ येऊन स्पष्ट बोला.';
    if (lang === 'hi') return 'कोई आवाज़ नहीं सुनाई दी। कृपया माइक के पास आकर स्पष्ट बोलें।';
    return 'No speech detected. Please speak closer to the microphone.';
  }

  if (code === 'audio-capture') {
    if (lang === 'mr') return 'कोणताही मायक्रोफोन आढळला नाही. कृपया माइक तपासा.';
    if (lang === 'hi') return 'कोई माइक्रोफ़ोन नहीं मिला। कृपया माइक कनेक्ट करें।';
    return 'No microphone found on this device.';
  }

  if (lang === 'mr') return 'आवाज ओळखण्यात समस्या आली. कृपया पुन्हा बोला किंवा टाइप करा.';
  if (lang === 'hi') return 'आवाज़ पहचानने में समस्या आई। कृपया दोबारा बोलें या टाइप करें।';
  return 'Voice recognition issue. Please speak again or type your question.';
}

function getSupportedAudioMimeType() {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/aac'
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return 'audio/webm';
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function AiAgronomistPage({ activeProfile, lang, onNavigate }) {
  const t = getTranslation(lang);

  const [question, setQuestion] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStatusText, setVoiceStatusText] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(lang || 'en');
  const [loading, setLoading] = useState(false);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState(null);
  const [checkedSteps, setCheckedSteps] = useState(new Set());
  const [expandedDetails, setExpandedDetails] = useState({});

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const vadIntervalRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const fallbackSilenceTimerRef = useRef(null);
  const hardStopTimerRef = useRef(null);
  const hasDetectedSpeechRef = useRef(false);
  const isStartingRef = useRef(false);
  const hasAutoSentRef = useRef(false);
  const latestRecognizedTextRef = useRef('');

  // Pre-warm model and context cache on mount or when profile changes
  useEffect(() => {
    const farmerId = activeProfile?.id || 1;
    const district = activeProfile?.district || 'Nashik';
    const crop = activeProfile?.currentCrop || 'Tomato';
    api.warmupAgronomist({ farmerId, district, crop });
  }, [activeProfile?.id, activeProfile?.district, activeProfile?.currentCrop]);

  // Sync selectedLanguage when lang prop changes
  useEffect(() => {
    if (lang) setSelectedLanguage(lang);
  }, [lang]);

  // Cleanup active voice on unmount
  useEffect(() => {
    return () => {
      stopAllVoice();
      VoiceAssistant.stopSpeaking();
    };
  }, []);

  // Stop recording if interaction language changes
  useEffect(() => {
    stopAllVoice();
    setVoiceError('');
  }, [selectedLanguage]);

  // Initial welcome message structured as an agronomist card
  const getInitialGreeting = (l) => {
    const cropName = translateCropName(activeProfile?.currentCrop || 'Tomato', l);
    const farmer = activeProfile?.fullName || (l === 'mr' ? 'शेतकरी बंधू' : l === 'hi' ? 'किसान भाई' : 'Farmer');

    if (l === 'mr') {
      return {
        intent: 'general',
        headline: `नमस्कार ${farmer}! मी तुमचा कृषी मित्र आहे.`,
        likelyCause: `${cropName} पिकावरील कीड, रोग, फवारणी किंवा बाजारभावाबाबत विचारा.`,
        confidence: 'high',
        steps: [
          'माइक बटण दाबून तुमच्या शेतातील समस्या थेट बोला.',
          'किंवा खालील प्रश्नांपैकी एक निवडा.',
          'पिकावरील रोगाची खात्री करण्यासाठी रोग स्कॅनर वापरा.'
        ],
        treatment: null,
        priceInfo: null,
        weatherNote: '',
        askBack: '',
        appAction: 'disease_scan',
        followUps: [
          'माझ्या टोमॅटो पानांवर काळे डाग आहेत',
          'आजचा सोयाबीन बाजारभाव काय आहे?',
          'उद्या फवारणी करावी का?'
        ],
        speakText: `नमस्कार ${farmer}! मी तुमचा कृषी मित्र आहे. तुमच्या शेतात काय समस्या येत आहे ते सांगा.`
      };
    }
    if (l === 'hi') {
      return {
        intent: 'general',
        headline: `नमस्ते ${farmer}! मैं आपका कृषि मित्र हूँ।`,
        likelyCause: `${cropName} की फसल में कीट, रोग, स्प्रे या मंडी भाव के बारे में पूछें।`,
        confidence: 'high',
        steps: [
          'माइक बटन दबाकर अपने खेत की समस्या बोलकर बताएं।',
          'या नीचे दिए गए सुझावों में से कोई सवाल चुनें।',
          'रोग की सटीक पुष्टि के लिए रोग स्कैनर का उपयोग करें।'
        ],
        treatment: null,
        priceInfo: null,
        weatherNote: '',
        askBack: '',
        appAction: 'disease_scan',
        followUps: [
          'टमाटर के पत्तों पर पीले और काले धब्बे हैं',
          'सोयाबीन का आज का मंडी भाव क्या है?',
          'क्या कल कीटनाशक छिड़काव करना चाहिए?'
        ],
        speakText: `नमस्ते ${farmer}! मैं आपका कृषि मित्र हूँ। अपने खेत की समस्या बताएं या सवाल पूछें।`
      };
    }
    return {
      intent: 'general',
      headline: `Hello ${farmer}! I am Krishi Mitra, your AI Agronomist.`,
      likelyCause: `Ready to assist with your ${cropName} crop, pest control, weather or mandi prices.`,
      confidence: 'high',
      steps: [
        'Tap the microphone to ask your field question directly.',
        'Or tap any quick question chip below.',
        'Use Disease Scanner to confirm leaf symptoms with a photo.'
      ],
      treatment: null,
      priceInfo: null,
      weatherNote: '',
      askBack: '',
      appAction: 'disease_scan',
      followUps: [
        'My tomato leaves have yellow patches with dark rings',
        'Soybean rate in Latur today?',
        'Should I spray tomorrow?'
      ],
      speakText: `Hello ${farmer}! I am Krishi Mitra. Tell me what is happening in your field or tap the microphone to speak.`
    };
  };

  const [conversation, setConversation] = useState(() => [
    {
      role: 'assistant',
      data: getInitialGreeting(lang || 'en'),
      timestamp: lang === 'hi' ? 'अभी' : lang === 'mr' ? 'आत्ता' : 'Just now',
      ragContext: {
        crop: activeProfile?.currentCrop || 'Tomato',
        stage: activeProfile?.cropStage || 'Flowering to Fruit Set',
        soil: activeProfile?.soilType || 'Black Soil (Regur)',
        district: activeProfile?.district || 'Nashik'
      }
    }
  ]);

  // Update initial greeting on language toggle
  useEffect(() => {
    setConversation((prev) => {
      if (prev.length <= 1) {
        return [
          {
            role: 'assistant',
            data: getInitialGreeting(lang),
            timestamp: lang === 'hi' ? 'अभी' : lang === 'mr' ? 'आत्ता' : 'Just now',
            ragContext: {
              crop: activeProfile?.currentCrop || 'Tomato',
              stage: activeProfile?.cropStage || 'Flowering to Fruit Set',
              soil: activeProfile?.soilType || 'Black Soil (Regur)',
              district: activeProfile?.district || 'Nashik'
            }
          }
        ];
      }
      return prev;
    });
  }, [lang]);

  // Quick Prompt Suggestions
  const promptSuggestions = [
    {
      en: 'My tomato leaves have yellow patches with dark rings',
      hi: 'टमाटर के पत्तों पर पीले और काले छल्ले वाले धब्बे हैं',
      mr: 'टोमॅटोच्या पानांवर काळे गोल डाग पडून पिवळी पडत आहेत'
    },
    {
      en: 'Soybean rate in Latur today?',
      hi: 'लातूर में आज सोयाबीन का भाव क्या है?',
      mr: 'लातूरमध्ये आज सोयाबीनचा भाव काय आहे?'
    },
    {
      en: 'Should I spray tomorrow?',
      hi: 'क्या मुझे कल कीटनाशक स्प्रे करना चाहिए?',
      mr: 'उद्या शेतात फवारणी करावी का?'
    },
    {
      en: 'Which scheme gives money for drip irrigation?',
      hi: 'ड्रिप सिंचाई के लिए कौन सी सरकारी योजना है?',
      mr: 'ठिबक सिंचनासाठी कोणती योजना अनुदान देते?'
    },
    {
      en: 'My crop is not good',
      hi: 'मेरी फसल अच्छी नहीं चल रही है',
      mr: 'माझे पीक चांगले नाही'
    }
  ];

  const stopAllVoice = () => {
    isStartingRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (fallbackSilenceTimerRef.current) {
      clearTimeout(fallbackSilenceTimerRef.current);
      fallbackSilenceTimerRef.current = null;
    }

    if (hardStopTimerRef.current) {
      clearTimeout(hardStopTimerRef.current);
      hardStopTimerRef.current = null;
    }

    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }

    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
      mediaRecorderRef.current = null;
    }

    if (mediaStreamRef.current) {
      try { mediaStreamRef.current.getTracks().forEach((t) => t.stop()); } catch (e) {}
      mediaStreamRef.current = null;
    }

    setIsRecording(false);
    setVoiceStatusText('');
  };

  const handleToggleSpeak = (idx, speakText) => {
    if (speakingMsgIdx === idx) {
      VoiceAssistant.stopSpeaking();
      setSpeakingMsgIdx(null);
      return;
    }
    VoiceAssistant.stopSpeaking();
    setSpeakingMsgIdx(idx);
    VoiceAssistant.speak(speakText, selectedLanguage, () => {
      setSpeakingMsgIdx(null);
    });
  };

  const toggleStepCheck = (stepKey) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepKey)) next.delete(stepKey);
      else next.add(stepKey);
      return next;
    });
  };

  const toggleDetails = (msgIdx) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [msgIdx]: !prev[msgIdx]
    }));
  };

  // Fallback MediaRecorder with Web Audio API RMS VAD (auto-stop after 1s silence, max 15s)
  const startFallbackRecording = async () => {
    hasAutoSentRef.current = false;
    hasDetectedSpeechRef.current = false;

    if (!navigator?.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceError(getVoiceErrorMessage('audio-capture', selectedLanguage));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = getSupportedAudioMimeType();
      let recorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 24000 });
      } catch (e) {
        recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      }
      mediaRecorderRef.current = recorder;
      const chunks = [];

      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.fftSize);
          vadIntervalRef.current = setInterval(() => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;
            analyser.getByteTimeDomainData(dataArray);

            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const val = (dataArray[i] - 128) / 128;
              sum += val * val;
            }
            const rms = Math.sqrt(sum / dataArray.length);

            if (rms > 0.012) {
              hasDetectedSpeechRef.current = true;
              if (fallbackSilenceTimerRef.current) {
                clearTimeout(fallbackSilenceTimerRef.current);
                fallbackSilenceTimerRef.current = null;
              }
            } else if (hasDetectedSpeechRef.current) {
              if (!fallbackSilenceTimerRef.current) {
                fallbackSilenceTimerRef.current = setTimeout(() => {
                  if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    if (DEBUG_PERF) console.log('⚡ [Fallback VAD] 1.0s silence detected, auto-stopping recording');
                    mediaRecorderRef.current.stop();
                  }
                }, 1000);
              }
            }
          }, 50);
        }
      } catch (vadErr) {
        if (DEBUG_PERF) console.warn('VAD setup skipped:', vadErr);
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (vadIntervalRef.current) {
          clearInterval(vadIntervalRef.current);
          vadIntervalRef.current = null;
        }
        if (fallbackSilenceTimerRef.current) {
          clearTimeout(fallbackSilenceTimerRef.current);
          fallbackSilenceTimerRef.current = null;
        }
        if (audioContextRef.current) {
          try { audioContextRef.current.close(); } catch (e) {}
          audioContextRef.current = null;
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }

        if (chunks.length === 0) {
          setIsRecording(false);
          setVoiceStatusText('');
          return;
        }

        const actualMime = recorder.mimeType || mimeType || 'audio/webm';
        const audioBlob = new Blob(chunks, { type: actualMime });

        setIsRecording(false);
        setVoiceStatusText(
          selectedLanguage === 'mr' ? 'आवाज तपासत आहे...' : (selectedLanguage === 'hi' ? 'आवाज़ पहचानी जा रही है...' : 'Transcribing voice...')
        );

        try {
          const base64Data = await blobToBase64(audioBlob);
          handleSendVoiceQuestion(base64Data, actualMime);
        } catch (transcribeErr) {
          console.error('Recording error:', transcribeErr);
          setVoiceError(transcribeErr.message || getVoiceErrorMessage('unknown', selectedLanguage));
          setVoiceStatusText('');
        }
      };

      recorder.start();
      setIsRecording(true);
      setVoiceStatusText(t.agronomist.listening);

      if (hardStopTimerRef.current) clearTimeout(hardStopTimerRef.current);
      hardStopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 15000);
    } catch (err) {
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      setVoiceError(getVoiceErrorMessage(isDenied ? 'not-allowed' : 'audio-capture', selectedLanguage));
      setIsRecording(false);
      setVoiceStatusText('');
    }
  };

  // Native Speech Recognition with live text and 800ms silence auto-send (Chrome/Edge/Android)
  const startNativeSpeechRecognition = () => {
    hasAutoSentRef.current = false;
    latestRecognizedTextRef.current = '';
    setIsRecording(true);
    setVoiceStatusText(t.agronomist.listening);

    const recognition = VoiceAssistant.startListening({
      lang: selectedLanguage,
      onResult: ({ finalTranscript, interimTranscript, currentTranscript, isFinal }) => {
        const currentText = (currentTranscript || finalTranscript || interimTranscript || '').trim();
        if (currentText) {
          setQuestion(currentText);
          latestRecognizedTextRef.current = currentText;
        }

        // Auto-send after 800 ms of silence
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          const textToSend = latestRecognizedTextRef.current.trim();
          if (textToSend && !hasAutoSentRef.current) {
            hasAutoSentRef.current = true;
            if (DEBUG_PERF) console.log('⚡ [Native STT] 800ms silence auto-send triggered for:', textToSend);
            stopAllVoice();
            handleSendQuestion(textToSend);
          }
        }, 800);

        if (isFinal && finalTranscript && !hasAutoSentRef.current) {
          hasAutoSentRef.current = true;
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          setQuestion(finalTranscript);
          stopAllVoice();
          handleSendQuestion(finalTranscript);
        }
      },
      onError: async (errorCode) => {
        if (DEBUG_PERF) console.warn('STT Error:', errorCode);
        if (errorCode === 'network' || errorCode === 'unsupported' || errorCode === 'not-supported' || errorCode === 'service-not-allowed') {
          if (latestRecognizedTextRef.current && latestRecognizedTextRef.current.trim().length > 0 && !hasAutoSentRef.current) {
            hasAutoSentRef.current = true;
            stopAllVoice();
            handleSendQuestion(latestRecognizedTextRef.current.trim());
            return;
          }
          stopAllVoice();
          await startFallbackRecording();
          return;
        }

        if (errorCode === 'no-speech') {
          if (latestRecognizedTextRef.current && latestRecognizedTextRef.current.trim().length > 0 && !hasAutoSentRef.current) {
            hasAutoSentRef.current = true;
            stopAllVoice();
            handleSendQuestion(latestRecognizedTextRef.current.trim());
            return;
          }
          stopAllVoice();
          setVoiceError(
            selectedLanguage === 'mr' ? 'आवाज ऐकू आला नाही. कृपया पुन्हा बोला.' :
            selectedLanguage === 'hi' ? 'कोई आवाज़ सुनाई नहीं दी। कृपया पुनः बोलें।' :
            'No speech detected. Please speak clearly.'
          );
          return;
        }

        stopAllVoice();
        setVoiceError(getVoiceErrorMessage(errorCode, selectedLanguage));
      },
      onEnd: () => {
        setIsRecording(false);
        setVoiceStatusText('');
        recognitionRef.current = null;
        if (!hasAutoSentRef.current && latestRecognizedTextRef.current && latestRecognizedTextRef.current.trim().length > 0) {
          hasAutoSentRef.current = true;
          handleSendQuestion(latestRecognizedTextRef.current.trim());
        }
      }
    });

    recognitionRef.current = recognition;
    isStartingRef.current = false;
  };

  const handleStartVoice = async () => {
    // If speaking aloud, tapping mic stops speech immediately
    if (speakingMsgIdx !== null || VoiceAssistant.isQueueSpeaking) {
      VoiceAssistant.stopSpeaking();
      setSpeakingMsgIdx(null);
      return;
    }

    // Tapping again while listening: stop immediately and process question
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        if (fallbackSilenceTimerRef.current) {
          clearTimeout(fallbackSilenceTimerRef.current);
          fallbackSilenceTimerRef.current = null;
        }
        mediaRecorderRef.current.stop();
        return;
      }

      if (latestRecognizedTextRef.current && latestRecognizedTextRef.current.trim().length > 0) {
        const textToSend = latestRecognizedTextRef.current.trim();
        hasAutoSentRef.current = true;
        stopAllVoice();
        handleSendQuestion(textToSend);
        return;
      }

      stopAllVoice();
      return;
    }

    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setVoiceError('');

    VoiceAssistant.stopSpeaking();
    setSpeakingMsgIdx(null);

    let permissionGranted = false;
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      try {
        const perm = await navigator.permissions.query({ name: 'microphone' });
        if (perm.state === 'granted') permissionGranted = true;
      } catch (e) {}
    }

    if (!permissionGranted && navigator?.mediaDevices?.getUserMedia) {
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        testStream.getTracks().forEach((t) => t.stop());
      } catch (permErr) {
        const isDenied = permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError';
        setVoiceError(getVoiceErrorMessage(isDenied ? 'not-allowed' : 'audio-capture', selectedLanguage));
        isStartingRef.current = false;
        return;
      }
    }

    if (!VoiceAssistant.isSpeechSupported()) {
      isStartingRef.current = false;
      await startFallbackRecording();
      return;
    }

    startNativeSpeechRecognition();
  };

  // Handles text question submission
  const handleSendQuestion = async (queryText = null) => {
    const textToSend = typeof queryText === 'string' ? queryText : question;
    if (!textToSend || textToSend.trim().length === 0) return;

    VoiceAssistant.stopSpeaking();
    setSpeakingMsgIdx(null);

    const history = conversation
      .filter((m) => m.data && m.data.headline)
      .slice(-6)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        text: m.role === 'user' ? m.text : (m.data?.headline + '. ' + (m.data?.likelyCause || ''))
      }));

    const cleanQuestionText = textToSend.trim();
    const userMsg = {
      role: 'user',
      text: cleanQuestionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversation((prev) => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);
    setVoiceStatusText('');

    try {
      const answer = await api.askAgronomist(
        cleanQuestionText,
        activeProfile?.id || 1,
        selectedLanguage,
        history
      );

      const assistantMsg = {
        role: 'assistant',
        data: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ragContext: answer.retrievedContext
      };

      setConversation((prev) => [...prev, assistantMsg]);

      // Automatically speak read-aloud text if desired or keep ready
      if (answer?.speakText) {
        // Auto-play spoken headline + key steps
        const newIdx = conversation.length + 1;
        setSpeakingMsgIdx(newIdx);
        VoiceAssistant.speak(answer.speakText, selectedLanguage, () => {
          setSpeakingMsgIdx(null);
        });
      }
    } catch (err) {
      console.error('Agronomist consultation error:', err);
      const errorMsg = {
        role: 'assistant',
        data: {
          intent: 'general',
          headline: selectedLanguage === 'mr' ? 'सर्व्हरशी संपर्क होऊ शकला नाही' : selectedLanguage === 'hi' ? 'सर्वर से संपर्क नहीं हो पाया' : 'Could not reach agronomist service',
          likelyCause: err.message || 'Please check your connection and try again.',
          confidence: 'low',
          steps: ['Please retry in a few moments.'],
          treatment: null,
          priceInfo: null,
          weatherNote: '',
          askBack: '',
          appAction: 'none',
          followUps: [],
          speakText: selectedLanguage === 'mr' ? 'सर्व्हरशी संपर्क होऊ शकला नाही. कृपया पुन्हा प्रयत्न करा.' : 'Could not reach server. Please try again.'
        },
        timestamp: 'Error'
      };
      setConversation((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Handles one-request voice ask (transcribe + answer) from MediaRecorder fallback
  const handleSendVoiceQuestion = async (audioBase64, mimeType) => {
    VoiceAssistant.stopSpeaking();
    setSpeakingMsgIdx(null);
    setLoading(true);

    // Placeholder user message showing "Recording voice..."
    const pendingUserIdx = conversation.length;
    const tempUserMsg = {
      role: 'user',
      text: selectedLanguage === 'mr' ? '🎙️ आवाज पाठवत आहे...' : selectedLanguage === 'hi' ? '🎙️ आवाज़ भेजी जा रही है...' : '🎙️ Transcribing voice...',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setConversation((prev) => [...prev, tempUserMsg]);

    const history = conversation
      .filter((m) => m.data && m.data.headline)
      .slice(-6)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        text: m.role === 'user' ? m.text : (m.data?.headline + '. ' + (m.data?.likelyCause || ''))
      }));

    try {
      const res = await api.askAgronomistVoice({
        audioBase64,
        mimeType,
        farmerId: activeProfile?.id || 1,
        language: selectedLanguage,
        history
      });

      const transcript = res?.transcript || res?.data?.transcript || '';
      const answer = res?.answer || res?.data?.answer || res;

      // Update farmer's message bubble with the recognized transcript
      setConversation((prev) => {
        const next = [...prev];
        if (next[pendingUserIdx]) {
          next[pendingUserIdx] = {
            ...next[pendingUserIdx],
            text: transcript || (selectedLanguage === 'mr' ? 'शेतकऱ्याचा ऑडिओ प्रश्न' : 'Farmer voice question')
          };
        }
        const assistantMsg = {
          role: 'assistant',
          data: answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ragContext: answer?.retrievedContext
        };
        return [...next, assistantMsg];
      });

      if (answer?.speakText) {
        const newIdx = pendingUserIdx + 1;
        setSpeakingMsgIdx(newIdx);
        VoiceAssistant.speak(answer.speakText, selectedLanguage, () => {
          setSpeakingMsgIdx(null);
        });
      }
    } catch (err) {
      console.error('Voice ask error:', err);
      setVoiceError(err.message || 'Voice consultation failed');
      setConversation((prev) => {
        const next = [...prev];
        next.pop(); // remove pending user bubble
        return next;
      });
    } finally {
      setLoading(false);
      setVoiceStatusText('');
    }
  };

  // Navigates to appropriate feature based on appAction
  const handleAppActionClick = (action) => {
    if (!onNavigate) return;
    if (action === 'disease_scan') {
      onNavigate('disease-scan');
    } else if (action === 'smart_mandi') {
      onNavigate('smart-mandi', { crop: activeProfile?.currentCrop || 'Tomato' });
    } else if (action === 'crop_advisor') {
      onNavigate('crop-advisor');
    } else if (action === 'schemes') {
      onNavigate('schemes');
    } else if (action === 'weather') {
      onNavigate('weather-alerts');
    }
  };

  // Confidence chip styling
  const renderConfidenceBadge = (confidence) => {
    const c = (confidence || 'medium').toLowerCase();
    const config = {
      high: {
        bg: '#EAF5EC',
        color: '#1B5E20',
        border: '#C8E6C9',
        label: selectedLanguage === 'mr' ? 'उच्च खात्री' : selectedLanguage === 'hi' ? 'उच्च विश्वास' : 'High Confidence'
      },
      medium: {
        bg: '#FFF8E1',
        color: '#B78103',
        border: '#FFE082',
        label: selectedLanguage === 'mr' ? 'मध्यम खात्री' : selectedLanguage === 'hi' ? 'मध्यम विश्वास' : 'Medium Confidence'
      },
      low: {
        bg: '#FBE9E7',
        color: '#D84315',
        border: '#FFCCBC',
        label: selectedLanguage === 'mr' ? 'कमी खात्री (तपासा)' : selectedLanguage === 'hi' ? 'कम विश्वास (पुष्टि करें)' : 'Low Confidence'
      }
    };
    const style = config[c] || config.medium;
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '999px',
          fontSize: '0.72rem',
          fontWeight: 700,
          backgroundColor: style.bg,
          color: style.color,
          border: `1px solid ${style.border}`,
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}
      >
        <ShieldCheck size={11} />
        {style.label}
      </span>
    );
  };

  return (
    <div className="container" style={{ padding: '24px 16px 64px 16px', maxWidth: '880px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary-forest)', fontWeight: 700 }}>
          {t.agronomist.phase}
        </span>
        <h1 style={{ marginTop: '4px', marginBottom: '6px', color: 'var(--color-primary-forest)', fontSize: 'clamp(1.5rem, 3.5vw, 2rem)' }}>
          {t.agronomist.title}
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
          {t.agronomist.subtitle}
        </p>
      </div>

      {/* Language Toggle */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
          {lang === 'hi' ? 'संवाद भाषा:' : lang === 'mr' ? 'संवाद भाषा:' : 'Language:'}
        </span>
        {[
          { code: 'mr', label: 'मराठी' },
          { code: 'hi', label: 'हिन्दी' },
          { code: 'en', label: 'English' }
        ].map((l) => (
          <button
            key={l.code}
            type="button"
            className={`btn btn-sm ${selectedLanguage === l.code ? 'btn-primary' : 'btn-secondary'}`}
            style={{ minHeight: '32px', padding: '0 12px', fontSize: '0.8rem', borderRadius: '999px' }}
            onClick={() => setSelectedLanguage(l.code)}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* HERO VOICE INTERACTION CARD */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--color-border-subtle)',
          padding: '24px 16px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '24px'
        }}
      >
        <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-leaf-green)', fontWeight: 700, marginBottom: '6px' }}>
          {t.agronomist.tapToSpeak} ({selectedLanguage === 'mr' ? 'मराठी' : (selectedLanguage === 'hi' ? 'हिन्दी' : 'English')})
        </div>
        <h2 style={{ fontSize: 'clamp(1.15rem, 2.8vw, 1.5rem)', color: 'var(--color-primary-forest)', marginBottom: '16px', fontWeight: 700 }}>
          {lang === 'hi' ? '"खेत की समस्या बताएं या माइक दबाएं"' : lang === 'mr' ? '"शेतातील समस्या सांगा किंवा माइक दाबा"' : '"Tell me what is happening in your field"'}
        </h2>

        {/* Big Mic Button */}
        <div className="voice-mic-container" style={{ margin: '12px auto' }}>
          <button
            type="button"
            className={`voice-mic-button ${isRecording ? 'recording' : ''}`}
            onClick={handleStartVoice}
            aria-label={isRecording ? t.agronomist.stopListening : t.agronomist.tapToSpeak}
            style={{
              width: '74px',
              height: '74px',
              backgroundColor: speakingMsgIdx !== null ? '#DC2626' : undefined,
              borderColor: speakingMsgIdx !== null ? '#B91C1C' : undefined
            }}
          >
            {speakingMsgIdx !== null ? (
              <Square size={28} color="#FFFFFF" fill="#FFFFFF" />
            ) : isRecording ? (
              <MicOff size={32} />
            ) : (
              <Mic size={32} />
            )}
          </button>

          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '8px', color: isRecording ? 'var(--color-terracotta)' : speakingMsgIdx !== null ? '#DC2626' : 'var(--color-text-muted)' }}>
            {speakingMsgIdx !== null
              ? (selectedLanguage === 'mr' ? '⏹️ बोलणे थांबवण्यासाठी दाबा (Tap to stop)' : (selectedLanguage === 'hi' ? '⏹️ बोलना रोकने के लिए दबाएं' : '⏹️ Tap to stop reading'))
              : voiceStatusText || (isRecording ? `🔴 ${t.agronomist.listening}` : t.agronomist.tapToSpeak)}
          </div>

          {/* Voice Error Notice */}
          {voiceError && (
            <div
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '8px',
                color: '#B91C1C',
                fontSize: '0.82rem',
                fontWeight: 600,
                maxWidth: '520px',
                margin: '10px auto 0 auto',
                lineHeight: 1.4,
                textAlign: 'center'
              }}
            >
              ⚠️ {voiceError}
            </div>
          )}
        </div>

        {/* Text Input with Send */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            maxWidth: '640px',
            margin: '12px auto 0 auto'
          }}
        >
          <input
            type="text"
            placeholder={
              selectedLanguage === 'mr'
                ? 'किंवा येथे प्रश्न टाइप करा (उदा. टोमॅटो पाने पिवळी पडत आहेत)'
                : (selectedLanguage === 'hi'
                  ? 'या यहाँ सवाल टाइप करें (उदा. टमाटर के पत्ते पीले पड़ रहे हैं)'
                  : 'Or type your question here...')
            }
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendQuestion(); }}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--color-border-strong)',
              fontSize: '0.95rem',
              backgroundColor: 'var(--color-canvas-surface)'
            }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSendQuestion()}
            disabled={!question.trim() || loading}
            style={{ minHeight: '46px', padding: '0 20px', borderRadius: 'var(--radius-md)' }}
            aria-label="Send query"
          >
            <Send size={18} />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px', marginTop: '14px' }}>
          {promptSuggestions.map((s, idx) => {
            const promptText = selectedLanguage === 'mr' ? s.mr : (selectedLanguage === 'hi' ? s.hi : s.en);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuestion(promptText);
                  handleSendQuestion(promptText);
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-canvas-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  fontSize: '0.76rem',
                  color: 'var(--color-primary-forest)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                💡 {promptText}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONVERSATION CARDS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {conversation.map((msg, idx) => {
          const isFarmer = msg.role === 'user';
          if (isFarmer) {
            return (
              <div
                key={idx}
                style={{
                  alignSelf: 'flex-end',
                  maxWidth: '85%',
                  backgroundColor: 'var(--color-leaf-light)',
                  border: '1px solid #D2E4D4',
                  borderRadius: '16px 16px 4px 16px',
                  padding: '12px 16px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary-forest)' }}>
                    👨🏽‍🌾 {activeProfile?.fullName || (lang === 'hi' ? 'किसान भाई' : lang === 'mr' ? 'शेतकरी' : 'Farmer')}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{msg.timestamp}</span>
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--color-text-main)', fontWeight: 500, lineHeight: 1.4 }}>
                  {msg.text}
                </div>
              </div>
            );
          }

          // ASSISTANT AGRONOMIST CARD (Structured JSON)
          const data = msg.data || {};
          const isExpanded = Boolean(expandedDetails[idx]);
          const hasTreatment = Boolean(data.treatment && (data.treatment.organic || data.treatment.chemical));
          const hasPrice = Boolean(data.priceInfo && data.priceInfo.modalPrice);
          const hasWeather = Boolean(data.weatherNote && data.weatherNote.trim());
          const hasAskBack = Boolean(data.askBack && data.askBack.trim());
          const hasAction = Boolean(data.appAction && data.appAction !== 'none');
          const isSpeakingThis = speakingMsgIdx === idx;

          return (
            <div
              key={idx}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {/* Header row: Krishi Mitra avatar, time, Listen button, confidence chip */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--color-leaf-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-leaf-green)'
                    }}
                  >
                    <Sprout size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--color-primary-forest)', display: 'block', lineHeight: 1.2 }}>
                      {selectedLanguage === 'mr' ? 'कृषी मित्र' : selectedLanguage === 'hi' ? 'कृषि मित्र' : 'Krishi Mitra'}
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{msg.timestamp}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {renderConfidenceBadge(data.confidence)}
                  {data.speakText && (
                    <button
                      type="button"
                      onClick={() => handleToggleSpeak(idx, data.speakText)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        border: isSpeakingThis ? '1px solid #EF4444' : '1px solid var(--color-border-subtle)',
                        backgroundColor: isSpeakingThis ? '#FEE2E2' : 'var(--color-canvas-surface)',
                        color: isSpeakingThis ? '#DC2626' : 'var(--color-primary-forest)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      aria-label="Read aloud"
                    >
                      {isSpeakingThis ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      <span>
                        {isSpeakingThis
                          ? (selectedLanguage === 'mr' ? 'थांबवा' : selectedLanguage === 'hi' ? 'रोकें' : 'Stop')
                          : (selectedLanguage === 'mr' ? 'ऐका' : selectedLanguage === 'hi' ? 'सुनें' : 'Listen')}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Headline in bold, 1.15rem */}
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary-forest)', marginBottom: '4px', lineHeight: 1.3 }}>
                {data.headline}
              </div>

              {/* Likely cause line in muted text */}
              {data.likelyCause && (
                <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
                  {data.likelyCause}
                </div>
              )}

              {/* AskBack highlighted question card */}
              {hasAskBack && (
                <div
                  style={{
                    backgroundColor: '#FEF9C3',
                    border: '1.5px solid #FDE047',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    marginBottom: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <HelpCircle size={18} color="#A16207" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '0.85rem', color: '#854D0E', display: 'block', marginBottom: '2px' }}>
                        {selectedLanguage === 'mr' ? 'कृपया स्पष्ट करा:' : selectedLanguage === 'hi' ? 'कृपया स्पष्ट करें:' : 'Please clarify:'}
                      </strong>
                      <div style={{ fontSize: '0.9rem', color: '#713F12', fontWeight: 600 }}>
                        {data.askBack}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* What to do now: interactive numbered checklist */}
              {Array.isArray(data.steps) && data.steps.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-forest)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    📋 {selectedLanguage === 'mr' ? 'आत्ता काय करावे (कृती):' : selectedLanguage === 'hi' ? 'अभी क्या करें (कदम):' : 'What to do now:'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {data.steps.map((step, sIdx) => {
                      const stepKey = `${idx}-${sIdx}`;
                      const isDone = checkedSteps.has(stepKey);
                      return (
                        <div
                          key={sIdx}
                          onClick={() => toggleStepCheck(stepKey)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            padding: '8px 12px',
                            backgroundColor: isDone ? '#F0FDF4' : 'var(--color-canvas-surface)',
                            border: `1px solid ${isDone ? '#86EFAC' : 'var(--color-border-subtle)'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ marginTop: '2px', color: isDone ? '#16A34A' : '#9CA3AF' }}>
                            {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                          </div>
                          <div style={{ flex: 1, fontSize: '0.9rem', color: isDone ? '#4B5563' : 'var(--color-text-main)', textDecoration: isDone ? 'line-through' : 'none', lineHeight: 1.4 }}>
                            <strong style={{ marginRight: '6px', color: isDone ? '#9CA3AF' : 'var(--color-primary-forest)' }}>
                              {sIdx + 1}.
                            </strong>
                            {step}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Collapsible toggle for deep treatment or additional info */}
              {hasTreatment && (
                <div style={{ marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => toggleDetails(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-leaf-green)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: '4px 0'
                    }}
                  >
                    <span>
                      {isExpanded
                        ? (selectedLanguage === 'mr' ? 'उपचार तपशील लपवा' : selectedLanguage === 'hi' ? 'उपचार विवरण छुपाएं' : 'Hide Treatment Details')
                        : (selectedLanguage === 'mr' ? '🌿 औषध व उपचार तपशील पहा' : selectedLanguage === 'hi' ? '🌿 दवा और उपचार विवरण देखें' : '🌿 View Treatment & Dose Details')}
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              )}

              {/* Treatment card: side-by-side tiles (shown if expanded or short view) */}
              {hasTreatment && (isExpanded || !data.steps || data.steps.length <= 2) && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '12px',
                    marginBottom: '14px'
                  }}
                >
                  {/* Organic tile */}
                  {data.treatment.organic && (
                    <div
                      style={{
                        padding: '12px 14px',
                        backgroundColor: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#166534', fontWeight: 800, marginBottom: '4px' }}>
                        🌿 {selectedLanguage === 'mr' ? 'सेंद्रिय उपाय (प्रथम वापरा)' : selectedLanguage === 'hi' ? 'जैविक उपचार (पहले आजमाएं)' : 'Organic (Try first)'}
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#14532D', marginBottom: '4px' }}>
                        {data.treatment.organic.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#166534', lineHeight: 1.4 }}>
                        {data.treatment.organic.dosePerLitre && (
                          <div>• <strong>{selectedLanguage === 'mr' ? '15 लिटर पंप:' : selectedLanguage === 'hi' ? '15 ली. पंप:' : '15L pump:'}</strong> {data.treatment.organic.dosePerLitre}</div>
                        )}
                        {data.treatment.organic.dosePerAcre && (
                          <div>• <strong>{selectedLanguage === 'mr' ? 'प्रति एकर:' : selectedLanguage === 'hi' ? 'प्रति एकड़:' : 'Per acre:'}</strong> {data.treatment.organic.dosePerAcre}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Chemical tile */}
                  {data.treatment.chemical && (
                    <div
                      style={{
                        padding: '12px 14px',
                        backgroundColor: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#92400E', fontWeight: 800, marginBottom: '4px' }}>
                        🧪 {selectedLanguage === 'mr' ? 'रासायनिक फवारणी (CIB&RC)' : selectedLanguage === 'hi' ? 'रासायनिक छिड़काव' : 'Chemical (CIB&RC Approved)'}
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#78350F' }}>
                        {data.treatment.chemical.product}
                      </div>
                      {data.treatment.chemical.activeIngredient && (
                        <div style={{ fontSize: '0.75rem', color: '#92400E', fontStyle: 'italic', marginBottom: '4px' }}>
                          ({data.treatment.chemical.activeIngredient})
                        </div>
                      )}
                      <div style={{ fontSize: '0.8rem', color: '#78350F', lineHeight: 1.4 }}>
                        {data.treatment.chemical.dosePerLitre && (
                          <div>• <strong>{selectedLanguage === 'mr' ? '15 लिटर पंप:' : selectedLanguage === 'hi' ? '15 ली. पंप:' : '15L pump:'}</strong> {data.treatment.chemical.dosePerLitre}</div>
                        )}
                        {data.treatment.chemical.dosePerAcre && (
                          <div>• <strong>{selectedLanguage === 'mr' ? 'प्रति एकर:' : selectedLanguage === 'hi' ? 'प्रति एकड़:' : 'Per acre:'}</strong> {data.treatment.chemical.dosePerAcre}</div>
                        )}
                        {data.treatment.chemical.waitDaysBeforeHarvest && (
                          <div>• <strong>{selectedLanguage === 'mr' ? 'काढणी अंतर (PHI):' : selectedLanguage === 'hi' ? 'तुड़ाई अंतर:' : 'Wait days:'}</strong> {data.treatment.chemical.waitDaysBeforeHarvest}</div>
                        )}
                      </div>
                      {data.treatment.chemical.safety && (
                        <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#B45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                          <span>{data.treatment.chemical.safety}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Price card (only for market_price) */}
              {hasPrice && (
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    marginBottom: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                      📊 {data.priceInfo.mandi || 'APMC'}
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-forest)' }}>
                      {data.priceInfo.modalPrice?.startsWith('₹') ? data.priceInfo.modalPrice : `₹${data.priceInfo.modalPrice}`}
                      <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '4px' }}>/ quintal</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {data.priceInfo.date ? `Date: ${data.priceInfo.date}` : ''}
                      {data.priceInfo.comparedToMsp ? ` • ${data.priceInfo.comparedToMsp}` : ''}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onNavigate && onNavigate('smart-mandi', { crop: activeProfile?.currentCrop })}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    <TrendingUp size={14} />
                    <span>{selectedLanguage === 'mr' ? 'स्मार्ट बाजारभाव उघडा' : selectedLanguage === 'hi' ? 'स्मार्ट मंडी खोलें' : 'Open Smart Mandi'}</span>
                  </button>
                </div>
              )}

              {/* Weather Note strip */}
              {hasWeather && (
                <div
                  style={{
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    color: '#1E40AF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '14px'
                  }}
                >
                  <CloudSun size={16} color="#2563EB" style={{ flexShrink: 0 }} />
                  <span>{data.weatherNote}</span>
                </div>
              )}

              {/* appAction button */}
              {hasAction && (
                <div style={{ marginBottom: '14px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleAppActionClick(data.appAction)}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {data.appAction === 'disease_scan' && (
                      <>
                        <Camera size={18} />
                        <span>{selectedLanguage === 'mr' ? '📷 रोगाची खात्री करण्यासाठी फोटो स्कॅन करा' : selectedLanguage === 'hi' ? '📷 रोग की पुष्टि के लिए फोटो स्कैन करें' : '📷 Confirm with Disease Scan'}</span>
                      </>
                    )}
                    {data.appAction === 'smart_mandi' && (
                      <>
                        <TrendingUp size={18} />
                        <span>{selectedLanguage === 'mr' ? '📊 स्मार्ट बाजारभाव पहा' : selectedLanguage === 'hi' ? '📊 स्मार्ट मंडी देखें' : '📊 Open Smart Mandi'}</span>
                      </>
                    )}
                    {data.appAction === 'crop_advisor' && (
                      <>
                        <Layers size={18} />
                        <span>{selectedLanguage === 'mr' ? '🌾 पीक सल्लागार पहा' : selectedLanguage === 'hi' ? '🌾 फसल सलाहकार देखें' : '🌾 Open Crop Advisor'}</span>
                      </>
                    )}
                    {data.appAction === 'schemes' && (
                      <>
                        <Calendar size={18} />
                        <span>{selectedLanguage === 'mr' ? '📜 सरकारी योजना पहा' : selectedLanguage === 'hi' ? '📜 सरकारी योजनाएं देखें' : '📜 View Government Schemes'}</span>
                      </>
                    )}
                    {data.appAction === 'weather' && (
                      <>
                        <CloudSun size={18} />
                        <span>{selectedLanguage === 'mr' ? '🌦️ हवामान अंदाज पहा' : selectedLanguage === 'hi' ? '🌦️ मौसम पूर्वानुमान देखें' : '🌦️ Check Weather Forecast'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Follow-up chips */}
              {Array.isArray(data.followUps) && data.followUps.length > 0 && (
                <div style={{ paddingTop: '10px', borderTop: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                    {selectedLanguage === 'mr' ? 'पुढील प्रश्न विचारा:' : selectedLanguage === 'hi' ? 'आगे पूछें:' : 'Suggested follow-up:'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {data.followUps.map((f, fIdx) => (
                      <button
                        key={fIdx}
                        type="button"
                        onClick={() => {
                          setQuestion(f);
                          handleSendQuestion(f);
                        }}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '999px',
                          border: '1px solid var(--color-border-subtle)',
                          backgroundColor: 'var(--color-canvas-surface)',
                          fontSize: '0.78rem',
                          color: 'var(--color-primary-forest)',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        💬 {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Skeleton Thinking Card */}
        {loading && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #D2E4D4',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--color-leaf-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-leaf-green)'
                }}
              >
                <Sparkles size={18} className="animate-spin" />
              </div>
              <strong style={{ fontSize: '0.92rem', color: 'var(--color-primary-forest)' }}>
                {selectedLanguage === 'mr' ? 'कृषी मित्र विचार करत आहे...' : selectedLanguage === 'hi' ? 'कृषि मित्र सोच रहा है...' : 'Krishi Mitra is thinking…'}
              </strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ height: '18px', width: '70%', backgroundColor: '#E5E7EB', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: '14px', width: '90%', backgroundColor: '#F3F4F6', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: '14px', width: '50%', backgroundColor: '#F3F4F6', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
