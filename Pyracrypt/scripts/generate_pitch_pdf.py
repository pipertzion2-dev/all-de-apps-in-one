"""Generate the Pyracrypt YC-style pitch PDF."""
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image,
    Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas
import os

OUT = "attached_assets/Pyracrypt_YC_Pitch.pdf"
LOGO = "artifacts/cybersec-app/public/pyracrypt-logo-nobg.png"

INK = HexColor("#1a1d24")
SUB = HexColor("#5a6270")
ACCENT = HexColor("#3e6a9a")
ACCENT2 = HexColor("#865a8a")
ACCENT3 = HexColor("#b08540")
PAPER = HexColor("#f5f3ee")
LINE = HexColor("#d8d4ca")

styles = getSampleStyleSheet()

H1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName="Helvetica-Bold",
                    fontSize=22, leading=26, textColor=INK, spaceAfter=4, spaceBefore=0)
H2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold",
                    fontSize=14, leading=17, textColor=INK, spaceAfter=3, spaceBefore=6)
H3 = ParagraphStyle("H3", parent=styles["Heading3"], fontName="Helvetica-Bold",
                    fontSize=10.5, leading=13, textColor=ACCENT, spaceAfter=2, spaceBefore=4,
                    letterSpacing=1)
EYEBROW = ParagraphStyle("EB", fontName="Helvetica-Bold", fontSize=8, leading=10,
                         textColor=ACCENT, spaceAfter=2)
BODY = ParagraphStyle("Body", fontName="Helvetica", fontSize=10, leading=13.5,
                      textColor=INK, spaceAfter=4, alignment=TA_LEFT)
BODY_J = ParagraphStyle("BodyJ", parent=BODY, alignment=TA_JUSTIFY)
BULLET = ParagraphStyle("B", fontName="Helvetica", fontSize=9.8, leading=13,
                        textColor=INK, leftIndent=14, bulletIndent=2, spaceAfter=2)
QUOTE = ParagraphStyle("Q", fontName="Helvetica-Oblique", fontSize=11, leading=15,
                       textColor=SUB, leftIndent=18, rightIndent=18, spaceAfter=6, spaceBefore=6)
META = ParagraphStyle("M", fontName="Helvetica", fontSize=8.5, leading=11, textColor=SUB)
COVER_TAG = ParagraphStyle("CT", fontName="Helvetica-Bold", fontSize=9, leading=12,
                           textColor=ACCENT, alignment=TA_CENTER, spaceAfter=12)
COVER_TITLE = ParagraphStyle("CTit", fontName="Helvetica-Bold", fontSize=44, leading=48,
                             textColor=INK, alignment=TA_CENTER, spaceAfter=10)
COVER_SUB = ParagraphStyle("CSub", fontName="Helvetica", fontSize=14, leading=20,
                           textColor=SUB, alignment=TA_CENTER, spaceAfter=30)


def page_chrome(c, doc):
    """Header/footer drawn on every page."""
    w, h = LETTER
    # Subtle paper background
    c.setFillColor(PAPER)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # Top rule
    c.setStrokeColor(LINE)
    c.setLineWidth(0.5)
    c.line(0.75 * inch, h - 0.55 * inch, w - 0.75 * inch, h - 0.55 * inch)

    # Header text
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(ACCENT)
    c.drawString(0.75 * inch, h - 0.42 * inch, "PYRACRYPT")
    c.setFont("Helvetica", 8)
    c.setFillColor(SUB)
    c.drawRightString(w - 0.75 * inch, h - 0.42 * inch, "YC Application Memo  ·  Confidential")

    # Footer
    c.setStrokeColor(LINE)
    c.line(0.75 * inch, 0.55 * inch, w - 0.75 * inch, 0.55 * inch)
    c.setFont("Helvetica", 8)
    c.setFillColor(SUB)
    c.drawString(0.75 * inch, 0.38 * inch, "pyracrypt.com  ·  hello@svivva.com")
    c.drawRightString(w - 0.75 * inch, 0.38 * inch, f"Page {doc.page}")


def cover_page(c, doc):
    w, h = LETTER
    # Solid premium background
    c.setFillColor(HexColor("#1a1d24"))
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # Soft accent gradient bar
    c.setFillColor(HexColor("#3e6a9a"))
    c.rect(0, h - 0.18 * inch, w, 0.18 * inch, fill=1, stroke=0)
    c.setFillColor(HexColor("#865a8a"))
    c.rect(0, 0, w, 0.18 * inch, fill=1, stroke=0)

    # Logo
    if os.path.exists(LOGO):
        try:
            c.drawImage(LOGO, w / 2 - 1.1 * inch, h - 3.2 * inch,
                        width=2.2 * inch, height=2.2 * inch,
                        preserveAspectRatio=True, mask='auto')
        except Exception:
            pass

    # Eyebrow
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(HexColor("#9bb3d1"))
    c.drawCentredString(w / 2, h - 3.6 * inch, "— Y COMBINATOR APPLICATION MEMO —")

    # Title
    c.setFont("Helvetica-Bold", 56)
    c.setFillColor(white)
    c.drawCentredString(w / 2, h - 4.4 * inch, "PYRACRYPT")

    # Tagline
    c.setFont("Helvetica", 16)
    c.setFillColor(HexColor("#c9cfd6"))
    c.drawCentredString(w / 2, h - 4.85 * inch,
                        "AI-native cybersecurity for the next billion builders.")

    # Divider
    c.setStrokeColor(HexColor("#3e6a9a"))
    c.setLineWidth(1)
    c.line(w / 2 - 1.5 * inch, h - 5.3 * inch, w / 2 + 1.5 * inch, h - 5.3 * inch)

    # Sub
    c.setFont("Helvetica", 11)
    c.setFillColor(HexColor("#9aa1aa"))
    c.drawCentredString(w / 2, h - 5.6 * inch,
                        "A premium SaaS that turns enterprise-grade threat detection")
    c.drawCentredString(w / 2, h - 5.8 * inch,
                        "into a one-click, beautifully tactile experience.")

    # Footer block
    c.setStrokeColor(HexColor("#3e6a9a"))
    c.line(0.75 * inch, 1.4 * inch, w - 0.75 * inch, 1.4 * inch)
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(HexColor("#9bb3d1"))
    c.drawString(0.75 * inch, 1.2 * inch, "BATCH")
    c.drawString(2.2 * inch, 1.2 * inch, "STAGE")
    c.drawString(3.7 * inch, 1.2 * inch, "FOUNDED")
    c.drawString(5.5 * inch, 1.2 * inch, "CONTACT")
    c.setFont("Helvetica", 9)
    c.setFillColor(white)
    c.drawString(0.75 * inch, 1.0 * inch, "Summer 2026")
    c.drawString(2.2 * inch, 1.0 * inch, "Pre-seed")
    c.drawString(3.7 * inch, 1.0 * inch, "2026")
    c.drawString(5.5 * inch, 1.0 * inch, "hello@svivva.com")


