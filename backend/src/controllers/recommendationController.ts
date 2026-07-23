import { Request, Response } from 'express';

interface CropDetail {
  name: string;
  expectedYield: string; // e.g. "20-25 Quintals/Acre"
  profitEstimation: number; // in Rs. per acre
  growingTime: number; // months
  suitableFertilizer: string;
  advantages: string[];
  description: string;
}

// Extensive crop database matching combinations of Soil, Season, and Water Availability
const CROP_DATABASE: Record<string, CropDetail[]> = {
  'Clayey_Kharif_High': [
    {
      name: 'Rice (Paddy)',
      expectedYield: '18-22 Quintals/Acre',
      profitEstimation: 28000,
      growingTime: 4,
      suitableFertilizer: 'N-P-K (120:60:40) kg/ha + Zinc Sulphate',
      advantages: ['High market demand', 'Thrives in waterlogged conditions', 'Crop insurance protection available'],
      description: 'Rice is the primary food crop in high rainfall/water-available regions. Clayey soil retains water perfectly for paddy fields.'
    },
    {
      name: 'Sugarcane',
      expectedYield: '300-350 Quintals/Acre',
      profitEstimation: 45000,
      growingTime: 12,
      suitableFertilizer: 'N-P-K (250:75:75) kg/ha + Organic compost',
      advantages: ['Extremely high profit margins', 'Resistant to mild wind variations', 'Assured purchase centers (sugar mills)'],
      description: 'Long duration commercial crop requiring substantial water availability. Yields are highly stable.'
    }
  ],
  'Black_Kharif_Medium': [
    {
      name: 'Cotton',
      expectedYield: '8-10 Quintals/Acre',
      profitEstimation: 35000,
      growingTime: 6,
      suitableFertilizer: 'N-P-K (80:40:40) kg/ha',
      advantages: ['Cash crop with high liquidity', 'Ideal moisture-retentive properties of black soil', 'Compatible with intercropping (e.g. pulses)'],
      description: 'Cotton requires deep moisture retention which black cotton soil (regur) provides natively.'
    },
    {
      name: 'Soybean',
      expectedYield: '8-12 Quintals/Acre',
      profitEstimation: 24000,
      growingTime: 4,
      suitableFertilizer: 'N-P-K (20:60:40) kg/ha',
      advantages: ['Short harvest window', 'Enriches soil nitrogen content', 'Very high domestic oilseed demand'],
      description: 'Excellent leguminous crop that thrives in black clayey/loamy soil during the rainy season.'
    }
  ],
  'Alluvial_Rabi_Medium': [
    {
      name: 'Wheat',
      expectedYield: '15-18 Quintals/Acre',
      profitEstimation: 30000,
      growingTime: 5,
      suitableFertilizer: 'N-P-K (120:60:40) kg/ha',
      advantages: ['Stable government MSP (Minimum Support Price)', 'Relatively low pest incidence', 'Valuable fodder bypass production'],
      description: 'The staple grain crop for the Rabi season. Fits alluvial soil basins perfectly under irrigation.'
    },
    {
      name: 'Mustard',
      expectedYield: '6-8 Quintals/Acre',
      profitEstimation: 26000,
      growingTime: 4,
      suitableFertilizer: 'N-P-K (80:40:40) kg/ha',
      advantages: ['Low water requirement', 'Excellent resistance to dry spells', 'High price premium in regional markets'],
      description: 'Oilseed crop suitable for Rabi season. Requires fewer irrigation passes compared to Wheat.'
    }
  ],
  'Sandy_Rabi_Low': [
    {
      name: 'Gram (Chickpea)',
      expectedYield: '5-7 Quintals/Acre',
      profitEstimation: 18000,
      growingTime: 4,
      suitableFertilizer: 'N-P-K (20:40:20) kg/ha',
      advantages: ['Highly drought resistant', 'Needs minimal chemical inputs', 'Improves soil fertility'],
      description: 'Pulses like Gram are well suited to sandy soils with low water constraints during dry winter seasons.'
    }
  ],
  'Sandy_Zaid_Low': [
    {
      name: 'Watermelon',
      expectedYield: '80-100 Quintals/Acre',
      profitEstimation: 32000,
      growingTime: 3,
      suitableFertilizer: 'N-P-K (60:40:60) kg/ha + Farm Yard Manure',
      advantages: ['Fast growing cash crop', 'Highly suited for sandy river beds', 'High summer consumer demand'],
      description: 'Summer crop with high water retention properties internally. Thrives in dry sandy areas with localized drip watering.'
    }
  ],
  'Loamy_Kharif_Medium': [
    {
      name: 'Maize (Corn)',
      expectedYield: '15-20 Quintals/Acre',
      profitEstimation: 22000,
      growingTime: 4,
      suitableFertilizer: 'N-P-K (120:60:40) kg/ha',
      advantages: ['Dual usage (human consumption + poultry fodder)', 'Adaptable to variable rain patterns', 'Mechanized harvesting compatible'],
      description: 'Maize is a versatile crop that requires well-drained loamy soils. Sensitive to waterlogging.'
    }
  ]
};

