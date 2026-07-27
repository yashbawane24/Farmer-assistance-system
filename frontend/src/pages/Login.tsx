import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import { Mail, Phone, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { getErrorMessage } from '../utils/errorHelper';

const Login: React.FC = () => {
  const { loginWithPassword } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Inputs
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load Remember Me credentials on mount
  useEffect(() => {
    const savedIdentifier = localStorage.getItem('farmer_remember_identifier');
    if (savedIdentifier) {
      setIdentifier(savedIdentifier);
      setRememberMe(true);
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError(t('errors.emailRequired'));
      return;
    }

    if (!password) {
      setError(t('errors.passwordRequired'));
      return;
    }

    setLoading(true);
    try {
      await loginWithPassword(identifier.trim(), password);
      
      // Save or remove Remember Me credentials
      if (rememberMe) {
        localStorage.setItem('farmer_remember_identifier', identifier.trim());
      } else {
        localStorage.removeItem('farmer_remember_identifier');
      }

      navigate('/dashboard');
    } catch (err: any) {
      const errMsg = getErrorMessage(err);
      // Map common error messages if backend returns them
      if (errMsg.includes('Invalid credentials')) {
        setError(t('errors.invalidCredentials'));
      } else if (errMsg.includes('Backend unavailable') || errMsg.includes('Connection error')) {
        setError(t('errors.connectionError'));
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center bg-gradient-to-tr from-emerald-50 via-slate-50 to-teal-50 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/70 shadow-2xl backdrop-blur-xl p-8 dark:bg-slate-900/60 dark:border-slate-800/80"
      >
        {/* Decorative elements */}
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-teal-500/10 blur-2xl" />

        {/* Header */}
        <div className="relative text-center mb-8">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl dark:bg-emerald-500/20">🌱</span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-800 dark:text-white">
            {t('common.signIn')}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {t('login.welcomeBack')}
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 flex items-start gap-2.5 rounded-2xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-955"
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-5 relative">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('login.emailOrMobile')}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                {identifier.includes('@') ? <Mail className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
              </span>
              <input
                required
                type="text"
                placeholder="farmer@example.com / 9876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white/50 pl-11 pr-4 py-3 text-sm dark:bg-slate-900/40 dark:border-slate-800 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('login.password')}</label>
              <Link 
                to="/forgot-password" 
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {t('common.forgotPasswordLabel')}
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="h-5 w-5" />
              </span>
              <input
                required
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white/50 pl-11 pr-11 py-3 text-sm dark:bg-slate-900/40 dark:border-slate-800 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 bg-white/50 border-slate-200 dark:bg-slate-900 dark:border-slate-800"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{t('common.rememberMe')}</span>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-55"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>{t('login.signIn')}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Create Account Link */}
        <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-850 pt-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('login.dontHaveAccount')}{' '}
            <Link to="/register" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
              {t('login.registerLink')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
