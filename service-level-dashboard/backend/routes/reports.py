"""
routes/reports.py
------------------
Reports Page backend: upload new SL_*.xlsx workbooks, list what's
currently loaded, and export the (optionally filtered) dataset as
CSV or a summary PDF.
"""

from __future__ import annotations

import io
from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from services import excel_loader
from services.metrics import apply_filters, kpi_summary
from .deps import DashboardFilters, get_filters

router = APIRouter(tags=["Reports"])


@router.post("/upload", summary="Upload a new SL_*.xlsx workbook")
async def upload_workbook(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only .xlsx / .xls files are supported.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        dest = excel_loader.save_upload(file.filename, content)
        excel_loader.load_all(force_reload=True)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail=f"Failed to process workbook: {exc}") from exc

    return {
        "message": "Workbook uploaded and indexed successfully.",
        "filename": dest.name,
        "available_files": excel_loader.list_available_files(),
    }


@router.get("/reports/files", summary="List workbooks currently loaded")
def list_files():
    return {"files": excel_loader.list_available_files()}


@router.get("/reports/export/csv", summary="Export filtered dataset as CSV")
def export_csv(filters: DashboardFilters = Depends(get_filters)):
    df = excel_loader.load_all()
    if df.empty:
        raise HTTPException(status_code=404, detail="No data available.")

    filtered = apply_filters(
        df,
        lob=filters.lob,
        queue=filters.queue,
        site=filters.site,
        start_date=filters.start_date,
        end_date=filters.end_date,
    )

    export_cols = [c for c in filtered.columns if not c.startswith("__")]
    buf = io.StringIO()
    filtered[export_cols].to_csv(buf, index=False)
    buf.seek(0)

    filename = f"sl_dashboard_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/reports/export/pdf", summary="Export filtered KPI summary as PDF")
def export_pdf(filters: DashboardFilters = Depends(get_filters)):
    df = excel_loader.load_all()
    if df.empty:
        raise HTTPException(status_code=404, detail="No data available.")

    filtered = apply_filters(
        df,
        lob=filters.lob,
        queue=filters.queue,
        site=filters.site,
        start_date=filters.start_date,
        end_date=filters.end_date,
    )
    kpis = kpi_summary(filtered)

    pdf_bytes = _render_kpi_pdf(kpis, filters)
    filename = f"sl_dashboard_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _render_kpi_pdf(kpis: dict, filters: DashboardFilters) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, title="SL Dashboard Summary")
    styles = getSampleStyleSheet()
    elements = [
        Paragraph("Service Level Dashboard — KPI Summary", styles["Title"]),
        Paragraph(
            f"LOB: {filters.lob or 'All'} | Queue: {filters.queue or 'All'} | "
            f"Site: {filters.site or 'All'} | Range: {filters.start_date or '-'} to {filters.end_date or '-'}",
            styles["Normal"],
        ),
        Spacer(1, 10 * mm),
    ]

    rows = [
        ["KPI", "Value"],
        ["Volume", kpis["volume"]],
        ["Assigned", kpis["assigned"]],
        ["Offered Completed", kpis["offered_completed"]],
        ["Under 2 SLA %", f"{kpis['under_2_sla']['percentage']}%"],
        ["Under 2 SLA (count)", kpis["under_2_sla"]["count"]],
        ["SLA Breached %", f"{kpis['sla_breached']['percentage']}%"],
        ["SLA Breached (count)", kpis["sla_breached"]["count"]],
        ["Abandonment %", f"{kpis['abandonment']['percentage']}%"],
        ["Abandonment (count)", kpis["abandonment"]["count"]],
        ["ASA (sec)", kpis["asa"]],
        ["AHT (sec)", kpis["aht"]],
        ["Occupancy %", f"{kpis['occupancy']}%"],
        ["Longest Wait (sec)", kpis["longest_wait"]],
        ["Longest Queue (sec)", kpis["longest_queue"]],
        ["Variance %", f"{kpis['variance']}%"],
    ]

    table = Table(rows, colWidths=[80 * mm, 60 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#002864")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F2F1F0")]),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(table)
    doc.build(elements)
    return buf.getvalue()
