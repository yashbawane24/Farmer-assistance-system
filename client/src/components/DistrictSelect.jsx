import React from 'react';
import { MAHARASHTRA_DISTRICTS, districtLabel, regionLabel } from '../config/maharashtra.js';

// Dropdown of all 36 Maharashtra districts grouped by region
export function DistrictSelect({ value, onChange, lang = 'en', style, required = false, placeholder, className = 'input-select' }) {
  const regions = [...new Set(MAHARASHTRA_DISTRICTS.map((d) => d.region))];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      style={{
        width: '100%',
        height: '48px',
        fontWeight: 600,
        borderRadius: 'var(--radius-sm)',
        border: '1.5px solid var(--color-border-subtle)',
        padding: '0 12px',
        backgroundColor: '#FFFFFF',
        color: 'var(--color-text-main)',
        fontSize: '0.95rem',
        ...style
      }}
      required={required}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {regions.map((region) => (
        <optgroup key={region} label={regionLabel(region, lang)}>
          {MAHARASHTRA_DISTRICTS.filter((d) => d.region === region).map((d) => (
            <option key={d.name} value={d.name}>{districtLabel(d.name, lang)}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
