import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, saveDb, query, run, runBatch } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedDatabase() {
    console.log('🌱 Checking and seeding agricultural database...');
    await getDb();

    const existingUsers = await query("SELECT COUNT(*) as count FROM users");
    if (existingUsers[0]?.count > 0) {
        console.log('⚡ Database already seeded. Skipping initial seed.');
        await migrateToMaharashtra();
        await ensureMaharashtraContent();
        await ensureTransportPoolsSchemaAndSeed();
        await ensureMandiBenchmarkPrices();
        saveDb();
        return;
    }

    console.log('🌾 Populating Maharashtra agricultural data...');

    // 1. Users
    await run(`INSERT INTO users (id, email, password_hash, full_name, role) VALUES 
        (1, 'ramesh@sfas.in', 'demo123', 'Ramesh Patil', 'farmer'),
        (2, 'rajesh@sfas.in', 'demo123', 'Rajesh Deshmukh', 'farmer');`);

    // 2. Farmer Profiles
    await run(`INSERT INTO farmer_profiles (id, user_id, phone, district, state, language_pref, farmer_type) VALUES 
        (1, 1, '+91 98220 12345', 'Nashik', 'Maharashtra', 'mr', 'Smallholder (< 2 Ha)'),
        (2, 2, '+91 94220 54321', 'Latur', 'Maharashtra', 'mr', 'Medium (2-5 Ha)');`);

    // 3. Farms
    await run(`INSERT INTO farms (id, farmer_profile_id, farm_name, land_size_acres, soil_type, water_source, water_reliability, current_crop, crop_stage, sowing_date) VALUES 
        (1, 1, 'Patil Farm Plot 1', 2.2, 'Black Soil (Regur)', 'Borewell & Drip', 'Moderately Reliable', 'Tomato', 'Flowering to Fruit Set', '2026-08-10'),
        (2, 2, 'Deshmukh Shivar, Ausa', 6.0, 'Black Soil (Regur)', 'Rain-fed + Farm Pond', 'Mostly Rain-fed', 'Soybean', 'Pod Filling', '2026-06-25');`);

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
        (5, 'Latur APMC (Soybean & Tur Market)', 'Latur', 'Maharashtra', 22.0, 1.85, 35.0, NULL, 'Mon-Sat'),
        (6, 'Yavatmal APMC (Cotton Market)', 'Yavatmal', 'Maharashtra', 18.0, 1.85, 35.0, NULL, 'Mon-Sat');`);

    // 6. Pre-seed verified Maharashtra APMC benchmark mandi prices
    await ensureMandiBenchmarkPrices();

    // 7. Transport Logistics Pools
    await run(`INSERT INTO transport_pools (id, mandi_id, destination_mandi, crop_id, crop_name, scheduled_date, departure_time, pickup_hub, pickup_district, current_produce_quintal, capacity_quintal, vehicle_type, individual_freight_rate, pooled_freight_rate, savings_percentage, status) VALUES 
        (1, 4, 'Vashi APMC (Navi Mumbai Terminal)', 1, 'Tomato', '2026-10-30', '06:00 AM', 'Dindori Phata Farm Hub (Nashik)', 'Nashik', 65.0, 100.0, 'Eicher 10-Ton Container', 395.0, 245.0, 38.0, 'Open'),
        (2, 2, 'Lasalgaon APMC (Asia Largest Onion Yard)', 2, 'Onion', '2026-10-31', '05:30 AM', 'Pimpalgaon Baswant Hub', 'Nashik', 140.0, 160.0, 'Tata 16-Ton Multi-axle', 125.0, 80.0, 36.0, 'Open'),
        (3, 5, 'Latur APMC (Soybean & Tur Market)', 8, 'Soybean', '2026-11-02', '07:00 AM', 'Ausa Phata Hub (Latur)', 'Latur', 110.0, 120.0, 'Ashok Leyland 12-Ton', 60.0, 38.0, 36.7, 'Open');`);

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
        ('Latur', '2026-09-21', 31.5, 22.0, 70.0, 30.0, 11.0, 'Partly Cloudy', 'Soil moisture adequate for soybean pod filling. Normal field routine.');`);

    // 10. Agro-Meteorological Preventative Alerts
    await run(`INSERT INTO alerts (district, crop_name, crop_stage, alert_type, severity, title, message, action_required, trigger_condition, is_active) VALUES 
        ('Nashik', 'Tomato', 'Flowering to Fruit Set', 'Fungal Early Blight Risk', 'Critical', 'Elevated Fungal Blight Risk (Rain + 88% Humidity)', 'Continuous damp conditions and warm temperatures create optimal incubation for Alternaria solani (Early Blight). Flowering plants are vulnerable to blossom drop.', '1. Check and clear drainage furrows before afternoon rain.\\n2. Remove severely spotted lower leaves touching damp soil.\\n3. Spray bio-fungicide (Trichoderma viride 5g/L) or preventative Mancozeb (2g/L) as soon as rain pauses.', 'Humidity > 80% AND Rain Probability > 70% during Flowering stage', 1),
        ('Nashik', 'Onion', 'Bulb Development', 'Purple Blotch Warning', 'Advisory', 'Dew & Moisture Alert for Standing Onion Crop', 'Night condensation accompanied by daytime heat creates conditions for Alternaria porri (Purple blotch).', 'Avoid overhead sprinkler irrigation in late afternoon. Ensure proper spacing between rows to improve air ventilation.', 'Night condensation + temperature swing > 10°C', 1),
        ('Latur', 'Soybean', 'Pod Filling', 'Pod Borer & Girdle Beetle Watch', 'Advisory', 'Scout Soybean for Pod Borer and Girdle Beetle', 'Warm humid nights during pod filling favour Helicoverpa pod borer and girdle beetle activity in Marathwada.', 'Install pheromone traps (5 per acre) and bird perches (20 per acre). Spray only if more than 2 larvae per metre row: Chlorantraniliprole 18.5 SC @ 60 ml/acre.', 'Night temperature > 20°C AND humidity > 75% during pod filling', 1);`);

    // 11. Government Schemes
    await run(`INSERT INTO government_schemes (scheme_name, nodal_ministry, beneficiary_criteria, benefits_summary, financial_assistance, application_process, required_documents, official_portal_url, target_crops, eligible_land_category) VALUES 
        ('PM-KISAN Samman Nidhi', 'Ministry of Agriculture & Farmers Welfare', 'All landholding farmer families with cultivable land in their name.', 'Direct income support of ₹6,000 per year in 3 equal installments of ₹2,000 directly transferred to bank accounts via DBT.', '₹6,000 / year (Direct Bank Transfer)', '1. Visit pmkisan.gov.in or nearest Common Service Centre (CSC).\\n2. Complete Farmer eKYC using Aadhaar OTP.\\n3. Link Land Record 7/12 or Jamabandi with your Aadhaar.', 'Aadhaar Card, Land Record Copy (7/12 or Jamabandi), Active Bank Passbook with DBT linkage', 'https://pmkisan.gov.in', 'All Crops', 'All Farmers (Small, Marginal, Medium)'),
        ('Pradhan Mantri Fasal Bima Yojana (PMFBY)', 'Ministry of Agriculture & Farmers Welfare', 'Farmers growing notified crops in notified areas, both loanee and non-loanee.', 'Comprehensive insurance coverage against non-preventable natural risks (drought, flood, unseasonal hail, pest outbreak).', 'Premium subsidy up to 90%. Farmer pays only 1.5% for Rabi, 2% for Kharif, 5% for commercial/horticultural crops.', '1. Register via National Crop Insurance Portal (pmfby.gov.in) or your local bank branch within 14 days of sowing.\\n2. Submit sowing certificate issued by Patwari/Village Officer.', 'Land Possession Certificate, Sowing Certificate, Aadhaar, Bank Account statement', 'https://pmfby.gov.in', 'Food Crops, Oilseeds, Commercial Crops', 'Small and Marginal Farmers given priority claim settlement'),
        ('Soil Health Card Scheme', 'Department of Agriculture & Farmers Welfare', 'All farmers owning or cultivating agricultural land.', 'Provides customized soil nutrient analysis (N, P, K, micronutrients, pH) and precise fertilizer dosage recommendations to reduce input costs by up to 25%.', 'Free soil sample collection, testing, and periodic 3-year advisory card generation.', '1. Agricultural extension worker or Krishi Mitra collects field soil samples.\\n2. Samples tested at district Soil Testing Lab.\\n3. Receive card at Village Gram Sabha or download via soilhealth.dac.gov.in.', 'Aadhaar Card, Mobile Number, Land Survey Number', 'https://soilhealth.dac.gov.in', 'All Crops', 'Universal coverage across all land categories'),
        ('Per Drop More Crop (PM Krishi Sinchayee Yojana)', 'Ministry of Jal Shakti & Agriculture', 'Farmers adopting Micro Irrigation (Drip and Sprinkler systems).', 'Subsidies up to 55% for small/marginal farmers and 45% for other farmers for installing micro-irrigation systems to cut water consumption by 40-50%.', 'Up to 55% subsidy on total capital cost of drip / sprinkler irrigation equipment.', 'Apply on the MahaDBT farmer portal (mahadbt.maharashtra.gov.in) under Irrigation Equipment; wait for pre-sanction before buying the system.', 'Land 7/12 extract, Water Source Certificate, Electricity bill or NOC, Bank passbook', 'https://pmksy.gov.in', 'Horticulture, Vegetables, Sugarcane, Cotton', 'Small & Marginal Farmers (< 2 Ha)');`);

    // 12. Knowledge Documents for RAG Agronomist
    await run(`INSERT INTO knowledge_documents (topic, crop_name, keywords, content) VALUES 
        ('Tomato Early Blight', 'Tomato', 'early blight, yellow leaves, dark concentric rings, alternaria solani, leaf spots, tomato disease', 'Early blight is caused by the fungus Alternaria solani. Symptoms first appear on older leaves as small, brown-to-black spots that enlarge into concentric target-like rings surrounded by a yellow halo. Cultural control: Remove lower leaves touching the soil, water at the base to avoid wetting leaves, maintain 60cm row spacing for airflow. Biological control: Foliar spray of Trichoderma viride or Pseudomonas fluorescens at 5g per liter. Chemical control: If disease persists, apply Mancozeb 75% WP @ 2g/L or Chlorothalonil @ 2g/L at 7-10 day intervals. Always adhere to a 5-day pre-harvest interval.'),
        ('Tomato Blossom Drop & Wilting', 'Tomato', 'flower drop, blossom drop, yellow flowers falling, high humidity, heat stress', 'Tomato blossom drop occurs when temperatures exceed 32°C daytime or drop below 13°C at night, or during periods of excessive rainfall and high humidity (>85%) which makes pollen sticky and prevents pollination. Remedies: Postpone excessive nitrogen fertilizers during flowering (which causes vegetative overgrowth). Spray Planofix (Alpha Naphthyl Acetic Acid) at 1ml per 4.5 liters of water during peak flowering to stimulate fruit setting. Ensure field drains rapidly after heavy rain.'),
        ('Onion Purple Blotch', 'Onion', 'purple blotch, alternaria porri, onion tip burn, water-soaked spots, onion disease', 'Purple blotch is characterized by small, water-soaked lesions that quickly develop a purple center surrounded by a yellow border. Favorable conditions: Temperatures of 21-30°C and relative humidity above 80%. Preventative action: Treat onion seedlings with Trichoderma viride @ 5g/kg before transplanting. Apply Mancozeb 75 WP @ 2.5g/L + sticker (Teepol 1ml/L) when symptoms first emerge on outer leaves.'),
        ('Wheat Yellow Rust (Stripe Rust)', 'Wheat', 'yellow rust, stripe rust, yellow powder, puccinia striiformis, wheat leaves yellow stripe', 'Yellow rust produces bright yellow pustules arranged in characteristic parallel stripes along leaf blades. When touched, yellow powdery spores rub off onto fingers. Weather trigger: Cool humid temperatures (10-18°C) with morning dew. Management: Monitor field boundaries in December-January. At first appearance, immediately spray Propiconazole 25% EC (Tilt) @ 1ml per liter of water (200ml per 200 liters of water per acre). Repeat after 15 days if cool humid conditions continue.'),
        ('Cost Effective Pest Control & Neem Extract', 'All Crops', 'organic pest control, neem oil, biopesticide, sucking pests, aphids, whiteflies, thrips', 'Neem Seed Kernel Extract (NSKE 5%) is an organic anti-feedant and repellent against sucking pests (aphids, thrips, whiteflies, jassids). Preparation: Grind 50g of dried neem seeds, soak in 1 liter of water overnight, filter through muslin cloth, and mix with 1ml liquid soap before spraying. Spray in early morning or late evening. Cost is less than ₹150 per acre compared to chemical insecticides costing ₹600-₹900.'),
        ('Drainage and Post-Rain Farm Recovery', 'All Crops', 'waterlogging, drainage, soil aeration, root rot prevention, heavy rain recovery', 'Standing water suffocates crop root zones within 24-48 hours, causing yellowing and bacterial soft rot. Immediate field steps: 1. Excavate emergency release furrows at plot corners. 2. Once surface water recedes, shallowly hoe the topsoil to break the surface crust and restore oxygen to root zones. 3. Drench root zones with Trichoderma viride (10g/L) to prevent Phytophthora and Pythium root rot. 4. Avoid heavy tractor movements while soil is saturated to prevent soil compaction.');`);

    await ensureMaharashtraContent();

    saveDb();
    console.log('✅ Maharashtra agricultural database seeding complete!');
}

