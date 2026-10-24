/**
 * Authoritative agronomic and economic reference data for Maharashtra crops.
 * Data compiled from:
 * 1. Commission for Agricultural Costs and Prices (CACP) - Price Policy for Kharif/Rabi Crops (Cost A2+FL for Maharashtra)
 * 2. Directorate of Economics & Statistics (DES), Department of Agriculture, Government of Maharashtra
 * 3. Mahatma Phule Krishi Vidyapeeth (MPKV), Rahuri - Package of Practices & Vegetable Economics
 * 4. Vasantrao Naik Marathwada Krishi Vidyapeeth (VNMKV), Parbhani - Pulses and Oilseeds Recommendations
 * 5. Dr. Panjabrao Deshmukh Krishi Vidyapeeth (PDKV), Akola - Vidarbha Cotton & Soybean Production Costs
 * 6. ICAR - Directorate of Onion & Garlic Research (DOGR), Rajgurunagar (Pune)
 */

export const CROP_ECONOMICS = {
    'Soybean': {
        crop: 'Soybean',
        scientificName: 'Glycine max',
        category: 'Oilseed',
        durationDays: 100,
        seasons: ['Kharif'],
        waterNeedMm: 450,
        idealSoils: ['Black Soil (Regur)', 'Medium Black Loam', 'Clay Loam', 'Alluvial Loam'],
        yieldQPerAcre: {
            low: 6.0,       // Mostly rain-fed under irregular monsoon
            typical: 8.5,   // Moderately reliable moisture / timely showers
            high: 11.5      // Irrigated / assured water with broad bed furrow (BBF)
        },
        costPerAcre: {
            seed: 2600,                 // 30 kg certified seed @ ₹85/kg + seed treatment
            fertiliserManure: 3200,     // DAP, MOP, Sulphur & organic farmyard manure
            plantProtection: 1800,      // Pre & post-emergence weedicides, girdle beetle/pod borer spray
            irrigationPower: 700,       // 1-2 protective irrigations during dry spell
            hiredLabour: 3400,          // Sowing, manual weeding, harvesting & bagging
            machinery: 2300,            // Summer ploughing, rotavator, seed-cum-fertilizer drill
            harvestingTransport: 1700   // Thresher charges, bagging and local mandi haulage
        },
        source: 'CACP Price Policy for Kharif Crops 2025-26, Maharashtra Cost of Cultivation (A2+FL); MPKV Rahuri & VNMKV Parbhani',
        year: '2025-26'
    },
    'Cotton': {
        crop: 'Cotton',
        scientificName: 'Gossypium hirsutum',
        category: 'Commercial',
        durationDays: 160,
        seasons: ['Kharif'],
        waterNeedMm: 650,
        idealSoils: ['Black Soil (Regur)', 'Deep Black Cotton Soil', 'Medium Black Loam'],
        yieldQPerAcre: {
            low: 6.0,       // Rain-fed Vidarbha/Marathwada dryland
            typical: 9.5,   // Medium black soil with supplemental irrigation
            high: 14.0      // Drip fertigated Bt-cotton with high density planting
        },
        costPerAcre: {
            seed: 1900,                 // 2 Bt cotton seed packets @ ₹850-900/packet + refuge
            fertiliserManure: 5200,     // NPK 100:50:50, FYM, micronutrient zinc/boron sprays
            plantProtection: 4200,      // Sucking pest sprays (thrips, aphids) and pink bollworm management
            irrigationPower: 1800,      // Drip / furrow irrigation during post-monsoon boll development
            hiredLabour: 6400,          // Labour intensive: 3-4 picking cycles, weeding, detopping
            machinery: 3500,            // Deep subsoiling, ridges & furrows, interculture bullock/mini-tractor
            harvestingTransport: 2800   // Cotton boll picking wages & transport to APMC/ginning press
        },
        source: 'CACP Price Policy for Kharif Crops 2025-26, Maharashtra Cotton Cost (A2+FL); PDKV Akola Cotton Advisory',
        year: '2025-26'
    },
    'Tur (Arhar)': {
        crop: 'Tur (Arhar)',
        scientificName: 'Cajanus cajan',
        category: 'Pulse',
        durationDays: 170,
        seasons: ['Kharif'],
        waterNeedMm: 400,
        idealSoils: ['Black Soil (Regur)', 'Medium Black Loam', 'Red Loam'],
        yieldQPerAcre: {
            low: 4.5,
            typical: 6.5,
            high: 9.0
        },
        costPerAcre: {
            seed: 1400,                 // Certified seed (BDN-711 / BSMR-736) @ 5 kg/acre
            fertiliserManure: 3100,     // Rhizobium biofertilizer, DAP, Single Super Phosphate
            plantProtection: 2600,      // Helicoverpa pod borer and pod fly sprays
            irrigationPower: 800,       // 1-2 critical irrigations at flowering/pod set
            hiredLabour: 3800,          // Weeding, spraying, manual harvesting
            machinery: 2600,            // Land tillage, sowing, tractor threshing
            harvestingTransport: 1900   // Threshing and APMC transport
        },
        source: 'CACP Price Policy for Kharif Crops 2025-26, Maharashtra Pulses Cost of Cultivation (A2+FL); VNMKV Parbhani',
        year: '2025-26'
    },
    'Gram (Chana)': {
        crop: 'Gram (Chana)',
        scientificName: 'Cicer arietinum',
        category: 'Pulse',
        durationDays: 110,
        seasons: ['Rabi'],
        waterNeedMm: 280,
        idealSoils: ['Black Soil (Regur)', 'Deep Black Cotton Soil', 'Medium Black Loam'],
        yieldQPerAcre: {
            low: 5.0,
            typical: 7.5,
            high: 10.5
        },
        costPerAcre: {
            seed: 2800,                 // Digvijay / Vijay seed @ 30 kg/acre
            fertiliserManure: 2600,     // SSP + Rhizobium + PSB seed coating
            plantProtection: 1700,      // Pheromone traps + Helicoverpa spray
            irrigationPower: 900,       // 1-2 critical irrigations (branching and pod development)
            hiredLabour: 3100,          // Niiping, weeding, pull harvesting
            machinery: 2200,            // Seed bed preparation and thresher
            harvestingTransport: 1500   // Threshing and bagging
        },
        source: 'CACP Price Policy for Rabi Crops 2025-26, Maharashtra Gram Cost of Cultivation (A2+FL); MPKV Rahuri',
        year: '2025-26'
    },
    'Wheat': {
        crop: 'Wheat',
        scientificName: 'Triticum aestivum',
        category: 'Cereal',
        durationDays: 125,
        seasons: ['Rabi'],
        waterNeedMm: 420,
        idealSoils: ['Alluvial Loam', 'Medium Black Loam', 'Black Soil (Regur)'],
        yieldQPerAcre: {
            low: 12.0,      // Restricted irrigation (2-3 turns)
            typical: 17.0,  // Standard irrigated (4-5 turns)
            high: 22.0      // High management timely sown (Samadhan / Netravati)
        },
        costPerAcre: {
            seed: 2200,                 // Certified seed 40 kg @ ₹55/kg
            fertiliserManure: 4100,     // NPK 120:60:40 split doses + Zinc
            plantProtection: 1200,      // Termite & rust preventative sprays
            irrigationPower: 2600,      // 4-5 border irrigation cycles + power
            hiredLabour: 3500,          // Bunding, manual irrigation control, weeding
            machinery: 3100,            // Rotavator, seed drill, combine harvester
            harvestingTransport: 1800   // Combine hire and grain transport to APMC
        },
        source: 'CACP Price Policy for Rabi Crops 2025-26, Maharashtra Wheat Cost (A2+FL); MPKV Rahuri',
        year: '2025-26'
    },
    'Jowar': {
        crop: 'Jowar',
        scientificName: 'Sorghum bicolor',
        category: 'Cereal / Fodder',
        durationDays: 115,
        seasons: ['Kharif', 'Rabi'],
        waterNeedMm: 350,
        idealSoils: ['Black Soil (Regur)', 'Medium Black Loam', 'Clay Loam'],
        yieldQPerAcre: {
            low: 6.0,
            typical: 9.5,
            high: 14.0
        },
        costPerAcre: {
            seed: 900,                  // Maldandi M 35-1 / Parbhani Moti seed
            fertiliserManure: 2800,     // FYM + Nitrogen/Phosphorus split
            plantProtection: 1100,      // Shoot fly and stem borer control
            irrigationPower: 800,       // Residual moisture or 1 protective watering
            hiredLabour: 3600,          // Bird scaring, earhead harvesting, stalk cutting
            machinery: 2400,            // Cultivator and threshing
            harvestingTransport: 1600   // Threshing and mandi transport
        },
        source: 'CACP Price Policy for Kharif Crops 2025-26, Maharashtra Jowar Economics; MPKV Rahuri',
        year: '2025-26'
    },
    'Maize': {
        crop: 'Maize',
        scientificName: 'Zea mays',
        category: 'Cereal / Fodder',
        durationDays: 105,
        seasons: ['Kharif', 'Rabi'],
        waterNeedMm: 500,
        idealSoils: ['Alluvial Loam', 'Medium Black Loam', 'Red Loam'],
        yieldQPerAcre: {
            low: 16.0,
            typical: 24.0,
            high: 32.0
        },
        costPerAcre: {
            seed: 2500,                 // Single cross hybrid seed (8 kg/acre)
            fertiliserManure: 4600,     // NPK 120:60:40 heavy feeder nutrient plan
            plantProtection: 2100,      // Fall Armyworm (Spodoptera frugiperda) targeted sprays
            irrigationPower: 1800,      // Timely irrigation at tasseling & silking
            hiredLabour: 3400,          // Ear plucking, de-husking
            machinery: 2700,            // Tractor bed planting and thresher
            harvestingTransport: 1700   // Maize sheller hire and mandi cartage
        },
        source: 'CACP Price Policy for Kharif Crops 2025-26, Maharashtra Maize Cultivation; PDKV Akola',
        year: '2025-26'
    },
    'Rice (Paddy)': {
        crop: 'Rice (Paddy)',
        scientificName: 'Oryza sativa',
        category: 'Cereal',
        durationDays: 135,
        seasons: ['Kharif'],
        waterNeedMm: 1100,
        idealSoils: ['Clay Loam / Alluvial', 'Alluvial Loam', 'Black Soil (Regur)'],
        yieldQPerAcre: {
            low: 15.0,
            typical: 22.0,
            high: 28.0
        },
        costPerAcre: {
            seed: 1800,                 // Karjat / Indrayani / Wada Kolam seed
            fertiliserManure: 4800,     // Urea briquettes / DAP / green manuring
            plantProtection: 1900,      // Stem borer and blast fungicides
            irrigationPower: 2800,      // Puddling water and field inundation
            hiredLabour: 5900,          // Nursery uprooting, manual transplanting, harvesting
            machinery: 3200,            // Tractor puddling, cage wheel tillage
            harvestingTransport: 2200   // Threshing, straw bundling, transport
        },
        source: 'CACP Price Policy for Kharif Crops 2025-26, Maharashtra Paddy Economics; Dr. BSKKV Dapoli',
        year: '2025-26'
    },
    'Onion': {
        crop: 'Onion',
        scientificName: 'Allium cepa',
        category: 'Vegetable',
        durationDays: 130,
        seasons: ['Rabi', 'Kharif', 'Zaid / Summer'],
        waterNeedMm: 450,
        idealSoils: ['Alluvial / Medium Black', 'Medium Black Loam', 'Black Soil (Regur)'],
        yieldQPerAcre: {
            low: 65.0,      // Kharif / unseasonal rain affected
            typical: 95.0,  // Standard Rangda / Late Kharif
            high: 130.0     // Rabi storage-grade (Fursungi / Gavran) with micro-irrigation
        },
        costPerAcre: {
            seed: 6500,                 // Certified nursery raising / 4 kg seed @ ₹1500-1800/kg
            fertiliserManure: 7200,     // Well-decomposed FYM (5 tonnes) + NPK 100:50:50 + Sulphur
            plantProtection: 3800,      // Thrips and purple blotch preventative/curative sprays
            irrigationPower: 2600,      // Micro-sprinkler / drip line fertigation
            hiredLabour: 8200,          // Seedling transplantation, 2-3 hand weedings, harvesting
            machinery: 4200,            // Broad bed furrow (BBF) shaping, discing, rotavator
            harvestingTransport: 4000   // Curing, bulb detopping, grading, jute bags and mandi freight
        },
        source: 'ICAR-Directorate of Onion and Garlic Research (DOGR Pune) & MPKV Rahuri Onion Cost Norms 2024-25',
        year: '2024-25'
    },
    'Tomato': {
        crop: 'Tomato',
        scientificName: 'Solanum lycopersicum',
        category: 'Vegetable',
        durationDays: 110,
        seasons: ['Kharif', 'Rabi', 'Zaid / Summer'],
        waterNeedMm: 550,
        idealSoils: ['Black Soil (Regur)', 'Medium Black Loam', 'Red Loam'],
        yieldQPerAcre: {
            low: 80.0,      // Unstaked / heavy blight pressure
            typical: 130.0, // Staked hybrid crop with standard drip
            high: 180.0     // Trellis staked (bamboo + wire) with mulching & soluble fertigation
        },
        costPerAcre: {
            seed: 7500,                 // Hybrid F1 seedling pro-trays (Abhinav / TO-1057)
            fertiliserManure: 8500,     // Water soluble 19:19:19, 0:52:34, Calcium Nitrate, FYM
            plantProtection: 5800,      // Early/late blight, pinworm, whitefly & mite control
            irrigationPower: 3200,      // High frequency daily/alternate-day drip cycles
            hiredLabour: 9800,          // Trellis tying, shoot pruning, 6-8 picking rounds
            machinery: 4000,            // Raised bed preparation, silver-black plastic mulch laying
            harvestingTransport: 4200   // Tomato plastic crates, farm sorting and APMC tempo hire
        },
        source: 'MPKV Rahuri Package of Practices for Vegetable Crops 2024-25; Maharashtra Horticulture Dept',
        year: '2024-25'
    },
    'Potato': {
        crop: 'Potato',
        scientificName: 'Solanum tuberosum',
        category: 'Horticulture',
        durationDays: 95,
        seasons: ['Rabi'],
        waterNeedMm: 400,
        idealSoils: ['Sandy Loam', 'Alluvial Loam', 'Medium Black Loam'],
        yieldQPerAcre: {
            low: 75.0,
            typical: 110.0,
            high: 145.0
        },
        costPerAcre: {
            seed: 16500,                // Disease-free certified seed tubers (10-12 q/acre @ ₹1500/q)
            fertiliserManure: 6200,     // Heavy potash and phosphorus basal dressing
            plantProtection: 2800,      // Late blight preventative and aphid control
            irrigationPower: 2200,      // Light frequent furrow irrigation
            hiredLabour: 4600,          // Planting, earthing up, manual sorting
            machinery: 3500,            // Potato planter / ridger and mechanical digger hire
            harvestingTransport: 2200   // Gunny bags and cold storage / APMC cartage
        },
        source: 'ICAR-Central Potato Research Institute (CPRI) & MPKV Rahuri Guidelines 2024-25',
        year: '2024-25'
    },
    'Green Chilli': {
        crop: 'Green Chilli',
        scientificName: 'Capsicum annuum',
        category: 'Spices',
        durationDays: 140,
        seasons: ['Kharif', 'Zaid / Summer'],
        waterNeedMm: 550,
        idealSoils: ['Well-drained Loam', 'Medium Black Loam', 'Red Loam'],
        yieldQPerAcre: {
            low: 30.0,
            typical: 48.0,
            high: 65.0
        },
        costPerAcre: {
            seed: 5800,                 // F1 hybrid seedlings (Sitara / G-4)
            fertiliserManure: 7800,     // FYM + micronutrient chelated zinc/ferrous + drip fertilizer
            plantProtection: 6200,      // Thrips, mites, and leaf curl virus vector management
            irrigationPower: 3100,      // Drip fertigation system
            hiredLabour: 11500,         // Highly labour intensive: 6-10 green fruit pickings
            machinery: 4100,            // Ridge & furrow preparation, bed mulch
            harvestingTransport: 4000   // Crates and quick vegetable market dispatch
        },
        source: 'MPKV Rahuri Vegetable Cultivation Cost of Production 2024-25; VNMKV Parbhani',
        year: '2024-25'
    }
};

