import { query, queryOne } from '../models/db.js';

export class CropAdvisorService {
    /**
     * Recommends candidate crops based on soil, water reliability, season, and budget
     */
    static async recommendCrops({ soilType, waterReliability, season = 'Kharif', budgetPerAcre = 50000, landSize = 2.0 }) {
        const allCrops = await query("SELECT * FROM crops");

        const scoredCrops = allCrops.map(crop => {
            let agronomicScore = 70;
            let suitabilityNotes = [];

            // Soil matching
            if (crop.ideal_soil.toLowerCase().includes(soilType.toLowerCase().split(' ')[0])) {
                agronomicScore += 20;
                suitabilityNotes.push(`Optimal growth in ${soilType}`);
            } else {
                agronomicScore -= 10;
                suitabilityNotes.push(`Tolerates ${soilType} with added organic compost`);
            }

            // Water reliability matching
            if (crop.water_req_mm > 700) {
                if (waterReliability === 'Very Reliable') {
                    agronomicScore += 15;
                    suitabilityNotes.push('Excellent water security for high-consumption crop');
                } else if (waterReliability === 'Mostly Rain-fed') {
                    agronomicScore -= 30;
                    suitabilityNotes.push('High drought risk without supplemental irrigation');
                }
            } else {
                if (waterReliability === 'Mostly Rain-fed') {
                    agronomicScore += 15;
                    suitabilityNotes.push('Low water requirement suits rain-fed farms');
                }
            }

            // Budget matching
            if (crop.avg_input_cost_acre <= budgetPerAcre) {
                agronomicScore += 10;
                suitabilityNotes.push('Fits comfortably within current working capital budget');
            } else {
                agronomicScore -= 20;
                suitabilityNotes.push(`Requires ₹${(crop.avg_input_cost_acre - budgetPerAcre).toLocaleString('en-IN')}/acre additional credit or micro-finance`);
            }

            // Calculated economics per acre
            const totalYield = crop.expected_yield_quintal_acre * landSize;
            const totalInputCost = crop.avg_input_cost_acre * landSize;
            const grossRevenue = totalYield * crop.historical_avg_price_quintal;
            const netProfit = grossRevenue - totalInputCost;
            const roiPercentage = Math.round((netProfit / totalInputCost) * 100);

            return {
                id: crop.id,
                name: crop.name,
                scientificName: crop.scientific_name,
                category: crop.category,
                idealSeason: crop.ideal_season,
                durationDays: crop.duration_days,
                waterReqMm: crop.water_req_mm,
                idealSoil: crop.ideal_soil,
                suitabilityScore: Math.min(98, Math.max(45, agronomicScore)),
                suitabilityNotes,
                economics: {
                    landSizeAcres: landSize,
                    expectedYieldQuintal: totalYield,
                    estimatedInvestment: totalInputCost,
                    projectedRevenue: grossRevenue,
                    projectedProfit: netProfit,
                    projectedRoiPercent: roiPercentage,
                    modalPricePerQuintal: crop.historical_avg_price_quintal
                },
                risks: {
                    marketRisk: crop.market_volatility_score,
                    waterRisk: (crop.water_req_mm > 600 && waterReliability !== 'Very Reliable') ? 'High' : crop.water_risk_score,
                    inputCostRisk: crop.avg_input_cost_acre > budgetPerAcre ? 'High' : crop.input_risk_score
                }
            };
        });

        // Sort by suitability score
        return scoredCrops.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    }
}