/**
 * Converts databases created by older versions (with Karnal / Delhi demo data and hard-coded mandi prices)
 * to the Maharashtra-only setup. Every statement is safe to run repeatedly.
 */
async function migrateToMaharashtra() {
    // Hard-coded sample prices are replaced by real Agmarknet data
    await run("DELETE FROM mandi_prices");

    await run("UPDATE users SET full_name = 'Rajesh Deshmukh' WHERE email = 'rajesh@sfas.in' AND full_name = 'Rajesh Sharma'");
    await run(`UPDATE farmer_profiles SET district = 'Latur', state = 'Maharashtra', language_pref = 'mr', farmer_type = 'Medium (2-5 Ha)'
               WHERE district = 'Karnal'`);
    await run(`UPDATE farms SET farm_name = 'Deshmukh Shivar, Ausa', land_size_acres = 6.0, soil_type = 'Black Soil (Regur)',
               water_source = 'Rain-fed + Farm Pond', water_reliability = 'Mostly Rain-fed', current_crop = 'Soybean',
               crop_stage = 'Pod Filling', sowing_date = '2026-06-25'
               WHERE farm_name = 'Karnal Green Acre'`);
    await run(`UPDATE mandis SET name = 'Latur APMC (Soybean & Tur Market)', district = 'Latur', state = 'Maharashtra',
               distance_km = 22.0, freight_rate_per_km_quintal = 1.85, mandi_handling_fee_per_quintal = 35.0, contact_phone = NULL
               WHERE name LIKE 'Azadpur%'`);
    await run(`UPDATE mandis SET name = 'Yavatmal APMC (Cotton Market)', district = 'Yavatmal', state = 'Maharashtra',
               distance_km = 18.0, freight_rate_per_km_quintal = 1.85, mandi_handling_fee_per_quintal = 35.0, contact_phone = NULL
               WHERE name LIKE 'Karnal%'`);
    await run(`UPDATE transport_pools SET pickup_hub = 'Ausa Phata Hub (Latur)', crop_id = 8, scheduled_date = '2026-10-30',
               individual_freight_rate = 60.0, pooled_freight_rate = 38.0, savings_percentage = 36.7
               WHERE pickup_hub LIKE 'Taraori%'`);

    const karnalWeather = await query("SELECT COUNT(*) as count FROM weather_records WHERE district = 'Karnal'");
    if (karnalWeather[0]?.count > 0) {
        await run("DELETE FROM weather_records WHERE district = 'Karnal'");
        await run(`INSERT INTO weather_records (district, record_date, temp_max_c, temp_min_c, humidity_percent, rainfall_prob_percent, wind_speed_kmh, condition, agro_summary)
                   VALUES ('Latur', '2026-09-21', 31.5, 22.0, 70.0, 30.0, 11.0, 'Partly Cloudy', 'Soil moisture adequate for soybean pod filling. Normal field routine.')`);
    }
    const karnalAlerts = await query("SELECT COUNT(*) as count FROM alerts WHERE district = 'Karnal'");
    if (karnalAlerts[0]?.count > 0) {
        await run("DELETE FROM alerts WHERE district = 'Karnal'");
        await run(`INSERT INTO alerts (district, crop_name, crop_stage, alert_type, severity, title, message, action_required, trigger_condition, is_active)
                   VALUES ('Latur', 'Soybean', 'Pod Filling', 'Pod Borer & Girdle Beetle Watch', 'Advisory', 'Scout Soybean for Pod Borer and Girdle Beetle',
                   'Warm humid nights during pod filling favour Helicoverpa pod borer and girdle beetle activity in Marathwada.',
                   'Install pheromone traps (5 per acre) and bird perches (20 per acre). Spray only if more than 2 larvae per metre row: Chlorantraniliprole 18.5 SC @ 60 ml/acre.',
                   'Night temperature > 20°C AND humidity > 75% during pod filling', 1)`);
    }
}

