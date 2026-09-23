import React, { useState } from 'react';
import { Sprout, Globe, User, ChevronDown, Check } from 'lucide-react';
import { OfflineIndicatorPill } from './OfflineBadge.jsx';
import { LiveClock } from './LiveClock.jsx';

export function Navbar({ currentRoute, onNavigate, lang, onLanguageChange, activeProfile, onSwitchProfile }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', mr: 'मुख्य', hi: 'होम' },
    { id: 'dashboard', label: 'Dashboard', mr: 'डॅशबोर्ड', hi: 'डैशबोर्ड' },
    { id: 'crop-advisor', label: 'Crop Advisor', mr: 'पीक सल्ला', hi: 'फसल सलाह' },
    { id: 'disease-scan', label: 'Disease Scan', mr: 'रोग निदान', hi: 'रोग जांच' },
    { id: 'smart-mandi', label: 'Smart Mandi', mr: 'स्मार्ट मंडी', hi: 'स्मार्ट मंडी' },
    { id: 'weather-alerts', label: 'Weather & Alerts', mr: 'हवामान', hi: 'मौसम' },
    { id: 'ai-agronomist', label: 'AI Agronomist', mr: 'कृषी मित्र', hi: 'कृषि मित्र' },
    { id: 'schemes', label: 'Govt Schemes', mr: 'योजना', hi: 'योजनाएं' },
    { id: 'my-farm', label: 'My Farm', mr: 'माझे शेत', hi: 'मेरा खेत' },
    { id: 'technology', label: 'Academic & UX', mr: 'तंत्रज्ञान', hi: 'तकनीक' }
  ];

  const getLabel = (item) => {
    if (lang === 'mr') return item.mr;
    if (lang === 'hi') return item.hi;
    return item.label;
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        {/* Brand Logo */}
        <a href="#home" className="brand-logo" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>
          <div style={{ padding: '8px', background: 'var(--color-leaf-light)', borderRadius: 'var(--radius-md)', color: 'var(--color-primary-forest)', display: 'flex' }}>
            <Sprout size={24} />
          </div>
          <div>
            <div className="brand-title">Smart Farmer</div>
            <div className="brand-sub">कृषि निर्णय सहायक</div>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="nav-links-desktop" aria-label="Main Navigation">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`nav-link ${currentRoute === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                {getLabel(item)}
              </button>
            </li>
          ))}
        </nav>

        {/* Header Actions */}
        <div className="header-actions">
          <LiveClock compact={false} showDate={false} lang={lang} />
          <OfflineIndicatorPill />

          {/* Language Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ minHeight: '36px', padding: '0 10px', gap: '4px' }}
              onClick={() => { setShowLangMenu(!showLangMenu); setShowProfileMenu(false); }}
              aria-label="Change Language"
            >
              <Globe size={15} />
              <span style={{ textTransform: 'uppercase', fontSize: '0.78rem' }}>{lang}</span>
              <ChevronDown size={13} />
            </button>

            {showLangMenu && (
              <div style={{
                position: 'absolute',
                top: '42px',
                right: 0,
                background: '#FFFFFF',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                zIndex: 200,
                minWidth: '130px',
                padding: '4px'
              }}>
                {[
                  { code: 'en', label: 'English' },
                  { code: 'hi', label: 'हिन्दी (Hindi)' },
                  { code: 'mr', label: 'मराठी (Marathi)' }
                ].map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      background: lang === l.code ? 'var(--color-canvas-surface)' : 'transparent',
                      color: lang === l.code ? 'var(--color-primary-forest)' : 'var(--color-text-main)',
                      fontWeight: lang === l.code ? 700 : 500,
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onClick={() => {
                      onLanguageChange(l.code);
                      setShowLangMenu(false);
                    }}
                  >
                    <span>{l.label}</span>
                    {lang === l.code && <Check size={14} color="var(--color-primary-forest)" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile & Demo Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ minHeight: '36px', padding: '0 12px', gap: '6px' }}
              onClick={() => { setShowProfileMenu(!showProfileMenu); setShowLangMenu(false); }}
              aria-label="User Profile"
            >
              <User size={15} />
              <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeProfile?.fullName || 'Farmer'}
              </span>
              <ChevronDown size={13} />
            </button>

            {showProfileMenu && (
              <div style={{
                position: 'absolute',
                top: '42px',
                right: 0,
                background: '#FFFFFF',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                zIndex: 200,
                minWidth: '220px',
                padding: '8px'
              }}>
                <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border-subtle)', marginBottom: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Current Active Context</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-primary-forest)', fontSize: '0.9rem' }}>{activeProfile?.fullName}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-leaf-green)' }}>{activeProfile?.district}, {activeProfile?.state} ({activeProfile?.currentCrop})</div>
                </div>

                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', padding: '4px 8px' }}>SWITCH DEMO PERSONA:</div>
                <button
                  type="button"
                  style={{ width: '100%', textAlign: 'left', padding: '6px 8px', fontSize: '0.82rem', background: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  onClick={() => { onSwitchProfile(1); setShowProfileMenu(false); }}
                >
                  👨🏽‍🌾 <strong>Ramesh Patil</strong> (Smallholder - Nashik Tomato)
                </button>
                <button
                  type="button"
                  style={{ width: '100%', textAlign: 'left', padding: '6px 8px', fontSize: '0.82rem', background: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  onClick={() => { onSwitchProfile(2); setShowProfileMenu(false); }}
                >
                  🚜 <strong>Rajesh Sharma</strong> (Progressive - Karnal Wheat)
                </button>
                <hr style={{ margin: '6px 0', border: 'none', borderTop: '1px solid var(--color-border-subtle)' }} />
                <button
                  type="button"
                  style={{ width: '100%', textAlign: 'left', padding: '6px 8px', fontSize: '0.82rem', color: 'var(--color-primary-forest)', fontWeight: 600, background: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  onClick={() => { onNavigate('my-farm'); setShowProfileMenu(false); }}
                >
                  ⚙️ Manage Farm Details
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
