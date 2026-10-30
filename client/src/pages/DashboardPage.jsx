import React, { useState, useEffect } from 'react';
import {
  CloudRain, Sun, CloudSun, Moon, CloudMoon, Droplets, Wind, Thermometer, Umbrella,
  ShieldAlert, ShoppingBag, Mic, Truck, FileText, Sprout, ArrowRight, AlertTriangle,
  MapPin, CalendarDays, Info, RefreshCw
} from 'lucide-react';
import { api } from '../services/api.js';
import { AudioSpeaker } from '../components/AudioSpeaker.jsx';
import { DistrictSelect } from '../components/DistrictSelect.jsx';
import { districtLabel, isMaharashtraDistrict } from '../config/maharashtra.js';
import {
  translateWeatherCondition,
  translateCropName,
  translateCropStage,
  translateSoilType,
  translateWaterReliability,
  translateVariety
} from '../services/i18n.js';

// Every label on this page, in all three languages
const TEXT = {
  en: {
    greeting: 'Namaskar', todayAdvice: "Today's advice for your farm", listen: 'Listen',
    weatherSource: 'Live weather: Open-Meteo', updated: 'updated',
    myFarm: 'My farm', crop: 'Crop', stage: 'Stage', area: 'Area', acres: 'acres', soil: 'Soil', water: 'Water',
    sowing: 'Sown on', dayOf: 'Day {day} of about {total}', pastDuration: 'Day {day} since sowing - usual crop length is about {total} days, so harvest is due.', addSowing: 'Add your sowing date in My Farm to track crop days.', editFarm: 'Edit my farm',
    mandiTitle: "Today's mandi rate", nearYou: 'APMCs nearest to you', perQ: '/quintal', reported: 'Reported',
    km: 'km', mspLabel: 'Government MSP', aboveMsp: 'above MSP', belowMsp: 'below MSP',
    staleWarn: 'Latest price is {days} days old. Mandi may be closed or not reported yet.',
    snapshotWarn: 'Live prices not synced yet - showing the last saved Agmarknet report.',
    noMandi: 'No Maharashtra APMC has reported {crop} in the last 15 days.',
    mandiSource: 'Source: Agmarknet, Government of India', compareAll: 'Compare all mandis',
    incomeTitle: 'Expected income from your crop', incomeSub: 'Estimate for {acres} acres of {crop}',
    yieldLine: 'Expected harvest', priceLine: 'Price used', grossLine: 'Expected sale value', costLine: 'Cultivation cost', profitLine: 'Expected profit', lossLine: 'Expected loss',
    breakEven: 'You need at least ₹{price}/quintal to cover costs.',
    priceLive: 'average of {n} APMC{s} in {scope}, {date}', priceMsp: 'Government MSP (no recent mandi report)', priceHist: 'long-term average (no recent mandi report)',
    costSrc: 'Cost & yield source', estimateNote: 'This is an estimate. Real income depends on rain, pests and the price on the day you sell.',
    noIncome: 'Cost data is not available for this crop yet.', openAdvisor: 'Open Crop Advisor',
    trendTitle: 'Price trend - last 30 days', trendSub: 'Average modal price across Maharashtra APMCs (₹/quintal)', trendFew: 'Not enough days of price data yet.',
    weatherNow: 'Weather now', feels: 'Feels like', maxMin: 'Max / Min today', humidity: 'Humidity', rain: 'Rain chance', wind: 'Wind',
    todayHours: 'Today', morning: 'Morning 9 am', afternoon: 'Afternoon 3 pm', evening: 'Evening 6 pm', night: 'Night 9 pm',
    next4: 'Next 4 days', weatherDown: 'Live weather is unavailable right now. Please try again in a few minutes.',
    alerts: 'Alerts for your crop', noAlerts: 'No warnings for your crop today.',
    quick: 'Quick actions', manageFarm: 'Manage your farm', scan: 'Scan a leaf', scanSub: 'Photo diagnosis by AI', ask: 'Ask Krishi Mitra', askSub: 'Voice or text', pools: 'Share a truck', poolsSub: 'Transport pools', schemes: 'Govt schemes', schemesSub: 'Subsidies & support',
    retry: 'Try again', loading: 'Loading your farm data...'
  },
  hi: {
    greeting: 'नमस्कार', todayAdvice: 'आपके खेत के लिए आज की सलाह', listen: 'सुनें',
    weatherSource: 'लाइव मौसम: Open-Meteo', updated: 'अपडेट',
    myFarm: 'मेरा खेत', crop: 'फसल', stage: 'अवस्था', area: 'क्षेत्र', acres: 'एकड़', soil: 'मिट्टी', water: 'पानी',
    sowing: 'बुवाई', dayOf: 'लगभग {total} में से दिन {day}', pastDuration: 'बुवाई से {day}वां दिन - फसल की सामान्य अवधि लगभग {total} दिन है, कटाई का समय हो गया।', addSowing: 'फसल के दिन देखने के लिए "मेरा खेत" में बुवाई की तारीख डालें।', editFarm: 'खेत की जानकारी बदलें',
    mandiTitle: 'आज का मंडी भाव', nearYou: 'आपके सबसे नजदीकी APMC', perQ: '/क्विंटल', reported: 'तारीख',
    km: 'किमी', mspLabel: 'सरकारी MSP', aboveMsp: 'MSP से ऊपर', belowMsp: 'MSP से नीचे',
    staleWarn: 'नवीनतम भाव {days} दिन पुराना है। मंडी बंद हो सकती है या भाव अभी दर्ज नहीं हुआ।',
    snapshotWarn: 'लाइव भाव अभी सिंक नहीं हुए - आखिरी सहेजी गई Agmarknet रिपोर्ट दिखा रहे हैं।',
    noMandi: 'पिछले 15 दिनों में महाराष्ट्र की किसी मंडी ने {crop} का भाव दर्ज नहीं किया।',
    mandiSource: 'स्रोत: Agmarknet, भारत सरकार', compareAll: 'सभी मंडियों की तुलना करें',
    incomeTitle: 'आपकी फसल से अनुमानित आय', incomeSub: '{acres} एकड़ {crop} के लिए अनुमान',
    yieldLine: 'अनुमानित उपज', priceLine: 'लिया गया भाव', grossLine: 'अनुमानित बिक्री', costLine: 'खेती का खर्च', profitLine: 'अनुमानित मुनाफा', lossLine: 'अनुमानित घाटा',
    breakEven: 'खर्च निकालने के लिए कम से कम ₹{price}/क्विंटल भाव चाहिए।',
    priceLive: '{scope} की {n} मंडियों का औसत, {date}', priceMsp: 'सरकारी MSP (हाल का मंडी भाव नहीं मिला)', priceHist: 'लंबी अवधि का औसत (हाल का मंडी भाव नहीं मिला)',
    costSrc: 'खर्च व उपज का स्रोत', estimateNote: 'यह अनुमान है। असली आय बारिश, कीट और बिक्री के दिन के भाव पर निर्भर करती है।',
    noIncome: 'इस फसल का खर्च डेटा अभी उपलब्ध नहीं है।', openAdvisor: 'फसल सलाहकार खोलें',
    trendTitle: 'भाव का रुझान - पिछले 30 दिन', trendSub: 'महाराष्ट्र की मंडियों का औसत मॉडल भाव (₹/क्विंटल)', trendFew: 'अभी पर्याप्त दिनों का भाव डेटा नहीं है।',
    weatherNow: 'अभी का मौसम', feels: 'महसूस', maxMin: 'आज अधिकतम / न्यूनतम', humidity: 'नमी', rain: 'बारिश की संभावना', wind: 'हवा',
    todayHours: 'आज', morning: 'सुबह 9 बजे', afternoon: 'दोपहर 3 बजे', evening: 'शाम 6 बजे', night: 'रात 9 बजे',
    next4: 'अगले 4 दिन', weatherDown: 'लाइव मौसम अभी उपलब्ध नहीं है। कुछ मिनट बाद फिर कोशिश करें।',
    alerts: 'आपकी फसल के लिए चेतावनी', noAlerts: 'आज आपकी फसल के लिए कोई चेतावनी नहीं।',
    quick: 'जल्दी पहुंचें', manageFarm: 'अपने खेत का प्रबंधन', scan: 'पत्ती की जांच', scanSub: 'AI से फोटो जांच', ask: 'कृषि मित्र से पूछें', askSub: 'बोलकर या लिखकर', pools: 'ट्रक साझा करें', poolsSub: 'परिवहन समूह', schemes: 'सरकारी योजनाएं', schemesSub: 'सब्सिडी व सहायता',
    retry: 'फिर कोशिश करें', loading: 'आपके खेत की जानकारी लोड हो रही है...'
  },
  mr: {
    greeting: 'नमस्कार', todayAdvice: 'तुमच्या शेतासाठी आजचा सल्ला', listen: 'ऐका',
    weatherSource: 'थेट हवामान: Open-Meteo', updated: 'अद्ययावत',
    myFarm: 'माझे शेत', crop: 'पीक', stage: 'अवस्था', area: 'क्षेत्र', acres: 'एकर', soil: 'माती', water: 'पाणी',
    sowing: 'पेरणी', dayOf: 'सुमारे {total} पैकी दिवस {day}', pastDuration: 'पेरणीपासून {day} वा दिवस - पिकाचा सामान्य कालावधी सुमारे {total} दिवस, काढणीची वेळ झाली.', addSowing: 'पिकाचे दिवस पाहण्यासाठी "माझे शेत" मध्ये पेरणीची तारीख भरा.', editFarm: 'शेताची माहिती बदला',
    mandiTitle: 'आजचा बाजारभाव', nearYou: 'तुमच्या जवळच्या बाजार समित्या', perQ: '/क्विंटल', reported: 'दिनांक',
    km: 'किमी', mspLabel: 'शासकीय हमीभाव (MSP)', aboveMsp: 'हमीभावापेक्षा जास्त', belowMsp: 'हमीभावापेक्षा कमी',
    staleWarn: 'नवीनतम भाव {days} दिवस जुना आहे. बाजार बंद असू शकतो किंवा भाव अजून नोंदवला नाही.',
    snapshotWarn: 'थेट भाव अजून सिंक झाले नाहीत - शेवटचा जतन केलेला Agmarknet अहवाल दाखवत आहोत.',
    noMandi: 'मागील 15 दिवसांत महाराष्ट्रातील कोणत्याही बाजार समितीने {crop} चा भाव नोंदवलेला नाही.',
    mandiSource: 'स्रोत: Agmarknet, भारत सरकार', compareAll: 'सर्व बाजारांची तुलना करा',
    incomeTitle: 'तुमच्या पिकातून अपेक्षित उत्पन्न', incomeSub: '{acres} एकर {crop} साठी अंदाज',
    yieldLine: 'अपेक्षित उत्पादन', priceLine: 'घेतलेला भाव', grossLine: 'अपेक्षित विक्री', costLine: 'लागवड खर्च', profitLine: 'अपेक्षित नफा', lossLine: 'अपेक्षित तोटा',
    breakEven: 'खर्च भरून काढण्यासाठी किमान ₹{price}/क्विंटल भाव हवा.',
    priceLive: '{scope} मधील {n} बाजार समित्यांची सरासरी, {date}', priceMsp: 'शासकीय हमीभाव (अलीकडील बाजारभाव उपलब्ध नाही)', priceHist: 'दीर्घकालीन सरासरी (अलीकडील बाजारभाव उपलब्ध नाही)',
    costSrc: 'खर्च व उत्पादनाचा स्रोत', estimateNote: 'हा अंदाज आहे. खरे उत्पन्न पाऊस, कीड आणि विक्रीच्या दिवशीच्या भावावर अवलंबून असते.',
    noIncome: 'या पिकाचा खर्चाचा डेटा अजून उपलब्ध नाही.', openAdvisor: 'पीक सल्लागार उघडा',
    trendTitle: 'भावाचा कल - मागील 30 दिवस', trendSub: 'महाराष्ट्रातील बाजार समित्यांचा सरासरी सर्वसाधारण भाव (₹/क्विंटल)', trendFew: 'अजून पुरेशा दिवसांचे भाव उपलब्ध नाहीत.',
    weatherNow: 'आत्ताचे हवामान', feels: 'जाणवणारे', maxMin: 'आज कमाल / किमान', humidity: 'आर्द्रता', rain: 'पावसाची शक्यता', wind: 'वारा',
    todayHours: 'आज', morning: 'सकाळी 9', afternoon: 'दुपारी 3', evening: 'संध्याकाळी 6', night: 'रात्री 9',
    next4: 'पुढील 4 दिवस', weatherDown: 'थेट हवामान आत्ता उपलब्ध नाही. काही मिनिटांनी पुन्हा प्रयत्न करा.',
    alerts: 'तुमच्या पिकासाठी इशारे', noAlerts: 'आज तुमच्या पिकासाठी कोणताही इशारा नाही.',
    quick: 'झटपट सेवा', manageFarm: 'तुमच्या शेताचे व्यवस्थापन', scan: 'पानाची तपासणी', scanSub: 'AI द्वारे फोटो निदान', ask: 'कृषी मित्राला विचारा', askSub: 'बोलून किंवा लिहून', pools: 'ट्रक शेअर करा', poolsSub: 'वाहतूक गट', schemes: 'शासकीय योजना', schemesSub: 'अनुदान व मदत',
    retry: 'पुन्हा प्रयत्न करा', loading: 'तुमच्या शेताची माहिती लोड होत आहे...'
  }
};