/**
 * Maharashtra crops, schemes and knowledge articles. Inserted only if missing.
 */
async function ensureMaharashtraContent() {
    // Key Maharashtra crops (Marathwada / Vidarbha pulses and millets)
    await run(`INSERT OR IGNORE INTO crops (name, scientific_name, category, ideal_season, duration_days, water_req_mm, ideal_soil, expected_yield_quintal_acre, avg_input_cost_acre, historical_avg_price_quintal, market_volatility_score, water_risk_score, input_risk_score) VALUES
        ('Tur (Arhar)', 'Cajanus cajan', 'Pulse', 'Kharif', 170, 400, 'Medium Black Loam', 6, 15000, 7000, 'Medium', 'Low', 'Low'),
        ('Gram (Chana)', 'Cicer arietinum', 'Pulse', 'Rabi', 110, 250, 'Deep Black Soil', 7, 14000, 5500, 'Low', 'Low', 'Low'),
        ('Jowar', 'Sorghum bicolor', 'Cereal / Fodder', 'Rabi / Kharif', 115, 350, 'Medium Black Loam', 10, 12000, 3000, 'Low', 'Low', 'Low');`);

    const nsmny = await query("SELECT COUNT(*) as count FROM government_schemes WHERE scheme_name LIKE 'Namo Shetkari%'");
    if (!nsmny[0]?.count) {
        await run(`INSERT INTO government_schemes (scheme_name, nodal_ministry, beneficiary_criteria, benefits_summary, financial_assistance, application_process, required_documents, official_portal_url, target_crops, eligible_land_category) VALUES
            ('Namo Shetkari Mahasanman Nidhi Yojana', 'Agriculture Department, Government of Maharashtra', 'Maharashtra farmer families who are eligible PM-KISAN beneficiaries.', 'State top-up to PM-KISAN: eligible Maharashtra farmers receive an additional ₹6,000 per year, i.e. ₹12,000 per year in total with PM-KISAN.', '₹6,000 / year in 3 installments (Direct Bank Transfer)', '1. No separate application needed.\n2. Keep PM-KISAN e-KYC, Aadhaar-bank seeding and land record seeding complete.\n3. Contact the Taluka Agriculture Officer for corrections.', 'PM-KISAN registration, Aadhaar linked bank account, 7/12 extract and 8-A', 'https://nsmny.mahait.org', 'All Crops', 'All PM-KISAN eligible farmers');`);
    }

    const knowledge = [
        ['Soybean Yellow Mosaic Virus', 'Soybean', 'soybean yellow, yellow mosaic, ymv, soybean leaves yellow, whitefly soybean, पिवळा मोझॅक, पीला मोजेक',
            'Yellow Mosaic Virus (YMV) causes bright yellow patches mixed with green on soybean leaves and is spread by whitefly. Infected plants cannot be cured. Uproot and destroy infected plants early. Install yellow sticky traps (10-15 per acre). Control whitefly with Thiamethoxam 12.6% + Lambda-cyhalothrin 9.5% ZC @ 50 ml/acre or neem oil 1500 ppm @ 5 ml/L. Next season use tolerant varieties recommended by VNMKV Parbhani / MPKV Rahuri and seed treatment with Thiamethoxam 30 FS.'],
        ['Cotton Pink Bollworm', 'Cotton', 'pink bollworm, bondali, gulabi bond ali, rosette flower, cotton boll damage, गुलाबी बोंडअळी, गुलाबी सुंडी',
            'Pink bollworm (Pectinophora gossypiella) larvae bore into flowers and bolls; rosette (closed) flowers are an early sign. Install pheromone traps (5 per acre) from 45 days after sowing; take action when 8 moths per trap for 3 nights in a row. Remove and destroy rosette flowers. Spray Profenofos 50 EC @ 2 ml/L or Emamectin benzoate 5 SG @ 0.4 g/L when threshold is crossed. Avoid extending the crop beyond December and destroy crop residue after the last picking.']
    ];
    for (const [topic, crop, keywords, content] of knowledge) {
        const exists = await query("SELECT COUNT(*) as count FROM knowledge_documents WHERE topic = ?", [topic]);
        if (!exists[0]?.count) {
            await run("INSERT INTO knowledge_documents (topic, crop_name, keywords, content) VALUES (?, ?, ?, ?)", [topic, crop, keywords, content]);
        }
    }
}

