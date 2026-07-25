import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Phone, Lock, User as UserIcon, MapPin, Landmark, Sprout } from 'lucide-react';

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

const Login: React.FC = () => {
  const { requestOTP, verifyOTPCode, registerProfile, loginWithPassword } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Authentication Flow states
  // 'mobile' -> 'otp' -> 'register' (if new user)
  const [step, setStep] = useState<'mobile' | 'otp' | 'register'>('mobile');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState(''); // New: Optional email fallback input
  const [otp, setOtp] = useState('');
  
  // Registration States
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState(''); // Email collected on profile setup
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Pune');
  const [village, setVillage] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [primaryCrop, setPrimaryCrop] = useState('');

  // Password Fallback login states
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');

  // Cooldown and UI states
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Timer countdown hook
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');

    if (mobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (cooldown > 0) {
      setError(`Please wait ${cooldown} seconds before requesting a new OTP.`);
      return;
    }

    setLoading(true);
    try {
      const success = await requestOTP(mobile, email || undefined);
      if (success) {
        setCooldown(60); // Start 60-second cooldown on successful OTP request
        setStep('otp');
        setMsg('Verification OTP code sent to your mobile number.');
      } else {
        setError('Error sending OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Server connection error.');
      const remaining = err.cooldownRemaining || err.response?.data?.cooldownRemaining;
      if (remaining) {
        setCooldown(remaining);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await verifyOTPCode(mobile, otp);
      if (result.isRegistered) {
        // User exists and is now logged in
        navigate('/dashboard');
      } else {
        // New user, redirect to profile setup details (pre-fill email if entered in step 1)
        setRegEmail(email);
        setStep('register');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !state || !district || !village) {
      setError('Please fill in all required location details.');
      setLoading(false);
      return;
    }

    try {
      await registerProfile({
        name,
        mobile,
        email: regEmail || undefined,
        state,
        district,
        village,
        farmSize: farmSize ? parseFloat(farmSize) : undefined,
        primaryCrop,
        language: 'en'
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Profile registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginWithPassword(mobile, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid mobile number or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-8 rounded-3xl glass-panel p-8 shadow-xl border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="text-center">
          <span className="text-4xl">🌱</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight">
            {step === 'register' ? 'Register Profile' : t('login')}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {step === 'register' 
              ? 'Tell us about your farm to personalize advice' 
              : 'Sign in to access weather, crop advisor, and market rates'}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
            {error}
          </div>
        )}

        {msg && (
          <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
            {msg}
          </div>
        )}

        {/* Step 1: Input Mobile Number (OTP Mode) */}
        {step === 'mobile' && !usePassword && (
          <div className="space-y-4">
            <form className="space-y-4" onSubmit={handleSendOTP}>
              <div>
                <label className="block text-xs font-semibold uppercase mb-1">Mobile Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Phone className="h-5 w-5" />
                  </span>
                  <input
                    required
                    type="tel"
                    placeholder="98765 43210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-3 dark:bg-slate-900 dark:border-slate-700 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">Email Address (Required for OTP)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <span className="h-5 w-5 flex items-center justify-center text-sm font-semibold">@</span>
                  </span>
                  <input
                    required
                    type="email"
                    placeholder="farmer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-3 dark:bg-slate-900 dark:border-slate-700 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading || cooldown > 0}
                className="w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white shadow-md hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send Verification OTP'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setUsePassword(true)}
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
              >
                Sign In with Password
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200/50 dark:border-slate-800/50 text-xs text-slate-500 dark:text-slate-400 text-center">
              💡 <strong>Don't have an account?</strong> Simply enter your Mobile Number and Email above and click "Send Verification OTP". Once verified, you will proceed to the profile setup screen.
            </div>
          </div>
        )}

        {/* Step 1 Alternate: Input Mobile + Password */}
        {step === 'mobile' && usePassword && (
          <div className="space-y-4">
            <form className="space-y-4" onSubmit={handlePasswordLogin}>
              <div>
                <label className="block text-xs font-semibold uppercase mb-1">Mobile Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Phone className="h-5 w-5" />
                  </span>
                  <input
                    required
                    type="tel"
                    placeholder="98765 43210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-3 dark:bg-slate-900 dark:border-slate-700 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-3 dark:bg-slate-900 dark:border-slate-700 text-sm focus:border-primary-500"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white shadow-md hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setUsePassword(false)}
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
              >
                Sign In with OTP Verification
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Input Verification Code */}
        {step === 'otp' && (
          <form className="space-y-4" onSubmit={handleVerifyOTP}>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1">Verification Code (OTP)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  required
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-3 dark:bg-slate-900 dark:border-slate-700 text-sm tracking-widest text-center font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white shadow-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="flex justify-between items-center text-xs pt-2">
              <button
                type="button"
                onClick={() => setStep('mobile')}
                className="text-slate-500 hover:underline"
              >
                Change Number
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={handleSendOTP}
                className="font-semibold text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Registration Profile setup */}
        {step === 'register' && (
          <form className="space-y-4" onSubmit={handleRegister}>
            
            <div>
              <label className="block text-xs font-semibold uppercase mb-1">Full Name *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <UserIcon className="h-5 w-5" />
                </span>
                <input
                  required
                  type="text"
                  placeholder="Ram Singh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1">Email Address (Optional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <span className="h-5 w-5 flex items-center justify-center text-sm font-semibold">@</span>
                </span>
                <input
                  type="email"
                  placeholder="farmer@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1">State *</label>
                <select
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    const districts = DistrictsByState[e.target.value] || [];
                    setDistrict(districts[0] || '');
                  }}
                  className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm"
                >
                  {IndianStates.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">District *</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm"
                >
                  {(DistrictsByState[state] || []).map((dist) => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1">Village Name *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <MapPin className="h-5 w-5" />
                </span>
                <input
                  required
                  type="text"
                  placeholder="Gram Panchayat Village"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1">Farm Size (Acres)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Landmark className="h-5 w-5" />
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="3.5"
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">Primary Crop</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Sprout className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Wheat / Sugarcane"
                    value={primaryCrop}
                    onChange={(e) => setPrimaryCrop(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white shadow-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Complete Profile Setup'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;
