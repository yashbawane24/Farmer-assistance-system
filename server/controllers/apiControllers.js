import { AuthService, FarmerService } from '../services/authAndFarmerService.js';
import { CropAdvisorService, RoiCalculatorService } from '../services/cropAndRoiService.js';
import { DiseaseDetectionService } from '../services/diseaseDetectionService.js';
import { SmartMandiService, LogisticsService } from '../services/mandiAndLogisticsService.js';
import { WeatherService, AlertRuleEngine } from '../services/weatherAndAlertService.js';
import { AgronomistRagService, GovernmentSchemeService } from '../services/agronomistAndSchemeService.js';

export const AuthController = {
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);
            res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    },

    async register(req, res, next) {
        try {
            const result = await AuthService.register(req.body);
            res.status(201).json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    },

    async getDemoProfiles(req, res, next) {
        try {
            const profiles = await AuthService.getDemoProfiles();
            res.json({ success: true, data: profiles });
        } catch (err) {
            next(err);
        }
    }
};

export const FarmerController = {
    async getProfile(req, res, next) {
        try {
            const userId = req.query.userId ? Number(req.query.userId) : 1;
            const context = await FarmerService.getFarmerContext(userId);
            res.json({ success: true, data: context });
        } catch (err) {
            next(err);
        }
    },

    async updateFarm(req, res, next) {
        try {
            const farmId = Number(req.params.farmId || 1);
            const updated = await FarmerService.updateFarm(farmId, req.body);
            res.json({ success: true, data: updated });
        } catch (err) {
            next(err);
        }
    }
};

export const CropController = {
    async recommend(req, res, next) {
        try {
            const { soilType = 'Black Soil (Regur)', waterReliability = 'Moderately Reliable', season = 'Kharif', budgetPerAcre = 50000, landSize = 2.0 } = req.body;
            const recommendations = await CropAdvisorService.recommendCrops({
                soilType,
                waterReliability,
                season,
                budgetPerAcre: Number(budgetPerAcre),
                landSize: Number(landSize)
            });
            res.json({ success: true, data: recommendations });
        } catch (err) {
            next(err);
        }
    },

    async calculateRoi(req, res, next) {
        try {
            const { cropId = 1, landSizeAcres = 2.0, soilType = 'Black Soil', waterReliability = 'Moderately Reliable', customYieldQuintal, customExpectedPrice } = req.body;
            const analysis = await RoiCalculatorService.calculateCropRoi({
                cropId: Number(cropId),
                landSizeAcres: Number(landSizeAcres),
                soilType,
                waterReliability,
                customYieldQuintal,
                customExpectedPrice
            });
            res.json({ success: true, data: analysis });
        } catch (err) {
            next(err);
        }
    }
};

export const DiseaseController = {
    async diagnose(req, res, next) {
        try {
            const { cropName, imageBase64, isOffline, farmId } = req.body;
            const result = await DiseaseDetectionService.diagnoseImage({
                cropName,
                imageBase64,
                isOffline: Boolean(isOffline),
                farmId: farmId ? Number(farmId) : 1
            });
            res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    },

    async getHistory(req, res, next) {
        try {
            const farmId = req.query.farmId ? Number(req.query.farmId) : 1;
            const history = await DiseaseDetectionService.getRecentScans(farmId);
            res.json({ success: true, data: history });
        } catch (err) {
            next(err);
        }
    }
};

export const MandiController = {
    async compare(req, res, next) {
        try {
            const { crop = 'Tomato', quantity = 25.0, district = 'Nashik' } = req.query;
            const comparison = await SmartMandiService.compareMandis({
                cropName: crop,
                produceQuantityQuintal: Number(quantity),
                userDistrict: district
            });
            res.json({ success: true, data: comparison });
        } catch (err) {
            next(err);
        }
    },

    async getPriceTrend(req, res, next) {
        try {
            const { crop = 'Tomato' } = req.query;
            const trend = await SmartMandiService.getPriceTrend(crop);
            res.json({ success: true, data: trend });
        } catch (err) {
            next(err);
        }
    },

    async getPools(req, res, next) {
        try {
            const pools = await LogisticsService.getActivePools();
            res.json({ success: true, data: pools });
        } catch (err) {
            next(err);
        }
    },

    async joinPool(req, res, next) {
        try {
            const result = await LogisticsService.joinPool(req.body);
            res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }
};

export const WeatherAlertController = {
    async getForecast(req, res, next) {
        try {
            const district = req.query.district || 'Nashik';
            const forecast = await WeatherService.getWeatherForecast(district);
            res.json({ success: true, data: forecast });
        } catch (err) {
            next(err);
        }
    },

    async getTodayStatus(req, res, next) {
        try {
            const { district = 'Nashik', crop = 'Tomato', stage = 'Flowering to Fruit Set' } = req.query;
            const status = await WeatherService.getTodayAgroWeather(district, crop, stage);
            res.json({ success: true, data: status });
        } catch (err) {
            next(err);
        }
    },

    async getAlerts(req, res, next) {
        try {
            const { district = 'Nashik', crop = 'Tomato', stage = 'Flowering to Fruit Set' } = req.query;
            const alerts = await AlertRuleEngine.getActiveAlerts(district, crop, stage);
            res.json({ success: true, data: alerts });
        } catch (err) {
            next(err);
        }
    }
};

export const AgronomistController = {
    async consult(req, res, next) {
        try {
            const { question, farmerId = 1, language = 'en' } = req.body;
            if (!question || question.trim().length === 0) {
                return res.status(400).json({ success: false, error: { message: 'Question cannot be empty' } });
            }
            const advice = await AgronomistRagService.consult({ question, farmerId: Number(farmerId), language });
            res.json({ success: true, data: advice });
        } catch (err) {
            next(err);
        }
    }
};

export const SchemeController = {
    async list(req, res, next) {
        try {
            const { crop, landCategory, state } = req.query;
            const schemes = await GovernmentSchemeService.getSchemes({ cropName: crop, landCategory, state });
            res.json({ success: true, data: schemes });
        } catch (err) {
            next(err);
        }
    }
};
