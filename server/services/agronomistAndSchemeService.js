import { query, queryOne } from '../models/db.js';
import { localizeScheme } from '../config/schemeContent.js';
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

// Strict Gemini Response Schema for Krishi Mitra with Medium-Length Descriptive Advice
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
            description: 'Direct answer summary, maximum 15 words'
        },
        descriptiveAdvice: {
            type: 'string',
            description: 'Medium-length cohesive descriptive agricultural advice (2-3 well-written paragraphs, around 120-220 words) thoroughly explaining what is happening, why it happened, practical field measures, and remedies in natural conversational prose.'
        },
        likelyCause: {
            type: 'string',
            description: '1 sentence, say "likely" unless certain; empty string if not relevant'
        },
        confidence: {
            type: 'string',
            enum: ['high', 'medium', 'low']
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
            description: 'The COMPLETE descriptive answer in the farmer\'s language for full read-aloud playback. Plain spoken sentences without any symbols or bullet characters.'
        }
    },
    required: [
        'intent',
        'headline',
        'descriptiveAdvice',
        'likelyCause',
        'confidence',
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
    const descriptiveAdvice = stripMarkdown(String(raw.descriptiveAdvice || raw.advice || raw.fullText || raw.text || headline || ''));
    const likelyCause = raw.likelyCause && raw.likelyCause !== 'null' ? stripMarkdown(String(raw.likelyCause)) : '';
    const weatherNote = raw.weatherNote && raw.weatherNote !== 'null' ? stripMarkdown(String(raw.weatherNote)) : '';
    const askBack = raw.askBack && raw.askBack !== 'null' ? stripMarkdown(String(raw.askBack)) : '';
    const speakText = stripMarkdown(String(raw.speakText || descriptiveAdvice || headline || ''));

    const followUps = Array.isArray(raw.followUps)
        ? raw.followUps.map(f => stripMarkdown(String(f || ''))).filter(Boolean).slice(0, 3)
        : [];

    return {
        intent,
        headline,
        descriptiveAdvice,
        likelyCause,
        confidence: ['high', 'medium', 'low'].includes(raw.confidence) ? raw.confidence : 'medium',
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

        const systemInstruction = `You are Krishi Mitra, an expert agronomist advising smallholder farmers in ${REGION_STATE}.

FARM CONTEXT:
- Farmer: ${context.farmerName}, ${context.district} district, ${REGION_STATE}
- Crop: ${context.crop} (${context.stage}), Soil: ${context.soil}, Water: ${context.water || 'Moderate'}
- Recent scan: ${context.recentDiagnosis}

LIVE WEATHER (${context.district}): ${weatherSummary}
MANDI PRICES (${context.crop}): ${marketSummary}
MSP: ${mspLines}
${matchedDocs.length ? `KNOWLEDGE: [${matchedDocs[0].topic}] ${matchedDocs[0].content}` : ''}

RULES:
1. Intent first: classify into disease_pest | nutrition_fertilizer | irrigation_weather | market_price | scheme_subsidy | crop_planning | general | unclear. Questions asking whether to spray tomorrow, weather suitability for spraying, rain, or irrigation MUST be classified as irrigation_weather.
2. Provide a medium-length, cohesive, descriptive agricultural consultation in natural conversational paragraphs (around 120-220 words). Do NOT format the answer as simple pointwise bullet lists; explain clearly what is happening, why it happened, and descriptive guidance on what the farmer should do in their field.
3. If the user question is vague or lacks symptoms (e.g. "My crop is not good"), classify as "unclear", set confidence "low", set askBack to ONE clear clarifying question, explain descriptively what details are needed, and set treatment to null.
4. Treatment section: ONLY provide for disease_pest or nutrition_fertilizer. For all other intents (including irrigation_weather, market_price, scheme_subsidy, unclear), treatment MUST BE null.
5. Diagnosis from text only: state "likely" in likelyCause and set appAction to "disease_scan" (so the farmer can verify with a leaf photo).
6. Chemicals: only CIB&RC-approved products sold in Maharashtra, with dose per 15-litre pump AND per acre, pre-harvest interval and one safety line. Prefer the organic option first.
7. Prices: market_price must use ONLY the MANDI PRICES context with APMC name and date. If missing, say unavailable and set appAction to "smart_mandi". Never invent prices.
8. Weather: irrigation_weather questions must evaluate spraying conditions using the LIVE WEATHER context (forecast rain, humidity, wind) and give descriptive spraying guidance. Treatment MUST be null.
9. Serious cases (>30% damage, rapid spread, animal health) -> recommend KVK / Kisan Call Centre 1800-180-1551.
10. Reply in ${langName} only. Use simple words; Marathi/Hindi in native script; keep chemical/product names in English.
11. Absolutely NO markdown symbols (no **, no ###, no ---).
12. Ensure speakText contains the COMPLETE descriptive consultation so the farmer can listen to the entire advice read aloud.`;

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
     * Fast non-streaming structured consultation returning medium-length descriptive JSON.
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
            maxOutputTokens: 1000,
            timeoutMs: 25000
        });

        const geminiDuration = Date.now() - startGemini;
        const totalDuration = Date.now() - startTotal;

        const structured = cleanAgronomistJson(rawJson) || {
            intent: 'general',
            headline: 'Agricultural Consultation',
            descriptiveAdvice: 'Please consult your local agricultural extension officer or Krishi Vigyan Kendra for specific assistance.',
            likelyCause: '',
            confidence: 'medium',
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
        const answer = await this.consult({ question, farmerId, language, history });
        if (onChunk && (answer.descriptiveAdvice || answer.headline)) {
            onChunk(answer.descriptiveAdvice || answer.headline);
        }
        return answer;
    }
}

export class GovernmentSchemeService {
    static async getSchemes({ cropName, landCategory, state = 'Maharashtra', lang = 'en' }) {
        let sql = "SELECT * FROM government_schemes WHERE 1=1";
        const params = [];

        if (cropName && cropName !== 'All') {
            sql += " AND (target_crops LIKE ? OR target_crops LIKE '%All%')";
            params.push(`%${cropName}%`);
        }

        const schemes = await query(sql, params);
        return schemes.map(row => localizeScheme(row, lang));
    }

    static async getSchemeById(id) {
        return queryOne("SELECT * FROM government_schemes WHERE id = ?", [id]);
    }
}
