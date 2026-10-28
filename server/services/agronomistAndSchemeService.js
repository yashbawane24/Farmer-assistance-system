import { query, queryOne } from '../models/db.js';
import { REGION_STATE, REGION_CROPS, MSP_YEAR_LABEL } from '../config/maharashtra.js';
import { generate, streamGenerate, isGeminiConfigured, resolveOptimizedModel, LANGUAGE_NAMES } from './geminiService.js';
import { getLatestCropPrices } from './agmarknetService.js';
import { WeatherService } from './weatherAndAlertService.js';

const MAX_HISTORY_TURNS = 6;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes in-memory cache

// In-memory cache for weather and mandi summaries per district+crop
const summaryCache = new Map();

function getCached(key) {
    const entry = summaryCache.get(key);
    if (entry && (Date.now() - entry.timestamp < CACHE_TTL_MS)) {
        return entry.data;
    }
    return null;
}

function setCached(key, data) {
    summaryCache.set(key, { data, timestamp: Date.now() });
}

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

// Quick 1.5s timeout on weather so it never delays voice responses
async function getWeatherSummary(district = 'Nashik') {
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
async function getMarketSummary(crop = 'Tomato', district = 'Nashik') {
    const cacheKey = `mandi:${crop.toLowerCase()}:${district.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const { rows } = await getLatestCropPrices(crop);
        if (!rows || rows.length === 0) return `No recent ${crop} APMC reports in Maharashtra.`;
        const sorted = [...rows].sort((a, b) =>
            Number(b.district === district) - Number(a.district === district) || b.modal_price_quintal - a.modal_price_quintal
        ).slice(0, 5);
        const summary = sorted.map(r => `${r.market} APMC (${r.district}): modal ₹${r.modal_price_quintal}/q (${r.arrival_date})`).join('\n');
        setCached(cacheKey, summary);
        return summary;
    } catch {
        return 'Mandi prices available on the Smart Mandi page.';
    }
}

/**
 * Parses streamable text format into structured cards for the UI:
 * [Direct Answer]
 * ===ACTIONS===
 * - Action 1
 * ===ORGANIC===
 * Remedy
 * ===CHEMICAL===
 * Chemical dose
 * ===TIP===
 * Farmer tip
 */
export function parseStructuredAnswer(rawText = '') {
    let transcript = null;
    let text = rawText;

    // Extract TRANSCRIPT: line if present (from audio questions)
    const transcriptMatch = /^TRANSCRIPT:\s*(.+)$/m.exec(text);
    if (transcriptMatch) {
        transcript = transcriptMatch[1].trim();
        text = text.replace(/^TRANSCRIPT:\s*.+\n*/m, '').trim();
    }

    const sections = {
        answer: '',
        actions: [],
        organic: '',
        chemical: '',
        tip: ''
    };

    const parts = text.split(/(===ACTIONS===|===ORGANIC===|===CHEMICAL===|===TIP===)/g);
    sections.answer = (parts[0] || '').trim();

    for (let i = 1; i < parts.length; i += 2) {
        const marker = parts[i];
        const content = (parts[i + 1] || '').trim();
        if (marker === '===ACTIONS===') {
            sections.actions = content
                .split('\n')
                .map(l => l.replace(/^[-*•\d.]\s*/, '').trim())
                .filter(Boolean);
        } else if (marker === '===ORGANIC===') {
            sections.organic = content;
        } else if (marker === '===CHEMICAL===') {
            sections.chemical = content;
        } else if (marker === '===TIP===') {
            sections.tip = content;
        }
    }

    const hasTreatment = Boolean(sections.organic || sections.chemical);

    // Build complete conversational readout across all sections (root cause + actions + remedies + tip)
    const audioParts = [];
    if (sections.answer) {
        audioParts.push(sections.answer);
    }
    if (sections.actions && sections.actions.length > 0) {
        audioParts.push(sections.actions.join('. '));
    }
    if (sections.organic && sections.organic !== '-') {
        audioParts.push(sections.organic);
    }
    if (sections.chemical && sections.chemical !== '-') {
        audioParts.push(sections.chemical);
    }
    if (sections.tip) {
        audioParts.push(sections.tip);
    }

    const fullAudioReadout = audioParts.length > 0 ? audioParts.join('. ') : text;

    return {
        transcript,
        rootCause: sections.answer || text,
        immediateAction: sections.actions.length ? sections.actions : null,
        treatmentPlan: hasTreatment ? { biological: sections.organic || '-', chemical: sections.chemical || '-' } : null,
        farmerTip: sections.tip || null,
        audioReadoutText: fullAudioReadout
    };
}

export class AgronomistRagService {
    /**
     * Builds fast agricultural prompt with parallel context loading and memory caching.
     */
    static async buildAgronomistPrompt({ question, farmerId = 1, language = 'en', history = [], hasAudio = false }) {
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
            stage: farm?.crop_stage || 'Vegetative Stage',
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

        const systemInstruction = `You are "Krishi Mitra", an expert agronomist for smallholder farmers in ${REGION_STATE}, India.
Today: ${new Date().toISOString().split('T')[0]}.

FARM CONTEXT:
- Farmer: ${context.farmerName}, ${context.district} district, ${REGION_STATE}
- Crop: ${context.crop} (${context.stage}), Soil: ${context.soil}, Water: ${context.water || 'Moderate'}
- Recent scan: ${context.recentDiagnosis}

LIVE WEATHER (${context.district}): ${weatherSummary}
MANDI PRICES (${context.crop}): ${marketSummary}
MSP: ${mspLines}
${matchedDocs.length ? `KNOWLEDGE: [${matchedDocs[0].topic}] ${matchedDocs[0].content}` : ''}

RULES:
- Respond in ${LANGUAGE_NAMES[language] || 'English'} only.
- Direct conversational answer first (2-4 clear sentences).
- If relevant to disease, pest, or cultivation, provide structured sections using these exact headers:
===ACTIONS===
- Step 1
- Step 2
===ORGANIC===
Biological/organic treatment with dosage
===CHEMICAL===
CIB&RC approved chemical with dose per litre/acre
===TIP===
Practical cost-saving advice
${hasAudio ? '\nIMPORTANT: Since audio input is provided, the very first line of your response MUST BE:\nTRANSCRIPT: <the exact question spoken by the user in their language>\nfollowed immediately by your answer.' : ''}`;

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
     * Fast SSE Streaming Consultation:
     * Directly streams Gemini text tokens to client with sub-2-second time-to-first-token.
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
        const startTotal = Date.now();
        const hasAudio = Boolean(audioBase64);

        const { systemInstruction, contents, context, matchedDocs, ctxDurationMs } =
            await this.buildAgronomistPrompt({
                question: question || 'Farmer voice question',
                farmerId,
                language,
                history,
                hasAudio
            });

        // Add user turn
        const userParts = [];
        if (hasAudio) {
            // Strip data URL header if present
            const cleanBase64 = audioBase64.includes(';base64,') ? audioBase64.split(';base64,')[1] : audioBase64;
            const cleanMime = (audioMimeType || 'audio/webm').split(';')[0];
            userParts.push({
                inline_data: {
                    mime_type: cleanMime,
                    data: cleanBase64
                }
            });
            userParts.push({ text: `Farmer voice question in ${LANGUAGE_NAMES[language] || 'their native language'}.` });
        } else {
            userParts.push({ text: (question || '').slice(0, 1500) });
        }
        contents.push({ role: 'user', parts: userParts });

        const streamResult = await streamGenerate({
            systemInstruction,
            contents,
            temperature: 0.3,
            maxOutputTokens: 600,
            timeoutMs: 20000,
            onChunk,
            signal
        });

        const parsed = parseStructuredAnswer(streamResult.text);
        const totalDuration = Date.now() - startTotal;

        if (process.env.DEBUG_PERF !== 'false') {
            console.log(`⚡ [Agronomist Perf] Q: "${(question || parsed.transcript || 'audio').slice(0, 40)}" | Ctx: ${ctxDurationMs}ms | Gemini (${streamResult.model}): First chunk ${streamResult.timings.firstChunkMs}ms, Total ${streamResult.timings.totalMs}ms | Total Request: ${totalDuration}ms`);
        }

        return {
            ...parsed,
            model: streamResult.model,
            knowledgeTopic: matchedDocs[0]?.topic || null,
            retrievedContext: context,
            aiEngine: `Google Gemini (${streamResult.model})`,
            timings: {
                contextMs: ctxDurationMs,
                firstChunkMs: streamResult.timings.firstChunkMs,
                geminiTotalMs: streamResult.timings.totalMs,
                totalMs: totalDuration
            }
        };
    }

    /**
     * Non-streaming consultation fallback for backward compatibility.
     */
    static async consult({ question, farmerId = 1, language = 'en', history = [] }) {
        const startTotal = Date.now();
        const { systemInstruction, contents, context, matchedDocs, ctxDurationMs } =
            await this.buildAgronomistPrompt({ question, farmerId, language, history, hasAudio: false });

        contents.push({ role: 'user', parts: [{ text: (question || '').slice(0, 1500) }] });

        const model = await resolveOptimizedModel();
        const rawText = await generate({
            systemInstruction,
            contents,
            temperature: 0.3,
            maxOutputTokens: 600,
            timeoutMs: 20000
        });

        const parsed = parseStructuredAnswer(rawText);
        const totalDuration = Date.now() - startTotal;

        if (process.env.DEBUG_PERF !== 'false') {
            console.log(`⚡ [Agronomist Consult] Q: "${question.slice(0, 40)}" | Model: ${model} | Total: ${totalDuration}ms`);
        }

        return {
            query: question,
            language,
            retrievedContext: context,
            aiAvailable: true,
            aiEngine: `Google Gemini (${model})`,
            knowledgeTopic: matchedDocs[0]?.topic || null,
            ...parsed
        };
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
