# app/routes/reports.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from io import BytesIO
from bson import ObjectId
import datetime

from app.database import reports_collection
from app.dependencies import get_current_user
router = APIRouter(tags=["reports"])
@router.get("/{report_id}/pdf")
async def download_report_pdf(report_id: str, current_user=Depends(get_current_user)):
    
    report = reports_collection.find_one({"report_id": report_id})

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=inch,
        leftMargin=inch,
        topMargin=inch,
        bottomMargin=inch
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(name='Title', fontSize=20, leading=24, alignment=1, spaceAfter=30)
    heading_style = ParagraphStyle(name='Heading2', fontSize=14, leading=18, spaceBefore=20, spaceAfter=12)
    normal_style = styles['Normal']

    elements = []

    elements.append(Paragraph("Auditable AI™ Governance Audit Report", title_style))
    elements.append(Paragraph(f"Report ID: {report_id}", normal_style))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"AI System: {report.get('ai_name', 'N/A')}", normal_style))
    elements.append(Paragraph(f"Evaluated: {report.get('evaluated_at', 'N/A')}", normal_style))
    elements.append(Spacer(1, 24))

    elements.append(Paragraph("Overall Assessment", heading_style))

    data = [
        ["Overall Score", f"{report.get('overall_score', 'N/A')}/100"],
        ["Risk Level", report.get('risk_level', 'N/A')],
        ["Logs Evaluated", report.get('logs_evaluated', 'N/A')],
    ]

    table = Table(data, colWidths=[3*inch, 3*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.lightblue),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 1, colors.black),
    ]))

    elements.append(table)
    elements.append(Spacer(1, 24))

    elements.append(Paragraph("Trusted AI Principles", heading_style))

    p_data = [["Principle", "Score"]]

    for p, d in report.get("trusted_ai_principles", {}).items():
        p_data.append([p, f"{d.get('score', 'N/A')}%"])

    p_table = Table(p_data, colWidths=[4*inch, 2*inch])
    p_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.lightgreen),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 1, colors.black),
    ]))

    elements.append(p_table)

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{report_id}.pdf"}
    )