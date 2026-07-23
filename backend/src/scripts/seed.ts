import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Scheme from '../models/Scheme';
import MarketPrice from '../models/MarketPrice';
import Notification from '../models/Notification';
import User from '../models/User';
import bcrypt from 'bcryptjs';

dotenv.config();

const schemes = [
  {
    title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    category: 'Financial Assistance',
    overview: 'An initiative by the Government of India that provides up to Rs 6,000 per year in three equal installments to all small and marginal landholding farmer families as minimum income support.',
    eligibility: [
      'All landholding farmers families who own cultivable land in their names.',
      'Small and marginal farmers holding land below 2 hectares.'
    ],
    benefits: [
      'Direct financial support of Rs. 6,000 per annum paid in 3 installments.',
      'Direct benefit transfer (DBT) directly into the farmers bank accounts to avoid middlemen.'
    ],
    documentsRequired: [
      'Aadhaar Card',
      'Land Ownership Certificates / Land Revenue Records',
      'Bank Account Passbook details',
      'Active Mobile Number linked to Aadhaar'
    ],
    applicationProcess: 'Apply online through the PM-Kisan portal (pmkisan.gov.in) or visit the nearest Common Service Centre (CSC) to submit the physical files.',
    link: 'https://pmkisan.gov.in/'
  },
  {
    title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    category: 'Crop Insurance',
    overview: 'A government-sponsored crop insurance scheme that integrates multiple stakeholders to protect farmers from crop yields failure due to natural calamities, pests, and diseases.',
    eligibility: [
      'All farmers including sharecroppers and tenant farmers growing notified crops in notified areas.',
      'Voluntary participation for non-loanee farmers; auto-enrolled for loanee farmers.'
    ],
    benefits: [
      'Very low premium rates: 2.0% for Kharif crops, 1.5% for Rabi crops, and 5% for commercial/horticultural crops.',
      'Full financial protection against localized calamities, post-harvest losses, and prevented sowing.'
    ],
    documentsRequired: [
      'Land Records (7/12 extract or Khata Uni)',
      'Sowing Certificate signed by local Patwari or Agriculture Officer',
      'Canceled Bank Cheque or Bank Passbook copy',
      'Identity Proof (Aadhaar or Voter ID)'
    ],
    applicationProcess: 'Submit your crop insurance application directly on the National Crop Insurance Portal (pmfby.gov.in), through your lending bank, or via licensed insurance brokers.',
    link: 'https://pmfby.gov.in/'
  },
  {
    title: 'Kisan Credit Card (KCC) Scheme',
    category: 'Agricultural Credit',
    overview: 'Designed to save farmers from high interest rates charged by non-institutional lenders, providing credit cards for cultivation, crop management, and domestic consumption needs.',
    eligibility: [
      'Owner cultivators, joint borrowers, tenant farmers, and oral lessees.',
      'Self Help Groups (SHGs) or Joint Liability Groups (JLGs) of farmers.'
    ],
    benefits: [
      'Low interest rates of 2% to 4% (after prompt repayment subsidies).',
      'Flexible repayment schedules matching crop harvesting seasons.',
      'Inbuilt insurance coverage against accidental death or permanent disability.'
    ],
    documentsRequired: [
      'Completed KCC application form',
      'Identity Proof and Address Proof (Aadhaar, Passport, PAN card)',
      'Land revenue document verified by local authority',
      'Crop sowing certificate'
    ],
    applicationProcess: 'Visit any public sector or regional rural bank and fill out the physical KCC Application form alongside land papers.',
    link: 'https://www.sbi.co.in/'
  },
  {
    title: 'Soil Health Card Scheme',
    category: 'Soil Care',
    overview: 'Promoted by the Ministry of Agriculture, this card helps farmers analyze nutrient deficiencies in their fields and suggests exact dosage of nitrogen, phosphorus, potash, and micronutrients.',
    eligibility: [
      'All farmers holding operational cultivable land holdings across the country.'
    ],
    benefits: [
      'Customized recommendations for 12 essential nutrients.',
      'Reduces fertilizer waste and improves crop yield margins.',
      'Helps choose the right type of crops based on chemical and physical structure of soil.'
    ],
    documentsRequired: [
      'Farmer identity card',
      'Soil sample survey code (issued by collection officer)',
      'Land location coordinates'
    ],
    applicationProcess: 'Agricultural extension officers visit fields to collect samples, test them in district labs, and print cards. Farmers can also download them from soilhealth.dac.gov.in.',
    link: 'https://soilhealth.dac.gov.in/'
  }
];

