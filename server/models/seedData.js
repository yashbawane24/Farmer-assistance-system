import { getDb, saveDb, query, run } from './db.js';

export async function seedDatabase() {
    console.log('🌱 Checking and seeding agricultural database...');
    await getDb();

    const existingUsers = await query("SELECT COUNT(*) as count FROM users");
    if (existingUsers[0]?.count > 0) {
        console.log('⚡ Database already seeded. Skipping initial seed.');
        return;
    }

    console.log('🌾 Populating authentic Indian agricultural data...');

    // 1. Users
    await run(`INSERT INTO users (id, email, password_hash, full_name, role) VALUES 
        (1, 'ramesh@sfas.in', 'demo123', 'Ramesh Patil', 'farmer'),
        (2, 'rajesh@sfas.in', 'demo123', 'Rajesh Sharma', 'farmer');`);

    // 2. Farmer Profiles
    await run(`INSERT INTO farmer_profiles (id, user_id, phone, district, state, language_pref, farmer_type) VALUES 
        (1, 1, '+91 98220 12345', 'Nashik', 'Maharashtra', 'mr', 'Smallholder (< 2 Ha)'),
        (2, 2, '+91 94160 54321', 'Karnal', 'Haryana', 'hi', 'Progressive (> 5 Ha)');`);

    // 3. Farms
    await run(`INSERT INTO farms (id, farmer_profile_id, farm_name, land_size_acres, soil_type, water_source, water_reliability, current_crop, crop_stage, sowing_date) VALUES 
        (1, 1, 'Patil Farm Plot 1', 2.2, 'Black Soil (Regur)', 'Borewell & Drip', 'Moderately Reliable', 'Tomato', 'Flowering to Fruit Set', '2026-08-10'),
        (2, 2, 'Karnal Green Acre', 9.5, 'Alluvial Loam', 'Canal & Tubewell', 'Very Reliable', 'Wheat', 'Vegetative Stage', '2026-11-05');`);

    // 4. Crops with agronomic requirements and economics
    await run(`INSERT INTO crops (id, name, scientific_name, category, ideal_season, duration_days, water_req_mm, ideal_soil, expected_yield_quintal_acre, avg_input_cost_acre, historical_avg_price_quintal, market_volatility_score, water_risk_score, input_risk_score) VALUES 
        (1, 'Tomato', 'Solanum lycopersicum', 'Vegetable', 'Kharif / Rabi', 110, 500, 'Black Soil (Regur)', 120, 38000, 2150, 'High', 'Medium', 'Medium'),
        (2, 'Onion', 'Allium cepa', 'Vegetable', 'Rabi / Late Kharif', 130, 450, 'Alluvial / Medium Black', 90, 32000, 2400, 'High', 'Low', 'Medium'),
        (3, 'Wheat', 'Triticum aestivum', 'Cereal', 'Rabi', 125, 400, 'Alluvial Loam', 22, 16500, 2425, 'Low', 'Low', 'Low'),
        (4, 'Rice (Paddy)', 'Oryza sativa', 'Cereal', 'Kharif', 135, 1100, 'Clay Loam / Alluvial', 26, 21000, 2300, 'Low', 'High', 'Low'),
        (5, 'Cotton', 'Gossypium hirsutum', 'Commercial', 'Kharif', 160, 650, 'Deep Black Cotton Soil', 11, 26000, 6800, 'Medium', 'Medium', 'High'),
        (6, 'Green Chilli', 'Capsicum annuum', 'Spices', 'Kharif / Summer', 140, 550, 'Well-drained Loam', 45, 42000, 4600, 'High', 'Medium', 'High'),
        (7, 'Potato', 'Solanum tuberosum', 'Horticulture', 'Rabi', 95, 400, 'Sandy Loam', 105, 34000, 1650, 'Medium', 'Low', 'Medium'),
        (8, 'Soybean', 'Glycine max', 'Oilseed', 'Kharif', 100, 450, 'Medium Black Loam', 10, 14000, 4400, 'Medium', 'Low', 'Low'),
        (9, 'Maize', 'Zea mays', 'Cereal / Fodder', 'Kharif / Rabi', 105, 500, 'Alluvial / Red Loam', 28, 17500, 2100, 'Low', 'Low', 'Low');`);

    // 5. Mandis
    await run(`INSERT INTO mandis (id, name, district, state, distance_km, freight_rate_per_km_quintal, mandi_handling_fee_per_quintal, contact_phone, operating_days) VALUES 
        (1, 'Nashik Main APMC Market', 'Nashik', 'Maharashtra', 18.5, 1.65, 30.0, '+91 253 251234', 'Mon-Sat'),
        (2, 'Lasalgaon APMC (Asia Largest Onion Yard)', 'Nashik', 'Maharashtra', 52.0, 1.75, 35.0, '+91 2550 266200', 'Mon-Sat'),
        (3, 'Pune APMC Gultekdi Market Yard', 'Pune', 'Maharashtra', 162.0, 1.85, 40.0, '+91 20 24261234', 'Daily'),
        (4, 'Vashi APMC (Navi Mumbai Terminal)', 'Mumbai Suburban', 'Maharashtra', 188.0, 2.10, 45.0, '+91 22 27888000', 'Mon-Sat'),
        (5, 'Azadpur APMC National Market', 'North Delhi', 'Delhi', 345.0, 2.35, 50.0, '+91 11 27691234', 'Daily'),
        (6, 'Karnal Grain & Subzi Mandi', 'Karnal', 'Haryana', 11.5, 1.50, 25.0, '+91 184 2251122', 'Mon-Sat');`);

    // 6. Mandi Prices
    await run(`INSERT INTO mandi_prices (mandi_id, crop_id, modal_price_quintal, min_price_quintal, max_price_quintal, arrival_quantity_tonnes, price_date) VALUES 
        -- Tomato Prices
        (1, 1, 2180, 1750, 2450, 145.0, '2026-09-20'),
        (2, 1, 2050, 1600, 2300, 85.0, '2026-09-20'),
        (3, 1, 2360, 1900, 2600, 310.0, '2026-09-20'),
        (4, 1, 2680, 2200, 2950, 520.0, '2026-09-20'),
        -- Onion Prices
        (1, 2, 2650, 2100, 2900, 240.0, '2026-09-20'),
        (2, 2, 2880, 2350, 3200, 980.0, '2026-09-20'),
        (3, 2, 2790, 2250, 3050, 420.0, '2026-09-20'),
        (4, 2, 3120, 2600, 3450, 750.0, '2026-09-20'),
        -- Wheat Prices
        (6, 3, 2450, 2380, 2520, 410.0, '2026-09-20'),
        (5, 3, 2580, 2450, 2680, 890.0, '2026-09-20'),
        -- Chilli Prices
        (1, 6, 4400, 3800, 4800, 65.0, '2026-09-20'),
        (3, 6, 4750, 4100, 5200, 110.0, '2026-09-20'),
        (4, 6, 5100, 4500, 5600, 195.0, '2026-09-20');`);

    // 7. Transport Logistics Pools
    await run(`INSERT INTO transport_pools (id, mandi_id, crop_id, scheduled_date, pickup_hub, current_produce_quintal, capacity_quintal, vehicle_type, individual_freight_rate, pooled_freight_rate, savings_percentage, status) VALUES 
        (1, 4, 1, '2026-09-24', 'Dindori Phata Farm Hub (Nashik)', 65.0, 100.0, 'Eicher 10-Ton Container', 395.0, 245.0, 38.0, 'Open'),
        (2, 2, 2, '2026-09-25', 'Pimpalgaon Baswant Hub', 140.0, 160.0, 'Tata 16-Ton Multi-axle', 125.0, 80.0, 36.0, 'Open'),
        (3, 5, 3, '2026-09-26', 'Taraori Grain Hub (Karnal)', 110.0, 120.0, 'Ashok Leyland 12-Ton', 320.0, 210.0, 34.4, 'Open');`);

    // 8. Transport Pool Members
    await run(`INSERT INTO transport_pool_members (pool_id, farmer_name, phone, produce_quantity_quintal) VALUES 
        (1, 'Bhaskar Rao Shinde', '+91 98221 00112', 25.0),
        (1, 'Suresh Kadam', '+91 98221 33445', 20.0),
        (1, 'Ganesh Gaikwad', '+91 98221 77889', 20.0),
        (2, 'Vilas Deshmukh', '+91 94230 11223', 60.0),
        (2, 'Navnath More', '+91 94230 44556', 80.0);`);

    // 9. Weather Records
    await run(`INSERT INTO weather_records (district, record_date, temp_max_c, temp_min_c, humidity_percent, rainfall_prob_percent, wind_speed_kmh, condition, agro_summary) VALUES 
        ('Nashik', '2026-09-21', 29.4, 21.2, 84.0, 75.0, 14.0, 'Moderate Rain & Overcast', 'Rain expected by afternoon. Delay irrigation and pesticide spraying until canopy dries.'),
        ('Nashik', '2026-09-22', 28.0, 20.5, 88.0, 80.0, 16.5, 'Heavy Showers Expected', 'High risk of waterlogging in low-lying plots. Inspect field drainage furrows.'),
        ('Nashik', '2026-09-23', 30.1, 21.0, 78.0, 35.0, 12.0, 'Partly Cloudy', 'Humidity tapering down. Good window for preventative bio-fungicide spray.'),
        ('Nashik', '2026-09-24', 31.5, 21.8, 68.0, 15.0, 10.0, 'Pleasant Sunshine', 'Favorable weather for harvesting tomato and onion sorting.'),
        ('Nashik', '2026-09-25', 32.0, 22.0, 62.0, 10.0, 9.0, 'Clear Skies', 'Optimal conditions for transport logistics and field cultivation.'),
        ('Karnal', '2026-09-21', 33.5, 24.0, 65.0, 20.0, 11.0, 'Clear & Sunny', 'Soil moisture adequate for vegetative growth. Normal field routine.');`);

    // 10. Agro-Meteorological Preventative Alerts
    await run(`INSERT INTO alerts (district, crop_name, crop_stage, alert_type, severity, title, message, action_required, trigger_condition, is_active) VALUES 
        ('Nashik', 'Tomato', 'Flowering to Fruit Set', 'Fungal Early Blight Risk', 'Critical', 'Elevated Fungal Blight Risk (Rain + 88% Humidity)', 'Continuous damp conditions and warm temperatures create optimal incubation for Alternaria solani (Early Blight). Flowering plants are vulnerable to blossom drop.', '1. Check and clear drainage furrows before afternoon rain.\\n2. Remove severely spotted lower leaves touching damp soil.\\n3. Spray bio-fungicide (Trichoderma viride 5g/L) or preventative Mancozeb (2g/L) as soon as rain pauses.', 'Humidity > 80% AND Rain Probability > 70% during Flowering stage', 1),
        ('Nashik', 'Onion', 'Bulb Development', 'Purple Blotch Warning', 'Advisory', 'Dew & Moisture Alert for Standing Onion Crop', 'Night condensation accompanied by daytime heat creates conditions for Alternaria porri (Purple blotch).', 'Avoid overhead sprinkler irrigation in late afternoon. Ensure proper spacing between rows to improve air ventilation.', 'Night condensation + temperature swing > 10°C', 1),
        ('Karnal', 'Wheat', 'Vegetative Stage', 'Armyworm Vigilance', 'Advisory', 'Favorable Weather for Nocturnal Foliage Pests', 'Warm humid breeze may encourage early leaf defoliation.', 'Install pheromone traps (4 per acre) to monitor insect activity. No chemical spray needed unless threshold exceeds 1 larva per plant.', 'Warm night winds from southeast', 1);`);

    // 11. Government Schemes
    await run(`INSERT INTO government_schemes (scheme_name, nodal_ministry, beneficiary_criteria, benefits_summary, financial_assistance, application_process, required_documents, official_portal_url, target_crops, eligible_land_category) VALUES 
        ('PM-KISAN Samman Nidhi', 'Ministry of Agriculture & Farmers Welfare', 'All landholding farmer families with cultivable land in their name.', 'Direct income support of ₹6,000 per year in 3 equal installments of ₹2,000 directly transferred to bank accounts via DBT.', '₹6,000 / year (Direct Bank Transfer)', '1. Visit pmkisan.gov.in or nearest Common Service Centre (CSC).\\n2. Complete Farmer eKYC using Aadhaar OTP.\\n3. Link Land Record 7/12 or Jamabandi with your Aadhaar.', 'Aadhaar Card, Land Record Copy (7/12 or Jamabandi), Active Bank Passbook with DBT linkage', 'https://pmkisan.gov.in', 'All Crops', 'All Farmers (Small, Marginal, Medium)'),
        ('Pradhan Mantri Fasal Bima Yojana (PMFBY)', 'Ministry of Agriculture & Farmers Welfare', 'Farmers growing notified crops in notified areas, both loanee and non-loanee.', 'Comprehensive insurance coverage against non-preventable natural risks (drought, flood, unseasonal hail, pest outbreak).', 'Premium subsidy up to 90%. Farmer pays only 1.5% for Rabi, 2% for Kharif, 5% for commercial/horticultural crops.', '1. Register via National Crop Insurance Portal (pmfby.gov.in) or your local bank branch within 14 days of sowing.\\n2. Submit sowing certificate issued by Patwari/Village Officer.', 'Land Possession Certificate, Sowing Certificate, Aadhaar, Bank Account statement', 'https://pmfby.gov.in', 'Food Crops, Oilseeds, Commercial Crops', 'Small and Marginal Farmers given priority claim settlement'),
        ('Soil Health Card Scheme', 'Department of Agriculture & Farmers Welfare', 'All farmers owning or cultivating agricultural land.', 'Provides customized soil nutrient analysis (N, P, K, micronutrients, pH) and precise fertilizer dosage recommendations to reduce input costs by up to 25%.', 'Free soil sample collection, testing, and periodic 3-year advisory card generation.', '1. Agricultural extension worker or Krishi Mitra collects field soil samples.\\n2. Samples tested at district Soil Testing Lab.\\n3. Receive card at Village Gram Sabha or download via soilhealth.dac.gov.in.', 'Aadhaar Card, Mobile Number, Land Survey Number', 'https://soilhealth.dac.gov.in', 'All Crops', 'Universal coverage across all land categories'),
        ('Per Drop More Crop (PM Krishi Sinchayee Yojana)', 'Ministry of Jal Shakti & Agriculture', 'Farmers adopting Micro Irrigation (Drip and Sprinkler systems).', 'Subsidies up to 55% for small/marginal farmers and 45% for other farmers for installing micro-irrigation systems to cut water consumption by 40-50%.', 'Up to 55% subsidy on total capital cost of drip / sprinkler irrigation equipment.', 'Apply through state agriculture portal (e.g., MahaDBT in Maharashtra, Saral Portal in Haryana) with water test report.', 'Land 7/12 extract, Water Source Certificate, Electricity bill or NOC, Bank passbook', 'https://pmksy.gov.in', 'Horticulture, Vegetables, Sugarcane, Cotton', 'Small & Marginal Farmers (< 2 Ha)');`);

    // 12. Knowledge Documents for RAG Agronomist
    await run(`INSERT INTO knowledge_documents (topic, crop_name, keywords, content) VALUES 
        ('Tomato Early Blight', 'Tomato', 'early blight, yellow leaves, dark concentric rings, alternaria solani, leaf spots, tomato disease', 'Early blight is caused by the fungus Alternaria solani. Symptoms first appear on older leaves as small, brown-to-black spots that enlarge into concentric target-like rings surrounded by a yellow halo. Cultural control: Remove lower leaves touching the soil, water at the base to avoid wetting leaves, maintain 60cm row spacing for airflow. Biological control: Foliar spray of Trichoderma viride or Pseudomonas fluorescens at 5g per liter. Chemical control: If disease persists, apply Mancozeb 75% WP @ 2g/L or Chlorothalonil @ 2g/L at 7-10 day intervals. Always adhere to a 5-day pre-harvest interval.'),
        ('Tomato Blossom Drop & Wilting', 'Tomato', 'flower drop, blossom drop, yellow flowers falling, high humidity, heat stress', 'Tomato blossom drop occurs when temperatures exceed 32°C daytime or drop below 13°C at night, or during periods of excessive rainfall and high humidity (>85%) which makes pollen sticky and prevents pollination. Remedies: Postpone excessive nitrogen fertilizers during flowering (which causes vegetative overgrowth). Spray Planofix (Alpha Naphthyl Acetic Acid) at 1ml per 4.5 liters of water during peak flowering to stimulate fruit setting. Ensure field drains rapidly after heavy rain.'),
        ('Onion Purple Blotch', 'Onion', 'purple blotch, alternaria porri, onion tip burn, water-soaked spots, onion disease', 'Purple blotch is characterized by small, water-soaked lesions that quickly develop a purple center surrounded by a yellow border. Favorable conditions: Temperatures of 21-30°C and relative humidity above 80%. Preventative action: Treat onion seedlings with Trichoderma viride @ 5g/kg before transplanting. Apply Mancozeb 75 WP @ 2.5g/L + sticker (Teepol 1ml/L) when symptoms first emerge on outer leaves.'),
        ('Wheat Yellow Rust (Stripe Rust)', 'Wheat', 'yellow rust, stripe rust, yellow powder, puccinia striiformis, wheat leaves yellow stripe', 'Yellow rust produces bright yellow pustules arranged in characteristic parallel stripes along leaf blades. When touched, yellow powdery spores rub off onto fingers. Weather trigger: Cool humid temperatures (10-18°C) with morning dew. Management: Monitor field boundaries in December-January. At first appearance, immediately spray Propiconazole 25% EC (Tilt) @ 1ml per liter of water (200ml per 200 liters of water per acre). Repeat after 15 days if cool humid conditions continue.'),
        ('Cost Effective Pest Control & Neem Extract', 'All Crops', 'organic pest control, neem oil, biopesticide, sucking pests, aphids, whiteflies, thrips', 'Neem Seed Kernel Extract (NSKE 5%) is an organic anti-feedant and repellent against sucking pests (aphids, thrips, whiteflies, jassids). Preparation: Grind 50g of dried neem seeds, soak in 1 liter of water overnight, filter through muslin cloth, and mix with 1ml liquid soap before spraying. Spray in early morning or late evening. Cost is less than ₹150 per acre compared to chemical insecticides costing ₹600-₹900.'),
        ('Drainage and Post-Rain Farm Recovery', 'All Crops', 'waterlogging, drainage, soil aeration, root rot prevention, heavy rain recovery', 'Standing water suffocates crop root zones within 24-48 hours, causing yellowing and bacterial soft rot. Immediate field steps: 1. Excavate emergency release furrows at plot corners. 2. Once surface water recedes, shallowly hoe the topsoil to break the surface crust and restore oxygen to root zones. 3. Drench root zones with Trichoderma viride (10g/L) to prevent Phytophthora and Pythium root rot. 4. Avoid heavy tractor movements while soil is saturated to prevent soil compaction.');`);

    saveDb();
    console.log('✅ Agricultural database seeding complete with 12 tables and authentic Indian agronomic data!');
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seedData.js')) {
    seedDatabase().catch(err => {
        console.error('Seed error:', err);
        process.exit(1);
    });
}
