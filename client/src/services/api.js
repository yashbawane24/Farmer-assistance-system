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

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      const err = new Error(
        response.status >= 500
          ? 'Backend server error. Please ensure the backend is running.'
          : `Server returned non-JSON response (${response.status})`
      );
      err.status = response.status;
      throw err;
    }

    if (!response.ok || !data.success) {
      const err = new Error(data.error?.message || `HTTP Error ${response.status}`);
      err.status = response.status; // server answered: not an offline/network problem
      err.code = data.error?.code;
      throw err;
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

    // Attempt to serve cached data if available (GET requests only)
    const isGet = !options.method || options.method === 'GET';
    const cached = isGet ? localStorage.getItem(`sfas_cache_${endpoint}`) : null;
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
  getMandiStatus: () => fetchJson('/mandi/status'),
  getTransportPools: () => fetchJson('/mandi/pools'),
  joinTransportPool: (payload) => fetchJson('/mandi/join-pool', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Transport Pools
  getPools: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.crop) qs.set('crop', params.crop);
    if (params.district) qs.set('district', params.district);
    if (params.mandi) qs.set('mandi', params.mandi);
    if (params.quantity) qs.set('quantity', params.quantity);
    if (params.userId) qs.set('userId', params.userId);
    return fetchJson(`/pools?${qs.toString()}`);
  },
  getMyPools: (userId) => fetchJson(`/pools/mine?userId=${userId}`),
  createPool: (payload) => fetchJson('/pools', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  joinPool: (poolId, payload) => fetchJson(`/pools/${poolId}/join`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  leavePool: (poolId, userId) => fetchJson(`/pools/${poolId}/members/${userId}`, {
    method: 'DELETE'
  }),

  // Weather & Alerts
  getWeatherForecast: (district = 'Nashik') => fetchJson(`/weather/forecast?district=${encodeURIComponent(district)}`),
  getTodayWeatherStatus: (district = 'Nashik', crop = 'Tomato', stage = 'Flowering to Fruit Set') =>
    fetchJson(`/weather/today?district=${encodeURIComponent(district)}&crop=${encodeURIComponent(crop)}&stage=${encodeURIComponent(stage)}`),
  getActiveAlerts: (district = 'Nashik', crop = 'Tomato', stage = 'Flowering to Fruit Set') =>
    fetchJson(`/alerts/active?district=${encodeURIComponent(district)}&crop=${encodeURIComponent(crop)}&stage=${encodeURIComponent(stage)}`),

  // AI Voice Agronomist
  askAgronomist: (question, farmerId = 1, language = 'en', history = []) => fetchJson('/agronomist/ask', {
    method: 'POST',
    body: JSON.stringify({ question, farmerId, language, history })
  }),
  streamAgronomist: async ({
    question,
    audioBase64,
    audioMimeType = 'audio/webm',
    farmerId = 1,
    language = 'en',
    history = [],
    onTranscript,
    onChunk,
    onDone,
    onError,
    signal
  }) => {
    const url = `${BASE_URL}/agronomist/ask-stream`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          audioBase64,
          audioMimeType,
          farmerId,
          language,
          history
        }),
        signal
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        let errJson = {};
        try { errJson = JSON.parse(errText); } catch {}
        throw new Error(errJson.error?.message || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        let currentEvent = 'message';
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('event: ')) {
            currentEvent = trimmed.slice(7).trim();
          } else if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const data = JSON.parse(dataStr);
              if (currentEvent === 'chunk' && onChunk) {
                onChunk(data.text);
              } else if (currentEvent === 'transcript' && onTranscript) {
                onTranscript(data.text);
              } else if (currentEvent === 'done' && onDone) {
                onDone(data.result);
              } else if (currentEvent === 'error') {
                throw new Error(data.message || 'Stream error');
              }
            } catch (jsonErr) {}
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (onError) onError(err);
      else throw err;
    }
  },
  transcribeAudio: (payload) => fetchJson('/agronomist/transcribe', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Government Schemes
  getGovernmentSchemes: (crop = 'All', landCategory = '', state = 'Maharashtra') =>
    fetchJson(`/schemes?crop=${encodeURIComponent(crop)}&landCategory=${encodeURIComponent(landCategory)}&state=${encodeURIComponent(state)}`)
};
