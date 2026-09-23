# System Architecture & Technical Specification
## Smart Farmer Assistance System (SFAS)

**Version:** 1.0.0  
**Authors:** Yash Bawane, Rohit Kundu, Manthan Takerkhede  

---

## 1. High-Level Architecture Overview

SFAS is designed using a decoupled client-server architecture with an emphasis on local edge intelligence and offline resilience:

```mermaid
flowchart TB
    subgraph Client ["Client Layer (Responsive PWA / SPA)"]
        UI["User Interface (HTML/CSS/JS + Vite + React)"]
        SW["Service Worker (Asset Cache & API Fallbacks)"]
        IDB[("IndexedDB (Offline Scans & Farm Context)")]
        EdgeAI["In-Browser Edge AI Disease Engine (TF.js / Heuristic Feature Extractor)"]
        VoiceIO["Web Speech STT & SpeechSynthesis TTS"]
    end

    subgraph API ["Application Server (Node.js / Express)"]
        Router["Express REST API Router (/api/*)"]
        AuthMid["JWT & Rate Limiting Middleware"]
        
        subgraph Services ["Modular Service Layer"]
            FarmSvc["Farmer & Farm Context Service"]
            CropSvc["Crop Recommendation Engine"]
            RoiSvc["Dynamic ROI & Risk Engine"]
            DiseaseSvc["Disease Knowledge & Diagnostic Service"]
            MandiSvc["Smart Mandi & Net Realization Service"]
            PoolSvc["Logistics Transport Pooling Service"]
            WeatherSvc["Weather & Agro-Risk Rule Engine"]
            RagSvc["AI Agronomist Contextual RAG Engine"]
            SchemeSvc["Government Schemes Directory"]
        end
    end

    subgraph Data ["Data & Model Layer"]
        DB[("Relational Database (PostgreSQL / SQLite Storage Engine)")]
        KB[("Agricultural Agronomic Knowledge Base")]
        AgriAPIs["External Mandi & Weather Data Adapters"]
    end

    UI <--> SW
    SW <--> IDB
    UI <--> EdgeAI
    UI <--> VoiceIO
    UI <===>|HTTPS / REST API| Router
    Router --> AuthMid --> Services
    Services <--> DB
    Services <--> KB
    Services <--> AgriAPIs
```

---

## 2. Frontend Architecture

### 2.1 Technology & Design Framework
- **Core:** Modern React (Vite-powered) with pure standard HTML5 semantic architecture and custom Vanilla CSS.
- **Styling Architecture:** Tailored CSS custom properties (`variables.css`), high-contrast color tokens, fluid typography using `clamp()`, and scoped component styling (`components.css`).
- **Typography:** Google Fonts pairing:
  - Editorial Serifs: `Fraunces` / `Newsreader` for impactful headings and storytelling.
  - Functional Sans: `Manrope` / `Source Sans 3` for forms, touch targets, and financial data grids.
- **Color Palette (Earth & Crop Editorial):**
  - Canvas: Warm Cream (`#FDFBF7`), Surface Light (`#F7F4EE`), Card Border (`#E7E2D6`).
  - Primary: Deep Forest Green (`#1B382B`), Dark Olive (`#2D4A3E`).
  - Accent / Risk: Wheat Gold (`#D4A373`), Leaf Green (`#4A7C59`), Terracotta Red (`#C85A32`).
  - Text: Earth Charcoal (`#1F2421`), Muted Earth (`#5A645D`).

### 2.2 Component Hierarchy
```
src/
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx           # Editorial desktop header with status badges
│   │   ├── MobileNav.jsx        # Thumb-friendly bottom navigation bar
│   │   └── Footer.jsx           # Institutional & team footer
│   ├── common/
│   │   ├── OfflineBadge.jsx     # Network state indicator with sync status
│   │   ├── LanguageSwitcher.jsx # One-click regional language toggle
│   │   ├── AudioSpeaker.jsx     # Read-aloud button for accessibility
│   │   └── NotificationToast.jsx# Contextual feedback alerts
│   ├── decision/
│   │   ├── GuidedOptionPicker.jsx # Visual touch cards for soil, water, stage
│   │   ├── RoiComparisonCard.jsx  # Multi-variable ROI & risk breakdown
│   │   └── CropCard.jsx           # Crop season and agronomic badge
│   ├── protection/
│   │   ├── DiseaseScanModal.jsx   # Camera capture, preview & analysis
│   │   ├── DiseaseResultCard.jsx  # Severity, confidence, biological/chemical Rx
│   │   └── PreventativeAlertCard.jsx # Humidity/rain rule-driven warnings
│   ├── market/
│   │   ├── MandiNetRealizationCard.jsx # Price minus transport math visualizer
│   │   ├── PriceTrendChart.jsx         # 7-day modal price curve
│   │   └── TransportPoolModal.jsx      # Nearby farmer pooling calculator
│   └── agronomist/
│       ├── VoiceMicButton.jsx     # Big ripple microphone with STT listener
│       └── ChatMessageStream.jsx  # RAG-grounded agronomist dialogue
```

---

## 3. Backend Architecture

The backend is built with Express following a strict **Controller-Service-Model** pattern to ensure testability and separation of concerns:

