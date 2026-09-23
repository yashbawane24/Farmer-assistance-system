import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, TrendingUp, Users, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react';
import { api } from '../services/api.js';
import { AudioSpeaker } from '../components/AudioSpeaker.jsx';
import { getTranslation, translateCropName, translateDayName } from '../services/i18n.js';

export function SmartMandiPage({ activeProfile, lang, onNavigate }) {
  const t = getTranslation(lang);

  const [selectedCrop, setSelectedCrop] = useState(activeProfile?.currentCrop || 'Tomato');
  const [produceQuantity, setProduceQuantity] = useState(activeProfile?.landSize ? Math.round(activeProfile.landSize * 15) : 25);
  const [district, setDistrict] = useState(activeProfile?.district || 'India');

  const [comparisonData, setComparisonData] = useState(null);
  const [priceTrend, setPriceTrend] = useState([]);
  const [transportPools, setTransportPools] = useState([]);
  const [selectedPool, setSelectedPool] = useState(null);
  const [poolJoinedMsg, setPoolJoinedMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeProfile?.currentCrop) setSelectedCrop(activeProfile.currentCrop);
    if (activeProfile?.district) setDistrict(activeProfile.district);
  }, [activeProfile]);

  useEffect(() => {
    loadMandiData();
  }, [selectedCrop, produceQuantity, district]);

  const loadMandiData = async () => {
    setLoading(true);
    try {
      const [compRes, trendRes, poolsRes] = await Promise.all([
        api.compareMandis(selectedCrop, produceQuantity, district),
        api.getMandiPriceTrend(selectedCrop),
        api.getTransportPools()
      ]);
      setComparisonData(compRes);
      setPriceTrend(trendRes);
      setTransportPools(poolsRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPool = async (poolId) => {
    try {
      const res = await api.joinTransportPool({
        poolId,
        farmerName: activeProfile?.fullName || (lang === 'hi' ? 'पंजीकृत किसान' : lang === 'mr' ? 'नोंदणीकृत शेतकरी' : 'Registered Farmer'),
        phone: activeProfile?.phone || '+91 90000 00000',
        produceQuantityQuintal: produceQuantity
      });
      setPoolJoinedMsg(t.mandi.joinedSuccess);
      loadMandiData();
      setTimeout(() => setPoolJoinedMsg(null), 6000);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="container" style={{ padding: '36px var(--space-md) 64px var(--space-md)' }}>
      {/* Header */}
      <div style={{ maxWidth: '800px', marginBottom: '28px' }}>
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-leaf-green)', fontWeight: 700 }}>
          {t.mandi.phase}
        </span>
        <h1 style={{ marginTop: '4px', marginBottom: '8px', color: 'var(--color-primary-forest)' }}>
          {t.mandi.title}
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)' }}>
          {t.mandi.subtitle}
        </p>
      </div>

      {/* Inputs Filter Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: '18px 24px',
        borderRadius: 'var(--radius-md)',
        border: '1.5px solid var(--color-border-subtle)',
        marginBottom: '32px'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            {t.mandi.cropLabel}
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--color-border-strong)',
              fontSize: '0.95rem',
              fontWeight: 600,
              backgroundColor: 'var(--color-canvas-surface)'
            }}
          >
            <option value="Tomato">{translateCropName('Tomato', lang)}</option>
            <option value="Onion">{translateCropName('Onion', lang)}</option>
            <option value="Wheat">{translateCropName('Wheat', lang)}</option>
            <option value="Chilli">{translateCropName('Chilli', lang)}</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            {t.mandi.quantityLabel}
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="number"
              min="5"
              max="200"
              step="5"
              value={produceQuantity}
              onChange={(e) => setProduceQuantity(Number(e.target.value))}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--color-border-strong)',
                fontSize: '0.95rem',
                fontWeight: 700,
                width: '100px',
                backgroundColor: 'var(--color-canvas-surface)'
              }}
            />
            {/* 1-Tap Quick Quintal Presets */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[10, 25, 50, 100].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setProduceQuantity(qty)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: produceQuantity === qty ? '2px solid #1B4332' : '1.5px solid #D1D5DB',
                    backgroundColor: produceQuantity === qty ? '#EAF7EC' : '#FFFFFF',
                    color: produceQuantity === qty ? '#1B4332' : '#374151',
                    fontWeight: produceQuantity === qty ? 800 : 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    minHeight: '36px'
                  }}
                >
                  {qty} q
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            {t.mandi.originLabel}
          </label>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary-forest)', display: 'inline-block', paddingTop: '6px' }}>
            📍 {district}
          </span>
        </div>
      </div>

      {/* PROMINENT USABILITY INSIGHT BANNER */}
      {comparisonData?.insight && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderLeft: '6px solid var(--color-leaf-green)',
          borderTop: '1px solid var(--color-border-subtle)',
          borderRight: '1px solid var(--color-border-subtle)',
          borderBottom: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
          marginBottom: '32px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ maxWidth: '780px' }}>
            <span className="badge badge-leaf" style={{ marginBottom: '6px' }}>{t.mandi.insightTitle}</span>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-primary-forest)', marginBottom: '4px' }}>
              {lang === 'hi'
                ? `${comparisonData.insight.bestMandi} से मिलेगा सबसे ज्यादा शुद्ध मुनाफा`
                : lang === 'mr'
                ? `${comparisonData.insight.bestMandi} मध्ये मिळेल सर्वाधिक निव्वळ नफा`
                : `Why ${comparisonData.insight.bestMandi} Yields Highest Take-Home Profit`}
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-main)', lineHeight: 1.5 }}>
              {comparisonData.insight.explanation}
            </p>
          </div>
          <AudioSpeaker
            text={comparisonData.insight.explanation}
            lang={lang}
            label={lang === 'hi' ? 'मंडी सलाह सुनें' : lang === 'mr' ? 'बाजार सल्ला ऐका' : 'Listen to Mandi Advice'}
          />
        </div>
      )}

      {/* EXPLICIT NET CASH ADVANTAGE CALLOUT */}
      {(() => {
        const bestMandi = comparisonData?.mandis?.find(m => m.isBestNetRealization);
        const otherMandis = comparisonData?.mandis?.filter(m => !m.isBestNetRealization) || [];
        if (!bestMandi || otherMandis.length === 0) return null;
        const secondBest = otherMandis.reduce((prev, cur) => 
          (cur.economics.netTakeHomeRealization > prev.economics.netTakeHomeRealization ? cur : prev), otherMandis[0]
        );
        const diff = bestMandi.economics.netTakeHomeRealization - secondBest.economics.netTakeHomeRealization;
        if (diff <= 0) return null;

        return (
          <div style={{
            backgroundColor: '#DCFCE7',
            border: '2px solid #16A34A',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <ShieldCheck size={26} color="#166534" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#14532D' }}>
                {lang === 'mr'
                  ? `खरा नफा निष्कर्ष: ${bestMandi.mandiName} मध्ये विक्री केल्यास ${secondBest.mandiName} पेक्षा ₹${diff.toLocaleString('en-IN')} जास्त रोकड हातात मिळेल!`
                  : lang === 'hi'
                  ? `असली मुनाफा निष्कर्ष: ${bestMandi.mandiName} में बेचने पर ${secondBest.mandiName} की तुलना में ₹${diff.toLocaleString('en-IN')} अधिक नकद हाथ में मिलेंगे!`
                  : `Real Profit Verdict: Selling at ${bestMandi.mandiName} puts ₹${diff.toLocaleString('en-IN')} more cash in your hand than ${secondBest.mandiName} after all deductions!`}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: '3px' }}>
                {lang === 'mr'
                  ? `(वाहतूक खर्च आणि मार्केट फी वजा करून काढलेला हा प्रत्यक्ष नफा आहे)`
                  : lang === 'hi'
                  ? `(यह भाड़ा और मंडी शुल्क घटाने के बाद का शुद्ध लाभ है)`
                  : `(Calculated after deducting transport freight and handling charges)`}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MANDI COMPARISON CARDS GRID */}
      <h3 style={{ fontSize: '1.3rem', marginBottom: '18px', color: 'var(--color-primary-forest)' }}>
        {lang === 'hi'
          ? `${translateCropName(selectedCrop, lang)} के ${produceQuantity} क्विंटल के लिए मंडी भाव तुलना`
          : lang === 'mr'
          ? `${translateCropName(selectedCrop, lang)} च्या ${produceQuantity} क्विंटलसाठी बाजार समिती तुलना`
          : `APMC Markets Comparison for ${produceQuantity} Quintals of ${selectedCrop}`}
      </h3>

      <div className="grid-3" style={{ marginBottom: '48px' }}>
        {comparisonData?.mandis?.map((mandi) => {
          return (
            <div
              key={mandi.mandiId}
              className={`mandi-card ${mandi.isBestNetRealization ? 'best-choice' : ''}`}
            >
              {mandi.isBestNetRealization && (
                <div className="mandi-card-ribbon">
                  ★ {t.mandi.bestChoice}
                </div>
              )}
              {mandi.isHighestRawPrice && !mandi.isBestNetRealization && (
                <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--color-terracotta)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderBottomLeftRadius: '6px' }}>
                  {lang === 'hi' ? 'ऊंचा भाव (लेकिन भारी भाड़ा)' : lang === 'mr' ? 'जास्त भाव (पण जास्त भाडे)' : 'Highest Raw Quote (Heavy Freight)'}
                </div>
              )}

              <div>
                <h4 style={{ fontSize: '1.2rem', color: 'var(--color-primary-forest)', marginBottom: '4px' }}>
                  {mandi.mandiName}
                </h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {mandi.district} ({mandi.distanceKm} km {lang === 'hi' || lang === 'mr' ? 'खेत से दूर' : 'from farm'})
                </div>
              </div>

              {/* Math breakdown */}
              <div style={{ background: 'var(--color-canvas-surface)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                <div className="math-breakdown-row">
                  <span>{t.mandi.modalPrice}:</span>
                  <strong style={{ fontSize: '1.05rem' }}>₹{mandi.quotedModalPriceQuintal}/q</strong>
                </div>

                <div className="math-breakdown-row">
                  <span>{t.mandi.grossRealization} ({produceQuantity} q):</span>
                  <span>₹{mandi.economics.rawGrossRevenue.toLocaleString('en-IN')}</span>
                </div>

                <div className="math-breakdown-row" style={{ color: 'var(--color-terracotta)' }}>
                  <span>{t.mandi.transportCost} ({mandi.distanceKm} km):</span>
                  <span>-₹{mandi.economics.totalTransportCost.toLocaleString('en-IN')}</span>
                </div>

                <div className="math-breakdown-row" style={{ color: 'var(--color-terracotta)' }}>
                  <span>{lang === 'hi' ? 'हमाली / मंडी शुल्क:' : lang === 'mr' ? 'हमाली / मार्केट फी:' : 'Handling / Market Fee:'}</span>
                  <span>-₹{mandi.economics.handlingFees.toLocaleString('en-IN')}</span>
                </div>

                <div className="math-breakdown-row net-total">
                  <span>{t.mandi.netRealization}:</span>
                  <span>₹{mandi.economics.netTakeHomeRealization.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{lang === 'hi' ? 'प्रति क्विंटल असली भाव:' : lang === 'mr' ? 'प्रति क्विंटल खरा भाव:' : 'Effective Net Rate:'}</span>
                <span style={{ fontWeight: 800, color: mandi.isBestNetRealization ? 'var(--color-leaf-green)' : 'var(--color-text-main)', fontSize: '1.1rem' }}>
                  ₹{mandi.economics.effectiveNetPricePerQuintal} / {lang === 'hi' || lang === 'mr' ? 'क्विंटल' : 'quintal'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION: 7-DAY PRICE TREND VISUALIZATION */}
      <div className="card" style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary-forest)' }}>
              <TrendingUp size={22} />
              <h3 style={{ fontSize: '1.25rem' }}>{lang === 'hi' ? '7-दिवसीय भाव और आवक रुझान' : lang === 'mr' ? '७ दिवसांचा बाजारभाव व आवक कल' : '7-Day Modal Price & Arrival Trend'}</h3>
            </div>
            <p style={{ fontSize: '0.85rem', marginTop: '2px', color: 'var(--color-text-muted)' }}>
              {lang === 'hi'
                ? `${translateCropName(selectedCrop, lang)} के लिए पिछले 7 दिनों का मंडी भाव इतिहास`
                : lang === 'mr'
                ? `${translateCropName(selectedCrop, lang)} साठी मागील ७ दिवसांचे बाजार समिती दर`
                : `Historical daily auction prices across regional benchmark APMCs for ${selectedCrop}.`}
            </p>
          </div>
          <span className="badge badge-wheat">{lang === 'hi' ? 'सत्यापित मंडी भाव' : lang === 'mr' ? 'सत्यापित बाजारभाव' : 'APMC Verified Rates'}</span>
        </div>

        {/* Lightweight SVG Bar Visualization */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '180px', paddingTop: '20px', borderBottom: '2px solid var(--color-border-strong)' }}>
          {priceTrend.map((pt, idx) => {
            const heightPercent = Math.max(25, Math.min(100, ((pt.price - 1800) / 1000) * 100));
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary-forest)' }}>₹{pt.price}</span>
                <div
                  style={{
                    width: '36px',
                    height: `${heightPercent}px`,
                    backgroundColor: idx === priceTrend.length - 1 ? 'var(--color-primary-forest)' : 'var(--color-accent-wheat)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease'
                  }}
                  title={`Arrivals: ${pt.arrivals} tonnes`}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{translateDayName(pt.day, lang)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION: NEARBY FARMER TRANSPORT POOLING */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1.5px solid var(--color-border-subtle)',
        padding: '32px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary-forest)' }}>
              <Truck size={24} color="var(--color-leaf-green)" />
              <h3 style={{ fontSize: '1.35rem' }}>{t.mandi.poolsTitle}</h3>
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {t.mandi.poolsSubtitle}
            </p>
          </div>
          <span className="badge badge-leaf">{t.mandi.savings}</span>
        </div>

        {poolJoinedMsg && (
          <div style={{ padding: '14px 18px', background: '#D2E4D4', color: '#1B382B', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontWeight: 700, fontSize: '0.9rem' }}>
            ✅ {poolJoinedMsg}
          </div>
        )}

        <div className="grid-3">
          {transportPools.map((pool) => {
            const fillPercent = Math.round((pool.current_produce_quintal / pool.capacity_quintal) * 100);
            return (
              <div
                key={pool.id}
                style={{
                  border: '1.5px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  backgroundColor: 'var(--color-canvas-surface)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-primary-forest)' }}>{lang === 'hi' ? 'समूह' : lang === 'mr' ? 'गट' : 'Pool'} #{pool.id}: {translateCropName(pool.crop_name, lang)}</span>
                  <span className="badge badge-wheat">{pool.vehicle_type}</span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                  {lang === 'hi' ? 'स्थान:' : lang === 'mr' ? 'हब:' : 'Hub:'} <strong>{pool.pickup_hub}</strong> → {pool.mandi_name}
                </div>

                {/* Capacity progress */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                    <span>{t.mandi.capacityFilled}:</span>
                    <strong>{pool.current_produce_quintal} / {pool.capacity_quintal} {lang === 'hi' || lang === 'mr' ? 'क्विंटल' : 'Quintals'} ({fillPercent}%)</strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--color-canvas-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${fillPercent}%`, height: '100%', background: 'var(--color-leaf-green)', borderRadius: '4px' }} />
                  </div>
                </div>

                {/* Savings math */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px dashed var(--color-border-strong)', fontSize: '0.82rem' }}>
                  <span>{lang === 'hi' ? 'अकेले का भाड़ा:' : lang === 'mr' ? 'एकट्याचा वाहतूक खर्च:' : 'Solo Transport Cost:'}</span>
                  <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)' }}>₹{pool.individual_freight_rate}/q</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--color-border-strong)', fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-leaf-green)' }}>
                  <span>{lang === 'hi' ? 'साझा भाड़ा दर:' : lang === 'mr' ? 'सामाईक भाडे दर:' : 'Pooled Freight Rate:'}</span>
                  <span>₹{pool.pooled_freight_rate}/q (-{pool.savings_percentage}%)</span>
                </div>

                {/* Pool Members */}
                <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {lang === 'hi' ? `समूह में जुड़े किसान (${pool.members?.length || 0}):` : lang === 'mr' ? `गटातील शेतकरी (${pool.members?.length || 0}):` : `Farmers in this Pool (${pool.members?.length || 0}):`}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-main)' }}>
                    {pool.members?.map(m => m.farmer_name).join(', ') || (lang === 'hi' ? 'अभी कोई सदस्य नहीं' : lang === 'mr' ? 'अद्याप सदस्य नाहीत' : 'No members yet')}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm btn-block"
                  onClick={() => handleJoinPool(pool.id)}
                >
                  <Users size={15} />
                  <span>{t.mandi.joinPool} ({produceQuantity} {lang === 'hi' || lang === 'mr' ? 'क्विंटल' : 'Quintals'})</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
