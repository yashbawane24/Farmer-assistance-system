// High-performance Gemini API integration with model autodetection, SSE streaming,
// single-model fast resolution (no slow fallback cascades), and Groq Whisper STT support.

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const PREFERRED_MODELS = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite-preview',
    'gemini-3-flash-preview',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
    'gemini-flash-latest'
];

export const LANGUAGE_NAMES = { en: 'English', hi: 'Hindi', mr: 'Marathi' };

export const isGeminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);
export const isGroqConfigured = () => Boolean(process.env.GROQ_API_KEY);

function aiError(message, status = 502, code = 'AI_SERVICE_ERROR') {
    const err = new Error(message);
    err.status = status;
    err.code = code;
    return err;
}

let cachedOptimizedModel = null;
let modelResolutionPromise = null;

export function getThinkingConfigForModel(modelName) {
    if (!modelName) return undefined;
    if (modelName.includes('3.5')) {
        return { thinkingLevel: 'MINIMAL' };
    }
    if (modelName.includes('3.1') || modelName.includes('3-') || modelName.includes('3.8') || modelName.includes('2.5')) {
        return { thinkingBudget: 0 };
    }
    return undefined;
}

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
        console.log(`⚡ [Gemini] Model selected: "${cachedOptimizedModel}"`);
        return cachedOptimizedModel;
    })();

    return modelResolutionPromise;
}

// Kick off discovery immediately when module loads
if (process.env.GEMINI_API_KEY) {
    resolveOptimizedModel().catch(() => {});
}

/**
 * Synchronous / Non-streaming generate call.
 * Uses low/zero thinking budget for ultra-fast response under 2-3s.
 */
