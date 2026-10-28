import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Send, Sparkles, CheckCircle2, ShieldAlert, CornerDownRight, Database, Sprout, Square } from 'lucide-react';
import { VoiceAssistant } from '../services/voiceAssistant.js';
import { api } from '../services/api.js';
import { AudioSpeaker } from '../components/AudioSpeaker.jsx';
import { getTranslation, translateCropName, translateCropStage, translateSoilType } from '../services/i18n.js';

const DEBUG_PERF = true;

function getVoiceErrorMessage(code, lang) {
  const isLanIp = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && window.location.protocol !== 'https:';

  if (code === 'not-allowed' || code === 'service-not-allowed') {
    if (lang === 'mr') {
      return isLanIp
        ? 'मायक्रोफोन ॲक्सेस ब्लॉक केला आहे. (टीप: ब्राउझर मायक्रोफोन फक्त HTTPS किंवा http://localhost वर चालतो, लोकल आयपी 192.168.x.x वर चालत नाही).'
        : 'मायक्रोफोन परवानगी ब्लॉक केली आहे. कृपया ब्राऊझर ॲड्रेस बारमध्ये जाऊन मायक्रोफोन सुरू करा (Allow करा). (टीप: मायक्रोफोन फक्त HTTPS किंवा http://localhost वर चालतो).';
    }
    if (lang === 'hi') {
      return isLanIp
        ? 'माइक्रोफ़ोन अनुमति अवरुद्ध है। (ध्यान दें: ब्राउज़र माइक केवल HTTPS या http://localhost पर कार्य करता है, 192.168.x.x जैसे LAN IP पर नहीं)।'
        : 'माइक्रोफ़ोन अनुमति अवरुद्ध है। कृपया ब्राउज़र एड्रेस बार में जाकर माइक की अनुमति दें (Allow करें)। (ध्यान दें: माइक केवल HTTPS या http://localhost पर कार्य करता है)।';
    }
    return isLanIp
      ? 'Microphone permission blocked. (Note: Browser mic requires HTTPS or http://localhost; it is blocked on LAN IPs like 192.168.x.x).'
      : 'Microphone permission blocked. Please click the lock/settings icon in the browser address bar to allow microphone access. (Note: Mic requires HTTPS or http://localhost).';
  }

  if (code === 'no-speech') {
    if (lang === 'mr') return 'काहीही ऐकू आले नाही. कृपया पुन्हा प्रयत्न करा आणि माइकजवळ येऊन स्पष्ट बोला.';
    if (lang === 'hi') return 'कोई आवाज़ नहीं सुनाई दी। कृपया माइक के पास आकर दोबारा स्पष्ट बोलें।';
    return 'No speech detected. Please try again and speak closer to the microphone.';
  }

  if (code === 'audio-capture') {
    if (lang === 'mr') return 'कोणताही मायक्रोफोन आढळला नाही. कृपया माइक तपासा किंवा जोडा.';
    if (lang === 'hi') return 'कोई माइक्रोफ़ोन नहीं मिला। कृपया माइक कनेक्ट करें और पुनः प्रयास करें।';
    return 'No microphone found on this device. Please connect a microphone and try again.';
  }

  if (lang === 'mr') return 'आवाज ओळखण्यात समस्या आली. कृपया पुन्हा बोला किंवा टाइप करून प्रश्न विचारा.';
  if (lang === 'hi') return 'आवाज़ पहचानने में समस्या आई। कृपया दोबारा बोलें या टाइप करके पूछें।';
  return 'Voice recognition issue. Please try again or type your question.';
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

// Extracts complete sentences for streaming TTS and leaves remaining incomplete text
function extractSentences(text) {
  // Punctuation characters: ., !, ?, ।, \n
  const regex = /([^.!?।\n]+[.!?।\n]+)/g;
  const sentences = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const s = match[1].trim();
    if (s) sentences.push(s);
    lastIndex = regex.lastIndex;
  }
  const remainder = text.slice(lastIndex);
  return { sentences, remainder };
}

