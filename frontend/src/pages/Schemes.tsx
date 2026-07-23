import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { Library, Search, Bookmark, ChevronRight, FileText, CheckCircle, Award, Landmark, ExternalLink } from 'lucide-react';

const Categories = ['All', 'Financial Assistance', 'Crop Insurance', 'Agricultural Credit', 'Soil Care'];

const Schemes: React.FC = () => {
  const { user, toggleBookmarkAPI } = useAuth();
  const { t } = useLanguage();

  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedScheme, setSelectedScheme] = useState<any>(null);

  useEffect(() => {
    const fetchSchemes = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/schemes?category=${category}&search=${search}`);
        if (res.data.success) {
          setSchemes(res.data.data);
          
          if (res.data.data.length > 0) {
            setSelectedScheme(res.data.data[0]);
          } else {
            setSelectedScheme(null);
          }

          // Offline Cache mechanism: Write results to localStorage
          localStorage.setItem(`farmer_schemes_${category}_${search}`, JSON.stringify(res.data.data));
        }
      } catch (err) {
        console.warn('Network error, fetching from offline cache:', err);
        // Load from local storage backup
        const cached = localStorage.getItem(`farmer_schemes_${category}_${search}`);
        if (cached) {
          const cachedData = JSON.parse(cached);
          setSchemes(cachedData);
          if (cachedData.length > 0) {
            setSelectedScheme(cachedData[0]);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSchemes();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [category, search]);

  const handleToggleBookmark = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleBookmarkAPI('scheme', id);
  };

  const isBookmarked = (id: string) => {
    return user?.bookmarks?.schemes?.includes(id) || false;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <span>🏛️</span> {t('govtSchemesTitle')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Find latest subsidies, loan products, crop insurances, and apply directly. Offline-enabled.
        </p>
      </div>

      {/* Category Toggles Slider */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {Categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
              category === cat
                ? 'border-primary-500 bg-primary-600 text-white shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Left Column: Search & List */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder={t('searchSchemes')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 pl-10 pr-4 py-3 dark:bg-slate-900 dark:border-slate-700 text-sm focus:ring-primary-500"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div key={n} className="h-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {schemes.length > 0 ? (
                schemes.map((scheme) => (
                  <div
                    key={scheme._id}
                    onClick={() => setSelectedScheme(scheme)}
                    className={`p-5 rounded-3xl border glass-panel flex justify-between items-center cursor-pointer transition-all hover:scale-[1.01] ${
                      selectedScheme?._id === scheme._id
                        ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/15'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-1.5 max-w-[80%]">
                      <span className="rounded bg-primary-100 dark:bg-primary-950 px-2 py-0.5 text-[10px] text-primary-800 dark:text-primary-400 font-bold uppercase tracking-wider">{scheme.category}</span>
                      <h3 className="text-base font-extrabold leading-tight">{scheme.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1">{scheme.overview}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleToggleBookmark(scheme._id, e)}
                        className={`p-2 rounded-xl border transition-colors ${
                          isBookmarked(scheme._id)
                            ? 'bg-amber-100 border-amber-300 text-amber-600 dark:bg-amber-950/40 dark:border-amber-900/30'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                        }`}
                        title={isBookmarked(scheme._id) ? "Remove Bookmark" : "Bookmark Scheme"}
                      >
                        <Bookmark className="h-4 w-4" fill={isBookmarked(scheme._id) ? "currentColor" : "none"} />
                      </button>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 py-8 text-center bg-white dark:bg-slate-900/35 rounded-3xl border border-slate-200 dark:border-slate-800">No schemes found matching the filters.</p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Scheme Details View */}
        <div className="lg:col-span-6">
          {selectedScheme ? (
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
              
              <div className="flex justify-between items-start gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
                <div className="space-y-1">
                  <span className="rounded bg-primary-100 dark:bg-primary-950 px-2 py-0.5 text-xs text-primary-800 dark:text-primary-400 font-bold uppercase tracking-wider">{selectedScheme.category}</span>
                  <h2 className="text-xl font-extrabold leading-snug">{selectedScheme.title}</h2>
                </div>
                
                <button
                  onClick={(e) => handleToggleBookmark(selectedScheme._id, e)}
                  className={`p-2.5 rounded-xl border shrink-0 transition-colors ${
                    isBookmarked(selectedScheme._id)
                      ? 'bg-amber-100 border-amber-300 text-amber-600 dark:bg-amber-950/40 dark:border-amber-900/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Bookmark className="h-5 w-5" fill={isBookmarked(selectedScheme._id) ? "currentColor" : "none"} />
                </button>
              </div>

              {/* Overview */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('schemeOverview')}</h4>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-350">{selectedScheme.overview}</p>
              </div>

              {/* Eligibility & Benefits */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    {t('eligibilityCriteria')}
                  </h4>
                  <ul className="text-xs space-y-2">
                    {selectedScheme.eligibility.map((el: string, idx: number) => (
                      <li key={idx} className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/50">
                        {el}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-primary-500" />
                    {t('schemeBenefits')}
                  </h4>
                  <ul className="text-xs space-y-2">
                    {selectedScheme.benefits.map((ben: string, idx: number) => (
                      <li key={idx} className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/50 text-emerald-800 dark:text-emerald-400 font-semibold">
                        {ben}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Documents & Application process */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-500" />
                    {t('documentsRequired')}
                  </h4>
                  <ul className="text-xs space-y-1.5">
                    {selectedScheme.documentsRequired.map((doc: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400">•</span> {doc}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Landmark className="h-4 w-4 text-amber-500" />
                    Application Process
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {selectedScheme.applicationProcess}
                  </p>
                </div>
              </div>

              {/* Apply online anchor */}
              {selectedScheme.link && (
                <a
                  href={selectedScheme.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center block rounded-xl bg-primary-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-primary-700 flex items-center justify-center gap-1.5"
                >
                  {t('applyNow')} <ExternalLink className="h-4 w-4" />
                </a>
              )}

            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
              <div className="text-5xl">🏛️</div>
              <h3 className="text-lg font-bold">Select a Government Scheme.</h3>
              <p className="text-sm text-slate-500 max-w-sm">Tap on a scheme listing card on the left panel to display detailed requirements and process details.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Schemes;
