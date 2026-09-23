import React from 'react';
import {
  LayoutDashboard,
  User,
  Sprout,
  ScanLine,
  ShoppingBag,
  CloudRain,
  Mic,
  FileText,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { getTranslation } from '../services/i18n.js';

export function SidebarNav({
  currentRoute,
  onNavigate,
  activeProfile,
  onLogout,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  lang = 'en'
}) {
  const t = getTranslation(lang);

  // Fully localized navigation menu matching reference layout: tools first, profile section at the end
  const menuItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard, accent: '#2ECC71' },
    { id: 'crop-advisor', label: t.nav.cropAdvisor, icon: Sprout, accent: '#F39C12' },
    { id: 'disease-scan', label: t.nav.diseaseScan, icon: ScanLine, accent: '#E74C3C' },
    { id: 'smart-mandi', label: t.nav.smartMandi, icon: ShoppingBag, accent: '#9B59B6' },
    { id: 'weather-alerts', label: t.nav.weatherAlerts, icon: CloudRain, accent: '#16A085' },
    { id: 'ai-agronomist', label: t.nav.aiAgronomist, icon: Mic, accent: '#1ABC9C' },
    { id: 'schemes', label: t.nav.schemes, icon: FileText, accent: '#2980B9' },
    { id: 'my-farm', label: t.nav.myFarm, icon: User, accent: '#E67E22' }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={`sidebar-rail ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
        aria-label="Sidebar Navigation Menu"
      >
        {/* Brand Icon & Collapse Toggle at Top */}
        <div className="sidebar-rail-header">
          {isCollapsed ? (
            <button
              type="button"
              className="sidebar-rail-logo-badge sidebar-rail-logo-collapsed-btn"
              onClick={onToggleCollapse}
              title="Expand navigation menu"
              aria-label="Expand navigation menu"
            >
              <Sprout size={24} />
            </button>
          ) : (
            <>
              <div className="sidebar-rail-brand">
                <div className="sidebar-rail-logo-badge">
                  <Sprout size={22} />
                </div>
                <div className="sidebar-rail-brand-text">
                  <div className="sidebar-rail-title">{t.brandName}</div>
                  <div className="sidebar-rail-sub">{t.brandSub}</div>
                </div>
              </div>

              <button
                type="button"
                className="sidebar-rail-toggle"
                onClick={onToggleCollapse}
                title="Collapse navigation"
                aria-label="Collapse navigation"
              >
                <Menu size={18} />
              </button>
            </>
          )}
        </div>

        {/* Vertical Icon Rail with Curved Cutout Notch (Matching Reference Image) */}
        <ul className="sidebar-rail-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;
            return (
              <li
                key={item.id}
                className={`sidebar-rail-item ${isActive ? 'active' : ''}`}
                style={{ '--active-accent': item.accent }}
              >
                <button
                  type="button"
                  className="sidebar-rail-btn"
                  onClick={() => {
                    onNavigate(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  title={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="sidebar-rail-icon-wrap">
                    <Icon size={20} />
                  </div>
                  {!isCollapsed && <span className="sidebar-rail-label">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Bottom Farmer Avatar Card & Logout Button */}
        <div className="sidebar-rail-footer">
          <div
            className={`sidebar-rail-user ${currentRoute === 'my-farm' ? 'active' : ''}`}
            title={`${activeProfile?.fullName} • ${activeProfile?.district}`}
            onClick={() => onNavigate('my-farm')}
            style={{ cursor: 'pointer' }}
          >
            <div className="sidebar-rail-avatar">
              {activeProfile?.fullName ? activeProfile.fullName.charAt(0).toUpperCase() : '👨🏽‍🌾'}
            </div>
            {!isCollapsed && (
              <div className="sidebar-rail-user-meta">
                <span className="sidebar-rail-user-name">{activeProfile?.fullName || (lang === 'mr' ? 'शेतकरी' : lang === 'hi' ? 'किसान' : 'Farmer')}</span>
                <span className="sidebar-rail-user-location">📍 {activeProfile?.district || 'India'}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="sidebar-rail-logout"
            onClick={onLogout}
            title={t.logout}
          >
            <LogOut size={18} />
            {!isCollapsed && <span>{t.logout}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