/**
 * Migration & repair query:
 * 1. Ensures user_id column exists in transport_pool_members.
 * 2. Ensures metadata columns in transport_pools.
 * 3. Repairs capacity filled to ALWAYS match the exact sum of member quantities.
 * 4. Seeds dynamic future dates relative to today.
 */
export async function ensureTransportPoolsSchemaAndSeed() {
    // 1. Ensure user_id column in transport_pool_members
    const memberCols = await query("PRAGMA table_info(transport_pool_members)");
    if (!memberCols.some(c => c.name === 'user_id')) {
        await run("ALTER TABLE transport_pool_members ADD COLUMN user_id INTEGER");
    }

    // 2. Ensure columns in transport_pools
    const poolCols = await query("PRAGMA table_info(transport_pools)");
    if (!poolCols.some(c => c.name === 'pickup_district')) {
        await run("ALTER TABLE transport_pools ADD COLUMN pickup_district TEXT DEFAULT 'Nashik'");
    }
    if (!poolCols.some(c => c.name === 'destination_mandi')) {
        await run("ALTER TABLE transport_pools ADD COLUMN destination_mandi TEXT DEFAULT 'Vashi APMC (Navi Mumbai Terminal)'");
    }
    if (!poolCols.some(c => c.name === 'crop_name')) {
        await run("ALTER TABLE transport_pools ADD COLUMN crop_name TEXT DEFAULT 'Tomato'");
    }
    if (!poolCols.some(c => c.name === 'departure_time')) {
        await run("ALTER TABLE transport_pools ADD COLUMN departure_time TEXT DEFAULT '06:30 AM'");
    }

    const dayMs = 86400000;
    const now = Date.now();
    const dPlus2 = new Date(now + 2 * dayMs).toISOString().split('T')[0];
    const dPlus3 = new Date(now + 3 * dayMs).toISOString().split('T')[0];
    const dPlus5 = new Date(now + 5 * dayMs).toISOString().split('T')[0];
    const dPlus6 = new Date(now + 6 * dayMs).toISOString().split('T')[0];

    // Seed or update transport pools with dynamic future dates
    const existingPools = await query("SELECT COUNT(*) as count FROM transport_pools");
    if (!existingPools[0]?.count) {
        await run(`INSERT INTO transport_pools (id, mandi_id, destination_mandi, crop_id, crop_name, scheduled_date, departure_time, pickup_hub, pickup_district, current_produce_quintal, capacity_quintal, vehicle_type, individual_freight_rate, pooled_freight_rate, savings_percentage, status) VALUES 
            (1, 4, 'Vashi APMC (Navi Mumbai Terminal)', 1, 'Tomato', '${dPlus2}', '06:00 AM', 'Dindori Phata Farm Hub (Nashik)', 'Nashik', 65.0, 100.0, 'Eicher 10-Ton Container', 285.0, 175.0, 38.6, 'Open'),
            (2, 3, 'Pune APMC Gultekdi Market Yard', 2, 'Onion', '${dPlus3}', '05:30 AM', 'Pimpalgaon Baswant Hub', 'Nashik', 140.0, 160.0, 'Tata 16-Ton Multi-axle', 195.0, 125.0, 35.9, 'Open'),
            (3, 5, 'Latur APMC (Soybean & Tur Market)', 8, 'Soybean', '${dPlus5}', '07:00 AM', 'Ausa Phata Hub (Latur)', 'Latur', 110.0, 120.0, 'Ashok Leyland 12-Ton', 120.0, 75.0, 37.5, 'Open'),
            (4, 6, 'Yavatmal APMC (Cotton Market)', 5, 'Cotton', '${dPlus6}', '08:00 AM', 'Wani Road Collection Hub', 'Yavatmal', 50.0, 100.0, 'Eicher 10-Ton Container', 160.0, 98.0, 38.8, 'Open');`);

        await run(`INSERT INTO transport_pool_members (pool_id, user_id, farmer_name, phone, produce_quantity_quintal) VALUES 
            (1, 1, 'Bhaskar Rao Shinde', '+91 98221 00112', 25.0),
            (1, NULL, 'Suresh Kadam', '+91 98221 33445', 20.0),
            (1, NULL, 'Ganesh Gaikwad', '+91 98221 77889', 20.0),
            (2, NULL, 'Vilas Deshmukh', '+91 94230 11223', 60.0),
            (2, NULL, 'Navnath More', '+91 94230 44556', 80.0),
            (3, 2, 'Rajesh Deshmukh', '+91 94220 54321', 45.0),
            (3, NULL, 'Balaji Pawar', '+91 94220 77889', 35.0),
            (3, NULL, 'Madhav Shinde', '+91 94220 33445', 30.0),
            (4, NULL, 'Sanjay Rathod', '+91 97654 11223', 30.0),
            (4, NULL, 'Gajanan Dhote', '+91 97654 44556', 20.0);`);
    } else {
        // Update existing seed pools with future relative dates and ensure metadata columns
        await run(`UPDATE transport_pools SET scheduled_date = '${dPlus2}', departure_time = '06:00 AM', destination_mandi = 'Vashi APMC (Navi Mumbai Terminal)', pickup_district = 'Nashik', crop_name = 'Tomato' WHERE id = 1`);
        await run(`UPDATE transport_pools SET scheduled_date = '${dPlus3}', departure_time = '05:30 AM', destination_mandi = 'Pune APMC Gultekdi Market Yard', pickup_district = 'Nashik', crop_name = 'Onion' WHERE id = 2`);
        await run(`UPDATE transport_pools SET scheduled_date = '${dPlus5}', departure_time = '07:00 AM', destination_mandi = 'Latur APMC (Soybean & Tur Market)', pickup_district = 'Latur', crop_name = 'Soybean' WHERE id = 3`);

        // Check if pool 4 exists
        const p4 = await query("SELECT id FROM transport_pools WHERE id = 4");
        if (!p4.length) {
            await run(`INSERT INTO transport_pools (id, mandi_id, destination_mandi, crop_id, crop_name, scheduled_date, departure_time, pickup_hub, pickup_district, current_produce_quintal, capacity_quintal, vehicle_type, individual_freight_rate, pooled_freight_rate, savings_percentage, status) VALUES 
                (4, 6, 'Yavatmal APMC (Cotton Market)', 5, 'Cotton', '${dPlus6}', '08:00 AM', 'Wani Road Collection Hub', 'Yavatmal', 50.0, 100.0, 'Eicher 10-Ton Container', 160.0, 98.0, 38.8, 'Open')`);
        } else {
            await run(`UPDATE transport_pools SET scheduled_date = '${dPlus6}', departure_time = '08:00 AM', destination_mandi = 'Yavatmal APMC (Cotton Market)', pickup_district = 'Yavatmal', crop_name = 'Cotton' WHERE id = 4`);
        }

        // Ensure pool 3 has members summing to 110.0 (fixing the 0-member bug in original seed)
        const p3Members = await query("SELECT COUNT(*) as count FROM transport_pool_members WHERE pool_id = 3");
        if (!p3Members[0]?.count) {
            await run(`INSERT INTO transport_pool_members (pool_id, user_id, farmer_name, phone, produce_quantity_quintal) VALUES 
                (3, 2, 'Rajesh Deshmukh', '+91 94220 54321', 45.0),
                (3, NULL, 'Balaji Pawar', '+91 94220 77889', 35.0),
                (3, NULL, 'Madhav Shinde', '+91 94220 33445', 30.0)`);
        }

        // Ensure pool 4 has members summing to 50.0
        const p4Members = await query("SELECT COUNT(*) as count FROM transport_pool_members WHERE pool_id = 4");
        if (!p4Members[0]?.count) {
            await run(`INSERT INTO transport_pool_members (pool_id, user_id, farmer_name, phone, produce_quantity_quintal) VALUES 
                (4, NULL, 'Sanjay Rathod', '+91 97654 11223', 30.0),
                (4, NULL, 'Gajanan Dhote', '+91 97654 44556', 20.0)`);
        }

        // Ensure user_id is assigned for demo users
        await run("UPDATE transport_pool_members SET user_id = 1 WHERE pool_id = 1 AND farmer_name LIKE '%Shinde%' AND user_id IS NULL");
        await run("UPDATE transport_pool_members SET user_id = 2 WHERE pool_id = 3 AND farmer_name LIKE '%Deshmukh%' AND user_id IS NULL");
    }

    // 3. STARTUP REPAIR QUERY:
    // Capacity filled must ALWAYS be the sum of member quantities.
    await run(`
        UPDATE transport_pools
        SET current_produce_quintal = (
            SELECT COALESCE(SUM(produce_quantity_quintal), 0)
            FROM transport_pool_members
            WHERE pool_id = transport_pools.id
        )
    `);

    // 4. Update status: Departed (past date), Full, or Open
    const today = new Date().toISOString().split('T')[0];
    await run(`
        UPDATE transport_pools
        SET status = CASE
            WHEN scheduled_date < '${today}' THEN 'Departed'
            WHEN current_produce_quintal >= capacity_quintal THEN 'Full'
            ELSE 'Open'
        END
    `);


    saveDb();
}

