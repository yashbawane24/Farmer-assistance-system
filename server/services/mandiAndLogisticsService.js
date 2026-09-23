import { query, queryOne, run } from '../models/db.js';

export class SmartMandiService {
    /**
     * Compares Mandis for a given crop and quantity, calculating the True Net Realization:
     * Net Realization = Gross Produce Value - (Distance * Freight Rate * Quintals) - Mandi Fees
     */
    static async compareMandis({ cropName = 'Tomato', produceQuantityQuintal = 25.0, userDistrict = 'Nashik' }) {
        const cleanName = cropName.replace(/[\(\)]/g, '').split(' ')[0].toLowerCase();
        let crop = await queryOne("SELECT * FROM crops WHERE LOWER(name) LIKE ? OR ? LIKE '%' || LOWER(name) || '%'", [
            `%${cleanName}%`,
            cropName.toLowerCase()
        ]);
        if (!crop) {
            crop = await queryOne("SELECT * FROM crops WHERE id = 1");
        }

        let mandiRecords = await query(`
            SELECT m.id as mandi_id, m.name as mandi_name, m.district, m.state, m.distance_km,
                   m.freight_rate_per_km_quintal, m.mandi_handling_fee_per_quintal, m.operating_days,
                   mp.modal_price_quintal, mp.min_price_quintal, mp.max_price_quintal, mp.arrival_quantity_tonnes,
                   mp.price_date
            FROM mandis m
            JOIN mandi_prices mp ON m.id = mp.mandi_id
            WHERE mp.crop_id = ?
            ORDER BY m.distance_km ASC
        `, [crop.id]);

        if (mandiRecords.length === 0) {
            const allMandis = await query("SELECT * FROM mandis");
            const benchmark = crop.historical_avg_price_quintal || 2400;
            mandiRecords = allMandis.map((m, idx) => {
                const variance = Math.round((Math.sin(idx + crop.id) * 0.1 + (idx * 0.04)) * benchmark);
                const modalPrice = benchmark + variance;
                return {
                    mandi_id: m.id,
                    mandi_name: m.name,
                    district: m.district,
                    state: m.state,
                    distance_km: m.distance_km,
                    freight_rate_per_km_quintal: m.freight_rate_per_km_quintal,
                    mandi_handling_fee_per_quintal: m.mandi_handling_fee_per_quintal,
                    operating_days: m.operating_days,
                    modal_price_quintal: modalPrice,
                    min_price_quintal: Math.round(modalPrice * 0.88),
                    max_price_quintal: Math.round(modalPrice * 1.12),
                    arrival_quantity_tonnes: 75 + (idx * 55),
                    price_date: new Date().toISOString().split('T')[0]
                };
            });
        }

        const evaluatedMandis = mandiRecords.map(item => {
            const rawGrossRevenue = Math.round(item.modal_price_quintal * produceQuantityQuintal);
            // Transport freight cost calculation
            const transportCostPerQuintal = Math.round(item.distance_km * item.freight_rate_per_km_quintal);
            const totalTransportCost = Math.round(transportCostPerQuintal * produceQuantityQuintal);
            const totalHandlingFees = Math.round(item.mandi_handling_fee_per_quintal * produceQuantityQuintal);
            const totalDeductions = totalTransportCost + totalHandlingFees;
            const netTakeHomeRealization = rawGrossRevenue - totalDeductions;
            const netPricePerQuintal = Math.round(netTakeHomeRealization / produceQuantityQuintal);

            return {
                mandiId: item.mandi_id,
                mandiName: item.mandi_name,
                district: item.district,
                state: item.state,
                distanceKm: item.distance_km,
                operatingDays: item.operating_days,
                quotedModalPriceQuintal: item.modal_price_quintal,
                priceRange: { min: item.min_price_quintal, max: item.max_price_quintal },
                arrivalsTonnes: item.arrival_quantity_tonnes,
                priceDate: item.price_date,
                economics: {
                    produceQuantityQuintal,
                    rawGrossRevenue,
                    transportCostPerQuintal,
                    totalTransportCost,
                    handlingFees: totalHandlingFees,
                    totalDeductions,
                    netTakeHomeRealization,
                    effectiveNetPricePerQuintal: netPricePerQuintal
                },
                isHighestRawPrice: false,
                isBestNetRealization: false
            };
        });

        // Determine which mandi has the highest quoted raw price vs highest net realization
        if (evaluatedMandis.length > 0) {
            let maxRaw = evaluatedMandis[0];
            let maxNet = evaluatedMandis[0];

            evaluatedMandis.forEach(m => {
                if (m.quotedModalPriceQuintal > maxRaw.quotedModalPriceQuintal) maxRaw = m;
                if (m.economics.netTakeHomeRealization > maxNet.economics.netTakeHomeRealization) maxNet = m;
            });

            maxRaw.isHighestRawPrice = true;
            maxNet.isBestNetRealization = true;
        }

        // Sort primarily by Net Realization descending
        evaluatedMandis.sort((a, b) => b.economics.netTakeHomeRealization - a.economics.netTakeHomeRealization);

        return {
            crop: {
                id: crop.id,
                name: crop.name,
                benchmarkPrice: crop.historical_avg_price_quintal
            },
            quantityQuintal: produceQuantityQuintal,
            userLocation: userDistrict,
            mandis: evaluatedMandis,
            insight: evaluatedMandis.length >= 2 ? {
                bestMandi: evaluatedMandis[0].mandiName,
                netGainOverDistantMarket: evaluatedMandis[0].economics.netTakeHomeRealization - evaluatedMandis[evaluatedMandis.length - 1].economics.netTakeHomeRealization,
                explanation: `While ${evaluatedMandis.find(m => m.isHighestRawPrice)?.mandiName} offers a higher raw quote of ₹${evaluatedMandis.find(m => m.isHighestRawPrice)?.quotedModalPriceQuintal}/q, higher freight eats into profits. ${evaluatedMandis[0].mandiName} yields the highest net take-home realization of ₹${evaluatedMandis[0].economics.netTakeHomeRealization.toLocaleString('en-IN')}.`
            } : null
        };
    }

