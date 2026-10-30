import { query, queryOne } from '../models/db.js';
import { REGION_STATE, REGION_CROPS } from '../config/maharashtra.js';
import { generate, streamGenerate, resolveOptimizedModel, LANGUAGE_NAMES } from './geminiService.js';
import { getLatestCropPrices } from './agmarknetService.js';
import { WeatherService } from './weatherAndAlertService.js';

const MAX_HISTORY_TURNS = 6;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes in-memory cache

// In-memory cache for weather and mandi summaries per district+crop
const summaryCache = new Map();

export function getCached(key) {
    const entry = summaryCache.get(key);
    if (entry && (Date.now() - entry.timestamp < CACHE_TTL_MS)) {
        return entry.data;
    }
    return null;
}

export function setCached(key, data) {
    summaryCache.set(key, { data, timestamp: Date.now() });
}

// Strict Gemini Response Schema for Krishi Mitra
export const AGRONOMIST_RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
        intent: {
            type: 'string',
            enum: [
                'disease_pest',
                'nutrition_fertilizer',
                'irrigation_weather',
                'market_price',
                'scheme_subsidy',
                'crop_planning',
                'general',
                'unclear'
            ]
        },
        headline: {
            type: 'string',
            description: 'Direct answer, maximum 15 words'
        },
        likelyCause: {
            type: 'string',
            description: '1 sentence, say "likely" unless certain; empty string if not relevant'
        },
        confidence: {
            type: 'string',
            enum: ['high', 'medium', 'low']
        },
        steps: {
            type: 'array',
            items: { type: 'string' },
            description: '2-4 short action steps, each max 20 words, starting with an active verb'
        },
        treatment: {
            type: 'object',
            nullable: true,
            description: 'ONLY for disease_pest or nutrition_fertilizer intents, otherwise null',
            properties: {
                organic: {
                    type: 'object',
                    nullable: true,
                    properties: {
                        name: { type: 'string' },
                        dosePerLitre: { type: 'string' },
                        dosePerAcre: { type: 'string' }
                    }
                },
                chemical: {
                    type: 'object',
                    nullable: true,
                    properties: {
                        product: { type: 'string' },
                        activeIngredient: { type: 'string' },
                        dosePerLitre: { type: 'string' },
                        dosePerAcre: { type: 'string' },
                        waitDaysBeforeHarvest: { type: 'string' },
                        safety: { type: 'string' }
                    }
                }
            }
        },
        priceInfo: {
            type: 'object',
            nullable: true,
            description: 'ONLY for market_price from context, otherwise null',
            properties: {
                mandi: { type: 'string' },
                modalPrice: { type: 'string' },
                date: { type: 'string' },
                comparedToMsp: { type: 'string' }
            }
        },
        weatherNote: {
            type: 'string',
            description: '1 sentence when weather matters, otherwise empty string'
        },
        askBack: {
            type: 'string',
            description: 'If question is unclear, 1 short clarifying question; otherwise empty string'
        },
        appAction: {
            type: 'string',
            enum: ['disease_scan', 'smart_mandi', 'crop_advisor', 'schemes', 'weather', 'none']
        },
        followUps: {
            type: 'array',
            items: { type: 'string' },
            description: '2-3 short follow-up questions the farmer can tap'
        },
        speakText: {
            type: 'string',
            description: '2-3 plain spoken sentences in the farmer\'s language (headline + key step). No symbols.'
        }
    },
    required: [
        'intent',
        'headline',
        'likelyCause',
        'confidence',
        'steps',
        'treatment',
        'priceInfo',
        'weatherNote',
        'askBack',
        'appAction',
        'followUps',
        'speakText'
    ]
};

// Keyword retrieval from agronomy knowledge base (max 1 most relevant doc to keep prompt compact)
function retrieveKnowledge(docs, question, crop) {
    if (!docs || docs.length === 0 || !question) return [];
    const q = question.toLowerCase();
    const scored = docs.map(doc => {
        const keywords = (doc.keywords || '').toLowerCase().split(',').map(k => k.trim()).filter(Boolean);
        let score = keywords.filter(k => q.includes(k)).length * 2;
        if (doc.crop_name && q.includes(doc.crop_name.toLowerCase())) score += 2;
        if (doc.crop_name && crop && doc.crop_name.toLowerCase() === crop.toLowerCase()) score += 1;
        return { doc, score };
    });
    return scored.filter(s => s.score > 1).sort((a, b) => b.score - a.score).slice(0, 1).map(s => s.doc);
}

