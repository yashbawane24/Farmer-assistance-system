# Visual Design System & Component Guidelines
## Smart Farmer Assistance System (SFAS)

**Version:** 1.0.0  
**Design Philosophy:** Human-Centered Agricultural Editorial Design  
**Lead Designers & Engineers:** Yash Bawane, Rohit Kundu, Manthan Takerkhede  

---

## 1. Design Philosophy

SFAS intentionally breaks away from sterile corporate SaaS dashboards, glowing futuristic AI blobs, and generic blue fintech templates. Instead, the design draws inspiration from **agricultural editorial journals, high-grade farm-direct marketplaces, and tactile field equipment**:

- **Warm & Grounded:** A creamy, tactile paper-like background that is easy on the eyes under bright outdoor sunlight.
- **Deep Botanical Greens:** Rooted in mature crops, forest canopy, and fertile soil.
- **Editorial Typography:** Elegant, authoritative serifs for main headings that convey trust and permanence, balanced with crystal-clear sans-serifs for numerical and agricultural data.
- **Usability First:** Large clickable zones, generous whitespace, visual cards instead of complex form fields, and instant multilingual voice readouts.

---

## 2. Color Palette & Design Tokens

### 2.1 Color Tokens
```css
:root {
  /* Canvas & Backgrounds */
  --color-canvas-cream: #FDFBF7;       /* Primary background: warm cream */
  --color-canvas-surface: #F6F2EA;     /* Card & section background */
  --color-canvas-subtle: #ECE6DA;      /* Input fields, separators */
  --color-canvas-elevated: #FFFFFF;    /* Modal & floating popover surface */

  /* Primary Earth & Forest Tones */
  --color-primary-forest: #1B382B;     /* Deep forest green: headings, main CTAs */
  --color-primary-olive: #2D4A3E;      /* Secondary dark green: badges, nav */
  --color-earth-brown: #5C4033;        /* Warm soil brown: secondary accents */

  /* Accents & Functional Indicators */
  --color-accent-wheat: #D4A373;       /* Muted golden harvest: highlights */
  --color-accent-gold: #E9C46A;        /* Warm amber: moderate risk / advisory */
  --color-leaf-green: #386641;         /* Positive ROI, healthy crop, success */
  --color-terracotta: #BC4749;         /* High risk, disease warning, alert */

  /* Typography Colors */
  --color-text-main: #1C2420;          /* Deep rich charcoal */
  --color-text-muted: #57625B;         /* Secondary descriptive labels */
  --color-text-inverse: #FDFBF7;       /* Text on dark forest green */
  --color-border-subtle: #E2DBD0;      /* Card & input borders */
  --color-border-strong: #C4BAAB;
}
```

---

## 3. Typography Hierarchy

### 3.1 Font Families
- **Editorial Headings:** `Newsreader`, `Fraunces`, `Georgia`, serif.
- **Functional UI & Data:** `Manrope`, `Source Sans 3`, system-ui, sans-serif.

### 3.2 Type Scale
| Level | Font Family | Size (Mobile → Desktop) | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Display Hero | Newsreader | 32px → 48px | 600 | 1.15 | Landing Page Hero Headline |
| H1 Section | Newsreader | 26px → 36px | 600 | 1.25 | Page Titles & Major Journeys |
| H2 Subhead | Newsreader | 20px → 26px | 600 | 1.30 | Section Headings & Card Titles |
| H3 Feature | Manrope | 17px → 20px | 600 | 1.35 | Widget & Metric Headers |
| Body Main | Manrope | 15px → 16px | 400 | 1.55 | Explanations, advisories |
| UI Small | Manrope | 13px → 14px | 500 | 1.40 | Form labels, tags, captions |
| Data Large | Manrope | 22px → 28px | 700 | 1.10 | Prices (₹), Yields, ROI % |

---

## 4. Spacing, Grid & Layout

- **Spacing Scale:** 4px (`--space-2xs`), 8px (`--space-xs`), 12px (`--space-sm`), 16px (`--space-md`), 24px (`--space-lg`), 32px (`--space-xl`), 48px (`--space-2xl`), 64px (`--space-3xl`).
- **Container Max Width:** 1200px for editorial reading and dashboards; 840px for guided wizards.
- **Grid Layouts:**
  - Mobile (<768px): Single column, full-width cards with horizontal scroll for overflow chips.
  - Tablet (768px – 1024px): 2-column asymmetric grid.
  - Desktop (>1024px): 3-column / 12-column responsive layout with sticky context summaries.

---

## 5. Components Specification

### 5.1 Buttons & Touch Targets
- Minimum touch size: **48px height**, 16px horizontal padding.
- **Primary Button:** Deep forest green background (`--color-primary-forest`), cream text (`#FDFBF7`), subtle border, 10px rounded corners. Smooth hover elevation with zero neon glow.
- **Secondary Button:** Cream background, deep olive border (1.5px), deep olive text.
- **Voice Mic Action:** Circular button (64px x 64px) with leaf green ring, pulse wave animation during recording, accessible label.

