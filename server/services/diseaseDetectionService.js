import { query, run } from '../models/db.js';
import { generate, splitDataUrl, isGeminiConfigured, LANGUAGE_NAMES } from './geminiService.js';

const MAX_IMAGE_BYTES = 7 * 1024 * 1024;

// Gemini is forced to answer with exactly this JSON structure
const DIAGNOSIS_SCHEMA = {
    type: 'OBJECT',
    properties: {
        isPlantImage: { type: 'BOOLEAN', description: 'false if the photo is not a real crop plant/leaf/fruit (person, object, drawing, too blurry or dark)' },
        crop: { type: 'STRING', description: 'Crop visible in the photo, in English (e.g. Tomato, Cotton, Soybean)' },
        detectedDisease: { type: 'STRING', description: 'Common name of the disease, pest damage or nutrient deficiency. "Healthy Crop Leaf" if none.' },
        scientificName: { type: 'STRING', description: 'Scientific name of pathogen/pest, empty string if not applicable' },
        severity: { type: 'STRING', enum: ['None', 'Low', 'Moderate', 'Critical'] },
        confidence: { type: 'INTEGER', description: 'Honest 0-100 confidence based on how clearly the symptoms are visible. Use below 60 when unsure.' },
        visualSymptoms: { type: 'STRING', description: 'Symptoms you can actually see in this photo' },
        actionPlan: { type: 'ARRAY', items: { type: 'STRING' }, description: '2-4 immediate steps for the farmer' },
        biologicalRemedy: { type: 'STRING', description: 'Organic/biological remedy with dose (per litre and per acre)' },
        chemicalTreatment: { type: 'STRING', description: 'CIB&RC-approved chemical available in India with dose, or "Not needed" if healthy' },
        preventionGuide: { type: 'STRING' },
        advice: { type: 'STRING', description: 'If isPlantImage is false: tell the farmer what photo to take. Otherwise a one-line summary.' }
    },
    required: ['isPlantImage', 'crop', 'detectedDisease', 'scientificName', 'severity', 'confidence', 'visualSymptoms', 'actionPlan', 'biologicalRemedy', 'chemicalTreatment', 'preventionGuide', 'advice']
};

function buildPrompt(cropName, language) {
    return `You are an experienced plant pathologist advising smallholder farmers in Maharashtra, India.
The farmer says this photo is of a ${cropName || 'crop'} plant. Examine the image itself and diagnose what you actually see.

Rules:
- Base the diagnosis ONLY on visible evidence in this photo. Do not pick a disease just because it is common for the crop.
- If the plant looks healthy, say detectedDisease "Healthy Crop Leaf", severity "None".
- If the image is not a real plant photo, set isPlantImage=false.
- If the visible crop differs from what the farmer selected, report the crop you see.
- Recommend only remedies legal and available in India (Maharashtra agri-input shops), with doses per litre and per acre.
- Write "crop" and "scientificName" in English. Write every other text field in ${LANGUAGE_NAMES[language] || 'English'}, in simple words a farmer understands.`;
}

export class DiseaseDetectionService {
    /**
     * Diagnose an uploaded plant leaf photo with Google Gemini Vision.
     * No result is invented: if the AI is not configured or fails, a clear error is returned instead.
     */
    static async diagnoseImage({ cropName = 'Tomato', imageBase64, farmId = 1, language = 'en' }) {
        if (!imageBase64) {
            const err = new Error('Please upload a photo of the affected leaf.');
            err.status = 400;
            throw err;
        }
        if (!isGeminiConfigured()) {
            const err = new Error('AI disease scanner is not configured. Add GEMINI_API_KEY to server/.env (free key: https://aistudio.google.com/apikey).');
            err.status = 503;
            err.code = 'AI_NOT_CONFIGURED';
            throw err;
        }

        const { mimeType, data } = splitDataUrl(imageBase64);
        if (data.length * 0.75 > MAX_IMAGE_BYTES) {
            const err = new Error('Photo is too large. Please use a photo under 7 MB.');
            err.status = 413;
            throw err;
        }

        const result = await generate({
            contents: [{
                role: 'user',
                parts: [
                    { text: buildPrompt(cropName, language) },
                    { inline_data: { mime_type: mimeType, data } }
                ]
            }],
            responseSchema: DIAGNOSIS_SCHEMA,
            temperature: 0.2
        });

        if (!result.isPlantImage) {
            const err = new Error(result.advice || 'This does not look like a crop leaf photo. Take a clear, close photo of the affected leaf in daylight.');
            err.status = 422;
            err.code = 'NOT_A_PLANT_IMAGE';
            throw err;
        }

        const diagnosis = {
            crop: result.crop || cropName,
            detectedDisease: result.detectedDisease,
            scientificName: result.scientificName || '',
            severity: ['None', 'Low', 'Moderate', 'Critical'].includes(result.severity) ? result.severity : 'Moderate',
            confidence: Math.max(0, Math.min(100, Math.round(result.confidence))),
            visualSymptoms: result.visualSymptoms,
            actionPlan: Array.isArray(result.actionPlan) ? result.actionPlan : [String(result.actionPlan)],
            biologicalRemedy: result.biologicalRemedy,
            chemicalTreatment: result.chemicalTreatment,
            preventionGuide: result.preventionGuide,
            advice: result.advice,
            inferenceEngine: `Google Gemini Vision (${process.env.GEMINI_MODEL || 'gemini-2.5-flash'})`
        };

        try {
            const scanResult = await run(`
                INSERT INTO disease_scans (
                    farm_id, crop_name, image_url, detected_disease, confidence_score,
                    severity, immediate_action, biological_remedy, chemical_treatment,
                    prevention_guide, is_offline_inference
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            `, [
                farmId,
                diagnosis.crop,
                'leaf_scan_' + Date.now() + '.jpg',
                diagnosis.detectedDisease,
                diagnosis.confidence,
                diagnosis.severity,
                diagnosis.actionPlan.join('\n'),
                diagnosis.biologicalRemedy,
                diagnosis.chemicalTreatment,
                diagnosis.preventionGuide
            ]);
            diagnosis.scanId = scanResult.lastInsertRowid;
        } catch (dbErr) {
            console.warn('Could not persist scan to db:', dbErr.message);
        }

        return {
            ...diagnosis,
            scannedAt: new Date().toISOString()
        };
    }

    static async getRecentScans(farmId = 1) {
        return query("SELECT * FROM disease_scans WHERE farm_id = ? ORDER BY scanned_at DESC LIMIT 10", [farmId]);
    }
}