// Quick 1.5s timeout on weather so it never blocks answers
export async function getWeatherSummary(district = 'Nashik') {
    const cacheKey = `weather:${district.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Weather timeout')), 1500)
        );
        const live = await Promise.race([
            WeatherService.fetchLiveMeteorology(district),
            timeoutPromise
        ]);

        if (!live?.current) return 'Live weather unavailable right now.';
        const d = live.daily || {};
        const days = (d.time || []).slice(0, 3).map((date, i) =>
            `${date}: ${Math.round(d.temperature_2m_min?.[i])}-${Math.round(d.temperature_2m_max?.[i])}°C, rain ${d.precipitation_probability_max?.[i] ?? '?'}%`
        );
        const summary = `Now ${Math.round(live.current.temperature_2m)}°C, humidity ${Math.round(live.current.relative_humidity_2m)}%, wind ${Math.round(live.current.wind_speed_10m)} km/h. Next 3 days: ${days.join('; ')}`;
        setCached(cacheKey, summary);
        return summary;
    } catch {
        return 'Current seasonal weather conditions in Maharashtra.';
    }
}

// Top 5 mandi prices cached for 15 minutes
export async function getMarketSummary(crop = 'Tomato', district = 'Nashik') {
    const cacheKey = `mandi:${crop.toLowerCase()}:${district.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const { rows } = await getLatestCropPrices(crop);
        if (!rows || rows.length === 0) return `No recent ${crop} APMC reports in Maharashtra.`;
        const sorted = [...rows].sort((a, b) =>
            Number(b.district === district) - Number(a.district === district) || b.modal_price_quintal - a.modal_price_quintal
        ).slice(0, 5);
        const summary = sorted.map(r => `${r.market} APMC (${r.district}): modal ₹${r.modal_price_quintal}/q (${r.arrival_date})`).join('; ');
        setCached(cacheKey, summary);
        return summary;
    } catch {
        return 'Mandi prices available on the Smart Mandi page.';
    }
}