export function AiAgronomistPage({ activeProfile, lang, onNavigate }) {
  const t = getTranslation(lang);

  const [question, setQuestion] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStatusText, setVoiceStatusText] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(lang || 'en');
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

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
  const abortControllerRef = useRef(null);

  // Performance measurement timestamps
  const perfRef = useRef({
    micStart: 0,
    lastSpeech: 0,
    transcriptReady: 0,
    requestSent: 0,
    firstChunk: 0,
    firstSentence: 0,
    answerComplete: 0,
    model: ''
  });

  // Sync selectedLanguage whenever lang changes
  useEffect(() => {
    if (lang) setSelectedLanguage(lang);
  }, [lang]);

  // Clean up any active speech recognition / recording when unmounting
  useEffect(() => {
    return () => {
      stopAllVoice();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Stop active recording and clear error when language changes
  useEffect(() => {
    stopAllVoice();
    setVoiceError('');
  }, [selectedLanguage]);

  const [conversation, setConversation] = useState([
    {
      role: 'assistant',
      text: lang === 'mr'
        ? `नमस्कार ${activeProfile?.fullName || 'शेतकरी बंधू'}, मी तुमचा कृषी मित्र आहे. तुमच्या ${translateCropName(activeProfile?.currentCrop || 'Tomato', lang)} शेतात काय समस्या येत आहे ते सांगा.`
        : (lang === 'hi'
          ? `नमस्ते ${activeProfile?.fullName || 'किसान भाई'}, मैं आपका कृषि मित्र हूँ। अपने ${translateCropName(activeProfile?.currentCrop || 'Tomato', lang)} के खेत की समस्या बताएं या माइक दबाकर बोलें।`
          : `Hello ${activeProfile?.fullName || 'Farmer'}, I am your AI Agronomist. Tell me what is happening in your field or tap the microphone to speak.`),
      timestamp: lang === 'hi' ? 'अभी' : lang === 'mr' ? 'आत्ता' : 'Just now',
      ragContext: {
        crop: activeProfile?.currentCrop || 'Tomato',
        stage: activeProfile?.cropStage || 'Flowering to Fruit Set',
        soil: activeProfile?.soilType || 'Black Soil (Regur)',
        district: activeProfile?.district || 'Nashik'
      }
    }
  ]);

  // Update initial greeting when lang changes
  useEffect(() => {
    setConversation([
      {
        role: 'assistant',
        text: lang === 'mr'
          ? `नमस्कार ${activeProfile?.fullName || 'शेतकरी बंधू'}, मी तुमचा कृषी मित्र आहे. तुमच्या ${translateCropName(activeProfile?.currentCrop || 'Tomato', lang)} शेतात काय समस्या येत आहे ते सांगा.`
          : (lang === 'hi'
            ? `नमस्ते ${activeProfile?.fullName || 'किसान भाई'}, मैं आपका कृषि मित्र हूँ। अपने ${translateCropName(activeProfile?.currentCrop || 'Tomato', lang)} के खेत की समस्या बताएं या माइक दबाकर बोलें।`
            : `Hello ${activeProfile?.fullName || 'Farmer'}, I am your AI Agronomist. Tell me what is happening in your field or tap the microphone to speak.`),
        timestamp: lang === 'hi' ? 'अभी' : lang === 'mr' ? 'आत्ता' : 'Just now',
        ragContext: {
          crop: activeProfile?.currentCrop || 'Tomato',
          stage: activeProfile?.cropStage || 'Flowering to Fruit Set',
          soil: activeProfile?.soilType || 'Black Soil (Regur)',
          district: activeProfile?.district || 'Nashik'
        }
      }
    ]);
  }, [lang]);

  // Quick Prompt Chips
  const promptSuggestions = [
    { en: "My tomato leaves are turning yellow with dark spots", hi: "मेरे टमाटर के पत्ते पीले पड़ रहे हैं और धब्बे हैं", mr: "माझ्या टोमॅटोच्या पानांवर काळे डाग पडून पिवळी पडत आहेत" },
    { en: "What is today's mandi rate for my crop, and should I sell now?", hi: "आज मेरी फसल का मंडी भाव क्या है, क्या अभी बेचना चाहिए?", mr: "आज माझ्या पिकाचा बाजारभाव काय आहे, आत्ता विकावे का?" },
    { en: "How do I control pink bollworm in cotton?", hi: "कपास में गुलाबी सुंडी का नियंत्रण कैसे करें?", mr: "कापसावरील गुलाबी बोंडअळीचे नियंत्रण कसे करावे?" },
    { en: "Rain is forecast this week, should I spray today?", hi: "इस हफ्ते बारिश का अनुमान है, क्या आज छिड़काव करूं?", mr: "या आठवड्यात पावसाचा अंदाज आहे, आज फवारणी करावी का?" }
  ];

  const stopAllVoice = () => {
    isStartingRef.current = false;
    VoiceAssistant.stopSpeaking();

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
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
      mediaRecorderRef.current = null;
    }

    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch (e) {}
      mediaStreamRef.current = null;
    }

    setIsRecording(false);
    setVoiceStatusText('');
  };

  // Interrupt active answer streaming and speech readout immediately
  const handleInterrupt = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    VoiceAssistant.stopSpeaking();
    setIsStreaming(false);
    setLoading(false);
    stopAllVoice();

    // Clean up any pending thinking assistant bubble
    setConversation((prev) => {
      const next = [...prev];
      const lastIdx = next.length - 1;
      if (lastIdx >= 0 && next[lastIdx].role === 'assistant' && (next[lastIdx].isThinking || !next[lastIdx].text)) {
        return next.slice(0, lastIdx);
      }
      return next;
    });
  };

  // Fallback MediaRecorder with Web Audio API RMS VAD (Firefox / Brave / non-WebSpeech)
  const startFallbackRecording = async () => {
    hasAutoSentRef.current = false;
    hasDetectedSpeechRef.current = false;
    perfRef.current = {
      micStart: Date.now(),
      lastSpeech: 0,
      transcriptReady: 0,
      requestSent: 0,
      firstChunk: 0,
      firstSentence: 0,
      answerComplete: 0,
      model: ''
    };

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

      // Setup Web Audio API Analyser for RMS voice activity detection
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

            // Sensitive speech threshold for natural mic input
            if (rms > 0.012) {
              hasDetectedSpeechRef.current = true;
              perfRef.current.lastSpeech = Date.now();
              if (fallbackSilenceTimerRef.current) {
                clearTimeout(fallbackSilenceTimerRef.current);
                fallbackSilenceTimerRef.current = null;
              }
            } else if (hasDetectedSpeechRef.current) {
              // Once speech has been detected, auto-stop after 1.0s of silence
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
        perfRef.current.transcriptReady = Date.now();
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
          selectedLanguage === 'mr' ? 'आवाज ओळखत आहे...' : (selectedLanguage === 'hi' ? 'आवाज़ पहचान रहे हैं...' : 'Transcribing voice...')
        );

        try {
          const base64Data = await blobToBase64(audioBlob);
          // Transcribe speech using fast Gemini endpoint
          const res = await api.transcribeAudio({
            audioBase64: base64Data,
            mimeType: actualMime,
            language: selectedLanguage
          });
          const transcribedText = (res?.data?.text || res?.text || '').trim();

          if (!transcribedText) {
            setVoiceStatusText('');
            setVoiceError(
              selectedLanguage === 'mr' ? 'आवाज स्पष्ट ऐकू आला नाही. कृपया पुन्हा बोला.' :
              selectedLanguage === 'hi' ? 'आवाज़ स्पष्ट सुनाई नहीं दी। कृपया पुनः बोलें।' :
              'Could not clearly hear speech. Please try speaking again.'
            );
            return;
          }

          // Populate input box so farmer sees their words
          setQuestion(transcribedText);
          setVoiceStatusText('');
          handleSendQuestion(transcribedText);
        } catch (transcribeErr) {
          console.error('Transcription error:', transcribeErr);
          setVoiceError(transcribeErr.message || getVoiceErrorMessage('unknown', selectedLanguage));
          setVoiceStatusText('');
        }
      };

      recorder.start();
      setIsRecording(true);
      setVoiceStatusText(t.agronomist.listening);

      // Hard stop safety limit reduced from 15s to 7s
      if (hardStopTimerRef.current) clearTimeout(hardStopTimerRef.current);
      hardStopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 7000);
    } catch (err) {
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      setVoiceError(getVoiceErrorMessage(isDenied ? 'not-allowed' : 'audio-capture', selectedLanguage));
      setIsRecording(false);
      setVoiceStatusText('');
    }
  };

  // Native Speech Recognition with instant interim display and 900ms silence auto-send
  const startNativeSpeechRecognition = () => {
    hasAutoSentRef.current = false;
    latestRecognizedTextRef.current = '';
    perfRef.current = {
      micStart: Date.now(),
      lastSpeech: 0,
      transcriptReady: 0,
      requestSent: 0,
      firstChunk: 0,
      firstSentence: 0,
      answerComplete: 0,
      model: ''
    };
    setIsRecording(true);
    setVoiceStatusText(t.agronomist.listening);

    const recognition = VoiceAssistant.startListening({
      lang: selectedLanguage,
      onResult: ({ finalTranscript, interimTranscript, currentTranscript, isFinal }) => {
        const currentText = (currentTranscript || finalTranscript || interimTranscript || '').trim();
        if (currentText) {
          perfRef.current.lastSpeech = Date.now();
          setQuestion(currentText);
          latestRecognizedTextRef.current = currentText;
        }

        // Reset 900ms silence timer on each voice result
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          const textToSend = latestRecognizedTextRef.current.trim();
          if (textToSend && !hasAutoSentRef.current) {
            hasAutoSentRef.current = true;
            perfRef.current.transcriptReady = Date.now();
            if (DEBUG_PERF) console.log('⚡ [Native STT] 900ms silence auto-send triggered for:', textToSend);
            stopAllVoice();
            handleSendQuestion(textToSend);
          }
        }, 900);

        // Immediate send if browser signals isFinal
        if (isFinal && finalTranscript && !hasAutoSentRef.current) {
          hasAutoSentRef.current = true;
          perfRef.current.transcriptReady = Date.now();
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          setQuestion(finalTranscript);
          stopAllVoice();
          handleSendQuestion(finalTranscript);
        }
      },
      onError: async (errorCode) => {
        if (DEBUG_PERF) console.warn('STT Error:', errorCode);
        // Switch to fallback automatically on network failure, service denial, or unsupported
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
          perfRef.current.transcriptReady = Date.now();
          handleSendQuestion(latestRecognizedTextRef.current.trim());
        }
      }
    });

    recognitionRef.current = recognition;
    isStartingRef.current = false;
  };

  const handleStartVoice = async () => {
    // If answer is currently streaming or speaking, tapping the mic button interrupts immediately
    if (isStreaming || loading || VoiceAssistant.isQueueSpeaking) {
      handleInterrupt();
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

    // Double-start protection
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setVoiceError('');

    // Stop app's own spoken answer so mic doesn't pick it up
    VoiceAssistant.stopSpeaking();

    // Check microphone permission without redundant getUserMedia when already granted
    let permissionGranted = false;
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      try {
        const perm = await navigator.permissions.query({ name: 'microphone' });
        if (perm.state === 'granted') {
          permissionGranted = true;
        }
      } catch (e) {
        // Some browsers throw on querying microphone permission
      }
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

    // Check if Web Speech Recognition is supported
    if (!VoiceAssistant.isSpeechSupported()) {
      isStartingRef.current = false;
      await startFallbackRecording();
      return;
    }

    startNativeSpeechRecognition();
  };

  // Handles both text and transcribed voice queries
  const handleSendQuestion = async (queryText = null, audioPayload = null) => {
    const textToSend = typeof queryText === 'string' ? queryText : question;
    const hasAudio = Boolean(audioPayload?.audioBase64);

    if (!hasAudio && (!textToSend || textToSend.trim().length === 0)) return;

    // Previous turns give the AI context for follow-up questions
    const history = conversation
      .filter((m) => m.timestamp !== 'Error' && m.text)
      .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', text: m.text }));

    const cleanQuestionText = textToSend ? textToSend.trim() : '';

    const userMsg = {
      role: 'user',
      text: cleanQuestionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const assistantMsg = {
      role: 'assistant',
      text: '',
      isThinking: true,
      isStreaming: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversation((prev) => [...prev, userMsg, assistantMsg]);
    setQuestion('');
    setLoading(true);
    setIsStreaming(true);
    setVoiceStatusText('');

    perfRef.current.requestSent = Date.now();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let incomingAccumulator = '';
    let ttsSentenceBuffer = '';
    let seenStructuredMarker = false;

    try {
      await api.streamAgronomist({
        question: hasAudio ? null : textToSend.trim(),
        audioBase64: audioPayload?.audioBase64,
        audioMimeType: audioPayload?.audioMimeType,
        farmerId: activeProfile?.id || 1,
        language: selectedLanguage,
        history,
        signal: abortController.signal,

        onTranscript: (liveTranscript) => {
          if (DEBUG_PERF) console.log('⚡ [Stream] Audio transcript received:', liveTranscript);
          // Update farmer's message bubble with transcribed words
          setConversation((prev) => {
            const next = [...prev];
            const farmerIdx = next.length - 2;
            if (farmerIdx >= 0 && next[farmerIdx].role === 'user') {
              next[farmerIdx] = {
                ...next[farmerIdx],
                text: liveTranscript
              };
            }
            return next;
          });
        },

        onChunk: (chunk) => {
          if (!perfRef.current.firstChunk) {
            perfRef.current.firstChunk = Date.now();
          }

          incomingAccumulator += chunk;

          // Strip any leading TRANSCRIPT: line from assistant bubble display
          let displayText = incomingAccumulator;
          if (displayText.startsWith('TRANSCRIPT:')) {
            const nlIdx = displayText.indexOf('\n');
            if (nlIdx !== -1) {
              displayText = displayText.slice(nlIdx + 1).trimStart();
            } else {
              displayText = '';
            }
          }

          // Cleanly format section markers so the full comprehensive answer streams live on screen
          const formattedDisplay = displayText
            .replace(/(?:###\s*)?===ACTIONS===\s*/g, selectedLanguage === 'mr' ? '\n\n📋 **तातडीने करावयाच्या कृती (Immediate Actions):**\n' : selectedLanguage === 'hi' ? '\n\n📋 **तत्काल करने योग्य कदम (Immediate Actions):**\n' : '\n\n📋 **Immediate Actions:**\n')
            .replace(/(?:###\s*)?===ORGANIC===\s*/g, selectedLanguage === 'mr' ? '\n\n🌿 **सेंद्रिय/जैविक उपाय (Organic Treatment):**\n' : selectedLanguage === 'hi' ? '\n\n🌿 **जैविक उपचार (Organic Treatment):**\n' : '\n\n🌿 **Organic Treatment:**\n')
            .replace(/(?:###\s*)?===CHEMICAL===\s*/g, selectedLanguage === 'mr' ? '\n\n🧪 **रासायनिक उपाय (Chemical Spray):**\n' : selectedLanguage === 'hi' ? '\n\n🧪 **रासायनिक उपचार (Chemical Spray):**\n' : '\n\n🧪 **Chemical Spray:**\n')
            .replace(/(?:###\s*)?===TIP===\s*/g, selectedLanguage === 'mr' ? '\n\n💡 **महत्त्वाचा सल्ला (Expert Tip):**\n' : selectedLanguage === 'hi' ? '\n\n💡 **विशेषज्ञ सलाह (Expert Tip):**\n' : '\n\n💡 **Expert Tip:**\n');

          // Update assistant text live in conversation
          setConversation((prev) => {
            const next = [...prev];
            const lastIdx = next.length - 1;
            if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
              next[lastIdx] = {
                ...next[lastIdx],
                text: formattedDisplay,
                isThinking: false,
                isStreaming: true
              };
            }
            return next;
          });

          // Queue completed sentences to TTS as they stream in
          ttsSentenceBuffer += chunk;
          // Discard any transcript prefix from TTS
          if (ttsSentenceBuffer.startsWith('TRANSCRIPT:')) {
            const nl = ttsSentenceBuffer.indexOf('\n');
            if (nl !== -1) ttsSentenceBuffer = ttsSentenceBuffer.slice(nl + 1);
            else return;
          }

          // Smoothly convert section markers to natural spoken cues so speech never stops midway
          const spokenBuffer = ttsSentenceBuffer
            .replace(/===ACTIONS===/g, selectedLanguage === 'mr' ? '. खालील कृती करा: ' : selectedLanguage === 'hi' ? '. तत्काल यह कदम उठाएं: ' : '. Immediate action steps: ')
            .replace(/===ORGANIC===/g, selectedLanguage === 'mr' ? '. सेंद्रिय उपाय: ' : selectedLanguage === 'hi' ? '. जैविक उपचार: ' : '. Organic remedy: ')
            .replace(/===CHEMICAL===/g, selectedLanguage === 'mr' ? '. रासायनिक उपाय: ' : selectedLanguage === 'hi' ? '. रासायनिक उपचार: ' : '. Chemical treatment: ')
            .replace(/===TIP===/g, selectedLanguage === 'mr' ? '. कृषीतज्ज्ञांचा सल्ला: ' : selectedLanguage === 'hi' ? '. कृषि विशेषज्ञ सलाह: ' : '. Pro tip: ');

          const { sentences, remainder } = extractSentences(spokenBuffer);
          ttsSentenceBuffer = remainder;

          for (const sentence of sentences) {
            const clean = sentence.replace(/===[A-Z]+===/g, '').replace(/[*#_`]/g, '').trim();
            if (clean) {
              VoiceAssistant.enqueueSentence(clean, selectedLanguage, () => {
                if (!perfRef.current.firstSentence) {
                  perfRef.current.firstSentence = Date.now();
                }
              });
            }
          }
        },

        onDone: (result) => {
          perfRef.current.answerComplete = Date.now();
          perfRef.current.model = result?.model || '';

          // If there's any remaining sentence fragment in the TTS buffer, speak it
          if (ttsSentenceBuffer && ttsSentenceBuffer.trim()) {
            const cleanTail = ttsSentenceBuffer
              .replace(/===ACTIONS===/g, selectedLanguage === 'mr' ? '. खालील कृती करा: ' : selectedLanguage === 'hi' ? '. तत्काल यह कदम उठाएं: ' : '. Immediate action steps: ')
              .replace(/===ORGANIC===/g, selectedLanguage === 'mr' ? '. सेंद्रिय उपाय: ' : selectedLanguage === 'hi' ? '. जैविक उपचार: ' : '. Organic remedy: ')
              .replace(/===CHEMICAL===/g, selectedLanguage === 'mr' ? '. रासायनिक उपाय: ' : selectedLanguage === 'hi' ? '. रासायनिक उपचार: ' : '. Chemical treatment: ')
              .replace(/===TIP===/g, selectedLanguage === 'mr' ? '. कृषीतज्ज्ञांचा सल्ला: ' : selectedLanguage === 'hi' ? '. कृषि विशेषज्ञ सलाह: ' : '. Pro tip: ')
              .replace(/===[A-Z]+===/g, '')
              .replace(/[*#_`]/g, '')
              .trim();

            if (cleanTail) {
              VoiceAssistant.enqueueSentence(cleanTail, selectedLanguage, () => {
                if (!perfRef.current.firstSentence) {
                  perfRef.current.firstSentence = Date.now();
                }
              });
            }
          }

          // Update conversation with full structured cards
          setConversation((prev) => {
            const next = [...prev];
            // If transcript was extracted, confirm farmer bubble has it
            if (result.transcript) {
              const farmerIdx = next.length - 2;
              if (farmerIdx >= 0 && next[farmerIdx].role === 'user') {
                next[farmerIdx] = {
                  ...next[farmerIdx],
                  text: result.transcript
                };
              }
            }

            const lastIdx = next.length - 1;
            if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
              const baseText = result.fullText || incomingAccumulator || result.rootCause || '';
              const fullCleanText = baseText
                .replace(/^TRANSCRIPT:\s*.+\n*/m, '')
                .replace(/(?:###\s*)?===ACTIONS===\s*/g, selectedLanguage === 'mr' ? '\n\n📋 **तातडीने करावयाच्या कृती (Immediate Actions):**\n' : selectedLanguage === 'hi' ? '\n\n📋 **तत्काल करने योग्य कदम (Immediate Actions):**\n' : '\n\n📋 **Immediate Actions:**\n')
                .replace(/(?:###\s*)?===ORGANIC===\s*/g, selectedLanguage === 'mr' ? '\n\n🌿 **सेंद्रिय/जैविक उपाय (Organic Treatment):**\n' : selectedLanguage === 'hi' ? '\n\n🌿 **जैविक उपचार (Organic Treatment):**\n' : '\n\n🌿 **Organic Treatment:**\n')
                .replace(/(?:###\s*)?===CHEMICAL===\s*/g, selectedLanguage === 'mr' ? '\n\n🧪 **रासायनिक उपाय (Chemical Spray):**\n' : selectedLanguage === 'hi' ? '\n\n🧪 **रासायनिक उपचार (Chemical Spray):**\n' : '\n\n🧪 **Chemical Spray:**\n')
                .replace(/(?:###\s*)?===TIP===\s*/g, selectedLanguage === 'mr' ? '\n\n💡 **महत्त्वाचा सल्ला (Expert Tip):**\n' : selectedLanguage === 'hi' ? '\n\n💡 **विशेषज्ञ सलाह (Expert Tip):**\n' : '\n\n💡 **Expert Tip:**\n')
                .trim();

              next[lastIdx] = {
                role: 'assistant',
                text: fullCleanText || result.rootCause || result.audioReadoutText || incomingAccumulator,
                immediateAction: result.immediateAction,
                treatmentPlan: result.treatmentPlan,
                farmerTip: result.farmerTip,
                audioReadoutText: result.audioReadoutText || fullCleanText,
                ragContext: result.retrievedContext,
                knowledgeTopic: result.knowledgeTopic,
                aiEngine: result.aiEngine,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isThinking: false,
                isStreaming: false
              };
            }
            return next;
          });

          // Print one-line performance summary
          if (DEBUG_PERF) {
            const p = perfRef.current;
            const micToEnd = p.lastSpeech && p.micStart ? `${p.lastSpeech - p.micStart}ms` : 'N/A';
            const speechToReq = p.requestSent && p.lastSpeech ? `${p.requestSent - p.lastSpeech}ms` : 'N/A';
            const reqToFirstChunk = p.firstChunk && p.requestSent ? `${p.firstChunk - p.requestSent}ms` : 'N/A';
            const reqToTTS = p.firstSentence && p.requestSent ? `${p.firstSentence - p.requestSent}ms` : 'N/A';
            const totalReq = p.answerComplete && p.requestSent ? `${p.answerComplete - p.requestSent}ms` : 'N/A';
            console.log(`⚡ [PERF Summary] Mic->EndSpeech: ${micToEnd} | Speech->Req: ${speechToReq} | Req->FirstChunk: ${reqToFirstChunk} | Req->TTS: ${reqToTTS} | TotalReq: ${totalReq} | Model: ${p.model || 'Gemini'}`);
          }

          setIsStreaming(false);
          setLoading(false);
        },

        onError: (err) => {
          if (err?.name === 'AbortError') {
            setConversation((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === 'assistant' && (last.isThinking || !last.text)) {
                return prev.slice(0, -1);
              }
              return prev;
            });
            setIsStreaming(false);
            setLoading(false);
            return;
          }
          console.error('Streaming error:', err);
          setConversation((prev) => {
            const next = [...prev];
            const lastIdx = next.length - 1;
            const errorText = err.message || (lang === 'hi' ? 'सर्वर से संपर्क नहीं हो पाया। कृपया पुनः प्रयास करें।' : lang === 'mr' ? 'सर्व्हरशी संपर्क होऊ शकला नाही. कृपया पुन्हा प्रयत्न करा.' : 'Unable to reach the server right now. Please try again.');
            if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
              next[lastIdx] = {
                role: 'assistant',
                text: errorText,
                timestamp: 'Error',
                isThinking: false,
                isStreaming: false
              };
            }
            return next;
          });
          setIsStreaming(false);
          setLoading(false);
        }
      });
    } catch (e) {
      if (e?.name === 'AbortError') {
        setConversation((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && (last.isThinking || !last.text)) {
            return prev.slice(0, -1);
          }
          return prev;
        });
        setIsStreaming(false);
        setLoading(false);
        return;
      }
      setConversation((prev) => {
        const next = [...prev];
        const lastIdx = next.length - 1;
        const errorText = e.message || (lang === 'hi' ? 'सर्वर से संपर्क नहीं हो पाया। कृपया पुनः प्रयास करें।' : lang === 'mr' ? 'सर्व्हरशी संपर्क होऊ शकला नाही. कृपया पुन्हा प्रयत्न करा.' : 'Unable to reach the server right now. Please try again.');
        if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
          next[lastIdx] = {
            role: 'assistant',
            text: errorText,
            timestamp: 'Error',
            isThinking: false,
            isStreaming: false
          };
          return next;
        }
        return [...next, { role: 'assistant', text: errorText, timestamp: 'Error' }];
      });
      setIsStreaming(false);
      setLoading(false);
    } finally {
      setIsStreaming(false);
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '36px var(--space-md) 64px var(--space-md)' }}>
      {/* Header */}
      <div style={{ maxWidth: '800px', marginBottom: '24px' }}>
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary-forest)', fontWeight: 700 }}>
          {t.agronomist.phase}
        </span>
        <h1 style={{ marginTop: '4px', marginBottom: '8px', color: 'var(--color-primary-forest)' }}>
          {t.agronomist.title}
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>
          {t.agronomist.subtitle}
        </p>
      </div>

      {/* Language Toggle */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
          {lang === 'hi' ? 'संवाद भाषा:' : lang === 'mr' ? 'संवाद भाषा:' : 'Interaction Language:'}
        </span>
        {[
          { code: 'mr', label: 'मराठी (Marathi)' },
          { code: 'hi', label: 'हिन्दी (Hindi)' },
          { code: 'en', label: 'English' }
        ].map((l) => (
          <button
            key={l.code}
            type="button"
            className={`btn btn-sm ${selectedLanguage === l.code ? 'btn-primary' : 'btn-secondary'}`}
            style={{ minHeight: '34px', padding: '0 12px', fontSize: '0.8rem' }}
            onClick={() => setSelectedLanguage(l.code)}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* MAIN VOICE INTERACTION HERO CARD */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1.5px solid var(--color-border-subtle)',
        padding: '36px 24px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '32px'
      }}>
        <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-leaf-green)', fontWeight: 700, marginBottom: '8px' }}>
          {t.agronomist.tapToSpeak} ({selectedLanguage === 'mr' ? 'मराठी' : (selectedLanguage === 'hi' ? 'हिन्दी' : 'English')})
        </div>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', color: 'var(--color-primary-forest)', marginBottom: '24px' }}>
          {lang === 'hi' ? '"अपने खेत की समस्या बताएं या सवाल पूछें"' : lang === 'mr' ? '"तुमच्या शेतातील समस्या सांगा किंवा प्रश्न विचारा"' : '"Tell me what is happening in your field."'}
        </h2>

        {/* Big Ripple Microphone Button */}
        <div className="voice-mic-container">
          <button
            type="button"
            className={`voice-mic-button ${isRecording ? 'recording' : ''} ${isStreaming ? 'streaming' : ''}`}
            onClick={handleStartVoice}
            aria-label={
              isStreaming
                ? 'Stop reading answer'
                : isRecording
                ? t.agronomist.stopListening
                : t.agronomist.tapToSpeak
            }
            style={{
              backgroundColor: isStreaming ? '#DC2626' : undefined,
              borderColor: isStreaming ? '#B91C1C' : undefined
            }}
          >
            {isStreaming ? (
              <Square size={32} color="#FFFFFF" fill="#FFFFFF" />
            ) : isRecording ? (
              <MicOff size={36} />
            ) : (
              <Mic size={36} />
            )}
          </button>

          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isRecording ? 'var(--color-terracotta)' : isStreaming ? '#DC2626' : 'var(--color-text-muted)' }}>
            {isStreaming
              ? (selectedLanguage === 'mr' ? '⏹️ बोलणे थांबवण्यासाठी दाबा (Tap to stop)' : (selectedLanguage === 'hi' ? '⏹️ बोलना रोकने के लिए दबाएं (Tap to stop)' : '⏹️ Tap to stop reading'))
              : voiceStatusText || (isRecording ? `🔴 ${t.agronomist.listening}` : t.agronomist.tapToSpeak)}
          </div>

          {/* Visible STT Error Message */}
          {voiceError && (
            <div style={{
              marginTop: '12px',
              padding: '10px 16px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              color: '#B91C1C',
              fontSize: '0.85rem',
              fontWeight: 600,
              maxWidth: '560px',
              margin: '12px auto 0 auto',
              lineHeight: 1.5,
              textAlign: 'center'
            }}>
              ⚠️ {voiceError}
            </div>
          )}
        </div>

        {/* Input Text Box with Send Button */}
        <div style={{
          display: 'flex',
          gap: '8px',
          maxWidth: '680px',
          margin: '0 auto',
          position: 'relative'
        }}>
          <input
            type="text"
            placeholder={
              selectedLanguage === 'mr'
                ? 'किंवा येथे प्रश्न टाइप करा (उदा. टोमॅटो पाने पिवळी का पडत आहेत?)'
                : (selectedLanguage === 'hi'
                  ? 'या यहाँ सवाल टाइप करें (उदा. टमाटर के पत्ते पीले क्यों पड़ रहे हैं?)'
                  : 'Or type your question here...')
            }
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendQuestion(); }}
            style={{
              flex: 1,
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--color-border-strong)',
              fontSize: '1rem',
              backgroundColor: 'var(--color-canvas-surface)'
            }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSendQuestion()}
            disabled={!question.trim() || loading}
            style={{ minHeight: '50px', padding: '0 22px' }}
          >
            <Send size={18} />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
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
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-canvas-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  fontSize: '0.8rem',
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

      {/* CONVERSATION STREAM */}
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--color-primary-forest)' }}>
          {lang === 'hi' ? 'कृषि परामर्श संवाद' : lang === 'mr' ? 'कृषी सल्लागार संवाद' : 'Agronomic Consultations'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {conversation.map((msg, idx) => {
            const isFarmer = msg.role === 'user';
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: isFarmer ? 'var(--color-canvas-surface)' : '#FFFFFF',
                  border: '1.5px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      padding: '6px',
                      borderRadius: '50%',
                      background: isFarmer ? 'var(--color-primary-forest)' : 'var(--color-leaf-light)',
                      color: isFarmer ? '#FFFFFF' : 'var(--color-leaf-green)'
                    }}>
                      {isFarmer ? '👨🏽‍🌾' : <Sprout size={18} />}
                    </div>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--color-primary-forest)' }}>
                      {isFarmer ? activeProfile?.fullName || (lang === 'hi' ? 'किसान भाई' : lang === 'mr' ? 'शेतकरी' : 'Farmer') : (lang === 'hi' ? 'एआई कृषि मित्र' : lang === 'mr' ? 'एआय कृषी मित्र' : 'AI Agronomist (Kisan Mitra)')}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{msg.timestamp}</span>
                    {!isFarmer && !msg.isStreaming && msg.audioReadoutText && (
                      <AudioSpeaker text={msg.audioReadoutText} lang={selectedLanguage} label={lang === 'hi' ? 'सुनें' : lang === 'mr' ? 'ऐका' : 'Listen'} />
                    )}
                  </div>
                </div>

                {/* Body / Thinking state */}
                {msg.isThinking ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-leaf-green)', fontSize: '0.95rem', fontWeight: 600 }}>
                    <Sparkles size={18} className="animate-spin" />
                    <span>
                      {selectedLanguage === 'mr' ? 'कृषी सल्लागार विचार करत आहे...' : (selectedLanguage === 'hi' ? 'कृषि मित्र सोच रहा है...' : 'AI Agronomist is thinking…')}
                    </span>
                  </div>
                ) : (
                  <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--color-text-main)', whiteSpace: 'pre-wrap', marginBottom: msg.immediateAction ? '16px' : '0' }}>
                    {msg.text}
                    {msg.isStreaming && <span style={{ display: 'inline-block', width: '8px', height: '14px', backgroundColor: 'var(--color-leaf-green)', marginLeft: '4px', verticalAlign: 'baseline', animation: 'blink 1s infinite' }}></span>}
                  </p>
                )}

                {/* Structured Action Plan Cards */}
                {msg.immediateAction && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', marginTop: '16px' }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--color-primary-forest)' }}>
                      🚨 {t.agronomist.treatment}:
                    </strong>
                    {msg.immediateAction.map((step, sIdx) => (
                      <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.88rem' }}>
                        <CheckCircle2 size={16} color="var(--color-leaf-green)" style={{ flexShrink: 0, marginTop: '3px' }} />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Biological & Chemical Prescription */}
                {msg.treatmentPlan && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ padding: '12px 14px', background: 'var(--color-leaf-light)', borderRadius: 'var(--radius-sm)', border: '1px solid #D2E4D4' }}>
                      <strong style={{ color: 'var(--color-leaf-green)', fontSize: '0.82rem' }}>🌿 {t.disease.biological}:</strong>
                      <div style={{ fontSize: '0.85rem', marginTop: '2px' }}>{msg.treatmentPlan.biological}</div>
                    </div>
                    <div style={{ padding: '12px 14px', background: 'var(--color-canvas-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
                      <strong style={{ color: 'var(--color-text-main)', fontSize: '0.82rem' }}>🧪 {t.disease.chemical}:</strong>
                      <div style={{ fontSize: '0.85rem', marginTop: '2px' }}>{msg.treatmentPlan.chemical}</div>
                    </div>
                  </div>
                )}

                {/* Farmer Tip */}
                {msg.farmerTip && (
                  <div style={{ padding: '10px 14px', background: '#FFF9EB', border: '1px solid #FDE68A', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: '#92400E', marginBottom: '12px' }}>
                    💡 <strong>{t.agronomist.farmerTip}:</strong> {msg.farmerTip}
                  </div>
                )}

                {/* RAG Farm Context Grounding Badge */}
                {msg.ragContext && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '6px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--color-border-subtle)',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)'
                  }}>
                    <Database size={13} color="var(--color-leaf-green)" />
                    <span>{lang === 'hi' ? 'सक्रिय खेत संदर्भ:' : lang === 'mr' ? 'सक्रिय शेत संदर्भ:' : 'Grounded in Active Context:'}</span>
                    <span className="badge badge-wheat">{translateCropName(msg.ragContext.crop, lang)}</span>
                    <span className="badge badge-wheat">{translateCropStage(msg.ragContext.stage, lang)}</span>
                    <span className="badge badge-wheat">{translateSoilType(msg.ragContext.soil, lang)}</span>
                    <span className="badge badge-wheat">{msg.ragContext.district}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
