import { AuthService, FarmerService } from '../services/authAndFarmerService.js';
import { normalizeLang } from '../config/serverI18n.js';
import { CropAdvisorService, RoiCalculatorService } from '../services/cropAndRoiService.js';
import { DiseaseDetectionService } from '../services/diseaseDetectionService.js';
import { queryOne } from '../models/db.js';
import { findRegionCrop } from '../config/maharashtra.js';
import { SmartMandiService, LogisticsService } from '../services/mandiAndLogisticsService.js';
import { WeatherService, AlertRuleEngine } from '../services/weatherAndAlertService.js';
import { AgronomistRagService, GovernmentSchemeService } from '../services/agronomistAndSchemeService.js';
import { syncMandiPrices } from '../services/agmarknetService.js';
import { REGION_STATE, MAHARASHTRA_DISTRICTS, REGION_CROPS, MSP_YEAR_LABEL, findDistrict } from '../config/maharashtra.js';
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
            const context = await FarmerService.getFarmerContext(req.user.id);
            res.json({ success: true, data: context });
        } catch (err) {
            next(err);
        }
    },

    async updateFarm(req, res, next) {
        try {
            // Always edits the signed-in farmer's own farm (the id in the URL is ignored)
            const own = await FarmerService.getFarmerContext(req.user.id);
            if (!own?.farm) {
                return res.status(404).json({ success: false, error: { code: 'NO_FARM', message: 'No farm found for this account.' } });
            }
            const updated = await FarmerService.updateFarm(own.farm.id, req.body);
            if (req.body.district && findDistrict(req.body.district)) {
                await FarmerService.updateProfileLocation(req.user.id, { district: findDistrict(req.body.district).name, fullName: req.body.full_name });
            } else if (req.body.full_name) {
                await FarmerService.updateProfileLocation(req.user.id, { fullName: req.body.full_name });
            }
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
            const { cropName, imageBase64, language } = req.body;
            const own = await FarmerService.getFarmerContext(req.user.id);
            const result = await DiseaseDetectionService.diagnoseImage({
                cropName,
                imageBase64,
                farmId: own?.farm?.id ?? null,
                language: language || 'en'
            });
            res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    },

    async getHistory(req, res, next) {
        try {
            const own = await FarmerService.getFarmerContext(req.user.id);
            const history = own?.farm ? await DiseaseDetectionService.getRecentScans(own.farm.id) : [];
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
                userDistrict: district,
                lang: normalizeLang(req.query.lang)
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
            const result = await LogisticsService.joinPool({ ...req.body, userId: req.user.id });
            res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }
};

export const PoolsController = {
    async list(req, res, next) {
        try {
            const { crop, district, mandi, quantity } = req.query;
            const pools = await LogisticsService.getAvailablePools({
                crop,
                district,
                mandi,
                quantity: quantity ? Number(quantity) : 25,
                userId: req.user?.id ?? null
            });
            res.json({ success: true, data: pools });
        } catch (err) {
            next(err);
        }
    },

    async mine(req, res, next) {
        try {
            const pools = await LogisticsService.getUserPools(req.user.id);
            res.json({ success: true, data: pools });
        } catch (err) {
            next(err);
        }
    },

    async create(req, res, next) {
        try {
            const pool = await LogisticsService.createPool({ ...req.body, userId: req.user.id });
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
            const { quantity, farmerName, phone } = req.body;
            const result = await LogisticsService.joinPool({
                poolId,
                userId: req.user.id,
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
            // A farmer can only remove themselves from a pool
            if (Number(req.params.userId) !== req.user.id) {
                return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only leave pools you joined.' } });
            }
            const result = await LogisticsService.leavePool({ poolId, userId: req.user.id });
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
            const forecast = await WeatherService.getWeatherForecast(district, normalizeLang(req.query.lang));
            res.json({ success: true, data: forecast });
        } catch (err) {
            next(err);
        }
    },

    // Browser-supplied Open-Meteo data when the server's own request is blocked
    shareLiveData(req, res) {
        const { district, data } = req.body || {};
        const ok = WeatherService.acceptBrowserData(String(district || ''), data);
        res.status(ok ? 200 : 400).json(ok
            ? { success: true, data: { cached: true } }
            : { success: false, error: { code: 'INVALID_WEATHER_DATA', message: 'Not a valid Open-Meteo response for this district.' } });
    },

    async getTodayStatus(req, res, next) {
        try {
            const { district = 'Nashik', crop = 'Tomato', stage = 'Flowering to Fruit Set' } = req.query;
            const status = await WeatherService.getTodayAgroWeather(district, crop, stage, normalizeLang(req.query.lang));
            res.json({ success: true, data: status });
        } catch (err) {
            next(err);
        }
    },

    async getAlerts(req, res, next) {
        try {
            const { district = 'Nashik', crop = 'Tomato', stage = 'Flowering to Fruit Set' } = req.query;
            const alerts = await AlertRuleEngine.getActiveAlerts(district, crop, stage, normalizeLang(req.query.lang));
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
            const advice = await AgronomistRagService.consult({ question, farmerId: req.user.id, language, history });
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
                farmerId: req.user.id,
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
                farmerId: req.user.id,
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
                farmerId: req.user.id,
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
            const schemes = await GovernmentSchemeService.getSchemes({ cropName: crop, landCategory, state, lang: normalizeLang(req.query.lang) });
            res.json({ success: true, data: schemes });
        } catch (err) {
            next(err);
        }
    }
};

// Dashboard: the farmer's real numbers in one request. Each part is optional, so one failing
// source (e.g. no mandi report for this crop) does not hide the others.
export const DashboardController = {
    async summary(req, res, next) {
        try {
            const {
                district = 'Nashik', crop = 'Tomato', acres = 2,
                soil = 'Black Soil (Regur)', water = 'Moderately Reliable'
            } = req.query;
            const lang = normalizeLang(req.query.lang);
            const landSizeAcres = Math.min(Math.max(Number(acres) || 2, 0.1), 500);

            // Match the farm crop to the crops table ("Chilli" -> "Green Chilli", "Rice" -> "Rice (Paddy)")
            const regionCrop = findRegionCrop(crop);
            const cropRow = await queryOne(
                "SELECT * FROM crops WHERE LOWER(name) = LOWER(?) OR LOWER(name) = LOWER(?) OR LOWER(name) LIKE LOWER(?) LIMIT 1",
                [crop, regionCrop?.name || crop, `%${String(crop).split(' ')[0]}%`]
            );

            const [mandiRes, trendRes, roiRes] = await Promise.allSettled([
                SmartMandiService.compareMandis({ cropName: crop, produceQuantityQuintal: 10, userDistrict: district, lang }),
                SmartMandiService.getPriceTrend(crop, 30),
                cropRow
                    ? RoiCalculatorService.calculateCropRoi({ cropId: cropRow.id, landSizeAcres, soilType: soil, waterReliability: water, district })
                    : Promise.reject(new Error('No cost data for this crop'))
            ]);

            const mandi = mandiRes.status === 'fulfilled' ? mandiRes.value : null;
            const roi = roiRes.status === 'fulfilled' ? roiRes.value : null;

            res.json({
                success: true,
                data: {
                    crop: { name: cropRow?.name || regionCrop?.name || crop, msp: regionCrop?.msp ?? null, durationDays: roi?.crop?.durationDays ?? cropRow?.duration_days ?? null },
                    mandi: mandi ? {
                        nearest: [...mandi.mandis].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 3),
                        best: mandi.mandis[0] || null,
                        totalMandisReporting: mandi.totalMandisReporting,
                        latestArrivalDate: mandi.latestArrivalDate,
                        daysSinceLatest: mandi.dataSource?.daysSinceLatest ?? null,
                        isSnapshot: mandi.dataSource?.isSnapshot ?? false,
                        msp: mandi.crop?.msp ?? null
                    } : null,
                    trend: trendRes.status === 'fulfilled' ? trendRes.value : [],
                    income: roi ? {
                        landSizeAcres,
                        yieldPerAcre: roi.parameters.yieldPerAcreQuintal,
                        totalYieldQuintal: roi.parameters.totalProjectedYieldQuintal,
                        pricePerQuintal: roi.parameters.assumedPricePerQuintal,
                        priceSource: roi.parameters.priceSource,
                        priceMarkets: roi.parameters.priceMarkets,
                        priceAsOf: roi.parameters.priceAsOf,
                        priceScope: roi.parameters.priceScope,
                        totalCost: roi.financialProjections.totalEstimatedInvestment,
                        grossIncome: roi.financialProjections.projectedGrossRevenue,
                        netProfit: roi.financialProjections.projectedNetProfit,
                        breakEvenPrice: roi.financialProjections.breakEvenPricePerQuintal,
                        costSource: roi.crop.source || null,
                        costYear: roi.crop.year || null
                    } : null
                }
            });
        } catch (err) {
            next(err);
        }
    }
};
