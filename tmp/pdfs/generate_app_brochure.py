from reportlab.lib.pagesizes import A3, landscape
from reportlab.lib.colors import HexColor, white
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import os

OUT_PATH = r"output/pdf/intring-auditable-ai-brochure-a3.pdf"
LOGO_PATH = r"frontend/public/kpmg-logo.png"

W, H = landscape(A3)

c = canvas.Canvas(OUT_PATH, pagesize=landscape(A3))

# Palette
NAVY = HexColor("#00338D")
BLUE = HexColor("#005EB8")
TEAL = HexColor("#00A3A1")
LIGHT = HexColor("#F4F8FC")
MID = HexColor("#DCE7F4")
TEXT = HexColor("#12263A")
MUTED = HexColor("#4B5B70")

# Background bands
c.setFillColor(LIGHT)
c.rect(0, 0, W, H, fill=1, stroke=0)
c.setFillColor(HexColor("#EAF2FB"))
c.rect(0, H - 55*mm, W, 55*mm, fill=1, stroke=0)

# Header panel
margin = 16 * mm
header_h = 42 * mm
c.setFillColor(NAVY)
c.roundRect(margin, H - margin - header_h, W - 2*margin, header_h, 8, fill=1, stroke=0)

# KPMG logo
if os.path.exists(LOGO_PATH):
    logo = ImageReader(LOGO_PATH)
    c.drawImage(logo, margin + 10*mm, H - margin - header_h + 10*mm, width=35*mm, height=22*mm, mask='auto', preserveAspectRatio=True)
else:
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(margin + 10*mm, H - margin - header_h + 16*mm, "KPMG")

# Title/subtitle
c.setFillColor(white)
c.setFont("Helvetica-Bold", 28)
c.drawString(margin + 52*mm, H - margin - 15*mm, "IntrinG Auditable AI")
c.setFont("Helvetica", 12)
c.drawString(margin + 52*mm, H - margin - 24*mm, "One-page platform summary (repo-evidenced)")

# Grid layout
gap = 8 * mm
content_top = H - margin - header_h - 8*mm
col_w = (W - 2*margin - 2*gap) / 3
x1 = margin
x2 = margin + col_w + gap
x3 = margin + 2*(col_w + gap)

def draw_card(x, y_top, w, h, title):
    c.setFillColor(white)
    c.roundRect(x, y_top - h, w, h, 6, fill=1, stroke=0)
    c.setStrokeColor(MID)
    c.setLineWidth(1)
    c.roundRect(x, y_top - h, w, h, 6, fill=0, stroke=1)
    c.setFillColor(BLUE)
    c.rect(x, y_top - 9*mm, w, 9*mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(x + 4*mm, y_top - 6.3*mm, title)


def draw_wrapped_text(text, x, y, w, size=9.2, leading=12, color=TEXT, bullet=False):
    from reportlab.pdfbase.pdfmetrics import stringWidth
    c.setFont("Helvetica", size)
    c.setFillColor(color)
    lines = []
    for para in text.split("\n"):
        words = para.split()
        if not words:
            lines.append("")
            continue
        line = words[0]
        for word in words[1:]:
            trial = line + " " + word
            if stringWidth(trial, "Helvetica", size) <= w:
                line = trial
            else:
                lines.append(line)
                line = word
        lines.append(line)
    yy = y
    for i, ln in enumerate(lines):
        if bullet and i == 0:
            c.drawString(x, yy, u"- " + ln)
        elif bullet:
            c.drawString(x + 4*mm, yy, ln)
        else:
            c.drawString(x, yy, ln)
        yy -= leading
    return yy

# Card 1: What it is + who it's for
h1 = 58 * mm
draw_card(x1, content_top, col_w, h1, "What It Is")
y = content_top - 14*mm
y = draw_wrapped_text(
    "IntrinG Auditable AI is a FastAPI + React platform that registers AI systems, ingests logs, runs governance evaluations, and produces reports (including PDF exports) using KPMG Trusted AI-style principles.",
    x1 + 4*mm, y, col_w - 8*mm, size=9.3, leading=11.5
)

draw_card(x1, content_top - h1 - gap, col_w, 36*mm, "Who It's For")
y2 = content_top - h1 - gap - 14*mm
draw_wrapped_text(
    "Primary persona: AI auditor / governance team member who needs repeatable evidence, risk scoring, and reviewable audit outputs for AI systems.",
    x1 + 4*mm, y2, col_w - 8*mm, size=9.3, leading=11.5
)

# Card 2: key features
h2 = 102 * mm
draw_card(x2, content_top, col_w, h2, "What It Does (Key Features)")
features = [
    "JWT-based auth (register, login, profile fetch/update).",
    "Register AI systems with connector metadata (type, endpoint, headers).",
    "Ingest CSV/Excel logs through SDCC pipeline with schema/column quality checks.",
    "Evaluate systems into principle scores, risk level, findings, and framework alignment flags.",
    "Run black-box audits in API or UI mode, with audit history and detailed retrieval.",
    "Generate and download report PDFs from stored report IDs.",
    "Chrome extension endpoint scores captured probe responses from browser audits."
]
y = content_top - 14*mm
for item in features:
    y = draw_wrapped_text(item, x2 + 4*mm, y, col_w - 8*mm, size=8.9, leading=10.8, bullet=True)
    y -= 1

# Card 3: architecture + run
h3a = 72 * mm
draw_card(x3, content_top, col_w, h3a, "How It Works (Repo-Evidenced)")
arch = [
    "React (Vite) frontend calls backend at http://localhost:8000 via axios service.",
    "FastAPI app mounts auth, AI eval/ingest, blackbox, reports, and extension routers.",
    "MongoDB collections store users, AI systems, SDCC results, reports, blackbox audits.",
    "Data flow: Register AI -> Ingest logs -> Evaluate -> Store report -> View/Download PDF.",
    "Optional flow: Chrome extension collects probes -> /api/v1/audit/score computes results."
]
y = content_top - 14*mm
for item in arch:
    y = draw_wrapped_text(item, x3 + 4*mm, y, col_w - 8*mm, size=8.9, leading=10.8, bullet=True)
    y -= 1

h3b = 54 * mm
draw_card(x3, content_top - h3a - gap, col_w, h3b, "How To Run (Minimal)")
steps = [
    "Backend deps: pip install -r backend/requirements.txt",
    "Set env vars used by code: MONGO_URI and SECRET_KEY.",
    "Start backend: uvicorn app.main:app --reload (from backend/).",
    "Start frontend: npm install && npm run dev (from frontend/).",
    "Open Vite URL (default localhost:5173) and sign in.",
    "Not found in repo: one canonical root-level setup guide/example .env file."
]
y = content_top - h3a - gap - 14*mm
for s in steps:
    y = draw_wrapped_text(s, x3 + 4*mm, y, col_w - 8*mm, size=8.9, leading=10.8, bullet=True)
    y -= 1

# Footer
c.setFillColor(MUTED)
c.setFont("Helvetica", 8.5)
c.drawRightString(W - margin, 8*mm, "Compiled from repository evidence only | Generated brochure summary")

c.showPage()
c.save()
print(OUT_PATH)
