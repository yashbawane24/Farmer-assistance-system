#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server/.env manually if not already populated
const envPath = path.resolve(__dirname, '../server/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const testCases = [
  // 1. Disease / Pest
  {
    lang: 'en',
    question: 'My tomato leaves have yellow patches with dark rings',
    expectedIntent: 'disease_pest',
    check: (ans) => {
      const cause = (ans.likelyCause || '').toLowerCase();
      const hl = (ans.headline || '').toLowerCase();
      const sp = (ans.speakText || '').toLowerCase();
      const hasBlight = cause.includes('blight') || hl.includes('blight') || sp.includes('blight');
      const hasDiseaseScan = ans.appAction === 'disease_scan';
      const hasTreatment = Boolean(ans.treatment && (ans.treatment.organic || ans.treatment.chemical));
      return {
        passed: hasBlight && hasDiseaseScan && hasTreatment,
        details: `likelyCause: "${ans.likelyCause}", appAction: ${ans.appAction}, treatment: ${hasTreatment ? 'present' : 'missing'}`
      };
    }
  },
  {
    lang: 'hi',
    question: 'मेरे टमाटर के पत्तों पर पीले और काले गोल छल्ले वाले धब्बे हैं',
    expectedIntent: 'disease_pest',
    check: (ans) => {
      const hasTreatment = Boolean(ans.treatment);
      return {
        passed: hasTreatment,
        details: `appAction: ${ans.appAction}, treatment: ${hasTreatment ? 'present' : 'missing'}`
      };
    }
  },
  {
    lang: 'mr',
    question: 'माझ्या टोमॅटोच्या पानांवर पिवळे डाग आणि काळी चक्रे दिसत आहेत',
    expectedIntent: 'disease_pest',
    check: (ans) => {
      const hasTreatment = Boolean(ans.treatment);
      return {
        passed: hasTreatment,
        details: `appAction: ${ans.appAction}, treatment: ${hasTreatment ? 'present' : 'missing'}`
      };
    }
  },

  // 2. Market Price
  {
    lang: 'en',
    question: 'Soybean rate in Latur today?',
    expectedIntent: 'market_price',
    check: (ans) => {
      const noTreatment = ans.treatment === null;
      const isMandiAction = ans.appAction === 'smart_mandi' || ans.appAction === 'none';
      return {
        passed: noTreatment && isMandiAction,
        details: `treatment: ${ans.treatment}, appAction: ${ans.appAction}, priceInfo: ${JSON.stringify(ans.priceInfo)}`
      };
    }
  },
  {
    lang: 'mr',
    question: 'आज लातूरमध्ये सोयाबीनचा भाव काय आहे?',
    expectedIntent: 'market_price',
    check: (ans) => {
      const noTreatment = ans.treatment === null;
      return {
        passed: noTreatment,
        details: `treatment: ${ans.treatment}, appAction: ${ans.appAction}`
      };
    }
  },

  // 3. Irrigation / Weather
  {
    lang: 'en',
    question: 'Should I spray tomorrow?',
    expectedIntent: 'irrigation_weather',
    check: (ans) => {
      const noTreatment = ans.treatment === null;
      const hasWeatherNote = Boolean(ans.weatherNote && ans.weatherNote.trim());
      return {
        passed: noTreatment,
        details: `treatment: ${ans.treatment}, weatherNote: "${ans.weatherNote}"`
      };
    }
  },
  {
    lang: 'hi',
    question: 'क्या मुझे कल कीटनाशक स्प्रे करना चाहिए?',
    expectedIntent: 'irrigation_weather',
    check: (ans) => {
      return {
        passed: ans.treatment === null,
        details: `treatment: ${ans.treatment}`
      };
    }
  },

  // 4. Scheme / Subsidy
  {
    lang: 'en',
    question: 'Which scheme gives money for drip irrigation?',
    expectedIntent: 'scheme_subsidy',
    check: (ans) => {
      const noChemical = ans.treatment === null;
      return {
        passed: noChemical,
        details: `treatment: ${ans.treatment}, headline: "${ans.headline}"`
      };
    }
  },
  {
    lang: 'mr',
    question: 'ठिबक सिंचनासाठी कोणती योजना अनुदान देते?',
    expectedIntent: 'scheme_subsidy',
    check: (ans) => {
      return {
        passed: ans.treatment === null,
        details: `treatment: ${ans.treatment}`
      };
    }
  },

  // 5. Unclear Query
  {
    lang: 'en',
    question: 'My crop is not good',
    expectedIntent: 'unclear',
    check: (ans) => {
      const hasAskBack = Boolean(ans.askBack && ans.askBack.trim());
      const noTreatment = ans.treatment === null;
      return {
        passed: hasAskBack && noTreatment,
        details: `askBack: "${ans.askBack}", treatment: ${ans.treatment}`
      };
    }
  },
  {
    lang: 'hi',
    question: 'मेरी फसल अच्छी नहीं है',
    expectedIntent: 'unclear',
    check: (ans) => {
      const hasAskBack = Boolean(ans.askBack && ans.askBack.trim());
      return {
        passed: hasAskBack,
        details: `askBack: "${ans.askBack}"`
      };
    }
  }
];

