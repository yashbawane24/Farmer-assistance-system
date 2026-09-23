# Product Requirements Document (PRD)
## Smart Farmer Assistance System (SFAS)

**Document Version:** 1.0.0  
**Project Category:** University Software Usability & Agricultural Application System  
**Core Project Team:** Yash Bawane, Rohit Kundu, Manthan Takerkhede  
**Status:** Active Development  

---

## 1. Executive Summary & Vision

The **Smart Farmer Assistance System (SFAS)** is an AI-powered, multilingual, and offline-capable agricultural decision-support platform built with a singular design tenet: **"Usability for Farmers First"**. 

Traditional agricultural systems fail Indian smallholder and marginal farmers because they overload users with complex agronomic spreadsheets, raw uninterpreted weather metrics, or generic English chatbot interfaces. SFAS reverses this model through a guiding philosophy:

> **"Don't just give farmers information. Turn information into decisions."**

SFAS accompanies the farmer across the three critical milestones of every agricultural season:
1. **DECIDE — What should I grow?** Dynamic crop recommendation, soil/water guided matching, dynamic multi-variable ROI calculation, and transparent financial/market risk modeling.
2. **PROTECT — How do I protect my crop?** Offline-capable Edge AI crop disease detection, preventative weather-and-pest early warnings, and actionable biological/chemical treatment advisories.
3. **SELL — Where and how should I sell it profitably?** Smart APMC Mandi comparison with transport-adjusted net realization and collaborative farmer transport pooling.

---

## 2. Problem Statement & Usability Challenges

### 2.1 The Rural Farming Dilemma
Indian agriculture supports over 140 million farm operating families, of which 86% are small and marginal farmers (operating less than 2 hectares). These farmers face severe structural vulnerabilities:
- **Financial Uncertainty:** Farmers invest hard-earned savings into seed, fertilizer, and labor without visibility into market volatility, leading to debt cycles.
- **Cognitive & Literacy Hurdles:** Agricultural portals require high digital literacy, complex parameter inputs (e.g., nitrogen parts per million, soil pH fractions), and fluent English reading.
- **Intermittent Connectivity:** Rural cellular networks are notoriously patchy in fields, rendering cloud-only apps useless during real-world crop inspections.
- **The "High Price" Trap:** Farmers travel long distances to distant mandis boasting high quoted prices, only to discover that transport fees, loading charges, and middlemen commissions evaporate their net profit.

### 2.2 Core Usability Gaps Solved by SFAS
| Traditional Approach | The SFAS Usability Innovation | Usability Principle |
| :--- | :--- | :--- |
| Text-heavy parameter forms (pH, NPK numbers) | Guided visual selection cards (Soil type, water reliability, crop stage) | Recognition over recall; reduced cognitive load |
| Raw weather forecasts (e.g., "78% humidity, 14mm rain") | Actionable preventative farm alerts ("High fungal risk for flowering tomato: check drainage today") | Visibility of system status; actionable intelligence |
| English text chatbot | AI Voice Agronomist in regional languages (Hindi, Marathi, English) with voice input and audio readout | Voice accessibility; low-literacy inclusion |
| Cloud-dependent image classification | Offline-capable Edge AI disease scanner with local processing and sync queues | Graceful degradation; resilience in remote environments |
| Raw mandi price listings | Transport-adjusted Net Realization comparison and nearby farmer pooling | Decision automation; direct financial empowerment |

---

## 3. Target User Personas

### Persona 1: Ramesh Patil (Smallholder Farmer)
- **Profile:** 48 years old, Nashik district, Maharashtra. Owns 2.2 acres. Cultivates Tomato and Onion.
- **Technology Profile:** Budget Android smartphone (4G with sporadic connectivity in fields), reads Marathi comfortably, prefers voice interactions, low patience for dense forms.
- **Primary Goals:** Wants to know if disease is attacking his tomato leaves immediately; wants to know whether to sell in Nashik APMC or transport produce to Vashi (Mumbai) APMC.
- **Key Pain Point:** Lost 40% of his crop last year because he sprayed fungicide three days too late after heavy unseasonal rain.

### Persona 2: Rajesh Sharma (Progressive / Commercial Farmer)
- **Profile:** 34 years old, Karnal district, Haryana. Owns 9.5 acres. Cultivates Wheat, Paddy, and Mustard.
- **Technology Profile:** Comfortable with smartphones, compares crop economics, looks for high ROI and government subsidy integration.
- **Primary Goals:** Maximizing net realization per quintal, mitigating fertilizer input cost spikes, finding nearby farmers to share a 10-ton transport truck.

### Persona 3: Farmer Producer Organization (FPO) Extension Worker / NGO
- **Profile:** 29 years old, field agronomist guiding 80+ farmers across a block.
- **Primary Goals:** Recommending suitable crop diversification based on season, advising smallholders on government scheme eligibility (PM-KISAN, PMFBY, Soil Health Card).

---

## 4. System Requirements & Functional Scope

### Module 1: Farmer & Farm Profile Context
- User registration and login (with one-click Demo Profiles for academic usability evaluation: "Ramesh Patil - Nashik" and "Rajesh Sharma - Karnal").
- Farm plot registration: location (state/district), land acreage, primary soil type, irrigation source/reliability, current crop, planting date, and current growth stage.
- System-wide context awareness: Every module (Dashboard, Weather, Scans, Mandi, Agronomist) automatically reads active farm context.

