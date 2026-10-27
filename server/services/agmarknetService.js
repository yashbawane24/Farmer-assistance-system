import { query, runBatch } from '../models/db.js';
import { REGION_STATE, findCropByCommodity, findRegionCrop, findDistrict } from '../config/maharashtra.js';

// Government of India open data: "Current Daily Price of Various Commodities from Various Markets (Mandi)"
// https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi
// Free API key: https://data.gov.in -> Sign up -> My Account -> Generate API key
const RESOURCE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const PAGE_SIZE = 1000;
const MAX_PAGES = 10;
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // Agmarknet publishes once a day; every 6 hours is plenty
export const RECENT_DAYS = 15; // mandis that have not reported for 15 days are treated as stale

export const syncStatus = {
    configured: false,
    lastAttempt: null,
    lastSuccess: null,
    lastError: null,
    rowsSaved: 0
};

export const isAgmarknetConfigured = () => Boolean(process.env.DATA_GOV_API_KEY);

// Agmarknet dates are dd/mm/yyyy; store as ISO yyyy-mm-dd so SQLite can sort them
function toIsoDate(value = '') {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value).trim());
    return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function toNumber(value) {
    const n = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(n) ? n : 0;
}

export function isoDaysAgo(days) {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
}

async function fetchPage(apiKey, offset) {
    const params = new URLSearchParams({
        'api-key': apiKey,
        format: 'json',
        limit: String(PAGE_SIZE),
        offset: String(offset),
        'filters[state.keyword]': REGION_STATE
    });
    const res = await fetch(`${RESOURCE_URL}?${params.toString()}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-IN,en;q=0.9',
            'Connection': 'keep-alive'
        },
        signal: AbortSignal.timeout(30000)
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.error) {
        throw new Error(`data.gov.in: ${body.error || body.message || `HTTP ${res.status}`}`);
    }
    return { records: body.records || [], total: Number(body.total) || 0 };
}

/**
 * Downloads today's Maharashtra mandi prices from Agmarknet and stores them.
 * Rows accumulate day by day, which is what the price-trend charts are built from.
 */
export async function syncMandiPrices() {
    const apiKey = process.env.DATA_GOV_API_KEY;
    syncStatus.configured = Boolean(apiKey);
    syncStatus.lastAttempt = new Date().toISOString();

    if (!apiKey) {
        syncStatus.lastError = 'DATA_GOV_API_KEY is not set in server/.env';
        throw new Error(syncStatus.lastError);
    }

    try {
        const records = [];
        for (let page = 0; page < MAX_PAGES; page++) {
            const { records: batch, total } = await fetchPage(apiKey, page * PAGE_SIZE);
            records.push(...batch);
            if (batch.length < PAGE_SIZE || records.length >= total) break;
        }

        const rows = [];
        for (const r of records) {
            const arrivalDate = toIsoDate(r.arrival_date);
            const modal = toNumber(r.modal_price);
            if (!arrivalDate || modal <= 0) continue;
            const crop = findCropByCommodity(r.commodity);
            rows.push([
                r.commodity,
                crop?.name || r.commodity,
                r.variety || 'Other',
                r.market,
                findDistrict(r.district)?.name || r.district,
                r.state,
                arrivalDate,
                toNumber(r.min_price) || modal,
                toNumber(r.max_price) || modal,
                modal
            ]);
        }

        await runBatch(`
            INSERT INTO live_mandi_prices (commodity, crop_name, variety, market, district, state, arrival_date,
                min_price_quintal, max_price_quintal, modal_price_quintal, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'agmarknet')
            ON CONFLICT (commodity, variety, market, arrival_date) DO UPDATE SET
                min_price_quintal = excluded.min_price_quintal,
                max_price_quintal = excluded.max_price_quintal,
                modal_price_quintal = excluded.modal_price_quintal,
                fetched_at = CURRENT_TIMESTAMP
        `, rows);

        syncStatus.lastSuccess = new Date().toISOString();
        syncStatus.lastError = null;
        syncStatus.rowsSaved = rows.length;
        console.log(`📈 [Agmarknet] Synced ${rows.length} Maharashtra mandi price rows.`);
        return rows.length;
    } catch (err) {
        const causeDetail = err.cause?.message || err.cause?.code || '';
        syncStatus.lastError = causeDetail ? `${err.message} (${causeDetail})` : err.message;
        console.warn(`⚠️ [Agmarknet] Sync failed: ${syncStatus.lastError}`);
        throw err;
    }
}

export function startMandiPriceScheduler() {
    syncStatus.configured = isAgmarknetConfigured();
    if (!syncStatus.configured) {
        console.warn('⚠️ [Agmarknet] DATA_GOV_API_KEY not set - live mandi prices disabled. Get a free key at https://data.gov.in');
        return;
    }
    const runSync = () => syncMandiPrices().catch(() => undefined);
    setTimeout(runSync, 3000);
    setInterval(runSync, SYNC_INTERVAL_MS);
}

/**
 * Latest reported price for each market/variety of a crop in Maharashtra (last 15 days).
 * Each row also carries the previous reported modal price for an honest day-on-day change.
 */
export async function getLatestCropPrices(cropName) {
    const crop = findRegionCrop(cropName);
    const commodities = crop ? crop.commodities : [cropName];
    const placeholders = commodities.map(() => '?').join(',');

    let rows = await query(`
        SELECT * FROM live_mandi_prices
        WHERE state = ? AND commodity IN (${placeholders}) AND arrival_date >= ?
        ORDER BY arrival_date DESC
    `, [REGION_STATE, ...commodities, isoDaysAgo(RECENT_DAYS)]);

    // Resilient fallback: If no records within recent 15 days, retrieve latest available benchmark records
    if (rows.length === 0) {
        rows = await query(`
            SELECT * FROM live_mandi_prices
            WHERE state = ? AND commodity IN (${placeholders})
            ORDER BY arrival_date DESC
            LIMIT 100
        `, [REGION_STATE, ...commodities]);
    }

    const latest = new Map();
    for (const row of rows) {
        const key = `${row.commodity}|${row.variety}|${row.market}`;
        const entry = latest.get(key);
        if (!entry) {
            latest.set(key, { ...row, previous_modal_price: null, previous_date: null });
        } else if (entry.previous_modal_price === null) {
            entry.previous_modal_price = row.modal_price_quintal;
            entry.previous_date = row.arrival_date;
        }
    }
    return { crop, rows: [...latest.values()] };
}

/**
 * Daily Maharashtra average modal price for a crop (or a single market), oldest first.
 */
export async function getCropPriceHistory(cropName, { market, days = 30 } = {}) {
    const crop = findRegionCrop(cropName);
    const commodities = crop ? crop.commodities : [cropName];
    const placeholders = commodities.map(() => '?').join(',');
    const params = [REGION_STATE, ...commodities, isoDaysAgo(days)];
    let marketFilter = '';
    if (market) {
        marketFilter = 'AND market = ?';
        params.push(market);
    }

    let history = await query(`
        SELECT arrival_date AS date,
               ROUND(AVG(modal_price_quintal)) AS modal_price,
               MIN(min_price_quintal) AS min_price,
               MAX(max_price_quintal) AS max_price,
               COUNT(DISTINCT market) AS markets
        FROM live_mandi_prices
        WHERE state = ? AND commodity IN (${placeholders}) AND arrival_date >= ? ${marketFilter}
        GROUP BY arrival_date
        ORDER BY arrival_date ASC
    `, params);

    // Fallback: If no records within recent days window, load latest available trend records
    if (history.length === 0) {
        const fallbackParams = [REGION_STATE, ...commodities];
        if (market) fallbackParams.push(market);
        history = await query(`
            SELECT arrival_date AS date,
                   ROUND(AVG(modal_price_quintal)) AS modal_price,
                   MIN(min_price_quintal) AS min_price,
                   MAX(max_price_quintal) AS max_price,
                   COUNT(DISTINCT market) AS markets
            FROM live_mandi_prices
            WHERE state = ? AND commodity IN (${placeholders}) ${marketFilter}
            GROUP BY arrival_date
            ORDER BY arrival_date ASC
            LIMIT 30
        `, fallbackParams);
    }

    return history;
}

/**
 * Average modal price of a crop across Maharashtra mandis (district first), or null if none reported
 */
export async function getAverageMarketPrice(cropName, district) {
    const { rows } = await getLatestCropPrices(cropName);
    if (rows.length === 0) return null;
    const local = district ? rows.filter(r => r.district.toLowerCase() === String(district).toLowerCase()) : [];
    const used = local.length > 0 ? local : rows;
    const avg = Math.round(used.reduce((acc, r) => acc + r.modal_price_quintal, 0) / used.length);
    const newest = used.reduce((max, r) => (r.arrival_date > max ? r.arrival_date : max), used[0].arrival_date);
    return {
        price: avg,
        markets: used.length,
        scope: local.length > 0 ? district : REGION_STATE,
        asOf: newest
    };
}
