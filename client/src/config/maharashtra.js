// SFAS serves Maharashtra farmers only. Keep in sync with server/config/maharashtra.js
export const REGION_STATE = 'Maharashtra';

export const MAHARASHTRA_DISTRICTS = [
  { name: 'Pune', region: 'Western Maharashtra', mr: 'पुणे', hi: 'पुणे' },
  { name: 'Satara', region: 'Western Maharashtra', mr: 'सातारा', hi: 'सतारा' },
  { name: 'Sangli', region: 'Western Maharashtra', mr: 'सांगली', hi: 'सांगली' },
  { name: 'Kolhapur', region: 'Western Maharashtra', mr: 'कोल्हापूर', hi: 'कोल्हापुर' },
  { name: 'Solapur', region: 'Western Maharashtra', mr: 'सोलापूर', hi: 'सोलापुर' },
  { name: 'Nashik', region: 'North Maharashtra', mr: 'नाशिक', hi: 'नासिक' },
  { name: 'Ahmednagar', region: 'North Maharashtra', mr: 'अहमदनगर', hi: 'अहमदनगर' },
  { name: 'Jalgaon', region: 'North Maharashtra', mr: 'जळगाव', hi: 'जलगांव' },
  { name: 'Dhule', region: 'North Maharashtra', mr: 'धुळे', hi: 'धुले' },
  { name: 'Nandurbar', region: 'North Maharashtra', mr: 'नंदुरबार', hi: 'नंदुरबार' },
  { name: 'Aurangabad', region: 'Marathwada', mr: 'छत्रपती संभाजीनगर', hi: 'छत्रपति संभाजीनगर' },
  { name: 'Jalna', region: 'Marathwada', mr: 'जालना', hi: 'जालना' },
  { name: 'Beed', region: 'Marathwada', mr: 'बीड', hi: 'बीड' },
  { name: 'Latur', region: 'Marathwada', mr: 'लातूर', hi: 'लातूर' },
  { name: 'Osmanabad', region: 'Marathwada', mr: 'धाराशिव', hi: 'धाराशिव' },
  { name: 'Nanded', region: 'Marathwada', mr: 'नांदेड', hi: 'नांदेड़' },
  { name: 'Parbhani', region: 'Marathwada', mr: 'परभणी', hi: 'परभणी' },
  { name: 'Hingoli', region: 'Marathwada', mr: 'हिंगोली', hi: 'हिंगोली' },
  { name: 'Nagpur', region: 'Vidarbha', mr: 'नागपूर', hi: 'नागपुर' },
  { name: 'Amravati', region: 'Vidarbha', mr: 'अमरावती', hi: 'अमरावती' },
  { name: 'Akola', region: 'Vidarbha', mr: 'अकोला', hi: 'अकोला' },
  { name: 'Yavatmal', region: 'Vidarbha', mr: 'यवतमाळ', hi: 'यवतमाल' },
  { name: 'Wardha', region: 'Vidarbha', mr: 'वर्धा', hi: 'वर्धा' },
  { name: 'Washim', region: 'Vidarbha', mr: 'वाशिम', hi: 'वाशिम' },
  { name: 'Buldhana', region: 'Vidarbha', mr: 'बुलढाणा', hi: 'बुलढाणा' },
  { name: 'Chandrapur', region: 'Vidarbha', mr: 'चंद्रपूर', hi: 'चंद्रपुर' },
  { name: 'Gondia', region: 'Vidarbha', mr: 'गोंदिया', hi: 'गोंदिया' },
  { name: 'Bhandara', region: 'Vidarbha', mr: 'भंडारा', hi: 'भंडारा' },
  { name: 'Gadchiroli', region: 'Vidarbha', mr: 'गडचिरोली', hi: 'गढ़चिरौली' },
  { name: 'Thane', region: 'Konkan', mr: 'ठाणे', hi: 'ठाणे' },
  { name: 'Palghar', region: 'Konkan', mr: 'पालघर', hi: 'पालघर' },
  { name: 'Raigad', region: 'Konkan', mr: 'रायगड', hi: 'रायगढ़' },
  { name: 'Ratnagiri', region: 'Konkan', mr: 'रत्नागिरी', hi: 'रत्नागिरी' },
  { name: 'Sindhudurg', region: 'Konkan', mr: 'सिंधुदुर्ग', hi: 'सिंधुदुर्ग' },
  { name: 'Mumbai', region: 'Konkan', mr: 'मुंबई शहर', hi: 'मुंबई शहर' },
  { name: 'Mumbai Suburban', region: 'Konkan', mr: 'मुंबई उपनगर', hi: 'मुंबई उपनगर' }
];

const REGION_NAMES = {
  'Western Maharashtra': { mr: 'पश्चिम महाराष्ट्र', hi: 'पश्चिम महाराष्ट्र' },
  'North Maharashtra': { mr: 'उत्तर महाराष्ट्र (खान्देश)', hi: 'उत्तर महाराष्ट्र (खानदेश)' },
  'Marathwada': { mr: 'मराठवाडा', hi: 'मराठवाड़ा' },
  'Vidarbha': { mr: 'विदर्भ', hi: 'विदर्भ' },
  'Konkan': { mr: 'कोकण', hi: 'कोंकण' }
};

// Major agricultural districts shown as quick-pick chips
export const POPULAR_DISTRICTS = ['Nashik', 'Pune', 'Ahmednagar', 'Solapur', 'Kolhapur', 'Aurangabad', 'Latur', 'Jalgaon', 'Nagpur', 'Amravati', 'Yavatmal', 'Akola'];

// Crops with live Agmarknet prices in Maharashtra mandis
export const MANDI_CROPS = ['Soybean', 'Cotton', 'Tur (Arhar)', 'Gram (Chana)', 'Onion', 'Tomato', 'Wheat', 'Jowar', 'Maize', 'Rice (Paddy)', 'Green Chilli', 'Potato', 'Pomegranate', 'Grapes'];

export function districtLabel(name, lang = 'en') {
  const d = MAHARASHTRA_DISTRICTS.find((x) => x.name === name);
  if (!d || lang === 'en') return name;
  return d[lang] || name;
}

export function regionLabel(region, lang = 'en') {
  if (lang === 'en') return region;
  return REGION_NAMES[region]?.[lang] || region;
}

export function isMaharashtraDistrict(name) {
  return MAHARASHTRA_DISTRICTS.some((d) => d.name === name);
}

export const TRANSPORT_VEHICLES = [
  { id: 'Tempo 2-Ton', label: 'Tempo (2-Ton / 20 q)', capacity: 20 },
  { id: 'Eicher 10-Ton Container', label: 'Eicher (10-Ton / 100 q)', capacity: 100 },
  { id: 'Ashok Leyland 12-Ton', label: 'Ashok Leyland (12-Ton / 120 q)', capacity: 120 },
  { id: 'Tata 16-Ton Multi-axle', label: 'Tata Multi-axle (16-Ton / 160 q)', capacity: 160 }
];

export const POPULAR_DESTINATION_MANDIS = [
  'Vashi APMC (Navi Mumbai)',
  'Lasalgaon APMC',
  'Gultekdi APMC (Pune)',
  'Pimpalgaon Baswant APMC',
  'Baramati APMC',
  'Latur APMC',
  'Akola APMC',
  'Nagpur APMC',
  'Solapur APMC',
  'Ahmednagar APMC',
  'Kolhapur APMC'
];