// Generic crops for entries not explicitly covered in primary combinations
const GENERIC_CROPS: CropDetail[] = [
  {
    name: 'Pearl Millet (Bajra)',
    expectedYield: '6-8 Quintals/Acre',
    profitEstimation: 15000,
    growingTime: 3,
    suitableFertilizer: 'N-P-K (40:20:0) kg/ha',
    advantages: ['Extremely low water footprint', 'Succeeds in marginal/poor soils', 'Excellent nutrient content'],
    description: 'A millet crop that resists extreme temperatures and fits low budget, rain-deficit scenarios.'
  },
  {
    name: 'Groundnut',
    expectedYield: '8-10 Quintals/Acre',
    profitEstimation: 25000,
    growingTime: 4,
    suitableFertilizer: 'N-P-K (25:50:75) kg/ha + Gypsum',
    advantages: ['Nitrogen fixing legume', 'High oil and protein content', 'Stable market pricing'],
    description: 'Requires loose sandy loam soil to facilitate easy pod formation and harvesting.'
  }
];

export const getRecommendation = async (req: Request, res: Response) => {
  try {
    const { state, district, season, soilType, farmSize, waterAvailability, budget } = req.body;

    if (!season || !soilType || !waterAvailability || !farmSize) {
      return res.status(400).json({ success: false, message: 'Missing parameters for recommendation calculation' });
    }

    const acres = parseFloat(farmSize);
    const lookupKey = `${soilType}_${season}_${waterAvailability}`;
    let recommended: CropDetail[] = CROP_DATABASE[lookupKey] || [];

    if (recommended.length === 0) {
      // Fallback matching to find at least some crops
      if (season === 'Kharif') {
        recommended = [CROP_DATABASE['Black_Kharif_Medium'][1], GENERIC_CROPS[1]];
      } else if (season === 'Rabi') {
        recommended = [CROP_DATABASE['Alluvial_Rabi_Medium'][0], CROP_DATABASE['Sandy_Rabi_Low'][0]];
      } else {
        recommended = [CROP_DATABASE['Sandy_Zaid_Low'][0], GENERIC_CROPS[0]];
      }
    }

    // Scale yields and profits by farm size (acres)
    const results = recommended.map((crop) => {
      const perAcreProfit = crop.profitEstimation;
      const totalEstimatedProfit = perAcreProfit * acres;

      // Adjust yield string for total farm size
      const yieldMatch = crop.expectedYield.match(/^(\d+)-(\d+)/);
      let totalYieldStr = crop.expectedYield;
      if (yieldMatch) {
        const minYield = parseInt(yieldMatch[1]) * acres;
        const maxYield = parseInt(yieldMatch[2]) * acres;
        totalYieldStr = `${minYield.toFixed(0)}-${maxYield.toFixed(0)} Quintals (Total for ${acres} Acres)`;
      }

      return {
        cropName: crop.name,
        expectedYield: totalYieldStr,
        profitEstimationPerAcre: perAcreProfit,
        totalProfitEstimation: totalEstimatedProfit,
        growingTimeMonths: crop.growingTime,
        suitableFertilizer: crop.suitableFertilizer,
        advantages: crop.advantages,
        description: crop.description
      };
    });

    res.status(200).json({
      success: true,
      parameters: {
        state,
        district,
        season,
        soilType,
        farmSize: acres,
        waterAvailability,
        budget: budget ? parseInt(budget) : undefined
      },
      recommendations: results
    });

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