### Module 2: Farmer Dashboard ("How is My Farm Today?")
- Warm, human greeting with current location and crop stage progress bar.
- Today's Farm Status widget (temperature, humidity, precipitation probability, agro-impact summary).
- Active Crop Health status badge and preventative risk alert indicator.
- Today's Mandi snapshot with best estimated net realization.
- Quick-action buttons with large touch targets (min 48px).

### Module 3: Guided Crop Advisor & Dynamic ROI Calculator
- 5-step guided wizard (Land size → District → Soil type → Water reliability → Budget).
- Automated agronomic matching against crop requirements and season (Kharif, Rabi, Zaid).
- Dynamic ROI engine:
  - Input breakdown: seed, fertilizer, irrigation, pest control, labor costs.
  - Yield projection and gross revenue estimation based on historical/market benchmarks.
  - Net profit calculation and Projected Return on Investment (ROI %).
  - Multi-dimensional risk score: Market price volatility risk, Water requirement risk, Input cost vulnerability.
  - Side-by-side comparison of candidate crops.

### Module 4: Offline Edge AI Crop Disease Scanner
- Camera capture or gallery image upload for diseased crop leaves (Tomato, Rice, Wheat, Cotton, Potato, Chilli).
- Edge inference engine architecture with client-side feature detection and offline service worker queue.
- Diagnostic output:
  - Identified disease name & confidence percentage (e.g., Tomato Early Blight — 88% confidence).
  - Risk severity badge (Low / Moderate / Severe).
  - Step-by-step immediate action plan (cultural & mechanical controls).
  - Biological treatment alternatives and recommended chemical fungicides.
  - Long-term preventative measures.
- Offline state resilience: If disconnected, scans are processed locally or queued in IndexedDB with an "AI running on device / Queued for sync" indicator.

### Module 5: Smart Mandi & Transport Pooling
- Real-time comparison of APMC Mandis (e.g., Lasalgaon, Nashik, Pune, Vashi, Azadpur).
- Dynamic Net Realization formula:
  $$\text{Net Realization} = (\text{Mandi Modal Price} \times \text{Produce Quantity}) - (\text{Distance} \times \text{Transport Rate}) - \text{Loading/Mandi Fees}$$
- Visual highlighting of "Best Net Realization" (preventing the fallacy of selecting distant high-gross markets that yield lower take-home profit).
- Price trend indicator (7-day price direction).
- Community Transport Pooling ("Nearby Farmer Pool"):
  - Displays nearby farmers harvesting the same crop in the same week.
  - Calculates shared logistics cost versus individual vehicle hire.
  - Interactive "Join Transport Pool" action.

### Module 6: AI Voice Agronomist (RAG Architecture)
- Visual microphone button with active listening waveform animation.
- Speech-to-Text (Web Speech Recognition API) + Text-to-Speech audio response playback (Web SpeechSynthesis).
- Multilingual interaction support (English, Hindi, Marathi).
- RAG (Retrieval-Augmented Generation) farm context injection: Query is augmented with current soil, crop, stage, weather forecast, and active alerts before generating localized agronomist guidance.

### Module 7: Preventative Weather & Pest Alerts
- Structured agro-meteorological rule engine evaluating temperature, humidity (>80%), precipitation forecasts, and crop phenological stage.
- Translates weather conditions into direct field action:
  - E.g., High humidity + rain during flowering = High fungal blast/blight risk → recommendation to postpone irrigation, clear furrows, and apply preventative bio-spray.
- Severity levels: Critical Warning, Advisory, Normal.

### Module 8: Government Scheme Discovery
- Curated database of central and state agricultural schemes (PM-KISAN, PMFBY Crop Insurance, Soil Health Card Scheme, PM Krishi Sinchayee Yojana, Sub-Mission on Agricultural Mechanization).
- Filterable by crop, farm size (Marginal / Small / Medium), and state.
- Step-by-step application walkthroughs and document checklists.

---

## 5. Non-Functional Requirements & Usability Metrics

1. **Accessibility (WCAG 2.1 Level AA):**
   - High color contrast ratio (minimum 4.5:1 for normal text, 7:1 for headers).
   - Touch targets minimum 48px by 48px with 8px spacing.
   - Screen-reader friendly semantic markup (`<main>`, `<article>`, `<dialog>`, `aria-live`, `aria-expanded`).
2. **Performance:**
   - First Contentful Paint (FCP) < 1.5s on 4G networks.
   - Largest Contentful Paint (LCP) < 2.5s.
   - Cumulative Layout Shift (CLS) < 0.1.
3. **Offline Resilience:**
   - Core app shell, cached farm profile, recent advisories, and scan history accessible without active internet connection.
4. **Security:**
   - Zero hardcoded credentials or API keys in client-side code.
   - Secure environment variable management with `.env.example`.
   - Sanitized user inputs preventing XSS and SQL injection.

---

## 6. Success & Evaluation Criteria
- **Task Completion Rate:** A first-time user can complete a crop ROI calculation and disease leaf scan in under 90 seconds without external instruction.
- **Decision Clarity:** 100% of tested users understand why Mandi B was recommended over Mandi A when transport costs are calculated.
- **Academic Rigor:** Clean separation of concerns, complete documentation, modular code, and verifiable test coverage.
