// Translations for text the server generates (weather advice, alerts, mandi insight).
// Every API that returns sentences accepts ?lang=en|hi|mr and uses tr() below.

const MESSAGES = {
    en: {
        // Time of day
        'period.night': 'Night',
        'period.dawn': 'Early morning',
        'period.morning': 'Morning',
        'period.midday': 'Afternoon heat',
        'period.evening': 'Evening',
        'period.lateEvening': 'Late evening',

        // Today's advice
        'advice.rain': 'Rain is likely today ({rain}% chance). Do not spray {crop} today and keep field drains open.',
        'advice.humid': 'Humidity is high ({humidity}%). Fungal disease can spread - check the lower leaves of {crop} for spots.',
        'advice.heat': 'It is hot ({temp}°C). Irrigate {crop} in the evening and avoid spraying between 11 am and 3:30 pm.',
        'advice.wind': 'Wind is strong ({wind} km/h). Avoid spraying today - the spray will drift.',
        'advice.night': 'Dew forms on leaves at night. Do not spray now; check {crop} leaves in the morning.',
        'advice.dawn': 'Good time to check soil moisture. Spray only after the dew dries.',
        'advice.morning': 'Good time for spraying {crop} - before the afternoon heat.',
        'advice.midday': 'Strong sun now. Do not spray; make sure {crop} has enough water.',
        'advice.evening': 'Temperature is falling. Good time for irrigation and harvesting.',
        'advice.lateEvening': 'Calm evening. Good time to sort and pack produce for the mandi.',

        // Forecast day summary
        'forecast.rain': 'Rain likely ({rain}%). Avoid spraying; keep drains clear.',
        'forecast.dry': 'Mostly dry (max {max}°C). Good for field work.',

        // Alerts
        'alert.fungal.title': 'High risk of fungal blight on {crop}',
        'alert.fungal.reason': 'Humidity {humidity}% and {rain}% chance of rain in {district}.',
        'alert.fungal.step1': 'Check lower leaves for brown or black ring-shaped spots.',
        'alert.fungal.step2': 'Clear drains so water does not stand near the roots.',
        'alert.fungal.step3': 'Spray Trichoderma viride (5 g per litre) before heavy rain.',
        'alert.wheat.title': 'Moisture care for wheat',
        'alert.wheat.reason': 'Day temperature {max}°C and humidity {humidity}%.',
        'alert.wheat.step1': 'Give light irrigation at crown-root stage; avoid waterlogging.',
        'alert.wheat.step2': 'Check field borders for yellow rust on upper leaves.',
        'alert.heat.title': 'Heat stress ({temp}°C)',
        'alert.heat.reason': 'High temperature can cause flower and fruit drop.',
        'alert.heat.step1': 'Give light irrigation in the evening.',
        'alert.heat.step2': 'Do not spray between 11:00 am and 3:30 pm.',
        'severity.Critical': 'High risk',
        'severity.Warning': 'Warning',
        'severity.Advisory': 'Advice',

        // Mandi insight
        'mandi.insight.distant': '{high} pays the highest rate (₹{highPrice}/q) but is about {km} km away. After transport and handling, {best} gives you the most money: ₹{net}.',
        'mandi.insight.same': '{best} gives both the highest rate (₹{price}/q, reported {date}) and the most money in hand: ₹{net}.'
    },
    hi: {
        'period.night': 'रात',
        'period.dawn': 'सुबह जल्दी',
        'period.morning': 'सुबह',
        'period.midday': 'दोपहर की गर्मी',
        'period.evening': 'शाम',
        'period.lateEvening': 'देर शाम',

        'advice.rain': 'आज बारिश की संभावना है ({rain}%)। आज {crop} पर छिड़काव न करें और खेत की नालियां खुली रखें।',
        'advice.humid': 'नमी ज्यादा है ({humidity}%)। फफूंद रोग फैल सकता है - {crop} की निचली पत्तियों पर धब्बे देखें।',
        'advice.heat': 'गर्मी है ({temp}°C)। {crop} की सिंचाई शाम को करें और 11 से 3:30 बजे के बीच छिड़काव न करें।',
        'advice.wind': 'हवा तेज है ({wind} किमी/घंटा)। आज छिड़काव न करें - दवा उड़ जाएगी।',
        'advice.night': 'रात में पत्तियों पर ओस जमती है। अभी छिड़काव न करें; सुबह {crop} की पत्तियां जांचें।',
        'advice.dawn': 'मिट्टी की नमी जांचने का अच्छा समय। ओस सूखने के बाद ही छिड़काव करें।',
        'advice.morning': '{crop} पर छिड़काव का अच्छा समय - दोपहर की गर्मी से पहले।',
        'advice.midday': 'अभी तेज धूप है। छिड़काव न करें; {crop} को पर्याप्त पानी दें।',
        'advice.evening': 'तापमान कम हो रहा है। सिंचाई और तुड़ाई का अच्छा समय।',
        'advice.lateEvening': 'शांत शाम। मंडी के लिए उपज छांटने और पैक करने का अच्छा समय।',

        'forecast.rain': 'बारिश की संभावना ({rain}%)। छिड़काव न करें; नालियां साफ रखें।',
        'forecast.dry': 'ज्यादातर सूखा (अधिकतम {max}°C)। खेत के काम के लिए अच्छा।',

        'alert.fungal.title': '{crop} पर फफूंद झुलसा रोग का अधिक खतरा',
        'alert.fungal.reason': '{district} में नमी {humidity}% और बारिश की संभावना {rain}%।',
        'alert.fungal.step1': 'निचली पत्तियों पर भूरे या काले गोल धब्बे देखें।',
        'alert.fungal.step2': 'नालियां साफ करें ताकि जड़ों के पास पानी न रुके।',
        'alert.fungal.step3': 'भारी बारिश से पहले ट्राइकोडर्मा विरिडी (5 ग्राम प्रति लीटर) छिड़कें।',
        'alert.wheat.title': 'गेहूं के लिए नमी की देखभाल',
        'alert.wheat.reason': 'दिन का तापमान {max}°C और नमी {humidity}%।',
        'alert.wheat.step1': 'शिखर जड़ अवस्था में हल्की सिंचाई करें; पानी न भरने दें।',
        'alert.wheat.step2': 'खेत की मेड़ों पर ऊपरी पत्तियों में पीला रतुआ देखें।',
        'alert.heat.title': 'गर्मी का तनाव ({temp}°C)',
        'alert.heat.reason': 'ज्यादा तापमान से फूल और फल झड़ सकते हैं।',
        'alert.heat.step1': 'शाम को हल्की सिंचाई करें।',
        'alert.heat.step2': 'सुबह 11 से दोपहर 3:30 बजे तक छिड़काव न करें।',
        'severity.Critical': 'अधिक खतरा',
        'severity.Warning': 'चेतावनी',
        'severity.Advisory': 'सलाह',

        'mandi.insight.distant': '{high} में भाव सबसे ज्यादा है (₹{highPrice}/क्विंटल) लेकिन यह लगभग {km} किमी दूर है। भाड़ा और खर्च घटाकर {best} में सबसे ज्यादा पैसा मिलेगा: ₹{net}।',
        'mandi.insight.same': '{best} में भाव भी सबसे ज्यादा है (₹{price}/क्विंटल, {date}) और हाथ में पैसा भी सबसे ज्यादा मिलेगा: ₹{net}।'
    },
    mr: {
        'period.night': 'रात्र',
        'period.dawn': 'पहाट',
        'period.morning': 'सकाळ',
        'period.midday': 'दुपारचे ऊन',
        'period.evening': 'संध्याकाळ',
        'period.lateEvening': 'उशिरा संध्याकाळ',

        'advice.rain': 'आज पावसाची शक्यता आहे ({rain}%). आज {crop} पिकावर फवारणी करू नका आणि शेतातील चर मोकळे ठेवा.',
        'advice.humid': 'आर्द्रता जास्त आहे ({humidity}%). बुरशीजन्य रोग पसरू शकतो - {crop} पिकाच्या खालच्या पानांवर डाग तपासा.',
        'advice.heat': 'उष्णता जास्त आहे ({temp}°C). {crop} पिकाला संध्याकाळी पाणी द्या आणि सकाळी ११ ते दुपारी ३:३० दरम्यान फवारणी टाळा.',
        'advice.wind': 'वारा जोरात आहे ({wind} किमी/तास). आज फवारणी टाळा - औषध उडून जाईल.',
        'advice.night': 'रात्री पानांवर दव साचते. आत्ता फवारणी करू नका; सकाळी {crop} पिकाची पाने तपासा.',
        'advice.dawn': 'जमिनीतील ओलावा तपासण्यासाठी चांगली वेळ. दव सुकल्यानंतरच फवारणी करा.',
        'advice.morning': '{crop} पिकावर फवारणीसाठी चांगली वेळ - दुपारच्या उन्हापूर्वी.',
        'advice.midday': 'आत्ता कडक ऊन आहे. फवारणी करू नका; {crop} पिकाला पुरेसे पाणी द्या.',
        'advice.evening': 'तापमान कमी होत आहे. पाणी देणे आणि काढणीसाठी चांगली वेळ.',
        'advice.lateEvening': 'शांत संध्याकाळ. बाजारासाठी माल निवडून पॅक करण्यासाठी चांगली वेळ.',

        'forecast.rain': 'पावसाची शक्यता ({rain}%). फवारणी टाळा; चर मोकळे ठेवा.',
        'forecast.dry': 'बहुतेक कोरडे (कमाल {max}°C). शेतीकामासाठी योग्य.',

        'alert.fungal.title': '{crop} पिकावर करपा (बुरशी) रोगाचा जास्त धोका',
        'alert.fungal.reason': '{district} मध्ये आर्द्रता {humidity}% आणि पावसाची शक्यता {rain}%.',
        'alert.fungal.step1': 'खालच्या पानांवर तपकिरी किंवा काळे गोल डाग तपासा.',
        'alert.fungal.step2': 'चर साफ करा, जेणेकरून मुळांजवळ पाणी साचणार नाही.',
        'alert.fungal.step3': 'जोरदार पावसापूर्वी ट्रायकोडर्मा व्हिरिडी (५ ग्रॅम प्रति लिटर) फवारा.',
        'alert.wheat.title': 'गव्हासाठी ओलाव्याची काळजी',
        'alert.wheat.reason': 'दिवसाचे तापमान {max}°C आणि आर्द्रता {humidity}%.',
        'alert.wheat.step1': 'मुकुटमुळे फुटण्याच्या अवस्थेत हलके पाणी द्या; पाणी साचू देऊ नका.',
        'alert.wheat.step2': 'बांधाजवळच्या वरच्या पानांवर पिवळा तांबेरा तपासा.',
        'alert.heat.title': 'उष्णतेचा ताण ({temp}°C)',
        'alert.heat.reason': 'जास्त तापमानामुळे फुले व फळे गळू शकतात.',
        'alert.heat.step1': 'संध्याकाळी हलके पाणी द्या.',
        'alert.heat.step2': 'सकाळी ११ ते दुपारी ३:३० दरम्यान फवारणी करू नका.',
        'severity.Critical': 'जास्त धोका',
        'severity.Warning': 'इशारा',
        'severity.Advisory': 'सल्ला',

        'mandi.insight.distant': '{high} मध्ये सर्वाधिक भाव आहे (₹{highPrice}/क्विंटल) पण ते सुमारे {km} किमी दूर आहे. वाहतूक व हमाली खर्च वजा केल्यावर {best} मध्ये सर्वाधिक पैसे मिळतील: ₹{net}.',
        'mandi.insight.same': '{best} मध्ये भावही सर्वाधिक आहे (₹{price}/क्विंटल, {date}) आणि हातात पैसेही सर्वाधिक मिळतील: ₹{net}.'
    }
};

