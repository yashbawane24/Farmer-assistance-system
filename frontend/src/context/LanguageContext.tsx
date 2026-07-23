import React, { createContext, useState, useContext, useEffect } from 'react';

type Language = 'en' | 'hi' | 'ta' | 'mr';

interface TranslationMap {
  [key: string]: {
    [key in Language]: string;
  };
}

const translations: TranslationMap = {
  // Navigation & General
  brandName: { en: 'Smart Farmer', hi: 'स्मार्ट किसान', ta: 'ஸ்மார்ட் விவசாயி', mr: 'स्मार्ट शेतकरी' },
  dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड', ta: 'டாஷ்போர்டு', mr: 'डॅशबोर्ड' },
  weather: { en: 'Weather', hi: 'मौसम', ta: 'வானிலை', mr: 'हवामान' },
  recommendation: { en: 'Crop Advisor', hi: 'फसल सलाहकार', ta: 'பயிர் ஆலோசகர்', mr: 'पीक सल्लागार' },
  diseaseDetection: { en: 'Disease Scan', hi: 'रोग स्कैन', ta: 'நோய் ஸ்கேன்', mr: 'रोग स्कॅनर' },
  marketPrices: { en: 'Market Prices', hi: 'मंडी भाव', ta: 'சந்தை விலைகள்', mr: 'बाजार भाव' },
  schemes: { en: 'Govt Schemes', hi: 'सरकारी योजनाएं', ta: 'அரசு திட்டங்கள்', mr: 'शासकीय योजना' },
  profile: { en: 'My Profile', hi: 'मेरी प्रोफाइल', ta: 'எனது சுயவிவரம்', mr: 'माझी प्रोफाइल' },
  admin: { en: 'Admin Panel', hi: 'एडमिन पैनल', ta: 'நிர்வாக குழு', mr: 'अ‍ॅडमीन पॅनेल' },
  logout: { en: 'Logout', hi: 'लॉगआउट', ta: 'வெளியேறு', mr: 'लॉगआउट' },
  login: { en: 'Login', hi: 'लॉगिन', ta: 'உள்நுழை', mr: 'लॉगिन' },
  loading: { en: 'Loading...', hi: 'लोड हो रहा है...', ta: 'ஏற்றுகிறது...', mr: 'लोड होत आहे...' },

  // Welcome Messages
  welcomeBack: { en: 'Welcome back,', hi: 'स्वागत है,', ta: 'மீண்டும் வருக,', mr: 'स्वागत आहे,' },
  todayAdvisory: { en: 'Today\'s Advisory', hi: 'आज की सलाह', ta: 'இன்றைய ஆலோசனை', mr: 'आजचा सल्ला' },
  quickActions: { en: 'Quick Actions', hi: 'त्वरित कार्रवाई', ta: 'விரைவான செயல்கள்', mr: 'जलद कृती' },
  recentActivities: { en: 'Recent Activities', hi: 'हाल की गतिविधियां', ta: 'சமீபத்திய நடவடிக்கைகள்', mr: 'नुकत्याच केलेल्या कृती' },

  // Weather Module
  weatherDetails: { en: 'Weather Details', hi: 'मौसम का विवरण', ta: 'வானிலை விவரங்கள்', mr: 'हवामानाचा तपशील' },
  humidity: { en: 'Humidity', hi: 'आर्द्रता', ta: 'ஈரப்பதம்', mr: 'दमटपणा' },
  windSpeed: { en: 'Wind Speed', hi: 'हवा की गति', ta: 'காற்றின் வேகம்', mr: 'वाऱ्याचा वेग' },
  uvIndex: { en: 'UV Index', hi: 'यूवी सूचकांक', ta: 'புற ஊதா குறியீடு', mr: 'अतिनील किरण निर्देशांक' },
  rainChance: { en: 'Rain Chance', hi: 'बारिश की संभावना', ta: 'மழை வாய்ப்பு', mr: 'पावसाची शक्यता' },
  pressure: { en: 'Pressure', hi: 'दबाव', ta: 'அழுத்தம்', mr: 'दाब' },
  fiveDayForecast: { en: '5-Day Forecast', hi: '5 दिनों का पूर्वानुमान', ta: '5 நாள் முன்னறிவிப்பு', mr: '५ दिवसांचा अंदाज' },
  irrigationOk: { en: 'Suitable for Irrigation', hi: 'सिंचाई के लिए उपयुक्त', ta: 'பாசனத்திற்கு ஏற்றது', mr: 'जलसिंचनासाठी योग्य' },
  harvestOk: { en: 'Suitable for Harvest', hi: 'कटाई के लिए उपयुक्त', ta: 'அறுவடைக்கு ஏற்றது', mr: 'काढणीसाठी योग्य' },
  sprayAvoid: { en: 'Avoid Pesticide Spraying', hi: 'कीटनाशक छिड़काव से बचें', ta: 'பூச்சிக்கொல்லி தெளிப்பதைத் தவிர்க்கவும்', mr: 'कीटकनाशक फवारणी टाळा' },

  // Crop Recommendation
  cropRecomTitle: { en: 'Crop Recommendation', hi: 'फसल की सिफारिश', ta: 'பயிர் பரிந்துரை', mr: 'पीक शिफारस' },
  selectSoil: { en: 'Select Soil Type', hi: 'मिट्टी का प्रकार चुनें', ta: 'மண் வகையைத் தேர்ந்தெடுக்கவும்', mr: 'मातीचा प्रकार निवडा' },
  selectSeason: { en: 'Select Season', hi: 'मौसम चुनें', ta: 'பருவத்தைத் தேர்ந்தெடுக்கவும்', mr: 'हंगाम निवडा' },
  waterAvailability: { en: 'Water Availability', hi: 'पानी की उपलब्धता', ta: 'நீர் கிடைக்கும் தன்மை', mr: 'पाण्याची उपलब्धता' },
  budget: { en: 'Investment Budget', hi: 'निवेश बजट', ta: 'முதலீட்டு வரவுசெலவுத் திட்டம்', mr: 'गुंतवणूक बजेट' },
  farmSize: { en: 'Farm Size (Acres)', hi: 'खेत का आकार (एकड़)', ta: 'பண்ணை அளவு (ஏக்கர்)', mr: 'शेतीचे आकारमान (एकर)' },
  recommendButton: { en: 'Find Best Crops', hi: 'सर्वोत्तम फसलें खोजें', ta: 'சிறந்த பயிர்களைக் கண்டறியவும்', mr: 'सर्वोत्तम पिके शोधा' },
  expectedYield: { en: 'Expected Yield', hi: 'अनुमानित उपज', ta: 'எதிர்பார்க்கப்படும் மகசூல்', mr: 'अपेक्षित उत्पादन' },
  profitEstimation: { en: 'Profit Estimation', hi: 'लाभ का अनुमान', ta: 'இலாப மதிப்பீடு', mr: 'नफ्याचा अंदाज' },
  suitableFertilizer: { en: 'Recommended Fertilizers', hi: 'अनुशंसित उर्वरक', ta: 'பரிந்துரைக்கப்பட்ட உரங்கள்', mr: 'योग्य खते' },
  growingTime: { en: 'Growing Time', hi: 'बढ़ने का समय', ta: 'வளரும் நேரம்', mr: 'कालावधी' },

  // Disease Scanner
  diseaseScanTitle: { en: 'AI Disease Detector', hi: 'एआई रोग डिटेक्टर', ta: 'AI நோய் கண்டறிதல்', mr: 'AI रोग निदान' },
  uploadPrompt: { en: 'Upload Crop Photo', hi: 'फसल की फोटो अपलोड करें', ta: 'பயிர் புகைப்படத்தை பதிவேற்றவும்', mr: 'पिकाचा फोटो अपलोड करा' },
  cameraPrompt: { en: 'Take Photo with Camera', hi: 'कैमरे से फोटो लें', ta: 'கேமரா மூலம் படம் எடுக்கவும்', mr: 'कॅमेऱ्याने फोटो घ्या' },
  scanAnalyze: { en: 'Scan & Analyze', hi: 'स्कैन और विश्लेषण', ta: 'ஸ்கேன் செய்து பகுப்பாய்வு செய்க', mr: 'स्कॅन आणि विश्लेषण' },
  diagnosisResult: { en: 'Diagnosis Result', hi: 'निदान का परिणाम', ta: 'கண்டறியப்பட்ட முடிவு', mr: 'निदान निकाल' },
  symptoms: { en: 'Symptoms', hi: 'लक्षण', ta: 'அறிகுறிகள்', mr: 'लक्षणे' },
  causes: { en: 'Causes', hi: 'कारण', ta: 'காரணங்கள்', mr: 'कारणे' },
  organicRemedy: { en: 'Organic Remedies', hi: 'जैविक उपचार', ta: 'இயற்கை வைத்தியம்', mr: 'सेंद्रिय उपाय' },
  chemicalPesticide: { en: 'Chemical Pesticides', hi: 'रासायनिक कीटनाशक', ta: 'இரசாயன பூச்சிக்கொல்லிகள்', mr: 'रासायनिक कीटकनाशके' },
  preventionTips: { en: 'Prevention Tips', hi: 'बचाव के उपाय', ta: 'தடுப்பு குறிப்புகள்', mr: 'प्रतिबंधक उपाय' },
  downloadPdf: { en: 'Download PDF Report', hi: 'पीडीएफ रिपोर्ट डाउनलोड करें', ta: 'PDF அறிக்கையை பதிவிறக்கவும்', mr: 'पीडीएफ अहवाल डाउनलोड करा' },

  // Market Prices
  mandiRatesTitle: { en: 'Live Mandi Rates', hi: 'लाइव मंडी दरें', ta: 'நேரடி மண்டி விலைகள்', mr: 'थेट बाजार भाव' },
  searchCrop: { en: 'Search Crops...', hi: 'फसलें खोजें...', ta: 'பயிர்களைத் தேடுங்கள்...', mr: 'पिके शोधा...' },
  cropName: { en: 'Crop Name', hi: 'फसल का नाम', ta: 'பயிரின் பெயர்', mr: 'पिकाचे नाव' },
  mandiName: { en: 'Market (Mandi)', hi: 'बाजार (मंडी)', ta: 'சந்தை (மண்டி)', mr: 'बाजार (मंडी)' },
  todayRate: { en: 'Today\'s Rate', hi: 'आज का भाव', ta: 'இன்றைய விலை', mr: 'आजचा दर' },
  yesterdayRate: { en: 'Yesterday\'s Rate', hi: 'कल का भाव', ta: 'நேற்றைய விலை', mr: 'कालचा दर' },
  weeklyTrend: { en: 'Weekly Trend', hi: 'साप्ताहिक रुझान', ta: 'வாராந்திர போக்கு', mr: 'साप्ताहिक कल' },
  bestMarketPrice: { en: 'Best Price Available', hi: 'सर्वोत्तम उपलब्ध मूल्य', ta: 'சிறந்த விலை கிடைக்கும் இடம்', mr: 'सर्वोत्तम उपलब्ध दर' },

  // Government Schemes
  govtSchemesTitle: { en: 'Agricultural Schemes', hi: 'कृषि योजनाएं', ta: 'விவசாய திட்டங்கள்', mr: 'कृषी योजना' },
  searchSchemes: { en: 'Search Schemes...', hi: 'योजनाएं खोजें...', ta: 'திட்டங்களைத் தேடுங்கள்...', mr: 'योजना शोधा...' },
  schemeOverview: { en: 'Scheme Overview', hi: 'योजना का अवलोकन', ta: 'திட்டத்தின் கண்ணோட்டம்', mr: 'योजनेचा तपशील' },
  eligibilityCriteria: { en: 'Eligibility Criteria', hi: 'पात्रता मापदंड', ta: 'தகுதி வரம்புகள்', mr: 'पात्रता निकष' },
  schemeBenefits: { en: 'Benefits Provided', hi: 'प्रदान किए जाने वाले लाभ', ta: 'வழங்கப்படும் நன்மைகள்', mr: 'मिळणारे फायदे' },
  documentsRequired: { en: 'Documents Required', hi: 'आवश्यक दस्तावेज', ta: 'தேவைப்படும் ஆவணங்கள்', mr: 'आवश्यक कागदपत्रे' },
  applyNow: { en: 'Apply Online', hi: 'ऑनलाइन आवेदन करें', ta: 'ஆன்லைனில் விண்ணப்பிக்கவும்', mr: 'ऑनलाईन अर्ज करा' },

  // Help Center
  helpCenterTitle: { en: 'Help & Support Center', hi: 'सहायता और सहायता केंद्र', ta: 'உதவி மற்றும் ஆதரவு மையம்', mr: 'मदत आणि मदत केंद्र' },
  farmerFeedback: { en: 'Send Farmer Feedback', hi: 'किसान प्रतिक्रिया भेजें', ta: 'விவசாயி கருத்துக்களை அனுப்பவும்', mr: 'शेतकरी अभिप्राय पाठवा' },
  ratingPrompt: { en: 'Rate Us (1 to 5)', hi: 'हमें रेट करें (1 से 5)', ta: 'மதிப்பிடவும் (1 முதல் 5)', mr: 'आम्हाला रेट करा (१ ते ५)' },
  feedbackSuccess: { en: 'Thank you for your feedback!', hi: 'आपकी प्रतिक्रिया के लिए धन्यवाद!', ta: 'உங்கள் கருத்துக்கு நன்றி!', mr: 'तुमच्या अभिप्रायाबद्दल धन्यवाद!' }
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('farmer_language');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('farmer_language', lang);
  };

  const t = (key: string): string => {
    if (!translations[key]) return key;
    return translations[key][language] || translations[key]['en'] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
