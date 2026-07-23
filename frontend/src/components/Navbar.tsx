import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { Menu, X, Sun, Moon, Languages, Type, Eye, LogOut, LayoutDashboard, Cloud, Sprout, ShieldAlert, IndianRupee, Library, HelpCircle, User } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { darkMode, toggleDarkMode } = useTheme();
  const { fontSize, setFontSize, highContrast, toggleHighContrast } = useAccessibility();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [accessMenuOpen, setAccessMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const navLinks = [
    { name: t('dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('weather'), path: '/weather', icon: Cloud },
    { name: t('recommendation'), path: '/recommendation', icon: Sprout },
    { name: t('diseaseDetection'), path: '/disease-detection', icon: ShieldAlert },
    { name: t('marketPrices'), path: '/market-prices', icon: IndianRupee },
    { name: t('schemes'), path: '/schemes', icon: Library },
    { name: t('helpCenterTitle'), path: '/help-center', icon: HelpCircle }
  ];

  const handleLanguageChange = (lang: 'en' | 'hi' | 'ta' | 'mr') => {
    setLanguage(lang);
    setLangDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const fontOptions: { label: string; value: 'normal' | 'large' | 'xlarge' }[] = [
    { label: 'A', value: 'normal' },
    { label: 'A+', value: 'large' },
    { label: 'A++', value: 'xlarge' }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-panel shadow-sm transition-all duration-200 dark:shadow-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center">
            <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
              <span className="text-2xl">🌱</span>
              <span className="font-sans text-xl font-bold tracking-tight text-primary-600 dark:text-primary-400">
                {t('brandName')}
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          {user && (
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive(link.path)
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400 border border-primary-100 dark:border-primary-900/30'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
                    isActive('/admin')
                      ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400'
                      : 'border-rose-300/40 hover:bg-rose-50/50 hover:text-rose-700 dark:border-rose-900/20 dark:text-rose-400'
                  }`}
                >
                  {t('admin')}
                </Link>
              )}
            </div>
          )}

          {/* Toolbar Utilities */}
          <div className="hidden lg:flex items-center space-x-2">
            
            {/* Language Selection */}
            <div className="relative">
              <button
                onClick={() => { setLangDropdownOpen(!langDropdownOpen); setAccessMenuOpen(false); }}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Select Language"
              >
                <Languages className="h-5 w-5" />
              </button>
              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <button onClick={() => handleLanguageChange('en')} className={`flex w-full px-4 py-2 text-left text-sm ${language === 'en' ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>English</button>
                  <button onClick={() => handleLanguageChange('hi')} className={`flex w-full px-4 py-2 text-left text-sm ${language === 'hi' ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>हिन्दी (Hindi)</button>
                  <button onClick={() => handleLanguageChange('ta')} className={`flex w-full px-4 py-2 text-left text-sm ${language === 'ta' ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>தமிழ் (Tamil)</button>
                  <button onClick={() => handleLanguageChange('mr')} className={`flex w-full px-4 py-2 text-left text-sm ${language === 'mr' ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>मराठी (Marathi)</button>
                </div>
              )}
            </div>

            {/* Accessibility Menu */}
            <div className="relative">
              <button
                onClick={() => { setAccessMenuOpen(!accessMenuOpen); setLangDropdownOpen(false); }}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Accessibility Settings"
              >
                <Type className="h-5 w-5" />
              </button>
              {accessMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Font Scaling</h4>
                  <div className="flex space-x-1 mb-3">
                    {fontOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFontSize(opt.value)}
                        className={`flex-1 py-1 rounded text-sm font-semibold border ${
                          fontSize === opt.value
                            ? 'border-primary-500 bg-primary-500 text-white'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <hr className="border-slate-200 dark:border-slate-700 my-2" />

                  <button
                    onClick={toggleHighContrast}
                    className="flex w-full items-center justify-between py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  >
                    <span className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      High Contrast
                    </span>
                    <input
                      type="checkbox"
                      checked={highContrast}
                      onChange={() => {}}
                      className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                    />
                  </button>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Profile & Logout */}
            {user ? (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  title="My Profile"
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user.name.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="ml-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
              >
                {t('login')}
              </Link>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Quick Dark Mode on Mobile */}
            <button onClick={toggleDarkMode} className="p-2 rounded-lg text-slate-600 dark:text-slate-300">
              {darkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
            </button>

            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Main menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white py-2 shadow-inner transition-all dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {user ? (
              <>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base font-semibold ${
                        isActive(link.path)
                          ? 'bg-primary-500 text-white'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  >
                    <span>🛡️ {t('admin')}</span>
                  </Link>
                )}
                
                <hr className="border-slate-200 dark:border-slate-700 my-2" />
                
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <User className="h-5 w-5" />
                  <span>{t('profile')} ({user.name})</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-3 rounded-lg text-base font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                >
                  <LogOut className="h-5 w-5" />
                  <span>{t('logout')}</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center rounded-xl bg-primary-600 px-4 py-3 text-base font-bold text-white dark:bg-primary-500"
              >
                {t('login')}
              </Link>
            )}

            <hr className="border-slate-200 dark:border-slate-700 my-2" />
            
            {/* Mobile Accessibility Controls */}
            <div className="px-3 py-2 space-y-3">
              <div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Language</span>
                <div className="grid grid-cols-4 gap-1">
                  <button onClick={() => handleLanguageChange('en')} className={`py-1.5 rounded text-sm ${language === 'en' ? 'bg-primary-500 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>EN</button>
                  <button onClick={() => handleLanguageChange('hi')} className={`py-1.5 rounded text-sm ${language === 'hi' ? 'bg-primary-500 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>HI</button>
                  <button onClick={() => handleLanguageChange('ta')} className={`py-1.5 rounded text-sm ${language === 'ta' ? 'bg-primary-500 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>TA</button>
                  <button onClick={() => handleLanguageChange('mr')} className={`py-1.5 rounded text-sm ${language === 'mr' ? 'bg-primary-500 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>MR</button>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Text Scale</span>
                <div className="grid grid-cols-3 gap-1">
                  {fontOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFontSize(opt.value)}
                      className={`py-1.5 rounded text-sm font-semibold border ${
                        fontSize === opt.value
                          ? 'border-primary-500 bg-primary-500 text-white'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={toggleHighContrast}
                className="flex w-full items-center justify-between py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Eye className="h-4 w-4" />
                  High Contrast Theme
                </span>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={() => {}}
                  className="rounded text-primary-600"
                />
              </button>
            </div>

          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