export class RoiCalculatorService {
    /**
     * Computes detailed itemized ROI and multi-dimensional financial risk breakdown
     */
    static async calculateCropRoi({ cropId, landSizeAcres = 2.0, soilType = 'Black Soil', waterReliability = 'Moderately Reliable', customYieldQuintal, customExpectedPrice }) {
        const crop = await queryOne("SELECT * FROM crops WHERE id = ?", [cropId]);
        if (!crop) throw new Error('Crop not found');

        const yieldPerAcre = customYieldQuintal ? Number(customYieldQuintal) : crop.expected_yield_quintal_acre;
        const totalYield = yieldPerAcre * landSizeAcres;
        const pricePerQuintal = customExpectedPrice ? Number(customExpectedPrice) : crop.historical_avg_price_quintal;

        // Realistic Indian agricultural input cost breakdown (per acre proportions)
        const baseAcreCost = crop.avg_input_cost_acre;
        const seedCost = Math.round(baseAcreCost * 0.18 * landSizeAcres);
        const fertilizerManureCost = Math.round(baseAcreCost * 0.28 * landSizeAcres);
        const pestDiseaseProtection = Math.round(baseAcreCost * 0.16 * landSizeAcres);
        const irrigationElectricityCost = Math.round(baseAcreCost * 0.12 * landSizeAcres);
        const laborHarvestCost = Math.round(baseAcreCost * 0.26 * landSizeAcres);

        const totalInvestment = seedCost + fertilizerManureCost + pestDiseaseProtection + irrigationElectricityCost + laborHarvestCost;
        const projectedRevenue = Math.round(totalYield * pricePerQuintal);
        const projectedProfit = projectedRevenue - totalInvestment;
        const projectedRoiPercent = Math.round((projectedProfit / totalInvestment) * 100);

        // Dynamic Risk Assessment
        let marketRiskNote = '';
        if (crop.market_volatility_score === 'High') {
            marketRiskNote = 'High price swings common during peak harvest arrivals. Mandi price comparison and staggered harvesting strongly advised.';
        } else {
            marketRiskNote = 'Stable market demand supported by government MSP and steady household consumption.';
        }

        let waterRiskNote = '';
        if (crop.water_req_mm > 550 && waterReliability !== 'Very Reliable') {
            waterRiskNote = 'Crop is sensitive to moisture stress at flowering stage. Consider drip fertigation or mulching.';
        } else {
            waterRiskNote = 'Low to moderate water requirement matches your field water availability.';
        }

        return {
            crop: {
                id: crop.id,
                name: crop.name,
                scientificName: crop.scientific_name,
                category: crop.category,
                durationDays: crop.duration_days,
                season: crop.ideal_season
            },
            parameters: {
                landSizeAcres,
                soilType,
                waterReliability,
                yieldPerAcreQuintal: yieldPerAcre,
                totalProjectedYieldQuintal: totalYield,
                assumedPricePerQuintal: pricePerQuintal
            },
            costBreakdown: {
                seeds: seedCost,
                fertilizerAndNutrients: fertilizerManureCost,
                pestAndDiseaseProtection: pestDiseaseProtection,
                irrigationAndPower: irrigationElectricityCost,
                laborAndHarvesting: laborHarvestCost,
                totalEstimatedInvestment: totalInvestment
            },
            financialProjections: {
                totalEstimatedInvestment: totalInvestment,
                projectedGrossRevenue: projectedRevenue,
                projectedNetProfit: projectedProfit,
                projectedRoiPercent,
                breakEvenPricePerQuintal: Math.round(totalInvestment / totalYield),
                disclaimer: "Projections are based on historical APMC modal trends and average farm yields. Actual realizations will depend on weather events, pest incidence, and market arrivals."
            },
            riskAnalysis: {
                overallRisk: crop.market_volatility_score === 'High' ? 'Moderate-High' : 'Low-Moderate',
                marketRisk: {
                    level: crop.market_volatility_score,
                    description: marketRiskNote
                },
                waterRisk: {
                    level: (crop.water_req_mm > 550 && waterReliability !== 'Very Reliable') ? 'High' : 'Low',
                    description: waterRiskNote
                },
                costRisk: {
                    level: crop.input_risk_score,
                    description: `Estimated working capital required: ₹${(totalInvestment / landSizeAcres).toLocaleString('en-IN')}/acre.`
                }
            }
        };
    }
}
