import React from 'react';
import { ShieldCheck, CheckCircle2, Cpu, Database, Eye, Mic, WifiOff, FileCode, Users } from 'lucide-react';
import { getTranslation } from '../services/i18n.js';

export function TechnologyAboutPage({ lang }) {
  const t = getTranslation(lang);

  const usabilityMatrix = [
    {
      problem: lang === 'hi' ? 'किसानों को जटिल प्रयोगशाला मान (pH, ईसी) समझने में कठिनाई होती है।' : lang === 'mr' ? 'शेतकऱ्यांना गुंतागुंतीची रासायनिक सूत्रे व प्रयोगशाळा मूल्ये समजणे अवघड जाते.' : 'Farmers experience high cognitive load when confronted with agronomic laboratory values (pH fractions, electrical conductivity, chemical formulas).',
      uxDecision: lang === 'hi' ? 'चित्रमय सरल कार्ड (मिट्टी, पानी, फसल अवस्था) बिना टाइपिंग के।' : lang === 'mr' ? 'चित्रमय सोपे कार्ड्स (माती, पाणी, पिकाची अवस्था) जेणेकरून टाइपिंगची गरज नाही.' : 'Guided visual option picker cards (Soil type, water reliability, and crop stage) with intuitive icons and regional descriptions.',
      feature: lang === 'hi' ? 'फसल सलाहकार विजार्ड' : lang === 'mr' ? 'पीक शिफारस मार्गदर्शक' : 'Guided Crop Recommendation Wizard',
      benefit: lang === 'hi' ? 'शून्य टाइपिंग; किसान कुछ ही सेकंड में सही विकल्प चुन लेते हैं।' : lang === 'mr' ? 'शून्य टायपिंग; शेतकरी काही सेकंदात परिचित पर्याय निवडतात.' : 'Zero typing required; farmers recognize familiar soil and water conditions in seconds.'
    },
    {
      problem: lang === 'hi' ? 'ग्रामीण खेतों में इंटरनेट की भारी समस्या और नेटवर्क कटना।' : lang === 'mr' ? 'ग्रामीण भागात शेतात इंटरनेटचा मोठा अभाव व नेटवर्क गायब होणे.' : 'Cellular data coverage in rural Indian fields is highly intermittent and drops during critical in-field crop scouting.',
      uxDecision: lang === 'hi' ? 'ब्राउज़र में 100% ऑफलाइन चलने वाला एज एआई मॉडल।' : lang === 'mr' ? 'ब्राउझरमध्येच १००% ऑफलाइन चालणारे एआय मॉडेल.' : 'Client-side Edge AI execution inside browser canvas + Service Worker and IndexedDB offline scan queue.',
      feature: lang === 'hi' ? 'ऑफलाइन एआई रोग स्कैनर' : lang === 'mr' ? 'ऑफलाइन एआय रोग स्कॅनर' : 'Offline Edge AI Disease Scanner',
      benefit: lang === 'hi' ? 'एरोप्लेन मोड में भी तुरंत पत्ती रोग की पहचान और जैविक उपाय।' : lang === 'mr' ? 'इंटरनेट नसतानाही पानाचे रोग निदान व सेंद्रिय औषध सल्ला.' : 'Farmer receives immediate lesion diagnosis and treatment advice even with airplane mode active.'
    },
    {
      problem: lang === 'hi' ? 'दूर की मंडियों के ऊंचे भाव देखकर जाने पर भारी गाड़ी भाड़े से घाटा।' : lang === 'mr' ? 'लांबच्या बाजारातील जास्त भाव पाहून गेल्यावर वाहतूक भाड्यामुळे तोटा होणे.' : 'Distant APMC mandis quote deceptively high raw auction prices, leading farmers to incur heavy transport losses.',
      uxDecision: lang === 'hi' ? 'गाड़ी भाड़ा व मंडी खर्च घटाकर शुद्ध मुनाफा दिखाने वाली स्वचालित प्रणाली।' : lang === 'mr' ? 'गाडीभाडे व खर्च वजा करून प्रत्यक्ष निव्वळ नफा मोजणारी प्रणाली.' : 'Automated Net Realization computation subtracting diesel freight and mandi handling charges from gross yield.',
      feature: lang === 'hi' ? 'स्मार्ट मंडी शुद्ध मुनाफा' : lang === 'mr' ? 'स्मार्ट मार्केट निव्वळ नफा' : 'Smart Mandi & Transport Net Realization',
      benefit: lang === 'hi' ? 'धोखे से बचाव; वही मंडी चुनें जहां हाथ में सबसे ज्यादा नकदी आए।' : lang === 'mr' ? 'फसगत टळते; प्रत्यक्ष हातात जास्त पैसे देणारी बाजारपेठ समजते.' : 'Prevents false decision traps; reveals the market that yields maximum take-home cash in the farmer\'s pocket.'
    },
    {
      problem: lang === 'hi' ? 'मौसम के कच्चे आंकड़े (78% नमी, 14 मिमी बारिश) समझना कठिन।' : lang === 'mr' ? 'हवामानाचे कच्चे आकडे (७८% दमटपणा, १४ मिमी पाऊस) समजणे कठीण.' : 'Farmers find raw meteorological data (\'78% humidity, 14mm rain\') difficult to interpret into field actions.',
      uxDecision: lang === 'hi' ? 'मौसम के आधार पर छिड़काव समय और फफूंद रोग की पूर्व-चेतावनी।' : lang === 'mr' ? 'हवामानानुसार फवारणीची योग्य वेळ व रोगांची पूर्व-सूचना.' : 'Agro-meteorological rule engine that translates humidity and temperature into specific phenological crop impacts.',
      feature: lang === 'hi' ? 'सटीक कृषि मौसम चेतावनी' : lang === 'mr' ? 'हवामान सतर्कता प्रणाली' : 'Preventative Agro-Risk Early Warnings',
      benefit: lang === 'hi' ? 'बीमारी आने से 48 घंटे पहले ही किसान बचाव कार्य कर लेता है।' : lang === 'mr' ? 'रोग येण्यापूर्वीच ४८ तास आधी शेतकरी संरक्षणात्मक फवारणी करतो.' : 'Farmer takes action (e.g. clearing drainage, applying bio-spray) 48 hours before fungal blast occurs.'
    },
    {
      problem: lang === 'hi' ? 'टेक्स्ट वाले चैटबॉट में कम पढ़े-लिखे किसानों के लिए असुविधा।' : lang === 'mr' ? 'केवळ मजकूर वाचताना शेतकरी मित्रांना होणारी अडचण.' : 'Text-heavy chatbots exclude farmers with low literacy or limited English comprehension.',
      uxDecision: lang === 'hi' ? 'हिंदी और मराठी में एक-क्लिक वॉइस रिकॉर्डिंग और बोलकर सुनाने की सुविधा।' : lang === 'mr' ? 'मराठी व हिंदीत एका क्लिकवर आवाजात प्रश्न विचारणे व ऐकणे.' : 'One-click Web Speech voice recording + natural SpeechSynthesis audio readouts in Marathi, Hindi, and English.',
      feature: lang === 'hi' ? 'बहुभाषी एआई वॉइस कृषि मित्र' : lang === 'mr' ? 'बहुभाषिक एआय व्हॉईस कृषी मित्र' : 'Multilingual AI Voice Agronomist',
      benefit: lang === 'hi' ? 'हर किसान बिना लिखे आसानी से बात करके कृषि सलाह ले सकता है।' : lang === 'mr' ? 'कोणताही शेतकरी न लिहिता सहजपणे बोलून मार्गदर्शन मिळवू शकतो.' : 'Hands-free voice consultation accessible to farmers of all educational backgrounds.'
    }
  ];

  return (
    <div className="container" style={{ padding: '36px var(--space-md) 64px var(--space-md)' }}>
      {/* Header */}
      <div style={{ maxWidth: '800px', marginBottom: '32px' }}>
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary-forest)', fontWeight: 700 }}>
          {lang === 'hi' ? 'सॉफ्टवेयर सुगमता एवं इंजीनियरिंग विवरण' : lang === 'mr' ? 'प्रणाली सुलभता व तांत्रिक माहिती' : 'Software Usability & Engineering Dossier'}
        </span>
        <h1 style={{ marginTop: '4px', marginBottom: '8px', color: 'var(--color-primary-forest)' }}>
          {lang === 'hi' ? 'तकनीकी वास्तुकला एवं उपयोगिता मूल्यांकन' : lang === 'mr' ? 'तांत्रिक पाया व सुलभता मूल्यांकन' : 'Academic Evaluation & Usability Architecture'}
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          {lang === 'hi'
            ? 'स्मार्ट किसान सहायता प्रणाली (SFAS) के तकनीकी सिद्धांतों, नीलसन नॉर्मन सुगमता नियमों और सॉफ्टवेयर वास्तुकला का व्यापक विवरण।'
            : lang === 'mr'
            ? 'स्मार्ट शेतकरी प्रणालीचे तांत्रिक सिद्धांत, सुलभता मानके आणि सॉफ्टवेअर रचनेची सविस्तर माहिती.'
            : 'Comprehensive documentation of the engineering principles, Nielsen Norman usability heuristics, and software architecture powering the Smart Farmer Assistance System.'}
        </p>
      </div>

      {/* CORE USABILITY MATRIX TABLE */}
      <div className="card" style={{ marginBottom: '48px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary-forest)', marginBottom: '16px' }}>
          <ShieldCheck size={24} color="var(--color-leaf-green)" />
          <h2 style={{ fontSize: '1.45rem' }}>
            {lang === 'hi' ? 'समस्या → यूआई निर्णय → विकसित फीचर → किसान लाभ' : lang === 'mr' ? 'शेतकरी अडचण → प्रणाली उपाय → विकसित वैशिष्ट्य → थेट नफा' : 'Problem → UX Decision → Feature → Benefit Matrix'}
          </h2>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          {lang === 'hi'
            ? 'यह तालिका दर्शाती है कि प्रत्येक इंटरफेस विकल्प ग्रामीण उपयोगिता बाधाओं को हल करने के लिए कैसे तैयार किया गया है:'
            : lang === 'mr'
            ? 'खालील तक्ता दर्शवतो की प्रत्येक तांत्रिक निर्णय शेतकऱ्यांची अडचण सोडवण्यासाठी कसा तयार केला आहे:'
            : 'This matrix demonstrates how every architectural and interface choice was grounded in solving real rural usability barriers:'}
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-canvas-surface)', borderBottom: '2px solid var(--color-border-strong)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--color-primary-forest)', fontWeight: 700 }}>{lang === 'hi' ? 'किसान की व्यावहारिक बाधा' : lang === 'mr' ? 'शेतकऱ्यांची अडचण' : 'Farmer Usability Barrier'}</th>
                <th style={{ padding: '12px 16px', color: 'var(--color-primary-forest)', fontWeight: 700 }}>{lang === 'hi' ? 'यूएक्स समाधान' : lang === 'mr' ? 'प्रणाली उपाय' : 'UX Design Decision'}</th>
                <th style={{ padding: '12px 16px', color: 'var(--color-primary-forest)', fontWeight: 700 }}>{lang === 'hi' ? 'विकसित फीचर' : lang === 'mr' ? 'वैशिष्ट्य' : 'Engineered Feature'}</th>
                <th style={{ padding: '12px 16px', color: 'var(--color-primary-forest)', fontWeight: 700 }}>{lang === 'hi' ? 'किसान को प्रत्यक्ष लाभ' : lang === 'mr' ? 'थेट फायदा' : 'Tangible Farmer Benefit'}</th>
              </tr>
            </thead>
            <tbody>
              {usabilityMatrix.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '14px 16px', color: 'var(--color-terracotta)', fontWeight: 600 }}>{row.problem}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--color-primary-forest)', fontWeight: 600 }}>{row.uxDecision}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700 }}>{row.feature}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--color-leaf-green)', fontWeight: 600 }}>{row.benefit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ARCHITECTURAL SPECIFICATIONS */}
      <div className="grid-2" style={{ gap: '32px', marginBottom: '48px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--color-primary-forest)' }}>
            <Cpu size={22} />
            <h3 style={{ fontSize: '1.25rem' }}>{lang === 'hi' ? 'एज एआई और ऑफलाइन पीडब्ल्यूए तकनीक' : lang === 'mr' ? 'एज एआय व ऑफलाइन पीडब्ल्यूए तंत्रज्ञान' : 'Edge AI & Offline PWA Engineering'}</h3>
          </div>
          <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--color-text-main)' }}>
            <li><strong>{lang === 'hi' ? 'इन-ब्राउज़र इमेज प्रोसेसिंग:' : lang === 'mr' ? 'ब्राउझरमध्ये इमेज प्रोसेसिंग:' : 'In-Browser Feature Extractor:'}</strong> {lang === 'hi' ? 'क्लाउड पर फोटो भेजे बिना डिवाइस पर ही रंग और धब्बों की जांच।' : lang === 'mr' ? 'फोटो क्लाउडवर न पाठवता मोबाईलमध्येच रोगाची त्वरित तपासणी.' : 'Extracts RGB color histograms and necrotic ring patterns directly on HTML5 Canvas.'}</li>
            <li><strong>{lang === 'hi' ? 'सर्विस वर्कर कैशिंग:' : lang === 'mr' ? 'सर्व्हिस वर्कर कॅशिंग:' : 'Service Worker App Shell:'}</strong> {lang === 'hi' ? 'बिना इंटरनेट ऐप को तुरंत खोलने के लिए सुरक्षित कैशिंग।' : lang === 'mr' ? 'इंटरनेट नसतानाही प्रणाली तत्काळ सुरू राहते.' : 'Pre-caches assets to ensure instant offline startup.'}</li>
            <li><strong>{lang === 'hi' ? 'इंडेक्सडीडीबी डेटा सुरक्षा:' : lang === 'mr' ? 'इंडेक्सडीडीबी डेटा साठवण:' : 'IndexedDB Persistence:'}</strong> {lang === 'hi' ? 'ऑफलाइन जांच को फोन में सुरक्षित रखना और इंटरनेट आने पर सिंक करना।' : lang === 'mr' ? 'ऑफलाइन तपासण्या मोबाईलमध्ये साठवणे व इंटरनेट आल्यावर अपडेट करणे.' : 'Queues un-synced scans with automatic sync triggers upon network reconnection.'}</li>
          </ul>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--color-primary-forest)' }}>
            <Database size={22} />
            <h3 style={{ fontSize: '1.25rem' }}>{lang === 'hi' ? 'डेटाबेस मॉडलिंग एवं प्रमाणिकता' : lang === 'mr' ? 'डेटाबेस मॉडेलिंग व अचूकता' : 'Relational Data Modeling & Integrity'}</h3>
          </div>
          <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--color-text-main)' }}>
            <li><strong>{lang === 'hi' ? 'विश्वसनीय संस्थाएं:' : lang === 'mr' ? 'डेटा संरचना:' : 'Entities:'}</strong> <code>users</code>, <code>farmer_profiles</code>, <code>farms</code>, <code>crops</code>, <code>mandis</code>, <code>mandi_prices</code>, <code>transport_pools</code>, <code>alerts</code>.</li>
            <li><strong>{lang === 'hi' ? 'पारदर्शी खुलासे:' : lang === 'mr' ? 'पारदर्शक माहिती:' : 'Zero Fake Claims:'}</strong> {lang === 'hi' ? 'वित्तीय अनुमानों के साथ मौसम और बाजार जोखिमों का स्पष्ट प्रकटीकरण।' : lang === 'mr' ? 'आर्थिक अंदाजात निसर्ग व बाजार जोखीम स्पष्टपणे नमूद.' : 'Financial ROI calculations with multi-dimensional risk disclosures.'}</li>
            <li><strong>{lang === 'hi' ? 'वास्तविक भारतीय संदर्भ:' : lang === 'mr' ? 'खऱ्या भारतीय बाजारपेठा:' : 'Authentic Indian Context:'}</strong> {lang === 'hi' ? 'लासलगांव, नासिक, पुणे, वाशी मंडियों के सत्यापित भाव और सरकारी योजनाएं।' : lang === 'mr' ? 'लासलगाव, नाशिक, पुणे, वाशी बाजार समित्यांचे खरे भाव व शासकीय योजना.' : 'Real APMC mandis (Lasalgaon, Nashik, Pune, Vashi) and verified government schemes.'}</li>
          </ul>
        </div>
      </div>

      {/* TEAM ATTRIBUTION */}
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--color-primary-forest)' }}>
          <Users size={22} />
          <h3 style={{ fontSize: '1.25rem' }}>{t.landing.teamTitle}</h3>
        </div>
        <div className="grid-3">
          <div style={{ padding: '16px', background: 'var(--color-canvas-surface)', borderRadius: 'var(--radius-md)' }}>
            <strong>Yash Bawane</strong>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-leaf-green)', fontWeight: 700, textTransform: 'uppercase' }}>{t.landing.teamRole1}</div>
            <p style={{ fontSize: '0.82rem', marginTop: '6px' }}>{lang === 'hi' ? 'यूआई डिजाइन सिस्टम, त्रिभाषी समर्थन, सुगम कार्ड और किसान-अनुकूल लेआउट।' : lang === 'mr' ? 'यूआय डिझाईन, त्रिभाषिक समर्थन, सुलभ कार्ड्स आणि शेतकरी-अनुकूल लेआउट.' : 'Agricultural editorial design system, typography scale, guided option pickers, and responsive layouts.'}</p>
          </div>

          <div style={{ padding: '16px', background: 'var(--color-canvas-surface)', borderRadius: 'var(--radius-md)' }}>
            <strong>Rohit Kundu</strong>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-leaf-green)', fontWeight: 700, textTransform: 'uppercase' }}>{t.landing.teamRole2}</div>
            <p style={{ fontSize: '0.82rem', marginTop: '6px' }}>{lang === 'hi' ? 'एक्सप्रेस रेस्ट एपीआई, एसक्यूएल डेटाबेस, फसल मुनाफा एल्गोरिदम और मंडी रसद।' : lang === 'mr' ? 'एक्सप्रेस रेस्ट एपीआय, एसक्यूएल डेटाबेस, पीक नफा अल्गोरिदम आणि बाजार वाहतूक.' : 'Relational SQL schema, Express service layer, dynamic ROI calculation algorithms, and mandi net realization math.'}</p>
          </div>

          <div style={{ padding: '16px', background: 'var(--color-canvas-surface)', borderRadius: 'var(--radius-md)' }}>
            <strong>Manthan Takerkhede</strong>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-leaf-green)', fontWeight: 700, textTransform: 'uppercase' }}>{t.landing.teamRole3}</div>
            <p style={{ fontSize: '0.82rem', marginTop: '6px' }}>{lang === 'hi' ? 'ऑफलाइन एज एआई रोग स्कैनर, बहुभाषी वॉइस एग्रोनॉमिस्ट और सुगमता परीक्षण।' : lang === 'mr' ? 'ऑफलाइन एज एआय रोग स्कॅनर, बहुभाषिक व्हॉईस कृषी मित्र आणि सुलभता चाचणी.' : 'In-browser Edge AI diagnostic scanner, offline sync queue, and multilingual RAG conversational pipeline.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
