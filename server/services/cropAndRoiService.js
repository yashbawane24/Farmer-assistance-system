import { query, queryOne } from '../models/db.js';
import { findRegionCrop } from '../config/maharashtra.js';
import { getAverageMarketPrice, getCropPriceHistory } from './agmarknetService.js';
import { WeatherService } from './weatherAndAlertService.js';
import {
    getCropEconomics,
    matchesSeason,
    checkSoilMatch,
    resolveBaseYield,
    normalizeSeason
} from '../config/cropEconomics.js';

/**
 * Resolves the market price for a crop following the authoritative priority:
 * 1. Live Agmarknet mandi average for the specific district (if reported in last 15 days)
 * 2. Live Agmarknet mandi average across all reporting Maharashtra APMCs
 * 3. Official Government MSP (CACP Kharif 2025-26 / Rabi 2026-27)
 * 4. Authoritative reference baseline price
 *
 * Always returns the price, source identifier, number of reporting APMCs, arrival date, and citation label.
 */
export async function resolveCropPrice(crop, district) {
    const live = await getAverageMarketPrice(crop.name, district);
    if (live && live.price > 0) {
        const isLocal = district && live.scope.toLowerCase() === String(district).toLowerCase();
        const apmcLabel = `${live.markets} ${isLocal ? district : 'Maharashtra'} APMC${live.markets > 1 ? 's' : ''}`;
        return {
            price: live.price,
            source: 'live',
            markets: live.markets,
            asOf: live.asOf,
            scope: live.scope,
            label: `Agmarknet (Govt. of India), average of ${apmcLabel} (${live.asOf})`
        };
    }

    const regionCrop = findRegionCrop(crop.name);
    const msp = regionCrop?.msp;
    if (msp) {
        return {
            price: msp,
            source: 'msp',
            label: 'Government MSP (CACP Kharif 2025-26 / Rabi 2026-27)',
            year: '2025-26',
            asOf: '2025-26 Season'
        };
    }

    const historical = crop.historical_avg_price_quintal || 2500;
    return {
        price: historical,
        source: 'historical',
        label: 'Reference baseline price (no recent mandi report)',
        year: '2024-25'
    };
}

/**
 * Computes market price volatility risk using the coefficient of variation (CV = stdDev / mean)
 * of the daily Maharashtra average modal price over the last 30-90 days from live_mandi_prices.
 * - < 10%: Low Risk
 * - 10% - 25%: Medium Risk
 * - > 25%: High Risk
 * - Fewer than 7 days of data: 'Not enough price history yet'
 * Also compares current price to MSP where MSP exists.
 */
export async function computeMarketRisk(cropName, currentPrice) {
    const history = await getCropPriceHistory(cropName, { days: 90 });
    const regionCrop = findRegionCrop(cropName);
    const msp = regionCrop?.msp;

    let mspComparison = null;
    if (msp && currentPrice) {
        const diff = currentPrice - msp;
        const diffPct = Math.round((diff / msp) * 100);
        mspComparison = {
            msp,
            diff,
            diffPct,
            note: currentPrice >= msp
                ? `₹${currentPrice.toLocaleString('en-IN')}/q is ${diffPct >= 0 ? '+' : ''}${diffPct}% above MSP (₹${msp.toLocaleString('en-IN')}/q)`
                : `₹${currentPrice.toLocaleString('en-IN')}/q is ${Math.abs(diffPct)}% below MSP (₹${msp.toLocaleString('en-IN')}/q)`
        };
    }

    if (!history || history.length < 7) {
        return {
            level: 'Unknown',
            label: 'Not enough price history yet',
            reason: 'Not enough price history yet (requires at least 7 days of reported daily APMC arrivals)',
            daysCount: history ? history.length : 0,
            cvPercent: null,
            mean: null,
            stdDev: null,
            mspComparison,
            history: history || []
        };
    }

    const prices = history.map(h => Number(h.modal_price)).filter(p => Number.isFinite(p) && p > 0);
    const n = prices.length;
    const mean = prices.reduce((a, b) => a + b, 0) / n;
    const variance = prices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / (n - 1 || 1);
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0;
    const cvPercent = Math.round(cv * 100);

    let level = 'Medium';
    let label = `Medium Risk (CV ${cvPercent}%)`;
    let reason = `Price varied ${cvPercent}% over the last ${n} reporting days (std dev ₹${Math.round(stdDev)}/q on mean ₹${Math.round(mean)}/q)`;

    if (cv < 0.10) {
        level = 'Low';
        label = `Low Risk (CV ${cvPercent}%)`;
        reason = `Price varied only ${cvPercent}% over the last ${n} reporting days (stable market)`;
    } else if (cv > 0.25) {
        level = 'High';
        label = `High Risk (CV ${cvPercent}%)`;
        reason = `High price swings: varied ${cvPercent}% over the last ${n} reporting days (std dev ₹${Math.round(stdDev)}/q)`;
    }

    return {
        level,
        label,
        reason,
        cvPercent,
        mean: Math.round(mean),
        stdDev: Math.round(stdDev),
        daysCount: n,
        mspComparison,
        history
    };
}