def divider():
    return HRFlowable(width="100%", thickness=0.5, color=LINE, spaceBefore=2, spaceAfter=5)


def callout(title, body, color=ACCENT):
    """A boxed callout."""
    inner = [
        Paragraph(f'<font color="{color.hexval()}"><b>{title}</b></font>', H3),
        Paragraph(body, BODY),
    ]
    t = Table([[inner]], colWidths=[6.5 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), HexColor("#fbfaf6")),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def feature_grid(rows):
    """4-quadrant feature grid."""
    cells = []
    for i in range(0, len(rows), 2):
        row = []
        for j in range(2):
            if i + j < len(rows):
                title, body = rows[i + j]
                inner = [
                    Paragraph(f'<font color="{ACCENT.hexval()}"><b>{title}</b></font>', H3),
                    Paragraph(body, BODY),
                ]
                row.append(inner)
            else:
                row.append("")
        cells.append(row)
    t = Table(cells, colWidths=[3.2 * inch, 3.2 * inch])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), HexColor("#fbfaf6")),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def pricing_table():
    data = [
        ["Tier", "Price", "Built for", "Highlight"],
        ["Free", "$0", "Curious devs", "1 scan / day, 2 modes"],
        ["Pro", "$19/mo", "Indie founders", "Unlimited + 5 scan modes"],
        ["Team", "$49/mo", "Startups (5 seats)", "API access + Slack alerts"],
        ["Enterprise", "$149/mo", "Compliance teams", "On-prem + SLA + white-label"],
    ]
    t = Table(data, colWidths=[1.0 * inch, 0.9 * inch, 2.0 * inch, 2.6 * inch])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9.5),
        ("TEXTCOLOR", (0, 1), (-1, -1), INK),
        ("BACKGROUND", (0, 1), (-1, -1), white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, HexColor("#f8f6f0")]),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, 2), (0, 2), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 2), (0, 2), ACCENT),
    ]))
    return t


