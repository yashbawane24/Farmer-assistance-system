import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { Cloud, Sun, Wind, Droplets, Compass, Thermometer, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

const WeatherDetails: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(
          `/api/weather?state=${encodeURIComponent(user.state)}&district=${encodeURIComponent(user.district)}`
        );
        if (response.data.success) {
          setWeather(response.data.data);
        } else {
          setError('Failed to load weather forecast.');
        }
      } catch (err: any) {
        setError('Error establishing connection with weather servers.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [user, refreshKey]);

  const getWeatherIcon = (main: string) => {
    switch (main) {
      case 'Rain':
      case 'Showers':
      case 'Heavy Rain':
        return '🌧️';
      case 'Clouds':
      case 'Partly Cloudy':
        return '⛅';
      case 'Snow':
        return '❄️';
      default:
        return '☀️';
    }
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(t('language') === 'en' ? 'en-US' : 'hi-IN', { weekday: 'long' });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="h-10 w-1/3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg"></div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-3xl"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <span>🌦️</span> {t('weatherDetails')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Live forecasting details for {user?.district}, {user?.state}
          </p>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Weather
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
          {error}
        </div>
      )}

      {weather && (
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* Left Column: Current Status & Advisories */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Current Details Card */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 grid sm:grid-cols-12 items-center gap-6">
              
              <div className="sm:col-span-4 text-center sm:text-left space-y-3">
                <span className="text-8xl select-none block">
                  {getWeatherIcon(weather.current.main)}
                </span>
                <div>
                  <h2 className="text-4xl font-extrabold">{weather.current.temperature}°C</h2>
                  <p className="font-bold text-lg text-slate-700 dark:text-slate-300 capitalize">{weather.current.description}</p>
                </div>
              </div>

              {/* Grid of indicators */}
              <div className="sm:col-span-8 grid grid-cols-2 gap-4">
                
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    <Droplets className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">{t('humidity')}</span>
                    <h4 className="text-sm font-extrabold">{weather.current.humidity}%</h4>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40">
                  <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                    <Wind className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">{t('windSpeed')}</span>
                    <h4 className="text-sm font-extrabold">{weather.current.windSpeed} km/h</h4>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">{t('uvIndex')}</span>
                    <h4 className="text-sm font-extrabold">{weather.current.uvIndex} / 10</h4>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40">
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">{t('pressure')}</span>
                    <h4 className="text-sm font-extrabold">{weather.current.pressure} hPa</h4>
                  </div>
                </div>

              </div>

            </div>

            {/* Weather Advisories Card */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-1.5 text-primary-600 dark:text-primary-400">
                <Sparkles className="h-5 w-5 animate-pulse" />
                Agricultural Advisories & Recommendations
              </h3>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {weather.advisories.message}
              </p>
              
              <div className="grid gap-3 sm:grid-cols-3 pt-2">
                
                <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                  weather.advisories.suitableForIrrigation
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/15 border-emerald-100 dark:border-emerald-900/30'
                    : 'bg-rose-50/30 dark:bg-rose-950/5 border-rose-100/40 dark:border-rose-900/10'
                }`}>
                  <div>
                    <span className="text-2xl mb-1 block">💧</span>
                    <h4 className="text-sm font-bold">{t('irrigationOk')}</h4>
                  </div>
                  <span className="text-xs text-slate-500 mt-2">
                    {weather.advisories.suitableForIrrigation ? 'Recommended' : 'Postpone Irrigation'}
                  </span>
                </div>

                <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                  weather.advisories.harvestToday
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/15 border-emerald-100 dark:border-emerald-900/30'
                    : 'bg-rose-50/30 dark:bg-rose-950/5 border-rose-100/40 dark:border-rose-900/10'
                }`}>
                  <div>
                    <span className="text-2xl mb-1 block">🚜</span>
                    <h4 className="text-sm font-bold">{t('harvestOk')}</h4>
                  </div>
                  <span className="text-xs text-slate-500 mt-2">
                    {weather.advisories.harvestToday ? 'Excellent Conditions' : 'Delay Harvesting'}
                  </span>
                </div>

                <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                  weather.advisories.avoidPesticideSpraying
                    ? 'bg-rose-50/50 dark:bg-rose-950/15 border-rose-100 dark:border-rose-900/30'
                    : 'bg-emerald-50/30 dark:bg-emerald-950/5 border-emerald-100/40 dark:border-emerald-900/10'
                }`}>
                  <div>
                    <span className="text-2xl mb-1 block">💨</span>
                    <h4 className="text-sm font-bold">{t('sprayAvoid')}</h4>
                  </div>
                  <span className="text-xs text-slate-500 mt-2">
                    {weather.advisories.avoidPesticideSpraying ? 'High Risk' : 'Safe to Spray'}
                  </span>
                </div>

              </div>
            </div>

          </div>

          {/* Right Column: 5 Day Forecast */}
          <div className="lg:col-span-4 rounded-3xl glass-panel p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-1.5">
              <span>📅</span> {t('fiveDayForecast')}
            </h3>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-850">
              {weather.forecast.map((day: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between text-sm">
                  <div className="space-y-0.5">
                    <h4 className="font-semibold">{getDayName(day.date)}</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{day.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl select-none" title={day.main}>
                      {getWeatherIcon(day.main)}
                    </span>
                    <div className="text-right">
                      <span className="font-bold">{day.tempMax}°</span>
                      <span className="text-xs text-slate-400 ml-1">/{day.tempMin}°</span>
                      <p className="text-[10px] text-primary-600 font-bold dark:text-primary-400">{day.rainChance}% rain</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default WeatherDetails;