/**
 * Computes water risk by comparing crop water need (mm) with farmer's water reliability
 * and the next 7-day rainfall forecast from Open-Meteo for the farmer's district.
 */
export async function computeWaterRisk(waterNeedMm, waterReliability, district) {
    let rain7DayMm = 0;
    try {
        const liveWeather = await WeatherService.fetchLiveMeteorology(district);
        const dailyPrecip = liveWeather?.daily?.precipitation_sum;
        if (Array.isArray(dailyPrecip) && dailyPrecip.length > 0) {
            rain7DayMm = Math.round(dailyPrecip.slice(0, 7).reduce((a, b) => a + (Number(b) || 0), 0) * 10) / 10;
        }
    } catch {
        rain7DayMm = 0;
    }

    const wr = String(waterReliability).toLowerCase();
    const isRainfed = wr.includes('rain') || wr.includes('mostly');
    const isVeryReliable = wr.includes('very') || wr.includes('canal') || wr.includes('assured');

    let level = 'Low';
    let reason = '';

    if (waterNeedMm > 600) {
        if (isRainfed) {
            level = 'High';
            reason = `High crop water requirement (${waterNeedMm}mm) on rain-fed land. Next 7 days forecast: ${rain7DayMm}mm rain. Severe moisture stress risk.`;
        } else if (isVeryReliable) {
            level = 'Low';
            reason = `Assured water source adequately covers high crop demand (${waterNeedMm}mm). Next 7-day rain: ${rain7DayMm}mm.`;
        } else {
            level = 'Medium';
            reason = `Crop requires ${waterNeedMm}mm. Moderate water availability needs scheduled irrigation (next 7 days: ${rain7DayMm}mm rain).`;
        }
    } else if (waterNeedMm >= 400) {
        if (isRainfed) {
            if (rain7DayMm < 15) {
                level = 'Medium';
                reason = `Rain-fed plot with ${rain7DayMm}mm 7-day rain against ${waterNeedMm}mm crop need. Supplemental watering needed during dry spells.`;
            } else {
                level = 'Low';
                reason = `Favorable rainfall forecast (${rain7DayMm}mm in next 7 days) supports moderate water requirement (${waterNeedMm}mm).`;
            }
        } else {
            level = 'Low';
            reason = `Water availability reliably covers crop cycle requirement (${waterNeedMm}mm, 7-day rain: ${rain7DayMm}mm).`;
        }
    } else {
        if (rain7DayMm > 75) {
            level = 'Medium';
            reason = `Heavy rain forecast (${rain7DayMm}mm in next 7 days) creates temporary waterlogging risk for low-water crop (${waterNeedMm}mm need).`;
        } else {
            level = 'Low';
            reason = `Low water requirement (${waterNeedMm}mm) easily met under current conditions (next 7-day rain: ${rain7DayMm}mm).`;
        }
    }

    return {
        level,
        reason,
        rain7DayMm,
        waterNeedMm
    };
}

/**
 * Computes cost risk: total investment per acre vs farmer budget.
 * Over budget = High, 80-100% of budget = Medium, < 80% = Low.
 */
