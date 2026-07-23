import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import axios from 'axios';
import { Cloud, Sprout, ShieldAlert, IndianRupee, Bell, AlertTriangle, ExternalLink, RefreshCw, Bookmark } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS elements
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { readTextAloud } = useAccessibility();

  const [weather, setWeather] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [mandiPrices, setMandiPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch weather
        const weatherRes = await axios.get(`/api/weather?state=${encodeURIComponent(user.state)}&district=${encodeURIComponent(user.district)}`);
        if (weatherRes.data.success) {
          setWeather(weatherRes.data.data);
        }

        // Fetch notifications
        const notifRes = await axios.get('/api/notifications');
        if (notifRes.data.success) {
          setNotifications(notifRes.data.data.slice(0, 4));
        }

        // Fetch market prices
        const marketRes = await axios.get('/api/market');
        if (marketRes.data.success) {
          setMandiPrices(marketRes.data.data.slice(0, 4));
        }

      } catch (err) {
        console.error('Error fetching dashboard records:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, refreshKey]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await axios.put(`/api/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadAdvisory = () => {
    if (weather) {
      readTextAloud(`Weather advisory for ${user?.district}. ${weather.advisories.message}`);
    } else {
      readTextAloud('Advisory details are loading.');
    }
  };

  // Setup sample data for price trends chart
  const chartData = {
    labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Today'],
    datasets: [
      {
        label: 'Wheat (INR/Quintal)',
        data: [2380, 2390, 2410, 2400, 2415, 2420, 2450],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(200, 200, 200, 0.08)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="h-10 w-1/3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="h-44 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
          <div className="h-44 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
          <div className="h-44 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {t('welcomeBack')} {user?.name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Location: {user?.village}, {user?.district}, {user?.state} | Primary Crop: {user?.primaryCrop || 'None'}
          </p>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="flex self-start items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Dashboard
        </button>
      </div>

      {/* Primary Grid Layout */}
      <div className="grid gap-6 md:grid-cols-12">
        
        {/* Weather Widget */}
        <div className="md:col-span-8 rounded-3xl glass-panel p-6 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-6xl opacity-20 select-none">
            {weather?.current?.main === 'Rain' ? '🌧️' : '☀️'}
          </div>
          
          <div className="flex items-center gap-2 mb-4 text-primary-600 dark:text-primary-400 font-semibold text-sm">
            <Cloud className="h-4 w-4" />
            <span>{t('weatherDetails')}</span>
          </div>

          {weather ? (
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold">{weather.current.temperature}</span>
                  <span className="text-xl font-semibold text-slate-500">°C</span>
                </div>
                <h3 className="font-bold text-lg capitalize">{weather.current.description}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">District: {weather.location}</p>
                <div className="pt-2 flex flex-wrap gap-2 text-xs">
                  {weather.advisories.suitableForIrrigation && (
                    <span className="rounded bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 text-emerald-800 dark:text-emerald-400 font-semibold">{t('irrigationOk')}</span>
                  )}
                  {weather.advisories.harvestToday && (
                    <span className="rounded bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 text-amber-800 dark:text-amber-400 font-semibold">{t('harvestOk')}</span>
                  )}
                </div>
              </div>

              {/* Advisory Details */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-100 dark:border-slate-800/40 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">{t('todayAdvisory')}</h4>
                  <p className="text-sm leading-relaxed">{weather.advisories.message}</p>
                </div>
                <button
                  onClick={handleReadAdvisory}
                  className="flex items-center justify-center gap-1.5 self-start rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-700"
                >
                  🔊 Listen Advisory
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm">No weather forecast records available.</p>
          )}
        </div>

        {/* Quick Actions Grid */}
        <div className="md:col-span-4 grid grid-cols-2 gap-4">
          <Link
            to="/recommendation"
            className="flex flex-col items-center justify-center text-center p-4 rounded-2xl glass-panel border border-slate-100 dark:border-slate-800 hover:scale-[1.02] transition-transform shadow-sm"
          >
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-2">
              <Sprout className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold leading-tight">{t('recommendation')}</span>
          </Link>

          <Link
            to="/disease-detection"
            className="flex flex-col items-center justify-center text-center p-4 rounded-2xl glass-panel border border-slate-100 dark:border-slate-800 hover:scale-[1.02] transition-transform shadow-sm"
          >
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 mb-2">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold leading-tight">{t('diseaseDetection')}</span>
          </Link>

          <Link
            to="/market-prices"
            className="flex flex-col items-center justify-center text-center p-4 rounded-2xl glass-panel border border-slate-100 dark:border-slate-800 hover:scale-[1.02] transition-transform shadow-sm"
          >
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mb-2">
              <IndianRupee className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold leading-tight">{t('marketPrices')}</span>
          </Link>

          <Link
            to="/schemes"
            className="flex flex-col items-center justify-center text-center p-4 rounded-2xl glass-panel border border-slate-100 dark:border-slate-800 hover:scale-[1.02] transition-transform shadow-sm"
          >
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 mb-2">
              <Bookmark className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold leading-tight">{t('schemes')}</span>
          </Link>
        </div>

      </div>

      {/* Second Grid Rows */}
      <div className="grid gap-6 md:grid-cols-12">
        
        {/* Mandi Prices & Analytics Chart */}
        <div className="md:col-span-8 rounded-3xl glass-panel p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Mandi Price Trends (Wheat)</h3>
            <Link to="/market-prices" className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline">
              Full Comparison <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-60 relative w-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Notifications & System Broadcasts */}
        <div className="md:col-span-4 rounded-3xl glass-panel p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
              <h3 className="text-lg font-bold flex items-center gap-1.5">
                <Bell className="h-5 w-5 text-amber-500" />
                Alerts & Reminders
              </h3>
            </div>
            
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 transition-colors ${
                      notif.isRead 
                        ? 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800/40 text-slate-500' 
                        : 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/20'
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                    <div className="space-y-0.5 w-full">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="text-xs font-bold leading-tight">{notif.title}</h4>
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notif._id)}
                            className="text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:underline shrink-0"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">All caught up! No recent notifications.</p>
              )}
            </div>
          </div>

          <Link
            to="/help-center"
            className="mt-4 block text-center rounded-xl bg-slate-100 dark:bg-slate-800 p-2.5 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Help Center FAQs
          </Link>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
