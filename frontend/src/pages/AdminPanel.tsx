import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, BookOpen, AlertTriangle, ShieldCheck, Plus, Trash2, LayoutGrid, Radio, PlusCircle, TrendingUp } from 'lucide-react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'farmers' | 'schemes' | 'prices' | 'broadcast'>('analytics');
  
  // Data States
  const [analytics, setAnalytics] = useState<any>(null);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for adding Scheme
  const [schemeForm, setSchemeForm] = useState({
    title: '',
    category: 'Financial Assistance',
    overview: '',
    eligibility: '',
    benefits: '',
    documentsRequired: '',
    applicationProcess: '',
    link: ''
  });

  // Form states for adding Market Price
  const [priceForm, setPriceForm] = useState({
    cropName: '',
    marketName: '',
    state: 'Maharashtra',
    district: '',
    todayPrice: '',
    yesterdayPrice: ''
  });

  // Form states for Broadcasting warning alerts
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    type: 'weather'
  });

  const [formMsg, setFormMsg] = useState('');
  const [formErr, setFormErr] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const analyticRes = await axios.get('/api/admin/analytics');
      if (analyticRes.data.success) {
        setAnalytics(analyticRes.data.analytics);
      }

      const farmerRes = await axios.get('/api/admin/farmers');
      if (farmerRes.data.success) {
        setFarmers(farmerRes.data.data);
      }
    } catch (err) {
      console.error('Error loading admin details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteFarmer = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this farmer profile?')) return;
    try {
      const res = await axios.delete(`/api/admin/farmers/${id}`);
      if (res.data.success) {
        setFarmers(farmers.filter((f) => f._id !== id));
        alert('Farmer profile deleted successfully.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg('');
    setFormErr('');

    try {
      const processedScheme = {
        ...schemeForm,
        eligibility: schemeForm.eligibility.split('\n').filter(l => l.trim()),
        benefits: schemeForm.benefits.split('\n').filter(l => l.trim()),
        documentsRequired: schemeForm.documentsRequired.split('\n').filter(l => l.trim())
      };

      const res = await axios.post('/api/admin/schemes', processedScheme);
      if (res.data.success) {
        setFormMsg('Government Scheme added successfully.');
        setSchemeForm({
          title: '',
          category: 'Financial Assistance',
          overview: '',
          eligibility: '',
          benefits: '',
          documentsRequired: '',
          applicationProcess: '',
          link: ''
        });
      }
    } catch (err: any) {
      setFormErr(err.response?.data?.message || 'Failed to submit scheme.');
    }
  };

  const handleAddPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg('');
    setFormErr('');

    try {
      const res = await axios.post('/api/admin/market-prices', priceForm);
      if (res.data.success) {
        setFormMsg('Market price listing added successfully.');
        setPriceForm({
          cropName: '',
          marketName: '',
          state: 'Maharashtra',
          district: '',
          todayPrice: '',
          yesterdayPrice: ''
        });
      }
    } catch (err: any) {
      setFormErr(err.response?.data?.message || 'Failed to submit prices.');
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg('');
    setFormErr('');

    try {
      const res = await axios.post('/api/admin/broadcast', broadcastForm);
      if (res.data.success) {
        setFormMsg('System alert broadcast successfully to all dashboards.');
        setBroadcastForm({
          title: '',
          message: '',
          type: 'weather'
        });
      }
    } catch (err: any) {
      setFormErr(err.response?.data?.message || 'Failed to broadcast warning.');
    }
  };

  // Setup analytics chart layouts
  const getCropsChartData = () => {
    if (!analytics) return null;
    return {
      labels: analytics.popularCrops.map((c: any) => c.crop),
      datasets: [
        {
          label: 'Farmers Count',
          data: analytics.popularCrops.map((c: any) => c.count),
          backgroundColor: ['#22c55e', '#3b82f6', '#eab308', '#a855f7', '#f43f5e'],
          borderRadius: 8
        }
      ]
    };
  };

  const getDiseasesChartData = () => {
    if (!analytics) return null;
    return {
      labels: analytics.diseaseStats.map((d: any) => d.disease.split(' ')[0]),
      datasets: [
        {
          data: analytics.diseaseStats.map((d: any) => d.count),
          backgroundColor: ['#f43f5e', '#fb923c', '#fbbf24', '#38bdf8', '#c084fc']
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto"></div>
        <p className="text-sm text-slate-500 mt-4">Loading Admin Control Panel...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <span>🛡️</span> Admin Management Panel
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Monitor crop disease analytics, publish mandi prices, add scheme cards, and broadcast alerts.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-200 dark:border-slate-800">
        <button onClick={() => { setActiveTab('analytics'); setFormMsg(''); setFormErr(''); }} className={`px-4 py-2 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${activeTab === 'analytics' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>Analytics & Stats</button>
        <button onClick={() => { setActiveTab('farmers'); setFormMsg(''); setFormErr(''); }} className={`px-4 py-2 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${activeTab === 'farmers' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>Manage Farmers</button>
        <button onClick={() => { setActiveTab('schemes'); setFormMsg(''); setFormErr(''); }} className={`px-4 py-2 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${activeTab === 'schemes' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>Add Scheme</button>
        <button onClick={() => { setActiveTab('prices'); setFormMsg(''); setFormErr(''); }} className={`px-4 py-2 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${activeTab === 'prices' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>Mandi Rates</button>
        <button onClick={() => { setActiveTab('broadcast'); setFormMsg(''); setFormErr(''); }} className={`px-4 py-2 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${activeTab === 'broadcast' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>Broadcast Alerts</button>
      </div>

      {formMsg && <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">{formMsg}</div>}
      {formErr && <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">{formErr}</div>}

      {/* Tab Contents: Analytics */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase">Total Farmers</span>
                <h3 className="text-2xl font-extrabold">{analytics.totalFarmers}</h3>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase">Active Portals</span>
                <h3 className="text-2xl font-extrabold">{analytics.activeUsers}</h3>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase">Disease Scans</span>
                <h3 className="text-2xl font-extrabold">6</h3>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase">Govt Schemes</span>
                <h3 className="text-2xl font-extrabold">4</h3>
              </div>
            </div>

          </div>

          <div className="grid gap-6 md:grid-cols-2">
            
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              <h3 className="text-lg font-bold">Popular Cultivated Crops</h3>
              <div className="h-64 relative w-full">
                {getCropsChartData() && <Bar data={getCropsChartData()!} options={{ responsive: true, maintainAspectRatio: false }} />}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              <h3 className="text-lg font-bold">Reported Disease Pathogens</h3>
              <div className="h-64 relative w-full flex justify-center">
                {getDiseasesChartData() && <Pie data={getDiseasesChartData()!} options={{ responsive: true, maintainAspectRatio: false }} />}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab Contents: Manage Farmers List */}
      {activeTab === 'farmers' && (
        <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-900/40 text-slate-500 text-xs font-bold border-b border-slate-150">
                  <th className="p-4">Farmer Details</th>
                  <th className="p-4">Address Info</th>
                  <th className="p-4">Farm Details</th>
                  <th className="p-4 text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {farmers.length > 0 ? (
                  farmers.map((farmer) => (
                    <tr key={farmer._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="p-4 font-bold text-slate-850 dark:text-slate-100">
                        <div>{farmer.name}</div>
                        <div className="text-xs text-slate-400 font-semibold">{farmer.mobile}</div>
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-350">
                        {farmer.village}, {farmer.district}, {farmer.state}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold">{farmer.farmSize || 'N/A'} Acres</span>
                        <span className="text-xs text-slate-400 block">Primary Crop: {farmer.primaryCrop || 'None'}</span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteFarmer(farmer._id)}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">No registered farmers profiles.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Contents: Add Scheme Form */}
      {activeTab === 'schemes' && (
        <form onSubmit={handleAddScheme} className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl mx-auto space-y-4 shadow-sm">
          <h3 className="text-lg font-bold border-b pb-2 flex items-center gap-1.5"><PlusCircle className="h-5 w-5 text-primary-500" /> Publish Government Scheme</h3>
          
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Scheme Title</label>
            <input required type="text" placeholder="PM Krishi Sinchayee Yojana" value={schemeForm.title} onChange={(e) => setSchemeForm({ ...schemeForm, title: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Category</label>
              <select value={schemeForm.category} onChange={(e) => setSchemeForm({ ...schemeForm, category: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm">
                <option value="Financial Assistance">Financial Assistance</option>
                <option value="Crop Insurance">Crop Insurance</option>
                <option value="Agricultural Credit">Agricultural Credit</option>
                <option value="Soil Care">Soil Care</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">External Link</label>
              <input type="url" placeholder="https://pmksy.gov.in" value={schemeForm.link} onChange={(e) => setSchemeForm({ ...schemeForm, link: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1">Overview</label>
            <textarea required rows={3} placeholder="Brief summary details about scheme objectives..." value={schemeForm.overview} onChange={(e) => setSchemeForm({ ...schemeForm, overview: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm"></textarea>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Eligibility (Line separated)</label>
              <textarea rows={4} placeholder="Line 1&#10;Line 2" value={schemeForm.eligibility} onChange={(e) => setSchemeForm({ ...schemeForm, eligibility: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-xs"></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Benefits (Line separated)</label>
              <textarea rows={4} placeholder="Line 1&#10;Line 2" value={schemeForm.benefits} onChange={(e) => setSchemeForm({ ...schemeForm, benefits: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-xs"></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Documents (Line separated)</label>
              <textarea rows={4} placeholder="Line 1&#10;Line 2" value={schemeForm.documentsRequired} onChange={(e) => setSchemeForm({ ...schemeForm, documentsRequired: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-xs"></textarea>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1">Application Process</label>
            <textarea required rows={2} placeholder="Instructions on how to enroll..." value={schemeForm.applicationProcess} onChange={(e) => setSchemeForm({ ...schemeForm, applicationProcess: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm"></textarea>
          </div>

          <button type="submit" className="w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white shadow-md hover:bg-primary-700">Add Scheme</button>
        </form>
      )}

      {/* Tab Contents: Publish Mandi Prices */}
      {activeTab === 'prices' && (
        <form onSubmit={handleAddPrice} className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl mx-auto space-y-4 shadow-sm">
          <h3 className="text-lg font-bold border-b pb-2 flex items-center gap-1.5"><TrendingUp className="h-5 w-5 text-primary-500" /> Update Mandi Crop Price</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Crop Name</label>
              <input required type="text" placeholder="Cotton" value={priceForm.cropName} onChange={(e) => setPriceForm({ ...priceForm, cropName: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Mandi Name</label>
              <input required type="text" placeholder="Yavatmal Mandi" value={priceForm.marketName} onChange={(e) => setPriceForm({ ...priceForm, marketName: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">State</label>
              <select value={priceForm.state} onChange={(e) => setPriceForm({ ...priceForm, state: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm">
                <option value="Maharashtra">Maharashtra</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Rajasthan">Rajasthan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">District</label>
              <input required type="text" placeholder="Yavatmal" value={priceForm.district} onChange={(e) => setPriceForm({ ...priceForm, district: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Today\'s Price (₹/Quintal)</label>
              <input required type="number" placeholder="7150" value={priceForm.todayPrice} onChange={(e) => setPriceForm({ ...priceForm, todayPrice: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Yesterday\'s Price (₹/Quintal)</label>
              <input required type="number" placeholder="7200" value={priceForm.yesterdayPrice} onChange={(e) => setPriceForm({ ...priceForm, yesterdayPrice: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm" />
            </div>
          </div>

          <button type="submit" className="w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white shadow-md hover:bg-primary-700">Add price listing</button>
        </form>
      )}

      {/* Tab Contents: Broadcast warnings */}
      {activeTab === 'broadcast' && (
        <form onSubmit={handleBroadcast} className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl mx-auto space-y-4 shadow-sm">
          <h3 className="text-lg font-bold border-b pb-2 flex items-center gap-1.5"><Radio className="h-5 w-5 text-rose-500" /> Broadcast System Alert</h3>

          <div>
            <label className="block text-xs font-bold uppercase mb-1">Alert Title</label>
            <input required type="text" placeholder="Cyclone warning or price surge alert..." value={broadcastForm.title} onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1">Alert Category</label>
            <select value={broadcastForm.type} onChange={(e) => setBroadcastForm({ ...broadcastForm, type: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm">
              <option value="weather">Weather Alert</option>
              <option value="scheme">Govt Scheme Alert</option>
              <option value="market">Market Rate Alert</option>
              <option value="admin">General Broadcast</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1">Alert Message</label>
            <textarea required rows={4} placeholder="Type the warning message that will be broadcasted to all logged-in farmers..." value={broadcastForm.message} onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm"></textarea>
          </div>

          <button type="submit" className="w-full rounded-xl bg-rose-600 py-3 text-sm font-bold text-white shadow-md hover:bg-rose-700">Broadcast Alert Now</button>
        </form>
      )}

    </div>
  );
};

export default AdminPanel;
