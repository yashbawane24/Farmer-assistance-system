import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { IndianRupee, Search, TrendingUp, Compass, ArrowUpRight, ArrowDownRight, RefreshCw, BarChart2 } from 'lucide-react';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const MarketPrices: React.FC = () => {
  const { t } = useLanguage();

  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<any>(null);
  const [bestMarket, setBestMarket] = useState<any>(null);
  
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/market?cropName=${search}`);
        if (res.data.success) {
          setPrices(res.data.data);
          
          if (res.data.data.length > 0) {
            // Set first element as default for trends
            setSelectedCrop(res.data.data[0]);
            
            // Deduce best price market
            const sorted = [...res.data.data].sort((a, b) => b.todayPrice - a.todayPrice);
            setBestMarket(sorted[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching market rates:', err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchPrices();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, refreshKey]);

  const handleSelectCrop = (crop: any) => {
    setSelectedCrop(crop);
  };

  const getPriceDifference = (today: number, yesterday: number) => {
    const diff = today - yesterday;
    const pct = ((diff / yesterday) * 100).toFixed(1);
    if (diff > 0) {
      return (
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
          <ArrowUpRight className="h-3.5 w-3.5" /> +₹{diff} (+{pct}%)
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
          <ArrowDownRight className="h-3.5 w-3.5" /> -₹{Math.abs(diff)} ({pct}%)
        </span>
      );
    }
    return <span className="text-xs font-bold text-slate-500">₹0 (Stable)</span>;
  };

  // Setup data for ChartJS line render
  const getChartData = () => {
    if (!selectedCrop) return null;
    return {
      labels: ['6 Days Ago', '5 Days Ago', '4 Days Ago', '3 Days Ago', '2 Days Ago', 'Yesterday', 'Today'],
      datasets: [
        {
          label: `${selectedCrop.cropName} Price Trend (₹/Quintal)`,
          data: selectedCrop.weeklyTrend || [selectedCrop.todayPrice],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          tension: 0.25,
          fill: true,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <span>📊</span> {t('mandiRatesTitle')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Compare crop market rates across regional mandis to get the best value for your yields.
          </p>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Prices
        </button>
      </div>

      {/* Analytics highlights */}
      {bestMarket && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">{t('bestMarketPrice')}</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {bestMarket.cropName} (₹{bestMarket.todayPrice})
            </h3>
            <p className="text-xs text-slate-500">Mandi: {bestMarket.marketName}, {bestMarket.district}</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Top Trading Crop</span>
            <h3 className="text-2xl font-extrabold text-primary-600 dark:text-primary-400">Wheat</h3>
            <p className="text-xs text-slate-500">Highest volume reported across regional collections</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 col-span-1 sm:col-span-2 lg:col-span-1">
            <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Trend Outlook</span>
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">Upward (+1.8%)</h3>
            <p className="text-xs text-slate-500">Prices showing positive growth patterns this week</p>
          </div>

        </div>
      )}

      {/* Live Market Price comparison layouts */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Left Side: Mandi Search & Rates List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder={t('searchCrop')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 pl-10 pr-4 py-3 dark:bg-slate-900 dark:border-slate-700 text-sm focus:ring-primary-500"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl"></div>
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 dark:bg-slate-900/40 text-slate-500 text-xs font-bold border-b border-slate-150 dark:border-slate-800">
                      <th className="p-4">{t('cropName')}</th>
                      <th className="p-4">{t('mandiName')}</th>
                      <th className="p-4">{t('todayRate')}</th>
                      <th className="p-4">Trend Shift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {prices.length > 0 ? (
                      prices.map((crop) => (
                        <tr
                          key={crop._id}
                          onClick={() => handleSelectCrop(crop)}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                            selectedCrop?._id === crop._id ? 'bg-primary-50/40 dark:bg-primary-950/10' : ''
                          }`}
                        >
                          <td className="p-4 font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                            <span className="text-xl">🌾</span> {crop.cropName}
                          </td>
                          <td className="p-4">
                            <span className="font-semibold block">{crop.marketName}</span>
                            <span className="text-xs text-slate-400">{crop.district}, {crop.state}</span>
                          </td>
                          <td className="p-4 font-extrabold text-slate-850 dark:text-slate-100">
                            ₹{crop.todayPrice} <span className="text-slate-400 text-xs font-normal">/Quintal</span>
                          </td>
                          <td className="p-4">
                            {getPriceDifference(crop.todayPrice, crop.yesterdayPrice)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500">
                          No market price matches found for your search crop.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Price Historical Trends Chart */}
        <div className="lg:col-span-5 space-y-4">
          {selectedCrop ? (
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
              
              <div className="border-b border-slate-100 dark:border-slate-850 pb-3">
                <h3 className="text-lg font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <BarChart2 className="h-5 w-5 text-primary-500" />
                  Weekly Trends
                </h3>
                <p className="text-xs text-slate-500">Historical performance metrics for {selectedCrop.cropName} in {selectedCrop.marketName}</p>
              </div>

              {/* Live Canvas Render */}
              <div className="h-60 relative w-full">
                {getChartData() && <Line data={getChartData()!} options={chartOptions} />}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-850/50">
                  <span className="text-slate-400 block mb-0.5">Today Rate</span>
                  <h4 className="text-lg font-extrabold">₹{selectedCrop.todayPrice}</h4>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-850/50">
                  <span className="text-slate-400 block mb-0.5">Yesterday Rate</span>
                  <h4 className="text-lg font-extrabold text-slate-500">₹{selectedCrop.yesterdayPrice}</h4>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
              <div className="text-5xl">📈</div>
              <h3 className="text-lg font-bold">Select a crop listing.</h3>
              <p className="text-sm text-slate-500 max-w-sm">Tap on a mandi rate listing on the left to examine detailed charts and historical trends.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default MarketPrices;