export function computeCostRisk(costPerAcre, budgetPerAcre) {
    if (costPerAcre > budgetPerAcre) {
        const excess = costPerAcre - budgetPerAcre;
        return {
            level: 'High',
            reason: `Required investment (₹${costPerAcre.toLocaleString('en-IN')}/acre) exceeds your budget (₹${budgetPerAcre.toLocaleString('en-IN')}/acre) by ₹${excess.toLocaleString('en-IN')}/acre.`
        };
    }
    if (costPerAcre >= 0.80 * budgetPerAcre) {
        return {
            level: 'Medium',
            reason: `Investment (₹${costPerAcre.toLocaleString('en-IN')}/acre) consumes ${Math.round((costPerAcre / budgetPerAcre) * 100)}% of your available capital budget.`
        };
    }
    return {
        level: 'Low',
        reason: `Investment (₹${costPerAcre.toLocaleString('en-IN')}/acre) is comfortably within your budget (₹${budgetPerAcre.toLocaleString('en-IN')}/acre).`
    };
}

/**
 * Overall risk = highest of market, water, and cost risks.
 */
export function computeOverallRisk(marketRisk, waterRisk, costRisk) {
    const levels = [marketRisk.level, waterRisk.level, costRisk.level];
    if (levels.includes('High')) return 'High';
    if (levels.includes('Medium')) return 'Medium';
    return 'Low';
}

/**
 * Computes the transparent suitability score (0 - 100 points):
 * - Season match: Required prerequisite (otherwise excluded)
 * - Soil match: 0 - 40 points
 * - Water fit: 0 - 30 points
 * - Budget fit: 0 - 30 points
 */
export function computeSuitabilityScore({ isIdealSoil, soilType, waterNeedMm, waterReliability, costPerAcre, budgetPerAcre }) {
    const soilPoints = isIdealSoil ? 40 : 25;
    const soilReason = isIdealSoil
        ? `Optimal soil match: 40/40 pts (${soilType})`
        : `Tolerable soil: 25/40 pts (0.85x factor applied for ${soilType})`;

    const wr = String(waterReliability).toLowerCase();
    const isRainfed = wr.includes('rain') || wr.includes('mostly');
    const isVeryReliable = wr.includes('very') || wr.includes('canal') || wr.includes('assured');

    let waterPoints = 25;
    let waterReason = '';
    if (isVeryReliable) {
        waterPoints = 30;
        waterReason = `Assured water supply: 30/30 pts for ${waterNeedMm}mm crop`;
    } else if (isRainfed) {
        if (waterNeedMm <= 350) {
            waterPoints = 30;
            waterReason = `Drought-tolerant crop (${waterNeedMm}mm): 30/30 pts for rain-fed farm`;
        } else if (waterNeedMm <= 500) {
            waterPoints = 18;
            waterReason = `Moderate water need (${waterNeedMm}mm): 18/30 pts under rain-fed cultivation`;
        } else {
            waterPoints = 8;
            waterReason = `High water demand (${waterNeedMm}mm): 8/30 pts on rain-fed farm`;
        }
    } else {
        if (waterNeedMm <= 550) {
            waterPoints = 30;
            waterReason = `Moderate water availability matches ${waterNeedMm}mm need: 30/30 pts`;
        } else {
            waterPoints = 20;
            waterReason = `Crop requires ${waterNeedMm}mm: 20/30 pts with moderate reliability`;
        }
    }

    let budgetPoints = 30;
    let budgetReason = '';
    if (costPerAcre <= budgetPerAcre) {
        budgetPoints = 30;
        budgetReason = `Within working budget: 30/30 pts (₹${costPerAcre.toLocaleString('en-IN')} ≤ ₹${budgetPerAcre.toLocaleString('en-IN')}/acre)`;
    } else {
        budgetPoints = Math.max(5, Math.round(30 * (budgetPerAcre / costPerAcre)));
        budgetReason = `Exceeds budget: ${budgetPoints}/30 pts (requires ₹${(costPerAcre - budgetPerAcre).toLocaleString('en-IN')}/acre credit)`;
    }

    const total = soilPoints + waterPoints + budgetPoints;

    return {
        total,
        breakdown: {
            soil: { points: soilPoints, max: 40, reason: soilReason },
            water: { points: waterPoints, max: 30, reason: waterReason },
            budget: { points: budgetPoints, max: 30, reason: budgetReason }
        }
    };
}

