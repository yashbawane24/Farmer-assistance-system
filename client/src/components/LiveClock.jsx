import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getTranslation, translateDayName, translateMonthName } from '../services/i18n.js';

export function LiveClock({ showSeconds = true, showDate = true, compact = false, style = {}, lang = 'en' }) {
  const [now, setNow] = useState(new Date());
  const t = getTranslation(lang);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = String(hours % 12 || 12).padStart(2, '0');

  const timeStr = showSeconds ? `${hour12}:${minutes}:${seconds} ${ampm}` : `${hour12}:${minutes} ${ampm}`;
  const rawDay = dayNamesEn[now.getDay()];
  const rawMonth = monthNamesEn[now.getMonth()];
  const localizedDay = translateDayName(rawDay, lang);
  const localizedMonth = translateMonthName(rawMonth, lang);
  const localizedDateStr = `${now.getDate()} ${localizedMonth} ${now.getFullYear()}`;

  // Time period classification with localized label
  let periodKey = 'night';
  let periodColor = '#6366F1'; // indigo
  if (hours >= 5 && hours < 8) {
    periodKey = 'dawn';
    periodColor = '#F59E0B';
  } else if (hours >= 8 && hours < 12) {
    periodKey = 'morning';
    periodColor = '#10B981';
  } else if (hours >= 12 && hours < 16) {
    periodKey = 'afternoon';
    periodColor = '#EAB308';
  } else if (hours >= 16 && hours < 19) {
    periodKey = 'sunset';
    periodColor = '#F97316';
  } else if (hours >= 19 && hours < 22) {
    periodKey = 'evening';
    periodColor = '#8B5CF6';
  }

  const periodLabel = t.clock?.[periodKey] || periodKey.toUpperCase();

  if (compact) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '999px',
        backgroundColor: '#F3F4F6',
        border: '1px solid #E5E7EB',
        fontSize: '0.78rem',
        fontWeight: 600,
        color: '#1F2937',
        ...style
      }}>
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#10B981',
          display: 'inline-block',
          boxShadow: '0 0 6px #10B981'
        }} />
        <Clock size={12} color="#6B7280" />
        <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{timeStr}</span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      padding: '6px 14px',
      borderRadius: '999px',
      backgroundColor: '#FFFFFF',
      border: '1.5px solid #E5E7EB',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      ...style
    }}>
      {/* Live Pulsing Dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: '#10B981',
          display: 'inline-block',
          animation: 'pulse 1.8s infinite'
        }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', letterSpacing: '0.04em' }}>
          {t.clock?.live || 'LIVE'}
        </span>
      </div>

      <div style={{ height: '14px', width: '1px', backgroundColor: '#E5E7EB' }} />

      {/* Clock Time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Clock size={14} color="#4B5563" />
        <span style={{
          fontFamily: 'monospace',
          fontSize: '0.88rem',
          fontWeight: 800,
          color: '#111827',
          letterSpacing: '-0.02em'
        }}>
          {timeStr}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 700 }}>
          {t.clock?.timeZone || 'IST'}
        </span>
      </div>

      {/* Period Badge */}
      <span style={{
        fontSize: '0.68rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        padding: '2px 7px',
        borderRadius: '6px',
        backgroundColor: `${periodColor}18`,
        color: periodColor
      }}>
        {periodLabel}
      </span>

      {showDate && (
        <>
          <div style={{ height: '14px', width: '1px', backgroundColor: '#E5E7EB' }} />
          <span style={{ fontSize: '0.78rem', color: '#4B5563', fontWeight: 600 }}>
            {localizedDay}, {localizedDateStr}
          </span>
        </>
      )}
    </div>
  );
}
