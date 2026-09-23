import React from 'react';
import { Home, Sprout, ScanLine, ShoppingBag, Mic } from 'lucide-react';

export function MobileNav({ currentRoute, onNavigate, lang }) {
  const items = [
    { id: 'home', label: 'Home', mr: 'मुख्य', hi: 'होम', icon: Home },
    { id: 'crop-advisor', label: 'Crop', mr: 'पीक', hi: 'फसल', icon: Sprout },
    { id: 'disease-scan', label: 'Scan', mr: 'स्कॅन', hi: 'जांच', icon: ScanLine },
    { id: 'smart-mandi', label: 'Mandi', mr: 'मंडी', hi: 'मंडी', icon: ShoppingBag },
    { id: 'ai-agronomist', label: 'Ask AI', mr: 'कृषी मित्र', hi: 'एआई मित्र', icon: Mic }
  ];

  const getLabel = (item) => {
    if (lang === 'mr') return item.mr;
    if (lang === 'hi') return item.hi;
    return item.label;
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentRoute === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <Icon size={22} />
            <span>{getLabel(item)}</span>
          </button>
        );
      })}
    </nav>
  );
}
