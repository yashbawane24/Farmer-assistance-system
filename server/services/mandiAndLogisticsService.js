import { query, queryOne, run } from '../models/db.js';
import { tr } from '../config/serverI18n.js';
import { REGION_STATE, MSP_YEAR_LABEL, findDistrict, estimateRoadDistanceKm, TRANSPORT_VEHICLE_CONFIGS, calculateFreightEconomics } from '../config/maharashtra.js';
import { getLatestCropPrices, getCropPriceHistory, isAgmarknetConfigured, syncStatus } from './agmarknetService.js';

// Transport + market charges used for the net-realization estimate (Rs per quintal).
// Typical Maharashtra truck freight and APMC hamali/tolai charges; shown to farmers as estimates.
const FREIGHT_RATE_PER_KM_QUINTAL = 1.85;
const MANDI_HANDLING_FEE_PER_QUINTAL = 35;
const MAX_MANDIS_SHOWN = 9;

// Agmarknet market names come as "APMC Ausa ", "Latur", "Pune(Manjri)" - normalise spacing and the APMC prefix
export function cleanMarketName(name = '') {
    return String(name).replace(/\s+/g, ' ').trim().replace(/^APMC\s+/i, '').replace(/\s+APMC$/i, '').trim();
}

export class SmartMandiService {
    /**
     * Compares real Agmarknet prices of a crop across Maharashtra APMCs and calculates the True Net Realization:
     * Net Realization = Gross Produce Value - (Road Distance * Freight Rate * Quintals) - Mandi Fees
     */
    static async compareMandis({ cropName = 'Tomato', produceQuantityQuintal = 25.0, userDistrict = 'Nashik', lang = 'en' }) {
        const { crop, rows } = await getLatestCropPrices(cropName);
        const home = findDistrict(userDistrict);

        const evaluatedMandis = rows.map(row => {
            // Agmarknet spellings vary ("Amarawati", "Sholapur"): use the standard district name
            const item = { ...row, district: findDistrict(row.district)?.name || row.district };
            // Unknown district -> distance unknown; never treat it as 0 km (that made far mandis look nearest)
            const distanceKm = estimateRoadDistanceKm(home?.name || userDistrict, item.district);
            if (distanceKm === null) return null;
            const rawGrossRevenue = Math.round(item.modal_price_quintal * produceQuantityQuintal);
            const transportCostPerQuintal = Math.round(distanceKm * FREIGHT_RATE_PER_KM_QUINTAL);
            const totalTransportCost = Math.round(transportCostPerQuintal * produceQuantityQuintal);
            const totalHandlingFees = Math.round(MANDI_HANDLING_FEE_PER_QUINTAL * produceQuantityQuintal);
            const totalDeductions = totalTransportCost + totalHandlingFees;
            const netTakeHomeRealization = rawGrossRevenue - totalDeductions;

            return {
                mandiId: `${item.market}|${item.variety}`,
                mandiName: `${cleanMarketName(item.market)} APMC`,
                market: cleanMarketName(item.market),
                variety: item.variety,
                district: item.district,
                state: item.state,
                distanceKm,
                quotedModalPriceQuintal: item.modal_price_quintal,
                priceRange: { min: item.min_price_quintal, max: item.max_price_quintal },
                previousModalPrice: item.previous_modal_price,
                priceDate: item.arrival_date,
                msp: crop?.msp ?? null,
                source: item.source,
                economics: {
                    produceQuantityQuintal,
                    rawGrossRevenue,
                    transportCostPerQuintal,
                    totalTransportCost,
                    handlingFees: totalHandlingFees,
                    totalDeductions,
                    netTakeHomeRealization,
                    effectiveNetPricePerQuintal: Math.round(netTakeHomeRealization / produceQuantityQuintal)
                },
                isHighestRawPrice: false,
                isBestNetRealization: false
            };
        }).filter(Boolean);

        // Sort by take-home money and keep the most relevant mandis
        evaluatedMandis.sort((a, b) => b.economics.netTakeHomeRealization - a.economics.netTakeHomeRealization);
        const mandis = evaluatedMandis.slice(0, MAX_MANDIS_SHOWN);

        if (mandis.length > 0) {
            mandis[0].isBestNetRealization = true;
            mandis.reduce((max, m) => (m.quotedModalPriceQuintal > max.quotedModalPriceQuintal ? m : max), mandis[0]).isHighestRawPrice = true;
        }

        const highestRaw = mandis.find(m => m.isHighestRawPrice);
        const best = mandis[0];
        let explanation = null;
        const money = (n) => n.toLocaleString('en-IN');
        if (best && highestRaw && highestRaw !== best) {
            explanation = tr('mandi.insight.distant', lang, {
                high: highestRaw.mandiName, highPrice: highestRaw.quotedModalPriceQuintal, km: highestRaw.distanceKm,
                best: best.mandiName, net: money(best.economics.netTakeHomeRealization)
            });
        } else if (best) {
            explanation = tr('mandi.insight.same', lang, {
                best: best.mandiName, price: best.quotedModalPriceQuintal, date: best.priceDate,
                net: money(best.economics.netTakeHomeRealization)
            });
        }

        const latestDate = rows.reduce((max, r) => (!max || r.arrival_date > max ? r.arrival_date : max), null);

        return {
            crop: {
                name: crop?.name || cropName,
                msp: crop?.msp ?? null,
                mspYear: crop?.msp ? MSP_YEAR_LABEL : null
            },
            quantityQuintal: produceQuantityQuintal,
            userLocation: home?.name || userDistrict,
            mandis,
            totalMandisReporting: evaluatedMandis.length,
            latestArrivalDate: latestDate,
            assumptions: {
                freightRatePerKmQuintal: FREIGHT_RATE_PER_KM_QUINTAL,
                handlingFeePerQuintal: MANDI_HANDLING_FEE_PER_QUINTAL,
                distanceNote: 'Road distance estimated from district headquarters'
            },
            dataSource: {
                name: 'Agmarknet, Government of India (data.gov.in)',
                liveFeedConfigured: isAgmarknetConfigured(),
                lastSync: syncStatus.lastSuccess,
                syncError: syncStatus.lastError,
                // Days since the newest price was reported; the UI warns when prices are not from today
                daysSinceLatest: latestDate ? Math.floor((Date.now() - new Date(`${latestDate}T00:00:00+05:30`).getTime()) / 86400000) : null,
                isSnapshot: rows.length > 0 && rows.every(r => r.source === 'agmarknet_snapshot')
            },
            insight: best ? {
                bestMandi: best.mandiName,
                netGainOverDistantMarket: mandis.length > 1
                    ? best.economics.netTakeHomeRealization - mandis[mandis.length - 1].economics.netTakeHomeRealization
                    : 0,
                explanation
            } : null
        };
    }