/**
 * Computes 3-scenario table: bad (low yield, low price), expected, and good outcome.
 * Uses 30-day min/avg/max live prices if available, else +/- 15%.
 */
export function computeScenarios({
    lowYieldPerAcre,
    typicalYieldPerAcre,
    highYieldPerAcre,
    soilFactor,
    landSizeAcres,
    totalInvestment,
    expectedPrice,
    priceHistory = []
}) {
    const validHistory = priceHistory.filter(h => h && (Number(h.min_price) > 0 || Number(h.modal_price) > 0));
    let minPrice, maxPrice, priceMethod;

    if (validHistory.length >= 3) {
        const allMins = validHistory.map(h => Number(h.min_price || h.modal_price)).filter(p => p > 0);
        const allMaxs = validHistory.map(h => Number(h.max_price || h.modal_price)).filter(p => p > 0);
        minPrice = Math.min(...allMins);
        maxPrice = Math.max(...allMaxs);
        priceMethod = `30-day live mandi price spread (${validHistory.length} reporting days)`;
    } else {
        minPrice = Math.round(expectedPrice * 0.85);
        maxPrice = Math.round(expectedPrice * 1.15);
        priceMethod = '±15% reference spread (insufficient live history)';
    }

    const buildCase = (yieldPerAcre, price, label, priceLabel) => {
        const adjustedYieldPerAcre = Math.round(yieldPerAcre * soilFactor * 10) / 10;
        const totalYield = Math.round(adjustedYieldPerAcre * landSizeAcres * 10) / 10;
        const revenue = Math.round(totalYield * price);
        const profit = revenue - totalInvestment;
        const roi = totalInvestment > 0 ? Math.round((profit / totalInvestment) * 100) : 0;
        return {
            label,
            priceLabel,
            yieldPerAcre: adjustedYieldPerAcre,
            totalYieldQuintal: totalYield,
            pricePerQuintal: price,
            projectedRevenue: revenue,
            projectedProfit: profit,
            projectedRoiPercent: roi
        };
    };

    return {
        priceMethod,
        bad: buildCase(lowYieldPerAcre, minPrice, 'Bad Outcome', 'Low Yield & Low Price'),
        expected: buildCase(typicalYieldPerAcre, expectedPrice, 'Expected Outcome', 'Typical Yield & Current Price'),
        good: buildCase(highYieldPerAcre, maxPrice, 'Good Outcome', 'High Yield & High Price')
    };
}

