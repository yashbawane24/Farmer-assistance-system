// Centralized API Client with Offline Resilience
const RAW_URL = import.meta.env.VITE_API_URL || '/api';
const BASE_URL = RAW_URL.replace(/\/+$/, '');

async function fetchJson(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || `HTTP Error ${response.status}`);
    }

    // Cache successful GET data for offline availability
    if (!options.method || options.method === 'GET') {
      try {
        localStorage.setItem(`sfas_cache_${endpoint}`, JSON.stringify(data.data));
      } catch (e) {
        // Storage quota safeguard
      }
    }

    return data.data;
  } catch (error) {
    console.warn(`[SFAS API] Request to ${endpoint} failed:`, error.message);

    // Attempt to serve cached data if available
    const cached = localStorage.getItem(`sfas_cache_${endpoint}`);
    if (cached) {
      console.log(`[SFAS API] Serving cached offline fallback for ${endpoint}`);
      return JSON.parse(cached);
    }

    throw error;
  }
}

export const api = {
  // Auth & Profiles
  login: (email, password) => fetchJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  register: (payload) => fetchJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getDemoProfiles: () => fetchJson('/auth/demo-profiles'),

  // Farmer & Farm Context
  getFarmerProfile: (userId = 1) => fetchJson(`/farmer/profile?userId=${userId}`),
  updateFarm: (farmId, payload) => fetchJson(`/farmer/farm/${farmId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  // Crop Recommendation & ROI
  recommendCrops: (criteria) => fetchJson('/crops/recommend', {
    method: 'POST',
    body: JSON.stringify(criteria)
  }),
  calculateRoi: (payload) => fetchJson('/roi/calculate', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Disease Detection
  diagnoseDisease: (payload) => fetchJson('/disease/diagnose', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getDiseaseHistory: (farmId = 1) => fetchJson(`/disease/history?farmId=${farmId}`),

  // Smart Mandi & Transport
  compareMandis: (crop = 'Tomato', quantity = 25, district = 'Nashik') =>
    fetchJson(`/mandi/compare?crop=${encodeURIComponent(crop)}&quantity=${quantity}&district=${encodeURIComponent(district)}`),
  getMandiPriceTrend: (crop = 'Tomato') =>
    fetchJson(`/mandi/trend?crop=${encodeURIComponent(crop)}`),
  getTransportPools: () => fetchJson('/mandi/pools'),
  joinTransportPool: (payload) => fetchJson('/mandi/join-pool', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Weather & Alerts
  getWeatherForecast: (district = 'Nashik') => fetchJson(`/weather/forecast?district=${encodeURIComponent(district)}`),
  getTodayWeatherStatus: (district = 'Nashik', crop = 'Tomato', stage = 'Flowering to Fruit Set') =>
    fetchJson(`/weather/today?district=${encodeURIComponent(district)}&crop=${encodeURIComponent(crop)}&stage=${encodeURIComponent(stage)}`),
  getActiveAlerts: (district = 'Nashik', crop = 'Tomato', stage = 'Flowering to Fruit Set') =>
    fetchJson(`/alerts/active?district=${encodeURIComponent(district)}&crop=${encodeURIComponent(crop)}&stage=${encodeURIComponent(stage)}`),

  // AI Voice Agronomist
  askAgronomist: (question, farmerId = 1, language = 'en') => fetchJson('/agronomist/ask', {
    method: 'POST',
    body: JSON.stringify({ question, farmerId, language })
  }),

  // Government Schemes
  getGovernmentSchemes: (crop = 'All', landCategory = '', state = 'Maharashtra') =>
    fetchJson(`/schemes?crop=${encodeURIComponent(crop)}&landCategory=${encodeURIComponent(landCategory)}&state=${encodeURIComponent(state)}`)
};