    /**
     * Real daily price history (Maharashtra average modal price) recorded from Agmarknet reports
     */
    static async getPriceTrend(cropName = 'Tomato', days = 30) {
        const history = await getCropPriceHistory(cropName, { days });
        return history.map(h => ({
            date: h.date,
            day: new Date(`${h.date}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
            price: h.modal_price,
            minPrice: h.min_price,
            maxPrice: h.max_price,
            markets: h.markets
        }));
    }

    static getStatus() {
        return { ...syncStatus, configured: isAgmarknetConfigured(), state: REGION_STATE };
    }
}

export class LogisticsService {
    /**
     * Returns available transport pools filtered by crop, district, and destination mandi.
     * Hides departed pools. Anonymizes member phone numbers for privacy.
     */
    static async getAvailablePools({ crop = '', district = '', mandi = '', quantity = 25, userId = null } = {}) {
        const today = new Date().toISOString().split('T')[0];
        const userQty = Math.max(Number(quantity) || 25, 1);
        const homeDistrict = district ? (findDistrict(district)?.name || district) : 'Nashik';

        let sql = `
            SELECT p.*,
                   COALESCE(c.name, p.crop_name) as crop_name,
                   COALESCE(m.name, p.destination_mandi) as destination_mandi,
                   COALESCE(m.district, p.pickup_district) as destination_district
            FROM transport_pools p
            LEFT JOIN crops c ON p.crop_id = c.id
            LEFT JOIN mandis m ON p.mandi_id = m.id
            WHERE p.scheduled_date >= ?
        `;
        const params = [today];

        if (crop && crop !== 'All' && crop !== 'All Crops') {
            sql += ` AND (LOWER(p.crop_name) = LOWER(?) OR LOWER(c.name) = LOWER(?))`;
            params.push(crop, crop);
        }

        if (mandi) {
            sql += ` AND (LOWER(p.destination_mandi) LIKE LOWER(?) OR LOWER(m.name) LIKE LOWER(?))`;
            params.push(`%${mandi}%`, `%${mandi}%`);
        }

        const pools = await query(sql, params);

        // Fetch anonymized members and compute live freight economics for each pool
        const enriched = [];
        for (const pool of pools) {
            const rawMembers = await query(
                `SELECT id, pool_id, user_id, farmer_name, produce_quantity_quintal, joined_at
                 FROM transport_pool_members
                 WHERE pool_id = ?`,
                [pool.id]
            );

            // Compute exact filled capacity from members
            const filledFromMembers = rawMembers.reduce((sum, m) => sum + (Number(m.produce_quantity_quintal) || 0), 0);
            const currentProduce = Math.max(filledFromMembers, pool.current_produce_quintal || 0);
            const remainingCapacity = Math.max(pool.capacity_quintal - currentProduce, 0);

            // Privacy: mask phone numbers, show only first name + village
            const members = rawMembers.map(m => {
                const parts = (m.farmer_name || 'Farmer').trim().split(/\s+/);
                const firstName = parts[0];
                return {
                    id: m.id,
                    firstName,
                    produceQuantityQuintal: m.produce_quantity_quintal,
                    isCurrentUser: userId ? (Number(m.user_id) === Number(userId)) : false
                };
            });

            const isUserJoined = userId ? rawMembers.some(m => Number(m.user_id) === Number(userId)) : false;
            const myMember = userId ? rawMembers.find(m => Number(m.user_id) === Number(userId)) : null;

            // Compute road distance and freight economics
            const destDistrict = pool.destination_district || 'Mumbai Suburban';
            const distanceKm = Math.max(estimateRoadDistanceKm(pool.pickup_district, destDistrict) || 50, 15);
            const distanceToHub = Math.max(estimateRoadDistanceKm(homeDistrict, pool.pickup_district) || 0, 0);

            const economics = calculateFreightEconomics({
                vehicleType: pool.vehicle_type,
                pickupDistrict: pool.pickup_district,
                destinationDistrict: destDistrict,
                currentProduceQuintal: currentProduce,
                farmerQuantity: userQty
            });

            // Calculate countdown string
            const scheduledMs = new Date(pool.scheduled_date).getTime();
            const todayMs = new Date(today).getTime();
            const daysDiff = Math.round((scheduledMs - todayMs) / 86400000);
            let countdown = 'Today';
            if (daysDiff === 1) countdown = 'Tomorrow';
            else if (daysDiff > 1) countdown = `in ${daysDiff} days`;

            const status = remainingCapacity <= 0 ? 'Full' : 'Open';

            enriched.push({
                ...pool,
                current_produce_quintal: currentProduce,
                remaining_capacity_quintal: remainingCapacity,
                status,
                distance_km: distanceKm,
                distance_to_hub_km: distanceToHub,
                countdown,
                days_diff: daysDiff,
                economics,
                members,
                member_count: members.length,
                is_user_joined: isUserJoined,
                my_reserved_quintal: myMember?.produce_quantity_quintal || null
            });
        }

        // Sort: pools in/near user's district first, then by distance, then by date
        enriched.sort((a, b) => {
            if (a.distance_to_hub_km !== b.distance_to_hub_km) {
                return a.distance_to_hub_km - b.distance_to_hub_km;
            }
            return a.days_diff - b.days_diff;
        });

        return enriched;
    }

    /**
     * Backward-compatible helper for old /mandi/pools caller
     */
    static async getActivePools(cropId = 1) {
        return this.getAvailablePools({ quantity: 25 });
    }

    /**
     * Returns pools that the user has joined (both upcoming and departed history)
     */
    static async getUserPools(userId) {
        if (!userId) return [];
        const today = new Date().toISOString().split('T')[0];

        const pools = await query(`
            SELECT p.*,
                   m.produce_quantity_quintal as my_reserved_quintal,
                   m.joined_at as my_joined_at,
                   COALESCE(c.name, p.crop_name) as crop_name,
                   COALESCE(mandi.name, p.destination_mandi) as destination_mandi
            FROM transport_pool_members m
            JOIN transport_pools p ON m.pool_id = p.id
            LEFT JOIN crops c ON p.crop_id = c.id
            LEFT JOIN mandis mandi ON p.mandi_id = mandi.id
            WHERE m.user_id = ?
            ORDER BY p.scheduled_date DESC
        `, [userId]);

        return pools.map(p => {
            const isDeparted = p.scheduled_date < today;
            const remaining = Math.max(p.capacity_quintal - p.current_produce_quintal, 0);
            return {
                ...p,
                status: isDeparted ? 'Departed' : (remaining <= 0 ? 'Full' : 'Open'),
                is_departed: isDeparted
            };
        });
    }

    /**
     * Creates a new transport pool with creator as the initial member
     */
    static async createPool({
        cropName,
        destinationMandi,
        pickupHub,
        pickupDistrict,
        scheduledDate,
        departureDate,
        departureTime = '07:00 AM',
        vehicleType = 'Eicher 10-Ton Container',
        myQuantity,
        initialProduceQuintal,
        userId = 1
    }) {
        const date = scheduledDate || departureDate;
        const qty = Number(initialProduceQuintal || myQuantity || 10);

        if (!cropName || !destinationMandi || !pickupHub || !date) {
            throw new Error('Crop, destination APMC, pickup hub, and date are required');
        }

        const today = new Date().toISOString().split('T')[0];
        if (date < today) {
            throw new Error('Pickup date cannot be in the past');
        }

        const vConfig = TRANSPORT_VEHICLE_CONFIGS[vehicleType] || TRANSPORT_VEHICLE_CONFIGS['Eicher 10-Ton Container'];
        const initialQty = Math.max(qty, 1);
        if (initialQty > vConfig.capacity_quintal) {
            throw new Error(`Your quantity (${initialQty} q) exceeds vehicle capacity (${vConfig.capacity_quintal} q)`);
        }

        const cleanDistrict = findDistrict(pickupDistrict)?.name || pickupDistrict || 'Nashik';

        // Calculate initial freight rates
        const econ = calculateFreightEconomics({
            vehicleType,
            pickupDistrict: cleanDistrict,
            destinationDistrict: cleanDistrict,
            currentProduceQuintal: initialQty,
            farmerQuantity: initialQty
        });

        // Fetch user's real name and phone
        const user = await queryOne(
            `SELECT u.full_name, p.phone FROM users u
             LEFT JOIN farmer_profiles p ON p.user_id = u.id
             WHERE u.id = ?`,
            [userId]
        );
        const farmerName = user?.full_name || 'Farmer';
        const phone = user?.phone || null;

        // Find mandi_id and crop_id for legacy constraint compatibility
        const matchedMandi = await queryOne(`SELECT id FROM mandis WHERE name LIKE ? LIMIT 1`, [`%${destinationMandi.split(' ')[0]}%`]);
        const mandiId = matchedMandi?.id || 1;

        const matchedCrop = await queryOne(`SELECT id FROM crops WHERE name LIKE ? LIMIT 1`, [`%${cropName.split(' ')[0]}%`]);
        const cropId = matchedCrop?.id || 1;

        // Insert new pool
        const result = await run(`
            INSERT INTO transport_pools (
                mandi_id, crop_id, destination_mandi, crop_name, scheduled_date, departure_time,
                pickup_hub, pickup_district, current_produce_quintal, capacity_quintal,
                vehicle_type, individual_freight_rate, pooled_freight_rate,
                savings_percentage, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open')
        `, [
            mandiId,
            cropId,
            destinationMandi,
            cropName,
            date,
            departureTime,
            pickupHub,
            cleanDistrict,
            initialQty,
            vConfig.capacity_quintal,
            vehicleType,
            econ.soloCostPerQuintal,
            econ.pooledCostPerQuintal,
            econ.savingsPercentage
        ]);

        const poolId = result.lastInsertRowid || result.lastID;

        // Insert creator as first member
        await run(`
            INSERT INTO transport_pool_members (pool_id, user_id, farmer_name, phone, produce_quantity_quintal)
            VALUES (?, ?, ?, ?, ?)
        `, [poolId, Number(userId) || 1, farmerName, phone || '', initialQty]);

        return {
            id: poolId,
            crop_name: cropName,
            destination_mandi: destinationMandi,
            pickup_hub: pickupHub,
            scheduled_date: date,
            departure_time: departureTime,
            current_produce_quintal: initialQty,
            capacity_quintal: vConfig.capacity_quintal,
            status: 'Open'
        };
    }

    /**
     * Joins an existing pool or updates reserved quantity if user is already a member.
     * Rejects if requested quantity exceeds remaining capacity with clear remaining quantity.
     */
    static async joinPool({ poolId, userId = 1, quantity = 25, farmerName = null, phone = null }) {
        const pool = await queryOne("SELECT * FROM transport_pools WHERE id = ?", [poolId]);
        if (!pool) throw new Error('Transport pool not found');

        const today = new Date().toISOString().split('T')[0];
        if (pool.scheduled_date < today) {
            throw new Error('This pool has already departed and cannot be joined');
        }

        const qty = Math.max(Number(quantity), 1);

        // Fetch user's profile details if not passed
        let realName = farmerName;
        let realPhone = phone;
        if (userId) {
            const user = await queryOne(
                `SELECT u.full_name, p.phone FROM users u
                 LEFT JOIN farmer_profiles p ON p.user_id = u.id
                 WHERE u.id = ?`,
                [userId]
            );
            if (user) {
                realName = user.full_name || realName;
                realPhone = user.phone || realPhone;
            }
        }
        realName = realName || 'Farmer';

        // Check existing member record
        const existingMember = await queryOne(
            `SELECT * FROM transport_pool_members WHERE pool_id = ? AND (user_id = ? OR farmer_name = ?)`,
            [poolId, userId, realName]
        );

        // Current pool filled produce
        const memberSum = await queryOne(
            `SELECT COALESCE(SUM(produce_quantity_quintal), 0) as total FROM transport_pool_members WHERE pool_id = ?`,
            [poolId]
        );
        const currentFilled = memberSum?.total || 0;
        const remainingSpace = Math.max(pool.capacity_quintal - currentFilled, 0);

        if (existingMember) {
            const delta = qty - existingMember.produce_quantity_quintal;
            if (delta > remainingSpace) {
                const maxAvailable = remainingSpace + existingMember.produce_quantity_quintal;
                const err = new Error(`Exceeds vehicle capacity. Only ${maxAvailable} quintals available for your reservation.`);
                err.code = 'EXCEEDS_CAPACITY';
                err.availableCapacity = maxAvailable;
                throw err;
            }

            // Update member's quantity
            await run(
                `UPDATE transport_pool_members SET produce_quantity_quintal = ? WHERE id = ?`,
                [qty, existingMember.id]
            );
        } else {
            if (qty > remainingSpace) {
                const err = new Error(`Only ${remainingSpace} quintals remaining in this pool.`);
                err.code = 'EXCEEDS_CAPACITY';
                err.availableCapacity = remainingSpace;
                throw err;
            }

            // Insert new member
            await run(`
                INSERT INTO transport_pool_members (pool_id, user_id, farmer_name, phone, produce_quantity_quintal)
                VALUES (?, ?, ?, ?, ?)
            `, [poolId, userId, realName, realPhone, qty]);
        }

        // Recalculate pool produce and update status
        const updatedSum = await queryOne(
            `SELECT COALESCE(SUM(produce_quantity_quintal), 0) as total FROM transport_pool_members WHERE pool_id = ?`,
            [poolId]
        );
        const newProduceTotal = updatedSum?.total || 0;
        const newStatus = newProduceTotal >= pool.capacity_quintal ? 'Full' : 'Open';

        await run(
            `UPDATE transport_pools SET current_produce_quintal = ?, status = ? WHERE id = ?`,
            [newProduceTotal, newStatus, poolId]
        );

        return {
            success: true,
            poolId,
            reservedQuintal: qty,
            currentProduceQuintal: newProduceTotal,
            capacityQuintal: pool.capacity_quintal,
            status: newStatus,
            message: `Successfully reserved ${qty} quintals in pool #${poolId}! The pool organiser will contact you.`
        };
    }

    /**
     * Leaves a pool and immediately frees up vehicle capacity
     */
    static async leavePool({ poolId, userId }) {
        if (!poolId || !userId) throw new Error('Pool ID and User ID are required');

        await run(
            `DELETE FROM transport_pool_members WHERE pool_id = ? AND user_id = ?`,
            [poolId, userId]
        );

        // Recalculate produce from remaining members
        const sumResult = await queryOne(
            `SELECT COALESCE(SUM(produce_quantity_quintal), 0) as total FROM transport_pool_members WHERE pool_id = ?`,
            [poolId]
        );
        const newTotal = sumResult?.total || 0;

        await run(
            `UPDATE transport_pools
             SET current_produce_quintal = ?,
                 status = CASE WHEN current_produce_quintal >= capacity_quintal THEN 'Full' ELSE 'Open' END
             WHERE id = ?`,
            [newTotal, poolId]
        );

        return {
            success: true,
            message: 'Successfully left the transport pool'
        };
    }
}