export class CropAdvisorService {
    /**
     * Recommends candidate crops based on soil, water reliability, season, and budget.
     * Enforces strict season filtering, transparent point-based suitability scoring,
     * empirical yield modulation, itemized CACP cost sum, and multi-factor risk computation.
     */
    static async recommendCrops({ soilType = 'Black Soil (Regur)', waterReliability = 'Moderately Reliable', season = 'Kharif', budgetPerAcre = 50000, landSize = 2.0, district = 'Nashik' }) {
        const allCrops = await query("SELECT * FROM crops");
        const normSeason = normalizeSeason(season);

        // Filter out crops not grown in the selected season
        const eligibleCrops = allCrops.filter(crop => {
            const eco = getCropEconomics(crop.name);
            if (eco?.seasons) {
                return matchesSeason(eco.seasons, normSeason);
            }
            // Fallback to database ideal_season
            return matchesSeason(crop.ideal_season.split(/[/,]/), normSeason);
        });

        const scoredCrops = await Promise.all(eligibleCrops.map(async crop => {
            const eco = getCropEconomics(crop.name) || {
                crop: crop.name,
                yieldQPerAcre: {
                    low: Math.round(crop.expected_yield_quintal_acre * 0.75 * 10) / 10,
                    typical: crop.expected_yield_quintal_acre,
                    high: Math.round(crop.expected_yield_quintal_acre * 1.25 * 10) / 10
                },
                costPerAcre: {
                    seed: Math.round(crop.avg_input_cost_acre * 0.18),
                    fertiliserManure: Math.round(crop.avg_input_cost_acre * 0.28),
                    plantProtection: Math.round(crop.avg_input_cost_acre * 0.16),
                    irrigationPower: Math.round(crop.avg_input_cost_acre * 0.12),
                    hiredLabour: Math.round(crop.avg_input_cost_acre * 0.14),
                    machinery: Math.round(crop.avg_input_cost_acre * 0.08),
                    harvestingTransport: Math.round(crop.avg_input_cost_acre * 0.04)
                },
                waterNeedMm: crop.water_req_mm,
                idealSoils: [crop.ideal_soil],
                source: 'Maharashtra Agricultural Reference Norms',
                year: '2024-25'
            };

            const marketPrice = await resolveCropPrice(crop, district);

            // Yield modulation: water reliability picks low/typical/high, soil match applies 1.0 vs 0.85
            const baseYieldInfo = resolveBaseYield(eco.yieldQPerAcre, waterReliability);
            const soilInfo = checkSoilMatch(eco.idealSoils, soilType);
            const effectiveYieldPerAcre = Math.round(baseYieldInfo.baseYield * soilInfo.factor * 10) / 10;
            const totalYield = Math.round(effectiveYieldPerAcre * landSize * 10) / 10;

            // Itemized costs: Total = sum of items, not percentage split of total
            const costPerAcreSum = Object.values(eco.costPerAcre).reduce((a, b) => a + b, 0);
            const totalInvestment = Math.round(costPerAcreSum * landSize);

            // Plain arithmetic revenue & profit
            const grossRevenue = Math.round(totalYield * marketPrice.price);
            const netProfit = grossRevenue - totalInvestment;
            const roiPercentage = totalInvestment > 0 ? Math.round((netProfit / totalInvestment) * 100) : 0;

            // Breakeven metrics
            const breakEvenPrice = totalYield > 0 ? Math.round(totalInvestment / totalYield) : 0;
            const breakEvenYieldTotal = marketPrice.price > 0 ? Number((totalInvestment / marketPrice.price).toFixed(2)) : 0;
            const breakEvenYieldPerAcre = (landSize > 0 && breakEvenYieldTotal > 0) ? Number((breakEvenYieldTotal / landSize).toFixed(2)) : 0;

            // Transparent points suitability score (0-100)
            const suitability = computeSuitabilityScore({
                isIdealSoil: soilInfo.isMatch,
                soilType,
                waterNeedMm: eco.waterNeedMm,
                waterReliability,
                costPerAcre: costPerAcreSum,
                budgetPerAcre
            });

            // Quantitative multi-factor risk computation
            const marketRisk = await computeMarketRisk(crop.name, marketPrice.price);
            const waterRisk = await computeWaterRisk(eco.waterNeedMm, waterReliability, district);
            const costRisk = computeCostRisk(costPerAcreSum, budgetPerAcre);
            const overallRisk = computeOverallRisk(marketRisk, waterRisk, costRisk);

            // Data sources
            const dataSources = [
                {
                    field: 'Market Price',
                    value: marketPrice.price,
                    unit: '₹/quintal',
                    source: marketPrice.label,
                    asOf: marketPrice.asOf || undefined
                },
                {
                    field: 'Yield Range & Factors',
                    value: `${effectiveYieldPerAcre} q/acre (${baseYieldInfo.baseYield} q base × ${soilInfo.factor} soil factor)`,
                    unit: 'quintal/acre',
                    source: eco.source,
                    year: eco.year
                },
                {
                    field: 'Cost of Cultivation',
                    value: costPerAcreSum,
                    unit: '₹/acre',
                    source: eco.source,
                    year: eco.year
                },
                marketRisk.mspComparison?.msp ? {
                    field: 'Government MSP',
                    value: marketRisk.mspComparison.msp,
                    unit: '₹/quintal',
                    source: 'CACP, Government of India (Kharif 2025-26 / Rabi 2026-27)',
                    year: '2025-26'
                } : null,
                {
                    field: 'Rainfall Forecast (Next 7 Days)',
                    value: `${waterRisk.rain7DayMm} mm`,
                    unit: 'mm',
                    source: `Open-Meteo live numerical weather forecast for ${district}`,
                    asOf: new Date().toISOString().split('T')[0]
                }
            ].filter(Boolean);

            const suitabilityNotes = [
                soilInfo.note,
                baseYieldInfo.reason,
                costRisk.reason
            ];

            return {
                id: crop.id,
                name: crop.name,
                scientificName: crop.scientific_name,
                category: crop.category,
                idealSeason: eco.seasons ? eco.seasons.join(' / ') : crop.ideal_season,
                durationDays: crop.duration_days,
                waterReqMm: eco.waterNeedMm,
                idealSoil: eco.idealSoils ? eco.idealSoils.join(', ') : crop.ideal_soil,
                suitabilityScore: suitability.total,
                suitabilityScoreBreakdown: suitability.breakdown,
                suitabilityNotes,
                economics: {
                    landSizeAcres: landSize,
                    baseYieldPerAcre: baseYieldInfo.baseYield,
                    soilFactor: soilInfo.factor,
                    yieldPerAcreQuintal: effectiveYieldPerAcre,
                    expectedYieldQuintal: totalYield,
                    costPerAcre: costPerAcreSum,
                    estimatedInvestment: totalInvestment,
                    projectedRevenue: grossRevenue,
                    projectedProfit: netProfit,
                    projectedRoiPercent: roiPercentage,
                    modalPricePerQuintal: marketPrice.price,
                    priceSource: marketPrice.source,
                    priceSourceLabel: marketPrice.label,
                    breakEvenPricePerQuintal: breakEvenPrice,
                    breakEvenYieldQuintal: breakEvenYieldTotal,
                    breakEvenYieldPerAcre
                },
                risks: {
                    overallRisk,
                    marketRisk: marketRisk.level,
                    marketRiskLabel: marketRisk.label,
                    marketRiskReason: marketRisk.reason,
                    marketRiskCv: marketRisk.cvPercent,
                    mspComparison: marketRisk.mspComparison,
                    waterRisk: waterRisk.level,
                    waterRiskReason: waterRisk.reason,
                    inputCostRisk: costRisk.level,
                    inputCostRiskReason: costRisk.reason
                },
                dataSources,
                assumptions: {
                    selectedSeason: normSeason,
                    waterReliability,
                    waterReliabilityReason: baseYieldInfo.reason,
                    soilType,
                    soilFactor: soilInfo.factor,
                    soilFactorNote: soilInfo.note,
                    landSizeAcres: landSize
                }
            };
        }));

        // Sort by suitability score descending
        return scoredCrops.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    }
}

