import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { Sprout, TrendingUp, Calendar, Compass, Layers, Droplet, IndianRupee, Sparkles } from 'lucide-react';

const SoilTypes = ['Alluvial', 'Black', 'Red', 'Sandy', 'Clayey', 'Loamy'];
const Seasons = ['Kharif', 'Rabi', 'Zaid'];
const WaterLevels = ['High', 'Medium', 'Low'];

const CropRecommendation: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [soilType, setSoilType] = useState('Clayey');
  const [season, setSeason] = useState('Kharif');
  const [water, setWater] = useState('High');
  const [farmSize, setFarmSize] = useState(user?.farmSize ? String(user.farmSize) : '1');
  const [budget, setBudget] = useState('15000');

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRecommendations([]);

    try {
      const response = await axios.post('/api/recommendations', {
        state: user?.state,
        district: user?.district,
        season,
        soilType,
        farmSize,
        waterAvailability: water,
        budget
      });

      if (response.data.success) {
        setRecommendations(response.data.recommendations);
      } else {
        setError('Failed to compute crop suggestions.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Server error computing crop model.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <span>🌾</span> {t('cropRecomTitle')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Analyze soil metrics, season inputs, and regional water constraints to suggest high-profit crops.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Left Side: Advisor Input Wizard */}
        <div className="lg:col-span-4">
          <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
            <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-850 pb-2">Advisor Parameters</h3>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t('selectSoil')}</label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm focus:ring-primary-500"
              >
                {SoilTypes.map((soil) => (
                  <option key={soil} value={soil}>{soil} Soil</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t('selectSeason')}</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm focus:ring-primary-500"
              >
                {Seasons.map((seas) => (
                  <option key={seas} value={seas}>{seas} Season</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t('waterAvailability')}</label>
              <div className="grid grid-cols-3 gap-1">
                {WaterLevels.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setWater(lvl)}
                    className={`py-2 rounded-lg text-xs font-bold border ${
                      water === lvl
                        ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t('farmSize')}</label>
                <input
                  required
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Budget (INR)</label>
                <input
                  required
                  type="number"
                  min="1000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white shadow-md hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Compass className="h-4 w-4" />
              {loading ? 'Analyzing...' : t('recommendButton')}
            </button>
          </form>
        </div>

        {/* Right Side: Outputs and Suggestions */}
        <div className="lg:col-span-8 space-y-6">
          
          {error && (
            <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
              {error}
            </div>
          )}

          {recommendations.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Suggested Crops for {farmSize} Acres
              </h2>

              <div className="grid gap-6 sm:grid-cols-2">
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-5 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Sprout className="h-5 w-5 text-primary-500" />
                          {rec.cropName}
                        </h3>
                        <span className="rounded bg-primary-100 dark:bg-primary-950 px-2 py-0.5 text-xs text-primary-800 dark:text-primary-400 font-bold">Recommended</span>
                      </div>
                      
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {rec.description}
                      </p>

                      <hr className="border-slate-100 dark:border-slate-800" />

                      <div className="grid grid-cols-2 gap-2 text-xs space-y-1">
                        <div>
                          <span className="text-slate-400 block mb-0.5">{t('expectedYield')}</span>
                          <h4 className="font-extrabold text-slate-850 dark:text-slate-100">{rec.expectedYield}</h4>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">{t('growingTime')}</span>
                          <h4 className="font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                            {rec.growingTimeMonths} Months
                          </h4>
                        </div>
                      </div>

                      <div className="pt-1">
                        <span className="text-slate-400 text-xs block mb-0.5">{t('suitableFertilizer')}</span>
                        <h4 className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">{rec.suitableFertilizer}</h4>
                      </div>

                      <div className="pt-2">
                        <span className="text-slate-400 text-xs font-bold uppercase block mb-1.5">Key Advantages</span>
                        <ul className="text-xs space-y-1.5">
                          {rec.advantages.map((adv: string, aIdx: number) => (
                            <li key={aIdx} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <span className="text-emerald-500">✓</span> {adv}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{t('profitEstimation')}</span>
                        <h3 className="text-2xl font-extrabold text-primary-600 dark:text-primary-400">
                          ₹{rec.totalProfitEstimation.toLocaleString()}
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400">₹{rec.profitEstimationPerAcre.toLocaleString()}/Acre</span>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
              <div className="text-5xl">🌾</div>
              <h3 className="text-lg font-bold">No advisor records displayed yet.</h3>
              <p className="text-sm text-slate-500 max-w-sm">Complete the advisor inputs panel on the left and submit to query crop suggestions.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default CropRecommendation;
