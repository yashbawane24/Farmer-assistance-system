// Single source of truth for the region SFAS serves.
// The system is focused on Maharashtra only: districts, mandis, crops and MSP are Maharashtra-specific.

export const REGION_STATE = 'Maharashtra';

// District headquarters coordinates (used for live weather and mandi distance estimates)
export const MAHARASHTRA_DISTRICTS = [
    // Western Maharashtra
    { name: 'Pune', region: 'Western Maharashtra', mr: 'पुणे', hi: 'पुणे', lat: 18.5204, lon: 73.8567 },
    { name: 'Satara', region: 'Western Maharashtra', mr: 'सातारा', hi: 'सतारा', lat: 17.6805, lon: 73.9936 },
    { name: 'Sangli', region: 'Western Maharashtra', mr: 'सांगली', hi: 'सांगली', lat: 16.8524, lon: 74.5815 },
    { name: 'Kolhapur', region: 'Western Maharashtra', mr: 'कोल्हापूर', hi: 'कोल्हापुर', lat: 16.7050, lon: 74.2433 },
    { name: 'Solapur', region: 'Western Maharashtra', mr: 'सोलापूर', hi: 'सोलापुर', lat: 17.6599, lon: 75.9064 },
    // North Maharashtra (Khandesh)
    { name: 'Nashik', region: 'North Maharashtra', mr: 'नाशिक', hi: 'नासिक', lat: 19.9975, lon: 73.7898 },
    { name: 'Ahmednagar', region: 'North Maharashtra', mr: 'अहमदनगर', hi: 'अहमदनगर', lat: 19.0948, lon: 74.7480 },
    { name: 'Jalgaon', region: 'North Maharashtra', mr: 'जळगाव', hi: 'जलगांव', lat: 21.0077, lon: 75.5626 },
    { name: 'Dhule', region: 'North Maharashtra', mr: 'धुळे', hi: 'धुले', lat: 20.9042, lon: 74.7749 },
    { name: 'Nandurbar', region: 'North Maharashtra', mr: 'नंदुरबार', hi: 'नंदुरबार', lat: 21.3700, lon: 74.2400 },
    // Marathwada
    { name: 'Aurangabad', region: 'Marathwada', mr: 'छत्रपती संभाजीनगर', hi: 'छत्रपति संभाजीनगर', lat: 19.8762, lon: 75.3433 },
    { name: 'Jalna', region: 'Marathwada', mr: 'जालना', hi: 'जालना', lat: 19.8410, lon: 75.8864 },
    { name: 'Beed', region: 'Marathwada', mr: 'बीड', hi: 'बीड', lat: 18.9891, lon: 75.7601 },
    { name: 'Latur', region: 'Marathwada', mr: 'लातूर', hi: 'लातूर', lat: 18.4088, lon: 76.5604 },
    { name: 'Osmanabad', region: 'Marathwada', mr: 'धाराशिव', hi: 'धाराशिव', lat: 18.1860, lon: 76.0419 },
    { name: 'Nanded', region: 'Marathwada', mr: 'नांदेड', hi: 'नांदेड़', lat: 19.1383, lon: 77.3210 },
    { name: 'Parbhani', region: 'Marathwada', mr: 'परभणी', hi: 'परभणी', lat: 19.2608, lon: 76.7748 },
    { name: 'Hingoli', region: 'Marathwada', mr: 'हिंगोली', hi: 'हिंगोली', lat: 19.7173, lon: 77.1494 },
    // Vidarbha
    { name: 'Nagpur', region: 'Vidarbha', mr: 'नागपूर', hi: 'नागपुर', lat: 21.1458, lon: 79.0882 },
    { name: 'Amravati', region: 'Vidarbha', mr: 'अमरावती', hi: 'अमरावती', lat: 20.9374, lon: 77.7796 },
    { name: 'Akola', region: 'Vidarbha', mr: 'अकोला', hi: 'अकोला', lat: 20.7002, lon: 77.0082 },
    { name: 'Yavatmal', region: 'Vidarbha', mr: 'यवतमाळ', hi: 'यवतमाल', lat: 20.3888, lon: 78.1204 },
    { name: 'Wardha', region: 'Vidarbha', mr: 'वर्धा', hi: 'वर्धा', lat: 20.7453, lon: 78.6022 },
    { name: 'Washim', region: 'Vidarbha', mr: 'वाशिम', hi: 'वाशिम', lat: 20.1110, lon: 77.1330 },
    { name: 'Buldhana', region: 'Vidarbha', mr: 'बुलढाणा', hi: 'बुलढाणा', lat: 20.5292, lon: 76.1842 },
    { name: 'Chandrapur', region: 'Vidarbha', mr: 'चंद्रपूर', hi: 'चंद्रपुर', lat: 19.9615, lon: 79.2961 },
    { name: 'Gondia', region: 'Vidarbha', mr: 'गोंदिया', hi: 'गोंदिया', lat: 21.4624, lon: 80.1920 },
    { name: 'Bhandara', region: 'Vidarbha', mr: 'भंडारा', hi: 'भंडारा', lat: 21.1667, lon: 79.6500 },
    { name: 'Gadchiroli', region: 'Vidarbha', mr: 'गडचिरोली', hi: 'गढ़चिरौली', lat: 20.1849, lon: 79.9948 },
    // Konkan
    { name: 'Thane', region: 'Konkan', mr: 'ठाणे', hi: 'ठाणे', lat: 19.2183, lon: 72.9781 },
    { name: 'Palghar', region: 'Konkan', mr: 'पालघर', hi: 'पालघर', lat: 19.6967, lon: 72.7699 },
    { name: 'Raigad', region: 'Konkan', mr: 'रायगड', hi: 'रायगढ़', lat: 18.6414, lon: 72.8722 },
    { name: 'Ratnagiri', region: 'Konkan', mr: 'रत्नागिरी', hi: 'रत्नागिरी', lat: 16.9902, lon: 73.3120 },
    { name: 'Sindhudurg', region: 'Konkan', mr: 'सिंधुदुर्ग', hi: 'सिंधुदुर्ग', lat: 16.1167, lon: 73.6833 },
    { name: 'Mumbai', region: 'Konkan', mr: 'मुंबई', hi: 'मुंबई', lat: 19.0760, lon: 72.8777 }
];

