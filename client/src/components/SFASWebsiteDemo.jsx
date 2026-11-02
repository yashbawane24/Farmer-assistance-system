import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, Minimize, Subtitles,
  Sprout, Globe, ExternalLink, Lock, RefreshCw, ChevronLeft, ChevronRight,
  ScanLine, Mic, Store, TrendingDown, Brain, X,
} from "lucide-react";

const GithubIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

/* ============================================================================
   Smart Farmer Assistance System (SFAS) — Krishi Mitra
   Self-playing 2:00 website demo built from real screenshots of the app,
   with camera moves, cursor clicks, highlights, captions and Web Speech narration.

   Screenshots: put the /shots/*.jpg files in your app's public folder
   (default base "/demo-shots/") or pass <SFASWebsiteDemo shotBase="..."/>.
   ========================================================================== */

const TOTAL = 120;
const W = 1280;          // stage width
const H = 720;           // stage height
const BAR = 38;          // browser chrome height
const VH = H - BAR;      // browser viewport height on stage
const IMG_W = 1440;      // screenshot width
const SITE = "farmer-assistance-system-blond.vercel.app";
const LIVE_URL = "https://farmer-assistance-system-blond.vercel.app/";
const GITHUB_URL = "https://github.com/yashbawane24/Farmer-assistance-system";

const IMG_H = { "01_landing_full": 4305, "03_dashboard_full": 1539 };
const imgH = (n) => IMG_H[n] || 900;

const SCENES = [
  { id: 1, title: "The Agricultural Challenge", start: 0, end: 25, accent: "#d4a373", Icon: TrendingDown },
  { id: 2, title: "AI Leaf Disease Diagnostics", start: 25, end: 55, accent: "#bc4749", Icon: ScanLine },
  { id: 3, title: "Multilingual AI Voice Agronomist", start: 55, end: 85, accent: "#386641", Icon: Mic },
  { id: 4, title: "Smart Mandi & Transport Pooling", start: 85, end: 105, accent: "#a7c957", Icon: Store },
  { id: 5, title: "Conclusion & Live Deployment", start: 105, end: 120, accent: "#6a994e", Icon: Globe },
];

/* -------------------------------------------------------------------------
   Shot list. All coordinates are in screenshot pixels (1440 wide).
   cam: [time, centerX, centerY, zoom]   (zoom 1 = full 1440px width visible)
   cur: [time, x, y, click?]
   hl:  { t:[from,to], r:[x,y,w,h], label }
   ------------------------------------------------------------------------- */