### 5.2 Guided Selection Cards (Soil, Water, Crop Stages)
- Visual cards with intuitive SVG icons and clear bilingual text.
- Large active indicator (border changes to 2px deep forest green with a checkmark badge).
- Eliminates manual typing for non-technical farmers.

### 5.3 Data Visualization & Cards
- **ROI Comparison Card:** Displays investment, gross revenue, net profit, and ROI % with transparent risk badges (Market Volatility, Water Need).
- **Mandi Net Realization Card:** Clearly displays `Mandi Price - Transport Fee = Take Home Profit`, with a prominent "Best Choice" highlight.
- **Preventative Alert Card:** Distinct icon + terracotta/amber left border stripe + structured format (Condition → Crop Stage → Action to take today).

### 5.4 Form Fields & Inputs
- Subtle warm surface (`#F6F2EA`), 1.5px border, comfortable line height.
- Explicit label always visible (never rely solely on placeholder text).
- Large clear text with inline validation messages.

---

## 6. Accessibility & Responsive Standards

- **Touch Friendly:** No cramped buttons; all interactive elements have sufficient tap padding.
- **High Contrast:** All text meets or exceeds WCAG 2.1 AA contrast thresholds against the cream canvas.
- **Screen Reader Support:** Full ARIA descriptions for dynamic charts, modals, audio speakers, and alert banners.
- **Tested Breakpoints:** 320px, 375px (standard mobile), 768px (tablets), 1024px (small laptop), 1440px (desktop).

---

## 7. Comprehensive Farmer UX Audit & Anti-SaaS Grounding

In accordance with empirical smallholder field requirements in rural Maharashtra and India, SFAS underwent a complete UX and ergonomic audit across 14 key dimensions:

### 7.1 UX Audit Findings & Implemented Grounding
1. **Understandable without instructions:** The primary dashboard immediately presents **"आजचे शेती नियोजन व सल्ला" (Today's Actionable Farm Advisory)** at the very top with an instant audio speaker button.
2. **Easy Buttons & Clear Labels:** Replaced generic English tech labels with direct action phrases: *"पानावरील रोग तपासणी"*, *"पीक सल्ला व नफा"*, *"मंडी भाव तुलना"*.
3. **Calibrated Information Density:** Eliminated cluttered micro-hourly sliders and circular progress donuts. Replaced with clean status indicators and high-contrast cards.
4. **Minimal Typing (1-Tap Presets):**
   - **Crop Advisor:** Added 1-tap acre buttons `[1 एकर]`, `[2 एकर]`, `[3 एकर]`, `[5 एकर]`, `[10 एकर]`.
   - **Smart Mandi:** Added 1-tap produce quantity buttons `[10 q]`, `[25 q]`, `[50 q]`, `[100 q]`.
5. **Understandable Errors:** Network dropouts and camera errors clearly state the physical cause and fallback action in regional language.
6. **Clear Loading States:** Tactile spinners with localized explanations (e.g., *"कृषी डेटाबेस तपासत आहे..."*).
7. **Explicit Offline Reassurance:** Solid status badge informing the farmer that Edge AI disease detection runs directly on the device with zero 4G required.
8. **Triple-Coded Multi-Sensory Risk Levels:** Never rely on color alone. Every risk is represented by:
   - Specific SVG Icon (`AlertTriangle`, `ShieldAlert`, `ShieldCheck`).
   - Explicit Text Label (*"उच्च जोखीम (High Risk)"*, *"मध्यम जोखीम (Medium Risk)"*, *"कमी जोखीम (Low Risk)"*).
   - High-contrast background and border.
9. **Simple Regional Language:** Consistent terminology in Marathi, Hindi, and English without corporate jargon.
10. **Mobile Ergonomics:** Strict **48px touch targets** (`--touch-target-min: 48px`), thumb-friendly stacked layouts, grounded border radii (6px to 16px).
11. **Tactile Voice Interactions:** Large, dedicated 64px microphone button with clear listening and stop states.
12. **Non-Technical Crop & ROI Math:** Large arithmetic formula block:
   `एकूण उत्पन्न (Gross) - शेती खर्च (Costs) = खरा निव्वळ नफा (Cash in Hand)`.
13. **Smart Mandi Real Profit Advantage:** Explicit callout banner calculating exact take-home cash difference:
   `"या बाजारात विक्री केल्यास इतर बाजारांपेक्षा ₹X जास्त निव्वळ नफा (रोकड) हातात शिल्लक राहील."`
14. **Action-First Dashboard:** Replaced raw abstract figures with immediate daily farm recommendations and weather spray/irrigation windows.
