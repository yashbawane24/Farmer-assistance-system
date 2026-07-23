import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Sprout, Landmark, User, Save, RefreshCw } from 'lucide-react';

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

const Profile: React.FC = () => {
  const { user, updateProfileData } = useAuth();
  const { t, setLanguage } = useLanguage();

  const [name, setName] = useState(user?.name || '');
  const [state, setState] = useState(user?.state || 'Maharashtra');
  const [district, setDistrict] = useState(user?.district || 'Pune');
  const [village, setVillage] = useState(user?.village || '');
  const [farmSize, setFarmSize] = useState(user?.farmSize ? String(user.farmSize) : '');
  const [primaryCrop, setPrimaryCrop] = useState(user?.primaryCrop || '');
  
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    setErr('');

    try {
      await updateProfileData({
        name,
        state,
        district,
        village,
        farmSize: farmSize ? parseFloat(farmSize) : undefined,
        primaryCrop
      });
      setMsg('Profile details updated successfully.');
    } catch (error: any) {
      setErr('Failed to save profile changes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <span>👤</span> {t('profile')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Modify name, local address details, and farm sizes to update system parameters.
        </p>
      </div>

      {msg && <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">{msg}</div>}
      {err && <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">{err}</div>}

      <div className="grid gap-6 md:grid-cols-12">
        
        {/* Left Side Info Card */}
        <div className="md:col-span-4 rounded-3xl glass-panel p-6 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
          <div className="mx-auto h-24 w-24 rounded-full bg-primary-100 dark:bg-primary-950 text-slate-500 flex items-center justify-center text-4xl">
            👨‍🌾
          </div>
          <div>
            <h3 className="text-xl font-bold">{user?.name}</h3>
            <p className="text-xs text-slate-400 font-semibold">{user?.mobile}</p>
          </div>
          <hr className="border-slate-100 dark:border-slate-850" />
          <div className="text-left text-xs space-y-2.5 text-slate-650 dark:text-slate-350">
            <p><strong className="text-slate-400 block mb-0.5">Role Level:</strong> <span className="capitalize font-bold text-primary-600 dark:text-primary-400">{user?.role}</span></p>
            <p><strong className="text-slate-400 block mb-0.5">State & Dist:</strong> {user?.district}, {user?.state}</p>
            <p><strong className="text-slate-400 block mb-0.5">Registered Crop:</strong> {user?.primaryCrop || 'Not configured'}</p>
          </div>
        </div>

        {/* Right Side Editing Form */}
        <div className="md:col-span-8">
          <form onSubmit={handleUpdate} className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-md">
            <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-850 pb-2">Profile Configuration</h3>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-5 w-5" />
                </span>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">State</label>
                <select
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    const districts = DistrictsByState[e.target.value] || [];
                    setDistrict(districts[0] || '');
                  }}
                  className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm focus:ring-primary-500"
                >
                  {IndianStates.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">District</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm focus:ring-primary-500"
                >
                  {(DistrictsByState[state] || []).map((dist) => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Village Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <MapPin className="h-5 w-5" />
                </span>
                <input
                  required
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1 font-sans">Farm Size (Acres)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Landmark className="h-5 w-5" />
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Primary Crop</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Sprout className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    value={primaryCrop}
                    onChange={(e) => setPrimaryCrop(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white shadow-md hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default Profile;
