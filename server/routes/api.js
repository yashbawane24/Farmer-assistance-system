import express from 'express';
import {
    AuthController,
    FarmerController,
    CropController,
    DiseaseController,
    MandiController,
    WeatherAlertController,
    AgronomistController,
    SchemeController,
    RegionController,
    PoolsController
} from '../controllers/apiControllers.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'UP',
        service: 'Smart Farmer Assistance System API',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Region served by SFAS (Maharashtra districts, crops, MSP)
router.get('/region', RegionController.getConfig);

// Authentication & Demo Profiles
router.post('/auth/login', AuthController.login);
router.post('/auth/register', AuthController.register);
router.get('/auth/demo-profiles', AuthController.getDemoProfiles);

// Farmer Profile & Farm Context
router.get('/farmer/profile', FarmerController.getProfile);
router.put('/farmer/farm/:farmId', FarmerController.updateFarm);

// Crop Advisor & Dynamic ROI
router.post('/crops/recommend', CropController.recommend);
router.post('/roi/calculate', CropController.calculateRoi);

// Edge AI Disease Detection
router.post('/disease/diagnose', DiseaseController.diagnose);
router.get('/disease/history', DiseaseController.getHistory);

// Smart Mandi & Transport Pooling
router.get('/mandi/compare', MandiController.compare);
router.get('/mandi/trend', MandiController.getPriceTrend);
router.get('/mandi/status', MandiController.getStatus);
router.post('/mandi/sync', MandiController.sync);
router.post('/mandi/ingest', MandiController.ingest);
router.get('/mandi/pools', MandiController.getPools);
router.post('/mandi/join-pool', MandiController.joinPool);

// Dedicated Transport Pooling API
router.get('/pools', PoolsController.list);
router.get('/pools/mine', PoolsController.mine);
router.post('/pools', PoolsController.create);
router.post('/pools/:id/join', PoolsController.join);
router.delete('/pools/:id/members/:userId', PoolsController.leave);

// Weather & Preventative Alerts
router.get('/weather/forecast', WeatherAlertController.getForecast);
router.get('/weather/today', WeatherAlertController.getTodayStatus);
router.get('/alerts/active', WeatherAlertController.getAlerts);

// AI Voice Agronomist (RAG)
router.get('/agronomist/warmup', AgronomistController.warmup);
router.post('/agronomist/ask', AgronomistController.consult);
router.post('/agronomist/voice-ask', AgronomistController.voiceAsk);
router.post('/agronomist/ask-stream', AgronomistController.consultStream);
router.post('/agronomist/transcribe', AgronomistController.transcribe);

// Government Schemes
router.get('/schemes', SchemeController.list);

export default router;
