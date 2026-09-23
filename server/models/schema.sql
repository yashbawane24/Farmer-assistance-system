-- Smart Farmer Assistance System (SFAS)
-- Relational Database Schema (ANSI SQL / SQLite & PostgreSQL compatible)

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'farmer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farmer_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    phone TEXT,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    language_pref TEXT DEFAULT 'en',
    farmer_type TEXT DEFAULT 'smallholder',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS farms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_profile_id INTEGER NOT NULL,
    farm_name TEXT NOT NULL,
    land_size_acres REAL NOT NULL,
    soil_type TEXT NOT NULL,
    water_source TEXT NOT NULL,
    water_reliability TEXT NOT NULL,
    current_crop TEXT,
    crop_stage TEXT,
    sowing_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_profile_id) REFERENCES farmer_profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS crops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    scientific_name TEXT,
    category TEXT NOT NULL,
    ideal_season TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    water_req_mm REAL NOT NULL,
    ideal_soil TEXT NOT NULL,
    expected_yield_quintal_acre REAL NOT NULL,
    avg_input_cost_acre REAL NOT NULL,
    historical_avg_price_quintal REAL NOT NULL,
    market_volatility_score TEXT DEFAULT 'Medium',
    water_risk_score TEXT DEFAULT 'Medium',
    input_risk_score TEXT DEFAULT 'Medium'
);

CREATE TABLE IF NOT EXISTS mandis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    distance_km REAL NOT NULL,
    freight_rate_per_km_quintal REAL DEFAULT 1.85,
    mandi_handling_fee_per_quintal REAL DEFAULT 35.0,
    contact_phone TEXT,
    operating_days TEXT DEFAULT 'Mon-Sat'
);

CREATE TABLE IF NOT EXISTS mandi_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mandi_id INTEGER NOT NULL,
    crop_id INTEGER NOT NULL,
    modal_price_quintal REAL NOT NULL,
    min_price_quintal REAL NOT NULL,
    max_price_quintal REAL NOT NULL,
    arrival_quantity_tonnes REAL,
    price_date DATE NOT NULL,
    FOREIGN KEY (mandi_id) REFERENCES mandis(id),
    FOREIGN KEY (crop_id) REFERENCES crops(id)
);

CREATE TABLE IF NOT EXISTS transport_pools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mandi_id INTEGER NOT NULL,
    crop_id INTEGER NOT NULL,
    scheduled_date DATE NOT NULL,
    pickup_hub TEXT NOT NULL,
    current_produce_quintal REAL DEFAULT 0,
    capacity_quintal REAL NOT NULL,
    vehicle_type TEXT NOT NULL,
    individual_freight_rate REAL NOT NULL,
    pooled_freight_rate REAL NOT NULL,
    savings_percentage REAL NOT NULL,
    status TEXT DEFAULT 'Open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mandi_id) REFERENCES mandis(id),
    FOREIGN KEY (crop_id) REFERENCES crops(id)
);

CREATE TABLE IF NOT EXISTS transport_pool_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pool_id INTEGER NOT NULL,
    farmer_name TEXT NOT NULL,
    phone TEXT,
    produce_quantity_quintal REAL NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pool_id) REFERENCES transport_pools(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS disease_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER,
    crop_name TEXT NOT NULL,
    image_url TEXT,
    detected_disease TEXT NOT NULL,
    confidence_score REAL NOT NULL,
    severity TEXT NOT NULL,
    immediate_action TEXT NOT NULL,
    biological_remedy TEXT NOT NULL,
    chemical_treatment TEXT NOT NULL,
    prevention_guide TEXT NOT NULL,
    is_offline_inference BOOLEAN DEFAULT 0,
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id)
);

CREATE TABLE IF NOT EXISTS weather_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    district TEXT NOT NULL,
    record_date DATE NOT NULL,
    temp_max_c REAL NOT NULL,
    temp_min_c REAL NOT NULL,
    humidity_percent REAL NOT NULL,
    rainfall_prob_percent REAL NOT NULL,
    wind_speed_kmh REAL NOT NULL,
    condition TEXT NOT NULL,
    agro_summary TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    district TEXT NOT NULL,
    crop_name TEXT,
    crop_stage TEXT,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_required TEXT NOT NULL,
    trigger_condition TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS government_schemes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scheme_name TEXT NOT NULL,
    nodal_ministry TEXT NOT NULL,
    beneficiary_criteria TEXT NOT NULL,
    benefits_summary TEXT NOT NULL,
    financial_assistance TEXT NOT NULL,
    application_process TEXT NOT NULL,
    required_documents TEXT NOT NULL,
    official_portal_url TEXT,
    target_crops TEXT DEFAULT 'All Crops',
    eligible_land_category TEXT DEFAULT 'Marginal and Small Farmers (< 2 Ha)'
);

CREATE TABLE IF NOT EXISTS knowledge_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    crop_name TEXT,
    keywords TEXT NOT NULL,
    content TEXT NOT NULL
);
