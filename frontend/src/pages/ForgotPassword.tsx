import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, KeyRound, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { getErrorMessage } from '../utils/errorHelper';

const ForgotPassword: React.FC = () => {
  const { forgotPassword, resetPassword } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Wizard Step: 1 (Request OTP), 2 (Verify OTP & Reset Password)
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Timer Countdown for OTP Resend
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError(t('errors.invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email.toLowerCase().trim());
      setCooldown(60);
      setStep(2);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length < 6) {
      setError(t('errors.invalidOtp', { defaultValue: 'Please enter a valid 6-digit OTP code.' }));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('errors.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('errors.passwordsMismatch'));
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.toLowerCase().trim(), otp, newPassword);
      setSuccess(t('forgotPassword.successMessage'));
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (cooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.toLowerCase().trim());
      setCooldown(60);
    } catch (err: any) {
      setError(getErrorMessage(err));
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
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl dark:bg-emerald-500/20">🔑</span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-800 dark:text-white">
            {t('forgotPassword.title')}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {step === 1 ? t('forgotPassword.subtitle1') : t('forgotPassword.subtitle2')}
          </p>
        </div>

        {/* Success message */}
        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 flex items-start gap-2.5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </motion.div>
        )}

        {/* Error message */}
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

        <AnimatePresence mode="wait">
          {step === 1 && !success && (
            <motion.form
              key="forgot-step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleRequestOTP}
              className="space-y-5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('forgotPassword.email')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    required
                    type="email"
                    placeholder="farmer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white/50 pl-11 pr-4 py-3 text-sm dark:bg-slate-900/40 dark:border-slate-800 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
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
                      <span>{t('forgotPassword.sendOtp')}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}

          {step === 2 && !success && (
            <motion.form
              key="forgot-step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleResetPassword}
              className="space-y-5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('forgotPassword.otpCode')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <KeyRound className="h-5 w-5" />
                  </span>
                  <input
                    required
                    type="text"
                    maxLength={6}
                    placeholder={t('register.otpPlaceholder')}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full rounded-2xl border border-slate-200 bg-white/50 pl-11 pr-4 py-3 text-center text-sm font-bold tracking-widest dark:bg-slate-900/40 dark:border-slate-800 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('forgotPassword.newPassword')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('common.confirmPassword')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    required
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white/50 pl-11 pr-11 py-3 text-sm dark:bg-slate-900/40 dark:border-slate-800 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-55"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{t('forgotPassword.resetButton')}</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 py-2"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>{t('common.back')}</span>
                  </button>
                  <button
                    type="button"
                    disabled={cooldown > 0 || loading}
                    onClick={handleResendOTP}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline py-2 disabled:opacity-50 disabled:no-underline"
                  >
                    {cooldown > 0 ? t('register.otpCooldown', { cooldown }) : t('register.otpResend')}
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Back to Login Link */}
        <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-850 pt-5">
          <Link to="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline text-sm flex items-center justify-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            <span>{t('forgotPassword.backToLogin')}</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
