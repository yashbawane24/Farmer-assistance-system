import React from 'react';
import { Check } from 'lucide-react';

export function GuidedOptionPicker({ options, selectedValue, onSelect, label, idPrefix = 'opt' }) {
  return (
    <div className="guided-picker-wrapper" role="radiogroup" aria-label={label}>
      {label && <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '8px' }}>{label}</div>}
      <div className="guided-picker-grid">
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <div
              key={option.value}
              id={`${idPrefix}-${option.value.replace(/\s+/g, '-').toLowerCase()}`}
              className={`option-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(option.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(option.value);
                }
              }}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
            >
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="option-card-title">{option.label}</span>
                {isSelected && (
                  <span style={{ display: 'inline-flex', padding: 2, background: 'var(--color-primary-forest)', color: '#fff', borderRadius: '50%' }}>
                    <Check size={12} />
                  </span>
                )}
              </div>
              {option.sublabel && <span style={{ fontSize: '0.75rem', color: 'var(--color-leaf-green)', fontWeight: 600 }}>{option.sublabel}</span>}
              {option.description && <span className="option-card-desc">{option.description}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