function stripMarkdown(text) {
    if (typeof text !== 'string') return text;
    return text
        .replace(/\*\*/g, '')
        .replace(/###/g, '')
        .replace(/---/g, '')
        .replace(/^#+\s*/gm, '')
        .trim();
}

export function cleanAgronomistJson(raw) {
    if (!raw || typeof raw !== 'object') return null;

    const intent = raw.intent || 'general';
    const isTreatmentAllowed = intent === 'disease_pest' || intent === 'nutrition_fertilizer';
    const isPriceAllowed = intent === 'market_price';

    const cleanSteps = Array.isArray(raw.steps)
        ? raw.steps.map(s => stripMarkdown(String(s || ''))).filter(Boolean).slice(0, 4)
        : [];

    let treatment = null;
    if (isTreatmentAllowed && raw.treatment && typeof raw.treatment === 'object') {
        const org = raw.treatment.organic;
        const chem = raw.treatment.chemical;
        treatment = {
            organic: org && typeof org === 'object' && org.name ? {
                name: stripMarkdown(String(org.name || '')),
                dosePerLitre: stripMarkdown(String(org.dosePerLitre || '')),
                dosePerAcre: stripMarkdown(String(org.dosePerAcre || ''))
            } : null,
            chemical: chem && typeof chem === 'object' && (chem.product || chem.activeIngredient) ? {
                product: stripMarkdown(String(chem.product || '')),
                activeIngredient: stripMarkdown(String(chem.activeIngredient || '')),
                dosePerLitre: stripMarkdown(String(chem.dosePerLitre || '')),
                dosePerAcre: stripMarkdown(String(chem.dosePerAcre || '')),
                waitDaysBeforeHarvest: stripMarkdown(String(chem.waitDaysBeforeHarvest || '')),
                safety: stripMarkdown(String(chem.safety || ''))
            } : null
        };
        if (!treatment.organic && !treatment.chemical) treatment = null;
    }

    let priceInfo = null;
    if (isPriceAllowed && raw.priceInfo && typeof raw.priceInfo === 'object') {
        priceInfo = {
            mandi: stripMarkdown(String(raw.priceInfo.mandi || '')),
            modalPrice: stripMarkdown(String(raw.priceInfo.modalPrice || '')),
            date: stripMarkdown(String(raw.priceInfo.date || '')),
            comparedToMsp: stripMarkdown(String(raw.priceInfo.comparedToMsp || ''))
        };
    }

    const headline = stripMarkdown(String(raw.headline || ''));
    const likelyCause = raw.likelyCause && raw.likelyCause !== 'null' ? stripMarkdown(String(raw.likelyCause)) : '';
    const weatherNote = raw.weatherNote && raw.weatherNote !== 'null' ? stripMarkdown(String(raw.weatherNote)) : '';
    const askBack = raw.askBack && raw.askBack !== 'null' ? stripMarkdown(String(raw.askBack)) : '';
    const speakText = stripMarkdown(String(raw.speakText || headline || ''));

    const followUps = Array.isArray(raw.followUps)
        ? raw.followUps.map(f => stripMarkdown(String(f || ''))).filter(Boolean).slice(0, 3)
        : [];

    return {
        intent,
        headline,
        likelyCause,
        confidence: ['high', 'medium', 'low'].includes(raw.confidence) ? raw.confidence : 'medium',
        steps: cleanSteps,
        treatment,
        priceInfo,
        weatherNote,
        askBack,
        appAction: ['disease_scan', 'smart_mandi', 'crop_advisor', 'schemes', 'weather', 'none'].includes(raw.appAction) ? raw.appAction : 'none',
        followUps,
        speakText
    };
}

export class AgronomistRagService {
    /**
     * Builds fast agricultural prompt with parallel context loading and memory caching.
     */
    static async buildAgronomistPrompt({ question, farmerId = 1, language = 'en', history = [] }) {
        const startCtx = Date.now();

        // 1. Parallel loading of profile, farm, recent scan, knowledge docs
        const [farmerProfile, knowledgeDocs] = await Promise.all([
            queryOne(`
                SELECT p.*, u.full_name FROM farmer_profiles p
                JOIN users u ON p.user_id = u.id
                WHERE u.id = ?
            `, [farmerId]),
            query("SELECT * FROM knowledge_documents")
        ]);

        const farm = farmerProfile ? await queryOne("SELECT * FROM farms WHERE farmer_profile_id = ?", [farmerProfile.id]) : null;
        const recentScan = farm ? await queryOne("SELECT * FROM disease_scans WHERE farm_id = ? ORDER BY scanned_at DESC LIMIT 1", [farm.id]) : null;

        const context = {
            farmerName: farmerProfile?.full_name || 'Farmer',
            district: farmerProfile?.district || 'Nashik',
            crop: farm?.current_crop || 'Tomato',
            stage: farm?.crop_stage || 'Flowering to Fruit Set',
            soil: farm?.soil_type || 'Black Soil (Regur)',
            landSize: farm?.land_size_acres,
            water: farm?.water_reliability,
            recentDiagnosis: recentScan?.detected_disease || 'None recorded'
        };

        // 2. Parallel loading of weather and mandi prices (with cache & 1.5s timeout)
        const [weatherSummary, marketSummary] = await Promise.all([
            getWeatherSummary(context.district),
            getMarketSummary(context.crop, context.district)
        ]);

        const matchedDocs = retrieveKnowledge(knowledgeDocs, question, context.crop);
        const mspLines = REGION_CROPS.filter(c => c.msp).map(c => `${c.name} ₹${c.msp}`).join(', ');
        const langName = LANGUAGE_NAMES[language] || 'English';

        const systemInstruction = `You are Krishi Mitra, a practical agronomist for small farmers in ${REGION_STATE}. Be brief, specific and actionable. A farmer reads this on a phone in the field.

FARM CONTEXT:
- Farmer: ${context.farmerName}, ${context.district} district, ${REGION_STATE}
- Crop: ${context.crop} (${context.stage}), Soil: ${context.soil}, Water: ${context.water || 'Moderate'}
- Recent scan: ${context.recentDiagnosis}

LIVE WEATHER (${context.district}): ${weatherSummary}
MANDI PRICES (${context.crop}): ${marketSummary}
MSP: ${mspLines}
${matchedDocs.length ? `KNOWLEDGE: [${matchedDocs[0].topic}] ${matchedDocs[0].content}` : ''}

RULES:
1. Intent first: classify into disease_pest | nutrition_fertilizer | irrigation_weather | market_price | scheme_subsidy | crop_planning | general | unclear.
2. If the user question is vague, unclear or lacks symptoms (e.g. "My crop is not good"), classify intent as "unclear", set confidence "low", set askBack to ONE short clarifying question, keep steps general and safe, and set treatment to null.
3. Treatment section: ONLY provide for disease_pest or nutrition_fertilizer. For ALL other intents, treatment MUST BE null.
4. Diagnosis from text only: say "likely" in likelyCause and set appAction to "disease_scan" (so the farmer can confirm with a photo). If symptoms are not described clearly, set askBack and keep steps general/safe.
5. Chemicals: only CIB&RC-approved products sold in Maharashtra, with dose per 15-litre pump AND per acre, pre-harvest interval and one safety line. Prefer the organic option first.
6. Prices: market_price must use ONLY the MANDI PRICES context, with APMC name and date. If missing or asked for another crop/district not in context, state that it is unavailable and set appAction to "smart_mandi". Never invent prices.
7. Weather: irrigation_weather questions must use the LIVE WEATHER context.
8. Serious cases (rapid spread, more than 30% of plants affected, animal health) -> recommend the KVK / Kisan Call Centre 1800-180-1551.
9. Reply in ${langName} only. Use simple words; Marathi/Hindi in native script; keep chemical/product names in English.
10. Non-farming question -> politely say you only help with farming.
11. Keep the total visible answer under about 120 words. No markdown formatting symbols (no **, no ###, no ---). Headline max 15 words. Each step max 20 words, starting with an active verb.`;

        const contents = (Array.isArray(history) ? history : [])
            .slice(-MAX_HISTORY_TURNS)
            .filter(m => m && typeof m.text === 'string' && m.text.trim())
            .map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text.slice(0, 1000) }] }));

        while (contents.length && contents[0].role !== 'user') contents.shift();

        return {
            systemInstruction,
            contents,
            context,
            matchedDocs,
            ctxDurationMs: Date.now() - startCtx
        };
    }

    /**
     * Fast non-streaming structured consultation returning clean JSON.
     */
    static async consult({ question, farmerId = 1, language = 'en', history = [] }) {
        const startTotal = Date.now();
        const { systemInstruction, contents, context, matchedDocs, ctxDurationMs } =
            await this.buildAgronomistPrompt({ question, farmerId, language, history });

        contents.push({ role: 'user', parts: [{ text: (question || '').slice(0, 1500) }] });

        const model = await resolveOptimizedModel();
        const startGemini = Date.now();

        const rawJson = await generate({
            systemInstruction,
            contents,
            responseSchema: AGRONOMIST_RESPONSE_SCHEMA,
            temperature: 0.3,
            maxOutputTokens: 500,
            timeoutMs: 20000
        });

        const geminiDuration = Date.now() - startGemini;
        const totalDuration = Date.now() - startTotal;

        const structured = cleanAgronomistJson(rawJson) || {
            intent: 'general',
            headline: 'Agricultural Consultation',
            likelyCause: '',
            confidence: 'medium',
            steps: ['Consult your local agricultural extension officer (KVK).'],
            treatment: null,
            priceInfo: null,
            weatherNote: '',
            askBack: '',
            appAction: 'none',
            followUps: [],
            speakText: 'Please consult your local agricultural extension officer.'
        };

        if (process.env.DEBUG_PERF !== 'false') {
            console.log(`⚡ [Agronomist Consult] Q: "${(question || '').slice(0, 40)}" | Intent: ${structured.intent} | Model: ${model} | Ctx: ${ctxDurationMs}ms | Gemini: ${geminiDuration}ms | Total: ${totalDuration}ms`);
        }

        return {
            query: question,
            language,
            retrievedContext: context,
            aiAvailable: true,
            aiEngine: `Google Gemini (${model})`,
            knowledgeTopic: matchedDocs[0]?.topic || null,
            timings: {
                contextMs: ctxDurationMs,
                geminiMs: geminiDuration,
                totalMs: totalDuration
            },
            ...structured
        };
    }

    /**
     * Pre-warms the model and context cache so subsequent user queries are instant (<2s).
     */
    static async warmup({ farmerId = 1, district = 'Nashik', crop = 'Tomato' }) {
        const start = Date.now();
        const [model] = await Promise.all([
            resolveOptimizedModel(),
            getWeatherSummary(district),
            getMarketSummary(crop, district)
        ]);
        return {
            model,
            warmed: true,
            durationMs: Date.now() - start
        };
    }

    /**
     * Backward-compatible streaming consultation.
     */
    static async consultStream({
        question,
        audioBase64,
        audioMimeType = 'audio/webm',
        farmerId = 1,
        language = 'en',
        history = [],
        onChunk,
        signal
    }) {
        // Fallback for any legacy callers: execute consult and stream speakText
        const answer = await this.consult({ question, farmerId, language, history });
        if (onChunk && answer.headline) {
            onChunk(answer.headline);
            if (answer.steps && answer.steps.length) {
                onChunk('\n' + answer.steps.join('\n'));
            }
        }
        return answer;
    }
}

export class GovernmentSchemeService {
    static async getSchemes({ cropName, landCategory, state = 'Maharashtra' }) {
        let sql = "SELECT * FROM government_schemes WHERE 1=1";
        const params = [];

        if (cropName && cropName !== 'All') {
            sql += " AND (target_crops LIKE ? OR target_crops LIKE '%All%')";
            params.push(`%${cropName}%`);
        }

        const schemes = await query(sql, params);
        return schemes;
    }

    static async getSchemeById(id) {
        return queryOne("SELECT * FROM government_schemes WHERE id = ?", [id]);
    }
}
