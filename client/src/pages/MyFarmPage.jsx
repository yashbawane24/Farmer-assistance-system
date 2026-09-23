import React, { useState, useEffect } from 'react';
import { Sprout, User, MapPin, Save, CheckCircle2 } from 'lucide-react';
import { GuidedOptionPicker } from '../components/GuidedOptionPicker.jsx';
import { api } from '../services/api.js';
import { getTranslation, translateCropName, translateCropStage } from '../services/i18n.js';

export function MyFarmPage({ activeProfile, onUpdateProfile, lang }) {
  const t = getTranslation(lang);

  const [fullName, setFullName] = useState(activeProfile?.fullName || '');
  const [district, setDistrict] = useState(activeProfile?.district || '');
  const [state, setState] = useState(activeProfile?.state || '');
  const [farmName, setFarmName] = useState(activeProfile?.farmName || '');
  const [landSize, setLandSize] = useState(activeProfile?.landSize || 2.0);
  const [soilType, setSoilType] = useState(activeProfile?.soilType || 'Black Soil (Regur)');
  const [waterReliability, setWaterReliability] = useState(activeProfile?.waterReliability || 'Moderately Reliable');
  const [currentCrop, setCurrentCrop] = useState(activeProfile?.currentCrop || 'Tomato');
  const [cropStage, setCropStage] = useState(activeProfile?.cropStage || 'Vegetative Stage');

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (activeProfile) {
      setFullName(activeProfile.fullName || '');
      setDistrict(activeProfile.district || '');
      setState(activeProfile.state || '');
      setFarmName(activeProfile.farmName || (lang === 'hi' ? `${activeProfile.fullName || 'मेरा'} का खेत प्लॉट` : lang === 'mr' ? `${activeProfile.fullName || 'माझे'} शेत प्लॉट` : `${activeProfile.fullName || 'My'}'s Farm Plot`));
      setLandSize(activeProfile.landSize || 2.0);
      setSoilType(activeProfile.soilType || 'Black Soil (Regur)');
      setWaterReliability(activeProfile.waterReliability || 'Moderately Reliable');
      setCurrentCrop(activeProfile.currentCrop || 'Tomato');
      setCropStage(activeProfile.cropStage || 'Vegetative Stage');
    }
  }, [activeProfile, lang]);

  const handleSave = async (e) => {
    e.preventDefault();
    const updated = {
      fullName,
      district,
      state,
      farmName,
      landSize: Number(landSize),
      soilType,
      waterReliability,
      currentCrop,
      cropStage
    };
    onUpdateProfile(updated);
    try {
      if (activeProfile?.id) {
        await api.updateFarm(activeProfile.id, {
          farm_name: farmName,
          land_size_acres: Number(landSize),
          soil_type: soilType,
          water_reliability: waterReliability,
          current_crop: currentCrop,
          crop_stage: cropStage
        });
      }
    } catch (err) {
      console.warn('Profile sync warning:', err);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const cropStages = [
    {
      value: 'Germination & Seedling',
      label: lang === 'hi' ? 'अंकुरण व पौध (रोपवाटिका)' : lang === 'mr' ? 'उगवण व रोपवाटिका (दिवस १–२५)' : 'Seedling',
      description: lang === 'hi' ? 'दिन 1-25: जड़ स्थापना' : lang === 'mr' ? 'दिवस १–२५: मुळांची वाढ' : 'Days 1–25: Early root establishment'
    },
    {
      value: 'Vegetative Growth',
      label: lang === 'hi' ? 'वानस्पतिक बढ़वार (दिन 25-45)' : lang === 'mr' ? 'वाढीची अवस्था (दिवस २५–४५)' : 'Vegetative',
      description: lang === 'hi' ? 'दिन 25-45: पत्तों व शाखाओं का विकास' : lang === 'mr' ? 'दिवस २५–४५: फांद्या व पानांची वाढ' : 'Days 25–45: Foliage & canopy expansion'
    },
    {
      value: 'Flowering to Fruit Set',
      label: lang === 'hi' ? 'फूल व फल लगना (दिन 45-70)' : lang === 'mr' ? 'फुलोरा व फळधारणा (दिवस ४५–७०)' : 'Flowering',
      description: lang === 'hi' ? 'दिन 45-70: परागण व शुरुआती फल' : lang === 'mr' ? 'दिवस ४५–७०: परागीभवन व फळधारणा' : 'Days 45–70: Pollination & early fruit set'
    },
    {
      value: 'Fruit Maturation & Harvest',
      label: lang === 'hi' ? 'फल पकना व कटाई (दिन 70-110)' : lang === 'mr' ? 'फळ पक्वता व काढणी (दिवस ७०–११०)' : 'Harvesting',
      description: lang === 'hi' ? 'दिन 70-110: तुड़ाई व श्रेणीकरण' : lang === 'mr' ? 'दिवस ७०–११०: काढणी व प्रतवारी' : 'Days 70–110: Fruit ripening & sorting'
    }
  ];

  return (
    <div className="container" style={{ padding: '36px var(--space-md) 64px var(--space-md)', maxWidth: '920px' }}>
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-leaf-green)', fontWeight: 700 }}>
          {t.myFarm.phase}
        </span>
        <h1 style={{ marginTop: '4px', marginBottom: '8px', color: 'var(--color-primary-forest)' }}>
          {t.myFarm.title}
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>
          {t.myFarm.subtitle}
        </p>
      </div>

      {savedSuccess && (
        <div style={{ padding: '14px 18px', background: '#D2E4D4', color: '#1B382B', borderRadius: 'var(--radius-sm)', marginBottom: '24px', fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} /> {t.myFarm.successMsg}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="card" style={{ padding: '32px' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', color: 'var(--color-primary-forest)' }}>
          {t.myFarm.sectionTitle}
        </h3>

        <div className="grid-2" style={{ marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px' }}>
              {t.myFarm.fullName}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--color-border-strong)',
                fontSize: '0.95rem',
                backgroundColor: 'var(--color-canvas-surface)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px' }}>
              {t.myFarm.farmName}
            </label>
            <input
              type="text"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--color-border-strong)',
                fontSize: '0.95rem',
                backgroundColor: 'var(--color-canvas-surface)'
              }}
            />
          </div>
        </div>

        <div className="grid-3" style={{ marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px' }}>
              {t.myFarm.district}
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--color-border-strong)',
                fontSize: '0.95rem',
                backgroundColor: 'var(--color-canvas-surface)'
              }}
            >
              <option value="Nashik">{lang === 'mr' ? 'नाशिक' : lang === 'hi' ? 'नासिक' : 'Nashik'}</option>
              <option value="Pune">{lang === 'mr' ? 'पुणे' : lang === 'hi' ? 'पुणे' : 'Pune'}</option>
              <option value="Ahmednagar">{lang === 'mr' ? 'अहमदनगर' : lang === 'hi' ? 'अहमदनगर' : 'Ahmednagar'}</option>
              <option value="Karnal">{lang === 'mr' ? 'कर्नाल' : lang === 'hi' ? 'करनाल' : 'Karnal'}</option>
              <option value="Guntur">{lang === 'mr' ? 'गुंटूर' : lang === 'hi' ? 'गुंटूर' : 'Guntur'}</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px' }}>
              {t.myFarm.landSize}
            </label>
            <input
              type="number"
              step="0.1"
              value={landSize}
              onChange={(e) => setLandSize(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--color-border-strong)',
                fontSize: '0.95rem',
                backgroundColor: 'var(--color-canvas-surface)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px' }}>
              {t.myFarm.currentCrop}
            </label>
            <select
              value={currentCrop}
              onChange={(e) => setCurrentCrop(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--color-border-strong)',
                fontSize: '0.95rem',
                backgroundColor: 'var(--color-canvas-surface)'
              }}
            >
              <option value="Tomato">{translateCropName('Tomato', lang)}</option>
              <option value="Onion">{translateCropName('Onion', lang)}</option>
              <option value="Wheat">{translateCropName('Wheat', lang)}</option>
              <option value="Cotton">{translateCropName('Cotton', lang)}</option>
              <option value="Chilli">{translateCropName('Chilli', lang)}</option>
            </select>
          </div>
        </div>

        {/* Growth Stage Selector */}
        <div style={{ marginBottom: '28px' }}>
          <GuidedOptionPicker
            label={lang === 'hi' ? 'आपकी खड़ी फसल की वर्तमान अवस्था क्या है?' : lang === 'mr' ? 'तुमच्या उभ्या पिकाची सद्य अवस्था कोणती आहे?' : 'What is the current growth stage of your standing crop?'}
            options={cropStages}
            selectedValue={cropStage}
            onSelect={setCropStage}
            idPrefix="stage"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '0 28px' }}>
            <Save size={16} />
            <span>{t.myFarm.saveBtn}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
