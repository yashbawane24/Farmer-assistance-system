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
    PoolsController,
    DashboardController
} from '../controllers/apiControllers.js';
import { attachUser, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Every request: read the signed session token if present (req.user)
router.use(attachUser);

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
router.get('/farmer/profile', requireAuth, FarmerController.getProfile);
router.put('/farmer/farm/:farmId', requireAuth, FarmerController.updateFarm);

// Crop Advisor & Dynamic ROI
router.post('/crops/recommend', CropController.recommend);
router.post('/roi/calculate', CropController.calculateRoi);

// Edge AI Disease Detection
router.post('/disease/diagnose', requireAuth, DiseaseController.diagnose);
router.get('/disease/history', requireAuth, DiseaseController.getHistory);

// Smart Mandi & Transport Pooling
router.get('/mandi/compare', MandiController.compare);
router.get('/mandi/trend', MandiController.getPriceTrend);
router.get('/mandi/status', MandiController.getStatus);
router.post('/mandi/sync', requireAuth, MandiController.sync);
router.get('/mandi/pools', MandiController.getPools);
router.post('/mandi/join-pool', requireAuth, MandiController.joinPool);

// Dedicated Transport Pooling API
router.get('/pools', PoolsController.list);
router.get('/pools/mine', requireAuth, PoolsController.mine);
router.post('/pools', requireAuth, PoolsController.create);
router.post('/pools/:id/join', requireAuth, PoolsController.join);
router.delete('/pools/:id/members/:userId', requireAuth, PoolsController.leave);

// Weather & Preventative Alerts
router.get('/weather/forecast', WeatherAlertController.getForecast);
router.get('/weather/today', WeatherAlertController.getTodayStatus);
router.post('/weather/live', express.json({ limit: '300kb' }), WeatherAlertController.shareLiveData);
router.get('/alerts/active', WeatherAlertController.getAlerts);

// AI Voice Agronomist (RAG)
router.get('/agronomist/warmup', requireAuth, AgronomistController.warmup);
router.post('/agronomist/ask', requireAuth, AgronomistController.consult);
router.post('/agronomist/voice-ask', requireAuth, AgronomistController.voiceAsk);
router.post('/agronomist/ask-stream', requireAuth, AgronomistController.consultStream);
router.post('/agronomist/transcribe', requireAuth, AgronomistController.transcribe);

// Dashboard summary (farm crop: mandi rate, income estimate, 30-day trend)
router.get('/dashboard/summary', DashboardController.summary);

// Government Schemes
router.get('/schemes', SchemeController.list);

export default router;
