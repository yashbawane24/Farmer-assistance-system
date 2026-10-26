import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, AlertTriangle, CheckCircle2, ShieldCheck, Wifi, WifiOff, RefreshCw, Eye } from 'lucide-react';
import { EdgeAiDiseaseScanner } from '../services/edgeAiDiseaseScanner.js';
import { api } from '../services/api.js';
import { offlineStorage } from '../services/offlineStorage.js';
import { AudioSpeaker } from '../components/AudioSpeaker.jsx';
import { getTranslation, translateCropName } from '../services/i18n.js';

// Main crops of Maharashtra; Gemini also recognises other crops from the photo itself
const SCAN_CROPS = ['Cotton', 'Soybean', 'Tur (Arhar)', 'Gram (Chana)', 'Onion', 'Tomato', 'Green Chilli', 'Potato', 'Wheat', 'Jowar', 'Rice (Paddy)', 'Grapes', 'Pomegranate', 'Sugarcane'];

export function DiseaseScanPage({ activeProfile, lang, onNavigate }) {
  const t = getTranslation(lang);
  const fileInputRef = useRef(null);

  // States
  const [selectedCrop, setSelectedCrop] = useState(activeProfile?.currentCrop || 'Tomato');
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineHistory, setOfflineHistory] = useState([]);
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    if (activeProfile?.currentCrop) {
      setSelectedCrop(activeProfile.currentCrop);
    }
  }, [activeProfile]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadOfflineHistory();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOfflineHistory = async () => {
    try {
      const scans = await offlineStorage.getOfflineScans();
      setOfflineHistory(scans);
    } catch (e) {
      console.warn('Offline scans load error:', e);
    }
  };

  // Real sample leaf photos (client/public/samples) for quick 1-click testing
  const sampleLeaves = [
    { label: t.disease.sampleBlight, crop: 'Tomato', color: '#D4A373', file: 'tomato_early_blight.jpg' },
    { label: lang === 'hi' ? 'आलू पछेती झुलसा' : lang === 'mr' ? 'बटाटा उशिरा करपा' : 'Potato Late Blight', crop: 'Potato', color: '#B08968', file: 'potato_late_blight.jpg' },
    { label: t.disease.sampleHealthy, crop: 'Tomato', color: '#386641', file: 'healthy_crop_leaf.jpg' }
  ];

  const handleSelectSample = async (sample) => {
    setSelectedCrop(sample.crop);
    setUploadedFileName(sample.file);
    setDiagnosis(null);
    setScanError('');
    try {
      const blob = await (await fetch(`/samples/${sample.file}`)).blob();
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(blob);
    } catch (e) {
      setScanError(lang === 'hi' ? 'नमूना फोटो लोड नहीं हो सकी।' : lang === 'mr' ? 'नमुना फोटो लोड होऊ शकला नाही.' : 'Could not load the sample photo.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name || '');
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setDiagnosis(null);
      setScanError('');
    };
    reader.readAsDataURL(file);
  };

  const handleRunAnalysis = async () => {
    if (!imagePreview) return;
    setAnalyzing(true);
    setScanError('');
    setDiagnosis(null);

    try {
      let result = null;
      let useOfflineEstimate = isOffline;

      // Online: real AI diagnosis by Google Gemini Vision on the server
      if (!isOffline) {
        try {
          result = await api.diagnoseDisease({
            cropName: selectedCrop,
            imageBase64: imagePreview,
            language: lang
          });
        } catch (serverErr) {
          if (serverErr.status) {
            // The server answered with a real error (AI not configured, not a leaf photo, quota...). Show it.
            setScanError(serverErr.message);
            return;
          }
          // Server unreachable (no network): fall back to the on-device estimate
          useOfflineEstimate = true;
        }
      }

      // Offline: rough on-device colour-pattern estimate, clearly labelled as such
      if (!result && useOfflineEstimate) {
        result = await EdgeAiDiseaseScanner.scanLeaf(imagePreview, selectedCrop, true, uploadedFileName);
        result = { ...result, isOfflineEstimate: true, confidence: null }; // heuristic has no real confidence
      }

      setDiagnosis(result);
      loadOfflineHistory();
    } catch (err) {
      console.error('Scan error:', err);
      setScanError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="container" style={{ padding: '36px var(--space-md) 64px var(--space-md)' }}>
      {/* Page Header with Offline Pill */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '28px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-terracotta)', fontWeight: 700 }}>
            {t.disease.phase}
          </span>
          <h1 style={{ marginTop: '4px', marginBottom: '8px', color: 'var(--color-primary-forest)' }}>
            {t.disease.title}
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', maxWidth: '640px' }}>
            {t.disease.subtitle}
          </p>
        </div>

        {/* Network & Edge AI Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: isOffline ? '#FEF3C7' : '#EBF2EC',
          color: isOffline ? '#92400E' : 'var(--color-leaf-green)',
          border: '1px solid currentColor',
          fontWeight: 700,
          fontSize: '0.85rem'
        }}>
          {isOffline ? <WifiOff size={16} /> : <Wifi size={16} />}
          <span>{isOffline ? t.disease.offlineActive : t.disease.onlineActive}</span>
        </div>
      </div>

      {/* 2-Column Scanner Interface */}
      <div className="grid-2" style={{ gap: '32px', alignItems: 'flex-start' }}>
        {/* Left Column: Image Upload / Capture */}
        <div className="card">
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>
              {t.disease.cropTypeLabel}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--color-border-strong)',
                fontSize: '0.95rem',
                backgroundColor: 'var(--color-canvas-surface)',
                width: '100%'
              }}
            >
              {SCAN_CROPS.map((c) => (
                <option key={c} value={c}>{translateCropName(c, lang)}</option>
              ))}
              {!SCAN_CROPS.includes(selectedCrop) && <option value={selectedCrop}>{translateCropName(selectedCrop, lang)}</option>}
            </select>
          </div>

          {/* Upload Dropzone / Camera Area */}
          <div style={{
            border: '2px dashed var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: '32px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--color-canvas-surface)',
            marginBottom: '20px',
            position: 'relative'
          }}>
            {imagePreview ? (
              <div>
                <img
                  src={imagePreview}
                  alt="Crop Leaf Preview"
                  style={{
                    maxHeight: '260px',
                    maxWidth: '100%',
                    borderRadius: 'var(--radius-sm)',
                    objectFit: 'contain',
                    marginBottom: '16px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                />
                <div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {lang === 'hi' ? 'फोटो बदलें' : lang === 'mr' ? 'फोटो बदला' : 'Change Image'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  color: 'var(--color-primary-forest)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <Camera size={30} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-primary-forest)', marginBottom: '6px' }}>
                  {t.disease.uploadPrompt}
                </div>
                <p style={{ fontSize: '0.85rem', marginBottom: '18px', color: 'var(--color-text-muted)' }}>
                  {lang === 'hi' ? 'दिन की रोशनी में पत्ती की साफ तस्वीर लें' : lang === 'mr' ? 'सूर्यप्रकाशात पानाचा स्पष्ट फोटो काढा' : 'Take a clear photo of the upper and lower leaf surface in daylight'}
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={16} />
                  <span>{t.disease.uploadBtn}</span>
                </button>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>

          {/* Quick Demo Leaf Samples */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              {t.disease.orSample}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {sampleLeaves.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    borderRadius: 'var(--radius-pill)',
                    background: '#FFFFFF',
                    border: '1px solid var(--color-border-strong)',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  🍃 {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Analyze CTA */}
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={!imagePreview || analyzing}
            onClick={handleRunAnalysis}
            style={{ minHeight: '52px', fontSize: '1.05rem' }}
          >
            {analyzing ? (
              <>
                <RefreshCw size={18} className="spin" />
                <span>{t.disease.analyzing}</span>
              </>
            ) : (
              <>
                <Eye size={18} />
                <span>{t.disease.analyzeBtn}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Diagnostic Report & Action Plan */}
        <div>
          {scanError && (
            <div className="card" style={{ borderLeft: '6px solid var(--color-terracotta)', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <AlertTriangle size={22} color="var(--color-terracotta)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{scanError}</div>
            </div>
          )}
          {diagnosis?.isOfflineEstimate && (
            <div style={{ backgroundColor: '#FEF3C7', border: '1.5px solid #F59E0B', color: '#92400E', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '16px', fontSize: '0.88rem', lineHeight: 1.5 }}>
              {lang === 'hi'
                ? '⚠️ ऑफलाइन अनुमान: यह परिणाम केवल पत्ती के रंगों के आधार पर है, AI से नहीं। इंटरनेट मिलने पर दोबारा स्कैन करें या कृषि विज्ञान केंद्र से पुष्टि करें।'
                : lang === 'mr'
                ? '⚠️ ऑफलाइन अंदाज: हा निकाल फक्त पानाच्या रंगांवर आधारित आहे, AI ने केलेला नाही. इंटरनेट आल्यावर पुन्हा स्कॅन करा किंवा कृषी विज्ञान केंद्राकडून खात्री करा.'
                : '⚠️ Offline estimate: this result is based only on leaf colour patterns, not the AI. Re-scan when you are online, or confirm with your Krishi Vigyan Kendra before spraying.'}
            </div>
          )}
          {diagnosis ? (
            <div className="card" style={{ borderLeft: `6px solid ${diagnosis.severity === 'None' ? 'var(--color-leaf-green)' : 'var(--color-terracotta)'}` }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <span className={`badge ${diagnosis.severity === 'None' ? 'badge-leaf' : 'badge-terracotta'}`} style={{ marginBottom: '6px' }}>
                    {diagnosis.severity === 'None' ? (lang === 'hi' ? 'स्वस्थ पत्ती' : lang === 'mr' ? 'निरोगी पान' : 'Healthy Tissue') : `${diagnosis.severity} ${lang === 'hi' ? 'गंभीरता' : lang === 'mr' ? 'तीव्रता' : 'Severity Alert'}`}
                  </span>
                  <h2 style={{ fontSize: '1.65rem', color: 'var(--color-primary-forest)' }}>
                    {diagnosis.detectedDisease}
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {lang === 'hi' ? 'फसल:' : lang === 'mr' ? 'पीक:' : 'Crop:'} {translateCropName(diagnosis.crop, lang)} • {diagnosis.scientificName}
                  </div>
                </div>

                <AudioSpeaker
                  text={`${diagnosis.detectedDisease}. ${diagnosis.actionPlan.join('. ')}. ${diagnosis.biologicalRemedy}`}
                  lang={lang}
                  label={lang === 'hi' ? 'उपचार सुनें' : lang === 'mr' ? 'उपचार ऐका' : 'Listen to Prescription'}
                />
              </div>

              {/* Confidence Meter */}
              <div style={{ marginBottom: '20px', padding: '14px', background: 'var(--color-canvas-surface)', borderRadius: 'var(--radius-md)' }}>
                {diagnosis.confidence != null && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{t.disease.confidence}:</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary-forest)' }}>{diagnosis.confidence}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--color-canvas-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${diagnosis.confidence}%`, height: '100%', background: diagnosis.confidence >= 70 ? 'var(--color-leaf-green)' : 'var(--color-accent-wheat)', borderRadius: '4px' }} />
                    </div>
                  </>
                )}
                {diagnosis.inferenceEngine && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                    {lang === 'hi' ? 'विश्लेषण:' : lang === 'mr' ? 'विश्लेषण:' : 'Analysed by:'} {diagnosis.inferenceEngine}
                  </div>
                )}
                {diagnosis.visualSymptoms && (
                  <div style={{ fontSize: '0.85rem', marginTop: '8px', lineHeight: 1.5 }}>
                    <strong>{lang === 'hi' ? 'दिखे लक्षण:' : lang === 'mr' ? 'दिसलेली लक्षणे:' : 'Visible symptoms:'}</strong> {diagnosis.visualSymptoms}
                  </div>
                )}
              </div>

              {/* Immediate Cultural Actions */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--color-primary-forest)', marginBottom: '8px' }}>
                  🚨 {t.disease.immediateAction}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {diagnosis.actionPlan.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.88rem' }}>
                      <CheckCircle2 size={16} color="var(--color-leaf-green)" style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Biological & Chemical Treatments */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '12px 16px', background: 'var(--color-leaf-light)', borderRadius: 'var(--radius-sm)', border: '1px solid #D2E4D4' }}>
                  <strong style={{ color: 'var(--color-leaf-green)', fontSize: '0.85rem' }}>🌿 {t.disease.biological}:</strong>
                  <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>{diagnosis.biologicalRemedy}</div>
                </div>

                <div style={{ padding: '12px 16px', background: 'var(--color-canvas-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
                  <strong style={{ color: 'var(--color-text-main)', fontSize: '0.85rem' }}>🧪 {t.disease.chemical}:</strong>
                  <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>{diagnosis.chemicalTreatment}</div>
                </div>
              </div>

              {/* Prevention Advice */}
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '12px', marginBottom: '20px' }}>
                <strong>🛡️ {t.disease.prevention}:</strong> {diagnosis.preventionGuide}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigate('ai-agronomist')}
                >
                  <span>{lang === 'hi' ? 'कृषि विशेषज्ञ से पूछें' : lang === 'mr' ? 'कृषी मित्राला विचारा' : 'Ask AI Agronomist Follow-up'}</span>
                </button>
              </div>
            </div>
          ) : !scanError && (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ color: 'var(--color-border-strong)', marginBottom: '12px' }}>
                <AlertTriangle size={42} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                {lang === 'hi' ? 'अभी तक कोई जांच नहीं की गई' : lang === 'mr' ? 'अद्याप कोणतीही तपासणी केलेली नाही' : 'No Scan Performed Yet'}
              </h3>
              <p style={{ fontSize: '0.88rem', maxWidth: '380px', margin: '0 auto', color: 'var(--color-text-muted)' }}>
                {lang === 'hi'
                  ? 'रोग की त्वरित जांच के लिए बाईं ओर पत्ती की फोटो अपलोड करें या नमुना चुनें।'
                  : lang === 'mr'
                  ? 'पानावरील रोगाची तात्काळ तपासणी करण्यासाठी डाव्या बाजूला फोटो निवडा.'
                  : 'Upload or select a leaf photo on the left, then tap Scan to get an AI diagnosis.'}
              </p>
            </div>
          )}

          {/* Offline Scans History Box */}
          {offlineHistory.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '10px' }}>
                💾 {t.disease.savedScans} ({offlineHistory.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {offlineHistory.slice(0, 3).map((item, idx) => (
                  <div key={idx} style={{ padding: '8px 12px', background: '#FFFFFF', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{translateCropName(item.crop, lang)}: <strong>{item.detectedDisease}</strong> ({lang === 'hi' ? 'ऑफलाइन अनुमान' : lang === 'mr' ? 'ऑफलाइन अंदाज' : 'offline estimate'})</span>
                    <span style={{ color: 'var(--color-leaf-green)' }}>{lang === 'hi' ? 'फोन में सुरक्षित' : lang === 'mr' ? 'फोनमध्ये सेव्ह' : 'Saved locally'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