const LOCALE = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
const fill = (s, p) => s.replace(/\{(\w+)\}/g, (_, k) => (p[k] !== undefined ? p[k] : ''));
const money = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function formatDate(iso, lang, opts = { day: 'numeric', month: 'short' }) {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00+05:30`);
  return isNaN(d) ? iso : d.toLocaleDateString(LOCALE[lang] || 'en-IN', opts);
}

function weatherIcon(condition = '', isDay = true, size = 22) {
  const c = condition.toLowerCase();
  if (c.includes('thunder')) return <CloudRain size={size} color="#7C3AED" />;
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return <CloudRain size={size} color="#2563EB" />;
  if (!isDay) return c.includes('cloud') || c.includes('overcast') ? <CloudMoon size={size} color="#6366F1" /> : <Moon size={size} color="#6366F1" />;
  if (c.includes('cloud') || c.includes('overcast') || c.includes('fog')) return <CloudSun size={size} color="#059669" />;
  return <Sun size={size} color="#D97706" />;
}

const card = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E7E2D6',
  borderRadius: '14px',
  padding: '14px 16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
};
const sectionTitle = { fontSize: '0.98rem', fontWeight: 800, color: '#1B4332', margin: 0 };
const muted = { fontSize: '0.8rem', color: '#6B7280' };
const sourceStyle = { fontSize: '0.74rem', color: '#6B7280', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px' };

function Stat({ icon, label, value }) {
  return (
    <div style={{ background: '#F7F5EF', borderRadius: '8px', padding: '6px 8px', minWidth: 0 }}>
      <div style={{ ...muted, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem' }}>{icon}{label}</div>
      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1F2937', marginTop: '1px' }}>{value}</div>
    </div>
  );
}

function Chip({ label, value }) {
  return (
    <span style={{ background: '#F7F5EF', border: '1px solid #EEE9DD', borderRadius: '999px', padding: '4px 10px', fontSize: '0.78rem' }}>
      <span style={{ color: '#6B7280' }}>{label}: </span><strong>{value}</strong>
    </span>
  );
}

function Notice({ children, tone = 'amber' }) {
  const tones = {
    amber: { bg: '#FEF3C7', border: '#F59E0B', color: '#92400E' },
    grey: { bg: '#F3F4F6', border: '#D1D5DB', color: '#374151' }
  }[tone];
  return (
    <div style={{ background: tones.bg, border: `1px solid ${tones.border}`, color: tones.color, borderRadius: '10px', padding: '10px 12px', fontSize: '0.84rem', display: 'flex', gap: '8px', alignItems: 'flex-start', lineHeight: 1.45 }}>
      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
      <span>{children}</span>
    </div>
  );
}

export function DashboardPage({ onNavigate, activeProfile, lang = 'en' }) {
  const L = TEXT[lang] || TEXT.en;
  const crop = activeProfile?.currentCrop || 'Tomato';
  const stage = activeProfile?.cropStage || 'Vegetative Stage';
  const acres = Number(activeProfile?.landSize) || 2;
  const [district, setDistrict] = useState(isMaharashtraDistrict(activeProfile?.district) ? activeProfile.district : 'Nashik');

  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [weatherError, setWeatherError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (isMaharashtraDistrict(activeProfile?.district)) setDistrict(activeProfile.district);
  }, [activeProfile?.district]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setWeatherError(false);
      const [w, f, a, s] = await Promise.allSettled([
        api.getTodayWeatherStatus(district, crop, stage),
        api.getWeatherForecast(district),
        api.getActiveAlerts(district, crop, stage),
        api.getDashboardSummary({ district, crop, acres, soil: activeProfile?.soilType || 'Black Soil (Regur)', water: activeProfile?.waterReliability || 'Moderately Reliable' })
      ]);
      if (cancelled) return;
      setWeather(w.status === 'fulfilled' && w.value?.current_temp_c != null ? w.value : null);
      setWeatherError(w.status !== 'fulfilled' || w.value?.current_temp_c == null);
      setForecast(f.status === 'fulfilled' && Array.isArray(f.value) ? f.value.slice(1, 5) : []);
      setAlerts(a.status === 'fulfilled' && Array.isArray(a.value) ? a.value : []);
      setSummary(s.status === 'fulfilled' ? s.value : null);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [district, crop, stage, acres, lang, reloadKey]);

  const cropLocal = translateCropName(crop, lang);
  const today = new Date().toLocaleDateString(LOCALE[lang], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Days since sowing (only when the farmer has entered a sowing date)
  let cropDay = null;
  if (activeProfile?.sowingDate) {
    const days = Math.floor((Date.now() - new Date(`${activeProfile.sowingDate}T00:00:00+05:30`).getTime()) / 86400000) + 1;
    if (days > 0) cropDay = days;
  }

  const mandi = summary?.mandi;
  const income = summary?.income;
  const trend = summary?.trend || [];

  const priceSourceText = (() => {
    if (!income) return '';
    if (income.priceSource === 'live') {
      const scope = income.priceScope && income.priceScope !== 'Maharashtra' ? districtLabel(income.priceScope, lang) : (lang === 'en' ? 'Maharashtra' : 'महाराष्ट्र');
      return fill(L.priceLive, { n: income.priceMarkets, s: income.priceMarkets > 1 && lang === 'en' ? 's' : '', scope, date: formatDate(income.priceAsOf, lang) });
    }
    return income.priceSource === 'msp' ? L.priceMsp : L.priceHist;
  })();

  const quickActions = [
    { route: 'disease-scan', icon: <ShieldAlert size={20} />, title: L.scan, sub: L.scanSub, color: '#BC4749' },
    { route: 'ai-agronomist', icon: <Mic size={20} />, title: L.ask, sub: L.askSub, color: '#0F766E' },
    { route: 'transport-pools', icon: <Truck size={20} />, title: L.pools, sub: L.poolsSub, color: '#386641' },
    { route: 'schemes', icon: <FileText size={20} />, title: L.schemes, sub: L.schemesSub, color: '#2563EB' }
  ];

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '14px 16px 40px', color: '#1F2937' }}>

      {/* Greeting + district */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', margin: 0, color: '#1B4332' }}>
            {L.greeting}, {activeProfile?.fullName?.split(' ')[0] || ''}
          </h1>
          <div style={{ ...muted, fontSize: '0.88rem', marginTop: '4px' }}>{today}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '220px' }}>
          <MapPin size={18} color="#2E7D32" />
          <DistrictSelect value={district} onChange={setDistrict} lang={lang} style={{ height: '44px' }} />
        </div>
      </div>

      {/* Today's advice (from live weather) */}
      <div style={{ background: '#1B4332', color: '#F0FFF4', borderRadius: '14px', padding: '12px 16px', marginBottom: '14px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ maxWidth: '860px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#C8F169', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            {L.todayAdvice} · {districtLabel(district, lang)} · {cropLocal}
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.45 }}>
            {loading ? L.loading : (weather?.farmImpactAdvice || L.weatherDown)}
          </div>
          {weather && (
            <div style={{ fontSize: '0.74rem', color: '#B7E4C7', marginTop: '6px' }}>
              {L.weatherSource} · {L.updated} {weather.currentTime}
            </div>
          )}
        </div>
        {weather?.farmImpactAdvice && <AudioSpeaker text={weather.farmImpactAdvice} lang={lang} label={L.listen} />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', alignItems: 'start' }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Farm banner with quick actions */}
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ position: 'relative' }}>
              <img src="/farm_manage_banner.jpg" alt="" loading="lazy" style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17,32,25,0.75), rgba(17,32,25,0) 60%)' }} />
              <div style={{ position: 'absolute', left: '14px', bottom: '10px', color: '#FFFFFF', fontWeight: 800, fontSize: '1.05rem' }}>{L.manageFarm}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', padding: '10px' }}>
              {quickActions.map((q) => (
                <button key={q.route} type="button" onClick={() => onNavigate(q.route)} title={q.sub} style={{ background: '#FFFFFF', border: '1.5px solid #E7E2D6', borderRadius: '10px', padding: '8px 4px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minHeight: '64px' }}>
                  <span style={{ color: q.color }}>{q.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.74rem', color: '#1F2937', textAlign: 'center', lineHeight: 1.2 }}>{q.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* My farm */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={sectionTitle}><Sprout size={18} style={{ verticalAlign: '-3px', marginRight: '6px' }} />{L.myFarm}</h2>
              <button type="button" onClick={() => onNavigate('my-farm')} style={{ background: 'none', border: 'none', color: '#2E7D32', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>{L.editFarm}</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <Chip label={L.crop} value={cropLocal} />
              <Chip label={L.stage} value={translateCropStage(stage, lang)} />
              <Chip label={L.area} value={`${acres} ${L.acres}`} />
              <Chip label={L.soil} value={translateSoilType(activeProfile?.soilType || 'Black Soil (Regur)', lang)} />
              <Chip label={L.water} value={translateWaterReliability(activeProfile?.waterReliability || 'Moderately Reliable', lang)} />
              {activeProfile?.sowingDate && <Chip label={L.sowing} value={formatDate(activeProfile.sowingDate, lang)} />}
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.84rem' }}>
              {cropDay
                ? <span style={{ fontWeight: 700, color: '#1B4332' }}><CalendarDays size={15} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{fill(summary?.crop?.durationDays && cropDay > summary.crop.durationDays ? L.pastDuration : L.dayOf, { day: cropDay, total: summary?.crop?.durationDays || '?' })}</span>
                : <span style={muted}>{L.addSowing}</span>}
            </div>
          </div>

          {/* Mandi rate */}
          <div style={card}>
            <h2 style={sectionTitle}><ShoppingBag size={18} style={{ verticalAlign: '-3px', marginRight: '6px' }} />{L.mandiTitle} · {cropLocal}</h2>
            <div style={{ ...muted, margin: '2px 0 8px' }}>{L.nearYou}</div>
            {loading ? (
              <div style={{ height: '120px', background: '#F3F4F6', borderRadius: '10px' }} />
            ) : mandi && mandi.nearest.length > 0 ? (
              <>
                {mandi.isSnapshot && <div style={{ marginBottom: '10px' }}><Notice>{L.snapshotWarn}</Notice></div>}
                {!mandi.isSnapshot && mandi.daysSinceLatest > 2 && <div style={{ marginBottom: '10px' }}><Notice>{fill(L.staleWarn, { days: mandi.daysSinceLatest })}</Notice></div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {mandi.nearest.map((m) => (
                    <div key={m.mandiId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '8px 10px', border: '1px solid #EEE9DD', borderRadius: '10px' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                          {m.mandiName}
                          {m.variety && m.variety !== 'Other' && <span style={{ ...muted, fontWeight: 600 }}> · {translateVariety(m.variety, lang)}</span>}
                        </div>
                        <div style={muted}>{districtLabel(m.district, lang)} · ~{m.distanceKm} {L.km} · {L.reported} {formatDate(m.priceDate, lang)}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1B4332' }}>{money(m.quotedModalPriceQuintal)}<span style={{ ...muted, fontWeight: 500 }}>{L.perQ}</span></div>
                        <div style={muted}>{money(m.priceRange.min)} – {money(m.priceRange.max)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {mandi.msp && (
                  <div style={{ marginTop: '10px', fontSize: '0.84rem' }}>
                    {L.mspLabel}: <strong>{money(mandi.msp)}{L.perQ}</strong>
                    {' · '}
                    <span style={{ fontWeight: 700, color: mandi.nearest[0].quotedModalPriceQuintal >= mandi.msp ? '#166534' : '#B91C1C' }}>
                      {mandi.nearest[0].quotedModalPriceQuintal >= mandi.msp ? L.aboveMsp : L.belowMsp}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <Notice tone="grey">{fill(L.noMandi, { crop: cropLocal })}</Notice>
            )}
            <div style={sourceStyle}><Info size={13} />{L.mandiSource}</div>
            <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }} onClick={() => onNavigate('smart-mandi')}>
              {L.compareAll} <ArrowRight size={14} />
            </button>
          </div>

          {/* Expected income: plain arithmetic the farmer can check */}
          <div style={card}>
            <h2 style={sectionTitle}>{L.incomeTitle}</h2>
            <div style={{ ...muted, margin: '2px 0 8px' }}>{fill(L.incomeSub, { acres, crop: cropLocal })}</div>
            {loading ? (
              <div style={{ height: '140px', background: '#F3F4F6', borderRadius: '10px' }} />
            ) : income ? (
              <>
                <div style={{ fontSize: '0.86rem', display: 'grid', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{L.yieldLine}</span><strong>{Math.round(income.totalYieldQuintal * 10) / 10} q</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span>{L.priceLine}<div style={{ ...muted, fontSize: '0.72rem' }}>{priceSourceText}</div></span>
                    <strong style={{ whiteSpace: 'nowrap' }}>× {money(income.pricePerQuintal)}{L.perQ}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #D6D0C2', paddingTop: '8px' }}><span>{L.grossLine}</span><strong>{money(income.grossIncome)}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B91C1C' }}><span>{L.costLine}</span><strong>− {money(income.totalCost)}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1.5px solid #1B4332', paddingTop: '8px', fontSize: '1.05rem' }}>
                    <span style={{ fontWeight: 800 }}>{income.netProfit >= 0 ? L.profitLine : L.lossLine}</span>
                    <strong style={{ color: income.netProfit >= 0 ? '#166534' : '#B91C1C' }}>{money(Math.abs(income.netProfit))}</strong>
                  </div>
                </div>
                {income.breakEvenPrice > 0 && <div style={{ ...muted, marginTop: '8px' }}>{fill(L.breakEven, { price: Math.round(income.breakEvenPrice).toLocaleString('en-IN') })}</div>}
                {income.costSource && <div style={sourceStyle}><Info size={13} />{L.costSrc}: {income.costSource}{income.costYear ? ` (${income.costYear})` : ''}</div>}
                <div style={{ ...muted, marginTop: '8px', fontStyle: 'italic' }}>{L.estimateNote}</div>
              </>
            ) : (
              <Notice tone="grey">{L.noIncome}</Notice>
            )}
            <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }} onClick={() => onNavigate('crop-advisor')}>
              {L.openAdvisor} <ArrowRight size={14} />
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Weather now */}
          <div style={{ ...card, background: '#F1F8F2', borderColor: '#CFE6D4' }}>
            <h2 style={sectionTitle}>{L.weatherNow} · {districtLabel(district, lang)}</h2>
            {loading ? (
              <div style={{ height: '180px', background: '#E5EFE7', borderRadius: '10px', marginTop: '12px' }} />
            ) : weather ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
                  {weatherIcon(weather.condition, weather.is_day, 32)}
                  <div>
                    <div style={{ fontSize: '1.9rem', fontWeight: 800, lineHeight: 1, color: '#1B4332' }}>{Math.round(weather.current_temp_c)}°C</div>
                    <div style={{ fontWeight: 600 }}>{translateWeatherCondition(weather.condition, lang)}</div>
                    <div style={muted}>{L.feels} {Math.round(weather.feels_like_c)}°C · {weather.timePeriodLabel}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  <Stat icon={<Thermometer size={13} />} label={L.maxMin} value={`${weather.temp_max_c}° / ${weather.temp_min_c}°`} />
                  <Stat icon={<Umbrella size={13} />} label={L.rain} value={`${weather.rainfall_prob_percent}%`} />
                  <Stat icon={<Droplets size={13} />} label={L.humidity} value={`${weather.humidity_percent}%`} />
                  <Stat icon={<Wind size={13} />} label={L.wind} value={`${weather.wind_speed_kmh} km/h`} />
                </div>
                {weather.todaySlots && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ ...muted, fontWeight: 700, marginBottom: '4px' }}>{L.todayHours}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {['morning', 'afternoon', 'evening', 'night'].map((slot) => {
                        const s = weather.todaySlots[slot];
                        return (
                          <div key={slot} style={{ background: '#FFFFFF', border: '1px solid #DCEBDF', borderRadius: '10px', padding: '8px 4px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', color: '#4B5563', fontWeight: 600 }}>{L[slot]}</div>
                            <div style={{ margin: '4px 0' }}>{weatherIcon(s?.condition || '', slot !== 'night', 18)}</div>
                            <div style={{ fontWeight: 800 }}>{s?.temp_c != null ? `${s.temp_c}°` : '–'}</div>
                            {s?.rain_prob != null && <div style={{ fontSize: '0.68rem', color: '#2563EB' }}>{s.rain_prob}%</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div style={sourceStyle}><Info size={13} />{L.weatherSource} · {L.updated} {weather.currentTime}</div>
              </>
            ) : (
              <div style={{ marginTop: '12px' }}>
                <Notice>{L.weatherDown}</Notice>
                <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '10px' }} onClick={() => setReloadKey((k) => k + 1)}>
                  <RefreshCw size={14} /> {L.retry}
                </button>
              </div>
            )}
          </div>

          {/* Next 4 days */}
          {forecast.length > 0 && (
            <div style={card}>
              <h2 style={sectionTitle}>{L.next4}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '8px' }}>
                {forecast.map((d) => (
                  <div key={d.record_date} title={translateWeatherCondition(d.condition, lang)} style={{ border: '1px solid #EEE9DD', borderRadius: '10px', padding: '6px 4px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.72rem' }}>{formatDate(d.record_date, lang, { weekday: 'short', day: 'numeric' })}</div>
                    <div style={{ margin: '3px 0' }}>{weatherIcon(d.condition, true, 18)}</div>
                    <div style={{ fontWeight: 800, fontSize: '0.84rem' }}>{d.temp_max_c}°<span style={{ ...muted, fontWeight: 500 }}>/{d.temp_min_c}°</span></div>
                    <div style={{ fontSize: '0.68rem', color: '#2563EB' }}>{d.rainfall_prob_percent}%</div>
                  </div>
                ))}
              </div>
              <div style={sourceStyle}><Info size={13} />{L.weatherSource}</div>
            </div>
          )}

          {/* Alerts */}
          <div style={card}>
            <h2 style={sectionTitle}><AlertTriangle size={18} style={{ verticalAlign: '-3px', marginRight: '6px' }} />{L.alerts}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {alerts.length === 0 ? (
                <div style={muted}>{L.noAlerts}</div>
              ) : alerts.map((a) => (
                <div key={a.id} style={{ borderLeft: `4px solid ${a.severity === 'Critical' ? '#BC4749' : a.severity === 'Warning' ? '#F59E0B' : '#386641'}`, background: '#FAFAF7', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <strong style={{ fontSize: '0.92rem' }}>{a.title}</strong>
                    <span className="badge badge-wheat" style={{ flexShrink: 0 }}>{a.severityLabel}</span>
                  </div>
                  <div style={{ ...muted, margin: '4px 0 6px' }}>{a.conditionSummary}</div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.84rem', lineHeight: 1.5 }}>
                    {a.actionSteps.map((step, i) => <li key={i}>{step}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
