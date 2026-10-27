// High-performance Gemini API integration with model autodetection, SSE streaming,
// and single-model optimization (no slow per-request fallback cascades).

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const PREFERRED_MODELS = [
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3-flash-preview',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite-preview'
];

export const LANGUAGE_NAMES = { en: 'English', hi: 'Hindi', mr: 'Marathi' };

export const isGeminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

function aiError(message, status = 502, code = 'AI_SERVICE_ERROR') {
    const err = new Error(message);
    err.status = status;
    err.code = code;
    return err;
}

let cachedOptimizedModel = null;
let modelResolutionPromise = null;

/**
 * Resolves the fastest available Gemini model for this API key once at startup / first call.
 * Avoids slow multi-model fallback cascades that add 30-60s to user queries.
 */
export async function resolveOptimizedModel() {
    if (cachedOptimizedModel) return cachedOptimizedModel;
    if (modelResolutionPromise) return modelResolutionPromise;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        cachedOptimizedModel = PREFERRED_MODELS[0];
        return cachedOptimizedModel;
    }

    modelResolutionPromise = (async () => {
        try {
            const start = Date.now();
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models`, {
                headers: { 'x-goog-api-key': apiKey },
                signal: AbortSignal.timeout(5000)
            });
            const data = await res.json().catch(() => ({}));
            const availableNames = new Set(
                (data.models || [])
                    .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
                    .map(m => m.name.replace(/^models\//, ''))
            );

            for (const candidate of PREFERRED_MODELS) {
                if (availableNames.has(candidate)) {
                    cachedOptimizedModel = candidate;
                    console.log(`⚡ [Gemini] Model auto-selected: "${candidate}" in ${Date.now() - start}ms (ready for ultra-fast response)`);
                    return candidate;
                }
            }
        } catch (e) {
            console.warn(`[Gemini] Model resolution lookup failed (${e.message}). Falling back to default.`);
        }
        cachedOptimizedModel = PREFERRED_MODELS[0];
        return cachedOptimizedModel;
    })();

    return modelResolutionPromise;
}

// Kick off discovery immediately when module loads
if (process.env.GEMINI_API_KEY) {
    resolveOptimizedModel().catch(() => {});
}

/**
 * Synchronous / Non-streaming generate call (with single retry on 429/503).
 */
export async function generate({
    systemInstruction,
    contents,
    responseSchema,
    temperature = 0.3,
    maxOutputTokens = 600,
    timeoutMs = 20000
}) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw aiError('AI is not configured on the server. Add GEMINI_API_KEY to server/.env.', 503, 'AI_NOT_CONFIGURED');
    }

    const model = await resolveOptimizedModel();
    const body = {
        contents,
        generationConfig: {
            temperature,
            maxOutputTokens,
            ...(responseSchema ? { responseMimeType: 'application/json', responseSchema } : {})
        }
    };
    if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const execCall = async () => {
        const res = await fetch(`${API_BASE}/${model}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(timeoutMs)
        });
        const data = await res.json().catch(() => ({}));
        return { res, data };
    };

    const startTime = Date.now();
    let { res, data } = await execCall().catch(err => {
        throw aiError(`Could not reach the AI service: ${err.message}`);
    });

    // Single retry on transient capacity spike (429 / 503)
    if (!res.ok && (res.status === 429 || res.status === 503)) {
        console.warn(`[Gemini] ${model} hit status ${res.status}. Retrying once after 1s...`);
        await new Promise(r => setTimeout(r, 1000));
        const retryResult = await execCall().catch(() => null);
        if (retryResult) {
            res = retryResult.res;
            data = retryResult.data;
        }
    }

    if (!res.ok) {
        if (model !== 'gemini-flash-lite-latest' && (res.status === 400 || res.status === 404)) {
            console.warn(`[Gemini] Model ${model} returned ${res.status} (${data?.error?.message}). Falling back to gemini-flash-lite-latest.`);
            cachedOptimizedModel = 'gemini-flash-lite-latest';
            return generate({ systemInstruction, contents, responseSchema, temperature, maxOutputTokens, timeoutMs });
        }
        throw aiError(data?.error?.message || `AI service returned HTTP ${res.status}`);
    }

    const candidate = data?.candidates?.[0];
    const text = (candidate?.content?.parts || []).map(p => p.text || '').join('').trim();
    if (!text) {
        const reason = data?.promptFeedback?.blockReason || candidate?.finishReason || 'empty response';
        throw aiError(`AI could not answer this request (${reason}).`);
    }

    const elapsed = Date.now() - startTime;
    if (process.env.DEBUG_PERF !== 'false') {
        console.log(`⏱️ [Gemini Generate] Model: ${model} | Tokens: ~${text.length / 4 | 0} | Duration: ${elapsed}ms`);
    }

    if (!responseSchema) return text;
    try {
        return JSON.parse(text);
    } catch {
        return JSON.parse(text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, ''));
    }
}

