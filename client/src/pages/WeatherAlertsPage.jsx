import React, { useState, useEffect } from 'react';
import { CloudRain, AlertTriangle, ShieldCheck, Wind, Droplets, Thermometer, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../services/api.js';
import { AudioSpeaker } from '../components/AudioSpeaker.jsx';
import { LiveClock } from '../components/LiveClock.jsx';
import { 
  getTranslation, 
  translateWeatherCondition, 
  translateCropName, 
  translateCropStage,
  translateDayName, 
  translateMonthName 
} from '../services/i18n.js';

export function WeatherAlertsPage({ activeProfile, lang, onNavigate }) {
  const t = getTranslation(lang);
  const [district, setDistrict] = useState(activeProfile?.district || 'Nashik');
  const [todayWeather, setTodayWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [alertsData, setAlertsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeatherData();
  }, [district, activeProfile]);

  const loadWeatherData = async () => {
    setLoading(true);
    try {
      const crop = activeProfile?.currentCrop || 'Tomato';
      const stage = activeProfile?.cropStage || 'Flowering to Fruit Set';

      const [todayRes, forecastRes, alertsRes] = await Promise.all([
        api.getTodayWeatherStatus(district, crop, stage),
        api.getWeatherForecast(district),
        api.getActiveAlerts(district, crop, stage)
      ]);

      setTodayWeather(todayRes);
      setForecast(forecastRes);
      setAlertsData(alertsRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const effectiveWeather = todayWeather || forecast[0] || {
    temp_max_c: 30,
    temp_min_c: 22,
    current_temp_c: 22.4,
    humidity_percent: 90,
    rainfall_prob_percent: 45,
    wind_speed_kmh: 8,
    condition: 'Overcast Night',
    currentTime: '03:00 AM',
    timePeriod: 'Night (Cool & Dew)',
    agro_summary: 'Dew accumulation on leaves. Avoid nighttime spraying; inspect for fungal spore wetness at dawn.'
  };

  return (
    <div className="container" style={{ padding: '36px var(--space-md) 64px var(--space-md)' }}>
      {/* Header */}
      <div style={{ maxWidth: '800px', marginBottom: '28px' }}>
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary-forest)', fontWeight: 700 }}>
          {t.weather.phase}
        </span>
        <h1 style={{ marginTop: '4px', marginBottom: '8px', color: 'var(--color-primary-forest)' }}>
          {t.weather.title}
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>
          {t.weather.subtitle}
        </p>
      </div>

      {/* TODAY'S WEATHER WITH "WHAT THIS MEANS FOR YOUR FARM" */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1.5px solid var(--color-border-subtle)',
        padding: '32px',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '36px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-wheat">{t.weather.liveStatus}</span>
              <LiveClock showSeconds={false} showDate={true} lang={lang} />
            </div>
            <h2 style={{ fontSize: '1.85rem', color: 'var(--color-primary-forest)' }}>
              {district} {t.weather.districtStatus}
            </h2>
            <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
              {t.weather.standingCrop}{' '}
              <strong>{translateCropName(activeProfile?.currentCrop || 'Tomato', lang)}</strong> ({translateCropStage(activeProfile?.cropStage || 'Flowering to Fruit Set', lang)})
            </div>
          </div>

          <AudioSpeaker
            text={`${district} ${t.weather.title}. ${effectiveWeather.current_temp_c || effectiveWeather.temp_max_c}°C. ${translateWeatherCondition(effectiveWeather.condition, lang)}. ${effectiveWeather.farmImpactAdvice || effectiveWeather.agro_summary || ''}`}
            lang={lang}
            label={t.weather.listenImpact}
          />
        </div>

        {/* 4 Metric Badges */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <div style={{ padding: '14px', background: 'var(--color-canvas-surface)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              <Thermometer size={16} /> {t.weather.currentTemp}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-forest)', marginTop: '4px' }}>
              {effectiveWeather.current_temp_c != null ? `${effectiveWeather.current_temp_c}°C` : `${effectiveWeather.temp_max_c}°C`}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '2px' }}>
              Max {effectiveWeather.temp_max_c}° / Min {effectiveWeather.temp_min_c}°C
            </div>
          </div>

          <div style={{ padding: '14px', background: 'var(--color-canvas-surface)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              <Droplets size={16} color="var(--color-leaf-green)" /> {t.weather.humidity}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-leaf-green)', marginTop: '4px' }}>
              {effectiveWeather.humidity_percent}%
            </div>
            <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '2px' }}>
              {translateWeatherCondition(effectiveWeather.condition, lang)}
            </div>
          </div>

          <div style={{ padding: '14px', background: 'var(--color-canvas-surface)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3A86FF', fontSize: '0.8rem' }}>
              <CloudRain size={16} /> {t.weather.rainProb}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3A86FF', marginTop: '4px' }}>
              {effectiveWeather.rainfall_prob_percent}%
            </div>
            <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '2px' }}>
              {effectiveWeather.rainfall_prob_percent > 50 ? t.weather.precipLikely : t.weather.drySpell}
            </div>
          </div>

          <div style={{ padding: '14px', background: 'var(--color-canvas-surface)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              <Wind size={16} /> {t.weather.windSpeed}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-forest)', marginTop: '4px' }}>
              {effectiveWeather.wind_speed_kmh} km/h
            </div>
            <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '2px' }}>
              {effectiveWeather.currentTime || ''}
            </div>
          </div>
        </div>

        {/* PROMINENT "WHAT THIS MEANS FOR YOUR FARM" ADVICE */}
        <div style={{
          backgroundColor: 'var(--color-leaf-light)',
          border: '1.5px solid #D2E4D4',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-leaf-green)', fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase', marginBottom: '6px' }}>
            <ShieldCheck size={20} />
            <span>{t.weather.whatThisMeans}</span>
          </div>
          <p style={{ fontSize: '1.05rem', color: '#1B382B', fontWeight: 600, lineHeight: 1.6 }}>
            {effectiveWeather.farmImpactAdvice || effectiveWeather.agro_summary}
          </p>
        </div>
      </div>

      {/* ACTIVE PREVENTATIVE ALERTS */}
      <h3 style={{ fontSize: '1.35rem', marginBottom: '16px', color: 'var(--color-primary-forest)' }}>
        {t.weather.activeAlerts} ({alertsData?.alerts?.length || 0})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px' }}>
        {alertsData?.alerts?.map((alert, idx) => {
          const isCrit = alert.severity === 'Critical';
          return (
            <div
              key={idx}
              className={`alert-card ${isCrit ? '' : 'advisory'}`}
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '8px', background: isCrit ? 'var(--color-terracotta-light)' : '#FFF3CD', color: isCrit ? 'var(--color-terracotta)' : '#856404', borderRadius: 'var(--radius-sm)' }}>
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <span className={`badge ${isCrit ? 'badge-terracotta' : 'badge-wheat'}`} style={{ marginBottom: '4px' }}>
                      {isCrit ? t.weather.criticalAlert : t.weather.advisoryAlert}
                    </span>
                    <h4 style={{ fontSize: '1.15rem', color: 'var(--color-primary-forest)' }}>{alert.title}</h4>
                  </div>
                </div>

                <AudioSpeaker
                  text={`${alert.title}. ${alert.conditionSummary}. ${alert.actionSteps?.join('. ')}`}
                  lang={lang}
                  label={lang === 'hi' ? 'अलर्ट सुनें' : lang === 'mr' ? 'सूचना ऐका' : 'Listen'}
                />
              </div>

              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-main)', marginBottom: '14px' }}>
                {alert.conditionSummary}
              </p>

              {/* Action Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--color-primary-forest)' }}>
                  {t.weather.immediateAction}:
                </strong>
                {alert.actionSteps?.map((step, sIdx) => (
                  <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.88rem' }}>
                    <CheckCircle2 size={16} color="var(--color-leaf-green)" style={{ flexShrink: 0, marginTop: '3px' }} />
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('disease-scan')}>
                  <span>{lang === 'hi' ? 'पत्ती रोग जांचें' : lang === 'mr' ? 'पानावरील रोग तपासा' : 'Run Leaf Diagnostic'}</span>
                  <ArrowRight size={14} />
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('ai-agronomist')}>
                  <span>{lang === 'hi' ? 'कृषि विशेषज्ञ से पूछें' : lang === 'mr' ? 'कृषी मित्राला विचारा' : 'Ask AI Agronomist'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5-DAY AGRO-WEATHER FORECAST CARDS */}
      <h3 style={{ fontSize: '1.35rem', marginBottom: '16px', color: 'var(--color-primary-forest)' }}>
        {t.weather.fiveDayForecast}
      </h3>

      <div className="grid-4">
        {forecast.slice(1, 5).map((day, idx) => {
          const parts = (day.formattedDate || `${22 + idx} Sep`).split(' ');
          const dayNum = parts[0];
          const monthStr = parts[1] || 'Sep';
          const localizedDayName = translateDayName(day.shortDay || 'Day', lang);
          const localizedMonth = translateMonthName(monthStr, lang);

          return (
            <div key={idx} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary-forest)' }}>
                  {localizedDayName}, {dayNum} {localizedMonth}
                </span>
                <span className="badge badge-wheat">{translateWeatherCondition(day.condition, lang)}</span>
              </div>

              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-forest)', marginBottom: '8px' }}>
                {day.temp_max_c}° / {day.temp_min_c}°C
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                <span>💧 {lang === 'hi' ? 'नमी' : lang === 'mr' ? 'आर्द्रता' : 'Humidity'}: {day.humidity_percent}%</span>
                <span>🌧️ {lang === 'hi' ? 'बारिश' : lang === 'mr' ? 'पाऊस' : 'Rain'}: {day.rainfall_prob_percent}%</span>
              </div>

              <p style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                {day.agro_summary}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
