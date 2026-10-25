import React, { useState, useEffect } from 'react';
import { DistrictSelect } from '../components/DistrictSelect.jsx';
import { isMaharashtraDistrict } from '../config/maharashtra.js';
import {
  Sprout,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Database,
  Info,
  Calendar,
  CloudRain
} from 'lucide-react';
import { api } from '../services/api.js';
import { GuidedOptionPicker } from '../components/GuidedOptionPicker.jsx';
import { AudioSpeaker } from '../components/AudioSpeaker.jsx';
import { getTranslation, translateCropName, translateSoilType, translateWaterReliability } from '../services/i18n.js';

export function CropAdvisorPage({ activeProfile, lang, onNavigate }) {
  const t = getTranslation(lang);
  const [currentStep, setCurrentStep] = useState(1);

  // Form State initialized to active user's actual farm parameters
  const [landSize, setLandSize] = useState(activeProfile?.landSize || 2.0);
  const [district, setDistrict] = useState(isMaharashtraDistrict(activeProfile?.district) ? activeProfile.district : 'Nashik');
  const [soilType, setSoilType] = useState(activeProfile?.soilType || 'Black Soil (Regur)');
  const [waterReliability, setWaterReliability] = useState(activeProfile?.waterReliability || 'Moderately Reliable');
  const [budgetPerAcre, setBudgetPerAcre] = useState(40000);
  const [season, setSeason] = useState('Kharif');

  // Recommendation & Comparison State
  const [recommendations, setRecommendations] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState(1);
  const [detailedRoi, setDetailedRoi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDataSources, setShowDataSources] = useState(false);

  useEffect(() => {
    if (activeProfile) {
      if (activeProfile.landSize) setLandSize(activeProfile.landSize);
      if (isMaharashtraDistrict(activeProfile.district)) setDistrict(activeProfile.district);
      if (activeProfile.soilType) setSoilType(activeProfile.soilType);
      if (activeProfile.waterReliability) setWaterReliability(activeProfile.waterReliability);
    }
  }, [activeProfile]);

  useEffect(() => {
    fetchRecommendations();
  }, [soilType, waterReliability, season, budgetPerAcre, landSize, district]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const recs = await api.recommendCrops({
        soilType,
        waterReliability,
        season,
        budgetPerAcre: Number(budgetPerAcre),
        landSize: Number(landSize),
        district
      });
      setRecommendations(recs);
      if (recs && recs.length > 0) {
        setSelectedCropId(recs[0].id);
        fetchCropRoi(recs[0].id);
      } else {
        setDetailedRoi(null);
      }
    } catch (e) {
      console.error('Failed to fetch recommendations:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCropRoi = async (cropId) => {
    try {
      const roi = await api.calculateRoi({
        cropId,
        landSizeAcres: Number(landSize),
        soilType,
        waterReliability,
        budgetPerAcre: Number(budgetPerAcre),
        district
      });
      setDetailedRoi(roi);
    } catch (e) {
      console.error('Failed to fetch crop ROI:', e);
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
      description: lang === 'hi' ? 'कपास, टमाटर, प्याज, सोयाबीन, चना के लिए सर्वोत्तम (1.0x)' : lang === 'mr' ? 'कापूस, टोमॅटो, कांदा, सोयाबीन, हरभऱ्यासाठी उत्तम (1.0x)' : 'Optimal for cotton, tomato, onion, soybean, gram (1.0x)'
    },
    {
      value: 'Red Loam',
      label: lang === 'hi' ? 'लाल दोमट मिट्टी' : lang === 'mr' ? 'तांबडी माती' : 'Red Loam',
      sublabel: lang === 'hi' ? 'अच्छी जल निकासी' : lang === 'mr' ? 'पाण्याचा निचरा होणारी' : 'Well-drained porous',
      description: lang === 'hi' ? 'दालें, मूंगफली, मिर्च, टमाटर के लिए उपयुक्त' : lang === 'mr' ? 'कडधान्ये, भुईमूग, मिरची, टोमॅटोसाठी योग्य' : 'Optimal for pulses, millets, groundnut, chillies'
    },
    {
      value: 'Alluvial Loam',
      label: lang === 'hi' ? 'जलोढ़ मिट्टी (दोमट)' : lang === 'mr' ? 'गाळाची सुपीक माती' : 'Alluvial Loam',
      sublabel: lang === 'hi' ? 'अत्यंत उपजाऊ सिल्ट' : lang === 'mr' ? 'अत्यंत सुपीक गाळ' : 'Highly fertile silt',
      description: lang === 'hi' ? 'गेहूं, धान, मक्का, प्याज, आलू के लिए सर्वोत्तम' : lang === 'mr' ? 'गहू, भात, मका, कांदा, बटाट्यासाठी उत्तम' : 'Optimal for wheat, paddy, maize, onion, potato'
    },
    {
      value: 'Sandy Loam',
      label: lang === 'hi' ? 'बलुई दोमट मिट्टी' : lang === 'mr' ? 'वाळूमिश्रित माती' : 'Sandy Loam',
      sublabel: lang === 'hi' ? 'तेज जल निकासी' : lang === 'mr' ? 'जलद निचरा' : 'Rapid drainage',
      description: lang === 'hi' ? 'आलू, गाजर, कंद फसलों के लिए उपयुक्त' : lang === 'mr' ? 'बटाटा, गाजर, कंद पिकांसाठी योग्य' : 'Optimal for potato, carrot, tuber crops'
    }
  ];

  const waterOptions = [
    {
      value: 'Very Reliable',
      label: lang === 'hi' ? 'उत्तम पानी (नहर / बोरवेल)' : lang === 'mr' ? 'उत्तम बारमाही पाणी (कॅनॉल / विहीर)' : 'Very Reliable',
      sublabel: lang === 'hi' ? 'उच्च उत्पादन स्तर (High Yield)' : lang === 'mr' ? 'भरघोस उत्पादन पातळी (High Yield)' : 'High-yield potential',
      description: lang === 'hi' ? 'गन्ना, धान और सब्जी फसलों के लिए अनुकूल' : lang === 'mr' ? 'ऊस, भात आणि भाजीपाल्यासाठी अनुकूल' : 'Full season assured irrigation availability'
    },
    {
      value: 'Moderately Reliable',
      label: lang === 'hi' ? 'मध्यम पानी की उपलब्धता' : lang === 'mr' ? 'मध्यम पाणी उपलब्धता' : 'Moderately Reliable',
      sublabel: lang === 'hi' ? 'औसत उत्पादन स्तर (Typical Yield)' : lang === 'mr' ? 'सरासरी उत्पादन पातळी (Typical Yield)' : 'Typical baseline yield',
      description: lang === 'hi' ? 'सोयाबीन, गेहूं, प्याज के लिए उपयुक्त' : lang === 'mr' ? 'सोयाबीन, गहू, कांद्यासाठी योग्य' : 'Adequate for medium consumption crops'
    },
    {
      value: 'Mostly Rain-fed',
      label: lang === 'hi' ? 'केवल वर्षा आधारित (बारिश पर)' : lang === 'mr' ? 'केवळ पावसाच्या पाण्यावर' : 'Mostly Rain-fed',
      sublabel: lang === 'hi' ? 'रूढ़िवादी उत्पादन (Low Yield)' : lang === 'mr' ? 'कमी पाऊस उत्पादन (Low Yield)' : 'Dryland conservative yield',
      description: lang === 'hi' ? 'कम पानी वाली दालें, बाजरा, चना' : lang === 'mr' ? 'कमी पाण्यात येणारी कडधान्ये, बाजरी, हरभरा' : 'Best for drought-resistant short-duration crops'
    }
  ];

  const seasonOptions = [
    {
      value: 'Kharif',
      label: lang === 'hi' ? 'खरीफ (मानसून: जून - अक्टूबर)' : lang === 'mr' ? 'खरीप (पावसाळा: जून - ऑक्टोबर)' : 'Kharif',
      sublabel: lang === 'hi' ? 'जून से अक्टूबर' : lang === 'mr' ? 'जून ते ऑक्टोबर' : 'Monsoon: June – Oct',
      description: lang === 'hi' ? 'सोयाबीन, कपास, तुअर, धान, मक्का, टमाटर, मिर्च' : lang === 'mr' ? 'सोयाबीन, कापूस, तूर, भात, मका, टोमॅटो, मिरची' : 'Soybean, Cotton, Tur, Paddy, Maize, Tomato, Chilli'
    },
    {
      value: 'Rabi',
      label: lang === 'hi' ? 'रबी (सर्दी: अक्टूबर - मार्च)' : lang === 'mr' ? 'रब्बी (हिवाळा: ऑक्टोबर - मार्च)' : 'Rabi',
      sublabel: lang === 'hi' ? 'अक्टूबर से मार्च' : lang === 'mr' ? 'ऑक्टोबर ते मार्च' : 'Winter: Oct – March',
      description: lang === 'hi' ? 'गेहूं, चना, प्याज, आलू, मक्का, ज्वार' : lang === 'mr' ? 'गहू, हरभरा, कांदा, बटाटा, मका, ज्वारी' : 'Wheat, Gram (Chana), Onion, Potato, Maize, Jowar'
    },
    {
      value: 'Zaid / Summer',
      label: lang === 'hi' ? 'जायद / उन्हाळी (गर्मी: मार्च - जून)' : lang === 'mr' ? 'उन्हाळी हंगाम (मार्च - जून)' : 'Zaid / Summer',
      sublabel: lang === 'hi' ? 'मार्च से जून' : lang === 'mr' ? 'मार्च ते जून' : 'March – June',
      description: lang === 'hi' ? 'ग्रीष्मकालीन प्याज, टमाटर, मिर्च, मूंग, चारा' : lang === 'mr' ? 'उन्हाळी कांदा, टोमॅटो, मिरची, मूग, भाजीपाला' : 'Summer Onion, Tomato, Chilli, Vegetables, Fodder'
    }
  ];

  const selectedRec = recommendations.find(r => r.id === selectedCropId);

  return (
    <div className="container" style={{ padding: '36px var(--space-md) 64px var(--space-md)' }}>
      {/* Header */}
      <div style={{ maxWidth: '840px', marginBottom: '28px' }}>
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-leaf-green)', fontWeight: 700 }}>
          {lang === 'hi' ? 'चरण 1: कृषि निर्णय प्रणाली' : lang === 'mr' ? 'टप्पा १: कृषी निर्णय प्रणाली' : 'Phase 1: Decision Intelligence'}
        </span>
        <h1 style={{ marginTop: '4px', marginBottom: '8px', color: 'var(--color-primary-forest)' }}>
          {t.roi.title}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
          {t.roi.subtitle}
        </p>
      </div>

      {/* Progress Steps Header */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '28px',
        maxWidth: '820px',
        borderBottom: '1px solid var(--color-border-subtle)',
        paddingBottom: '14px',
        overflowX: 'auto'
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
              padding: '6px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '20px',
              fontSize: '0.88rem',
              fontWeight: currentStep === s.num ? 700 : 500,
              color: currentStep === s.num ? '#FFFFFF' : 'var(--color-text-muted)',
              backgroundColor: currentStep === s.num ? 'var(--color-primary-forest)' : 'transparent',
              transition: 'all var(--transition-fast)'
            }}
          >
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* STEP 1: Land Size & District */}
      {currentStep === 1 && (
        <div className="card" style={{ maxWidth: '820px' }}>
          <h3 style={{ marginBottom: '16px' }}>{t.roi.step1}</h3>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>
              {t.roi.landSizeLabel}
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="range"
                min="0.5"
                max="25"
                step="0.5"
                value={landSize}
                onChange={(e) => setLandSize(parseFloat(e.target.value))}
                style={{ width: '100%', maxWidth: '360px', accentColor: 'var(--color-primary-forest)' }}
              />
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-forest)' }}>
                {landSize} {lang === 'hi' || lang === 'mr' ? 'एकर' : 'Acres'}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {t.roi.landHelper}
            </div>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>
              {t.roi.districtLabel}
            </label>
            <div style={{ maxWidth: '360px' }}>
              <DistrictSelect
                value={district}
                onChange={setDistrict}
                lang={lang}
              />
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {lang === 'hi' ? 'महाराष्ट्र के सभी 36 जिलों के लिए लाइव मंडी और मौसम डेटा' : lang === 'mr' ? 'महाराष्ट्रातील सर्व ३६ जिल्ह्यांसाठी थेट बाजारभाव व हवामान माहिती' : 'Live mandi prices and Open-Meteo weather across all 36 Maharashtra districts'}
            </div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary-forest)', marginBottom: '4px' }}>
                {t.roi.recommendationsTitle} ({season})
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {lang === 'hi'
                  ? `${district} में ${landSize} एकर, ${translateSoilType(soilType, lang)} और ${translateWaterReliability(waterReliability, lang)} के लिए आकलित`
                  : lang === 'mr'
                  ? `${district} मधील ${landSize} एकर, ${translateSoilType(soilType, lang)} आणि ${translateWaterReliability(waterReliability, lang)} साठी आकलित`
                  : `Evaluated for ${landSize} acres of ${soilType} with ${waterReliability} in ${district} (${season})`}
              </div>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCurrentStep(1)}>
              ✏️ {lang === 'hi' ? 'मापदंड बदलें' : lang === 'mr' ? 'तपशील बदला' : 'Adjust Farm Inputs'}
            </button>
          </div>

          {/* Candidate Crops Selector Strip */}
          {recommendations.length === 0 && !loading && (
            <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              {lang === 'hi' ? 'इस सीजन और बजट में कोई फसल नहीं मिली। कृपया सीजन या बजट बदलें।' : lang === 'mr' ? 'या हंगामात व भांडवलात पिके आढळली नाहीत. कृपया हंगाम किंवा भांडवल बदला.' : 'No crops found matching this season. Please adjust season or budget.'}
            </div>
          )}

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
                    minWidth: '230px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary-forest)' }}>{localizedCrop}</span>
                    <span className="badge badge-leaf" title="Season, Soil, Water, Budget points">{rec.suitabilityScore}/100</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                    {rec.durationDays} {lang === 'hi' || lang === 'mr' ? 'दिवस' : 'Days'} • {rec.idealSeason}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-leaf-green)' }}>
                    {lang === 'hi' ? 'अनुमानित मुनाफा:' : lang === 'mr' ? 'अंदाजे नफा:' : 'Est. Profit:'} ₹{rec.economics?.projectedProfit?.toLocaleString('en-IN')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    <span>ROI: {rec.economics?.projectedRoiPercent}%</span>
                    <span style={{ fontWeight: 600, color: rec.risks?.overallRisk === 'High' ? '#DC2626' : rec.risks?.overallRisk === 'Medium' ? '#D97706' : '#166534' }}>
                      {rec.risks?.overallRisk} Risk
                    </span>
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
              {/* Header Title & Read Aloud */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <span className="badge badge-forest" style={{ marginBottom: '6px' }}>
                    {lang === 'hi' ? 'चयनित फसल का वित्तीय विवरण' : lang === 'mr' ? 'निवडलेल्या पिकाचे आर्थिक गणित' : 'Selected Crop Economics'}
                  </span>
                  <h2 style={{ fontSize: '2rem', color: 'var(--color-primary-forest)', margin: '4px 0 6px 0' }}>
                    {translateCropName(detailedRoi.crop.name, lang)}
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {detailedRoi.crop.scientificName} • {lang === 'hi' || lang === 'mr' ? 'कालावधी' : 'Cycle'}: {detailedRoi.crop.durationDays} {lang === 'hi' || lang === 'mr' ? 'दिवस' : 'days'} • {lang === 'hi' ? 'कुल अनुमानित उपज:' : lang === 'mr' ? 'एकूण अंदाजे उत्पादन:' : 'Total Projected Yield:'} <strong>{detailedRoi.parameters.totalProjectedYieldQuintal} {lang === 'hi' || lang === 'mr' ? 'क्विंटल' : 'Quintals'}</strong> ({detailedRoi.parameters.yieldPerAcreQuintal} q/acre)
                  </div>
                </div>

                <AudioSpeaker
                  text={`${translateCropName(detailedRoi.crop.name, lang)} ${t.roi.title}. ${t.roi.investment}: ₹${detailedRoi.financialProjections.totalEstimatedInvestment}. ${t.roi.revenue}: ₹${detailedRoi.financialProjections.projectedGrossRevenue}. ${t.roi.profit}: ₹${detailedRoi.financialProjections.projectedNetProfit}. ROI: ${detailedRoi.financialProjections.projectedRoiPercent}%.`}
                  lang={lang}
                  label={lang === 'hi' ? 'मुनाफा सारांश सुनें' : lang === 'mr' ? 'नफ्याचा अहवाल ऐका' : 'Listen to ROI Summary'}
                />
              </div>

              {/* TRANSPARENT PLAIN ARITHMETIC BREAKDOWN (Check Our Math) */}
              <div style={{
                backgroundColor: '#F3FBF5',
                border: '2px solid #A7D7B5',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1B4332', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🧮</span>
                    <span>{t.roi.plainArithmeticTitle}</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', backgroundColor: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', border: '1px solid #A7D7B5', color: '#166534', fontWeight: 700 }}>
                    {t.roi.plainArithmeticSubtitle}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '0.88rem' }}>
                  {/* Step 1: Yield */}
                  <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '8px', border: '1px solid #CBEBD4' }}>
                    <div style={{ color: '#4B5563', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                      <span>1. {lang === 'hi' ? 'उपज गणना' : lang === 'mr' ? 'उत्पादन हिशोब' : 'Yield Calculation'}</span>
                      <span className="badge badge-leaf" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>{detailedRoi.crop.year || '2025-26'}</span>
                    </div>
                    <div style={{ marginTop: '6px', fontWeight: 700, color: '#1B4332' }}>
                      {detailedRoi.parameters.yieldPerAcreQuintal} q/acre × {detailedRoi.parameters.landSizeAcres} {lang === 'hi' || lang === 'mr' ? 'एकर' : 'acres'}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#166534', marginTop: '2px' }}>
                      = {detailedRoi.parameters.totalProjectedYieldQuintal} Quintals
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '4px' }}>
                      ({detailedRoi.assumptions?.baseYieldPerAcre}q base × {detailedRoi.assumptions?.soilFactor} soil factor)
                    </div>
                  </div>

                  {/* Step 2: Revenue */}
                  <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '8px', border: '1px solid #CBEBD4' }}>
                    <div style={{ color: '#4B5563', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                      <span>2. {lang === 'hi' ? 'कुल आमदनी' : lang === 'mr' ? 'एकूण उत्पन्न' : 'Gross Revenue'}</span>
                      <span className="badge badge-leaf" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                        {detailedRoi.parameters.priceSource === 'live' ? '📡 Live' : detailedRoi.parameters.priceSource === 'msp' ? '🏛️ MSP' : '📘 Ref'}
                      </span>
                    </div>
                    <div style={{ marginTop: '6px', fontWeight: 700, color: '#1B4332' }}>
                      {detailedRoi.parameters.totalProjectedYieldQuintal} q × ₹{detailedRoi.parameters.assumedPricePerQuintal?.toLocaleString('en-IN')}/q
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#166534', marginTop: '2px' }}>
                      = ₹{detailedRoi.financialProjections.projectedGrossRevenue?.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={detailedRoi.parameters.priceSourceLabel}>
                      {detailedRoi.parameters.priceSourceLabel}
                    </div>
                  </div>

                  {/* Step 3: Cost */}
                  <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '8px', border: '1px solid #CBEBD4' }}>
                    <div style={{ color: '#4B5563', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                      <span>3. {lang === 'hi' ? 'कुल शेती खर्च' : lang === 'mr' ? 'एकूण शेती खर्च' : 'Cultivation Cost'}</span>
                      <span className="badge badge-forest" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>CACP A2+FL</span>
                    </div>
                    <div style={{ marginTop: '6px', fontWeight: 700, color: '#1B4332' }}>
                      ₹{detailedRoi.parameters.costPerAcre?.toLocaleString('en-IN')}/acre × {detailedRoi.parameters.landSizeAcres} {lang === 'hi' || lang === 'mr' ? 'एकर' : 'acres'}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>
                      = ₹{detailedRoi.financialProjections.totalEstimatedInvestment?.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '4px' }}>
                      ({lang === 'hi' ? '7 प्रमाणित मदवार लागतों का योग' : lang === 'mr' ? '७ अधिकृत घटकांचा अचूक योग' : 'Sum of 7 itemized cost items'})
                    </div>
                  </div>

                  {/* Step 4: Net Profit */}
                  <div style={{ background: '#DCFCE7', padding: '14px', borderRadius: '8px', border: '1.5px solid #86EFAC' }}>
                    <div style={{ color: '#166534', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      4. {lang === 'hi' ? 'असली शुद्ध मुनाफा' : lang === 'mr' ? 'खरा निव्वळ नफा' : 'Net Take-Home Profit'}
                    </div>
                    <div style={{ marginTop: '6px', fontWeight: 700, color: '#166534' }}>
                      ₹{detailedRoi.financialProjections.projectedGrossRevenue?.toLocaleString('en-IN')} − ₹{detailedRoi.financialProjections.totalEstimatedInvestment?.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#166534', marginTop: '2px' }}>
                      = ₹{detailedRoi.financialProjections.projectedNetProfit?.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#166534', marginTop: '4px' }}>
                      ROI: {detailedRoi.financialProjections.projectedRoiPercent}%
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Major Financial Metrics Grid with Source Badges */}
              <div className="grid-4" style={{ marginBottom: '28px' }}>
                <div style={{ padding: '16px', background: 'var(--color-canvas-surface)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{t.roi.investment}</span>
                    <span className="badge badge-forest" style={{ fontSize: '0.65rem' }}>📘 CACP</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-forest)', marginTop: '4px' }}>
                    ₹{detailedRoi.financialProjections.totalEstimatedInvestment?.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    ₹{detailedRoi.parameters.costPerAcre?.toLocaleString('en-IN')}/acre • {landSize} {lang === 'hi' || lang === 'mr' ? 'एकर' : 'acres'}
                  </div>
                </div>

                <div style={{ padding: '16px', background: 'var(--color-canvas-surface)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{t.roi.revenue}</span>
                    <span className="badge badge-leaf" style={{ fontSize: '0.65rem' }}>
                      {detailedRoi.parameters.priceSource === 'live' ? '📡 Agmarknet' : detailedRoi.parameters.priceSource === 'msp' ? '🏛️ MSP' : '📘 Ref'}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-forest)', marginTop: '4px' }}>
                    ₹{detailedRoi.financialProjections.projectedGrossRevenue?.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    @ ₹{detailedRoi.parameters.assumedPricePerQuintal?.toLocaleString('en-IN')}/q • {detailedRoi.parameters.totalProjectedYieldQuintal} q
                  </div>
                </div>

                <div style={{ padding: '16px', background: 'var(--color-leaf-light)', borderRadius: 'var(--radius-md)', border: '1px solid #D2E4D4' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-leaf-green)', textTransform: 'uppercase', fontWeight: 700 }}>{t.roi.profit}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', backgroundColor: '#FFFFFF', padding: '1px 6px', borderRadius: '4px' }}>
                      ROI {detailedRoi.financialProjections.projectedRoiPercent}%
                    </span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-leaf-green)', marginTop: '4px' }}>
                    ₹{detailedRoi.financialProjections.projectedNetProfit?.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-leaf-green)', fontWeight: 600 }}>
                    {lang === 'hi' ? 'लागत घटाकर हाथ में शुद्ध बचत' : lang === 'mr' ? 'खर्च वजा जाता हातात उरणारा निव्वळ नफा' : 'Net cash profit in farmer hand'}
                  </div>
                </div>

                <div style={{ padding: '16px', background: 'var(--color-canvas-surface)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{t.roi.breakEvenPrice}</span>
                    <span className="badge badge-forest" style={{ fontSize: '0.65rem' }}>Formula</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-forest)', marginTop: '4px' }}>
                    ₹{detailedRoi.financialProjections.breakEvenPricePerQuintal}/q
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {lang === 'hi' ? 'या न्यूनतम उपज:' : lang === 'mr' ? 'किंवा किमान उत्पादन:' : 'Or Min Yield:'} <strong>{detailedRoi.financialProjections.breakEvenYieldQuintal} q</strong> ({detailedRoi.financialProjections.breakEvenYieldPerAcre} q/acre)
                  </div>
                </div>
              </div>

              {/* Itemized Cost Breakdown from cropEconomics.js */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <h4 style={{ margin: 0 }}>
                    {lang === 'hi' ? 'मदवार अधिकृत कृषि खर्च (लागत CACP A2+FL)' : lang === 'mr' ? 'घटकानुसार अधिकृत शेती खर्च (CACP A2+FL)' : 'Itemized Input Cost Breakdown (Authoritative CACP A2+FL)'}
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    📘 {detailedRoi.crop.source} ({detailedRoi.crop.year})
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                  <div style={{ padding: '10px 12px', background: 'var(--color-canvas-surface)', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                    <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '3px' }}>🌱 {t.roi.seedCost}:</span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary-forest)' }}>₹{detailedRoi.costBreakdown.seeds?.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ padding: '10px 12px', background: 'var(--color-canvas-surface)', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                    <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '3px' }}>🧪 {t.roi.fertilizerCost}:</span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary-forest)' }}>₹{detailedRoi.costBreakdown.fertilizerAndNutrients?.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ padding: '10px 12px', background: 'var(--color-canvas-surface)', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                    <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '3px' }}>🛡️ {t.roi.protectionCost}:</span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary-forest)' }}>₹{detailedRoi.costBreakdown.pestAndDiseaseProtection?.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ padding: '10px 12px', background: 'var(--color-canvas-surface)', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                    <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '3px' }}>💧 {t.roi.irrigationCost}:</span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary-forest)' }}>₹{detailedRoi.costBreakdown.irrigationAndPower?.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ padding: '10px 12px', background: 'var(--color-canvas-surface)', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                    <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '3px' }}>👨‍🌾 {t.roi.laborCost}:</span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary-forest)' }}>₹{detailedRoi.costBreakdown.hiredLabour?.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ padding: '10px 12px', background: 'var(--color-canvas-surface)', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                    <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '3px' }}>🚜 {t.roi.machineryCost}:</span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary-forest)' }}>₹{detailedRoi.costBreakdown.machinery?.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ padding: '10px 12px', background: 'var(--color-canvas-surface)', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                    <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '3px' }}>📦 {t.roi.harvestCost}:</span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary-forest)' }}>₹{detailedRoi.costBreakdown.harvestingTransport?.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>

              {/* Transparent Suitability Score Points Breakdown (0 - 100) */}
              {selectedRec?.suitabilityScoreBreakdown && (
                <div style={{
                  backgroundColor: '#F8FAF8',
                  border: '1.5px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  marginBottom: '28px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-primary-forest)' }}>
                      🎯 {t.roi.suitabilityPointsTitle}
                    </h4>
                    <span className="badge badge-forest" style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                      {lang === 'hi' ? 'कुल अंक' : lang === 'mr' ? 'एकूण गुण' : 'Total Score'}: {selectedRec.suitabilityScore} / 100 Points
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
                        <span>🌱 {lang === 'hi' ? 'मिट्टी अनुकूलता' : lang === 'mr' ? 'माती सुसंगतता' : 'Soil Match'}</span>
                        <span style={{ color: '#166534', fontWeight: 800 }}>{selectedRec.suitabilityScoreBreakdown.soil.points} / {selectedRec.suitabilityScoreBreakdown.soil.max} pts</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {selectedRec.suitabilityScoreBreakdown.soil.reason}
                      </div>
                    </div>
                    <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
                        <span>💧 {lang === 'hi' ? 'पानी उपलब्धता' : lang === 'mr' ? 'पाणी उपलब्धता' : 'Water Supply Fit'}</span>
                        <span style={{ color: '#166534', fontWeight: 800 }}>{selectedRec.suitabilityScoreBreakdown.water.points} / {selectedRec.suitabilityScoreBreakdown.water.max} pts</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {selectedRec.suitabilityScoreBreakdown.water.reason}
                      </div>
                    </div>
                    <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
                        <span>💰 {lang === 'hi' ? 'पूंजी बजट अनुकूलता' : lang === 'mr' ? 'भांडवल सुसंगतता' : 'Budget Fit'}</span>
                        <span style={{ color: '#166534', fontWeight: 800 }}>{selectedRec.suitabilityScoreBreakdown.budget.points} / {selectedRec.suitabilityScoreBreakdown.budget.max} pts</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {selectedRec.suitabilityScoreBreakdown.budget.reason}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Multi-Dimensional Risk Analysis (Market CV, Rain forecast, Cost vs Budget) */}
              <div style={{
                backgroundColor: 'var(--color-canvas-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                marginBottom: '28px',
                border: '1.5px solid var(--color-border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} color="var(--color-earth-brown)" />
                    <h4 style={{ fontSize: '1rem', color: 'var(--color-primary-forest)', margin: 0 }}>
                      {t.roi.riskLevel}
                    </h4>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{t.roi.overallRiskTitle}:</span>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      backgroundColor: detailedRoi.riskAnalysis.overallRisk === 'High' ? '#FEE2E2' : detailedRoi.riskAnalysis.overallRisk === 'Medium' ? '#FEF9C3' : '#DCFCE7',
                      color: detailedRoi.riskAnalysis.overallRisk === 'High' ? '#991B1B' : detailedRoi.riskAnalysis.overallRisk === 'Medium' ? '#854D0E' : '#166534',
                      border: detailedRoi.riskAnalysis.overallRisk === 'High' ? '1.5px solid #FCA5A5' : detailedRoi.riskAnalysis.overallRisk === 'Medium' ? '1.5px solid #FDE047' : '1.5px solid #86EFAC'
                    }}>
                      {detailedRoi.riskAnalysis.overallRisk} Risk
                    </span>
                  </div>
                </div>

                <div className="grid-3" style={{ gap: '14px' }}>
                  {/* 1. Market Price Volatility Risk */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1.5px solid #E5E7EB'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600, marginBottom: '6px' }}>
                      {t.roi.marketRiskTitle}:
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      {detailedRoi.riskAnalysis.marketRisk.level === 'High' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 800, color: '#991B1B', backgroundColor: '#FEE2E2', border: '1.5px solid #FCA5A5', padding: '3px 8px', borderRadius: '6px' }}>
                          <AlertTriangle size={14} color="#DC2626" />
                          {detailedRoi.riskAnalysis.marketRisk.label || 'High Risk'}
                        </span>
                      ) : detailedRoi.riskAnalysis.marketRisk.level === 'Low' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 800, color: '#166534', backgroundColor: '#DCFCE7', border: '1.5px solid #86EFAC', padding: '3px 8px', borderRadius: '6px' }}>
                          <ShieldCheck size={14} color="#16A34A" />
                          {detailedRoi.riskAnalysis.marketRisk.label || 'Low Risk'}
                        </span>
                      ) : detailedRoi.riskAnalysis.marketRisk.level === 'Unknown' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 700, color: '#4B5563', backgroundColor: '#F3F4F6', border: '1.5px solid #D1D5DB', padding: '3px 8px', borderRadius: '6px' }}>
                          <Info size={14} color="#6B7280" />
                          {t.roi.notEnoughHistory}
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 800, color: '#854D0E', backgroundColor: '#FEF9C3', border: '1.5px solid #FDE047', padding: '3px 8px', borderRadius: '6px' }}>
                          <ShieldAlert size={14} color="#CA8A04" />
                          {detailedRoi.riskAnalysis.marketRisk.label || 'Medium Risk'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#4B5563', lineHeight: 1.4 }}>
                      {detailedRoi.riskAnalysis.marketRisk.description}
                    </div>
                    {detailedRoi.riskAnalysis.marketRisk.mspComparison && (
                      <div style={{ marginTop: '8px', fontSize: '0.74rem', padding: '4px 8px', background: '#F8FAF8', borderRadius: '4px', border: '1px solid #E5E7EB', color: '#1F2937', fontWeight: 600 }}>
                        🏛️ {detailedRoi.riskAnalysis.marketRisk.mspComparison.note}
                      </div>
                    )}
                  </div>

                  {/* 2. Water Requirement & Rain Forecast Risk */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1.5px solid #E5E7EB'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600, marginBottom: '6px' }}>
                      {t.roi.waterRiskTitle}:
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      {detailedRoi.riskAnalysis.waterRisk.level === 'High' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 800, color: '#991B1B', backgroundColor: '#FEE2E2', border: '1.5px solid #FCA5A5', padding: '3px 8px', borderRadius: '6px' }}>
                          <AlertTriangle size={14} color="#DC2626" />
                          High Risk
                        </span>
                      ) : detailedRoi.riskAnalysis.waterRisk.level === 'Medium' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 800, color: '#854D0E', backgroundColor: '#FEF9C3', border: '1.5px solid #FDE047', padding: '3px 8px', borderRadius: '6px' }}>
                          <ShieldAlert size={14} color="#CA8A04" />
                          Medium Risk
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 800, color: '#166534', backgroundColor: '#DCFCE7', border: '1.5px solid #86EFAC', padding: '3px 8px', borderRadius: '6px' }}>
                          <ShieldCheck size={14} color="#16A34A" />
                          Low Risk
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#4B5563', lineHeight: 1.4 }}>
                      {detailedRoi.riskAnalysis.waterRisk.description}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.74rem', padding: '4px 8px', background: '#F8FAF8', borderRadius: '4px', border: '1px solid #E5E7EB', color: '#1F2937', fontWeight: 600 }}>
                      🌦️ {t.roi.weatherRainTitle} ({district}): <strong>{detailedRoi.riskAnalysis.waterRisk.rain7DayMm} mm</strong>
                    </div>
                  </div>

                  {/* 3. Cost Vulnerability vs Budget */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1.5px solid #E5E7EB'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600, marginBottom: '6px' }}>
                      {t.roi.costRiskTitle}:
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      {detailedRoi.riskAnalysis.costRisk.level === 'High' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 800, color: '#991B1B', backgroundColor: '#FEE2E2', border: '1.5px solid #FCA5A5', padding: '3px 8px', borderRadius: '6px' }}>
                          <AlertTriangle size={14} color="#DC2626" />
                          High Risk
                        </span>
                      ) : detailedRoi.riskAnalysis.costRisk.level === 'Medium' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 800, color: '#854D0E', backgroundColor: '#FEF9C3', border: '1.5px solid #FDE047', padding: '3px 8px', borderRadius: '6px' }}>
                          <ShieldAlert size={14} color="#CA8A04" />
                          Medium Risk
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 800, color: '#166534', backgroundColor: '#DCFCE7', border: '1.5px solid #86EFAC', padding: '3px 8px', borderRadius: '6px' }}>
                          <ShieldCheck size={14} color="#16A34A" />
                          Low Risk
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#4B5563', lineHeight: 1.4 }}>
                      {detailedRoi.riskAnalysis.costRisk.description}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.74rem', padding: '4px 8px', background: '#F8FAF8', borderRadius: '4px', border: '1px solid #E5E7EB', color: '#1F2937', fontWeight: 600 }}>
                      💳 {lang === 'hi' ? 'आपका बजट:' : lang === 'mr' ? 'तुमचे भांडवल:' : 'Your Budget:'} ₹{budgetPerAcre.toLocaleString('en-IN')}/acre
                    </div>
                  </div>
                </div>
              </div>

              {/* 3-Outcome Harvest Sensitivity Simulation Table */}
              {detailedRoi.scenarios && (
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--color-border-subtle)',
                  padding: '20px',
                  marginBottom: '28px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-primary-forest)' }}>
                        📊 {t.roi.scenariosTitle}
                      </h4>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {t.roi.scenariosSubtitle}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.74rem', backgroundColor: '#F3F4F6', padding: '3px 8px', borderRadius: '4px', color: '#4B5563', border: '1px solid #E5E7EB' }}>
                      Pricing: {detailedRoi.scenarios.priceMethod}
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--color-canvas-surface)', textAlign: 'left', borderBottom: '2px solid var(--color-border-subtle)' }}>
                          <th style={{ padding: '10px 12px' }}>Scenario</th>
                          <th style={{ padding: '10px 12px' }}>Yield (q/acre)</th>
                          <th style={{ padding: '10px 12px' }}>Total Yield</th>
                          <th style={{ padding: '10px 12px' }}>Price (₹/q)</th>
                          <th style={{ padding: '10px 12px' }}>Gross Revenue</th>
                          <th style={{ padding: '10px 12px' }}>Total Cost</th>
                          <th style={{ padding: '10px 12px' }}>Net Profit</th>
                          <th style={{ padding: '10px 12px' }}>ROI %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Bad Outcome */}
                        <tr style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: '#FEF2F2' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#991B1B' }}>
                            {t.roi.badScenario}
                            <span style={{ display: 'block', fontSize: '0.72rem', color: '#B91C1C', fontWeight: 500 }}>
                              {t.roi.badScenarioDesc}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>{detailedRoi.scenarios.bad.yieldPerAcre} q</td>
                          <td style={{ padding: '10px 12px' }}>{detailedRoi.scenarios.bad.totalYieldQuintal} q</td>
                          <td style={{ padding: '10px 12px' }}>₹{detailedRoi.scenarios.bad.pricePerQuintal?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 12px' }}>₹{detailedRoi.scenarios.bad.projectedRevenue?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 12px' }}>₹{detailedRoi.financialProjections.totalEstimatedInvestment?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: detailedRoi.scenarios.bad.projectedProfit >= 0 ? '#166534' : '#DC2626' }}>
                            ₹{detailedRoi.scenarios.bad.projectedProfit?.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: detailedRoi.scenarios.bad.projectedRoiPercent >= 0 ? '#166534' : '#DC2626' }}>
                            {detailedRoi.scenarios.bad.projectedRoiPercent}%
                          </td>
                        </tr>

                        {/* Expected Outcome */}
                        <tr style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: '#F0FDF4' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: '#166534' }}>
                            {t.roi.expectedScenario}
                            <span style={{ display: 'block', fontSize: '0.72rem', color: '#15803D', fontWeight: 500 }}>
                              {t.roi.expectedScenarioDesc}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700 }}>{detailedRoi.scenarios.expected.yieldPerAcre} q</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700 }}>{detailedRoi.scenarios.expected.totalYieldQuintal} q</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700 }}>₹{detailedRoi.scenarios.expected.pricePerQuintal?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700 }}>₹{detailedRoi.scenarios.expected.projectedRevenue?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 12px' }}>₹{detailedRoi.financialProjections.totalEstimatedInvestment?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 900, color: '#166534', fontSize: '0.95rem' }}>
                            ₹{detailedRoi.scenarios.expected.projectedProfit?.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 900, color: '#166534', fontSize: '0.95rem' }}>
                            {detailedRoi.scenarios.expected.projectedRoiPercent}%
                          </td>
                        </tr>

                        {/* Good Outcome */}
                        <tr style={{ backgroundColor: '#FFFFFF' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1E40AF' }}>
                            {t.roi.goodScenario}
                            <span style={{ display: 'block', fontSize: '0.72rem', color: '#2563EB', fontWeight: 500 }}>
                              {t.roi.goodScenarioDesc}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>{detailedRoi.scenarios.good.yieldPerAcre} q</td>
                          <td style={{ padding: '10px 12px' }}>{detailedRoi.scenarios.good.totalYieldQuintal} q</td>
                          <td style={{ padding: '10px 12px' }}>₹{detailedRoi.scenarios.good.pricePerQuintal?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 12px' }}>₹{detailedRoi.scenarios.good.projectedRevenue?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 12px' }}>₹{detailedRoi.financialProjections.totalEstimatedInvestment?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: '#166534' }}>
                            ₹{detailedRoi.scenarios.good.projectedProfit?.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: '#166534' }}>
                            {detailedRoi.scenarios.good.projectedRoiPercent}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* COLLAPSIBLE DATA SOURCES & ASSUMPTIONS ACCORDION */}
              <div style={{
                backgroundColor: '#F8FAF8',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--color-border-subtle)',
                marginBottom: '28px',
                overflow: 'hidden'
              }}>
                <button
                  type="button"
                  onClick={() => setShowDataSources(!showDataSources)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Database size={18} color="var(--color-primary-forest)" />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--color-primary-forest)' }}>
                        {t.roi.dataSourcesTitle}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {t.roi.dataSourcesSubtitle}
                      </div>
                    </div>
                  </div>
                  {showDataSources ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {showDataSources && detailedRoi.dataSources && (
                  <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid #E5E7EB' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginTop: '12px' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1.5px solid #D1D5DB', color: '#4B5563' }}>
                          <th style={{ padding: '8px 10px' }}>Metric / Field</th>
                          <th style={{ padding: '8px 10px' }}>Value Used</th>
                          <th style={{ padding: '8px 10px' }}>Unit</th>
                          <th style={{ padding: '8px 10px' }}>Official Authoritative Data Source</th>
                          <th style={{ padding: '8px 10px' }}>As Of / Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedRoi.dataSources.map((ds, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#1F2937' }}>{ds.field}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 800, color: '#166534' }}>
                              {typeof ds.value === 'number' ? `₹${ds.value.toLocaleString('en-IN')}` : ds.value}
                            </td>
                            <td style={{ padding: '8px 10px', color: '#6B7280' }}>{ds.unit || '—'}</td>
                            <td style={{ padding: '8px 10px', color: '#1B4332' }}>{ds.source}</td>
                            <td style={{ padding: '8px 10px', color: '#6B7280' }}>{ds.asOf || ds.year || '2025-26'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Assumptions Panel */}
                    {detailedRoi.assumptions && (
                      <div style={{ marginTop: '16px', padding: '12px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1F2937', marginBottom: '6px' }}>
                          📌 {lang === 'hi' ? 'लागू किए गए कृषि व आर्थिक नियम:' : lang === 'mr' ? 'लागू केलेले कृषी व आर्थिक निकष:' : 'Applied Agricultural & Economic Assumptions:'}
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.78rem', color: '#4B5563', lineHeight: 1.5 }}>
                          <li><strong>Water Reliability Baseline:</strong> {detailedRoi.assumptions.waterReliabilityYieldChoice}</li>
                          <li><strong>Soil Texture Modulation:</strong> {detailedRoi.assumptions.soilFactorNote}</li>
                          <li><strong>Cultivable Land Size:</strong> {detailedRoi.assumptions.landSizeAcres} acres total</li>
                          <li><strong>Scenario Price Range:</strong> {detailedRoi.assumptions.scenarioPriceMethod}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ACCURATE CITATION DISCLAIMER */}
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                marginBottom: '24px',
                fontSize: '0.8rem',
                color: '#6B7280',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Info size={16} color="#6B7280" style={{ flexShrink: 0 }} />
                <span>{detailedRoi.financialProjections.disclaimer || t.roi.disclaimerText}</span>
              </div>

              {/* Actions Navigation */}
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