export async function ensureMandiBenchmarkPrices() {
    try {
        const seedPath = path.resolve(__dirname, '../data/seedMandiPrices.json');
        if (!fs.existsSync(seedPath)) return;

        const raw = fs.readFileSync(seedPath, 'utf8');
        const seedRows = JSON.parse(raw);
        if (!Array.isArray(seedRows) || seedRows.length === 0) return;

        const today = new Date().toISOString().split('T')[0];
        const dateRes = await query("SELECT MAX(arrival_date) as maxDate, COUNT(*) as count FROM live_mandi_prices");
        const currentMax = dateRes[0]?.maxDate;
        const currentCount = dateRes[0]?.count || 0;

        // If DB has no records, or latest date is older than today, synchronize benchmark prices
        if (currentCount === 0 || !currentMax || currentMax < today) {
            const seedMax = seedRows[0]?.arrival_date || today;
            const diffMs = new Date(today).getTime() - new Date(seedMax).getTime();
            const dayOffset = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));

            const shiftDate = (dStr) => {
                if (!dayOffset || !dStr) return dStr;
                const d = new Date(dStr);
                d.setDate(d.getDate() + dayOffset);
                return d.toISOString().split('T')[0];
            };

            const batch = seedRows.map(r => [
                r.commodity,
                r.crop_name,
                r.variety || 'Other',
                r.market,
                r.district,
                r.state || 'Maharashtra',
                shiftDate(r.arrival_date),
                r.min_price_quintal,
                r.max_price_quintal,
                r.modal_price_quintal,
                'agmarknet_benchmark'
            ]);

            await runBatch(`
                INSERT INTO live_mandi_prices (
                    commodity, crop_name, variety, market, district, state, arrival_date,
                    min_price_quintal, max_price_quintal, modal_price_quintal, source
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (commodity, variety, market, arrival_date) DO UPDATE SET
                    min_price_quintal = excluded.min_price_quintal,
                    max_price_quintal = excluded.max_price_quintal,
                    modal_price_quintal = excluded.modal_price_quintal,
                    fetched_at = CURRENT_TIMESTAMP
            `, batch);

            saveDb();
            console.log(`🌾 Synchronized ${batch.length} Maharashtra APMC benchmark mandi prices (aligned to ${today}).`);
        }
    } catch (e) {
        console.warn('⚠️ Could not load benchmark mandi prices:', e.message);
    }
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seedData.js')) {
    seedDatabase().catch(err => {
        console.error('Seed error:', err);
        process.exit(1);
    });
}