function calculateVisibleWords(ans) {
  const parts = [];
  if (ans.headline) parts.push(ans.headline);
  if (ans.likelyCause) parts.push(ans.likelyCause);
  if (ans.descriptiveAdvice) parts.push(ans.descriptiveAdvice);
  if (Array.isArray(ans.steps)) parts.push(ans.steps.join(' '));
  if (ans.treatment?.organic) {
    parts.push(ans.treatment.organic.name || '');
    parts.push(ans.treatment.organic.dosePerLitre || '');
    parts.push(ans.treatment.organic.dosePerAcre || '');
  }
  if (ans.treatment?.chemical) {
    parts.push(ans.treatment.chemical.product || '');
    parts.push(ans.treatment.chemical.dosePerLitre || '');
    parts.push(ans.treatment.chemical.dosePerAcre || '');
    parts.push(ans.treatment.chemical.safety || '');
  }
  if (ans.priceInfo) {
    parts.push(ans.priceInfo.mandi || '');
    parts.push(ans.priceInfo.modalPrice || '');
  }
  if (ans.weatherNote) parts.push(ans.weatherNote);
  if (ans.askBack) parts.push(ans.askBack);

  const text = parts.join(' ').trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function hasMarkdownSymbols(obj) {
  const jsonStr = JSON.stringify(obj);
  return jsonStr.includes('**') || jsonStr.includes('###') || jsonStr.includes('---');
}

async function run() {
  console.log('================================================================');
  console.log('🌾 KRISHI MITRA AI AGRONOMIST — VERIFICATION TEST SUITE');
  console.log(`⏱️ Starting at: ${new Date().toISOString()}`);
  console.log('================================================================\n');

  // Dynamically import AgronomistRagService
  const { AgronomistRagService } = await import('../server/services/agronomistAndSchemeService.js');
  const { getDb } = await import('../server/models/db.js');
  await getDb();

  const timings = [];
  let passedCount = 0;
  let totalCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    totalCount++;
    console.log(`\n[Test ${i + 1}/${testCases.length}] (${tc.lang}) "${tc.question}"`);

    const start = Date.now();
    let answer;
    try {
      answer = await AgronomistRagService.consult({
        question: tc.question,
        farmerId: 1,
        language: tc.lang,
        history: []
      });
    } catch (err) {
      console.error(`❌ ERROR calling agronomist: ${err.message}`);
      continue;
    }
    const elapsed = Date.now() - start;
    timings.push(elapsed);

    const words = calculateVisibleWords(answer);
    const hasMd = hasMarkdownSymbols(answer);
    const intentMatches = answer.intent === tc.expectedIntent;
    const underLimit = words <= 280;
    const specificCheck = tc.check(answer);

    const testPassed = intentMatches && underLimit && !hasMd && specificCheck.passed;
    if (testPassed) passedCount++;

    console.log(`   ⏱️ Duration: ${elapsed}ms | Words: ${words} (medium limit 280) | Markdown: ${hasMd ? 'DETECTED ❌' : 'Clean ✅'}`);
    console.log(`   🏷️ Intent: ${answer.intent} (expected: ${tc.expectedIntent}) -> ${intentMatches ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`   📋 Headline: "${answer.headline}"`);
    console.log(`   🔍 Check: ${specificCheck.passed ? '✅' : '❌'} (${specificCheck.details})`);
    console.log(`   📢 Spoken: "${(answer.speakText || '').slice(0, 80)}..."`);
    console.log(`   Result: ${testPassed ? '✅ PASS' : '❌ FAIL'}`);
  }

  timings.sort((a, b) => a - b);
  const medianTime = timings.length ? timings[Math.floor(timings.length / 2)] : 0;
  const avgTime = timings.length ? Math.round(timings.reduce((a, b) => a + b, 0) / timings.length) : 0;

  console.log('\n================================================================');
  console.log('📊 TEST SUMMARY');
  console.log(`Total tests: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}`);
  console.log(`Median response time: ${medianTime}ms | Average response time: ${avgTime}ms`);
  console.log(`Min: ${timings[0]}ms | Max: ${timings[timings.length - 1]}ms`);
  console.log('================================================================');

  if (passedCount !== totalCount) {
    process.exit(1);
  } else {
    console.log('🎉 ALL AGRONOMIST QUALITY CRITERIA MET WITH REAL GEMINI RESPONSES!\n');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