// Agmarknet and newer official names that differ from the names above
const DISTRICT_ALIASES = {
    'sholapur': 'solapur',
    'chhatrapati sambhajinagar': 'aurangabad',
    'chattrapati sambhajinagar': 'aurangabad',
    'sambhajinagar': 'aurangabad',
    'dharashiv': 'osmanabad',
    'ahilyanagar': 'ahmednagar',
    'ahmadnagar': 'ahmednagar',
    'mumbai suburban': 'mumbai',
    'mumbai city': 'mumbai',
    'navi mumbai': 'thane',
    'buldana': 'buldhana',
    'gondiya': 'gondia'
};

export function findDistrict(name = '') {
    let key = String(name).toLowerCase().trim();
    key = DISTRICT_ALIASES[key] || key;
    return MAHARASHTRA_DISTRICTS.find(d => d.name.toLowerCase() === key) || null;
}

// Straight-line distance x 1.3 is a standard rough estimate of road distance
export function estimateRoadDistanceKm(fromDistrict, toDistrict) {
    const a = findDistrict(fromDistrict);
    const b = findDistrict(toDistrict);
    if (!a || !b) return null;
    if (a.name === b.name) return 15; // within the same district: typical farm-to-APMC trip
    const R = 6371;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 1.3);
}

// MSP: Kharif Marketing Season 2025-26 and Rabi Marketing Season 2026-27 (Govt. of India, CACP).
// Update these every year when new MSP is announced.
export const MSP_YEAR_LABEL = 'Kharif 2025-26 / Rabi 2026-27';

// `name` matches the crop names used across the app; `commodities` are the exact Agmarknet names.
export const REGION_CROPS = [
    { name: 'Soybean', commodities: ['Soyabean'], msp: 5328 },
    { name: 'Cotton', commodities: ['Cotton'], msp: 7710 },
    { name: 'Tur (Arhar)', commodities: ['Arhar (Tur/Red Gram)(Whole)'], msp: 8000 },
    { name: 'Gram (Chana)', commodities: ['Bengal Gram(Gram)(Whole)'], msp: 5875 },
    { name: 'Jowar', commodities: ['Jowar(Sorghum)'], msp: 3699 },
    { name: 'Wheat', commodities: ['Wheat'], msp: 2585 },
    { name: 'Maize', commodities: ['Maize'], msp: 2400 },
    { name: 'Rice (Paddy)', commodities: ['Paddy(Dhan)(Common)', 'Rice'], msp: 2369 },
    { name: 'Onion', commodities: ['Onion'] },
    { name: 'Tomato', commodities: ['Tomato'] },
    { name: 'Potato', commodities: ['Potato'] },
    { name: 'Green Chilli', commodities: ['Green Chilli'] },
    { name: 'Pomegranate', commodities: ['Pomegranate'] },
    { name: 'Grapes', commodities: ['Grapes'] }
];