/**
 * Normalizes input season string to match canonical season names:
 * 'Kharif', 'Rabi', 'Zaid / Summer'
 */
export function normalizeSeason(season = '') {
    const s = String(season).toLowerCase().trim();
    if (s.includes('kharif')) return 'Kharif';
    if (s.includes('rabi')) return 'Rabi';
    if (s.includes('zaid') || s.includes('summer') || s.includes('unhali')) return 'Zaid / Summer';
    return 'Kharif';
}

/**
 * Checks if a crop is grown in the requested agricultural season.
 */
export function matchesSeason(cropSeasons = [], requestedSeason = 'Kharif') {
    const normReq = normalizeSeason(requestedSeason);
    return cropSeasons.some(s => {
        const normCropSeason = normalizeSeason(s);
        return normCropSeason === normReq || s.toLowerCase().includes(normReq.toLowerCase());
    });
}

/**
 * Checks whether user's soil is an ideal match for the crop.
 */
export function checkSoilMatch(idealSoils = [], farmerSoil = '') {
    if (!farmerSoil) return { isMatch: true, factor: 1.0, note: 'Default soil profile' };
    const farmLower = String(farmerSoil).toLowerCase();
    const isMatch = idealSoils.some(s => {
        const sLower = s.toLowerCase();
        return farmLower.includes(sLower.split(' ')[0]) || sLower.includes(farmLower.split(' ')[0]);
    });
    return {
        isMatch,
        factor: isMatch ? 1.0 : 0.85,
        note: isMatch
            ? `Optimal soil match: 1.0x factor (${farmerSoil})`
            : `Sub-optimal soil texture: 0.85x factor (${farmerSoil} vs ideal ${idealSoils[0]})`
    };
}