export class RoiCalculatorService {
    /**
     * Computes detailed itemized ROI, 3-outcome scenario simulation, and multi-dimensional financial risk breakdown
     */
    static async calculateCropRoi({
        cropId,
        landSizeAcres = 2.0,
        soilType = 'Black Soil (Regur)',
        waterReliability = 'Moderately Reliable',
        budgetPerAcre = 50000,
        customYieldQuintal,
        customExpectedPrice,
        district = 'Nashik'
    }) {
        const crop = await queryOne("SELECT * FROM crops WHERE id = ?", [cropId]);
        if (!crop) throw new Error('Crop not found');

        const eco = getCropEconomics(crop.name) || {
            crop: crop.name,
            yieldQPerAcre: {
                low: Math.round(crop.expected_yield_quintal_acre * 0.75 * 10) / 10,
                typical: crop.expected_yield_quintal_acre,
                high: Math.round(crop.expected_yield_quintal_acre * 1.25 * 10) / 10
            },
            costPerAcre: {
                seed: Math.round(crop.avg_input_cost_acre * 0.18),
                fertiliserManure: Math.round(crop.avg_input_cost_acre * 0.28),
                plantProtection: Math.round(crop.avg_input_cost_acre * 0.16),
                irrigationPower: Math.round(crop.avg_input_cost_acre * 0.12),
                hiredLabour: Math.round(crop.avg_input_cost_acre * 0.14),
                machinery: Math.round(crop.avg_input_cost_acre * 0.08),
                harvestingTransport: Math.round(crop.avg_input_cost_acre * 0.04)
            },
            waterNeedMm: crop.water_req_mm,
            idealSoils: [crop.ideal_soil],
            source: 'Maharashtra Agricultural Reference Norms',
            year: '2024-25'
        };

        // Price resolution
        const marketPrice = customExpectedPrice
            ? { price: Number(customExpectedPrice), source: 'custom', label: 'Farmer specified expected price' }
            : await resolveCropPrice(crop, district);
        const pricePerQuintal = marketPrice.price;

        // Yield resolution
        const baseYieldInfo = resolveBaseYield(eco.yieldQPerAcre, waterReliability);
        const soilInfo = checkSoilMatch(eco.idealSoils, soilType);
        const yieldPerAcre = customYieldQuintal
            ? Number(customYieldQuintal)
            : Math.round(baseYieldInfo.baseYield * soilInfo.factor * 10) / 10;
        const totalYield = Math.round(yieldPerAcre * landSizeAcres * 10) / 10;

        // Itemized Cost Breakdown from authoritative per-crop, per-acre items
        const costPerAcre = eco.costPerAcre;
        const seedCost = Math.round(costPerAcre.seed * landSizeAcres);
        const fertilizerManureCost = Math.round(costPerAcre.fertiliserManure * landSizeAcres);
        const pestDiseaseProtection = Math.round(costPerAcre.plantProtection * landSizeAcres);
        const irrigationElectricityCost = Math.round(costPerAcre.irrigationPower * landSizeAcres);
        const hiredLabourCost = Math.round(costPerAcre.hiredLabour * landSizeAcres);
        const machineryCost = Math.round(costPerAcre.machinery * landSizeAcres);
        const harvestingTransportCost = Math.round(costPerAcre.harvestingTransport * landSizeAcres);

        const totalInvestment = seedCost + fertilizerManureCost + pestDiseaseProtection +
            irrigationElectricityCost + hiredLabourCost + machineryCost + harvestingTransportCost;
        const costPerAcreTotal = Math.round(totalInvestment / landSizeAcres);

        // Core arithmetic
        const projectedRevenue = Math.round(totalYield * pricePerQuintal);
        const projectedProfit = projectedRevenue - totalInvestment;
        const projectedRoiPercent = totalInvestment > 0 ? Math.round((projectedProfit / totalInvestment) * 100) : 0;

        // Breakeven metrics
        const breakEvenPricePerQuintal = totalYield > 0 ? Math.round(totalInvestment / totalYield) : 0;
        const breakEvenYield = pricePerQuintal > 0 ? Number((totalInvestment / pricePerQuintal).toFixed(2)) : 0;
        const breakEvenYieldPerAcre = (landSizeAcres > 0 && breakEvenYield > 0) ? Number((breakEvenYield / landSizeAcres).toFixed(2)) : 0;

        // Quantitative risk calculations
        const marketRisk = await computeMarketRisk(crop.name, pricePerQuintal);
        const waterRisk = await computeWaterRisk(eco.waterNeedMm, waterReliability, district);
        const costRisk = computeCostRisk(costPerAcreTotal, budgetPerAcre);
        const overallRisk = computeOverallRisk(marketRisk, waterRisk, costRisk);

        // 3-scenario simulation table
        const scenarios = computeScenarios({
            lowYieldPerAcre: eco.yieldQPerAcre.low,
            typicalYieldPerAcre: eco.yieldQPerAcre.typical,
            highYieldPerAcre: eco.yieldQPerAcre.high,
            soilFactor: soilInfo.factor,
            landSizeAcres,
            totalInvestment,
            expectedPrice: pricePerQuintal,
            priceHistory: marketRisk.history
        });

        // Data sources array citing each specific source
        const dataSources = [
            {
                field: 'Market Price',
                value: pricePerQuintal,
                unit: '₹/quintal',
                source: marketPrice.label,
                asOf: marketPrice.asOf || undefined
            },
            {
                field: 'Yield Baseline & Soil Adjustment',
                value: `${yieldPerAcre} q/acre (${baseYieldInfo.baseYield} q base × ${soilInfo.factor} soil factor)`,
                unit: 'quintal/acre',
                source: eco.source,
                year: eco.year
            },
            {
                field: 'Cost of Cultivation',
                value: costPerAcreTotal,
                unit: '₹/acre',
                source: eco.source,
                year: eco.year
            },
            marketRisk.mspComparison?.msp ? {
                field: 'Government Minimum Support Price (MSP)',
                value: marketRisk.mspComparison.msp,
                unit: '₹/quintal',
                source: 'CACP, Government of India (Kharif 2025-26 / Rabi 2026-27)',
                year: '2025-26'
            } : null,
            {
                field: 'Rainfall Forecast (Next 7 Days)',
                value: `${waterRisk.rain7DayMm} mm`,
                unit: 'mm',
                source: `Open-Meteo live numerical weather forecast for ${district}`,
                asOf: new Date().toISOString().split('T')[0]
            }
        ].filter(Boolean);

        const assumptions = {
            waterReliability,
            waterReliabilityYieldChoice: baseYieldInfo.reason,
            baseYieldPerAcre: baseYieldInfo.baseYield,
            soilType,
            soilFactor: soilInfo.factor,
            soilFactorNote: soilInfo.note,
            landSizeAcres,
            scenarioPriceMethod: scenarios.priceMethod
        };

        return {
            crop: {
                id: crop.id,
                name: crop.name,
                scientificName: crop.scientific_name,
                category: crop.category,
                durationDays: crop.duration_days,
                season: eco.seasons ? eco.seasons.join(' / ') : crop.ideal_season,
                source: eco.source,
                year: eco.year
            },
            parameters: {
                landSizeAcres,
                soilType,
                soilFactor: soilInfo.factor,
                waterReliability,
                yieldPerAcreQuintal: yieldPerAcre,
                totalProjectedYieldQuintal: totalYield,
                assumedPricePerQuintal: pricePerQuintal,
                priceSource: marketPrice.source,
                priceSourceLabel: marketPrice.label,
                priceMarkets: marketPrice.markets ?? null,
                priceAsOf: marketPrice.asOf ?? null,
                priceScope: marketPrice.scope ?? null,
                costPerAcre: costPerAcreTotal
            },
            costBreakdown: {
                seeds: seedCost,
                fertilizerAndNutrients: fertilizerManureCost,
                pestAndDiseaseProtection: pestDiseaseProtection,
                irrigationAndPower: irrigationElectricityCost,
                hiredLabour: hiredLabourCost,
                machinery: machineryCost,
                harvestingTransport: harvestingTransportCost,
                totalEstimatedInvestment: totalInvestment
            },
            financialProjections: {
                totalEstimatedInvestment: totalInvestment,
                projectedGrossRevenue: projectedRevenue,
                projectedNetProfit: projectedProfit,
                projectedRoiPercent,
                breakEvenPricePerQuintal,
                breakEvenYieldQuintal: breakEvenYield,
                breakEvenYieldPerAcre,
                disclaimer: "Projections use live mandi prices and cited reference data; actual results depend on weather, pests and market arrivals."
            },
            scenarios,
            riskAnalysis: {
                overallRisk,
                marketRisk: {
                    level: marketRisk.level,
                    label: marketRisk.label,
                    description: marketRisk.reason,
                    cvPercent: marketRisk.cvPercent,
                    mspComparison: marketRisk.mspComparison
                },
                waterRisk: {
                    level: waterRisk.level,
                    description: waterRisk.reason,
                    rain7DayMm: waterRisk.rain7DayMm
                },
                costRisk: {
                    level: costRisk.level,
                    description: costRisk.reason
                }
            },
            dataSources,
            assumptions
        };
    }
}