// Crop names used inside sentences
const CROP_NAMES = {
    hi: { tomato: 'टमाटर', onion: 'प्याज', wheat: 'गेहूं', 'rice (paddy)': 'धान', rice: 'धान', cotton: 'कपास', soybean: 'सोयाबीन', maize: 'मक्का', potato: 'आलू', chilli: 'मिर्च', 'green chilli': 'हरी मिर्च', 'tur (arhar)': 'तुअर', 'gram (chana)': 'चना', jowar: 'ज्वार', pomegranate: 'अनार', grapes: 'अंगूर', sugarcane: 'गन्ना' },
    mr: { tomato: 'टोमॅटो', onion: 'कांदा', wheat: 'गहू', 'rice (paddy)': 'भात', rice: 'भात', cotton: 'कापूस', soybean: 'सोयाबीन', maize: 'मका', potato: 'बटाटा', chilli: 'मिरची', 'green chilli': 'हिरवी मिरची', 'tur (arhar)': 'तूर', 'gram (chana)': 'हरभरा', jowar: 'ज्वारी', pomegranate: 'डाळिंब', grapes: 'द्राक्षे', sugarcane: 'ऊस' }
};

export function normalizeLang(lang) {
    return ['en', 'hi', 'mr'].includes(lang) ? lang : 'en';
}

export function cropName(name = '', lang = 'en') {
    const l = normalizeLang(lang);
    if (l === 'en') return name;
    return CROP_NAMES[l][String(name).toLowerCase().trim()] || name;
}

export function tr(key, lang = 'en', params = {}) {
    const l = normalizeLang(lang);
    const template = MESSAGES[l][key] ?? MESSAGES.en[key] ?? key;
    return template.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? String(params[k]) : `{${k}}`));
}
