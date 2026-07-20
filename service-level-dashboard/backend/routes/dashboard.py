"""
routes/dashboard.py
--------------------
Executive Dashboard: KPI cards + filter option lists + top-level
trend charts (Volume / Assigned / SLA / ASA / Abandonment trend).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from services import chart_service, excel_loader, metrics
from services.metrics import apply_filters, group_and_summarize, kpi_summary
from .deps import DashboardFilters, get_filters

router = APIRouter(prefix="/dashboard", tags=["Executive Dashboard"])


@router.get("", summary="Executive KPI summary + trend charts")
def get_dashboard(filters: DashboardFilters = Depends(get_filters)):
    df = excel_loader.load_all()
    if df.empty:
        raise HTTPException(
            status_code=404,
            detail="No data available. Upload an SL_*.xlsx workbook via POST /upload first.",
        )

    filtered = apply_filters(
        df,
        lob=filters.lob,
        queue=filters.queue,
        site=filters.site,
        start_date=filters.start_date,
        end_date=filters.end_date,
    )

    kpis = kpi_summary(filtered)

    daily_records = group_and_summarize(filtered, "Date")
    monthly_records = group_and_summarize(filtered, "Month")

    charts = {
        "volume_trend": chart_service.line_or_bar_dataset(
            daily_records, "Date", [("volume", "Volume", chart_service.PALETTE["pink"])]
        ),
        "assigned_trend": chart_service.line_or_bar_dataset(
            daily_records, "Date", [("assigned", "Assigned", chart_service.PALETTE["navy"])]
        ),
        "sla_trend": chart_service.line_or_bar_dataset(
            daily_records,
            "Date",
            [("under_2_sla.percentage", "Under 2 SLA %", chart_service.PALETTE["green"])],
        ),
        "asa_trend": chart_service.line_or_bar_dataset(
            daily_records, "Date", [("asa", "ASA (sec)", chart_service.PALETTE["amber"])]
        ),
        "abandonment_trend": chart_service.line_or_bar_dataset(
            daily_records,
            "Date",
            [("abandonment.percentage", "Abandonment %", chart_service.PALETTE["red"])],
        ),
        "monthly_volume": chart_service.line_or_bar_dataset(
            monthly_records, "Month", [("volume", "Volume", chart_service.PALETTE["pink"])], "bar"
        ),
    }

    return {
        "kpis": kpis,
        "charts": charts,
        "filters_applied": filters.model_dump(mode="json"),
    }


@router.get("/filters", summary="Available LOB / Queue / Site options for dropdowns")
def get_filter_options():
    df = excel_loader.load_all()
    if df.empty:
        return {"lob": [], "queue": [], "site": []}

    return {
        "lob": sorted(df["LOB"].dropna().unique().tolist()),
        "queue": sorted(df["Queue Name"].dropna().unique().tolist()),
        "site": sorted(df["Site"].dropna().unique().tolist()),
    }
