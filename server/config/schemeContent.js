// Display text for government schemes in English, Hindi and Marathi.
// Keyed by the start of scheme_name in the database. Check official portals before each season for changes.

export const SCHEME_CONTENT = {
    'PM-KISAN': {
        en: {
            scheme_name: 'PM-KISAN Samman Nidhi',
            nodal_ministry: 'Ministry of Agriculture & Farmers Welfare',
            beneficiary_criteria: 'Farmer families who own cultivable land in their name.',
            benefits_summary: 'Income support of ₹6,000 per year, paid in 3 instalments of ₹2,000 directly into the bank account.',
            financial_assistance: '₹6,000 / year (direct bank transfer)',
            application_process: '1. Register on pmkisan.gov.in or at the nearest Common Service Centre (CSC).\n2. Complete e-KYC with Aadhaar OTP.\n3. Make sure your land record (7/12) and bank account are linked to Aadhaar.',
            required_documents: 'Aadhaar card, 7/12 land record, bank passbook (Aadhaar-linked)'
        },
        hi: {
            scheme_name: 'पीएम-किसान सम्मान निधि',
            nodal_ministry: 'कृषि एवं किसान कल्याण मंत्रालय',
            beneficiary_criteria: 'जिन किसान परिवारों के नाम पर खेती की जमीन है।',
            benefits_summary: 'हर साल ₹6,000 की आय सहायता, ₹2,000 की 3 किस्तों में सीधे बैंक खाते में।',
            financial_assistance: '₹6,000 / वर्ष (सीधे बैंक खाते में)',
            application_process: '1. pmkisan.gov.in पर या नजदीकी कॉमन सर्विस सेंटर (CSC) पर पंजीकरण करें।\n2. आधार OTP से e-KYC पूरा करें।\n3. जमीन का रिकॉर्ड (7/12) और बैंक खाता आधार से जुड़ा हो, यह सुनिश्चित करें।',
            required_documents: 'आधार कार्ड, 7/12 भूमि अभिलेख, बैंक पासबुक (आधार से जुड़ी)'
        },
        mr: {
            scheme_name: 'पीएम-किसान सन्मान निधी',
            nodal_ministry: 'कृषी व शेतकरी कल्याण मंत्रालय',
            beneficiary_criteria: 'ज्या शेतकरी कुटुंबांच्या नावावर लागवडीयोग्य जमीन आहे.',
            benefits_summary: 'दरवर्षी ₹6,000 उत्पन्न सहाय्य, ₹2,000 च्या 3 हप्त्यांत थेट बँक खात्यात.',
            financial_assistance: '₹6,000 / वर्ष (थेट बँक खात्यात)',
            application_process: '1. pmkisan.gov.in वर किंवा जवळच्या सेतू / CSC केंद्रात नोंदणी करा.\n2. आधार OTP ने e-KYC पूर्ण करा.\n3. सातबारा (7/12) व बँक खाते आधारशी जोडलेले असल्याची खात्री करा.',
            required_documents: 'आधार कार्ड, सातबारा उतारा (7/12), बँक पासबुक (आधारशी जोडलेले)'
        }
    },
    'Pradhan Mantri Fasal Bima': {
        en: {
            scheme_name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
            nodal_ministry: 'Ministry of Agriculture & Farmers Welfare',
            beneficiary_criteria: 'Farmers (owners and tenants) growing notified crops in notified areas.',
            benefits_summary: 'Crop insurance against loss from drought, flood, unseasonal rain, hail, pests and diseases.',
            financial_assistance: 'Farmer pays only 2% premium for Kharif, 1.5% for Rabi and 5% for commercial/horticulture crops; the government pays the rest.',
            application_process: '1. Apply on pmfby.gov.in, the Crop Insurance app, your bank or a CSC centre.\n2. Apply before the last date announced for the season.\n3. Report crop loss within 72 hours on the app or helpline 14447.',
            required_documents: 'Aadhaar card, 7/12 land record, sowing certificate, bank passbook'
        },
        hi: {
            scheme_name: 'प्रधानमंत्री फसल बीमा योजना (PMFBY)',
            nodal_ministry: 'कृषि एवं किसान कल्याण मंत्रालय',
            beneficiary_criteria: 'अधिसूचित क्षेत्रों में अधिसूचित फसलें उगाने वाले किसान (मालिक व बटाईदार)।',
            benefits_summary: 'सूखा, बाढ़, बेमौसम बारिश, ओले, कीट और रोग से फसल नुकसान का बीमा।',
            financial_assistance: 'किसान केवल 2% (खरीफ), 1.5% (रबी) और 5% (वाणिज्यिक/बागवानी फसल) प्रीमियम देते हैं; बाकी सरकार देती है।',
            application_process: '1. pmfby.gov.in, फसल बीमा ऐप, अपने बैंक या CSC केंद्र पर आवेदन करें।\n2. मौसम के लिए घोषित अंतिम तारीख से पहले आवेदन करें।\n3. नुकसान होने पर 72 घंटे के अंदर ऐप या हेल्पलाइन 14447 पर सूचना दें।',
            required_documents: 'आधार कार्ड, 7/12 भूमि अभिलेख, बुवाई प्रमाणपत्र, बैंक पासबुक'
        },
        mr: {
            scheme_name: 'प्रधानमंत्री पीक विमा योजना (PMFBY)',
            nodal_ministry: 'कृषी व शेतकरी कल्याण मंत्रालय',
            beneficiary_criteria: 'अधिसूचित क्षेत्रात अधिसूचित पिके घेणारे शेतकरी (मालक व कूळ).',
            benefits_summary: 'दुष्काळ, पूर, अवकाळी पाऊस, गारपीट, कीड व रोगांमुळे होणाऱ्या पीक नुकसानीसाठी विमा संरक्षण.',
            financial_assistance: 'शेतकरी फक्त 2% (खरीप), 1.5% (रब्बी) आणि 5% (व्यापारी/फळपिके) हप्ता भरतो; उरलेला हप्ता सरकार भरते.',
            application_process: '1. pmfby.gov.in, पीक विमा ॲप, तुमची बँक किंवा CSC केंद्रात अर्ज करा.\n2. हंगामासाठी जाहीर केलेल्या शेवटच्या तारखेपूर्वी अर्ज करा.\n3. नुकसान झाल्यास 72 तासांत ॲपवर किंवा हेल्पलाइन 14447 वर कळवा.',
            required_documents: 'आधार कार्ड, सातबारा उतारा (7/12), पेरणी प्रमाणपत्र, बँक पासबुक'
        }
    },
    'Soil Health Card': {
        en: {
            scheme_name: 'Soil Health Card Scheme',
            nodal_ministry: 'Department of Agriculture & Farmers Welfare',
            beneficiary_criteria: 'All farmers who own or cultivate agricultural land.',
            benefits_summary: 'Free soil test showing nutrients (N, P, K, micronutrients, pH) and the right fertiliser dose for your field, which helps cut fertiliser cost.',
            financial_assistance: 'Free soil testing and soil health card',
            application_process: '1. Contact your village Krishi Sahayak or taluka agriculture office.\n2. Your field soil sample is collected and tested at the district lab.\n3. Get your card at the gram panchayat or download it from soilhealth.dac.gov.in.',
            required_documents: 'Aadhaar card, mobile number, land survey (gat) number'
        },
        hi: {
            scheme_name: 'मृदा स्वास्थ्य कार्ड योजना',
            nodal_ministry: 'कृषि एवं किसान कल्याण विभाग',
            beneficiary_criteria: 'खेती की जमीन के मालिक या खेती करने वाले सभी किसान।',
            benefits_summary: 'मुफ्त मिट्टी जांच - पोषक तत्व (N, P, K, सूक्ष्म पोषक, pH) और आपके खेत के लिए सही खाद की मात्रा, जिससे खाद का खर्च घटता है।',
            financial_assistance: 'मुफ्त मिट्टी जांच और मृदा स्वास्थ्य कार्ड',
            application_process: '1. गांव के कृषि सहायक या तालुका कृषि कार्यालय से संपर्क करें।\n2. खेत की मिट्टी का नमूना लेकर जिला प्रयोगशाला में जांच होती है।\n3. कार्ड ग्राम पंचायत से लें या soilhealth.dac.gov.in से डाउनलोड करें।',
            required_documents: 'आधार कार्ड, मोबाइल नंबर, जमीन का सर्वे (गट) नंबर'
        },
        mr: {
            scheme_name: 'मृद आरोग्य पत्रिका योजना',
            nodal_ministry: 'कृषी व शेतकरी कल्याण विभाग',
            beneficiary_criteria: 'शेतजमिनीचे मालक किंवा शेती करणारे सर्व शेतकरी.',
            benefits_summary: 'मोफत माती परीक्षण - अन्नद्रव्ये (N, P, K, सूक्ष्म अन्नद्रव्ये, pH) आणि तुमच्या शेतासाठी योग्य खत मात्रा, त्यामुळे खताचा खर्च कमी होतो.',
            financial_assistance: 'मोफत माती परीक्षण व मृद आरोग्य पत्रिका',
            application_process: '1. गावातील कृषी सहाय्यक किंवा तालुका कृषी कार्यालयाशी संपर्क करा.\n2. शेतातील मातीचा नमुना घेऊन जिल्हा प्रयोगशाळेत तपासला जातो.\n3. पत्रिका ग्रामपंचायतीतून घ्या किंवा soilhealth.dac.gov.in वरून डाउनलोड करा.',
            required_documents: 'आधार कार्ड, मोबाईल नंबर, जमिनीचा गट नंबर'
        }
    },
    'Per Drop More Crop': {
        en: {
            scheme_name: 'Drip & Sprinkler Subsidy (PMKSY - Per Drop More Crop)',
            nodal_ministry: 'Ministry of Agriculture & Farmers Welfare (via MahaDBT)',
            beneficiary_criteria: 'Maharashtra farmers with land in their name and a water source (well, farm pond, canal).',
            benefits_summary: 'Subsidy for drip or sprinkler irrigation, which saves 30-50% water and improves yield.',
            financial_assistance: 'Up to 55% subsidy for small/marginal farmers and 45% for others, plus an extra state top-up in Maharashtra.',
            application_process: '1. Register on the MahaDBT farmer portal (mahadbt.maharashtra.gov.in).\n2. Apply under "Irrigation equipment".\n3. Wait for the lottery / pre-sanction before buying the system.',
            required_documents: 'Aadhaar card, 7/12 and 8-A land records, bank passbook, quotation from a registered drip company'
        },
        hi: {
            scheme_name: 'ड्रिप व स्प्रिंकलर सब्सिडी (PMKSY - पर ड्रॉप मोर क्रॉप)',
            nodal_ministry: 'कृषि एवं किसान कल्याण मंत्रालय (महाडीबीटी के माध्यम से)',
            beneficiary_criteria: 'महाराष्ट्र के किसान जिनके नाम पर जमीन और पानी का स्रोत (कुआं, खेत तालाब, नहर) है।',
            benefits_summary: 'ड्रिप या स्प्रिंकलर सिंचाई पर सब्सिडी - 30-50% पानी की बचत और बेहतर उपज।',
            financial_assistance: 'छोटे/सीमांत किसानों को 55% तक और अन्य को 45% तक सब्सिडी, साथ में महाराष्ट्र सरकार का अतिरिक्त अनुदान।',
            application_process: '1. महाडीबीटी किसान पोर्टल (mahadbt.maharashtra.gov.in) पर पंजीकरण करें।\n2. "सिंचाई उपकरण" के अंतर्गत आवेदन करें।\n3. सिस्टम खरीदने से पहले लॉटरी / पूर्व-मंजूरी का इंतजार करें।',
            required_documents: 'आधार कार्ड, 7/12 और 8-अ भूमि अभिलेख, बैंक पासबुक, पंजीकृत ड्रिप कंपनी का कोटेशन'
        },
        mr: {
            scheme_name: 'ठिबक व तुषार सिंचन अनुदान (PMKSY - प्रति थेंब अधिक पीक)',
            nodal_ministry: 'कृषी व शेतकरी कल्याण मंत्रालय (महाडीबीटीद्वारे)',
            beneficiary_criteria: 'स्वतःच्या नावावर जमीन व पाण्याचा स्रोत (विहीर, शेततळे, कालवा) असलेले महाराष्ट्रातील शेतकरी.',
            benefits_summary: 'ठिबक किंवा तुषार सिंचनासाठी अनुदान - 30-50% पाण्याची बचत व उत्पादनात वाढ.',
            financial_assistance: 'अल्प/अत्यल्प भूधारकांना 55% पर्यंत व इतरांना 45% पर्यंत अनुदान, तसेच महाराष्ट्र शासनाचे पूरक अनुदान.',
            application_process: '1. महाडीबीटी शेतकरी पोर्टलवर (mahadbt.maharashtra.gov.in) नोंदणी करा.\n2. "सिंचन साधने" या घटकाखाली अर्ज करा.\n3. संच खरेदी करण्यापूर्वी सोडत / पूर्वसंमतीची वाट पहा.',
            required_documents: 'आधार कार्ड, सातबारा (7/12) व 8-अ उतारा, बँक पासबुक, नोंदणीकृत ठिबक कंपनीचे कोटेशन'
        }
    },
    'Namo Shetkari': {
        en: {
            scheme_name: 'Namo Shetkari Mahasanman Nidhi Yojana',
            nodal_ministry: 'Agriculture Department, Government of Maharashtra',
            beneficiary_criteria: 'Maharashtra farmer families who are eligible PM-KISAN beneficiaries.',
            benefits_summary: 'Maharashtra adds ₹6,000 per year on top of PM-KISAN, so eligible farmers get ₹12,000 per year in total.',
            financial_assistance: '₹6,000 / year in 3 instalments (direct bank transfer)',
            application_process: '1. No separate application is needed.\n2. Keep your PM-KISAN e-KYC, Aadhaar-bank link and land record link complete.\n3. Contact the taluka agriculture officer for corrections.',
            required_documents: 'PM-KISAN registration, Aadhaar-linked bank account, 7/12 and 8-A land records'
        },
        hi: {
            scheme_name: 'नमो शेतकरी महासम्मान निधि योजना',
            nodal_ministry: 'कृषि विभाग, महाराष्ट्र सरकार',
            beneficiary_criteria: 'महाराष्ट्र के वे किसान परिवार जो पीएम-किसान के पात्र लाभार्थी हैं।',
            benefits_summary: 'महाराष्ट्र सरकार पीएम-किसान के ऊपर हर साल ₹6,000 और देती है, यानी पात्र किसानों को कुल ₹12,000 प्रति वर्ष।',
            financial_assistance: '₹6,000 / वर्ष, 3 किस्तों में (सीधे बैंक खाते में)',
            application_process: '1. अलग से आवेदन की जरूरत नहीं।\n2. पीएम-किसान e-KYC, आधार-बैंक लिंक और भूमि अभिलेख लिंक पूरा रखें।\n3. सुधार के लिए तालुका कृषि अधिकारी से संपर्क करें।',
            required_documents: 'पीएम-किसान पंजीकरण, आधार से जुड़ा बैंक खाता, 7/12 और 8-अ भूमि अभिलेख'
        },
        mr: {
            scheme_name: 'नमो शेतकरी महासन्मान निधी योजना',
            nodal_ministry: 'कृषी विभाग, महाराष्ट्र शासन',
            beneficiary_criteria: 'पीएम-किसानचे पात्र लाभार्थी असलेली महाराष्ट्रातील शेतकरी कुटुंबे.',
            benefits_summary: 'महाराष्ट्र शासन पीएम-किसानशिवाय दरवर्षी आणखी ₹6,000 देते, म्हणजे पात्र शेतकऱ्यांना एकूण ₹12,000 प्रति वर्ष.',
            financial_assistance: '₹6,000 / वर्ष, 3 हप्त्यांत (थेट बँक खात्यात)',
            application_process: '1. वेगळा अर्ज करण्याची गरज नाही.\n2. पीएम-किसान e-KYC, आधार-बँक जोडणी व जमीन नोंद जोडणी पूर्ण ठेवा.\n3. दुरुस्तीसाठी तालुका कृषी अधिकाऱ्यांशी संपर्क करा.',
            required_documents: 'पीएम-किसान नोंदणी, आधारशी जोडलेले बँक खाते, सातबारा (7/12) व 8-अ उतारा'
        }
    }
};

export function localizeScheme(row, lang = 'en') {
    const key = Object.keys(SCHEME_CONTENT).find(k => String(row.scheme_name || '').startsWith(k));
    const content = key ? (SCHEME_CONTENT[key][lang] || SCHEME_CONTENT[key].en) : null;
    const merged = content ? { ...row, ...content } : { ...row };
    // Older seed data stored "\n" as two characters
    for (const field of ['application_process', 'beneficiary_criteria', 'benefits_summary', 'required_documents']) {
        if (typeof merged[field] === 'string') merged[field] = merged[field].replace(/\\n/g, '\n');
    }
    return merged;
}
