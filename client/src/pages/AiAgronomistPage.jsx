import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Send, Sparkles, CheckCircle2, ShieldAlert, CornerDownRight, Database, Sprout } from 'lucide-react';
import { VoiceAssistant } from '../services/voiceAssistant.js';
import { api } from '../services/api.js';
import { AudioSpeaker } from '../components/AudioSpeaker.jsx';
import { getTranslation, translateCropName, translateCropStage, translateSoilType } from '../services/i18n.js';

export function AiAgronomistPage({ activeProfile, lang, onNavigate }) {
  const t = getTranslation(lang);

  const [question, setQuestion] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(lang || 'en');
  const [loading, setLoading] = useState(false);

  // Sync selectedLanguage whenever lang changes
  useEffect(() => {
    if (lang) setSelectedLanguage(lang);
  }, [lang]);

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
    { en: "Heavy rain is forecast tomorrow, what should I do for flowering stage?", hi: "कल भारी बारिश की संभावना है, फूल आने की अवस्था में क्या करूं?", mr: "उद्या मुसळधार पाऊस होणार आहे, फुलोरा अवस्थेत काय काळजी घ्यावी?" },
    { en: "Suggest organic pest control for sucking pests (aphids and thrips)", hi: "चूसक कीटों (थ्रिप्स) के लिए सस्ता जैविक उपाय बताएं", mr: "रसशोषक किडींसाठी स्वस्त सेंद्रिय निंबोळी फवारणी सांगा" }
  ];

  const handleStartVoice = () => {
    if (isRecording) {
      VoiceAssistant.stopSpeaking();
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    VoiceAssistant.startListening({
      lang: selectedLanguage,
      onResult: ({ finalTranscript, interimTranscript }) => {
        setQuestion(finalTranscript || interimTranscript);
      },
      onError: (err) => {
        console.warn('STT Error:', err);
        setIsRecording(false);
      },
      onEnd: () => {
        setIsRecording(false);
      }
    });
  };

  const handleSendQuestion = async (queryText = null) => {
    const textToSend = queryText || question;
    if (!textToSend || textToSend.trim().length === 0) return;

    const newMsg = {
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setConversation((prev) => [...prev, newMsg]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await api.askAgronomist(textToSend, activeProfile?.id || 1, selectedLanguage);

      const assistantReply = {
        role: 'assistant',
        text: response.localizedResponse?.rootCause || response.rootCause,
        immediateAction: response.localizedResponse?.immediateAction || response.immediateAction,
        treatmentPlan: response.localizedResponse?.treatmentPlan || response.treatmentPlan,
        farmerTip: response.localizedResponse?.farmerTip || response.farmerTip,
        audioReadoutText: response.audioReadoutText,
        ragContext: response.retrievedContext,
        knowledgeTopic: response.knowledgeTopic,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversation((prev) => [...prev, assistantReply]);

      if (response.audioReadoutText) {
        VoiceAssistant.speak(response.audioReadoutText, selectedLanguage);
      }
    } catch (e) {
      setConversation((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: lang === 'hi' ? 'कृषि डेटाबेस से संपर्क नहीं हो पाया। कृपया पुनः प्रयास करें।' : lang === 'mr' ? 'कृषी डेटाबेसशी संपर्क होऊ शकला नाही. कृपया पुन्हा प्रयत्न करा.' : 'Unable to reach the agronomy knowledge base right now. Please check your connectivity or try again.',
          timestamp: 'Error'
        }
      ]);
    } finally {
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
            className={`voice-mic-button ${isRecording ? 'recording' : ''}`}
            onClick={handleStartVoice}
            aria-label={isRecording ? t.agronomist.stopListening : t.agronomist.tapToSpeak}
          >
            {isRecording ? <MicOff size={36} /> : <Mic size={36} />}
          </button>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isRecording ? 'var(--color-terracotta)' : 'var(--color-text-muted)' }}>
            {isRecording ? `🔴 ${t.agronomist.listening}` : t.agronomist.tapToSpeak}
          </div>
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
                    {!isFarmer && msg.audioReadoutText && (
                      <AudioSpeaker text={msg.audioReadoutText} lang={selectedLanguage} label={lang === 'hi' ? 'सुनें' : lang === 'mr' ? 'ऐका' : 'Listen'} />
                    )}
                  </div>
                </div>

                {/* Body */}
                <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--color-text-main)', marginBottom: msg.immediateAction ? '16px' : '0' }}>
                  {msg.text}
                </p>

                {/* Structured Action Plan Cards */}
                {msg.immediateAction && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
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
