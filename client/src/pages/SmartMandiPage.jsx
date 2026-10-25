import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, TrendingUp, Users, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react';
import { api } from '../services/api.js';
import { AudioSpeaker } from '../components/AudioSpeaker.jsx';
import { getTranslation, translateCropName } from '../services/i18n.js';
import { DistrictSelect } from '../components/DistrictSelect.jsx';
import { MANDI_CROPS, isMaharashtraDistrict, districtLabel } from '../config/maharashtra.js';

export function SmartMandiPage({ activeProfile, lang, onNavigate }) {
  const t = getTranslation(lang);

  const [selectedCrop, setSelectedCrop] = useState(activeProfile?.currentCrop || 'Tomato');
  const [produceQuantity, setProduceQuantity] = useState(activeProfile?.landSize ? Math.round(activeProfile.landSize * 15) : 25);
  const [district, setDistrict] = useState(isMaharashtraDistrict(activeProfile?.district) ? activeProfile.district : 'Nashik');

  const [comparisonData, setComparisonData] = useState(null);
  const [priceTrend, setPriceTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeProfile?.currentCrop) setSelectedCrop(activeProfile.currentCrop);
    if (isMaharashtraDistrict(activeProfile?.district)) setDistrict(activeProfile.district);
  }, [activeProfile]);

  useEffect(() => {
    loadMandiData();
  }, [selectedCrop, produceQuantity, district]);

  const loadMandiData = async () => {
    setLoading(true);
    try {
      const [compRes, trendRes] = await Promise.all([
        api.compareMandis(selectedCrop, produceQuantity, district),
        api.getMandiPriceTrend(selectedCrop)
      ]);
      setComparisonData(compRes);
      setPriceTrend(trendRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const bestMandi = comparisonData?.mandis?.find(m => m.isBestNetRealization) || comparisonData?.mandis?.[0];
  const bestMandiName = bestMandi?.mandiName || (lang === 'hi' ? 'सर्वोत्तम मंडी' : lang === 'mr' ? 'सर्वोत्तम बाजार' : 'Best Mandi');

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
            {MANDI_CROPS.map((c) => (
              <option key={c} value={c}>{translateCropName(c, lang)}</option>
            ))}
            {!MANDI_CROPS.includes(selectedCrop) && <option value={selectedCrop}>{translateCropName(selectedCrop, lang)}</option>}
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
          <DistrictSelect
            value={district}
            onChange={setDistrict}
            lang={lang}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--color-border-strong)',
              fontSize: '0.95rem',
              fontWeight: 600,
              backgroundColor: 'var(--color-canvas-surface)'
            }}
          />
        </div>
      </div>

      {/* LIVE DATA SOURCE STATUS */}
      {comparisonData && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 16px',
          alignItems: 'center',
          fontSize: '0.85rem',
          color: 'var(--color-text-muted)',
          marginTop: '-16px',
          marginBottom: '24px'
        }}>
          <span>
            📡 {lang === 'mr' ? 'स्रोत: Agmarknet, भारत सरकार' : lang === 'hi' ? 'स्रोत: Agmarknet, भारत सरकार' : 'Source: Agmarknet, Government of India'}
          </span>
          {comparisonData.latestArrivalDate && (
            <span>
              🗓️ {lang === 'mr' ? 'नवीनतम आवक दिनांक' : lang === 'hi' ? 'नवीनतम आवक तिथि' : 'Latest arrival date'}: <strong>{comparisonData.latestArrivalDate}</strong>
            </span>
          )}
          <span>
            🏪 {comparisonData.totalMandisReporting} {lang === 'mr' ? 'बाजार समित्यांचे दर (मागील १५ दिवस)' : lang === 'hi' ? 'मंडियों के भाव (पिछले 15 दिन)' : 'Maharashtra APMCs reporting (last 15 days)'}
          </span>
          {comparisonData.crop?.msp && (
            <span>
              🛡️ MSP: <strong>₹{comparisonData.crop.msp.toLocaleString('en-IN')}/q</strong> ({comparisonData.crop.mspYear})
            </span>
          )}
        </div>
      )}

      {comparisonData && comparisonData.mandis.length === 0 && (
        <div style={{
          backgroundColor: '#FEF3C7',
          border: '1.5px solid #F59E0B',
          borderRadius: 'var(--radius-md)',
          padding: '18px 22px',
          marginBottom: '32px',
          color: '#92400E',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <AlertCircle size={22} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>
            {!comparisonData.dataSource?.liveFeedConfigured
              ? (lang === 'mr'
                ? 'थेट बाजारभाव सुरू नाहीत: सर्व्हरवर DATA_GOV_API_KEY सेट केलेला नाही. data.gov.in वरून मोफत की घ्या.'
                : lang === 'hi'
                ? 'लाइव मंडी भाव चालू नहीं हैं: सर्वर पर DATA_GOV_API_KEY सेट नहीं है। data.gov.in से मुफ्त की लें।'
                : 'Live mandi prices are not switched on: DATA_GOV_API_KEY is not set on the server. Get a free key from data.gov.in.')
              : (lang === 'mr'
                ? `मागील १५ दिवसांत महाराष्ट्रातील कोणत्याही बाजार समितीने ${translateCropName(selectedCrop, lang)} चा दर नोंदवलेला नाही.`
                : lang === 'hi'
                ? `पिछले 15 दिनों में महाराष्ट्र की किसी मंडी ने ${translateCropName(selectedCrop, lang)} का भाव दर्ज नहीं किया है।`
                : `No Maharashtra APMC has reported a ${selectedCrop} price in the last 15 days.`)}
            {comparisonData.dataSource?.syncError && comparisonData.dataSource?.liveFeedConfigured && (
              <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>({comparisonData.dataSource.syncError})</div>
            )}
          </div>
        </div>
      )}

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
                  {districtLabel(mandi.district, lang)} (~{mandi.distanceKm} km {lang === 'hi' ? 'अनुमानित दूरी' : lang === 'mr' ? 'अंदाजे अंतर' : 'est. road distance'})
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {mandi.variety} • {lang === 'hi' ? 'दिनांक' : lang === 'mr' ? 'दिनांक' : 'Reported'} {mandi.priceDate}
                </div>
              </div>

              {/* Math breakdown */}
              <div style={{ background: 'var(--color-canvas-surface)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                <div className="math-breakdown-row">
                  <span>{t.mandi.modalPrice}:</span>
                  <strong style={{ fontSize: '1.05rem' }}>₹{mandi.quotedModalPriceQuintal}/q</strong>
                </div>

                <div className="math-breakdown-row" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <span>{lang === 'hi' ? 'न्यूनतम – अधिकतम:' : lang === 'mr' ? 'किमान – कमाल:' : 'Min – Max:'}</span>
                  <span>₹{mandi.priceRange.min} – ₹{mandi.priceRange.max}</span>
                </div>

                {mandi.msp && (
                  <div className="math-breakdown-row" style={{ fontSize: '0.8rem', fontWeight: 700, color: mandi.quotedModalPriceQuintal >= mandi.msp ? 'var(--color-leaf-green)' : 'var(--color-terracotta)' }}>
                    <span>{mandi.quotedModalPriceQuintal >= mandi.msp
                      ? (lang === 'hi' ? 'MSP से ऊपर' : lang === 'mr' ? 'हमीभावापेक्षा जास्त' : 'Above MSP')
                      : (lang === 'hi' ? 'MSP से नीचे' : lang === 'mr' ? 'हमीभावापेक्षा कमी' : 'Below MSP')}</span>
                    <span>{mandi.quotedModalPriceQuintal >= mandi.msp ? '+' : '-'}₹{Math.abs(mandi.quotedModalPriceQuintal - mandi.msp)}/q</span>
                  </div>
                )}

                <div className="math-breakdown-row">
                  <span>{t.mandi.grossRealization} ({produceQuantity} q):</span>
                  <span>₹{mandi.economics.rawGrossRevenue.toLocaleString('en-IN')}</span>
                </div>

                <div className="math-breakdown-row" style={{ color: 'var(--color-terracotta)' }}>
                  <span>{t.mandi.transportCost} (~{mandi.distanceKm} km × ₹{comparisonData.assumptions.freightRatePerKmQuintal}/q):</span>
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

      {/* SECTION: REAL PRICE HISTORY (built day by day from Agmarknet reports) */}
      <div className="card" style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary-forest)' }}>
              <TrendingUp size={22} />
              <h3 style={{ fontSize: '1.25rem' }}>{lang === 'hi' ? 'भाव का रुझान (पिछले 30 दिन)' : lang === 'mr' ? 'बाजारभावाचा कल (मागील ३० दिवस)' : 'Price Trend (last 30 days)'}</h3>
            </div>
            <p style={{ fontSize: '0.85rem', marginTop: '2px', color: 'var(--color-text-muted)' }}>
              {lang === 'hi'
                ? `${translateCropName(selectedCrop, lang)} का महाराष्ट्र की मंडियों में औसत मॉडल भाव (₹/क्विंटल)`
                : lang === 'mr'
                ? `${translateCropName(selectedCrop, lang)} चा महाराष्ट्रातील बाजार समित्यांमधील सरासरी सर्वसाधारण दर (₹/क्विंटल)`
                : `Average modal price of ${selectedCrop} across Maharashtra APMCs (₹/quintal)`}
            </p>
          </div>
          <span className="badge badge-wheat">Agmarknet • {lang === 'hi' || lang === 'mr' ? 'भारत सरकार' : 'Govt. of India'}</span>
        </div>

        {priceTrend.length >= 2 ? (() => {
          const prices = priceTrend.map((pt) => pt.price);
          const low = Math.min(...prices);
          const high = Math.max(...prices);
          const span = Math.max(high - low, 1);
          return (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '200px', paddingTop: '20px', borderBottom: '2px solid var(--color-border-strong)', overflowX: 'auto' }}>
              {priceTrend.map((pt, idx) => {
                const heightPx = 30 + ((pt.price - low) / span) * 120;
                return (
                  <div key={pt.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '44px', flex: 1 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary-forest)' }}>₹{pt.price}</span>
                    <div
                      style={{
                        width: '28px',
                        height: `${heightPx}px`,
                        backgroundColor: idx === priceTrend.length - 1 ? 'var(--color-primary-forest)' : 'var(--color-accent-wheat)',
                        borderRadius: '4px 4px 0 0'
                      }}
                      title={`${pt.date}: ₹${pt.minPrice}–₹${pt.maxPrice}, ${pt.markets} APMC`}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{pt.day}</span>
                  </div>
                );
              })}
            </div>
          );
        })() : (
          <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', padding: '24px 0', textAlign: 'center' }}>
            {lang === 'hi'
              ? 'अभी रुझान दिखाने के लिए पर्याप्त दिनों का डेटा नहीं है। हर दिन नए भाव जुड़ने पर यह चार्ट अपने-आप भर जाएगा।'
              : lang === 'mr'
              ? 'कल दाखवण्यासाठी अजून पुरेसे दिवसांचे दर नाहीत. रोज नवीन दर आल्यावर हा तक्ता आपोआप भरेल.'
              : 'Not enough days of data yet to show a trend. This chart fills in automatically as new daily prices arrive.'}
          </p>
        )}
      </div>

      {/* SECTION: TRANSPORT POOLING CTA CARD */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--color-border-subtle)',
          padding: '28px 32px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', maxWidth: '720px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: '#EBF5ED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Truck size={28} color="var(--color-primary-forest)" />
          </div>
          <div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: 'var(--color-primary-forest)', fontWeight: 800 }}>
              {lang === 'mr'
                ? `${bestMandiName} साठी एकत्र वाहन करून वाहतूक खर्च वाचवा`
                : lang === 'hi'
                ? `${bestMandiName} के लिए ट्रक साझा करें और भाड़ा बचाएं`
                : `Share a truck to ${bestMandiName} and save on freight`}
            </h4>
            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              {lang === 'mr'
                ? 'परिसरातील इतर शेतकऱ्यांसोबत जागा शेअर करून प्रति क्विंटल ५०% पर्यंत वाहतूक खर्च कमी करा.'
                : lang === 'hi'
                ? 'आसपास के किसानों के साथ वाहन क्षमता साझा करके प्रति क्विंटल 50% तक भाड़ा कम करें।'
                : 'Combine your produce with nearby farmers to slash per-quintal transportation costs by up to 50%.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ minHeight: '48px', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
          onClick={() => {
            if (onNavigate) {
              onNavigate('transport-pools', {
                crop: selectedCrop,
                mandi: bestMandi?.mandiName,
                district: district,
                quantity: produceQuantity
              });
            }
          }}
        >
          <span>
            {lang === 'mr'
              ? 'वाहतूक गट पहा →'
              : lang === 'hi'
              ? 'परिवहन समूह देखें →'
              : 'View transport pools →'}
          </span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