/**
 * Resolves baseline yield quintal/acre based on farmer's water reliability.
 * Mostly Rain-fed -> low, Moderately Reliable -> typical, Very Reliable -> high.
 */
export function resolveBaseYield(yieldRange, waterReliability = 'Moderately Reliable') {
    const wr = String(waterReliability).toLowerCase();
    if (wr.includes('rain') || wr.includes('mostly')) {
        return {
            level: 'low',
            baseYield: yieldRange.low,
            reason: 'Mostly Rain-fed -> Conservative dryland yield level'
        };
    }
    if (wr.includes('very') || wr.includes('canal') || wr.includes('assured')) {
        return {
            level: 'high',
            baseYield: yieldRange.high,
            reason: 'Very Reliable water -> High-yield irrigated potential'
        };
    }
    return {
        level: 'typical',
        baseYield: yieldRange.typical,
        reason: 'Moderately Reliable water -> Typical average yield level'
    };
}

/**
 * Retrieves crop economics record by name (case-insensitive fuzzy match).
 */
export function getCropEconomics(cropName = '') {
    const name = String(cropName).trim().toLowerCase();
    for (const [key, val] of Object.entries(CROP_ECONOMICS)) {
        if (key.toLowerCase() === name || val.crop.toLowerCase() === name) return val;
        if (key.toLowerCase().includes(name) || name.includes(key.toLowerCase().split(' ')[0])) return val;
    }
    return null;
}
