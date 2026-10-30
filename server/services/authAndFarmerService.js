import { query, queryOne, run } from '../models/db.js';
import { signToken, hashPassword, verifyPassword, isHashed } from '../middleware/auth.js';

export class AuthService {
    static async login(identifier, password) {
        if (!identifier || !password) {
            const err = new Error('Email/phone and password are required');
            err.status = 400;
            err.code = 'MISSING_CREDENTIALS';
            throw err;
        }

        const trimmedId = identifier.toString().trim();
        const trimmedPass = password.toString().trim();

        // 1. First attempt: match by email (case-insensitive)
        let user = await queryOne("SELECT * FROM users WHERE LOWER(email) = ?", [trimmedId.toLowerCase()]);

        // 2. Second attempt: match by phone number in farmer_profiles
        if (!user) {
            const digits = trimmedId.replace(/\D/g, '');
            if (digits.length >= 7) {
                const last10 = digits.slice(-10);
                const profiles = await query("SELECT user_id, phone FROM farmer_profiles WHERE phone IS NOT NULL");
                
                // Collect user IDs matching this phone number
                const matchingUserIds = [];
                for (const p of profiles) {
                    const pDigits = (p.phone || '').replace(/\D/g, '');
                    if (pDigits.endsWith(last10) || last10.endsWith(pDigits)) {
                        matchingUserIds.push(p.user_id);
                    }
                }

                if (matchingUserIds.length > 0) {
                    // Check if any matching user matches the given password
                    for (const uId of matchingUserIds) {
                        const candidate = await queryOne("SELECT * FROM users WHERE id = ?", [uId]);
                        if (candidate && (verifyPassword(password, candidate.password_hash) || verifyPassword(trimmedPass, candidate.password_hash))) {
                            user = candidate;
                            break;
                        }
                    }
                    // If none matched the password directly, select the latest user for credential validation error
                    if (!user) {
                        user = await queryOne("SELECT * FROM users WHERE id = ?", [matchingUserIds[matchingUserIds.length - 1]]);
                    }
                }
            }
        }

        if (!user) {
            const err = new Error('No account found with this email or phone number. Please check or register.');
            err.status = 401;
            err.code = 'USER_NOT_FOUND';
            throw err;
        }

        const isPasswordMatch = verifyPassword(password, user.password_hash) || verifyPassword(trimmedPass, user.password_hash);
        if (!isPasswordMatch) {
            const err = new Error('Invalid password. Please check your credentials.');
            err.status = 401;
            err.code = 'INVALID_PASSWORD';
            throw err;
        }

        // Upgrade accounts that still have a plain-text password to a salted scrypt hash
        if (!isHashed(user.password_hash)) {
            await run("UPDATE users SET password_hash = ? WHERE id = ?", [hashPassword(trimmedPass), user.id]);
        }

        // Fetch associated farmer profile and farm
        let profile = await queryOne("SELECT * FROM farmer_profiles WHERE user_id = ?", [user.id]);
        if (!profile) {
            const profRes = await run(
                "INSERT INTO farmer_profiles (user_id, phone, district, state, farmer_type) VALUES (?, ?, 'Nashik', 'Maharashtra', 'Smallholder (< 2 Ha)')",
                [user.id, '+91 98000 00000']
            );
            profile = await queryOne("SELECT * FROM farmer_profiles WHERE id = ?", [profRes.lastInsertRowid]);
        }

        let farm = await queryOne("SELECT * FROM farms WHERE farmer_profile_id = ?", [profile.id]);
        if (!farm) {
            const farmRes = await run(
                "INSERT INTO farms (farmer_profile_id, farm_name, land_size_acres, soil_type, water_source, water_reliability, current_crop, crop_stage) VALUES (?, ?, 2.0, 'Black Soil (Regur)', 'Borewell & Drip', 'Moderately Reliable', 'Tomato', 'Vegetative Stage')",
                [profile.id, `${user.full_name}'s Farm Plot`]
            );
            farm = await queryOne("SELECT * FROM farms WHERE id = ?", [farmRes.lastInsertRowid]);
        }

        // Generate session token
        const token = signToken(user.id);

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
            const err = new Error('User already exists with this email address');
            err.status = 409;
            err.code = 'USER_EXISTS';
            throw err;
        }

        const userResult = await run(
            "INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, 'farmer')",
            [email.toLowerCase().trim(), hashPassword(String(password).trim()), fullName]
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
        // Only the two seeded demo personas; never list real farmers' emails publicly
        const users = await query(`
            SELECT u.id, u.full_name, p.district, p.state, p.farmer_type, p.language_pref,
                   f.farm_name, f.land_size_acres, f.soil_type, f.water_reliability, f.current_crop, f.crop_stage
            FROM users u
            JOIN farmer_profiles p ON u.id = p.user_id
            JOIN farms f ON p.id = f.farmer_profile_id
            WHERE u.email IN ('ramesh@sfas.in', 'rajesh@sfas.in')
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
            crop_stage,
            sowing_date
        } = updateData;
        const validSowingDate = /^\d{4}-\d{2}-\d{2}$/.test(sowing_date || '') ? sowing_date : null;

        await run(`
            UPDATE farms 
            SET farm_name = COALESCE(?, farm_name),
                land_size_acres = COALESCE(?, land_size_acres),
                soil_type = COALESCE(?, soil_type),
                water_source = COALESCE(?, water_source),
                water_reliability = COALESCE(?, water_reliability),
                current_crop = COALESCE(?, current_crop),
                crop_stage = COALESCE(?, crop_stage),
                sowing_date = COALESCE(?, sowing_date)
            WHERE id = ?
        `, [farm_name ?? null, land_size_acres ?? null, soil_type ?? null, water_source ?? null, water_reliability ?? null, current_crop ?? null, crop_stage ?? null, validSowingDate, farmId]);

        return queryOne("SELECT * FROM farms WHERE id = ?", [farmId]);
    }

    static async updateProfileLocation(userId, { district, fullName }) {
        if (district) {
            await run("UPDATE farmer_profiles SET district = ?, state = 'Maharashtra' WHERE user_id = ?", [district, userId]);
        }
        if (fullName && String(fullName).trim()) {
            await run("UPDATE users SET full_name = ? WHERE id = ?", [String(fullName).trim().slice(0, 80), userId]);
        }
    }
}
