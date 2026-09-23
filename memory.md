# Project Memory & Persistent Architectural Context
## Smart Farmer Assistance System (SFAS)

**Last Updated:** 2026-09-21  
**Project Leads & Core Team:** Yash Bawane, Rohit Kundu, Manthan Takerkhede  
**Academic Context:** University Software Usability / Application Capstone Project  
**Status:** ALL PHASES IMPLEMENTED & RUNNING LIVE  

---

## 1. Project Vision & Guiding Philosophy

The **Smart Farmer Assistance System (SFAS)** is an AI-powered, multilingual, and offline-capable agricultural decision-support web application.

- **Core Mantra:** *"Don't just give farmers information. Turn information into decisions."*
- **Primary Audience:** Smallholder & marginal farmers in India (operating < 2 hectares), rural progressive farmers, and FPO extension workers.
- **Three-Stage Farmer Cycle:**
  1. **DECIDE:** Dynamic crop recommendation, guided soil/water wizards, dynamic multi-variable ROI calculation, transparent risk estimation.
  2. **PROTECT:** Offline-capable Edge AI disease detection, preventative weather/pest rule-based alerts, biological & chemical remedy advisories.
  3. **SELL:** Smart Mandi comparison adjusted for transport freight, net realization optimization, and community logistics pooling.

---

## 2. Completed Architecture & Deliverables

1. **Mandatory Documentation:**
   - [docs/prd.md](file:///Users/yash/smart%20farmer%20assistance%20project%29/docs/prd.md) — Product Requirements Document
   - [docs/architecture.md](file:///Users/yash/smart%20farmer%20assistance%20project%29/docs/architecture.md) — System, AI, and Database Architecture
   - [docs/rules.md](file:///Users/yash/smart%20farmer%20assistance%20project%29/docs/rules.md) — Usability, Security, and Code Quality Rules
   - [docs/design.md](file:///Users/yash/smart%20farmer%20assistance%20project%29/docs/design.md) — Agricultural Editorial Design System
   - [docs/tasks.md](file:///Users/yash/smart%20farmer%20assistance%20project%29/docs/tasks.md) — Phase-by-Phase Roadmap
   - [memory.md](file:///Users/yash/smart%20farmer%20assistance%20project%29/memory.md) — Persistent Context Store

2. **Backend Server (`/server`):**
   - Express REST API (`/api/*`) running at `http://localhost:5001`.
   - Relational Database Layer powered by `sql.js` (pure WASM SQLite, ANSI SQL compliant DDL) with persistence in `/server/data/sfas.sqlite`.
   - Auto-seeded with authentic Indian APMC markets (Lasalgaon, Nashik, Pune, Vashi, Azadpur), crop agronomics, authentic freight rates, and central/state schemes.
   - Comprehensive service layer: Auth, Farmer Context, Crop Advisor, Dynamic ROI, Disease Detection, Smart Mandi, Logistics Pooling, Weather, Agro-Risk Rule Engine, AI Agronomist RAG, and Government Schemes.

3. **Frontend Web App (`/client`):**
   - Single Page Responsive Web Application built with modern React & Vite, running at `http://localhost:3000`.
   - Custom Vanilla CSS design tokens (`variables.css`, `global.css`, `components.css`).
   - Editorial Typography: Google Fonts `Newsreader` / `Fraunces` (serif) paired with `Manrope` (sans).
   - Warm cream `#FDFBF7` canvas, deep forest green `#1B382B`, leaf green `#386641`, harvest wheat `#D4A373`, and terracotta `#BC4749`.
   - 10 Complete User Experiences:
     - **Landing Page:** Hero with agricultural photography, 3-stage journey, 4 core value pillars, How It Works, Usability Formula, and Team section.
     - **Farmer Dashboard:** "How is my farm today?" header, growth stage tracker, weather status, active crop health badge, today's urgent alert banner with audio readout, and large 48px touch quick-action buttons.
     - **Guided Crop Advisor & Dynamic ROI:** 4-step wizard (Land, Soil, Water, Budget, Season) with side-by-side candidate crop matching, itemized cost breakdown, projected revenue, net profit, ROI %, and multi-variable risk analysis.
     - **Offline Edge AI Disease Scanner:** In-browser image canvas scanner, confidence score, lesion morphology breakdown, immediate cultural steps, biological remedies (Trichoderma), and chemical fungicides.
     - **Smart Mandi & Transport Pooling:** Comparison of APMC markets with transport deduction calculations showing true take-home net realization, 7-day price curve, and interactive nearby farmer transport pooling.
     - **AI Voice Agronomist:** Big microphone button, Web Speech API speech-to-text, SpeechSynthesis audio narration, RAG farm context grounding, and multilingual support (English, Hindi, Marathi).
     - **Weather Intelligence & Alerts:** 5-day agro-weather forecast with "What this means for your farm" advice and rule-driven early warnings.
     - **Government Schemes:** Filterable database of central/state schemes with eligibility criteria, application steps, document checklists, and official portal links.
     - **My Farm:** Dynamic farm context manager and demo persona switcher (Ramesh Patil - Nashik Tomato / Rajesh Sharma - Karnal Wheat).
     - **Technology & Usability:** Academic evaluation page detailing the *Problem → UX Decision → Feature → Benefit* matrix.
   - **Offline PWA Engine:** Service Worker (`sw.js`), Web App Manifest (`manifest.json`), and IndexedDB (`offlineStorage.js`).
   - **UX Audit & Anti-SaaS Grounding:**
     - Removed artificial SaaS cliches (circular SVG donuts, blurred image-overlay pill buttons, micro-hourly sliders).
     - Added Top Priority Actionable Farm Advisory ("आजचे शेती नियोजन व सल्ला") with one-tap audio playback.
     - 3 large, sturdy 48px minimum touch-target action cards (Disease Scan, Crop Advisor, Mandi Comparison).
     - 1-tap quick acre presets (1, 2, 3, 5, 10 acres) and quintal presets (10, 25, 50, 100 q) for minimal mobile typing.
     - Triple-coded multi-sensory risk levels (distinct SVG icons + explicit regional text labels + solid borders).
     - Standardized financial math to plain arithmetic (`Gross - Expense = Real Net Profit`).
     - Highlighted explicit take-home cash advantage in Mandi comparisons (`₹X more cash in hand`).

---

## 3. Team Attribution
- **Yash Bawane:** Lead Product Designer & Frontend Architecture
- **Rohit Kundu:** Lead Backend Engineer & Data Modeling
- **Manthan Takerkhede:** AI Systems Engineer & Usability Researcher