// Matches "Chilli", "Rice", "tur", "Soyabean" etc. to a region crop
export function findRegionCrop(name = '') {
    const v = String(name).toLowerCase().replace(/[()]/g, ' ').trim();
    if (!v) return null;
    return REGION_CROPS.find(c => {
        const n = c.name.toLowerCase().replace(/[()]/g, ' ');
        return n === v || n.split(/\s+/).includes(v.split(/\s+/)[0]) ||
            c.commodities.some(cm => cm.toLowerCase() === v || cm.toLowerCase().startsWith(v.split(/\s+/)[0]));
    }) || null;
}

export function findCropByCommodity(commodity = '') {
    const v = String(commodity).toLowerCase();
    return REGION_CROPS.find(c => c.commodities.some(cm => cm.toLowerCase() === v)) || null;
}

// Estimated transport freight cost assumptions per vehicle for rural Maharashtra APMC routes.
// Formula: trip_cost = (distance_km * rate_per_km) + fixed_loading_charge
export const TRANSPORT_VEHICLE_CONFIGS = {
    'Tempo 2-Ton': {
        capacity_quintal: 20,
        rate_per_km: 18, // ₹ per km
        fixed_charge: 500, // loading & gate fee estimate (₹)
        label: 'Tempo (2-Ton / 20 q)'
    },
    'Eicher 10-Ton Container': {
        capacity_quintal: 100,
        rate_per_km: 32, // ₹ per km
        fixed_charge: 1200, // loading & handling estimate (₹)
        label: 'Eicher (10-Ton / 100 q)'
    },
    'Ashok Leyland 12-Ton': {
        capacity_quintal: 120,
        rate_per_km: 38, // ₹ per km
        fixed_charge: 1500,
        label: 'Ashok Leyland (12-Ton / 120 q)'
    },
    'Tata 16-Ton Multi-axle': {
        capacity_quintal: 160,
        rate_per_km: 48, // ₹ per km
        fixed_charge: 2000,
        label: 'Tata Multi-axle (16-Ton / 160 q)'
    }
};

/**
 * Calculates estimated freight costs and savings per quintal for a given farmer quantity.
 * solo cost per quintal = (vehicle full-trip cost) / (my quantity)
 * pooled cost per quintal = vehicle full-trip cost / total pooled quantity
 */
export function calculateFreightEconomics({
    vehicleType = 'Eicher 10-Ton Container',
    pickupDistrict = 'Nashik',
    destinationDistrict = 'Mumbai Suburban',
    currentProduceQuintal = 0,
    farmerQuantity = 25
}) {
    const vConfig = TRANSPORT_VEHICLE_CONFIGS[vehicleType] || TRANSPORT_VEHICLE_CONFIGS['Eicher 10-Ton Container'];
    const distanceKm = Math.max(estimateRoadDistanceKm(pickupDistrict, destinationDistrict) || 50, 15);
    const qty = Math.max(Number(farmerQuantity) || 1, 1);

    // Full trip cost for the vehicle
    const fullTripCost = Math.round((distanceKm * vConfig.rate_per_km) + vConfig.fixed_charge);

    // Solo cost per quintal: if the farmer hired the truck solo for their produce
    const soloCostPerQuintal = Math.round(fullTripCost / qty);

    // Total produce loaded if this farmer joins
    const totalProduce = Math.min(
        Math.max(Number(currentProduceQuintal) + qty, qty),
        vConfig.capacity_quintal
    );

    // Pooled freight rate per quintal: total vehicle trip cost divided by total pooled volume
    const pooledCostPerQuintal = Math.max(Math.round(fullTripCost / totalProduce), 15);

    const savingsPerQuintal = Math.max(soloCostPerQuintal - pooledCostPerQuintal, 0);
    const totalSavings = Math.round(savingsPerQuintal * qty);
    const savingsPercentage = soloCostPerQuintal > 0 ? Math.round((savingsPerQuintal / soloCostPerQuintal) * 100) : 0;

    return {
        distanceKm,
        fullTripCost,
        soloCostPerQuintal,
        pooledCostPerQuintal,
        savingsPerQuintal,
        totalSavings,
        savingsPercentage,
        isEstimate: true,
        formula: `~${distanceKm} km × ₹${vConfig.rate_per_km}/km + ₹${vConfig.fixed_charge} loading fee = ₹${fullTripCost} total. Solo: ₹${fullTripCost} ÷ ${qty}q = ₹${soloCostPerQuintal}/q. Pooled: ₹${fullTripCost} ÷ ${totalProduce}q = ₹${pooledCostPerQuintal}/q.`
    };
}
