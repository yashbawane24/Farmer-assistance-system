import { AuthService, FarmerService } from '../services/authAndFarmerService.js';
import { CropAdvisorService, RoiCalculatorService } from '../services/cropAndRoiService.js';
import { DiseaseDetectionService } from '../services/diseaseDetectionService.js';
import { SmartMandiService, LogisticsService } from '../services/mandiAndLogisticsService.js';
import { WeatherService, AlertRuleEngine } from '../services/weatherAndAlertService.js';
import { AgronomistRagService, GovernmentSchemeService } from '../services/agronomistAndSchemeService.js';
import { syncMandiPrices } from '../services/agmarknetService.js';
import { REGION_STATE, MAHARASHTRA_DISTRICTS, REGION_CROPS, MSP_YEAR_LABEL } from '../config/maharashtra.js';
import { generate, transcribeAudio, isGeminiConfigured, splitDataUrl, LANGUAGE_NAMES } from '../services/geminiService.js';

export const AuthController = {
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_CREDENTIALS',
                        message: 'Email/phone and password are required'
                    }
                });
            }
            const result = await AuthService.login(email, password);
            res.json({ success: true, data: result });
        } catch (err) {
            res.status(err.status || 401).json({
                success: false,
                error: {
                    code: err.code || 'AUTH_ERROR',
                    message: err.message || 'Invalid email or password'
                }
            });
        }
    },

    async register(req, res, next) {
        try {
            const result = await AuthService.register(req.body);
            res.status(201).json({ success: true, data: result });
        } catch (err) {
            res.status(err.status || 400).json({
                success: false,
                error: {
                    code: err.code || 'REGISTRATION_ERROR',
                    message: err.message || 'Registration failed'
                }
            });
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
            const { soilType = 'Black Soil (Regur)', waterReliability = 'Moderately Reliable', season = 'Kharif', budgetPerAcre = 50000, landSize = 2.0, district } = req.body;
            const recommendations = await CropAdvisorService.recommendCrops({
                soilType,
                waterReliability,
                season,
                budgetPerAcre: Number(budgetPerAcre),
                landSize: Number(landSize),
                district
            });
            res.json({ success: true, data: recommendations });
        } catch (err) {
            next(err);
        }
    },

    async calculateRoi(req, res, next) {
        try {
            const { cropId = 1, landSizeAcres = 2.0, soilType = 'Black Soil (Regur)', waterReliability = 'Moderately Reliable', budgetPerAcre = 50000, customYieldQuintal, customExpectedPrice, district } = req.body;
            const analysis = await RoiCalculatorService.calculateCropRoi({
                cropId: Number(cropId),
                landSizeAcres: Number(landSizeAcres),
                soilType,
                waterReliability,
                budgetPerAcre: Number(budgetPerAcre) || 50000,
                customYieldQuintal,
                customExpectedPrice,
                district
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
            const { cropName, imageBase64, farmId, language } = req.body;
            const result = await DiseaseDetectionService.diagnoseImage({
                cropName,
                imageBase64,
                farmId: farmId ? Number(farmId) : 1,
                language: language || 'en'
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
            const { crop = 'Tomato', days = 30 } = req.query;
            const trend = await SmartMandiService.getPriceTrend(crop, Math.min(Number(days) || 30, 180));
            res.json({ success: true, data: trend });
        } catch (err) {
            next(err);
        }
    },

    getStatus(req, res) {
        res.json({ success: true, data: SmartMandiService.getStatus() });
    },

    async sync(req, res, next) {
        try {
            const rows = await syncMandiPrices();
            res.json({ success: true, data: { rowsSaved: rows, status: SmartMandiService.getStatus() } });
        } catch (err) {
            err.status = err.status || 502;
            next(err);
        }
    },

    async getPools(req, res, next) {
        try {
            const pools = await LogisticsService.getAvailablePools(req.query);
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

export const PoolsController = {
    async list(req, res, next) {
        try {
            const { crop, district, mandi, quantity, userId } = req.query;
            const pools = await LogisticsService.getAvailablePools({
                crop,
                district,
                mandi,
                quantity: quantity ? Number(quantity) : 25,
                userId: userId ? Number(userId) : null
            });
            res.json({ success: true, data: pools });
        } catch (err) {
            next(err);
        }
    },

    async mine(req, res, next) {
        try {
            const userId = req.query.userId || req.user?.id;
            if (!userId) {
                return res.json({ success: true, data: [] });
            }
            const pools = await LogisticsService.getUserPools(Number(userId));
            res.json({ success: true, data: pools });
        } catch (err) {
            next(err);
        }
    },

    async create(req, res, next) {
        try {
            const pool = await LogisticsService.createPool(req.body);
            res.status(201).json({ success: true, data: pool });
        } catch (err) {
            if (err.message?.includes('required') || err.message?.includes('cannot be in the past') || err.message?.includes('exceeds')) {
                return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: err.message } });
            }
            next(err);
        }
    },

    async join(req, res, next) {
        try {
            const poolId = Number(req.params.id);
            const { userId, quantity, farmerName, phone } = req.body;
            const result = await LogisticsService.joinPool({
                poolId,
                userId: userId ? Number(userId) : 1,
                quantity: Number(quantity) || 25,
                farmerName,
                phone
            });
            res.json({ success: true, data: result });
        } catch (err) {
            if (err.code === 'EXCEEDS_CAPACITY') {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'EXCEEDS_CAPACITY',
                        message: err.message,
                        availableCapacity: err.availableCapacity
                    }
                });
            }
            if (err.message?.includes('not found') || err.message?.includes('departed')) {
                return res.status(400).json({ success: false, error: { code: 'INVALID_POOL', message: err.message } });
            }
            next(err);
        }
    },

    async leave(req, res, next) {
        try {
            const poolId = Number(req.params.id);
            const userId = Number(req.params.userId);
            const result = await LogisticsService.leavePool({ poolId, userId });
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
            const { question, farmerId = 1, language = 'en', history = [] } = req.body;
            if (!question || question.trim().length === 0) {
                return res.status(400).json({ success: false, error: { message: 'Question cannot be empty' } });
            }
            const advice = await AgronomistRagService.consult({ question, farmerId: Number(farmerId), language, history });
            res.json({ success: true, data: advice });
        } catch (err) {
            next(err);
        }
    },

    async voiceAsk(req, res, next) {
        try {
            const { audioBase64, mimeType = 'audio/webm', farmerId = 1, language = 'en', history = [] } = req.body;
            if (!audioBase64) {
                return res.status(400).json({ success: false, error: { message: 'Audio data is required' } });
            }

            const transcript = await transcribeAudio({ audioBase64, mimeType, language });
            if (!transcript || transcript.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'NO_SPEECH',
                        message: 'Could not clearly recognize speech. Please try speaking again.'
                    }
                });
            }

            const answer = await AgronomistRagService.consult({
                question: transcript,
                farmerId: Number(farmerId),
                language,
                history
            });

            res.json({
                success: true,
                data: {
                    transcript,
                    answer
                }
            });
        } catch (err) {
            next(err);
        }
    },

    async warmup(req, res, next) {
        try {
            const { farmerId = 1, district = 'Nashik', crop = 'Tomato' } = req.query;
            const result = await AgronomistRagService.warmup({
                farmerId: Number(farmerId),
                district,
                crop
            });
            res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    },

    async consultStream(req, res, next) {
        try {
            const { question, audioBase64, audioMimeType = 'audio/webm', farmerId = 1, language = 'en', history = [] } = req.body;
            if (!question && !audioBase64) {
                return res.status(400).json({ success: false, error: { message: 'Question or audio is required' } });
            }

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders?.();

            const abortController = new AbortController();
            req.on('close', () => {
                abortController.abort();
            });

            let fullTextAccumulator = '';
            let transcriptEmitted = false;

            const sendEvent = (event, data) => {
                if (res.writableEnded) return;
                res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
            };

            const advice = await AgronomistRagService.consultStream({
                question,
                audioBase64,
                audioMimeType,
                farmerId: Number(farmerId),
                language,
                history,
                signal: abortController.signal,
                onChunk: (chunk) => {
                    fullTextAccumulator += chunk;
                    if (audioBase64 && !transcriptEmitted && fullTextAccumulator.includes('\n')) {
                        const m = /^TRANSCRIPT:\s*(.+)$/m.exec(fullTextAccumulator);
                        if (m) {
                            transcriptEmitted = true;
                            sendEvent('transcript', { text: m[1].trim() });
                        }
                    }
                    sendEvent('chunk', { text: chunk });
                }
            });

            sendEvent('done', { result: advice });
            res.end();
        } catch (err) {
            if (!res.headersSent) {
                next(err);
            } else {
                res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
                res.end();
            }
        }
    },

    async transcribe(req, res, next) {
        try {
            const { audioBase64, mimeType = 'audio/webm', language = 'mr' } = req.body;
            if (!audioBase64) {
                return res.status(400).json({ success: false, error: { message: 'Audio data is required' } });
            }

            const text = await transcribeAudio({ audioBase64, mimeType, language });
            res.json({ success: true, data: { text: (text || '').trim() } });
        } catch (err) {
            next(err);
        }
    }
};

export const RegionController = {
    getConfig(req, res) {
        res.json({
            success: true,
            data: {
                state: REGION_STATE,
                districts: MAHARASHTRA_DISTRICTS.map(({ name, region, mr, hi }) => ({ name, region, mr, hi })),
                crops: REGION_CROPS.map(({ name, msp }) => ({ name, msp: msp ?? null })),
                mspYear: MSP_YEAR_LABEL
            }
        });
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
