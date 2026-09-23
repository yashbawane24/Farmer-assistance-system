# Engineering, Security & Usability Rules
## Smart Farmer Assistance System (SFAS)

**Project Team:** Yash Bawane, Rohit Kundu, Manthan Takerkhede  
**Standards Version:** 1.0.0  

---

## 1. Usability & Farmer-First UX Rules

1. **Recognition Over Recall:**
   - Never require farmers to memorize technical agronomic parameters (such as soil electrical conductivity or nitrogen fractions).
   - Present guided visual touch cards for soil types (Black Cotton, Red Loam, Alluvial, Laterite) and water reliability.
2. **Low Cognitive Load & Progressive Disclosure:**
   - Keep screen density low. Never present a wall of numbers or generic analytics graphs.
   - Use multi-step step-by-step guided flows with back buttons, progress dots, and prominent confirm buttons.
3. **Touch Target Size:**
   - All interactive touch targets (buttons, choice chips, selection cards) must be at least **48px by 48px** with at least 8px spacing between clickable elements.
4. **Voice & Audio Inclusion:**
   - Provide an audio readout option (`AudioSpeaker`) on all major analytical outputs (crop recommendations, disease treatment advice, weather alerts).
   - Ensure the AI voice agronomist allows voice recording without requiring manual keyboard typing.
5. **No Color-Only Information:**
   - Never communicate risk solely through color. Every risk indicator must combine an icon, descriptive text label, and color (e.g., Warning triangle + "High Fungal Risk" + Terracotta hue).

---

## 2. Integrity & Authenticity Rules

1. **No Fake Claims & No Guaranteed Predictions:**
   - Agricultural financial calculations are subject to market and climate volatility.
   - All financial projections must be explicitly qualified with labels such as **"Estimated"**, **"Projected"**, and **"Based on historical and current APMC trends"**. Never guarantee financial returns.
2. **No Fake AI or Black-Box Mockery:**
   - Edge AI disease detection architecture must clearly disclose its status.
   - The disease detection engine will clearly identify its diagnostic confidence level, whether inference ran locally on-device or via server, and indicate when demo baseline data is utilized.
3. **Accurate Agricultural Context:**
   - Agricultural data (seed costs, gestation duration, APMC mandi names like Lasalgaon or Azadpur, rupee calculations) must reflect authentic Indian agronomic realities.

---

## 3. Engineering & Code Quality Rules

1. **No Unnecessary Dependencies:**
   - Do not install heavy charting libraries or bloated CSS frameworks.
   - Use pure modern Vanilla CSS with CSS custom properties and lightweight SVG/canvas charts.
2. **Component Modularity:**
   - Every reusable UI component must be self-contained, accept explicit props, have default fallbacks, and manage loading, empty, and error states gracefully.
3. **Directory Separation:**
   - Client code stays strictly inside `/client`.
   - Server code stays strictly inside `/server`.
   - Documentation stays strictly inside `/docs`.
4. **Naming Conventions:**
   - React components: `PascalCase.jsx` (e.g., `MandiNetRealizationCard.jsx`).
   - Hooks & utils: `camelCase.js` (e.g., `useOfflineStatus.js`, `currencyFormatter.js`).
   - CSS variables: `--color-primary-green`, `--font-editorial`, `--space-md`.
   - Database tables: Plural lowercase with underscores (e.g., `farmer_profiles`, `disease_scans`).

---

## 4. API & Backend Rules

1. **Service Layer Isolation:**
   - Controllers must strictly parse requests and invoke services.
   - Route files (`/server/routes/*.js`) must never contain inline business logic or raw SQL queries.
2. **Consistent Response Envelope:**
   - All API endpoints must return a uniform JSON format:
     ```json
     {
       "success": true,
       "data": { ... },
       "meta": { "timestamp": "...", "source": "local_db" }
     }
     ```
   - Errors must return:
     ```json
     {
       "success": false,
       "error": {
         "code": "VALIDATION_ERROR",
         "message": "Human-friendly explanation"
       }
     }
     ```
3. **Graceful Fallbacks:**
   - If external weather or mandi price APIs time out or fail, fall back seamlessly to cached or seeded baseline data without crashing the server.

---

## 5. Security Rules

1. **No Hardcoded Credentials:**
   - Never commit API secrets, database passwords, or private tokens to the repository.
   - Use `.env` locally (ignored in `.gitignore`) and provide an exhaustive `.env.example`.
2. **Safe Input Validation:**
   - Validate and sanitize all incoming parameters on the server side before querying the database or calculating formulas.
   - File uploads for disease detection must be strictly restricted to image types (`image/jpeg`, `image/png`, `image/webp`) with a maximum payload limit (e.g., 5MB).
3. **No Frontend Secrets:**
   - The browser client must never possess administrative database keys or backend private keys.

---

## 6. Accessibility & Performance Rules

1. **WCAG 2.1 Level AA Compliance:**
   - Contrast ratio must meet or exceed 4.5:1 for standard text and 3:1 for large display headers.
   - Full keyboard navigability (`Tab`, `Shift+Tab`, `Enter`, `Escape` for modals).
2. **Core Web Vitals:**
   - Responsive layouts must not cause horizontal scrolling on mobile viewports down to 320px width.
   - Cumulative Layout Shift (CLS) must remain under 0.1 through fixed-dimension image placeholders.
