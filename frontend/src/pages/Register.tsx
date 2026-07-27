import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User as UserIcon, Mail, Phone, Lock, Eye, EyeOff, 
  MapPin, Sprout, KeyRound, Globe, ArrowRight, ArrowLeft,
  CheckCircle2, Sparkles, AlertCircle
} from 'lucide-react';
import { getErrorMessage } from '../utils/errorHelper';

const IndianStates = [
  'Maharashtra', 'Madhya Pradesh', 'Uttar Pradesh', 'Rajasthan', 'Gujarat', 'Tamil Nadu', 'Punjab'
];

const DistrictsByState: Record<string, string[]> = {
  'Maharashtra': ['Pune', 'Nashik', 'Nagpur', 'Yavatmal', 'Amravati', 'Satara'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Ujjain', 'Dhar', 'Dewas'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Rajkot', 'Vadodara'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Trichy'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala']
};

const SoilTypes = ['Alluvial', 'Black', 'Red', 'Laterite', 'Clayey', 'Sandy', 'Loamy'];
const Crops = ['Wheat', 'Paddy/Rice', 'Cotton', 'Soybean', 'Sugarcane', 'Mustard', 'Potato', 'Maize', 'Vegetables'];

const Register: React.FC = () => {
  const { registerInit, verifyRegisterOtp } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Wizard Step: 1, 2, 3
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Pune');
  const [village, setVillage] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [soilType, setSoilType] = useState('Alluvial');
  const [primaryCrop, setPrimaryCrop] = useState('Wheat');
  const [prefLang, setPrefLang] = useState(language);

  const [otp, setOtp] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Timer Countdown for OTP Resend
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle State change to update District
  const handleStateChange = (selectedState: string) => {
    setState(selectedState);
    const districts = DistrictsByState[selectedState] || [];
    setDistrict(districts[0] || '');
  };

  // Validations
  const validateStep1 = (): boolean => {
    setError('');
    if (!name.trim()) {
      setError('Full Name is required.');
      return false;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!/^\d{10}$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    setError('');
    if (!village.trim()) {
      setError('Village name is required.');
      return false;
    }
    if (!farmSize || parseFloat(farmSize) <= 0) {
      setError('Please enter a valid farm size.');
      return false;
    }
    return true;
  };

  // Action Handlers
  const handleNextToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleNextToStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setError('');
    try {
      await registerInit({
        name,
        email: email.toLowerCase().trim(),
        mobile,
        password,
        state,
        district,
        village,
        farmSize: parseFloat(farmSize),
        soilType,
        primaryCrop,
        language: prefLang
      });
      setCooldown(60);
      setStep(3);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length < 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      await verifyRegisterOtp(email.toLowerCase().trim(), otp);
      navigate('/dashboard');
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
      await registerInit({
        name,
        email: email.toLowerCase().trim(),
        mobile,
        password,
        state,
        district,
        village,
        farmSize: parseFloat(farmSize),
        soilType,
        primaryCrop,
        language: prefLang
      });
      setCooldown(60);
      setError('');
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center bg-gradient-to-tr from-emerald-50 via-slate-50 to-teal-50 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white/70 shadow-2xl backdrop-blur-xl dark:bg-slate-900/60 dark:border-slate-800/80">
        
        {/* Animated backdrop decoration */}
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-teal-500/10 blur-2xl" />

        <div className="p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl dark:bg-emerald-500/20">🌱</span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-800 dark:text-white">
              {t('createAccount')}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {step === 1 && 'Let\'s set up your profile credentials'}
              {step === 2 && 'Complete your farm details for smart advice'}
              {step === 3 && `Enter the OTP sent to ${email}`}
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="relative mb-10 flex items-center justify-between">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
            <div 
              className="absolute left-0 top-1/2 h-0.5 bg-emerald-500 -translate-y-1/2 transition-all duration-300 z-0" 
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
            
            {[1, 2, 3].map((num) => (
              <div 
                key={num}
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  step === num
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20 scale-110'
                    : step > num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {step > num ? '✓' : num}
              </div>
            ))}
          </div>

          {/* Messages */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start gap-2.5 rounded-2xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-950"
            >
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Step Renderings */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleNextToStep2}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <UserIcon className="h-5 w-5" />
                      </span>
                      <input
                        required
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white/50 pl-11 pr-4 py-3 text-sm dark:bg-slate-900/40 dark:border-slate-800 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mobile Number</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Phone className="h-5 w-5" />
                      </span>
                      <input
                        required
                        type="tel"
                        placeholder="9876543210"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full rounded-2xl border border-slate-200 bg-white/50 pl-11 pr-4 py-3 text-sm dark:bg-slate-900/40 dark:border-slate-800 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Password</label>
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

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('confirmPassword')}</label>
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
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    <span>Continue to Farm Setup</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleNextToStep3}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('stateLabel')}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <MapPin className="h-5 w-5" />
                      </span>
                      <select
                        value={state}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white/50 pl-11 pr-4 py-3 text-sm dark:bg-slate-900/40 dark:border-slate-800 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none appearance-none transition-all"
                      >
                        {IndianStates.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('districtLabel')}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <MapPin className="h-5 w-5" />
                      </span>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white/50 pl-11 pr-4 py-3 text-sm dark:bg-slate-900/40 dark:border-slate-800 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none appearance-none transition-all"
                      >
                        {(DistrictsByState[state] || []).map(dt => (
                          <option key={dt} value={dt}>{dt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('villageLabel')}</label>
                    <input
                      required
                      type="text"
                      placeholder="Village Name"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm dark:bg-slate-900/40 dark:border-slate-800 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('farmSizeLabel')}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Sprout className="h-5 w-5" />
                      </span>
                      <input
                        required
                        type="number"
                        step="0.1"
                        placeholder="2.5"
                        value={farmSize}
                        onChange={(e) => setFarmSize(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white/50 pl-11 pr-4 py-3 text-sm dark:bg-slate-900/40 dark:border-slate-800 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('soilTypeLabel')}</label>
                    <select
                      value={soilType}
                      onChange={(e) => setSoilType(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm dark:bg-slate-900/40 dark:border-slate-800 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                    >
                      {SoilTypes.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('primaryCropLabel')}</label>
                    <select
                      value={primaryCrop}
                      onChange={(e) => setPrimaryCrop(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm dark:bg-slate-900/40 dark:border-slate-800 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                    >
                      {Crops.map(cr => (
                        <option key={cr} value={cr}>{cr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('preferredLanguage')}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Globe className="h-5 w-5" />
                    </span>
                    <select
                      value={prefLang}
                      onChange={(e) => setPrefLang(e.target.value as any)}
                      className="w-full rounded-2xl border border-slate-200 bg-white/50 pl-11 pr-4 py-3 text-sm dark:bg-slate-900/40 dark:border-slate-800 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none appearance-none transition-all"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="ta">தமிழ் (Tamil)</option>
                      <option value="mr">मराठी (Marathi)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/50 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 active:scale-95 transition-all"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-55"
                  >
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <span>Submit & Verify Email</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {step === 3 && (
              <motion.form 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOTP}
                className="space-y-6"
              >
                <div className="text-center bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-500/10 rounded-2xl p-5 mb-2">
                  <Sparkles className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    A 6-digit verification code was sent to <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{email}</strong>.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Please check your inbox or spam folder.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">6-Digit Verification Code</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <KeyRound className="h-5 w-5" />
                    </span>
                    <input
                      required
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full rounded-2xl border border-slate-200 bg-white/50 pl-11 pr-4 py-3.5 text-center text-lg font-bold tracking-widest dark:bg-slate-900/40 dark:border-slate-800 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                    />
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
                        <span>Verify & Create Account</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={cooldown > 0 || loading}
                    onClick={handleResendOTP}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline py-2 disabled:opacity-50 disabled:no-underline"
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown} seconds` : 'Did not receive code? Resend OTP'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Footer Link */}
          <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-850 pt-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                {t('signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
