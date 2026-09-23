import React, { useState, useEffect } from 'react';
import { SidebarNav } from './components/SidebarNav.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { OfflineBadge } from './components/OfflineBadge.jsx';
import { Footer } from './components/Footer.jsx';

import { LandingPage } from './pages/LandingPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { CropAdvisorPage } from './pages/CropAdvisorPage.jsx';
import { DiseaseScanPage } from './pages/DiseaseScanPage.jsx';
import { SmartMandiPage } from './pages/SmartMandiPage.jsx';
import { WeatherAlertsPage } from './pages/WeatherAlertsPage.jsx';
import { AiAgronomistPage } from './pages/AiAgronomistPage.jsx';
import { GovernmentSchemesPage } from './pages/GovernmentSchemesPage.jsx';
import { MyFarmPage } from './pages/MyFarmPage.jsx';
import { TechnologyAboutPage } from './pages/TechnologyAboutPage.jsx';

import { Menu, Globe, User, LogIn } from 'lucide-react';
import { LiveClock } from './components/LiveClock.jsx';
import { translateCropName } from './services/i18n.js';
import './styles/sidebar.css';

export function App() {
  const [currentRoute, setCurrentRoute] = useState('home');
  const [lang, setLang] = useState(() => localStorage.getItem('sfas_lang') || 'en');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('sfas_authenticated'));
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Sidebar states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Active Profile Context — Isolated per authenticated user
  const [activeProfile, setActiveProfile] = useState(() => {
    const saved = localStorage.getItem('sfas_active_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('sfas_lang', newLang);
  };

  const handleLoginSuccess = (profileData) => {
    setIsAuthenticated(true);
    localStorage.setItem('sfas_authenticated', 'true');
    setActiveProfile(profileData);
    localStorage.setItem('sfas_active_profile', JSON.stringify(profileData));
    setCurrentRoute('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('sfas_authenticated');
    localStorage.removeItem('sfas_active_profile');
    setActiveProfile(null);
    setCurrentRoute('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (route) => {
    setCurrentRoute(route);
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateProfile = (updated) => {
    setActiveProfile((prev) => {
      const merged = { ...prev, ...updated };
      localStorage.setItem('sfas_active_profile', JSON.stringify(merged));
      return merged;
    });
  };

  const effectiveProfile = activeProfile || {
    id: 0,
    fullName: lang === 'hi' ? 'किसान भाई' : lang === 'mr' ? 'शेतकरी बंधू' : 'Farmer',
    phone: '',
    district: lang === 'hi' || lang === 'mr' ? 'भारत' : 'India',
    state: lang === 'hi' || lang === 'mr' ? 'भारत' : 'India',
    farmName: lang === 'hi' ? 'मेरा खेत प्लॉट' : lang === 'mr' ? 'माझे शेत प्लॉट' : 'My Farm Plot',
    landSize: 2.0,
    soilType: 'Black Soil (Regur)',
    waterReliability: 'Moderately Reliable',
    currentCrop: 'Tomato',
    cropStage: 'Vegetative Stage',
    farmerType: 'Farmer'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F6F0', fontFamily: 'var(--font-ui)' }}>
      {/* Offline Status Top Banner */}
      <OfflineBadge lang={lang} />

      {/* Auth Modal for Login & Registration */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
        lang={lang}
      />

      {/* CURVED SIDEBAR NAVIGATION - Visible when inside any tool section (not on public landing page) */}
      {currentRoute !== 'home' && (
        <SidebarNav
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          activeProfile={effectiveProfile}
          onLogout={handleLogout}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          lang={lang}
        />
      )}

      {/* Top Header Bar for App - Not shown on landing page */}
      {currentRoute !== 'home' && (
        <div style={{
          marginLeft: isSidebarCollapsed ? '78px' : '240px',
          transition: 'margin-left var(--transition-smooth)',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid var(--color-border-subtle)',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Mobile-only Menu Toggle Button (hidden on desktop screens) */}
            <button
              type="button"
              className="header-mobile-toggle"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>

            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary-forest)', textTransform: 'capitalize' }}>
              📍 {effectiveProfile.farmName} • {effectiveProfile.district} ({translateCropName(effectiveProfile.currentCrop, lang)})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Live Clock Component */}
            <LiveClock showSeconds={true} showDate={true} lang={lang} />

            {/* Language Picker */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--color-canvas-surface)', padding: '3px', borderRadius: '999px' }}>
              {['en', 'hi', 'mr'].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => handleLanguageChange(l)}
                  style={{
                    border: 'none',
                    borderRadius: '999px',
                    padding: '3px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    background: lang === l ? '#112019' : 'transparent',
                    color: lang === l ? '#FFFFFF' : '#4B5550'
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleNavigate('my-farm')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--color-canvas-surface)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '999px',
                padding: '5px 12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                color: '#112019'
              }}
            >
              <User size={14} />
              <span>{activeProfile?.fullName || (lang === 'hi' ? 'मेरा प्रोफाइल' : lang === 'mr' ? 'माझे प्रोफाइल' : 'My Profile')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        style={{
          marginLeft: currentRoute !== 'home' ? (isSidebarCollapsed ? '78px' : '240px') : '0',
          transition: 'margin-left var(--transition-smooth)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <main style={{ flex: 1 }}>
          {currentRoute === 'home' && (
            <LandingPage
              onNavigate={handleNavigate}
              lang={lang}
              onLanguageChange={handleLanguageChange}
              onOpenAuth={() => setShowAuthModal(true)}
            />
          )}

          {currentRoute === 'dashboard' && (
            <DashboardPage
              onNavigate={handleNavigate}
              activeProfile={effectiveProfile}
              lang={lang}
            />
          )}

          {currentRoute === 'crop-advisor' && (
            <CropAdvisorPage
              activeProfile={effectiveProfile}
              lang={lang}
              onNavigate={handleNavigate}
            />
          )}

          {currentRoute === 'disease-scan' && (
            <DiseaseScanPage
              activeProfile={effectiveProfile}
              lang={lang}
              onNavigate={handleNavigate}
            />
          )}

          {currentRoute === 'smart-mandi' && (
            <SmartMandiPage
              activeProfile={effectiveProfile}
              lang={lang}
              onNavigate={handleNavigate}
            />
          )}

          {currentRoute === 'weather-alerts' && (
            <WeatherAlertsPage
              activeProfile={effectiveProfile}
              lang={lang}
              onNavigate={handleNavigate}
            />
          )}

          {currentRoute === 'ai-agronomist' && (
            <AiAgronomistPage
              activeProfile={effectiveProfile}
              lang={lang}
              onNavigate={handleNavigate}
            />
          )}

          {currentRoute === 'schemes' && (
            <GovernmentSchemesPage
              activeProfile={effectiveProfile}
              lang={lang}
            />
          )}

          {currentRoute === 'my-farm' && (
            <MyFarmPage
              activeProfile={effectiveProfile}
              onUpdateProfile={handleUpdateProfile}
              lang={lang}
            />
          )}

          {currentRoute === 'technology' && (
            <TechnologyAboutPage lang={lang} />
          )}
        </main>

        {/* Footer shown ONLY on public landing page, not inside tool sections */}
        {currentRoute === 'home' && <Footer onNavigate={handleNavigate} lang={lang} />}
      </div>
    </div>
  );
}

export default App;