const marketPrices = [
  {
    cropName: 'Wheat',
    marketName: 'Indore Mandi',
    state: 'Madhya Pradesh',
    district: 'Indore',
    todayPrice: 2450,
    yesterdayPrice: 2420,
    weeklyTrend: [2380, 2390, 2410, 2400, 2415, 2420, 2450],
    monthlyTrend: [2300, 2350, 2400, 2450]
  },
  {
    cropName: 'Wheat',
    marketName: 'Lucknow Mandi',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    todayPrice: 2520,
    yesterdayPrice: 2530,
    weeklyTrend: [2490, 2500, 2510, 2530, 2540, 2530, 2520],
    monthlyTrend: [2420, 2460, 2500, 2520]
  },
  {
    cropName: 'Paddy (Rice)',
    marketName: 'Nagpur Mandi',
    state: 'Maharashtra',
    district: 'Nagpur',
    todayPrice: 2180,
    yesterdayPrice: 2150,
    weeklyTrend: [2100, 2120, 2140, 2130, 2145, 2150, 2180],
    monthlyTrend: [2050, 2090, 2130, 2180]
  },
  {
    cropName: 'Cotton',
    marketName: 'Yavatmal Mandi',
    state: 'Maharashtra',
    district: 'Yavatmal',
    todayPrice: 7150,
    yesterdayPrice: 7200,
    weeklyTrend: [7300, 7250, 7220, 7240, 7210, 7200, 7150],
    monthlyTrend: [7400, 7350, 7250, 7150]
  },
  {
    cropName: 'Soybean',
    marketName: 'Indore Mandi',
    state: 'Madhya Pradesh',
    district: 'Indore',
    todayPrice: 4850,
    yesterdayPrice: 4800,
    weeklyTrend: [4720, 4750, 4780, 4790, 4810, 4800, 4850],
    monthlyTrend: [4600, 4700, 4750, 4850]
  },
  {
    cropName: 'Mustard',
    marketName: 'Jaipur Mandi',
    state: 'Rajasthan',
    district: 'Jaipur',
    todayPrice: 5650,
    yesterdayPrice: 5620,
    weeklyTrend: [5580, 5600, 5610, 5590, 5630, 5620, 5650],
    monthlyTrend: [5450, 5500, 5580, 5650]
  },
  {
    cropName: 'Potato',
    marketName: 'Agra Mandi',
    state: 'Uttar Pradesh',
    district: 'Agra',
    todayPrice: 1450,
    yesterdayPrice: 1470,
    weeklyTrend: [1500, 1490, 1480, 1460, 1450, 1470, 1450],
    monthlyTrend: [1600, 1550, 1500, 1450]
  }
];

const seedDB = async () => {
  try {
    const connString = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-farmer';
    await mongoose.connect(connString);
    console.log('Seed: Connected to Database.');

    // Clear existing collections
    await Scheme.deleteMany({});
    await MarketPrice.deleteMany({});
    await Notification.deleteMany({});
    await User.deleteMany({});

    console.log('Database collections cleared.');

    // Insert Schemes
    await Scheme.insertMany(schemes);
    console.log('Government Schemes seeded.');

    // Insert Market Prices
    await MarketPrice.insertMany(marketPrices);
    console.log('Market Prices seeded.');

    // Insert Admin User for testing and control
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    
    const admin = new User({
      name: 'System Admin',
      mobile: '9999999999',
      password: adminPassword,
      state: 'Maharashtra',
      district: 'Pune',
      village: 'Haveli',
      farmSize: 5,
      primaryCrop: 'Sugarcane',
      language: 'en',
      role: 'admin'
    });
    await admin.save();
    console.log('Admin profile created: Mobile=9999999999, Password=admin123');

    // Create a regular user for demonstration
    const userPassword = await bcrypt.hash('farmer123', salt);
    const user = new User({
      name: 'Ramesh Patel',
      mobile: '9876543210',
      password: userPassword,
      state: 'Madhya Pradesh',
      district: 'Indore',
      village: 'Depalpur',
      farmSize: 4,
      primaryCrop: 'Wheat',
      language: 'hi',
      role: 'user'
    });
    await user.save();
    console.log('Demonstration Farmer created: Mobile=9876543210, Password=farmer123');

    // Seed alert broadcasts
    const alerts = [
      {
        userId: 'all',
        title: 'Heavy Rain Warning',
        message: 'Severe thunderstorms and heavy rainfall (>50mm) predicted in central Madhya Pradesh and Maharashtra over the next 48 hours. Secure harvested stocks immediately.',
        type: 'weather'
      },
      {
        userId: 'all',
        title: 'New Subsidy Announced',
        message: 'The Ministry of Agriculture has raised the fertilizer subsidy rate for NPK mixes by 10%. Check the Schemes module for enrollment parameters.',
        type: 'scheme'
      },
      {
        userId: user._id.toString(),
        title: 'Market Alert: Wheat Prices Up',
        message: 'Indore Mandi wheat rates climbed by Rs. 30 per quintal today. Sell alert triggered for prime harvest.',
        type: 'market'
      }
    ];

    await Notification.insertMany(alerts);
    console.log('System notification alerts seeded.');

    console.log('Data Seeding Completed Successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Data seeding failed:', error);
    process.exit(1);
  }
};

seedDB();
