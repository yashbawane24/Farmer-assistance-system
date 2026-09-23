import React, { useState, useEffect } from 'react';
import { Sprout, ArrowRight, ArrowLeft, Check, AlertTriangle, HelpCircle, ShieldCheck, ShieldAlert, DollarSign } from 'lucide-react';
import { api } from '../services/api.js';
import { GuidedOptionPicker } from '../components/GuidedOptionPicker.jsx';
import { AudioSpeaker } from '../components/AudioSpeaker.jsx';
import { getTranslation, translateCropName, translateSoilType, translateWaterReliability } from '../services/i18n.js';

export function CropAdvisorPage({ activeProfile, lang, onNavigate }) {
  const t = getTranslation(lang);
  const [currentStep, setCurrentStep] = useState(1);

  // Form State initialized to active user's actual farm parameters
  const [landSize, setLandSize] = useState(activeProfile?.landSize || 2.0);
  const [district, setDistrict] = useState(activeProfile?.district || 'India');
  const [soilType, setSoilType] = useState(activeProfile?.soilType || 'Black Soil (Regur)');
  const [waterReliability, setWaterReliability] = useState(activeProfile?.waterReliability || 'Moderately Reliable');
  const [budgetPerAcre, setBudgetPerAcre] = useState(40000);
  const [season, setSeason] = useState('Kharif');

  // Recommendation & Comparison State
  const [recommendations, setRecommendations] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState(1);
  const [detailedRoi, setDetailedRoi] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeProfile) {
      if (activeProfile.landSize) setLandSize(activeProfile.landSize);
      if (activeProfile.district) setDistrict(activeProfile.district);
      if (activeProfile.soilType) setSoilType(activeProfile.soilType);
      if (activeProfile.waterReliability) setWaterReliability(activeProfile.waterReliability);
    }
  }, [activeProfile]);

  useEffect(() => {
    fetchRecommendations();
  }, [soilType, waterReliability, season, budgetPerAcre, landSize]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const recs = await api.recommendCrops({
        soilType,
        waterReliability,
        season,
        budgetPerAcre: Number(budgetPerAcre),
        landSize: Number(landSize)
      });
      setRecommendations(recs);
      if (recs.length > 0) {
        setSelectedCropId(recs[0].id);
        fetchCropRoi(recs[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCropRoi = async (cropId) => {
    try {
      const roi = await api.calculateRoi({
        cropId,
        landSizeAcres: landSize,
        soilType,
        waterReliability
      });
      setDetailedRoi(roi);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectCrop = (cropId) => {
    setSelectedCropId(cropId);
    fetchCropRoi(cropId);
  };

  const soilOptions = [
    {
      value: 'Black Soil (Regur)',
      label: lang === 'hi' ? 'काली मिट्टी (रेगुर)' : lang === 'mr' ? 'काळी माती (रेगूर)' : 'Black Soil (Regur)',
      sublabel: lang === 'hi' ? 'अधिक नमी धारण क्षमता' : lang === 'mr' ? 'पाणी धरून ठेवणारी माती' : 'High water retention',
      description: lang === 'hi' ? 'कपास, टमाटर, प्याज, सोयाबीन के लिए सर्वोत्तम' : lang === 'mr' ? 'कापूस, टोमॅटो, कांदा, सोयाबीनसाठी उत्तम' : 'Optimal for cotton, tomato, onion, soybean'
    },
    {
      value: 'Red Loam',
      label: lang === 'hi' ? 'लाल दोमट मिट्टी' : lang === 'mr' ? 'तांबडी माती' : 'Red Loam',
      sublabel: lang === 'hi' ? 'अच्छी जल निकासी' : lang === 'mr' ? 'पाण्याचा निचरा होणारी' : 'Well-drained porous',
      description: lang === 'hi' ? 'दालें, मूंगफली, मिर्च के लिए उपयुक्त' : lang === 'mr' ? 'कडधान्ये, भुईमूग, मिरचीसाठी योग्य' : 'Optimal for pulses, millets, groundnut, chillies'
    },
    {
      value: 'Alluvial Loam',
      label: lang === 'hi' ? 'जलोढ़ मिट्टी (दोमट)' : lang === 'mr' ? 'गाळाची सुपीक माती' : 'Alluvial Loam',
      sublabel: lang === 'hi' ? 'अत्यंत उपजाऊ सिल्ट' : lang === 'mr' ? 'अत्यंत सुपीक गाळ' : 'Highly fertile silt',
      description: lang === 'hi' ? 'गेहूं, गन्ना, धान, मक्का के लिए सर्वोत्तम' : lang === 'mr' ? 'गहू, ऊस, भात, मक्यासाठी उत्तम' : 'Optimal for wheat, sugarcane, paddy, maize'
    },
    {
      value: 'Sandy Loam',
      label: lang === 'hi' ? 'बलुई दोमट मिट्टी' : lang === 'mr' ? 'वाळूमिश्रित माती' : 'Sandy Loam',
      sublabel: lang === 'hi' ? 'तेज जल निकासी' : lang === 'mr' ? 'जलद निचरा' : 'Rapid drainage',
      description: lang === 'hi' ? 'आलू, गाजर, तरबूज के लिए उपयुक्त' : lang === 'mr' ? 'बटाटा, गाजर, कलिंगडसाठी योग्य' : 'Optimal for potato, carrot, watermelon'
    }
  ];

  const waterOptions = [
    {
      value: 'Very Reliable',
      label: lang === 'hi' ? 'उत्तम पानी (नहर / बोरवेल)' : lang === 'mr' ? 'उत्तम बारमाही पाणी (कॅनॉल / विहीर)' : 'Very Reliable',
      sublabel: lang === 'hi' ? 'पूरे सीजन में सिंचाई उपलब्ध' : lang === 'mr' ? 'हंगामभर खात्रीशीर पाणी' : 'Canal / perennial borewell',
      description: lang === 'hi' ? 'गन्ना, धान और सब्जी फसलों के लिए अनुकूल' : lang === 'mr' ? 'ऊस, भात आणि भाजीपाल्यासाठी अनुकूल' : 'Full season assured irrigation availability'
    },
    {
      value: 'Moderately Reliable',
      label: lang === 'hi' ? 'मध्यम पानी की उपलब्धता' : lang === 'mr' ? 'मध्यम पाणी उपलब्धता' : 'Moderately Reliable',
      sublabel: lang === 'hi' ? 'गर्मियों में पानी कम होना' : lang === 'mr' ? 'उन्हाळ्यात पाण्याची कमतरता' : 'Borewell with summer dip',
      description: lang === 'hi' ? 'सोयाबीन, गेहूं, प्याज के लिए उपयुक्त' : lang === 'mr' ? 'सोयाबीन, गहू, कांद्यासाठी योग्य' : 'Adequate for medium consumption crops'
    },
    {
      value: 'Mostly Rain-fed',
      label: lang === 'hi' ? 'केवल वर्षा आधारित (बारिश पर)' : lang === 'mr' ? 'केवळ पावसाच्या पाण्यावर' : 'Mostly Rain-fed',
      sublabel: lang === 'hi' ? 'मानसून पर निर्भर' : lang === 'mr' ? 'मान्सूनवर अवलंबून' : 'Monsoon dependent',
      description: lang === 'hi' ? 'कम पानी वाली दालें, बाजरा, चना' : lang === 'mr' ? 'कमी पाण्यात येणारी कडधान्ये, बाजरी, हरभरा' : 'Best for drought-resistant short-duration crops'
    }
  ];

  const seasonOptions = [
    {
      value: 'Kharif',
      label: lang === 'hi' ? 'खरीफ (मानसून: जून - अक्टूबर)' : lang === 'mr' ? 'खरीप (पावसाळा: जून - ऑक्टोबर)' : 'Kharif',
      sublabel: lang === 'hi' ? 'जून से अक्टूबर' : lang === 'mr' ? 'जून ते ऑक्टोबर' : 'Monsoon: June – Oct',
      description: lang === 'hi' ? 'टमाटर, धान, कपास, सोयाबीन, मिर्च' : lang === 'mr' ? 'टोमॅटो, भात, कापूस, सोयाबीन, मिरची' : 'Tomato, Rice, Cotton, Soybean, Chilli'
    },
    {
      value: 'Rabi',
      label: lang === 'hi' ? 'रबी (सर्दी: अक्टूबर - मार्च)' : lang === 'mr' ? 'रब्बी (हिवाळा: ऑक्टोबर - मार्च)' : 'Rabi',
      sublabel: lang === 'hi' ? 'अक्टूबर से मार्च' : lang === 'mr' ? 'ऑक्टोबर ते मार्च' : 'Winter: Oct – March',
      description: lang === 'hi' ? 'गेहूं, प्याज, आलू, सरसों, चना' : lang === 'mr' ? 'गहू, कांदा, बटाटा, मोहरी, हरभरा' : 'Wheat, Onion, Potato, Mustard, Gram'
    },
    {
      value: 'Zaid / Summer',
      label: lang === 'hi' ? 'जायद (गर्मी: मार्च - जून)' : lang === 'mr' ? 'उन्हाळी (हंगाम: मार्च - जून)' : 'Zaid / Summer',
      sublabel: lang === 'hi' ? 'मार्च से जून' : lang === 'mr' ? 'मार्च ते जून' : 'March – June',
      description: lang === 'hi' ? 'सब्जियां, मूंग, चारा, तरबूज' : lang === 'mr' ? 'भाजीपाला, मूग, चारा पिके, टरबूज' : 'Vegetables, Moong, Fodder, Melons'
    }
  ];

  return (
    <div className="container" style={{ padding: '36px var(--space-md) 64px var(--space-md)' }}>
      {/* Header */}
      <div style={{ maxWidth: '800px', marginBottom: '28px' }}>
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-leaf-green)', fontWeight: 700 }}>
          {lang === 'hi' ? 'चरण 1: कृषि निर्णय प्रणाली' : lang === 'mr' ? 'टप्पा १: कृषी निर्णय प्रणाली' : 'Phase 1: Decision Intelligence'}
        </span>
        <h1 style={{ marginTop: '4px', marginBottom: '8px', color: 'var(--color-primary-forest)' }}>
          {t.roi.title}
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>
          {t.roi.subtitle}
        </p>
      </div>

      {/* STEP PROGRESS BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: '16px 20px',
        borderRadius: 'var(--radius-md)',
        border: '1.5px solid var(--color-border-subtle)',
        marginBottom: '32px'
      }}>
        {[
          { num: 1, label: t.roi.step1 },
          { num: 2, label: t.roi.step2 },
          { num: 3, label: t.roi.step3 },
          { num: 4, label: t.roi.step4 }
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setCurrentStep(s.num)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              opacity: currentStep === s.num ? 1 : 0.65
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: currentStep >= s.num ? 'var(--color-primary-forest)' : 'var(--color-canvas-subtle)',
              color: currentStep >= s.num ? '#FFFFFF' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.82rem'
            }}>
              {currentStep > s.num ? <Check size={14} /> : s.num}
            </div>
            <span style={{ fontWeight: currentStep === s.num ? 700 : 500, fontSize: '0.85rem', color: 'var(--color-primary-forest)' }}>
              {s.label}
            </span>
          </button>
        ))}
      </div>

      {/* STEP 1: Land & District */}
      {currentStep === 1 && (
        <div className="card" style={{ maxWidth: '720px' }}>
          <h3 style={{ marginBottom: '16px' }}>{t.roi.step1}</h3>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>
              {t.roi.landSizeLabel}
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="50"
                value={landSize}
                onChange={(e) => setLandSize(Number(e.target.value))}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--color-border-strong)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  width: '160px',
                  backgroundColor: 'var(--color-canvas-surface)'
                }}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{t.roi.landHelper}</span>
            </div>

            {/* 1-Tap Quick Acre Presets (Minimal Typing for Indian Smallholders) */}
            <div>
              <span style={{ display: 'block', fontSize: '0.78rem', color: '#6B7280', fontWeight: 600, marginBottom: '6px' }}>
                {lang === 'mr' ? 'किंवा १-टॅप पर्याय निवडा:' : lang === 'hi' ? 'या १-क्लिक विकल्प चुनें:' : 'Or tap to select acreage:'}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[1, 2, 3, 5, 10].map((acres) => (
                  <button
                    key={acres}
                    type="button"
                    onClick={() => setLandSize(acres)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: landSize === acres ? '2px solid #1B4332' : '1.5px solid #D1D5DB',
                      backgroundColor: landSize === acres ? '#EAF7EC' : '#FFFFFF',
                      color: landSize === acres ? '#1B4332' : '#374151',
                      fontWeight: landSize === acres ? 800 : 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      minHeight: '44px'
                    }}
                  >
                    {acres} {lang === 'hi' || lang === 'mr' ? 'एकर' : 'Acres'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>
              {t.roi.districtLabel}
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--color-border-strong)',
                fontSize: '1rem',
                backgroundColor: 'var(--color-canvas-surface)',
                width: '100%',
                maxWidth: '320px'
              }}
            >
              <option value="Nashik">{lang === 'mr' ? 'नाशिक (महाराष्ट्र)' : lang === 'hi' ? 'नासिक (महाराष्ट्र)' : 'Nashik (Maharashtra)'}</option>
              <option value="Pune">{lang === 'mr' ? 'पुणे (महाराष्ट्र)' : lang === 'hi' ? 'पुणे (महाराष्ट्र)' : 'Pune (Maharashtra)'}</option>
              <option value="Ahmednagar">{lang === 'mr' ? 'अहमदनगर (महाराष्ट्र)' : lang === 'hi' ? 'अहमदनगर (महाराष्ट्र)' : 'Ahmednagar (Maharashtra)'}</option>
              <option value="Karnal">{lang === 'mr' ? 'कर्नाल (हरियाणा)' : lang === 'hi' ? 'करनाल (हरियाणा)' : 'Karnal (Haryana)'}</option>
              <option value="Guntur">{lang === 'mr' ? 'गुंटूर (आंध्र प्रदेश)' : lang === 'hi' ? 'गुंटूर (आंध्र प्रदेश)' : 'Guntur (Andhra Pradesh)'}</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-primary" onClick={() => setCurrentStep(2)}>
              <span>{t.roi.nextSoil}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Soil Type & Water Reliability */}
      {currentStep === 2 && (
        <div className="card" style={{ maxWidth: '820px' }}>
          <h3 style={{ marginBottom: '16px' }}>{t.roi.step2}</h3>

          <div style={{ marginBottom: '24px' }}>
            <GuidedOptionPicker
              label={t.roi.soilTitle}
              options={soilOptions}
              selectedValue={soilType}
              onSelect={setSoilType}
              idPrefix="soil"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <GuidedOptionPicker
              label={t.roi.waterTitle}
              options={waterOptions}
              selectedValue={waterReliability}
              onSelect={setWaterReliability}
              idPrefix="water"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep(1)}>
              <ArrowLeft size={16} />
              <span>{t.roi.backBtn}</span>
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setCurrentStep(3)}>
              <span>{t.roi.nextBudget}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Working Budget & Season */}
      {currentStep === 3 && (
        <div className="card" style={{ maxWidth: '820px' }}>
          <h3 style={{ marginBottom: '16px' }}>{t.roi.step3}</h3>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>
              {t.roi.budgetTitle}
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="range"
                min="10000"
                max="80000"
                step="5000"
                value={budgetPerAcre}
                onChange={(e) => setBudgetPerAcre(Number(e.target.value))}
                style={{ width: '100%', maxWidth: '360px', accentColor: 'var(--color-primary-forest)' }}
              />
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-forest)' }}>
                ₹{budgetPerAcre.toLocaleString('en-IN')}/{lang === 'hi' || lang === 'mr' ? 'एकर' : 'acre'}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {lang === 'hi' ? `${landSize} एकर के लिए कुल अनुमानित पूंजी:` : lang === 'mr' ? `${landSize} एकरासाठी एकूण अंदाजे भांडवल:` : `Total investment capacity for ${landSize} acres:`} <strong>₹{(budgetPerAcre * landSize).toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <GuidedOptionPicker
              label={t.roi.seasonTitle}
              options={seasonOptions}
              selectedValue={season}
              onSelect={setSeason}
              idPrefix="season"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep(2)}>
              <ArrowLeft size={16} />
              <span>{t.roi.backBtn}</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                fetchRecommendations();
                setCurrentStep(4);
              }}
            >
              <span>{t.roi.nextRoi}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: RECOMMENDATIONS & DYNAMIC ROI OUTPUT */}
      {currentStep === 4 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary-forest)' }}>
                {t.roi.recommendationsTitle}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {lang === 'hi'
                  ? `${district} में ${landSize} एकर, ${translateSoilType(soilType, lang)} और ${translateWaterReliability(waterReliability, lang)} के लिए आकलित`
                  : lang === 'mr'
                  ? `${district} मधील ${landSize} एकर, ${translateSoilType(soilType, lang)} आणि ${translateWaterReliability(waterReliability, lang)} साठी आकलित`
                  : `Evaluated for ${landSize} acres of ${soilType} with ${waterReliability} in ${district}`}
              </div>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCurrentStep(1)}>
              ✏️ {lang === 'hi' ? 'मापदंड बदलें' : lang === 'mr' ? 'तपशील बदला' : 'Adjust Farm Inputs'}
            </button>
          </div>

          {/* Candidate Crops Selector Strip */}
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
            {recommendations.map((rec) => {
              const isSelected = selectedCropId === rec.id;
              const localizedCrop = translateCropName(rec.name, lang);
              return (
                <div
                  key={rec.id}
                  onClick={() => handleSelectCrop(rec.id)}
                  style={{
                    backgroundColor: isSelected ? '#FFFFFF' : 'var(--color-canvas-surface)',
                    border: isSelected ? '2px solid var(--color-primary-forest)' : '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px 20px',
                    minWidth: '220px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary-forest)' }}>{localizedCrop}</span>
                    <span className="badge badge-leaf">{rec.suitabilityScore}% {lang === 'hi' ? 'उपयुक्त' : lang === 'mr' ? 'योग्य' : 'Match'}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                    {rec.durationDays} {lang === 'hi' || lang === 'mr' ? 'दिवस' : 'Days'}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-leaf-green)' }}>
                    {lang === 'hi' ? 'अनुमानित मुनाफा:' : lang === 'mr' ? 'अंदाजे नफा:' : 'Est. Profit:'} ₹{rec.economics?.projectedProfit?.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    ROI: {rec.economics?.projectedRoiPercent}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* DETAILED ROI & RISK BREAKDOWN CARD */}
          {detailedRoi && (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--color-border-subtle)',
              padding: '32px',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <span className="badge badge-forest" style={{ marginBottom: '6px' }}>
                    {lang === 'hi' ? 'चयनित फसल का वित्तीय विवरण' : lang === 'mr' ? 'निवडलेल्या पिकाचे आर्थिक गणित' : 'Selected Crop Economics'}
                  </span>
                  <h2 style={{ fontSize: '2rem', color: 'var(--color-primary-forest)' }}>{translateCropName(detailedRoi.crop.name, lang)}</h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {detailedRoi.crop.scientificName} • {lang === 'hi' || lang === 'mr' ? 'कालावधी' : 'Cycle'}: {detailedRoi.crop.durationDays} {lang === 'hi' || lang === 'mr' ? 'दिवस' : 'days'} • {lang === 'hi' ? 'कुल अनुमानित उपज:' : lang === 'mr' ? 'एकूण अंदाजे उत्पादन:' : 'Total Projected Yield:'} {detailedRoi.parameters.totalProjectedYieldQuintal} {lang === 'hi' || lang === 'mr' ? 'क्विंटल' : 'Quintals'}
                  </div>
                </div>

                <AudioSpeaker
                  text={`${translateCropName(detailedRoi.crop.name, lang)} ${t.roi.title}. ${t.roi.investment}: ₹${detailedRoi.financialProjections.totalEstimatedInvestment}. ${t.roi.revenue}: ₹${detailedRoi.financialProjections.projectedGrossRevenue}. ${t.roi.profit}: ₹${detailedRoi.financialProjections.projectedNetProfit}. ROI: ${detailedRoi.financialProjections.projectedRoiPercent}%.`}
                  lang={lang}
                  label={lang === 'hi' ? 'मुनाफा सारांश सुनें' : lang === 'mr' ? 'नफ्याचा अहवाल ऐका' : 'Listen to ROI Summary'}
                />
              </div>

              {/* Simple Farmer Cash Calculation Banner (Non-technical arithmetic) */}
              <div style={{
                backgroundColor: '#F3FBF5',
                border: '2px solid #A7D7B5',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '0.95rem', fontWeight: 800 }}>
                  <span style={{ color: '#1B4332' }}>
                    {lang === 'mr' ? 'एकूण उत्पन्न' : lang === 'hi' ? 'कुल आमदनी' : 'Gross Revenue'}: ₹{detailedRoi.financialProjections.projectedGrossRevenue?.toLocaleString('en-IN')}
                  </span>
                  <span style={{ color: '#DC2626' }}>—</span>
                  <span style={{ color: '#DC2626' }}>
                    {lang === 'mr' ? 'शेती खर्च' : lang === 'hi' ? 'कृषि खर्च' : 'Total Expense'}: ₹{detailedRoi.financialProjections.totalEstimatedInvestment?.toLocaleString('en-IN')}
                  </span>
                  <span style={{ color: '#166534' }}>=</span>
                  <span style={{
                    backgroundColor: '#DCFCE7',
                    color: '#166534',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '1.15rem',
                    fontWeight: 900
                  }}>
                    {lang === 'mr' ? 'खरा निव्वळ नफा' : lang === 'hi' ? 'असली शुद्ध मुनाफा' : 'Real Net Profit'}: ₹{detailedRoi.financialProjections.projectedNetProfit?.toLocaleString('en-IN')}
                  </span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2E7D32', backgroundColor: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBEBD4' }}>
                  ROI: {detailedRoi.financialProjections.projectedRoiPercent}%
                </span>
              </div>

              {/* 4 Major Financial Metrics Grid */}
              <div className="grid-4" style={{ marginBottom: '28px' }}>
                <div style={{ padding: '16px', background: 'var(--color-canvas-surface)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{t.roi.investment}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-forest)', marginTop: '4px' }}>
                    ₹{detailedRoi.financialProjections.totalEstimatedInvestment?.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{landSize} {lang === 'hi' || lang === 'mr' ? 'एकरसाठी' : 'acres'}</div>
                </div>

                <div style={{ padding: '16px', background: 'var(--color-canvas-surface)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{t.roi.revenue}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-forest)', marginTop: '4px' }}>
                    ₹{detailedRoi.financialProjections.projectedGrossRevenue?.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>@ ₹{detailedRoi.parameters.assumedPricePerQuintal}/q</div>
                </div>

                <div style={{ padding: '16px', background: 'var(--color-leaf-light)', borderRadius: 'var(--radius-md)', border: '1px solid #D2E4D4' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-leaf-green)', textTransform: 'uppercase', fontWeight: 700 }}>{t.roi.profit}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-leaf-green)', marginTop: '4px' }}>
                    ₹{detailedRoi.financialProjections.projectedNetProfit?.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-leaf-green)', fontWeight: 600 }}>{t.roi.roiPercent}: {detailedRoi.financialProjections.projectedRoiPercent}%</div>
                </div>

                <div style={{ padding: '16px', background: 'var(--color-canvas-surface)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{lang === 'hi' ? 'ब्रेक-ईवन भाव' : lang === 'mr' ? 'किमान आधारभूत भाव' : 'Break-Even Price'}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-forest)', marginTop: '4px' }}>
                    ₹{detailedRoi.financialProjections.breakEvenPricePerQuintal}/q
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{lang === 'hi' ? 'लागत निकालने का न्यूनतम भाव' : lang === 'mr' ? 'खर्च भरून निघण्यासाठी किमान भाव' : 'Minimum price to cover costs'}</div>
                </div>
              </div>

              {/* Itemized Cost Breakdown */}
              <div style={{ marginBottom: '28px' }}>
                <h4 style={{ marginBottom: '12px' }}>{lang === 'hi' ? 'मदवार अनुमानित कृषि खर्च' : lang === 'mr' ? 'घटकानुसार अंदाजे शेती खर्च' : 'Detailed Input Cost Breakdown (Estimated)'}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                  <div style={{ padding: '10px', background: 'var(--color-canvas-surface)', borderRadius: '4px' }}>
                    <span>🌱 {lang === 'hi' ? 'प्रमाणित बीज / पौधे:' : lang === 'mr' ? 'प्रमाणित बियाणे / रोपे:' : 'Certified Seeds / Seedlings:'}</span>
                    <strong style={{ display: 'block' }}>₹{detailedRoi.costBreakdown.seeds.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ padding: '10px', background: 'var(--color-canvas-surface)', borderRadius: '4px' }}>
                    <span>🧪 {lang === 'hi' ? 'खाद व सूक्ष्म पोषक तत्व:' : lang === 'mr' ? 'खते व सूक्ष्म अन्नद्रव्ये:' : 'Fertilizers & Micronutrients:'}</span>
                    <strong style={{ display: 'block' }}>₹{detailedRoi.costBreakdown.fertilizerAndNutrients.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ padding: '10px', background: 'var(--color-canvas-surface)', borderRadius: '4px' }}>
                    <span>🛡️ {lang === 'hi' ? 'कीटनाशक व फफूंदनाशक:' : lang === 'mr' ? 'कीडनाशके व बुरशीनाशके:' : 'Pest & Disease Sprays:'}</span>
                    <strong style={{ display: 'block' }}>₹{detailedRoi.costBreakdown.pestAndDiseaseProtection.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ padding: '10px', background: 'var(--color-canvas-surface)', borderRadius: '4px' }}>
                    <span>💧 {lang === 'hi' ? 'सिंचाई और बिजली खर्च:' : lang === 'mr' ? 'सिंचन व वीज खर्च:' : 'Irrigation & Power:'}</span>
                    <strong style={{ display: 'block' }}>₹{detailedRoi.costBreakdown.irrigationAndPower.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ padding: '10px', background: 'var(--color-canvas-surface)', borderRadius: '4px' }}>
                    <span>👨‍🌾 {lang === 'hi' ? 'मजदूरी और कटाई खर्च:' : lang === 'mr' ? 'मजुरी व काढणी खर्च:' : 'Labor & Harvesting:'}</span>
                    <strong style={{ display: 'block' }}>₹{detailedRoi.costBreakdown.laborAndHarvesting.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>

              {/* Multi-Dimensional Risk Analysis (Triple-Coded: Icon + Explicit Text + Border) */}
              <div style={{
                backgroundColor: 'var(--color-canvas-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                marginBottom: '24px',
                border: '1.5px solid var(--color-border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <AlertTriangle size={18} color="var(--color-earth-brown)" />
                  <h4 style={{ fontSize: '1rem', color: 'var(--color-primary-forest)', margin: 0 }}>
                    {t.roi.riskLevel}
                  </h4>
                </div>

                <div className="grid-3">
                  {/* Market Risk */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #E5E7EB'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600, marginBottom: '6px' }}>
                      {lang === 'hi' ? 'बाजार भाव में उतार-चढ़ाव:' : lang === 'mr' ? 'बाजारभाव जोखीम:' : 'Market Price Volatility:'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {detailedRoi.riskAnalysis.marketRisk.level === 'High' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 800, color: '#991B1B', backgroundColor: '#FEE2E2', border: '1.5px solid #FCA5A5', padding: '3px 8px', borderRadius: '6px' }}>
                          <AlertTriangle size={14} color="#DC2626" />
                          {lang === 'hi' || lang === 'mr' ? 'उच्च जोखीम (High Risk)' : 'High Risk'}
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 800, color: '#854D0E', backgroundColor: '#FEF9C3', border: '1.5px solid #FDE047', padding: '3px 8px', borderRadius: '6px' }}>
                          <ShieldAlert size={14} color="#CA8A04" />
                          {lang === 'hi' || lang === 'mr' ? 'मध्यम जोखीम (Medium Risk)' : 'Medium Risk'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Water Risk */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #E5E7EB'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600, marginBottom: '6px' }}>
                      {lang === 'hi' ? 'पानी की आवश्यकता जोखीम:' : lang === 'mr' ? 'पाण्याची गरज जोखीम:' : 'Water Requirement Risk:'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {detailedRoi.riskAnalysis.waterRisk.level === 'High' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 800, color: '#991B1B', backgroundColor: '#FEE2E2', border: '1.5px solid #FCA5A5', padding: '3px 8px', borderRadius: '6px' }}>
                          <AlertTriangle size={14} color="#DC2626" />
                          {lang === 'hi' || lang === 'mr' ? 'जास्त गरज (High Risk)' : 'High Risk'}
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 800, color: '#166534', backgroundColor: '#DCFCE7', border: '1.5px solid #86EFAC', padding: '3px 8px', borderRadius: '6px' }}>
                          <ShieldCheck size={14} color="#16A34A" />
                          {lang === 'hi' || lang === 'mr' ? 'कमी जोखीम (Low Risk)' : 'Low Risk'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cost Vulnerability */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #E5E7EB'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600, marginBottom: '6px' }}>
                      {lang === 'hi' ? 'लागत जोखिम:' : lang === 'mr' ? 'भांडवल जोखीम:' : 'Input Cost Vulnerability:'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 800, color: '#854D0E', backgroundColor: '#FEF9C3', border: '1.5px solid #FDE047', padding: '3px 8px', borderRadius: '6px' }}>
                        <ShieldAlert size={14} color="#CA8A04" />
                        {lang === 'hi' || lang === 'mr' ? 'मध्यम जोखीम (Medium Risk)' : 'Medium Risk'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onNavigate('smart-mandi')}
                >
                  <span>{lang === 'hi' ? `${translateCropName(detailedRoi.crop.name, lang)} के लिए मंडी भाव देखें` : lang === 'mr' ? `${translateCropName(detailedRoi.crop.name, lang)} साठी बाजारभाव तपासा` : `Compare Mandis for ${detailedRoi.crop.name}`}</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onNavigate('disease-scan')}
                >
                  <span>{lang === 'hi' ? 'रोग सुरक्षा मार्गदर्शिका' : lang === 'mr' ? 'पीक रोग संरक्षण मार्गदर्शक' : 'Check Disease Protection Guide'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
