import { query, queryOne, run } from '../models/db.js';

export class AuthService {
    static async login(email, password) {
        const user = await queryOne("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
        if (!user || user.password_hash !== password) {
            throw new Error('Invalid email or password');
        }

        // Fetch associated farmer profile and farm
        const profile = await queryOne("SELECT * FROM farmer_profiles WHERE user_id = ?", [user.id]);
        const farm = profile ? await queryOne("SELECT * FROM farms WHERE farmer_profile_id = ?", [profile.id]) : null;

        // Generate demo session token
        const token = `sfas_token_${user.id}_${Date.now()}`;

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role
            },
            profile,
            farm
        };
    }

    static async register({
        email,
        password,
        fullName,
        phone,
        district,
        state,
        farmerType = 'Smallholder (< 2 Ha)',
        landSize = 2.0,
        soilType = 'Black Soil (Regur)',
        crop = 'Tomato',
        waterReliability = 'Moderately Reliable',
        waterSource = 'Borewell & Drip'
    }) {
        const existing = await queryOne("SELECT id FROM users WHERE email = ?", [email.toLowerCase().trim()]);
        if (existing) {
            throw new Error('User already exists with this email address');
        }

        const userResult = await run(
            "INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, 'farmer')",
            [email.toLowerCase().trim(), password, fullName]
        );
        const userId = userResult.lastInsertRowid;

        const profileResult = await run(
            "INSERT INTO farmer_profiles (user_id, phone, district, state, farmer_type) VALUES (?, ?, ?, ?, ?)",
            [userId, phone, district, state, farmerType]
        );
        const profileId = profileResult.lastInsertRowid;

        // User's own registered farm plot
        await run(
            "INSERT INTO farms (farmer_profile_id, farm_name, land_size_acres, soil_type, water_source, water_reliability, current_crop, crop_stage) VALUES (?, ?, ?, ?, ?, ?, ?, 'Vegetative Stage')",
            [profileId, `${fullName}'s Farm Plot`, Number(landSize) || 2.0, soilType, waterSource, waterReliability, crop]
        );

        return this.login(email, password);
    }

    static async getDemoProfiles() {
        const users = await query(`
            SELECT u.id, u.email, u.full_name, p.district, p.state, p.farmer_type, p.language_pref,
                   f.farm_name, f.land_size_acres, f.soil_type, f.water_reliability, f.current_crop, f.crop_stage
            FROM users u
            JOIN farmer_profiles p ON u.id = p.user_id
            JOIN farms f ON p.id = f.farmer_profile_id
        `);
        return users;
    }
}

export class FarmerService {
    static async getFarmerContext(userId = 1) {
        const profile = await queryOne(`
            SELECT p.*, u.full_name, u.email 
            FROM farmer_profiles p 
            JOIN users u ON p.user_id = u.id 
            WHERE u.id = ?
        `, [userId]);

        if (!profile) return null;

        const farm = await queryOne(`
            SELECT * FROM farms WHERE farmer_profile_id = ?
        `, [profile.id]);

        return { profile, farm };
    }

    static async updateFarm(farmId, updateData) {
        const {
            farm_name,
            land_size_acres,
            soil_type,
            water_source,
            water_reliability,
            current_crop,
            crop_stage
        } = updateData;

        await run(`
            UPDATE farms 
            SET farm_name = COALESCE(?, farm_name),
                land_size_acres = COALESCE(?, land_size_acres),
                soil_type = COALESCE(?, soil_type),
                water_source = COALESCE(?, water_source),
                water_reliability = COALESCE(?, water_reliability),
                current_crop = COALESCE(?, current_crop),
                crop_stage = COALESCE(?, crop_stage)
            WHERE id = ?
        `, [farm_name, land_size_acres, soil_type, water_source, water_reliability, current_crop, crop_stage, farmId]);

        return queryOne("SELECT * FROM farms WHERE id = ?", [farmId]);
    }
}