const SHOTS = [
  { img: "01_landing_full", tab: "Smart Farmer · Home", start: 0, end: 19,
    cam: [[0, 720, 385, 1], [4, 720, 385, 1], [7.4, 1000, 1110, 1.2], [10.4, 640, 1560, 1.1], [13.2, 720, 1560, 1], [15.8, 720, 2560, 1], [19, 720, 2600, 1.03]],
    hl: [
      { t: [7.6, 10.4], r: [728, 972, 612, 238], label: "Built for unstable networks, volatile mandis & costly wrong advice" },
      { t: [10.8, 13.2], r: [522, 1624, 184, 82], label: "Freight saved through pooling" },
      { t: [16, 19], r: [520, 2466, 404, 256], label: "Freight-adjusted, transparent pricing" },
    ] },
  { img: "02_login", tab: "Smart Farmer · Sign in", start: 19, end: 25,
    cam: [[19, 720, 450, 1], [25, 720, 540, 1.28]],
    cur: [[19.2, 1040, 820], [22.9, 720, 658, 1]] },

  { img: "03_dashboard_full", tab: "Smart Farmer · Dashboard", start: 25, end: 29.6,
    cam: [[25, 600, 560, 1.3], [29.6, 520, 560, 1.5]],
    cur: [[25.2, 760, 760], [28.3, 342, 424, 1]],
    hl: [{ t: [25.6, 28], r: [272, 476, 566, 146], label: "Ramesh's farm: Tomato · 2.2 acres · Nashik" }] },
  { img: "10_scan_empty", tab: "Smart Farmer · Disease Scan", start: 29.6, end: 32.6,
    cam: [[29.6, 720, 450, 1], [32.6, 600, 640, 1.3]],
    cur: [[29.8, 560, 600], [31.8, 363, 741, 1]] },
  { img: "11_scan_selected", tab: "Smart Farmer · Disease Scan", start: 32.6, end: 35.5,
    cam: [[32.6, 600, 640, 1.3], [35.5, 560, 600, 1.3]],
    cur: [[32.7, 363, 741], [35.2, 540, 880]],
    hl: [{ t: [33, 35.4], r: [404, 440, 272, 272], label: "Tomato leaf photo" }] },
  { img: "12_scan_running", tab: "Smart Farmer · Disease Scan", start: 35.5, end: 39.6,
    cam: [[35.5, 560, 560, 1.3], [39.6, 560, 450, 1.38]],
    cur: [[35.5, 540, 860], [35.8, 540, 783, 1]],
    scan: { t: [35.9, 39.6], r: [411, 300, 258, 261] } },
  { img: "13_scan_result_top", tab: "Smart Farmer · Disease Scan", start: 39.6, end: 47,
    cam: [[39.6, 900, 450, 1], [40.6, 1150, 320, 1.6], [47, 1150, 400, 1.55]],
    hl: [
      { t: [40.7, 43.7], r: [878, 170, 336, 92], label: "Early Blight · Alternaria solani" },
      { t: [43.8, 47], r: [884, 288, 532, 84], label: "Gemini Vision · 92% confidence" },
    ] },
  { img: "14_scan_result_bottom", tab: "Smart Farmer · Disease Scan", start: 47, end: 55,
    cam: [[47, 990, 480, 1.6], [55, 990, 560, 1.6]],
    hl: [
      { t: [48, 51.4], r: [893, 482, 506, 86], label: "Organic: Trichoderma viride · 5 g / L" },
      { t: [51.5, 55], r: [893, 591, 506, 86], label: "Approved chemical: Mancozeb 75% WP · 2 g / L" },
    ] },

  { img: "20_agro_marathi", tab: "Smart Farmer · AI Agronomist", start: 55, end: 60.4,
    cam: [[55, 720, 450, 1], [56.5, 820, 340, 1.3], [60.4, 840, 390, 1.35]],
    cur: [[55.2, 700, 520], [56.9, 515, 230, 1], [59.9, 840, 429, 1]] },
  { img: "21_agro_listening", tab: "Smart Farmer · AI Agronomist", start: 60.4, end: 67,
    cam: [[60.4, 840, 400, 1.35], [67, 840, 470, 1.35]],
    pulse: { t: [60.4, 63.8], x: 840, y: 429 },
    type: { t: [63.6, 66.7], r: [526, 558, 524, 40], text: "टोमॅटोच्या पानांवर काळे गोल डाग आहेत" },
    chip: { t: [60.8, 67], text: "Web Audio VAD  →  Groq Whisper Large-v3-Turbo", Icon: Mic } },
  { img: "22_agro_typed", tab: "Smart Farmer · AI Agronomist", start: 67, end: 70.6,
    cam: [[67, 840, 470, 1.35], [70.6, 900, 500, 1.3]],
    cur: [[67.1, 900, 640], [69.8, 1131, 578, 1]],
    hl: [{ t: [67.2, 69.6], r: [514, 549, 586, 58], label: "“Dark round spots on tomato leaves”" }] },
  { img: "25_agro_answer_b", tab: "Smart Farmer · AI Agronomist", start: 70.6, end: 77,
    cam: [[70.6, 840, 400, 1.12], [77, 840, 440, 1.22]],
    hl: [{ t: [72, 77], r: [424, 348, 600, 52], label: "Grounded answer, in Marathi" }],
    chip: { t: [71, 77], text: "Gemini 3.1 Flash-Lite · constrained RAG · JSON schema · 2.59 s median", Icon: Brain } },
  { img: "26_agro_answer_c", tab: "Smart Farmer · AI Agronomist", start: 77, end: 85,
    cam: [[77, 840, 450, 1.15], [85, 840, 520, 1.3]],
    hl: [
      { t: [78, 81.2], r: [444, 505, 396, 160], label: "Organic dose · per litre & per acre" },
      { t: [81.3, 85], r: [843, 505, 405, 160], label: "CIB&RC-approved chemical dose" },
    ],
    chip: { t: [78.5, 85], text: "Devanagari TTS · reading aloud in Marathi", Icon: Volume2, wave: true } },

  { img: "30_mandi_top", tab: "Smart Farmer · Smart Mandi", start: 85, end: 91,
    cam: [[85, 720, 450, 1], [86.5, 780, 560, 1.18], [91, 780, 590, 1.2]],
    hl: [
      { t: [86.6, 89], r: [262, 452, 1162, 136], label: "Decision finding: best take-home, not best price" },
      { t: [89, 91], r: [262, 622, 1162, 86], label: "Real profit verdict after freight & fees" },
    ] },
  { img: "31_mandi_cards", tab: "Smart Farmer · Smart Mandi", start: 91, end: 97.5,
    cam: [[91, 720, 520, 1.05], [97.5, 600, 620, 1.35]],
    hl: [
      { t: [92, 94.6], r: [284, 682, 352, 36], label: "Freight cost deducted" },
      { t: [94.7, 97.5], r: [284, 758, 352, 46], label: "True net realization" },
    ] },
  { img: "32_mandi_bottom", tab: "Smart Farmer · Smart Mandi", start: 97.5, end: 100.2,
    cam: [[97.5, 800, 600, 1.1], [100.2, 1000, 650, 1.25]],
    cur: [[97.6, 760, 560], [99.5, 1254, 770, 1]],
    hl: [{ t: [97.8, 100], r: [338, 702, 1086, 98], label: "Share a truck, save on freight" }] },
  { img: "42_pool_form_filled", tab: "Smart Farmer · Transport Pools", start: 100.2, end: 102.6,
    cam: [[100.2, 720, 450, 1.1], [102.6, 760, 600, 1.2]],
    cur: [[100.3, 1000, 520], [102.1, 880, 753, 1]] },
  { img: "45_pool_bottom", tab: "Smart Farmer · Transport Pools", start: 102.6, end: 105,
    cam: [[102.6, 640, 450, 1.15], [105, 600, 470, 1.3]],
    hl: [{ t: [102.9, 105], r: [286, 502, 590, 130], label: "Shared truck: ₹105/q pooled share · you save ₹3,465" }] },

  { img: "01_landing_full", tab: "Smart Farmer · Home", start: 105, end: 111.5,
    cam: [[105, 720, 1560, 1], [111.5, 760, 1600, 1.05]],
    hl: [
      { t: [105.6, 108.4], r: [522, 1624, 184, 82], label: "38% freight saved" },
      { t: [108.5, 111.5], r: [728, 1572, 560, 194], label: "Engineering team & usability architecture" },
    ] },
  { img: "01_landing_top", tab: "Smart Farmer · Home", start: 111.5, end: 120,
    cam: [[111.5, 720, 450, 1], [120, 720, 450, 1.08]], endCard: true },
];