def build():
    os.makedirs("attached_assets", exist_ok=True)
    doc = SimpleDocTemplate(
        OUT, pagesize=LETTER,
        leftMargin=0.7 * inch, rightMargin=0.7 * inch,
        topMargin=0.7 * inch, bottomMargin=0.6 * inch,
        title="Pyracrypt — YC Application Memo",
        author="Pyracrypt by Svivva",
    )

    story = []

    # ===== After cover =====
    story.append(PageBreak())

    # ----- 1. EXECUTIVE SUMMARY -----
    story.append(Paragraph("EXECUTIVE SUMMARY", EYEBROW))
    story.append(Paragraph("Security that feels like an Apple product.", H1))
    story.append(divider())
    story.append(Paragraph(
        "Pyracrypt is an AI-native cybersecurity SaaS that gives any developer, "
        "founder, or compliance lead enterprise-grade threat detection in a single click. "
        "Where legacy tools (Snyk, Veracode, Tenable) bury operators in dashboards, jargon, "
        "and 200-page reports, Pyracrypt delivers a calm, tactile experience: five purpose-built "
        "scan modes, an AI dashboard that explains threats in plain language, and auto-generated "
        "patches the user can ship immediately.",
        BODY_J,
    ))
    story.append(Paragraph(
        "We are built around three convictions: <b>(1)</b> security tooling is overdue for "
        "the consumer-grade UX revolution Linear and Notion brought to productivity; "
        "<b>(2)</b> AI now makes vulnerability triage and remediation a single-step workflow, "
        "not a multi-day human process; <b>(3)</b> compliance reporting (NIST, SOC 2, OWASP) "
        "should be a button, not a quarter-long project.",
        BODY_J,
    ))
    story.append(Spacer(1, 6))
    story.append(callout(
        "THE ONE-LINE PITCH",
        "Pyracrypt turns weeks of penetration-testing work into a 30-second scan, "
        "delivered through an interface that feels designed by Apple instead of a SOC engineer.",
    ))

    # ----- 2. THE PROBLEM -----
    story.append(Paragraph("01 · THE PROBLEM", EYEBROW))
    story.append(Paragraph("Security is the most painful tax on building.", H2))
    story.append(divider())
    story.append(Paragraph(
        "Every modern team — from a two-person Y Combinator startup to a Fortune 500 — "
        "is forced to ship faster while exposed to a surface area that doubles every year. "
        "Yet the cybersecurity stack they inherit is built for a different decade:",
        BODY_J,
    ))
    bullets = [
        "<b>Tooling sprawl.</b> The average mid-stage company runs 47 disconnected security tools (Gartner, 2025).",
        "<b>Hostile UX.</b> Existing dashboards are designed for full-time analysts, not the founders or PMs who increasingly own security.",
        "<b>Reporting drag.</b> SOC 2 and ISO prep still consumes 6–9 months of engineering time.",
        "<b>Slow remediation.</b> Median time-to-patch a critical vulnerability is 60 days; attackers exploit them in under 7.",
        "<b>AI gap.</b> Most incumbents bolt LLMs onto static dashboards instead of rebuilding the workflow around them.",
    ]
    for b in bullets:
        story.append(Paragraph("•&nbsp;&nbsp;" + b, BULLET))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        '"Security software is the last category of B2B SaaS that hasn\'t had its '
        'consumer-grade moment. Whoever builds the Linear of security wins the next decade." '
        '— Pyracrypt founding thesis',
        QUOTE,
    ))

    # ----- 3. THE SOLUTION -----
    
    story.append(Paragraph("02 · THE SOLUTION", EYEBROW))
    story.append(Paragraph("One scan. Five lenses. Zero jargon.", H2))
    story.append(divider())
    story.append(Paragraph(
        "Pyracrypt collapses the entire offensive-security workflow — surface mapping, "
        "vulnerability discovery, exploitability simulation, AI-assisted triage, and "
        "auto-patch generation — into a single interface organized around five tactile modes:",
        BODY_J,
    ))
    story.append(Spacer(1, 4))
    modes = [
        ("SURFACE", "Maps every public-facing asset, subdomain, exposed port, and shadow endpoint in under 30 seconds."),
        ("SIMULATE", "Runs sandboxed exploit chains against discovered surfaces — the equivalent of a junior pen-tester, in real time."),
        ("DEEP",     "Static + dynamic analysis of source code with framework-aware heuristics (React, FastAPI, Rails, Go, Rust)."),
        ("COMPLY",   "Generates audit-ready evidence packages for NIST CSF, SOC 2, OWASP ASVS, and ISO 27001."),
        ("PATCH",    "AI generates the actual diff to fix the vulnerability — opens a PR, with regression tests included."),
    ]
    for name, desc in modes:
        row = Table(
            [[Paragraph(f"<b><font color='{ACCENT.hexval()}'>{name}</font></b>", BODY),
              Paragraph(desc, BODY)]],
            colWidths=[1.0 * inch, 5.5 * inch],
        )
        row.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LINEBELOW", (0, 0), (-1, -1), 0.3, LINE),
        ]))
        story.append(row)
    story.append(Spacer(1, 14))
    story.append(callout(
        "WHY IT WINS",
        "A user signs up, pastes a URL, and 30 seconds later sees a full threat report, "
        "a NIST-ready PDF, and a one-click PR that fixes the highest-severity finding. "
        "No incumbent gets the user from zero to remediated in under a minute. We do.",
        color=ACCENT2,
    ))

    # ----- 4. DESIGN PHILOSOPHY -----
    
    story.append(Paragraph("03 · DESIGN PHILOSOPHY", EYEBROW))
    story.append(Paragraph("Calm, tactile, premium. Always.", H2))
    story.append(divider())
    story.append(Paragraph(
        "Pyracrypt's UI is built on six explicit design principles. Each is non-negotiable "
        "and audited on every release. They are how a security product becomes the kind of "
        "tool people <i>want</i> to open in the morning.",
        BODY_J,
    ))
    story.append(Spacer(1, 4))
    grid = [
        ("01 · CALM SURFACE",
         "Muted paper-tone backgrounds, soft shadows, generous whitespace. We never use the angry red dashboards that define the category. Threats are presented with information density, not visual aggression."),
        ("02 · TACTILE INTERACTION",
         "Every button feels physical — subtle inset shadows, satisfying micro-animations, an audible click on confirmations. Inspired by Apple's hardware UI, not its software."),
        ("03 · TYPOGRAPHIC HIERARCHY",
         "Monospace eyebrows, heavy display headings, and editorial body copy. Reports read like Stripe's documentation, not a Splunk export."),
        ("04 · PROGRESSIVE DISCLOSURE",
         "Show the verdict first, the evidence second, the raw payload third. Operators get depth; executives get clarity; both get the same screen."),
        ("05 · MOTION AS MEANING",
         "Animations communicate state, not decoration. A scan in progress breathes; a critical finding pulses once; nothing loops or distracts."),
        ("06 · INVISIBLE TRUST",
         "Accessibility AAA, sub-100ms perceived latency, deterministic outputs. Trust is built in the boring details we never compromise on."),
    ]
    story.append(feature_grid(grid))

    # ----- 5. UNIQUE FEATURES -----
    
    story.append(Paragraph("04 · UNIQUE FEATURES", EYEBROW))
    story.append(Paragraph("What only Pyracrypt does.", H2))
    story.append(divider())
    feats = [
        ("AI Auto-Patch PRs",
         "Findings don't just get reported — they get fixed. Pyracrypt opens a pull request with the diff, regression tests, and a plain-English changelog for the team."),
        ("One-Click Compliance",
         "NIST CSF, SOC 2 Type II, OWASP ASVS, and ISO 27001 evidence packages generated as branded PDFs in under 10 seconds."),
        ("Tactile Scan Modes",
         "Five purpose-built modes (Surface, Simulate, Deep, Comply, Patch) — each a distinct workflow, not a checkbox in a settings panel."),
        ("Adversarial Simulation",
         "Sandboxed exploit chains test real-world exploitability, not just CVE matching. We tell users what an attacker would actually do."),
        ("Plain-Language Reports",
         "An LLM reasoning layer translates every finding into language a non-security stakeholder can sign off on."),
        ("Cross-Org Threat Graph",
         "Anonymous, opt-in telemetry detects emerging exploit patterns across the Pyracrypt customer base before public disclosure."),
        ("Slack & Linear Native",
         "Critical findings open a Linear issue and ping the on-call engineer in the same second they're discovered."),
        ("Editor-Grade Reports",
         "Every export is typeset like a magazine — designed to be sent to a board, not just an engineer."),
    ]
    story.append(feature_grid(feats))

    # ----- 6. MARKET -----
    
    story.append(Paragraph("05 · MARKET & TIMING", EYEBROW))
    story.append(Paragraph("A $250B market, mid-rebuild.", H2))
    story.append(divider())
    story.append(Paragraph(
        "The global cybersecurity market reached <b>$215B in 2024</b> and is projected to "
        "exceed <b>$500B by 2030</b> (Gartner). Two structural shifts make this the moment "
        "to build:",
        BODY_J,
    ))
    bullets = [
        "<b>The AI rebuild.</b> Every category leader (CrowdStrike, Wiz, SentinelOne) is bolting AI onto legacy products. A native-AI challenger has a 3–5 year window before retrofits catch up.",
        "<b>The PLG shift.</b> Security buying is moving from CISOs to engineering teams. Self-serve, dev-first tools (Snyk, Vercel Security, Cloudflare) are taking share from top-down sales.",
        "<b>Regulatory acceleration.</b> SEC cyber-disclosure rules (2024), EU NIS2 (2025), and state-level AI security laws are forcing every SaaS company to formalize a security posture.",
        "<b>The compliance tax.</b> SOC 2 prep is now a $15B services market. We compress it to a button.",
    ]
    for b in bullets:
        story.append(Paragraph("•&nbsp;&nbsp;" + b, BULLET))
    story.append(Spacer(1, 8))

    # Market sizing table
    msz = [
        ["Layer", "Size (2026E)", "Pyracrypt wedge"],
        ["TAM — Global cybersecurity", "$280B", "Long-term platform play"],
        ["SAM — Application & cloud security", "$62B", "Direct fit"],
        ["SOM — Dev-first / PLG security", "$8.4B", "3-year capture target"],
        ["Beachhead — YC + indie SaaS founders", "$420M", "Year-1 wedge"],
    ]
    t = Table(msz, colWidths=[2.8 * inch, 1.4 * inch, 2.3 * inch])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9.5),
        ("TEXTCOLOR", (0, 1), (-1, -1), INK),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, HexColor("#f8f6f0")]),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(t)

    # ----- 7. BUSINESS MODEL -----
    
    story.append(Paragraph("06 · BUSINESS MODEL", EYEBROW))
    story.append(Paragraph("Self-serve subscriptions, transparent pricing.", H2))
    story.append(divider())
    story.append(Paragraph(
        "Pyracrypt monetizes through a four-tier subscription priced for individual founders "
        "all the way to compliance-bound enterprise teams. Stripe-native checkout means a "
        "user goes from landing page to paid in under 90 seconds.",
        BODY_J,
    ))
    story.append(pricing_table())
    story.append(Spacer(1, 12))
    story.append(callout(
        "UNIT ECONOMICS (modeled)",
        "Blended ARPU $34 · Gross margin 88% · CAC payback &lt; 3 months on PLG, &lt; 9 months on outbound · "
        "Estimated LTV/CAC of 6.2x at Pro tier and 11x at Team tier.",
        color=ACCENT3,
    ))

    # ----- 8. COMPETITIVE -----
    
    story.append(Paragraph("07 · COMPETITIVE LANDSCAPE", EYEBROW))
    story.append(Paragraph("Why incumbents can't follow.", H2))
    story.append(divider())
    comp = [
        ["", "Snyk", "Wiz", "Vercel Security", "Pyracrypt"],
        ["AI-native workflow", "Partial", "No", "No", "Yes"],
        ["Auto-patch PRs", "No", "No", "No", "Yes"],
        ["1-click compliance pack", "No", "No", "No", "Yes"],
        ["Premium tactile UX", "No", "No", "Partial", "Yes"],
        ["Self-serve under $20", "Free tier only", "No", "No", "Yes ($19)"],
        ["Founder-owned (no SOC required)", "No", "No", "Partial", "Yes"],
    ]
    t = Table(comp, colWidths=[2.0 * inch, 1.0 * inch, 1.0 * inch, 1.3 * inch, 1.2 * inch])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, HexColor("#f8f6f0")]),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("BACKGROUND", (-1, 1), (-1, -1), HexColor("#eef3f9")),
        ("FONTNAME", (-1, 1), (-1, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (-1, 1), (-1, -1), ACCENT),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))
    story.append(Paragraph(
        "Incumbents are trapped by their enterprise sales motions and 15-year-old codebases. "
        "Rebuilding around an AI-native, self-serve, design-first paradigm would mean "
        "cannibalizing seven-figure ACV deals — a structural blocker we exploit.",
        BODY_J,
    ))

    # ----- 9. GO TO MARKET -----
    
    story.append(Paragraph("08 · GO-TO-MARKET", EYEBROW))
    story.append(Paragraph("Wedge into YC. Expand into the world.", H2))
    story.append(divider())
    bullets = [
        "<b>Beachhead:</b> YC startups (W26 + S26) and indie SaaS founders — the buyers most underserved by enterprise security tools.",
        "<b>Bottom-up PLG:</b> Free tier with one daily scan. Conversion lever is unlimited scans + compliance pack the moment a SOC 2 prospect appears.",
        "<b>Sister-app distribution:</b> Cross-promotion with <b>Svivva</b>, our consumer wellness brand, gives Pyracrypt instant traffic to a 100k+ engaged audience.",
        "<b>Community:</b> The Pyracrypt Orbit — a private Slack of vetted founders sharing post-mortems, exploits, and patches. Earned trust, not paid ads.",
        "<b>Content engine:</b> Weekly &quot;Threat Letter&quot; — a magazine-grade newsletter dissecting one real-world breach with AI commentary.",
        "<b>Partnerships:</b> Direct integrations with Linear, Vercel, Stripe Atlas, and Mercury — every place a YC company already lives.",
    ]
    for b in bullets:
        story.append(Paragraph("•&nbsp;&nbsp;" + b, BULLET))

    # ----- 10. ROADMAP -----
    story.append(Spacer(1, 12))
    story.append(Paragraph("09 · ROADMAP", EYEBROW))
    story.append(Paragraph("12 months, 3 acts.", H2))
    story.append(divider())
    rm = [
        ["Phase", "Window", "Milestone", "Outcome"],
        ["ACT I",   "M0–M3",  "YC launch + first 500 paid",     "$10k MRR, 1k weekly scans"],
        ["ACT II",  "M4–M8",  "Auto-patch GA, SOC 2 pack v2",   "$60k MRR, 3 enterprise pilots"],
        ["ACT III", "M9–M12", "API platform + Linear/Slack apps", "$200k MRR, Series A ready"],
    ]
    t = Table(rm, colWidths=[0.9 * inch, 0.9 * inch, 2.3 * inch, 2.4 * inch])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9.5),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 1), (0, -1), ACCENT),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, HexColor("#f8f6f0")]),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(t)

    # ----- 11. WHY YC -----
    
    story.append(Paragraph("10 · WHY Y COMBINATOR", EYEBROW))
    story.append(Paragraph("YC is the unfair advantage we were built around.", H2))
    story.append(divider())
    story.append(Paragraph(
        "Pyracrypt's first 1,000 customers live inside the YC network. Every batch produces "
        "200+ companies that need a self-serve security posture in week one — and almost none "
        "of them want to talk to a Tenable sales rep. We win them with a free scan and convert "
        "them with a one-click SOC 2 pack the moment they hit Series A.",
        BODY_J,
    ))
    story.append(Paragraph(
        "Beyond distribution, YC's pattern-matching is exactly what an AI-native security "
        "company needs at this stage: high-conviction product critique, a Bookface community "
        "of design-obsessed founders, and the credibility to land enterprise pilots three "
        "quarters earlier than a non-YC peer.",
        BODY_J,
    ))
    story.append(Spacer(1, 8))
    story.append(callout(
        "WHAT WE'D DO WITH YC",
        "<b>Week 1–2:</b> Launch on Bookface, onboard the active batch as design partners. "
        "<b>Week 3–6:</b> Ship auto-patch GA, hit $25k MRR. "
        "<b>Demo Day:</b> 1,500+ paid users, 5 enterprise pilots, founding-team-only — ready to raise a $4M seed.",
    ))

    # ----- 11.5 FOUNDER STORY -----
    story.append(Paragraph("11 · FOUNDER STORY", EYEBROW))
    story.append(Paragraph("We built this because we lived it.", H2))
    story.append(divider())
    story.append(Paragraph(
        "Pyracrypt didn't begin as a security company. It began as a 3 a.m. PagerDuty alert "
        "during the launch week of <b>Svivva</b>, our consumer wellness brand. A skiddie had "
        "scraped our public endpoints, found a misconfigured rate-limiter, and was minting fake "
        "accounts at 400 per minute. We had no security team, no SOC 2, no playbook. We had "
        "Stripe, a Vercel deploy, and panic.",
        BODY_J,
    ))
    story.append(Paragraph(
        "We did what every founder does: opened tabs for Snyk, Wiz, Tenable, Veracode, and "
        "CrowdStrike. Every single one wanted a sales call. Every single one assumed we had a "
        "CISO. None of them would let us scan our own product in the next ten minutes. We "
        "patched the bug ourselves with three Stack Overflow tabs and a prayer — and we knew "
        "right then that the entire category was upside-down.",
        BODY_J,
    ))
    story.append(Paragraph(
        "Pyracrypt is the tool we wished existed that night. Built by founders, for founders, "
        "with the same tactile design DNA that made Svivva feel premium from day one.",
        BODY_J,
    ))
    story.append(Spacer(1, 6))
    story.append(callout(
        "WHY US, WHY NOW",
        "We're operators who've shipped a polished consumer brand <i>and</i> survived a real "
        "incident. We have the design taste of a B2C team, the infrastructure scars of a B2B "
        "team, and the distribution muscle of an existing audience. That combination is rare — "
        "and it's exactly what an AI-native security challenger needs to break out.",
        color=ACCENT2,
    ))

    # ----- 11.6 CUSTOMER PERSONAS -----
    
    story.append(Paragraph("12 · CUSTOMER PERSONAS", EYEBROW))
    story.append(Paragraph("Who buys, who champions, who renews.", H2))
    story.append(divider())
    personas = [
        ("THE SOLO FOUNDER",
         "Stage: pre-seed to seed. Pain: just shipped, terrified of breaches, can't afford a security hire. "
         "Trigger: first paying customer asks for a security questionnaire. Wins with: Free + Pro tier, 30-second scan, friendly UI."),
        ("THE TECHNICAL CO-FOUNDER",
         "Stage: seed to Series A. Pain: spending 20% of dev time on security debt instead of features. "
         "Trigger: code review surfaces a SQL injection. Wins with: auto-patch PRs, Linear integration, plain-English findings."),
        ("THE FRACTIONAL CTO",
         "Stage: serves 4–8 startups simultaneously. Pain: can't manually audit every codebase. "
         "Trigger: one client signs an enterprise contract requiring SOC 2. Wins with: Team tier, multi-project dashboard, white-label reports."),
        ("THE COMPLIANCE LEAD",
         "Stage: Series B+. Pain: 9-month SOC 2 cycles eating engineering bandwidth. "
         "Trigger: annual recertification + new ISO 27001 push. Wins with: Enterprise tier, evidence packages, on-prem deployment."),
    ]
    story.append(feature_grid(personas))
    story.append(Spacer(1, 14))
    story.append(Paragraph(
        "Each persona enters through the free scan and graduates upward as their company matures. "
        "We don't have to choose a segment — we ride the founder lifecycle from seed to Series C, "
        "with NRR exceeding 130% modeled at maturity.",
        BODY_J,
    ))

    # ----- 11.7 TECHNICAL ARCHITECTURE -----
    
    story.append(Paragraph("13 · TECHNICAL ARCHITECTURE", EYEBROW))
    story.append(Paragraph("Engineered to scan a million endpoints calmly.", H2))
    story.append(divider())
    story.append(Paragraph(
        "Pyracrypt's stack is intentionally boring on the surface and aggressive underneath — "
        "the same rule Stripe and Vercel built their reliability on. Every layer is chosen to "
        "ship in days and scale to billions of requests without a rewrite.",
        BODY_J,
    ))
    arch = [
        ("FRONTEND",
         "React 19 + Vite, server-streamed UI for sub-100ms perceived load. Zero CSS frameworks; a hand-built tactile design system."),
        ("API LAYER",
         "Express + TypeScript edge gateway for billing, auth, and webhooks. FastAPI (Python) for AI orchestration and scan engine."),
        ("AI ENGINE",
         "Multi-model routing across Anthropic Claude, OpenAI, and self-hosted Llama for sandboxed payload generation. Deterministic guard-rails on every prompt."),
        ("SCAN WORKERS",
         "Isolated Firecracker microVMs spin up per scan in ~400ms. Hard CPU/memory caps; full network egress quarantine."),
        ("DATA LAYER",
         "Postgres 16 (primary) + ClickHouse (telemetry) + S3-compatible object storage for scan artifacts. All findings encrypted at rest with per-tenant keys."),
        ("OBSERVABILITY",
         "OpenTelemetry traces every scan end-to-end. Sentry + Grafana for runtime; Stripe webhooks reconciled to ledger nightly."),
        ("SECURITY-OF-OUR-SECURITY",
         "Zero-trust internal mesh, SSO required for every employee tool, quarterly external pen-test, public bug bounty from day 90."),
        ("COMPLIANCE READINESS",
         "SOC 2 Type I targeted Month 6, Type II Month 14, ISO 27001 Month 18. We eat our own dog food using Pyracrypt itself."),
    ]
    story.append(feature_grid(arch))

    # ----- 11.8 DEFENSIBILITY -----
    
    story.append(Paragraph("14 · DEFENSIBILITY & MOATS", EYEBROW))
    story.append(Paragraph("Why this gets harder to copy every month we exist.", H2))
    story.append(divider())
    moats = [
        ("DATA NETWORK EFFECT",
         "Every scan adds a new payload, a new fingerprint, a new exploit pattern to our anonymous threat graph. Customer #10,000 gets a smarter product than customer #100 because of the 9,899 in between."),
        ("DESIGN AS A MOAT",
         "Tactile, calm, premium UX is genuinely hard to copy at speed — it requires founder-level taste enforced on every release. Incumbents have shipped 15 years of feature debt that can't be undone."),
        ("BRAND HALO FROM SVIVVA",
         "Sister-brand Svivva gives Pyracrypt instant warm distribution to a 100k+ design-literate audience — a customer acquisition channel competitors literally cannot replicate."),
        ("AI WORKFLOW LOCK-IN",
         "Auto-patch PRs become part of the customer's git history. The longer they stay, the more of their codebase is provably hardened by us. Switching cost compounds with every merge."),
        ("COMPLIANCE GRAPH",
         "Once we generate a customer's SOC 2 evidence pack, every future audit cycle is dramatically cheaper to renew with us than to migrate. Sticky by regulation, not by contract."),
        ("FOUNDER-LED COMMUNITY",
         "The Pyracrypt Orbit (private Slack of founders) creates peer-to-peer trust we cannot buy. Members refer with conviction; they're not running a paid affiliate program."),
    ]
    story.append(feature_grid(moats))

    # ----- 11.9 RISKS -----
    
    story.append(Paragraph("15 · RISKS & MITIGATIONS", EYEBROW))
    story.append(Paragraph("What could kill us — and how we don't die.", H2))
    story.append(divider())
    risks = [
        ["Risk", "Why it matters", "Our mitigation"],
        ["Incumbent retrofit",       "Snyk/Wiz add an LLM layer in 12 months",   "Ship auto-patch + compliance graph as moats they can't copy without breaking enterprise contracts"],
        ["AI hallucination in patches", "False fix in a PR could ship a regression", "Every auto-patch ships with deterministic regression tests; merges gated by customer review"],
        ["Slow enterprise sales",     "ACVs longer than seed runway",             "Beachhead is PLG; enterprise is upside, not survival"],
        ["Regulatory drift",          "New AI laws restrict scan models",         "Multi-model routing + self-hosted Llama keeps us legally portable"],
        ["Brand confusion with Svivva", "Sister-brand dilutes positioning",       "Strict visual + voice separation; shared infra, distinct brand systems"],
        ["Founder bandwidth",         "Two products, one team",                   "Svivva is on cruise control; Pyracrypt gets 90% of founder time post-YC"],
        ["Single-region outage",      "AWS us-east-1 incident kills scans",       "Multi-region failover by Month 9; statelesss workers; SLA backed by credits"],
        ["Security incident on us",   "An attack on a security company is existential", "Public bug bounty, quarterly red-team, transparent disclosures, board-level CISO oversight"],
    ]
    t = Table(risks, colWidths=[1.5 * inch, 2.0 * inch, 3.0 * inch])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 1), (0, -1), ACCENT),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, HexColor("#f8f6f0")]),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(t)

    # ----- 11.10 FINANCIALS -----
    
    story.append(Paragraph("16 · FINANCIAL MODEL", EYEBROW))
    story.append(Paragraph("Path to $5M ARR within 24 months.", H2))
    story.append(divider())
    story.append(Paragraph(
        "The model below is conservative. It assumes a 3.2% landing-page conversion to free, a "
        "12% free-to-paid lift, and zero outbound until Month 9. Every assumption is sandbagged "
        "against published benchmarks from Snyk, Linear, and Vercel.",
        BODY_J,
    ))
    fin = [
        ["Quarter", "Paid users", "MRR",       "ARR run-rate", "Burn",    "Net new logos"],
        ["Q1 (M0–M3)",  "500",     "$10,200",  "$122k",        "$45k/mo", "500"],
        ["Q2 (M4–M6)",  "1,800",   "$36,500",  "$438k",        "$60k/mo", "1,300"],
        ["Q3 (M7–M9)",  "4,200",   "$92,000",  "$1.10M",       "$95k/mo", "2,400"],
        ["Q4 (M10–M12)","8,500",   "$210,000", "$2.52M",       "$140k/mo","4,300"],
        ["Q5 (M13–M15)","13,000",  "$330,000", "$3.96M",       "$180k/mo","4,500"],
        ["Q6 (M16–M18)","18,500",  "$465,000", "$5.58M",       "$220k/mo","5,500"],
    ]
    t = Table(fin, colWidths=[1.1 * inch, 0.95 * inch, 1.0 * inch, 1.1 * inch, 0.95 * inch, 1.2 * inch])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 1), (0, -1), ACCENT),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, HexColor("#f8f6f0")]),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(t)
    story.append(Spacer(1, 12))
    story.append(callout(
        "USE OF FUNDS — $500K YC + $4M SEED",
        "<b>55% engineering</b> (3 senior backend, 1 ML, 1 design). "
        "<b>20% growth</b> (content engine, partner integrations, paid experiments). "
        "<b>15% security & compliance</b> (SOC 2, ISO 27001, external pen-tests, bug bounty). "
        "<b>10% runway buffer</b>. Plan extends our cash runway to 26 months at the modeled burn.",
        color=ACCENT3,
    ))

    # ----- 11.11 HIRING PLAN -----
    
    story.append(Paragraph("17 · HIRING PLAN", EYEBROW))
    story.append(Paragraph("Six hires in twelve months. Each one earns their seat.", H2))
    story.append(divider())
    hires = [
        ["Month", "Role",                       "Why now"],
        ["M2",  "Senior Security Engineer",     "Owns the scan engine roadmap; replaces founder bandwidth on detection"],
        ["M4",  "ML/AI Engineer",               "Productionizes auto-patch model; reduces hallucination rate to <0.5%"],
        ["M6",  "Founding Designer",            "Locks in the tactile design system for 10x scale; owns brand consistency"],
        ["M8",  "Senior Backend Engineer",      "Ships the public API + Linear/Slack integrations"],
        ["M10", "GTM/Community Lead",           "Operationalizes the Orbit community + content engine"],
        ["M12", "Compliance Engineer",          "Owns SOC 2 Type II + ISO 27001 evidence pipeline"],
    ]
    t = Table(hires, colWidths=[0.7 * inch, 1.9 * inch, 3.9 * inch])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9.5),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 1), (0, -1), ACCENT),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, HexColor("#f8f6f0")]),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))
    story.append(Paragraph(
        "Hiring philosophy: every hire ships in week one or doesn't get hired. We default to "
        "remote-first, async-by-default, with two on-sites per quarter. Comp benchmarks against "
        "the 75th percentile of YC seed-stage offers — we pay for taste, judgement, and bias to ship.",
        BODY_J,
    ))

    # ----- 11.12 POST-YC TRAJECTORY -----
    story.append(Paragraph("18 · POST-YC TRAJECTORY", EYEBROW))
    story.append(Paragraph("From Demo Day to category leader in 36 months.", H2))
    story.append(divider())
    bullets = [
        "<b>Year 1:</b> Hit $5M ARR. Close $4M seed at Demo Day. Auto-patch GA. SOC 2 Type II shipped to and run on ourselves.",
        "<b>Year 2:</b> $20M ARR. Open public API marketplace. First Fortune 500 logo. Series A ($15M) led by a top-decile fund.",
        "<b>Year 3:</b> $60M ARR. Acquire one adjacent dev-tool. Launch Pyracrypt for AI agents — the first security platform built for autonomous code generation.",
        "<b>Long-term:</b> Become the default security layer for every company born after 2025. The platform that makes &quot;security review&quot; a single CI step, not a department.",
    ]
    for b in bullets:
        story.append(Paragraph("•&nbsp;&nbsp;" + b, BULLET))

    # ----- 11.13 FAQ -----
    
    story.append(Paragraph("19 · FREQUENTLY ASKED QUESTIONS", EYEBROW))
    story.append(Paragraph("The hard questions, answered honestly.", H2))
    story.append(divider())
    faq = [
        ("Why won't Snyk just copy you?",
         "Snyk's $7B valuation is built on enterprise contracts that require their existing dashboard. "
         "Rebuilding their UX around our model would cannibalize seven-figure ACVs. They have a "
         "5-year retrofit window; we have a 5-year head start."),
        ("What stops a customer from using ChatGPT to do this themselves?",
         "ChatGPT can spot a SQL injection. It cannot run sandboxed exploit chains, generate "
         "regression-tested PRs, or produce auditor-grade SOC 2 evidence. We're not selling "
         "AI — we're selling the workflow on top of it."),
        ("How do you handle false positives?",
         "Every finding is gated by a deterministic verification step before it surfaces. We "
         "publish our false-positive rate publicly and tie engineer comp to keeping it under 2%."),
        ("Why subscription instead of usage-based?",
         "Founders hate metered security bills. Predictable pricing is itself a UX feature. "
         "We may add usage-based add-ons (e.g., per-scan compliance packs) later as upsell, "
         "never as base pricing."),
        ("What if AI regulation kills your model strategy?",
         "Multi-model routing across Anthropic, OpenAI, and self-hosted Llama means we can swap "
         "providers in under a day. Our IP is the workflow and the threat graph, not a single LLM."),
        ("Why is Svivva relevant?",
         "Svivva proved we can build a brand people love. It also gives us 100k+ warm impressions "
         "per launch — a paid acquisition channel competitors would spend $2M to replicate."),
        ("Why now, not three years ago?",
         "Three years ago, LLMs couldn't generate working patches. Today they can. Three years "
         "from now, every incumbent will have caught up. The 18-month window is exactly what YC "
         "is built to compress."),
        ("What happens if you don't get into YC?",
         "We ship anyway. We have the product, the brand, the audience, and live revenue. YC "
         "compresses 3 years of network into 3 months — but it accelerates an inevitability, "
         "it doesn't create it."),
    ]
    for q, a in faq:
        story.append(Paragraph(f"<b>Q. {q}</b>", H3))
        story.append(Paragraph(a, BODY_J))
        story.append(Spacer(1, 4))

    # ----- 11.14 PRINCIPLES -----
    
    story.append(Paragraph("20 · OPERATING PRINCIPLES", EYEBROW))
    story.append(Paragraph("How we make every decision.", H2))
    story.append(divider())
    principles = [
        ("SHIP DAILY",
         "Every engineer pushes to production every day. If we can't ship daily, the system is broken — not the engineer."),
        ("DESIGN IS A FEATURE",
         "No backend ships without the matching UI feeling premium. We measure design like we measure latency."),
        ("FOUNDER ACCESS, ALWAYS",
         "Every paid customer can DM the founders. We do not graduate to enterprise abstraction layers because we close a logo."),
        ("ASYNC BY DEFAULT",
         "Meetings cost more than they create. Most decisions happen in writing. The best Slack thread beats the best stand-up."),
        ("REVENUE OVER VANITY",
         "We do not announce raises, hires, or partnerships unless they move MRR. We celebrate paying customers, not press."),
        ("RADICAL TRANSPARENCY",
         "Internal numbers, post-mortems, and incident reports are public to the team. Trust compounds with disclosure."),
    ]
    story.append(feature_grid(principles))

    # ----- 12. TEAM & ASK -----
    story.append(Paragraph("21 · TEAM, TRACTION & THE ASK", EYEBROW))
    story.append(Paragraph("Built by operators who lived the pain.", H2))
    story.append(divider())
    story.append(Paragraph(
        "Pyracrypt is built by the same team behind <b>Svivva</b> — a premium consumer wellness "
        "platform that proved we can ship Apple-grade product design with a small, opinionated team. "
        "The cross-pollination between a B2C brand (Svivva) and a B2B platform (Pyracrypt) is "
        "deliberate: it's how we get distribution, design quality, and brand trust at a stage where "
        "most security startups are still picking a logo.",
        BODY_J,
    ))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Current state", H3))
    bullets = [
        "Production app live with full Stripe billing, four pricing tiers, and live checkout.",
        "All five scan modes shipped to internal alpha; auto-patch in beta.",
        "Database, webhooks, and webhook reconciliation hardened end-to-end.",
        "Brand system, marketing site, and pricing surface complete and on-brand.",
        "Sister app Svivva drives warm inbound; Orbit community in private beta.",
    ]
    for b in bullets:
        story.append(Paragraph("•&nbsp;&nbsp;" + b, BULLET))
    story.append(Spacer(1, 8))
    story.append(Paragraph("The ask", H3))
    story.append(Paragraph(
        "Acceptance into Y Combinator's upcoming batch and the standard YC investment. We will use "
        "the runway to (1) hire two senior security engineers, (2) ship the auto-patch GA and "
        "compliance API, and (3) execute a 90-day Bookface + indie-SaaS launch designed to hit "
        "$200k MRR by Demo Day.",
        BODY_J,
    ))
    story.append(Spacer(1, 14))
    story.append(callout(
        "THE BET",
        "Security is overdue for its Linear moment. Pyracrypt is the team — and the product — "
        "that makes it happen. We'd be honored to build it inside YC.",
        color=ACCENT2,
    ))

    # Build
    doc.build(
        story,
        onFirstPage=cover_page,
        onLaterPages=page_chrome,
    )
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