/**
 * Server-Sent Events (SSE) streaming call to Gemini :streamGenerateContent?alt=sse.
 * Invokes onChunk(chunkText) as each piece of text arrives in real time.
 */
export async function streamGenerate({
    systemInstruction,
    contents,
    temperature = 0.3,
    maxOutputTokens = 600,
    timeoutMs = 20000,
    onChunk,
    signal
}) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw aiError('AI is not configured on the server. Add GEMINI_API_KEY to server/.env.', 503, 'AI_NOT_CONFIGURED');
    }

    const model = await resolveOptimizedModel();
    const body = {
        contents,
        generationConfig: {
            temperature,
            maxOutputTokens
        }
    };
    if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const startTime = Date.now();
    let firstChunkTime = null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    if (signal) {
        signal.addEventListener('abort', () => controller.abort());
    }

    let res;
    try {
        res = await fetch(`${API_BASE}/${model}:streamGenerateContent?alt=sse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify(body),
            signal: controller.signal
        });

        // Single retry on 429/503 rate limit / spike
        if (res.status === 429 || res.status === 503) {
            await new Promise(r => setTimeout(r, 600));
            res = await fetch(`${API_BASE}/${model}:streamGenerateContent?alt=sse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                body: JSON.stringify(body),
                signal: controller.signal
            });
        }
    } catch (err) {
        clearTimeout(timeoutId);
        throw aiError(`Streaming AI connection failed: ${err.message}`);
    }

    if (!res.ok) {
        clearTimeout(timeoutId);
        const data = await res.json().catch(() => ({}));
        if (model !== 'gemini-flash-lite-latest' && (res.status === 400 || res.status === 404)) {
            console.warn(`[Gemini Stream] Model ${model} returned ${res.status} (${data?.error?.message}). Falling back to gemini-flash-lite-latest.`);
            cachedOptimizedModel = 'gemini-flash-lite-latest';
            return streamGenerate({ systemInstruction, contents, temperature, maxOutputTokens, timeoutMs, onChunk, signal });
        }
        throw aiError(data?.error?.message || `AI stream returned HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedText = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // keep partial line in buffer

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ')) {
                    const jsonStr = trimmed.slice(6);
                    try {
                        const parsed = JSON.parse(jsonStr);
                        const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (chunk) {
                            if (!firstChunkTime) {
                                firstChunkTime = Date.now() - startTime;
                            }
                            accumulatedText += chunk;
                            if (onChunk) onChunk(chunk);
                        }
                    } catch {}
                }
            }
        }
    } finally {
        clearTimeout(timeoutId);
    }

    const totalDuration = Date.now() - startTime;
    if (process.env.DEBUG_PERF !== 'false') {
        console.log(`⏱️ [Gemini Stream] Model: ${model} | First Chunk: ${firstChunkTime || totalDuration}ms | Total Stream: ${totalDuration}ms | Output Len: ${accumulatedText.length}`);
    }

    return {
        text: accumulatedText,
        model,
        timings: {
            firstChunkMs: firstChunkTime || totalDuration,
            totalMs: totalDuration
        }
    };
}

// Accepts "data:image/jpeg;base64,...." or raw base64
export function splitDataUrl(imageBase64, fallbackMime = 'image/jpeg') {
    if (imageBase64.includes(';base64,')) {
        const [head, data] = imageBase64.split(';base64,');
        return { mimeType: head.replace('data:', '') || fallbackMime, data };
    }
    return { mimeType: fallbackMime, data: imageBase64 };
}
