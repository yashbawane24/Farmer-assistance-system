import React, { useState, useEffect } from 'react';
import { 
  Search, Sprout, CloudRain, Sun, CloudSun, Moon, CloudMoon, Thermometer, Droplets, Wind,
  ShieldAlert, ShoppingBag, Mic, ArrowRight, CheckCircle2, AlertTriangle, 
  Calendar, MapPin, TrendingUp, ChevronDown, Check, ExternalLink, Sparkles
} from 'lucide-react';
import { api } from '../services/api.js';
import { AudioSpeaker } from '../components/AudioSpeaker.jsx';
import { 
  getTranslation, 
  translateWeatherCondition, 
  translateCropName, 
  translateDayName, 
  translateMonthName, 
  translateFullDate 
} from '../services/i18n.js';

// Popular agricultural districts across India for instant weather accuracy
const POPULAR_DISTRICTS = [
  'Nashik', 'Nagpur', 'Pune', 'Aurangabad', 'Amravati', 'Kolhapur',
  'Indore', 'Bhopal', 'Ludhiana', 'Karnal', 'Varanasi', 'Surat', 
  'Rajkot', 'Guntur', 'Warangal', 'Belagavi', 'Jaipur', 'Patna'
];

// Status badge helper for crop stage and market viability
function CropStatusIndicator({ label, status = 'ready' }) {
  const isReady = status === 'ready';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '0.72rem',
      fontWeight: 800,
      color: isReady ? '#166534' : '#92400E',
      backgroundColor: isReady ? '#DCFCE7' : '#FEF3C7',
      padding: '4px 8px',
      borderRadius: '6px',
      border: `1px solid ${isReady ? '#BBF7D0' : '#FDE68A'}`
    }}>
      <CheckCircle2 size={13} />
      <span>{label}</span>
    </span>
  );
}