```
server/
├── config/
│   └── database.js          # Unified DB connector (SQLite for local zero-config / Postgres compatible)
├── controllers/
│   ├── authController.js    # Register, login, profile management
│   ├── cropController.js    # Recommendation & ROI calculation
│   ├── diseaseController.js # Disease image validation & diagnostic advice
│   ├── mandiController.js   # APMC rates & transport net realization
│   ├── alertController.js   # Agro-meteorological risk evaluation
│   └── agronomistController.js # Multilingual RAG conversational pipeline
├── services/
│   ├── cropAdvisorService.js
│   ├── roiCalculatorService.js
│   ├── diseaseDetectionService.js
│   ├── smartMandiService.js
│   ├── weatherService.js
│   ├── alertRuleEngine.js
│   ├── agronomistRagService.js
│   └── governmentSchemeService.js
├── models/
│   ├── schema.sql           # Canonical relational SQL schema
│   ├── db.js                # Database abstraction methods
│   └── seedData.js          # Authentic Indian agricultural data
├── middleware/
│   ├── authMiddleware.js    # JWT token verification
│   ├── rateLimiter.js       # Abuse prevention
│   └── errorHandler.js      # Graceful HTTP error responses
└── index.js                 # Server bootstrapping
```

---

## 4. Relational Database Schema

```mermaid
erDiagram
    USERS ||--o{ FARMER_PROFILES : has
    FARMER_PROFILES ||--o{ FARMS : manages
    FARMS ||--o{ CROPS : grows
    FARMS ||--o{ DISEASE_SCANS : records
    FARMS ||--o{ ROI_ANALYSES : evaluates
    FARMS ||--o{ ALERTS : receives
    CROPS ||--o{ MANDI_PRICES : trades_as
    MANDIS ||--o{ MANDI_PRICES : lists
    MANDIS ||--o{ TRANSPORT_POOLS : destinations
    FARMER_PROFILES ||--o{ TRANSPORT_POOLS : joins

    USERS {
        int id PK
        string email
        string password_hash
        string full_name
        string role
        datetime created_at
    }

    FARMER_PROFILES {
        int id PK
        int user_id FK
        string phone
        string district
        string state
        string language_pref
        string farmer_type
    }

    FARMS {
        int id PK
        int farmer_profile_id FK
        string farm_name
        float land_size_acres
        string soil_type
        string water_source
        string water_reliability
    }

    CROPS {
        int id PK
        string name
        string scientific_name
        string season
        int duration_days
        float water_req_mm
        string ideal_soil
    }

    MANDIS {
        int id PK
        string name
        string district
        string state
        float distance_km
        float base_transport_cost
    }

    MANDI_PRICES {
        int id PK
        int mandi_id FK
        int crop_id FK
        float modal_price_quintal
        float min_price_quintal
        float max_price_quintal
        date price_date
    }

    TRANSPORT_POOLS {
        int id PK
        int mandi_id FK
        int crop_id FK
        date scheduled_date
        float total_produce_quintal
        float individual_cost_per_q
        float pooled_cost_per_q
        string vehicle_type
        string status
    }
```

---

## 5. AI & Edge AI Architecture

### 5.1 Offline Edge AI Disease Detection
1. **Camera / Upload Pipeline:** Farmers capture leaf lesions directly in the field.
2. **Client-side Feature Extraction & Inference:** A browser-based inference runner analyzes visual indicators (color distribution, lesion edge morphology, necrosis patterns).
3. **Graceful Degradation:** When offline, inference executes entirely on device without cloud roundtrips. Diagnostic reports and leaf image signatures are stored in `IndexedDB`.
4. **Cloud Synchronization:** When connectivity resumes, the Service Worker triggers an asynchronous background sync to log the incidence report to the central epidemiological registry.

### 5.2 RAG (Retrieval-Augmented Generation) Agronomist Pipeline
```mermaid
sequenceDiagram
    autonumber
    actor Farmer
    participant UI as Client (Audio / Text)
    participant Server as Express Agronomist Svc
    participant Context as Farm Context Store
    participant KB as Agronomy Knowledge Base
    participant AI as LLM / Agronomist Agent

    Farmer->>UI: Speaks query: "My tomato leaves are curling and have yellow spots"
    UI->>UI: Web Speech API converts voice to text
    UI->>Server: POST /api/agronomist/ask {query, farmId, lang}
    Server->>Context: Retrieve farm context (Crop: Tomato, Stage: Flowering, Soil: Black, Rain: 12mm)
    Server->>KB: Semantic lookup (Tomato leaf curl vs. early blight vs. nutrient deficiency)
    KB-->>Server: Agronomic reference documents & recommended sprays
    Server->>AI: Synthesize augmented prompt (Farmer context + Agronomic facts + User query)
    AI-->>Server: Structured response (Root cause, cultural remedy, chemical treatment, precaution)
    Server-->>UI: Localized response JSON
    UI->>UI: SpeechSynthesis reads out answer in Marathi / Hindi / English
    UI-->>Farmer: Displays structured card with visual action steps
```

---

## 6. Offline PWA & Data Synchronization

- **Service Worker (`sw.js`):** Intercepts fetch requests, serves precached static assets via a **Cache-First** strategy, and wraps API queries in a **Network-First with Offline Fallback** strategy.
- **IndexedDB Store:**
  - `offlineScans`: Unsynced disease images, preliminary results, and timestamps.
  - `cachedFarmProfile`: Active farm acreage, soil, and active crops.
  - `cachedPrices`: Last synced APMC price tables.
- **Liveness Monitor:** The `OfflineBadge` component listens to `navigator.onLine`, `window.online`, and `window.offline` events, updating UI feedback instantaneously.
