import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, AlertTriangle, CheckCircle2, ShieldCheck, Wifi, WifiOff, RefreshCw, Eye } from 'lucide-react';
import { EdgeAiDiseaseScanner } from '../services/edgeAiDiseaseScanner.js';
import { api } from '../services/api.js';
import { offlineStorage } from '../services/offlineStorage.js';
import { AudioSpeaker } from '../components/AudioSpeaker.jsx';
import { getTranslation, translateCropName } from '../services/i18n.js';

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

  // Sample Demo Leaf Images for quick 1-click testing
  const sampleLeaves = [
    { label: t.disease.sampleBlight, crop: 'Tomato', color: '#D4A373', type: 'blight', file: 'tomato_early_blight.jpg' },
    { label: t.disease.samplePurple, crop: 'Onion', color: '#B08968', type: 'purple', file: 'onion_purple_blotch.jpg' },
    { label: t.disease.sampleRust, crop: 'Wheat', color: '#E9C46A', type: 'rust', file: 'wheat_stripe_rust.jpg' },
    { label: t.disease.sampleHealthy, crop: 'Tomato', color: '#386641', type: 'healthy', file: 'healthy_crop_leaf.jpg' }
  ];

  const handleSelectSample = (sample) => {
    setSelectedCrop(sample.crop);
    setUploadedFileName(sample.file);
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = sample.type === 'healthy' ? '#2E6F40' : '#4E6A38';
    ctx.beginPath();
    ctx.ellipse(160, 160, 110, 140, Math.PI / 4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = '#275231';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(70, 70);
    ctx.lineTo(250, 250);
    ctx.stroke();

    if (sample.type === 'blight') {
      ctx.fillStyle = '#4A2810';
      ctx.beginPath();
      ctx.arc(140, 140, 30, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#C89D30';
      ctx.beginPath();
      ctx.arc(140, 140, 42, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (sample.type === 'rust') {
      ctx.fillStyle = '#E59819';
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(100 + (i * 18), 100 + (i * 18), 12, 35);
      }
    }

    const dataUrl = canvas.toDataURL('image/jpeg');
    setImagePreview(dataUrl);
    setDiagnosis(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name || '');
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setDiagnosis(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRunAnalysis = async () => {
    if (!imagePreview) return;
    setAnalyzing(true);

    try {
      let result = null;

      // When online, call backend API first (which supports Gemini Vision and server pathology engine)
      if (!isOffline) {
        try {
          const apiRes = await api.diagnoseDisease({
            cropName: selectedCrop,
            imageBase64: imagePreview,
            fileName: uploadedFileName,
            isOffline: false
          });
          if (apiRes && apiRes.data) {
            result = apiRes.data;
          }
        } catch (serverErr) {
          console.warn('Backend diagnosis endpoint unreachable or offline, using edge AI:', serverErr);
        }
      }

      // If offline or backend failed/fell back, execute browser Edge AI scan
      if (!result) {
        result = await EdgeAiDiseaseScanner.scanLeaf(imagePreview, selectedCrop, isOffline, uploadedFileName);
      }

      setDiagnosis(result);
      loadOfflineHistory();
    } catch (err) {
      console.error('Scan error:', err);
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
              <option value="Tomato">{translateCropName('Tomato', lang)}</option>
              <option value="Onion">{translateCropName('Onion', lang)}</option>
              <option value="Wheat">{translateCropName('Wheat', lang)}</option>
              <option value="Cotton">{translateCropName('Cotton', lang)}</option>
              <option value="Potato">{translateCropName('Potato', lang)}</option>
              <option value="Chilli">{translateCropName('Chilli', lang)}</option>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{t.disease.confidence}:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary-forest)' }}>{diagnosis.confidence}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--color-canvas-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${diagnosis.confidence}%`, height: '100%', background: 'var(--color-leaf-green)', borderRadius: '4px' }} />
                </div>
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
          ) : (
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
                  : 'Upload or select a leaf photo on the left to run local on-device machine learning diagnostic inspection.'}
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
                    <span>{translateCropName(item.crop, lang)}: <strong>{item.detectedDisease}</strong> ({item.confidence}%)</span>
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