export function DashboardPage({ onNavigate, activeProfile, lang = 'en' }) {
  const t = getTranslation(lang);
  
  // Selected city/district for weather and local market
  const defaultCity = activeProfile?.district || 'Nashik';
  const [selectedCity, setSelectedCity] = useState(defaultCity);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  
  const [weatherToday, setWeatherToday] = useState(null);
  const [forecastDays, setForecastDays] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [mandiSnapshot, setMandiSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync with profile if it changes
  useEffect(() => {
    if (activeProfile?.district && activeProfile.district !== selectedCity) {
      setSelectedCity(activeProfile.district);
    }
  }, [activeProfile]);

  // Load weather and farm data when selectedCity changes
  useEffect(() => {
    loadCityAndFarmData(selectedCity);
  }, [selectedCity]);

  const loadCityAndFarmData = async (city) => {
    setLoading(true);
    try {
      const crop = activeProfile?.currentCrop || 'Tomato';
      const stage = activeProfile?.cropStage || 'Vegetative Stage';

      const [weatherRes, forecastRes, alertsRes, mandiRes] = await Promise.all([
        api.getTodayWeatherStatus(city, crop, stage),
        api.getWeatherForecast(city),
        api.getActiveAlerts(city, crop, stage),
        api.compareMandis(crop, 25, city)
      ]);

      setWeatherToday(weatherRes);
      setForecastDays(Array.isArray(forecastRes) ? forecastRes.slice(1, 5) : []);
      setActiveAlerts(alertsRes?.alerts || []);
      setMandiSnapshot(mandiRes);
    } catch (err) {
      console.warn('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Weather icon based on condition AND time of day (day vs night)
  const getWeatherIcon = (condition = '', isDay = true, size = 26) => {
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) {
      return <CloudRain size={size} color="#2563EB" />;
    }
    if (c.includes('thunder')) {
      return <CloudRain size={size} color="#7C3AED" />;
    }
    if (!isDay) {
      if (c.includes('cloud') || c.includes('overcast')) {
        return <CloudMoon size={size} color="#6366F1" />;
      }
      return <Moon size={size} color="#818CF8" />;
    }
    if (c.includes('cloud') || c.includes('overcast')) {
      return <CloudSun size={size} color="#059669" />;
    }
    return <Sun size={size} color="#EAB308" />;
  };

  // Farmer's main crops (localized)
  const rawPrimaryCrop = activeProfile?.currentCrop || 'Wheat';
  const rawSecondaryCrop = rawPrimaryCrop.toLowerCase().includes('rice') ? 'Wheat' : 'Rice';
  const primaryCropName = translateCropName(rawPrimaryCrop, lang);
  const secondaryCropName = translateCropName(rawSecondaryCrop, lang);

  return (
    <div style={{
      maxWidth: '1240px',
      margin: '0 auto',
      padding: '20px 20px 60px 20px',
      fontFamily: 'var(--font-ui, "Plus Jakarta Sans", sans-serif)',
      color: '#1F2937'
    }}>
      
      {/* 1. TOP HEADER: Search + Single City Selector */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        marginBottom: '24px'
      }}>
        {/* Search Bar matching reference */}
        <div style={{
          position: 'relative',
          flex: '1 1 300px',
          maxWidth: '520px'
        }}>
          <Search 
            size={18} 
            color="#9CA3AF" 
            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.dashboard.searchPlaceholder}
            style={{
              width: '100%',
              padding: '11px 18px 11px 44px',
              borderRadius: '999px',
              border: '1.5px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              fontSize: '0.9rem',
              color: '#1F2937',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2E7D32'}
            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>

        {/* Right side: City / District Selector for Accurate Weather */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #E5E7EB',
                borderRadius: '999px',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#1B4332',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
            >
              <MapPin size={16} color="#2E7D32" />
              <span>{selectedCity}</span>
              <ChevronDown size={14} color="#6B7280" />
            </button>

            {isCityDropdownOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '260px',
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                zIndex: 50,
                padding: '8px'
              }}>
                <div style={{ padding: '6px 10px', fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>
                  {t.dashboard.selectCityPrompt}
                </div>
                {POPULAR_DISTRICTS.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setSelectedCity(city);
                      setIsCityDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: selectedCity === city ? '#EAF7EC' : 'transparent',
                      color: selectedCity === city ? '#1B4332' : '#374151',
                      fontWeight: selectedCity === city ? 700 : 500,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span>{city}</span>
                    {selectedCity === city && <Check size={14} color="#2E7D32" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. TOP ACTIONABLE FARM ADVISORY BANNER (HIGH PRIORITY FOR FARMER) */}
      <div style={{
        backgroundColor: '#1B4332',
        color: '#FFFFFF',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 4px 16px rgba(27, 67, 50, 0.12)',
        border: '1.5px solid #2E7D32'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', maxWidth: '820px' }}>
          <div style={{
            backgroundColor: '#2E7D32',
            color: '#C8F169',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Sparkles size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                backgroundColor: '#C8F169',
                color: '#1B4332',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {t.dashboard.todayAdvisoryTitle || "आजचे शेती नियोजन"}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#D8F3DC', fontWeight: 600 }}>
                📍 {selectedCity} · {activeProfile?.currentCrop || 'Tomato'}
              </span>
            </div>
            <p style={{
              fontSize: '0.98rem',
              fontWeight: 600,
              lineHeight: 1.45,
              margin: 0,
              color: '#F0FFF4'
            }}>
              {weatherToday?.farmImpactAdvice || (
                lang === 'mr' 
                  ? "हवामान कोरडे असून दुपारच्या वेळी सिंचन देणे टाळावे. संध्याकाळी किडींच्या प्रतिबंधासाठी निंबोळी अर्क फवारणी योग्य राहील."
                  : lang === 'hi'
                  ? "मौसम अनुकूल है, दोपहर में तेज धूप में सिंचाई न करें। शाम को जैविक कीटनाशक का छिड़काव करें।"
                  : "Weather is favorable today. Avoid irrigation during peak midday heat; schedule pest-monitoring for early evening."
              )}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AudioSpeaker
            text={`${t.dashboard.todayAdvisoryTitle}. ${selectedCity}. ${weatherToday?.farmImpactAdvice || ''}`}
            lang={lang}
            label={lang === 'mr' ? 'सल्ला ऐका' : lang === 'hi' ? 'सलाह सुनें' : 'Listen'}
          />
        </div>
      </div>

      {/* 3. MAIN 2-COLUMN GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* LEFT COLUMN: Summary + Manage your farm + Predictive analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: '0' }}>
          
          {/* SECTION A: SUMMARY (Wheat & Rice Cards with Non-SaaS Clear Metrics) */}
          <div>
            <h2 style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              color: '#1B4332',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{t.dashboard.summary}</span>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {/* Card 1: Primary Crop */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '18px 20px',
                border: '1.5px solid #E5E7EB',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1B4332', marginBottom: '2px' }}>
                      {primaryCropName}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#6B7280', fontWeight: 500 }}>
                      {t.dashboard.totalProduction}
                    </div>
                  </div>
                  <CropStatusIndicator label={t.dashboard.readyToSell || 'काढणीस सज्ज'} status="ready" />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                    <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1B4332', letterSpacing: '-0.02em' }}>
                      125
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4B5563' }}>
                      {t.dashboard.tons}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2E7D32' }}>
                    ★ {t.dashboard.demandHigh || 'उत्तम मागणी'}
                  </span>
                </div>
              </div>

              {/* Card 2: Secondary Crop */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '18px 20px',
                border: '1.5px solid #E5E7EB',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1B4332', marginBottom: '2px' }}>
                      {secondaryCropName}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#6B7280', fontWeight: 500 }}>
                      {t.dashboard.totalProduction}
                    </div>
                  </div>
                  <CropStatusIndicator label={t.dashboard.plotProgress} status="growing" />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                    <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1B4332', letterSpacing: '-0.02em' }}>
                      980
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4B5563' }}>
                      {t.dashboard.tons}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2E7D32' }}>
                    ★ {t.dashboard.demandHigh || 'चांगली वाढ'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION B: MANAGE YOUR FARM (Landscape Centerpiece + 3 Solid 48px Action Cards) */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px'
            }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1B4332' }}>
                {t.dashboard.manageFarm}
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#2E7D32', fontWeight: 600 }}>
                {t.dashboard.plotProgress}
              </span>
            </div>

            {/* Farm Illustration Banner */}
            <div style={{
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 14px rgba(27, 67, 50, 0.08)',
              border: '1.5px solid #E5E7EB',
              backgroundColor: '#E7F2DF',
              marginBottom: '14px'
            }}>
              <img
                src="/farm_manage_banner.jpg"
                alt="Manage your farm illustration"
                style={{
                  width: '100%',
                  height: '190px',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </div>

            {/* 3 Large Solid 48px Action Cards (No blurry image overlays) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px'
            }}>
              {/* Action Card 1: Disease Scan */}
              <div
                onClick={() => onNavigate('disease-scan')}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '16px',
                  border: '1.5px solid #E5E7EB',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '140px'
                }}
              >
                <div>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#FEF2F2',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px'
                  }}>
                    <ShieldAlert size={20} />
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1B4332', marginBottom: '4px' }}>
                    {t.dashboard.actionCardDiseaseTitle || t.dashboard.scanLeafDisease}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#6B7280', lineHeight: 1.35 }}>
                    {t.dashboard.actionCardDiseaseDesc || "पानाचा फोटो काढून रोग तपासा"}
                  </div>
                </div>
                <button
                  type="button"
                  style={{
                    minHeight: '44px',
                    width: '100%',
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                    backgroundColor: '#1B4332',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <span>{t.dashboard.scanLeafDisease}</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Action Card 2: Crop Advisor */}
              <div
                onClick={() => onNavigate('crop-advisor')}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '16px',
                  border: '1.5px solid #E5E7EB',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '140px'
                }}
              >
                <div>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#F0FDF4',
                    color: '#16A34A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px'
                  }}>
                    <Sprout size={20} />
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1B4332', marginBottom: '4px' }}>
                    {t.dashboard.actionCardRoiTitle || t.dashboard.cropAdvisorRoi}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#6B7280', lineHeight: 1.35 }}>
                    {t.dashboard.actionCardRoiDesc || "माती व हंगामानुसार नफा देणारे पीक निवडा"}
                  </div>
                </div>
                <button
                  type="button"
                  style={{
                    minHeight: '44px',
                    width: '100%',
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                    backgroundColor: '#2E7D32',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <span>{t.dashboard.cropAdvisorRoi}</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Action Card 3: Smart Mandi */}
              <div
                onClick={() => onNavigate('smart-mandi')}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '16px',
                  border: '1.5px solid #E5E7EB',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '140px'
                }}
              >
                <div>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#FFFBEB',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px'
                  }}>
                    <ShoppingBag size={20} />
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1B4332', marginBottom: '4px' }}>
                    {t.dashboard.actionCardMandiTitle || t.dashboard.compareMandis}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#6B7280', lineHeight: 1.35 }}>
                    {t.dashboard.actionCardMandiDesc || "वाहतूक खर्च वजा जाता खरा नफा तपासा"}
                  </div>
                </div>
                <button
                  type="button"
                  style={{
                    minHeight: '44px',
                    width: '100%',
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                    backgroundColor: '#D97706',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <span>{t.dashboard.compareMandis}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* SECTION C: PREDICTIVE ANALYSIS (3 Month Horizon Cards) */}
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1B4332', marginBottom: '14px' }}>
              {t.dashboard.predictiveAnalysis}
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px'
            }}>
              {/* Month 1: September '26 */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                padding: '18px',
                border: '1.5px solid #F0F2EE',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1B4332', marginBottom: '14px', textAlign: 'center' }}>
                  {translateMonthName('September', lang)} '26
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                      <span style={{ color: '#4B5563' }}>{translateCropName('Wheat', lang)}</span>
                      <span style={{ color: '#1B4332', fontWeight: 800 }}>59%</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', backgroundColor: '#EEF2EB', borderRadius: '3px' }}>
                      <div style={{ width: '59%', height: '100%', backgroundColor: '#2E7D32', borderRadius: '3px' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                      <span style={{ color: '#4B5563' }}>{translateCropName('Rice', lang)}</span>
                      <span style={{ color: '#1B4332', fontWeight: 800 }}>81%</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', backgroundColor: '#EEF2EB', borderRadius: '3px' }}>
                      <div style={{ width: '81%', height: '100%', backgroundColor: '#8BC34A', borderRadius: '3px' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                      <span style={{ color: '#4B5563' }}>{translateCropName('Maize', lang)}</span>
                      <span style={{ color: '#1B4332', fontWeight: 800 }}>13%</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', backgroundColor: '#EEF2EB', borderRadius: '3px' }}>
                      <div style={{ width: '13%', height: '100%', backgroundColor: '#F59E0B', borderRadius: '3px' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Month 2: October '26 */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                padding: '18px',
                border: '1.5px solid #F0F2EE',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1B4332', marginBottom: '14px', textAlign: 'center' }}>
                  {translateMonthName('October', lang)} '26
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                      <span style={{ color: '#4B5563' }}>{translateCropName('Wheat', lang)}</span>
                      <span style={{ color: '#1B4332', fontWeight: 800 }}>74%</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', backgroundColor: '#EEF2EB', borderRadius: '3px' }}>
                      <div style={{ width: '74%', height: '100%', backgroundColor: '#2E7D32', borderRadius: '3px' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                      <span style={{ color: '#4B5563' }}>{translateCropName('Rice', lang)}</span>
                      <span style={{ color: '#1B4332', fontWeight: 800 }}>92%</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', backgroundColor: '#EEF2EB', borderRadius: '3px' }}>
                      <div style={{ width: '92%', height: '100%', backgroundColor: '#8BC34A', borderRadius: '3px' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                      <span style={{ color: '#4B5563' }}>{translateCropName('Maize', lang)}</span>
                      <span style={{ color: '#1B4332', fontWeight: 800 }}>25%</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', backgroundColor: '#EEF2EB', borderRadius: '3px' }}>
                      <div style={{ width: '25%', height: '100%', backgroundColor: '#F59E0B', borderRadius: '3px' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Month 3: November '26 */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                padding: '18px',
                border: '1.5px solid #F0F2EE',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1B4332', marginBottom: '14px', textAlign: 'center' }}>
                  {translateMonthName('November', lang)} '26
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                      <span style={{ color: '#4B5563' }}>{translateCropName('Wheat', lang)}</span>
                      <span style={{ color: '#1B4332', fontWeight: 800 }}>88%</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', backgroundColor: '#EEF2EB', borderRadius: '3px' }}>
                      <div style={{ width: '88%', height: '100%', backgroundColor: '#2E7D32', borderRadius: '3px' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                      <span style={{ color: '#4B5563' }}>{translateCropName('Rice', lang)}</span>
                      <span style={{ color: '#1B4332', fontWeight: 800 }}>98%</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', backgroundColor: '#EEF2EB', borderRadius: '3px' }}>
                      <div style={{ width: '98%', height: '100%', backgroundColor: '#8BC34A', borderRadius: '3px' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                      <span style={{ color: '#4B5563' }}>{translateCropName('Maize', lang)}</span>
                      <span style={{ color: '#1B4332', fontWeight: 800 }}>45%</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', backgroundColor: '#EEF2EB', borderRadius: '3px' }}>
                      <div style={{ width: '45%', height: '100%', backgroundColor: '#F59E0B', borderRadius: '3px' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Weather forecast (Accurate with Live Time & 24h Diurnal Curve) + Harvesting Cost */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', minWidth: '0' }}>
          
          {/* SECTION D: WEATHER FORECAST */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1B4332' }}>
                  {t.dashboard.weatherForecast}
                </h2>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: '#EAF7EC',
                  color: '#2E7D32'
                }}>
                  {selectedCity}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('weather-alerts')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {t.dashboard.openApp}
              </button>
            </div>

            {/* HERO TIME-ACCURATE WEATHER CARD (Mint Green matching reference) */}
            <div style={{
              backgroundColor: '#DDF4E4',
              borderRadius: '24px',
              padding: '20px 22px',
              marginBottom: '14px',
              border: '1.5px solid #CBEBD4',
              boxShadow: '0 2px 10px rgba(46, 125, 50, 0.06)'
            }}>
              {/* Header: Weather icon, Today badge, and Time badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {getWeatherIcon(weatherToday?.condition || 'Rainy', weatherToday?.is_day ?? true, 28)}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        backgroundColor: 'rgba(255, 255, 255, 0.85)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        color: '#1B4332'
                      }}>
                        {t.dashboard.today}
                      </span>
                      {weatherToday?.timePeriod && (
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: weatherToday.is_day ? '#FEF3C7' : '#E0E7FF',
                          color: weatherToday.is_day ? '#92400E' : '#3730A3',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          {lang === 'hi' ? (weatherToday.is_day ? 'दिन का समय' : 'रात का समय') :
                           lang === 'mr' ? (weatherToday.is_day ? 'दिवसाची वेळ' : 'रात्रीची वेळ') :
                           weatherToday.timePeriod}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#2D5F3E', fontWeight: 600, marginTop: '3px' }}>
                      {translateFullDate(weatherToday?.fullDateStr || 'Monday, 21 September 2026', lang)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    padding: '8px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Thermometer size={20} color="#E05638" />
                  </div>
                  <AudioSpeaker 
                    text={`${selectedCity} ${t.dashboard.weatherForecast}. ${weatherToday?.current_temp_c || 22}°C. ${translateWeatherCondition(weatherToday?.condition, lang)}. ${weatherToday?.farmImpactAdvice || ''}`}
                    lang={lang}
                    label=""
                  />
                </div>
              </div>

              {/* Real-Time Live Temperature Display */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <span style={{ fontSize: '2.6rem', fontWeight: 800, color: '#1B4332', lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {weatherToday?.current_temp_c != null ? `${weatherToday.current_temp_c}°` : '22.4°'}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2D5F3E' }}>
                      {t.dashboard.liveAt} {weatherToday?.currentTime || ''}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4A6B53' }}>
                      {t.dashboard.maxMin}: {weatherToday?.temp_max_c || 30}° / {weatherToday?.temp_min_c || 22}°
                    </span>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1B4332' }}>
                      {translateWeatherCondition(weatherToday?.condition || 'Overcast Night', lang)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#3A6B4E', fontWeight: 600 }}>
                      RH: {weatherToday?.humidity_percent || 90}% · {weatherToday?.rainfall_prob_percent || 20}%
                    </div>
                  </div>
                </div>
              </div>

              {/* 4-Period Daytime / Nighttime Progression (Clear for Rural Users) */}
              {weatherToday?.hourlyProgression && weatherToday.hourlyProgression.length > 0 && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(46, 125, 50, 0.15)' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#2E5B3A', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {t.dashboard.twentyFourHourCycle}
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '6px'
                  }}>
                    {[
                      { label: t.dashboard.morning || 'सकाळ', time: '06:00 - 12:00', temp: '24°', icon: <Sun size={15} color="#EAB308" />, isCur: weatherToday.timePeriod === 'Morning' },
                      { label: t.dashboard.afternoon || 'दुपार', time: '12:00 - 17:00', temp: `${weatherToday.temp_max_c || 30}°`, icon: <Sun size={15} color="#F97316" />, isCur: weatherToday.timePeriod === 'Afternoon' },
                      { label: t.dashboard.evening || 'संध्याकाळ', time: '17:00 - 20:00', temp: '26°', icon: <CloudSun size={15} color="#059669" />, isCur: weatherToday.timePeriod === 'Evening' },
                      { label: t.dashboard.night || 'रात्र', time: '20:00 - 06:00', temp: `${weatherToday.temp_min_c || 22}°`, icon: <Moon size={15} color="#6366F1" />, isCur: weatherToday.timePeriod === 'Night' }
                    ].map((slot, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: slot.isCur ? '#1B4332' : 'rgba(255,255,255,0.75)',
                          color: slot.isCur ? '#FFFFFF' : '#1F2937',
                          borderRadius: '10px',
                          padding: '8px 4px',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          border: slot.isCur ? '1.5px solid #C8F169' : '1px solid rgba(46,125,50,0.15)',
                          boxShadow: slot.isCur ? '0 2px 8px rgba(27,67,50,0.25)' : 'none'
                        }}
                      >
                        <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                          {slot.label}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          {slot.icon}
                          <span style={{ fontSize: '0.92rem', fontWeight: 900 }}>
                            {slot.temp}
                          </span>
                        </div>
                        {slot.isCur && (
                          <span style={{
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            backgroundColor: '#C8F169',
                            color: '#1B4332',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            marginTop: '2px'
                          }}>
                            {t.dashboard.now}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Farmer Microclimate Tip */}
              <div style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(46, 125, 50, 0.15)',
                fontSize: '0.8rem',
                color: '#285437',
                lineHeight: 1.4
              }}>
                📍 <strong>{selectedCity} {t.dashboard.advisoryPrefix}:</strong> {weatherToday?.farmImpactAdvice || ''}
              </div>
            </div>

            {/* 4-DAY FORECAST GRID (2x2 Grid) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '20px'
            }}>
              {forecastDays.length > 0 ? (
                forecastDays.map((day, idx) => {
                  const parts = (day.formattedDate || `${22 + idx} Sep`).split(' ');
                  const dayNum = parts[0];
                  const monthStr = parts[1] || 'Sep';
                  const localizedDayName = translateDayName(day.shortDay || 'Day', lang);
                  const localizedMonth = translateMonthName(monthStr, lang);

                  return (
                    <div
                      key={day.id || idx}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '14px',
                        padding: '14px',
                        border: '1.5px solid #F0F2EE',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      {/* Date & Day prominently shown */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6B7280' }}>
                          {dayNum} {localizedMonth}
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2E7D32', textTransform: 'uppercase' }}>
                          {localizedDayName}
                        </span>
                      </div>

                      {/* Temperature */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1B4332', lineHeight: 1 }}>
                          {Math.round(day.temp_max_c)}°
                        </span>
                        {getWeatherIcon(day.condition, true, 22)}
                      </div>

                      {/* Condition */}
                      <div style={{ fontSize: '0.76rem', color: '#4B5563', fontWeight: 500, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {translateWeatherCondition(day.condition, lang)}
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Fallback 4 days */
                [
                  { date: '22', month: 'Sep', day: 'Tue', temp: '29°', cond: 'Thunderstorm Expected' },
                  { date: '23', month: 'Sep', day: 'Wed', temp: '30°', cond: 'Light Drizzle' },
                  { date: '24', month: 'Sep', day: 'Thu', temp: '30°', cond: 'Overcast Sky' },
                  { date: '25', month: 'Sep', day: 'Fri', temp: '29°', cond: 'Partly Cloudy' }
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '14px',
                      padding: '14px',
                      border: '1.5px solid #F0F2EE',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6B7280' }}>
                        {item.date} {translateMonthName(item.month, lang)}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2E7D32' }}>
                        {translateDayName(item.day, lang)}
                      </span>
                    </div>
                    <span style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1B4332', margin: '4px 0' }}>{item.temp}</span>
                    <span style={{ fontSize: '0.76rem', color: '#4B5563' }}>{translateWeatherCondition(item.cond, lang)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION E: HARVESTING COST & REALIZATION (Clear Farmer Arithmetic) */}
          <div style={{
            backgroundColor: '#E7F5EA',
            borderRadius: '16px',
            padding: '20px',
            border: '1.5px solid #CBE8D2',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px'
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1B4332', margin: 0 }}>
                {t.dashboard.harvestingCost}
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('smart-mandi')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2E7D32',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{t.dashboard.mandiRates}</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Arithmetic Breakdown for Smallholder Farmer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                <span style={{ color: '#4B5563' }}>{t.dashboard.grossValue || 'अंदाजे एकूण उत्पन्न'}:</span>
                <strong style={{ color: '#1B4332' }}>₹1,50,000</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                <span style={{ color: '#DC2626' }}>{t.dashboard.inputLaborCost || 'बियाणे, खते व मजुरी खर्च'}:</span>
                <strong style={{ color: '#DC2626' }}>-₹50,000</strong>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                paddingTop: '8px',
                borderTop: '1.5px dashed #A7D7B5'
              }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#166534' }}>
                  {t.dashboard.estimatedNetProfit || 'हातातील निव्वळ रोख नफा'}:
                </span>
                <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#166534', letterSpacing: '-0.02em' }}>
                  ₹1,00,000
                </span>
              </div>
            </div>

            <div style={{
              fontSize: '0.78rem',
              color: '#2D5F3E',
              backgroundColor: '#FFFFFF',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #CBEBD4',
              lineHeight: 1.4
            }}>
              💡 <strong>{lang === 'mr' ? 'बाजार सल्ला:' : lang === 'hi' ? 'मंडी सलाह:' : 'Market Tip:'}</strong> {lang === 'mr' ? 'वाहतूक एकत्रिकरण केल्यास संगमनेर बाजारात ₹8,500 जास्त नफा मिळू शकतो.' : lang === 'hi' ? 'वाहन शेयरिंग से संगमनेर मंडी में ₹8,500 अधिक लाभ मिल सकता है।' : 'Transport pooling to Sangamner APMC can net ₹8,500 higher profit.'}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
