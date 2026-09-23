import React from 'react';
import { Sprout, Heart, ShieldCheck } from 'lucide-react';
import { getTranslation } from '../services/i18n.js';

export function Footer({ onNavigate, lang }) {
  const t = getTranslation(lang);

  return (
    <footer style={{
      backgroundColor: 'var(--color-canvas-dark)',
      color: '#ECE6DA',
      padding: '48px 0 32px 0',
      marginTop: 'auto',
      borderTop: '1px solid rgba(255,255,255,0.08)'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '32px',
          marginBottom: '36px'
        }}>
          {/* Column 1: Brand & Mission */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFFFFF', marginBottom: '12px' }}>
              <div style={{ padding: '6px', background: 'rgba(56, 102, 65, 0.4)', borderRadius: '6px', color: '#88D49E' }}>
                <Sprout size={20} />
              </div>
              <span style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.25rem', fontWeight: 700 }}>{t.brandName}</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#A3B0A7', lineHeight: 1.6 }}>
              {t.footer.mission}
            </p>
            <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#88D49E', background: 'rgba(56, 102, 65, 0.25)', padding: '4px 10px', borderRadius: '999px' }}>
              <ShieldCheck size={14} /> {t.footer.usabilityBadge}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', fontFamily: 'var(--font-ui)' }}>{t.footer.journeysTitle}</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><button type="button" onClick={() => onNavigate('dashboard')} style={{ background: 'none', color: '#A3B0A7', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', border: 'none', padding: 0 }}>{t.nav.dashboard}</button></li>
              <li><button type="button" onClick={() => onNavigate('crop-advisor')} style={{ background: 'none', color: '#A3B0A7', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', border: 'none', padding: 0 }}>{t.nav.cropAdvisor}</button></li>
              <li><button type="button" onClick={() => onNavigate('disease-scan')} style={{ background: 'none', color: '#A3B0A7', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', border: 'none', padding: 0 }}>{t.nav.diseaseScan}</button></li>
              <li><button type="button" onClick={() => onNavigate('smart-mandi')} style={{ background: 'none', color: '#A3B0A7', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', border: 'none', padding: 0 }}>{t.nav.smartMandi}</button></li>
              <li><button type="button" onClick={() => onNavigate('weather-alerts')} style={{ background: 'none', color: '#A3B0A7', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', border: 'none', padding: 0 }}>{t.nav.weatherAlerts}</button></li>
              <li><button type="button" onClick={() => onNavigate('ai-agronomist')} style={{ background: 'none', color: '#A3B0A7', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', border: 'none', padding: 0 }}>{t.nav.aiAgronomist}</button></li>
            </ul>
          </div>

          {/* Column 3: Indian Farmer Support & Helpline */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', fontFamily: 'var(--font-ui)' }}>{t.footer.supportTitle}</h4>
            <p style={{ fontSize: '0.85rem', color: '#A3B0A7', lineHeight: 1.6, marginBottom: '12px' }}>
              {t.footer.supportDesc}
            </p>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'inline-block'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#88D49E', fontWeight: 700, textTransform: 'uppercase' }}>{t.footer.kisanCallCentre}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>📞 1800-180-1551</div>
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '24px 0' }} />

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '0.8rem',
          color: '#79877F'
        }}>
          <div>
            {t.footer.rights}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Heart size={14} color="#BC4749" fill="#BC4749" /> {t.footer.loveForAgri}
          </div>
        </div>
      </div>
    </footer>
  );
}