export async function generate({
    systemInstruction,
    contents,
    responseSchema,
    temperature = 0.3,
    maxOutputTokens = 500,
    timeoutMs = 20000,
    thinkingConfig
}) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw aiError('AI is not configured on the server. Add GEMINI_API_KEY to server/.env.', 503, 'AI_NOT_CONFIGURED');
    }

    const model = await resolveOptimizedModel();
    const effectiveThinkingConfig = thinkingConfig !== undefined ? thinkingConfig : getThinkingConfigForModel(model);

    const body = {
        contents,
        generationConfig: {
            temperature,
            maxOutputTokens,
            ...(responseSchema ? { responseMimeType: 'application/json', responseSchema } : {}),
            ...(effectiveThinkingConfig && Object.keys(effectiveThinkingConfig).length ? { thinkingConfig: effectiveThinkingConfig } : {})
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
    let execResult = await execCall().catch(() => null);
    if (!execResult) {
        // Retry once on transient network glitch or timeout
        await new Promise(r => setTimeout(r, 600));
        execResult = await execCall().catch(err => {
            throw aiError(`Could not reach the AI service: ${err.message}`);
        });
    }
    let { res, data } = execResult;

    // Single retry on transient capacity spike (429 / 503) with seamless fallback
    if (!res.ok && (res.status === 429 || res.status === 503)) {
        console.warn(`[Gemini] ${model} hit status ${res.status}. Retrying once after 800ms...`);
        await new Promise(r => setTimeout(r, 800));
        const retryResult = await execCall().catch(() => null);
        if (retryResult && retryResult.res?.ok) {
            res = retryResult.res;
            data = retryResult.data;
        } else {
            // Capacity spike: switch to alternative flash model
            const fallbackModel = PREFERRED_MODELS.find(m => m !== model) || 'gemini-3.5-flash-lite';
            console.warn(`[Gemini] ${model} high demand (${res.status}). Switching to ${fallbackModel}...`);
            const fallbackThinking = getThinkingConfigForModel(fallbackModel);
            const fallbackBody = {
                ...body,
                generationConfig: {
                    ...body.generationConfig,
                    ...(fallbackThinking ? { thinkingConfig: fallbackThinking } : {})
                }
            };
            if (!fallbackThinking) {
                delete fallbackBody.generationConfig.thinkingConfig;
            }
            const fallbackRes = await fetch(`${API_BASE}/${fallbackModel}:generateContent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                body: JSON.stringify(fallbackBody),
                signal: AbortSignal.timeout(timeoutMs)
            }).catch(() => null);

            if (fallbackRes && fallbackRes.ok) {
                res = fallbackRes;
                data = await fallbackRes.json().catch(() => ({}));
            }
        }
    }

    if (!res.ok) {
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
    maxOutputTokens = 500,
    timeoutMs = 20000,
    onChunk,
    signal
}) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw aiError('AI is not configured on the server. Add GEMINI_API_KEY to server/.env.', 503, 'AI_NOT_CONFIGURED');
    }

    const model = await resolveOptimizedModel();
    const effectiveThinkingConfig = getThinkingConfigForModel(model);

    const body = {
        contents,
        generationConfig: {
            temperature,
            maxOutputTokens,
            ...(effectiveThinkingConfig && Object.keys(effectiveThinkingConfig).length ? { thinkingConfig: effectiveThinkingConfig } : {})
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
            buffer = lines.pop();

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ')) {
                    const jsonStr = trimmed.slice(6);
                    try {
                        const parsed = JSON.parse(jsonStr);
                        const parts = parsed.candidates?.[0]?.content?.parts || [];
                        const chunk = parts.map(p => p.text || '').join('');
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
export function splitDataUrl(imageBase64, fallbackMime = 'audio/webm') {
    if (!imageBase64) return { mimeType: fallbackMime, data: '' };
    if (imageBase64.includes(';base64,')) {
        const [head, data] = imageBase64.split(';base64,');
        return { mimeType: head.replace('data:', '') || fallbackMime, data };
    }
    return { mimeType: fallbackMime, data: imageBase64 };
}

/**
 * Transcribe audio using Groq Whisper Large v3 Turbo (ultra-fast STT).
 */
export async function transcribeWithGroq({ audioBuffer, mimeType = 'audio/webm', language = 'en' }) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

    const cleanMime = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
    const ext = cleanMime.includes('wav') ? 'wav' : cleanMime.includes('mp4') || cleanMime.includes('m4a') ? 'mp4' : cleanMime.includes('ogg') ? 'ogg' : 'webm';

    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: cleanMime }), `audio.${ext}`);
    formData.append('model', 'whisper-large-v3-turbo');
    const langCode = (language || 'en').slice(0, 2).toLowerCase();
    formData.append('language', langCode);
    formData.append('response_format', 'json');

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: formData,
        signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Groq transcription failed with HTTP ${res.status}`);
    }

    const json = await res.json();
    return (json.text || '').trim();
}

/**
 * Fallback audio transcription using Gemini (no thinking, 200 tokens max).
 */
export async function transcribeWithGemini({ audioData, mimeType = 'audio/webm', language = 'mr' }) {
    const langLabel = LANGUAGE_NAMES[language] || 'Marathi/Hindi/English';
    const instruction = `Transcribe this farmer's spoken question exactly, in ${langLabel} script. Return only the transcribed text with no extra commentary or markdown.`;

    const model = await resolveOptimizedModel();
    const thinkingConfig = getThinkingConfigForModel(model);

    const text = await generate({
        contents: [{
            role: 'user',
            parts: [
                { text: instruction },
                { inline_data: { mime_type: mimeType.split(';')[0], data: audioData } }
            ]
        }],
        temperature: 0.1,
        maxOutputTokens: 200,
        timeoutMs: 20000,
        thinkingConfig
    });

    return (text || '').trim();
}

/**
 * Unified audio transcription: prefers Groq Whisper (faster), falls back to Gemini.
 */
export async function transcribeAudio({ audioBase64, mimeType = 'audio/webm', language = 'en' }) {
    const { mimeType: detectedMime, data: base64Data } = splitDataUrl(audioBase64, mimeType);
    const cleanMime = (detectedMime || mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();

    if (process.env.GROQ_API_KEY) {
        try {
            const buffer = Buffer.from(base64Data, 'base64');
            const text = await transcribeWithGroq({ audioBuffer: buffer, mimeType: cleanMime, language });
            if (text) return text;
        } catch (groqErr) {
            console.warn(`[Groq STT] Groq transcription error (${groqErr.message}). Falling back to Gemini.`);
        }
    }

    return transcribeWithGemini({ audioData: base64Data, mimeType: cleanMime, language });
}