const SEGMENTS = [
  { start: 0, end: 6.5, text: "This is Smart Farmer, Krishi Mitra: our live decision platform for farmers in Maharashtra." },
  { start: 6.5, end: 13, text: "It's built for real constraints: crop disease, volatile mandi prices, and costly wrong advice." },
  { start: 13, end: 19, text: "Every feature turns information into a decision the farmer can act on." },
  { start: 19, end: 25, text: "Let's sign in as Ramesh Patil, a tomato farmer from Nashik." },

  { start: 25, end: 30, text: "From his farm dashboard, Ramesh taps Scan a leaf." },
  { start: 30, end: 35.5, text: "He picks a tomato leaf sample and runs the AI pathology scan." },
  { start: 35.5, end: 40.5, text: "Google Gemini Vision analyses the leaf image on our server." },
  { start: 40.5, end: 47, text: "It detects Early Blight, Alternaria solani, with confidence, severity, and visible symptoms." },
  { start: 47, end: 55, text: "Treatment follows: Trichoderma as the organic remedy, and approved Mancozeb, with doses per litre." },

  { start: 55, end: 60.4, text: "Next, the AI Voice Agronomist. Ramesh switches to Marathi and taps the mic." },
  { start: 60.4, end: 67, text: "Voice detection and Groq's Whisper Large v3 Turbo capture his question in Marathi." },
  { start: 67, end: 70.6, text: "Dark round spots on his tomato leaves." },
  { start: 70.6, end: 77, text: "Gemini 3.1 Flash-Lite answers through constrained RAG, grounded in his own farm context." },
  { start: 77, end: 85, text: "The advice, with CIB and RC approved doses, is read aloud in Marathi." },

  { start: 85, end: 91, text: "Now, where to sell. Smart Mandi compares Maharashtra APMCs for his 33 quintals." },
  { start: 91, end: 97.5, text: "Freight and fees are subtracted from every quote, ranking mandis by true take-home cash." },
  { start: 97.5, end: 105, text: "With transport pools, Ramesh starts a shared truck, and nearby farmers split the freight." },

  { start: 105, end: 111.5, text: "Vision, voice, and market intelligence, together in one simple web app." },
  { start: 111.5, end: 117, text: "Smart Farmer is live on Vercel, and the code is open on GitHub." },
  { start: 117, end: 120, text: "Thank you for watching." },
];

/* ---------------------------- helpers ---------------------------- */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeIO = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const prog = (t, start, dur = 0.5) => easeIO(clamp((t - start) / dur));
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const graphemes = (s) => {
  try { if (Intl.Segmenter) return Array.from(new Intl.Segmenter("mr", { granularity: "grapheme" }).segment(s), (x) => x.segment); } catch (e) { /* noop */ }
  return Array.from(s);
};

function interpKeys(keys, t) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b[0]) {
      const p = easeIO(clamp((t - a[0]) / (b[0] - a[0] || 1)));
      return a.slice(1).map((v, j) => (typeof v === "number" && typeof b[j + 1] === "number" ? v + (b[j + 1] - v) * p : v));
    }
  }
  return keys[keys.length - 1].slice(1);
}

function cameraFor(shot, t) {
  const [cx0, cy0, z] = interpKeys(shot.cam, t);
  const s = (W / IMG_W) * z;
  const hw = W / 2 / s, hh = VH / 2 / s, ih = imgH(shot.img);
  const cx = clamp(cx0, hw, IMG_W - hw);
  const cy = ih <= hh * 2 ? ih / 2 : clamp(cy0, hh, ih - hh);
  return { s, tx: W / 2 - cx * s, ty: VH / 2 - cy * s };
}

/* ============================== CSS ============================== */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Noto+Sans+Devanagari:wght@500;600&display=swap');
.sw-root{--forest:#1b382b;--leaf:#386641;--wheat:#d4a373;--terra:#bc4749;--cream:#fdfbf7;--hl:#f2c94c;
  font-family:Inter,system-ui,sans-serif;color:#eef5ef;background:#0b1a12;border-radius:18px;overflow:hidden;max-width:1180px;margin:0 auto;
  box-shadow:0 30px 80px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.06);user-select:none}