    static async getPriceTrend(cropName = 'Tomato') {
        // Return 7-day realistic price trend data points for chart
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
        const basePrice = cropName.toLowerCase().includes('tomato') ? 2150 : (cropName.toLowerCase().includes('onion') ? 2750 : 2420);
        
        return days.map((day, idx) => ({
            day,
            price: basePrice + Math.round((Math.sin(idx) * 90) + (idx * 25)),
            arrivals: Math.round(180 + (idx * 15) - (Math.cos(idx) * 30))
        }));
    }
}

export class LogisticsService {
    static async getActivePools(cropId = 1) {
        const pools = await query(`
            SELECT p.*, m.name as mandi_name, m.distance_km, c.name as crop_name
            FROM transport_pools p
            JOIN mandis m ON p.mandi_id = m.id
            JOIN crops c ON p.crop_id = c.id
            WHERE p.status = 'Open'
        `);

        // Fetch members for each pool
        for (const pool of pools) {
            pool.members = await query("SELECT * FROM transport_pool_members WHERE pool_id = ?", [pool.id]);
        }

        return pools;
    }

    static async joinPool({ poolId, farmerName, phone, produceQuantityQuintal }) {
        const pool = await queryOne("SELECT * FROM transport_pools WHERE id = ?", [poolId]);
        if (!pool) throw new Error('Transport pool not found');

        const newProduceTotal = pool.current_produce_quintal + Number(produceQuantityQuintal);
        if (newProduceTotal > pool.capacity_quintal) {
            throw new Error(`Exceeds vehicle capacity. Available capacity: ${(pool.capacity_quintal - pool.current_produce_quintal).toFixed(1)} quintals`);
        }

        // Add member
        await run(`
            INSERT INTO transport_pool_members (pool_id, farmer_name, phone, produce_quantity_quintal)
            VALUES (?, ?, ?, ?)
        `, [poolId, farmerName, phone, produceQuantityQuintal]);

        // Update pool total
        await run(`
            UPDATE transport_pools
            SET current_produce_quintal = ?
            WHERE id = ?
        `, [newProduceTotal, poolId]);

        return {
            success: true,
            message: `Successfully reserved ${produceQuantityQuintal} quintals in pool #${poolId}! Logistics coordinator will contact you at ${phone}.`,
            updatedProduce: newProduceTotal,
            vehicleCapacity: pool.capacity_quintal
        };
    }
}
