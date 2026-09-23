import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, CheckCircle2, ExternalLink, Filter } from 'lucide-react';
import { api } from '../services/api.js';
import { AudioSpeaker } from '../components/AudioSpeaker.jsx';
import { getTranslation, translateCropName } from '../services/i18n.js';

export function GovernmentSchemesPage({ activeProfile, lang }) {
  const t = getTranslation(lang);
  const [schemes, setSchemes] = useState([]);
  const [cropFilter, setCropFilter] = useState('All');
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchemes();
  }, [cropFilter]);

  const loadSchemes = async () => {
    setLoading(true);
    try {
      const data = await api.getGovernmentSchemes(cropFilter, '', activeProfile?.state || 'Maharashtra');
      setSchemes(data);
      if (data.length > 0 && !selectedScheme) {
        setSelectedScheme(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { key: 'All', label: t.schemes.allCrops },
    { key: 'Tomato', label: translateCropName('Tomato', lang) },
    { key: 'Wheat', label: translateCropName('Wheat', lang) },
    { key: 'Rice', label: translateCropName('Rice', lang) },
    { key: 'Onion', label: translateCropName('Onion', lang) },
    { key: 'Horticulture', label: translateCropName('Horticulture', lang) }
  ];

  return (
    <div className="container" style={{ padding: '36px var(--space-md) 64px var(--space-md)' }}>
      {/* Header */}
      <div style={{ maxWidth: '800px', marginBottom: '28px' }}>
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-leaf-green)', fontWeight: 700 }}>
          {t.schemes.phase}
        </span>
        <h1 style={{ marginTop: '4px', marginBottom: '8px', color: 'var(--color-primary-forest)' }}>
          {t.schemes.title}
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>
          {t.schemes.subtitle}
        </p>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '32px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Filter size={15} /> {t.schemes.filterCrop}
        </span>
        {categories.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`btn btn-sm ${cropFilter === c.key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ minHeight: '34px', padding: '0 14px', fontSize: '0.82rem' }}
            onClick={() => setCropFilter(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 2-Column Scheme Directory */}
      <div className="grid-2" style={{ gap: '32px', alignItems: 'flex-start' }}>
        {/* Left Column: Scheme Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {schemes.map((scheme) => {
            const isSelected = selectedScheme?.id === scheme.id;
            return (
              <div
                key={scheme.id}
                className="card"
                onClick={() => setSelectedScheme(scheme)}
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--color-primary-forest)' : '1px solid var(--color-border-subtle)',
                  backgroundColor: isSelected ? '#FFFFFF' : 'var(--color-canvas-surface)',
                  boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
                  padding: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className="badge badge-wheat">{scheme.nodal_ministry}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-leaf-green)' }}>{t.schemes.verifiedBadge}</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--color-primary-forest)', marginBottom: '6px' }}>
                  {scheme.scheme_name}
                </h3>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-leaf-green)', marginBottom: '8px' }}>
                  {scheme.financial_assistance}
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                  {scheme.benefits_summary}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right Column: Detailed Application Guide & Checklist */}
        {selectedScheme ? (
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="badge badge-forest" style={{ marginBottom: '6px' }}>{lang === 'hi' ? 'योजना विवरण' : lang === 'mr' ? 'योजना तपशील' : 'Scheme Dossier'}</span>
                <h2 style={{ fontSize: '1.65rem', color: 'var(--color-primary-forest)' }}>
                  {selectedScheme.scheme_name}
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {t.schemes.nodalMinistry}: {selectedScheme.nodal_ministry}
                </div>
              </div>

              <AudioSpeaker
                text={`${selectedScheme.scheme_name}. ${selectedScheme.benefits_summary}. ${selectedScheme.beneficiary_criteria}.`}
                lang={lang}
                label={lang === 'hi' ? 'योजना सुनें' : lang === 'mr' ? 'योजना ऐका' : 'Listen'}
              />
            </div>

            {/* Financial Benefit Banner */}
            <div style={{ padding: '14px 18px', background: 'var(--color-leaf-light)', borderRadius: 'var(--radius-sm)', border: '1px solid #D2E4D4', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-leaf-green)', fontWeight: 700, textTransform: 'uppercase' }}>{t.schemes.financialAssistance}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1B382B', marginTop: '2px' }}>
                {selectedScheme.financial_assistance}
              </div>
            </div>

            {/* Eligibility */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--color-primary-forest)', marginBottom: '6px' }}>
                👤 {t.schemes.eligibility}:
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                {selectedScheme.beneficiary_criteria}
              </p>
            </div>

            {/* Step-by-Step Application Process */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--color-primary-forest)', marginBottom: '8px' }}>
                📝 {lang === 'hi' ? 'आवेदन करने की प्रक्रिया:' : lang === 'mr' ? 'अर्ज करण्याची पद्धत:' : 'Step-by-Step Application Process:'}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                {selectedScheme.application_process.split('\n').map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <CheckCircle2 size={16} color="var(--color-leaf-green)" style={{ flexShrink: 0, marginTop: '3px' }} />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Required Documents Checklist */}
            <div style={{ marginBottom: '24px', padding: '14px', background: 'var(--color-canvas-surface)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary-forest)', marginBottom: '6px' }}>
                <FileText size={16} /> {t.schemes.documents}:
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>
                {selectedScheme.required_documents}
              </div>
            </div>

            {/* Official Source Link */}
            {selectedScheme.official_portal_url && (
              <div>
                <a
                  href={selectedScheme.official_portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', gap: '8px' }}
                >
                  <span>{t.schemes.applyLink}</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>
              {lang === 'hi'
                ? 'पात्रता और दस्तावेजों की जानकारी के लिए बाईं ओर किसी योजना पर क्लिक करें।'
                : lang === 'mr'
                ? 'पात्रता व कागदपत्रांची माहिती पाहण्यासाठी डाव्या बाजूला योजनेवर क्लिक करा.'
                : 'Select a government scheme on the left to review eligibility criteria and required documents.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