.sw-root.fs{max-width:none;border-radius:0;height:100vh;display:flex;flex-direction:column;justify-content:center;background:#000}
.sw-root *{box-sizing:border-box}
.sw-wrap{position:relative;width:100%;overflow:hidden;background:#000}
.sw-stage{position:absolute;top:0;left:0;width:${W}px;height:${H}px;transform-origin:0 0;overflow:hidden;background:#e9e6dd}
.sw-bar{position:absolute;left:0;right:0;top:0;height:${BAR}px;background:linear-gradient(#f3f1ec,#e7e4dc);border-bottom:1px solid #d5d1c6;display:flex;align-items:center;gap:12px;padding:0 14px;color:#4a4a44;z-index:5}
.sw-dots{display:flex;gap:7px}.sw-dots i{width:12px;height:12px;border-radius:50%;display:block}
.sw-tab{height:28px;margin-top:10px;padding:0 14px;border-radius:9px 9px 0 0;background:#fdfbf7;display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:#2b2b28;min-width:230px;border:1px solid #d5d1c6;border-bottom:none}
.sw-url{flex:1;height:26px;border-radius:13px;background:#fff;border:1px solid #d9d5ca;display:flex;align-items:center;gap:8px;padding:0 12px;font-size:13px;color:#2f2f2a}
.sw-url b{font-weight:600;color:#1b382b}
.sw-scn{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:700;padding:5px 11px;border-radius:999px;color:#fff;white-space:nowrap}
.sw-view{position:absolute;left:0;top:${BAR}px;width:${W}px;height:${VH}px;overflow:hidden;background:#f8f6f0}
.sw-layer{position:absolute;left:0;top:0;width:${IMG_W}px;transform-origin:0 0;will-change:transform}
.sw-layer img{display:block;width:${IMG_W}px;height:auto}
.sw-hl{position:absolute;border-radius:12px;border:3px solid var(--hl);box-shadow:0 0 0 6px rgba(242,201,76,.28),0 0 34px rgba(242,201,76,.55);pointer-events:none}
.sw-lab{position:absolute;left:-3px;bottom:100%;margin-bottom:8px;transform-origin:0 100%;white-space:nowrap;background:#1b382b;color:#fff;font-weight:700;font-size:16px;padding:7px 12px;border-radius:9px;box-shadow:0 8px 24px rgba(0,0,0,.25)}
.sw-cur{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;z-index:4}
.sw-rip{position:absolute;left:-22px;top:-22px;width:44px;height:44px;border-radius:50%;border:3px solid #bc4749;background:rgba(188,71,73,.18)}
.sw-cap{position:absolute;left:50%;bottom:20px;transform:translateX(-50%);max-width:1080px;padding:11px 24px;border-radius:14px;background:rgba(14,24,18,.86);backdrop-filter:blur(6px);font-size:23px;line-height:1.35;font-weight:500;text-align:center;z-index:6;border:1px solid rgba(255,255,255,.08)}
.sw-cap .w{color:rgba(255,255,255,.5)}.sw-cap .w.on{color:#fff}.sw-cap .w.now{color:#f2c94c}
.sw-chip{position:absolute;right:18px;top:${BAR + 16}px;z-index:6;display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:12px;background:rgba(27,56,43,.94);color:#fff;font-size:15px;font-weight:600;box-shadow:0 12px 30px rgba(0,0,0,.28)}
.sw-end{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:7}
.sw-card{width:720px;padding:34px 40px;border-radius:24px;background:rgba(253,251,247,.97);color:#1b382b;box-shadow:0 30px 80px rgba(0,0,0,.35);text-align:center}
.sw-link{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:14px;text-decoration:none;text-align:left;margin-top:12px}
@keyframes swPulse{0%{transform:scale(1);opacity:.75}100%{transform:scale(2.3);opacity:0}}
@keyframes swBar{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}
.sw-ctrl{display:flex;align-items:center;gap:14px;padding:12px 18px 16px;background:linear-gradient(180deg,#10241a,#0a1711);border-top:1px solid rgba(255,255,255,.07)}
.sw-btn{all:unset;cursor:pointer;display:grid;place-items:center;width:40px;height:40px;border-radius:12px;color:#eef5ef;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09)}
.sw-btn:hover{background:rgba(167,201,87,.18)}
.sw-btn:focus-visible{outline:2px solid #a7c957;outline-offset:2px}
.sw-btn.main{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#4f8a3c,#1b382b);border:none;box-shadow:0 6px 20px rgba(56,102,65,.5)}
.sw-btn.off{color:#f87171}
.sw-track{position:relative;height:30px;cursor:pointer;flex:1;touch-action:none}
.sw-rail{position:absolute;left:0;right:0;top:12px;height:6px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden}
.sw-fill{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#6a994e,#a7c957)}
.sw-mark{position:absolute;top:8px;width:2px;height:14px;background:rgba(255,255,255,.4);border-radius:2px}
.sw-knob{position:absolute;top:6px;width:18px;height:18px;margin-left:-9px;border-radius:50%;background:#fff;box-shadow:0 0 0 4px rgba(167,201,87,.4)}
.sw-time{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px;color:#a9c2b0;min-width:96px;text-align:center}
.sw-scene{display:flex;align-items:center;gap:8px;width:290px;overflow:hidden;text-overflow:ellipsis;flex:none;font-size:13px;font-weight:600;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);white-space:nowrap}
.sw-sel{background:#10241a;color:#eef5ef;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:8px;font-size:12px;max-width:170px}
.sw-over{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;cursor:pointer;background:rgba(12,26,18,.62);backdrop-filter:blur(3px);z-index:9;color:#fff}
.sw-big{width:110px;height:110px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#4f8a3c,#1b382b);box-shadow:0 0 0 10px rgba(167,201,87,.2),0 20px 60px rgba(0,0,0,.45);color:#fff;transition:transform .2s}
.sw-over:hover .sw-big{transform:scale(1.06)}
@media (max-width:760px){.sw-scene{width:auto}.sw-scene span.t{display:none}.sw-sel{display:none}}
`;

/* ============================ shot renderer ============================ */
function Cursor({ shot, t, s }) {
  if (!shot.cur) return null;
  const [x, y] = interpKeys(shot.cur, t);
  const clicks = shot.cur.filter((k) => k[3]);
  let rip = null;
  for (const c of clicks) {
    const d = t - c[0];
    if (d >= 0 && d < 0.6) rip = d / 0.6;
  }
  const pressed = clicks.some((c) => t - c[0] >= 0 && t - c[0] < 0.18);
  return (
    <div className="sw-cur" style={{ transform: `translate(${x}px,${y}px) scale(${1 / s})` }}>
      {rip !== null && <div className="sw-rip" style={{ transform: `scale(${0.4 + rip * 1.4})`, opacity: 1 - rip }} />}
      <svg width="30" height="34" viewBox="0 0 30 34" style={{ position: "absolute", left: -4, top: -3, transform: `scale(${pressed ? 0.86 : 1})`, filter: "drop-shadow(0 3px 5px rgba(0,0,0,.35))" }}>
        <path d="M4 3 L4 27 L10.5 21 L15 31 L19.5 29 L15 19.5 L24 19.5 Z" fill="#fff" stroke="#1b1b1b" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Highlights({ shot, t, s }) {
  if (!shot.hl) return null;
  return shot.hl.map((h, i) => {
    const pin = prog(t, h.t[0], 0.35), pout = 1 - prog(t, h.t[1] - 0.3, 0.3);
    const o = Math.min(pin, pout);
    if (o <= 0.001) return null;
    const [x, y, w, hh] = h.r;
    return (
      <div key={i} className="sw-hl" style={{ left: x, top: y, width: w, height: hh, opacity: o, transform: `scale(${1.06 - 0.06 * pin})`, borderWidth: 3 / s }}>
        {h.label && <div className="sw-lab" style={{ transform: `scale(${1 / s})` }}>{h.label}</div>}
      </div>
    );
  });
}

function ScanFx({ shot, t }) {
  const f = shot.scan;
  if (!f || t < f.t[0] || t > f.t[1]) return null;
  const [x, y, w, h] = f.r;
  const lp = ((t - f.t[0]) % 1.6) / 1.6;
  const o = prog(t, f.t[0], 0.3);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: o, borderRadius: 10, boxShadow: "0 0 0 3px #22d3ee, 0 0 40px rgba(34,211,238,.7)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: `${lp * 100}%`, height: 4, background: "#67e8f9", boxShadow: "0 0 22px 8px rgba(34,211,238,.6)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(34,211,238,.12),transparent)" }} />
      <div style={{ position: "absolute", left: 8, top: 8, background: "#0e7490", color: "#fff", fontSize: 13, fontWeight: 700, padding: "4px 8px", borderRadius: 6 }}>Gemini Vision analysing…</div>
    </div>
  );
}

function PulseFx({ shot, t }) {
  const f = shot.pulse;
  if (!f || t < f.t[0] || t > f.t[1]) return null;
  return (
    <div style={{ position: "absolute", left: f.x - 40, top: f.y - 40, width: 80, height: 80 }}>
      {[0, 0.6, 1.2].map((d) => (
        <div key={d} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid #bc4749", animation: `swPulse 1.8s ${d}s ease-out infinite` }} />
      ))}
    </div>
  );
}

function TypeFx({ shot, t, glyphs }) {
  const f = shot.type;
  if (!f || t < f.t[0] - 0.05) return null;
  const n = Math.round(glyphs.length * clamp((t - f.t[0]) / (f.t[1] - f.t[0] - 0.3)));
  const [x, y, w, h] = f.r;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, background: "#fff", display: "flex", alignItems: "center", paddingLeft: 12, fontFamily: "'Noto Sans Devanagari',Inter,sans-serif", fontSize: 16, color: "#1f2a22", borderRadius: 8 }}>
      {glyphs.slice(0, n).join("")}
      <span style={{ width: 2, height: 20, background: "#1b382b", marginLeft: 2, opacity: Math.sin(t * 9) > 0 ? 1 : 0 }} />
    </div>
  );
}

function ShotView({ shot, t, opacity, src, glyphs }) {
  const { s, tx, ty } = cameraFor(shot, t);
  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <div className="sw-layer" style={{ transform: `translate(${tx}px,${ty}px) scale(${s})` }}>
        <img src={src} alt="" draggable={false} />
        <ScanFx shot={shot} t={t} />
        <PulseFx shot={shot} t={t} />
        <TypeFx shot={shot} t={t} glyphs={glyphs} />
        <Highlights shot={shot} t={t} s={s} />
        <Cursor shot={shot} t={t} s={s} />
      </div>
    </div>
  );
}

function Chip({ shot, t }) {
  const c = shot.chip;
  if (!c) return null;
  const o = Math.min(prog(t, c.t[0], 0.4), 1 - prog(t, c.t[1] - 0.3, 0.3));
  if (o <= 0) return null;
  const I = c.Icon;
  return (
    <div className="sw-chip" style={{ opacity: o, transform: `translateY(${(1 - o) * -10}px)` }}>
      <I size={18} color="#a7c957" />
      {c.text}
      {c.wave && (
        <span style={{ display: "flex", gap: 3, alignItems: "center", height: 18 }}>
          {[0, 1, 2, 3, 4].map((i) => <i key={i} style={{ width: 3, height: 18, background: "#a7c957", borderRadius: 2, animation: `swBar .9s ${i * 0.12}s ease-in-out infinite` }} />)}
        </span>
      )}
    </div>
  );
}

function EndCard({ t }) {
  const o = prog(t, 111.7, 0.7);
  const thanks = prog(t, 117, 0.6);
  return (
    <div className="sw-end" style={{ opacity: o, background: `rgba(16,36,26,${0.55 * o})`, backdropFilter: `blur(${4 * o}px)` }}>
      <div className="sw-card" style={{ transform: `translateY(${(1 - o) * 20}px)` }}>
        <div style={{ width: 64, height: 64, margin: "0 auto", borderRadius: 18, display: "grid", placeItems: "center", background: "#1b382b", color: "#fff" }}><Sprout size={34} /></div>
        <div style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 40, fontWeight: 700, marginTop: 12 }}>{thanks > 0.5 ? "Thank you" : "Smart Farmer · Krishi Mitra"}</div>
        <div style={{ fontSize: 16, color: "#55665b", marginTop: 4 }}>Smart Farmer Assistance System (SFAS)</div>
        <a className="sw-link" href={LIVE_URL} target="_blank" rel="noreferrer" style={{ background: "#1b382b", color: "#fff", marginTop: 22 }}>
          <Globe size={24} color="#a7c957" />
          <span style={{ flex: 1 }}><span style={{ fontSize: 12, fontWeight: 700, color: "#a7c957", letterSpacing: 0.6 }}>LIVE ON VERCEL</span><br /><span style={{ fontSize: 17, fontWeight: 600 }}>{SITE}</span></span>
          <ExternalLink size={18} />
        </a>
        <a className="sw-link" href={GITHUB_URL} target="_blank" rel="noreferrer" style={{ background: "#efece4", color: "#1b382b" }}>
          <GithubIcon size={24} />
          <span style={{ flex: 1 }}><span style={{ fontSize: 12, fontWeight: 700, color: "#6a994e", letterSpacing: 0.6 }}>OPEN SOURCE</span><br /><span style={{ fontSize: 16, fontWeight: 600 }}>github.com/yashbawane24/Farmer-assistance-system</span></span>
          <ExternalLink size={18} />
        </a>
      </div>
    </div>
  );
}

/* ============================== player ============================== */
export default function SFASWebsiteDemo({ shotBase = "/demo-shots/", shotUrls = null }) {
  const urlFor = useCallback((name) => (shotUrls && shotUrls[name]) || `${shotBase}${name}.jpg`, [shotBase, shotUrls]);
  const names = useMemo(() => Array.from(new Set(SHOTS.map((s) => s.img))), []);
  const glyphs = useMemo(() => graphemes(SHOTS.find((s) => s.type).type.text), []);

  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cc, setCc] = useState(true);
  const [fs, setFs] = useState(false);
  const [voices, setVoices] = useState([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [charIdx, setCharIdx] = useState(-1);
  const [nonce, setNonce] = useState(0);
  const [scale, setScale] = useState(0.8);
  const [loaded, setLoaded] = useState(0);
  const [speechOk] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);

  const timeRef = useRef(0);
  const spokenRef = useRef(-1);
  const mutedRef = useRef(false);
  const voiceRef = useRef(null);
  const rootRef = useRef(null);
  const wrapRef = useRef(null);
  const trackRef = useRef(null);
  const dragRef = useRef({ active: false, wasPlaying: false });
  mutedRef.current = muted;

  /* preload screenshots */
  useEffect(() => {
    let n = 0;
    const imgs = names.map((nm) => {
      const im = new Image();
      im.onload = im.onerror = () => { n += 1; setLoaded(n); };
      im.src = urlFor(nm);
      return im;
    });
    return () => imgs.forEach((im) => { im.onload = im.onerror = null; });
  }, [names, urlFor]);
  const ready = loaded >= names.length;

  /* voices */
  useEffect(() => {
    if (!speechOk) return;
    const synth = window.speechSynthesis;
    const load = () => {
      const en = synth.getVoices().filter((v) => /^en([-_]|$)/i.test(v.lang));
      setVoices(en);
      setVoiceURI((cur) => {
        if (cur && en.some((v) => v.voiceURI === cur)) return cur;
        const prefs = [/Google UK English Female/i, /Microsoft (Aria|Jenny|Sonia|Libby|Neerja).*Online/i, /Samantha/i, /Google US English/i, /en[-_]IN/i, /Microsoft (Zira|Aria|Jenny)/i, /Daniel/i];
        for (const p of prefs) { const hit = en.find((v) => p.test(v.name) || p.test(v.lang)); if (hit) return hit.voiceURI; }
        return en[0]?.voiceURI || "";
      });
    };
    load();
    synth.addEventListener?.("voiceschanged", load);
    return () => synth.removeEventListener?.("voiceschanged", load);
  }, [speechOk]);
  useEffect(() => { voiceRef.current = voices.find((v) => v.voiceURI === voiceURI) || null; }, [voices, voiceURI]);

  const stopSpeech = useCallback(() => { if (speechOk) window.speechSynthesis.cancel(); }, [speechOk]);
  useEffect(() => () => stopSpeech(), [stopSpeech]);

  const speak = useCallback((text) => {
    if (!speechOk) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = voiceRef.current;
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-US";
    u.rate = 1.0;
    u.onboundary = (e) => { if (!e.name || e.name === "word") setCharIdx(e.charIndex); };
    setTimeout(() => synth.speak(u), 40);
  }, [speechOk]);

  /* clock */
  useEffect(() => {
    if (!playing) return;
    let raf, last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      timeRef.current = Math.min(TOTAL, timeRef.current + dt);
      setTime(timeRef.current);
      if (timeRef.current >= TOTAL) { setPlaying(false); setEnded(true); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const segIdx = useMemo(() => SEGMENTS.findIndex((s) => time >= s.start && time < s.end), [time]);
  const sceneIdx = useMemo(() => { const i = SCENES.findIndex((s) => time >= s.start && time < s.end); return i === -1 ? SCENES.length - 1 : i; }, [time]);
  const scene = SCENES[sceneIdx];
  const shotIdx = useMemo(() => { const i = SHOTS.findIndex((s) => time >= s.start && time < s.end); return i === -1 ? SHOTS.length - 1 : i; }, [time]);
  const shot = SHOTS[shotIdx];

  /* narration sync */
  useEffect(() => {
    if (!playing) return;
    if (segIdx !== spokenRef.current) {
      spokenRef.current = segIdx;
      setCharIdx(-1);
      if (segIdx >= 0 && !mutedRef.current) speak(SEGMENTS[segIdx].text);
    }
  }, [segIdx, playing, nonce, speak]);

  const armSegmentAt = useCallback((t) => {
    const i = SEGMENTS.findIndex((s) => t >= s.start && t < s.end);
    if (i < 0) { spokenRef.current = -1; return; }
    const s = SEGMENTS[i];
    spokenRef.current = (t - s.start) / (s.end - s.start) < 0.35 ? -99 : i;
    setNonce((n) => n + 1);
  }, []);

  const play = useCallback(() => {
    if (ended || timeRef.current >= TOTAL) { timeRef.current = 0; setTime(0); setEnded(false); }
    setStarted(true);
    armSegmentAt(timeRef.current);
    setPlaying(true);
  }, [ended, armSegmentAt]);
  const pause = useCallback(() => { setPlaying(false); stopSpeech(); }, [stopSpeech]);
  const togglePlay = useCallback(() => (playing ? pause() : play()), [playing, pause, play]);
  const restart = useCallback(() => {
    stopSpeech(); timeRef.current = 0; setTime(0); setEnded(false); setStarted(true);
    spokenRef.current = -99; setNonce((n) => n + 1); setPlaying(true);
  }, [stopSpeech]);
  const seek = useCallback((t) => {
    stopSpeech();
    const nt = clamp(t, 0, TOTAL - 0.01);
    timeRef.current = nt; setTime(nt); setEnded(false); setCharIdx(-1);
    armSegmentAt(nt);
  }, [stopSpeech, armSegmentAt]);
  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m; mutedRef.current = next;
      if (next) stopSpeech(); else if (playing) armSegmentAt(timeRef.current);
      return next;
    });
  }, [playing, stopSpeech, armSegmentAt]);
  const toggleFs = useCallback(async () => {
    try { if (!document.fullscreenElement) await rootRef.current?.requestFullscreen?.(); else await document.exitFullscreen?.(); } catch (e) { /* refused */ }
  }, []);
  useEffect(() => {
    const on = () => setFs(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  /* responsive stage */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      let sc = el.clientWidth / W;
      if (fs) sc = Math.min(sc, (window.innerHeight - 90) / H);
      setScale(sc);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [fs]);

  /* keyboard */
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (["SELECT", "INPUT", "TEXTAREA"].includes(tag)) return;
      if (e.code === "Space" || e.key === "k") { e.preventDefault(); togglePlay(); }
      else if (e.key === "ArrowRight") seek(timeRef.current + 5);
      else if (e.key === "ArrowLeft") seek(timeRef.current - 5);
      else if (e.key === "m") toggleMute();
      else if (e.key === "c") setCc((v) => !v);
      else if (e.key === "f") toggleFs();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, seek, toggleMute, toggleFs]);

  /* scrubber */
  const tFromPointer = (e) => { const r = trackRef.current.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width) * TOTAL; };
  const onDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { active: true, wasPlaying: playing };
    setPlaying(false); setStarted(true); seek(tFromPointer(e));
  };
  const onMove = (e) => { if (!dragRef.current.active) return; const t = tFromPointer(e); stopSpeech(); timeRef.current = t; setTime(t); };
  const onUp = (e) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false; seek(tFromPointer(e));
    if (dragRef.current.wasPlaying) setPlaying(true);
  };

  /* captions */
  const seg = segIdx >= 0 ? SEGMENTS[segIdx] : null;
  const capWords = useMemo(() => {
    if (!seg) return [];
    let off = 0;
    return seg.text.split(" ").map((w) => { const o = { w, off }; off += w.length + 1; return o; });
  }, [seg]);
  let lit = 0;
  if (seg) {
    if (charIdx >= 0 && !muted && playing) lit = capWords.filter((x) => x.off <= charIdx).length;
    else lit = Math.ceil(clamp((time - seg.start) / Math.min(seg.end - seg.start - 0.3, capWords.length / 2.5)) * capWords.length);
  }

  const shownT = started ? time : 0.01;
  const prev = shotIdx > 0 && shownT - shot.start < 0.45 ? SHOTS[shotIdx - 1] : null;
  const fadeIn = prev ? prog(shownT, shot.start, 0.45) : 1;
  const SIcon = scene.Icon;

  return (
    <div ref={rootRef} className={"sw-root" + (fs ? " fs" : "")}>
      <style>{CSS}</style>
      <div ref={wrapRef} className="sw-wrap" style={{ height: H * scale }}>
        <div className="sw-stage" style={{ transform: `scale(${scale})`, left: fs ? `calc(50% - ${(W * scale) / 2}px)` : 0 }}>
          {/* browser chrome */}
          <div className="sw-bar">
            <div className="sw-dots"><i style={{ background: "#ec6a5e" }} /><i style={{ background: "#f4bf4f" }} /><i style={{ background: "#61c554" }} /></div>
            <div style={{ display: "flex", gap: 8, color: "#8a877d" }}><ChevronLeft size={17} /><ChevronRight size={17} /><RefreshCw size={15} /></div>
            <div className="sw-url"><Lock size={13} color="#386641" /><span><b>{SITE}</b></span></div>
            <div className="sw-scn" style={{ background: scene.accent }}><SIcon size={14} />{scene.id}/5 · {scene.title}</div>
          </div>
          {/* page viewport */}
          <div className="sw-view">
            {prev && <ShotView shot={prev} t={shownT} opacity={1} src={urlFor(prev.img)} glyphs={glyphs} />}
            <ShotView shot={shot} t={shownT} opacity={fadeIn} src={urlFor(shot.img)} glyphs={glyphs} />
            <Chip shot={shot} t={shownT} />
            {shot.endCard && <EndCard t={shownT} />}
            {cc && seg && started && (
              <div className="sw-cap" aria-live="polite">
                {capWords.map((x, i) => <span key={i} className={"w" + (i < lit ? " on" : "") + (i === lit - 1 && playing ? " now" : "")}>{x.w} </span>)}
              </div>
            )}
          </div>

          {(!started || ended) && (
            <div className="sw-over" onClick={ended ? restart : play}>
              <div className="sw-big">{ended ? <RotateCcw size={46} /> : <Play size={52} fill="#fff" style={{ marginLeft: 6 }} />}</div>
              <div style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 34, fontWeight: 700 }}>{ended ? "Replay demo" : "Play Video"}</div>
              <div style={{ fontSize: 17, opacity: 0.85 }}>Smart Farmer · Krishi Mitra — website walkthrough · 2:00</div>
              {!ready && <div style={{ fontSize: 14, opacity: 0.75 }}>Loading screens {loaded}/{names.length}…</div>}
              {!speechOk && <div style={{ fontSize: 14, opacity: 0.75 }}>Voice narration isn't available in this browser — captions will play.</div>}
            </div>
          )}
          {started && !playing && !ended && (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", cursor: "pointer", zIndex: 8 }} onClick={play}>
              <div className="sw-big" style={{ width: 90, height: 90, opacity: 0.94 }}><Play size={42} fill="#fff" style={{ marginLeft: 5 }} /></div>
            </div>
          )}
        </div>
      </div>

      <div className="sw-ctrl">
        <button className="sw-btn main" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} title={playing ? "Pause (Space)" : "Play (Space)"}>
          {playing ? <Pause size={24} fill="#fff" /> : <Play size={24} fill="#fff" style={{ marginLeft: 3 }} />}
        </button>
        <button className="sw-btn" onClick={restart} aria-label="Restart" title="Restart"><RotateCcw size={18} /></button>
        <span className="sw-time">{fmt(time)} / {fmt(TOTAL)}</span>
        <div ref={trackRef} className="sw-track" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={Math.round(time)} tabIndex={0}>
          <div className="sw-rail"><div className="sw-fill" style={{ width: (time / TOTAL) * 100 + "%" }} /></div>
          {SCENES.slice(1).map((s) => <div key={s.id} className="sw-mark" style={{ left: (s.start / TOTAL) * 100 + "%" }} />)}
          <div className="sw-knob" style={{ left: (time / TOTAL) * 100 + "%" }} />
        </div>
        <div className="sw-scene" title={scene.title}><SIcon size={15} color={scene.accent} /><span style={{ color: scene.accent }}>{scene.id}/5</span><span className="t">{scene.title}</span></div>
        <button className={"sw-btn" + (muted ? " off" : "")} onClick={toggleMute} aria-label={muted ? "Unmute narration" : "Mute narration"} title="Mute narration (M)">
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        {voices.length > 1 && (
          <select className="sw-sel" value={voiceURI} onChange={(e) => { setVoiceURI(e.target.value); if (playing) setTimeout(() => armSegmentAt(timeRef.current), 0); }} aria-label="Narration voice" title="Narration voice">
            {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name.replace(/^(Microsoft|Google)\s+/, "")}</option>)}
          </select>
        )}
        <button className={"sw-btn" + (cc ? "" : " off")} onClick={() => setCc((v) => !v)} aria-label="Toggle captions" title="Captions (C)"><Subtitles size={18} /></button>
        <button className="sw-btn" onClick={toggleFs} aria-label="Fullscreen" title="Fullscreen (F)">{fs ? <Minimize size={18} /> : <Maximize size={18} />}</button>
      </div>
    </div>
  );
}
