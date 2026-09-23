import os
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748b"))

        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, letter[1] - 36, "Smart Farmer Assistance System — Complete User Tutorial")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, letter[1] - 42, letter[0] - 54, letter[1] - 42)

        # Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 32, page_text)
        self.drawString(54, 32, "Confidential & Practical Farmer Guide | SFAS Platform")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 44, letter[0] - 54, 44)

        self.restoreState()

def create_tutorial_pdf(output_filename):
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#14532d"), # Deep forest green
        alignment=0,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#475569"),
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#166534"),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#334155"),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#065f46")
    )

    badge_style = ParagraphStyle(
        'Badge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=10,
        textColor=colors.HexColor("#ffffff"),
        alignment=1
    )

    story = []

    # Title & Header
    story.append(Paragraph("Smart Farmer Assistance System", title_style))
    story.append(Paragraph("Step-by-Step Practical User Guide & Operations Manual", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#16a34a"), spaceBefore=2, spaceAfter=14))

    # Executive Overview Box
    summary_data = [
        [
            Paragraph(
                "<b>System Overview:</b> The Smart Farmer Assistance System (SFAS) is an AI-powered, offline-capable Progressive Web Application built specifically for Indian farmers. It unifies personalized crop advisory, edge AI disease diagnosis, real-time APMC mandi net profit calculation, localized spray weather forecasts, and government scheme eligibility into an intuitive interface.",
                callout_style
            )
        ]
    ]
    summary_table = Table(summary_data, colWidths=[letter[0]-108])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdf4")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#bbf7d0")),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 14))

    # Section 1: Getting Started & Authentication
    story.append(Paragraph("1. Getting Started & Sign In", h1_style))
    story.append(Paragraph("Accessing the portal takes just seconds on both smartphone and computer browsers:", body_style))
    story.append(Paragraph("• <b>Website Access:</b> Open your deployed Vercel link or local address in any browser (Google Chrome, Brave, Safari, Edge).", bullet_style))
    story.append(Paragraph("• <b>Language Selection:</b> Tap the Globe icon in the top navigation bar to choose your preferred language: <b>English</b>, <b>हिंदी (Hindi)</b>, or <b>मराठी (Marathi)</b>. All navigation and terminology updates immediately.", bullet_style))
    story.append(Paragraph("• <b>Instant Demo Login:</b> Tap the <b>'Sign In'</b> button on the top right. You can immediately choose one of the pre-loaded authentic demo profiles without typing passwords:", bullet_style))

    # Demo accounts table
    auth_data = [
        ["Farmer Name", "District & State", "Land & Soil Type", "Primary Crop"],
        ["Ramesh Patil", "Nashik, Maharashtra", "2.2 Acres, Black Soil (Regur)", "Tomato (Flowering)"],
        ["Rajesh Sharma", "Karnal, Haryana", "9.5 Acres, Alluvial Loam", "Wheat (Vegetative)"]
    ]
    t_auth = Table(auth_data, colWidths=[120, 130, 160, 94])
    t_auth.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#14532d")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#ffffff"), colors.HexColor("#f8fafc")]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
    ]))
    story.append(t_auth)
    story.append(Spacer(1, 14))

    # Section 2: Dashboard Navigation
    story.append(Paragraph("2. Navigating the Unified Dashboard", h1_style))
    story.append(Paragraph("The central dashboard aggregates real-time agricultural telemetry tailored to your farm:", body_style))
    story.append(Paragraph("• <b>Live Weather Card:</b> Displays current temperature, humidity, wind velocity, and an automated spray advisory status.", bullet_style))
    story.append(Paragraph("• <b>My Farm Status:</b> Displays registered acreage, active crop, growth stage, and soil health conditions.", bullet_style))
    story.append(Paragraph("• <b>Urgent Advisory Alerts:</b> Color-coded banners warning of sudden humidity spikes, pest incubation windows, or mandi price surges.", bullet_style))
    story.append(Paragraph("• <b>Quick Launch Actions:</b> One-tap navigation cards to jump directly into Disease Diagnosis, Crop Advisory, Mandi Comparison, and Schemes.", bullet_style))
    story.append(Spacer(1, 12))

    # Section 3: AI Crop Advisor & Dynamic ROI Calculator
    story.append(Paragraph("3. Crop Advisor & Net Profit (ROI) Calculator", h1_style))
    story.append(Paragraph("This module eliminates guesswork when choosing which crop to sow for the upcoming season:", body_style))
    story.append(Paragraph("<b>Step 1: Input Your Farm Parameters</b> — Select your Land Area (in Acres), Soil Type (e.g., Black Cotton, Alluvial Loam, Sandy Loam), Water Source, and Season (Kharif, Rabi, Zaid).", bullet_style))
    story.append(Paragraph("<b>Step 2: Generate Recommendations</b> — The system calculates agronomic suitability scores and ranks crops based on water risk, market volatility, and input costs.", bullet_style))
    story.append(Paragraph("<b>Step 3: Analyze Detailed Economics</b> — Click on any recommended crop card (Tomato, Onion, Cotton, Wheat, Green Chilli, Maize, Soybean) to view an interactive financial breakdown:", bullet_style))
    
    roi_data = [
        ["Economic Metric", "Formula / Derivation", "Farmer Utility"],
        ["Gross Expected Revenue", "Expected Yield (Quintals) × Mandi Price", "Forecasts maximum earning potential"],
        ["Estimated Input Cost", "Seed + Fertilizer + Crop Protection + Labor", "Prevents over-leveraging with seed loans"],
        ["Net Projected Profit", "Gross Revenue - Total Input Cost", "Highlights true bottom-line earnings"],
        ["ROI Percentage", "(Net Profit ÷ Total Input Cost) × 100", "Enables direct crop-to-crop comparison"]
    ]
    t_roi = Table(roi_data, colWidths=[120, 180, 204])
    t_roi.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e3a2f")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#ffffff"), colors.HexColor("#f8fafc")]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
    ]))
    story.append(t_roi)
    story.append(Spacer(1, 14))

    story.append(PageBreak())

    # Section 4: Edge AI Plant Disease Scanner
    story.append(Paragraph("4. Plant Disease Diagnosis (Edge AI Scanner)", h1_style))
    story.append(Paragraph("Farmers can detect leaf pathologies in under 3 seconds using the integrated vision scanner:", body_style))
    story.append(Paragraph("<b>Step 1: Upload or Capture Photo:</b> Click on <b>'Upload Leaf Image'</b> or drag & drop a photo from your gallery. You can use the ready-made test images from your <code>sample-dataset/</code> folder:", bullet_style))
    story.append(Paragraph("   • <code>sample-dataset/tomato_early_blight.jpg</code> (Early Blight with concentric ring lesions)", bullet_style))
    story.append(Paragraph("   • <code>sample-dataset/potato_late_blight.jpg</code> (Late Blight with dark water-soaked blotches)", bullet_style))
    story.append(Paragraph("   • <code>sample-dataset/healthy_crop_leaf.jpg</code> (Clean, healthy foliage verification)", bullet_style))
    story.append(Paragraph("<b>Step 2: Instant Edge AI Diagnosis:</b> The scanner processes visual features directly in your browser with zero latency. It outputs:", bullet_style))
    story.append(Paragraph("   • <b>Disease Name & Pathogen:</b> E.g., <i>Alternaria solani</i> or <i>Phytophthora infestans</i>.", bullet_style))
    story.append(Paragraph("   • <b>Confidence Rating:</b> E.g., 94% Confidence.", bullet_style))
    story.append(Paragraph("   • <b>Symptom Summary:</b> Visual pathology description to cross-verify in the field.", bullet_style))
    story.append(Paragraph("<b>Step 3: Actionable Treatment Plan:</b> The report gives both <b>Organic Remedies</b> (Neem oil 5ml/L, Trichoderma harzianum) and <b>Chemical Controls</b> (Mancozeb, Metalaxyl) with exact dosage instructions.", bullet_style))
    story.append(Paragraph("<b>Step 4: Voice Readout:</b> Tap the <b>Audio Speaker button</b> to hear the diagnosis read aloud in Marathi, Hindi, or English.", bullet_style))
    story.append(Spacer(1, 14))

    # Section 5: Smart Mandi & Logistics Net Profit Calculator
    story.append(Paragraph("5. Smart Mandi Prices & Transport Logistics", h1_style))
    story.append(Paragraph("Selling at the nearest local mandi is often less profitable than selling at a regional hub due to price disparities. This module calculates the true profit after transportation:", body_style))
    story.append(Paragraph("• <b>Live APMC Comparison:</b> Displays modal prices, minimums, maximums, and daily arrival tonnage across mandis (e.g., Nashik APMC, Lasalgaon Onion Yard, Pune Gultekdi, Vashi Mumbai Terminal).", bullet_style))
    story.append(Paragraph("• <b>Net Realized Profit Formula:</b> Automatically deducts <code>(Distance in km × Freight Rate per km) + Mandi Handling & Loading Fee</code> from the gross price.", bullet_style))
    story.append(Paragraph("• <b>Shared Transport Pooling:</b> Farmers can join or create shared transport pools with neighboring growers, slashing freight expenses by 35% to 50% for smaller vehicle loads.", bullet_style))
    story.append(Spacer(1, 14))

    # Section 6: Agricultural Weather & Precision Spray Windows
    story.append(Paragraph("6. Weather Forecasts & Spray Advisory Windows", h1_style))
    story.append(Paragraph("Farming decisions hinge on weather timing. This screen gives agro-meteorological advisories:", body_style))
    story.append(Paragraph("• <b>7-Day Hyper-Local Forecast:</b> Temperature range, relative humidity percentage, wind speed, and rain probability.", bullet_style))
    story.append(Paragraph("• <b>Optimal Spray Window Indicator:</b> A clear Green/Yellow/Red badge tells you whether it is safe to spray fungicides/pesticides today. If rain is expected within 4 hours or wind speed exceeds 18 km/h, the system flags a <i>'High Washout Risk'</i> warning to save pesticide costs.", bullet_style))
    story.append(Paragraph("• <b>Evapotranspiration Guidance:</b> Alerts you when high heat and dry winds necessitate additional drip irrigation cycles.", bullet_style))
    story.append(Spacer(1, 14))

    # Section 7: AI Agronomist Voice Assistant
    story.append(Paragraph("7. 24/7 AI Agronomist Assistant", h1_style))
    story.append(Paragraph("An intelligent digital agronomist trained on university package-of-practices and agricultural ICAR guidelines:", body_style))
    story.append(Paragraph("• <b>Voice & Text Interaction:</b> Speak or type queries directly in Marathi, Hindi, or English (e.g., <i>'How to treat yellow leaves in tomato?'</i> or <i>'टमाटर में फल छेदक के लिए क्या उपाय करें?'</i>).", bullet_style))
    story.append(Paragraph("• <b>Context-Aware Answers:</b> Uses your logged-in farm profile (soil type, crop stage) to give tailored, precise recommendations.", bullet_style))
    story.append(Paragraph("• <b>Audio Response:</b> Integrated Web Speech synthesizes audio answers so farmers can listen hands-free in the field.", bullet_style))
    story.append(Spacer(1, 14))

    story.append(PageBreak())

    # Section 8: Government Schemes & Direct Application
    story.append(Paragraph("8. Government Schemes & Subsidy Navigator", h1_style))
    story.append(Paragraph("Finds verified state and central agricultural schemes you are eligible for:", body_style))
    story.append(Paragraph("• <b>Filter by Category:</b> Direct Income Support, Crop Insurance, Drip Irrigation Subsidies, Farm Mechanization, and Kisan Credit Cards (KCC).", bullet_style))
    story.append(Paragraph("• <b>Eligibility Breakdown:</b> View exact land ceiling criteria, required documents (Aadhaar, 7/12 land record, bank passbook), and direct official portal links (e.g., pmkisan.gov.in, pmfby.gov.in).", bullet_style))
    story.append(Spacer(1, 14))

    # Section 9: Offline Mode & Progressive Web App (PWA)
    story.append(Paragraph("9. Offline Capabilities & Mobile Installation", h1_style))
    story.append(Paragraph("Rural connectivity is often intermittent. SFAS is engineered to remain fully operational offline:", body_style))
    story.append(Paragraph("• <b>Automatic Offline Caching:</b> Once loaded, crop data, mandi prices, farm profiles, and edge AI disease detection run completely without internet.", bullet_style))
    story.append(Paragraph("• <b>Offline Status Indicator:</b> An amber badge alerts you whenever the connection drops, assuring you that cached calculations remain active.", bullet_style))
    story.append(Paragraph("• <b>Install as Mobile App (PWA):</b>", bullet_style))
    story.append(Paragraph("   1. Open the website on your smartphone Chrome browser.", bullet_style))
    story.append(Paragraph("   2. Tap the three dots menu (⋮) -> Select <b>'Install App'</b> or <b>'Add to Home Screen'</b>.", bullet_style))
    story.append(Paragraph("   3. The SFAS app icon appears on your phone launcher, opening in full-screen standalone mode without URL bars.", bullet_style))
    story.append(Spacer(1, 14))

    # Section 10: Troubleshooting & Quick Reference
    story.append(Paragraph("10. Troubleshooting & Support Checklist", h1_style))

    trouble_data = [
        ["Issue Observed", "Probable Cause", "Quick Resolution"],
        ["Prices or Crops not loading", "Backend server sleeping or offline", "Wait 30s for Render free tier or check connection"],
        ["Disease scan shows low confidence", "Blurry image or bad lighting", "Use close-up daylight photos from sample-dataset/"],
        ["Audio readout not speaking", "Browser voice permission muted", "Unmute device media volume & grant audio permissions"],
        ["Offline badge stays visible", "No network connection", "App uses cached data; it auto-syncs when online"]
    ]
    t_trouble = Table(trouble_data, colWidths=[130, 150, 224])
    t_trouble.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#334155")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#ffffff"), colors.HexColor("#f8fafc")]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
    ]))
    story.append(t_trouble)
    story.append(Spacer(1, 20))

    # Sign-off box
    signoff_data = [
        [Paragraph("<b>Smart Farmer Assistance System (SFAS)</b> — Empowering farmers through AI, transparency, and data-driven agronomy.", callout_style)]
    ]
    t_signoff = Table(signoff_data, colWidths=[letter[0]-108])
    t_signoff.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdf4")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#86efac")),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'CENTER')
    ]))
    story.append(t_signoff)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"✅ Successfully compiled tutorial PDF: {output_filename}")

if __name__ == "__main__":
    out_path = sys.argv[1] if len(sys.argv) > 1 else "USER_TUTORIAL_GUIDE.pdf"
    create_tutorial_pdf(out_path)
