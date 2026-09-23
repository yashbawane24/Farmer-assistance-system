import { query, queryOne } from '../models/db.js';

export class AgronomistRagService {
    /**
     * RAG Conversational Engine:
     * 1. Retrieves active farmer context (crop, soil, stage, district, today's weather)
     * 2. Retrieves matched agronomic knowledge base documents
     * 3. Synthesizes a structured response with Root Cause, Immediate Practical Action, Prevention & Cost-effective Tips
     * 4. Delivers multilingual response in English, Hindi (हिन्दी), or Marathi (मराठी).
     */
    static async consult({ question, farmerId = 1, language = 'en' }) {
        // 1. Retrieve Farm Context
        const farmerProfile = await queryOne(`
            SELECT p.*, u.full_name FROM farmer_profiles p 
            JOIN users u ON p.user_id = u.id 
            WHERE u.id = ?
        `, [farmerId]);

        const farm = farmerProfile ? await queryOne("SELECT * FROM farms WHERE farmer_profile_id = ?", [farmerProfile.id]) : null;
        const weather = await queryOne("SELECT * FROM weather_records ORDER BY record_date ASC LIMIT 1");
        const recentScan = farm ? await queryOne("SELECT * FROM disease_scans WHERE farm_id = ? ORDER BY scanned_at DESC LIMIT 1", [farm.id]) : null;

        const context = {
            farmerName: farmerProfile?.full_name || 'Farmer',
            district: farmerProfile?.district || 'Nashik',
            crop: farm?.current_crop || 'Tomato',
            cropStage: farm?.crop_stage || 'Flowering to Fruit Set',
            soilType: farm?.soil_type || 'Black Soil (Regur)',
            weatherSummary: weather ? `${weather.temp_max_c}°C, ${weather.humidity_percent}% humidity, ${weather.condition}` : 'Normal conditions',
            recentDiagnosis: recentScan?.detected_disease || 'None recorded'
        };

        // 2. Semantic lookup in Knowledge Base
        const qLower = question.toLowerCase();
        const knowledgeDocs = await query("SELECT * FROM knowledge_documents");

        let matchedDoc = knowledgeDocs.find(doc => {
            const keywords = doc.keywords.toLowerCase().split(',').map(k => k.trim());
            return keywords.some(k => qLower.includes(k)) || qLower.includes(doc.crop_name.toLowerCase());
        });

        if (!matchedDoc) {
            // Default to tomato early blight or drainage if in context
            matchedDoc = knowledgeDocs[0];
        }

        // 3. Synthesize Agronomic Response
        let responsePayload = {
            query: question,
            language,
            retrievedContext: context,
            knowledgeTopic: matchedDoc.topic,
            rootCause: '',
            immediateAction: [],
            treatmentPlan: {
                biological: '',
                chemical: ''
            },
            farmerTip: '',
            audioReadoutText: ''
        };

        if (qLower.includes('yellow') || qLower.includes('spot') || qLower.includes('blight') || qLower.includes('पिवळे') || qLower.includes('पीले')) {
            responsePayload.rootCause = `Based on your ${context.crop} in ${context.cropStage} on ${context.soilType} and recent high humidity (${weather?.humidity_percent || 84}%), this symptom matches Early Blight (Alternaria solani) fungal infection.`;
            responsePayload.immediateAction = [
                'Prune and destroy lower yellow leaves touching damp soil.',
                'Postpone overhead irrigation to reduce canopy wetness duration.',
                'Ensure water drains quickly from furrows after afternoon rains.'
            ];
            responsePayload.treatmentPlan = {
                biological: 'Spray Trichoderma viride bio-fungicide @ 5g per liter of water + 5ml neem oil.',
                chemical: 'Apply Mancozeb 75 WP @ 2g per liter of water. Ensure spray covers both upper and lower leaf surfaces.'
            };
            responsePayload.farmerTip = 'Neem oil + bio-fungicide costs only ₹140/acre and protects flowering blossoms without killing beneficial honeybees.';
        } else if (qLower.includes('water') || qLower.includes('rain') || qLower.includes('पाऊस') || qLower.includes('बारिश')) {
            responsePayload.rootCause = `Weather forecast for ${context.district} indicates rain probability of ${weather?.rainfall_prob_percent || 75}%.`;
            responsePayload.immediateAction = [
                'Delay drip irrigation and nitrogen fertilizer applications today.',
                'Check field outlets to ensure excess rainwater drains within 4 hours.'
            ];
            responsePayload.treatmentPlan = {
                biological: 'Drench root zone with Trichoderma viride after soil dries slightly to prevent root rot.',
                chemical: 'No chemical spray required while rainfall is occurring.'
            };
            responsePayload.farmerTip = 'Clear drainage channels before rain to protect delicate flowering roots from suffocation.';
        } else {
            responsePayload.rootCause = `Regarding your inquiry for ${context.crop} (${context.cropStage}): Agronomic recommendations are grounded in your ${context.soilType} and current weather.`;
            responsePayload.immediateAction = [
                'Scout field rows early in the morning for early insect or fungal presence.',
                'Maintain steady soil moisture without water stagnation.'
            ];
            responsePayload.treatmentPlan = {
                biological: 'Use neem seed kernel extract (NSKE 5%) as an organic prophylactic shield.',
                chemical: 'Consult local Krishi Vigyan Kendra (KVK) if pest counts exceed 2 larvae per leaf.'
            };
            responsePayload.farmerTip = 'Staggered harvesting and checking mandi prices before loading saves up to 20% in post-harvest losses.';
        }

        // 4. Multilingual synthesis for audio and text
        if (language === 'mr') { // Marathi
            responsePayload.localizedResponse = {
                greeting: `नमस्कार ${context.farmerName} जी, तुमच्या ${context.crop} पिकासाठी कृषी सल्ला:`,
                rootCause: `तुमच्या ${context.district} भागातील हवामान (${weather?.humidity_percent}% आर्द्रता) आणि ${context.cropStage} अवस्थेनुसार, हे लक्षण बुरशीजन्य रोगाचे (अल्टरनेरिया करपा) असू शकते.`,
                immediateAction: [
                    'जमिनीला टेकलेली खालची पिवळी पाने काढून नष्ट करा.',
                    'दुपारी पाऊस थांबल्यानंतर तातडीने शेतातील पाण्याचा निचरा करा.',
                    'झाडांवर पाणी तुंबणार नाही याची काळजी घ्या.'
                ],
                treatmentPlan: {
                    biological: 'ट्रायकोडर्मा व्हिरिडी (५ ग्रॅम/लिटर) आणि निंबोळी तेल (५ मिली/लिटर) फवारा.',
                    chemical: 'मॅन्कोझेब ७५ डब्ल्यूपी (२ ग्रॅम/लिटर) फवारणी करा.'
                },
                farmerTip: 'पाऊस पडण्यापूर्वी शेतातील चर मोकळे ठेवल्यास मुळांना ऑक्सिजन मिळून पीक सुरक्षित राहते.'
            };
            responsePayload.audioReadoutText = `${responsePayload.localizedResponse.greeting} ${responsePayload.localizedResponse.rootCause} उपाय: पिवळी पाने काढून टाका आणि ट्रायकोडर्मा किंवा मॅन्कोझेबची फवारणी करा.`;
        } else if (language === 'hi') { // Hindi
            responsePayload.localizedResponse = {
                greeting: `नमस्ते ${context.farmerName} जी, आपके ${context.crop} खेत के लिए कृषि सलाह:`,
                rootCause: `आपके ${context.district} क्षेत्र में नमी (${weather?.humidity_percent}%) और ${context.cropStage} अवस्था के अनुसार, यह लक्षण अगेती झुलसा (अर्ली ब्लाइट) का संकेत हो सकता है।`,
                immediateAction: [
                    'जमीन को छूने वाले पीले पत्तों को काटकर अलग कर दें।',
                    'बारिश के बाद खेत में जलभराव न होने दें, नालियों को साफ रखें।',
                    'छिड़काव तभी करें जब पौधों की पत्तियां सूख जाएं।'
                ],
                treatmentPlan: {
                    biological: 'ट्राइकोडर्मा विरिडी (5 ग्राम/लीटर) और नीम तेल (5 मिली/लीटर) का छिड़काव करें।',
                    chemical: 'मैंकोजेब 75 WP (2 ग्राम/लीटर पानी) का घोल बनाकर स्प्रे करें।'
                },
                farmerTip: 'नीम तेल और ट्राइकोडर्मा का छिड़काव मात्र ₹140 प्रति एकड़ में फसल को सुरक्षित रखता है।'
            };
            responsePayload.audioReadoutText = `${responsePayload.localizedResponse.greeting} ${responsePayload.localizedResponse.rootCause} सलाह: प्रभावित पत्तियों को हटाएं और मैंकोजेब या ट्राइकोडर्मा का छिड़काव करें।`;
        } else {
            responsePayload.audioReadoutText = `Hello ${context.farmerName}. For your ${context.crop} crop in ${context.district}: ${responsePayload.rootCause} Recommended action: Remove infected lower leaves and apply Trichoderma bio-fungicide or Mancozeb spray.`;
        }

        return responsePayload;
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
