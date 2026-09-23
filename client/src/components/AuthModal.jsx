import React, { useState } from 'react';
import { Sprout, Lock, Mail, Phone, MapPin, User, ArrowRight, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { api } from '../services/api.js';
import { getTranslation, translateCropName } from '../services/i18n.js';

export function AuthModal({ isOpen, onClose, onLoginSuccess, lang = 'en' }) {
  const t = getTranslation(lang);
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Registration fields
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('');
  const [landSize, setLandSize] = useState(2.5);
  const [soilType, setSoilType] = useState('Black Soil (Regur)');
  const [crop, setCrop] = useState('Tomato');

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Comprehensive list of all Indian States & Union Territories
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Delhi (NCR)', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
    'Jammu & Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setErrorMsg(
        lang === 'hi'
          ? 'कृपया ईमेल और पासवर्ड दोनों दर्ज करें।'
          : lang === 'mr'
          ? 'कृपया ईमेल आणि पासवर्ड दोन्ही प्रविष्ट करा.'
          : 'Please enter both email and password.'
      );
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.login(email, password);
      onLoginSuccess({
        id: res.user.id,
        fullName: res.user.fullName,
        email: res.user.email,
        district: res.profile?.district || 'India',
        state: res.profile?.state || 'India',
        farmName: res.farm?.farm_name || `${res.user.fullName}'s Farm`,
        landSize: res.farm?.land_size_acres || 2.5,
        soilType: res.farm?.soil_type || 'Black Soil (Regur)',
        waterReliability: res.farm?.water_reliability || 'Moderately Reliable',
        currentCrop: res.farm?.current_crop || 'Tomato',
        cropStage: res.farm?.crop_stage || 'Flowering to Fruit Set',
        farmerType: res.profile?.farmer_type || 'Farmer'
      });
      onClose();
    } catch (err) {
      setErrorMsg(
        lang === 'hi'
          ? 'अमान्य ईमेल या पासवर्ड। कृपया पुनः प्रयास करें।'
          : lang === 'mr'
          ? 'अवैध ईमेल किंवा पासवर्ड. कृपया पुन्हा प्रयत्न करा.'
          : err.message || 'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    if (!fullName || !regEmail || !regPassword) {
      setErrorMsg(
        lang === 'hi'
          ? 'कृपया अपना नाम, ईमेल और पासवर्ड भरें।'
          : lang === 'mr'
          ? 'कृपया आपले नाव, ईमेल आणि पासवर्ड भरा.'
          : 'Please fill in your name, email, and password.'
      );
      return;
    }
    if (regPassword.length < 4) {
      setErrorMsg(
        lang === 'hi'
          ? 'पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।'
          : lang === 'mr'
          ? 'पासवर्ड किमान 4 अक्षरांचा असावा.'
          : 'Password should be at least 4 characters long.'
      );
      return;
    }
    if (regPassword !== confirmPassword) {
      setErrorMsg(
        lang === 'hi'
          ? 'पासवर्ड मेल नहीं खाते। कृपया पुनः जांचें।'
          : lang === 'mr'
          ? 'पासवर्ड जुळत नाहीत. कृपया पुन्हा तपासा.'
          : 'Passwords do not match. Please re-enter.'
      );
      return;
    }
    if (!district.trim()) {
      setErrorMsg(
        lang === 'hi'
          ? 'कृपया अपना जिला / तालुका दर्ज करें।'
          : lang === 'mr'
          ? 'कृपया आपला जिल्हा / तालुका प्रविष्ट करा.'
          : 'Please enter your District / Taluka location.'
      );
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.register({
        email: regEmail,
        password: regPassword,
        fullName,
        phone: phone || '+91 90000 00000',
        district: district.trim(),
        state,
        farmerType: landSize > 5 ? 'Progressive Farmer (> 5 Ha)' : 'Smallholder Farmer (< 2 Ha)'
      });
      onLoginSuccess({
        id: res.user.id,
        fullName: res.user.fullName,
        email: res.user.email,
        district: district.trim(),
        state,
        farmName: `${fullName}'s Farm Plot`,
        landSize: Number(landSize),
        soilType,
        waterReliability: 'Moderately Reliable',
        currentCrop: crop,
        cropStage: 'Vegetative Stage',
        farmerType: landSize > 5 ? 'Progressive Farmer (> 5 Ha)' : 'Smallholder Farmer (< 2 Ha)'
      });
      onClose();
    } catch (err) {
      setErrorMsg(
        lang === 'hi'
          ? 'पंजीकरण विफल हुआ। कृपया अपनी जानकारी पुनः जांचें।'
          : lang === 'mr'
          ? 'नोंदणी अयशस्वी झाली. कृपया माहिती पुन्हा तपासा.'
          : err.message || 'Registration failed. Please check your information.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(17, 32, 25, 0.78)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        border: '1.5px solid var(--color-border-subtle)',
        width: '100%',
        maxWidth: '540px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 24px 54px rgba(0, 0, 0, 0.28)',
        position: 'relative',
        fontFamily: 'var(--font-ui)'
      }}>
        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              background: 'var(--color-canvas-surface)',
              border: 'none',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              zIndex: 10
            }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        )}

        {/* Brand Header */}
        <div style={{ padding: '32px 32px 18px 32px', textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            backgroundColor: '#112019',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}>
            <Sprout size={28} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#112019', marginBottom: '4px' }}>
            {t.auth.portalTitle}
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#57625B' }}>
            {t.auth.portalSub}
          </p>

          {/* Tab Switcher */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid var(--color-border-subtle)',
            marginTop: '22px'
          }}>
            <button
              type="button"
              onClick={() => { setTab('login'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '12px 0',
                fontWeight: 700,
                fontSize: '0.95rem',
                background: 'none',
                border: 'none',
                borderBottom: tab === 'login' ? '3px solid #112019' : '3px solid transparent',
                color: tab === 'login' ? '#112019' : 'var(--color-text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {t.auth.signInTab}
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '12px 0',
                fontWeight: 700,
                fontSize: '0.95rem',
                background: 'none',
                border: 'none',
                borderBottom: tab === 'register' ? '3px solid #112019' : '3px solid transparent',
                color: tab === 'register' ? '#112019' : 'var(--color-text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {t.auth.registerTab}
            </button>
          </div>
        </div>

        {/* Error message alert */}
        {errorMsg && (
          <div style={{
            margin: '0 32px 16px 32px',
            padding: '12px 16px',
            background: 'var(--color-terracotta-light)',
            color: 'var(--color-terracotta)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            border: '1px solid #F5C6CB'
          }}>
            {errorMsg}
          </div>
        )}

        {/* Form Body */}
        <div style={{ padding: '0 32px 32px 32px' }}>
          {tab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#112019', marginBottom: '6px' }}>
                  {t.auth.emailOrPhone}
                </label>
                <input
                  type="email"
                  required
                  placeholder={t.auth.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--color-border-strong)',
                    fontSize: '0.95rem',
                    backgroundColor: 'var(--color-canvas-surface)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#112019', marginBottom: '6px' }}>
                  {t.auth.password}
                </label>
                <input
                  type="password"
                  required
                  placeholder={t.auth.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--color-border-strong)',
                    fontSize: '0.95rem',
                    backgroundColor: 'var(--color-canvas-surface)'
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
                style={{ minHeight: '50px', fontSize: '1rem', marginTop: '6px', borderRadius: '10px' }}
              >
                {loading ? t.auth.signingIn : t.auth.submitSignIn}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#112019', marginBottom: '4px' }}>
                  {t.auth.fullName} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.auth.fullNamePlaceholder}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--color-border-strong)',
                    fontSize: '0.9rem',
                    backgroundColor: 'var(--color-canvas-surface)'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#112019', marginBottom: '4px' }}>
                    {t.auth.email} *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="farmer@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--color-border-strong)',
                      fontSize: '0.9rem',
                      backgroundColor: 'var(--color-canvas-surface)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#112019', marginBottom: '4px' }}>
                    {t.auth.phone}
                  </label>
                  <input
                    type="tel"
                    placeholder={t.auth.phonePlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--color-border-strong)',
                      fontSize: '0.9rem',
                      backgroundColor: 'var(--color-canvas-surface)'
                    }}
                  />
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#112019', marginBottom: '4px' }}>
                    {t.auth.createPassword}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder={t.auth.createPasswordPlaceholder}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--color-border-strong)',
                      fontSize: '0.9rem',
                      backgroundColor: 'var(--color-canvas-surface)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#112019', marginBottom: '4px' }}>
                    {t.auth.confirmPassword} *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder={t.auth.confirmPasswordPlaceholder}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--color-border-strong)',
                      fontSize: '0.9rem',
                      backgroundColor: 'var(--color-canvas-surface)'
                    }}
                  />
                </div>
              </div>

              {/* Pan-India Location Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#112019', marginBottom: '4px' }}>
                    {t.auth.stateUnion}
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--color-border-strong)',
                      fontSize: '0.9rem',
                      backgroundColor: 'var(--color-canvas-surface)'
                    }}
                  >
                    {indianStates.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#112019', marginBottom: '4px' }}>
                    {t.auth.district} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t.auth.districtPlaceholder}
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--color-border-strong)',
                      fontSize: '0.9rem',
                      backgroundColor: 'var(--color-canvas-surface)'
                    }}
                  />
                </div>
              </div>

              {/* Farm Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#112019', marginBottom: '4px' }}>
                    {t.auth.landSize}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="100"
                    value={landSize}
                    onChange={(e) => setLandSize(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--color-border-strong)',
                      fontSize: '0.9rem',
                      backgroundColor: 'var(--color-canvas-surface)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#112019', marginBottom: '4px' }}>
                    {t.auth.currentCrop}
                  </label>
                  <select
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--color-border-strong)',
                      fontSize: '0.9rem',
                      backgroundColor: 'var(--color-canvas-surface)'
                    }}
                  >
                    <option value="Tomato">{translateCropName('Tomato', lang)}</option>
                    <option value="Onion">{translateCropName('Onion', lang)}</option>
                    <option value="Wheat">{translateCropName('Wheat', lang)}</option>
                    <option value="Rice (Paddy)">{translateCropName('Rice', lang)}</option>
                    <option value="Cotton">{translateCropName('Cotton', lang)}</option>
                    <option value="Potato">{translateCropName('Potato', lang)}</option>
                    <option value="Chilli">{translateCropName('Chilli', lang)}</option>
                    <option value="Soybean">{translateCropName('Soybean', lang)}</option>
                    <option value="Maize">{translateCropName('Maize', lang)}</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
                style={{ minHeight: '50px', fontSize: '1rem', marginTop: '6px', borderRadius: '10px' }}
              >
                {loading ? t.auth.creatingProfile : t.auth.submitRegister}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
