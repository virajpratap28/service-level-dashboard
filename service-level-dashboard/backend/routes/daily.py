"""
routes/daily.py
----------------
Daily Dashboard: Daily Volume / Assigned / SLA / ASA.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from services import chart_service, excel_loader
from services.metrics import apply_filters, group_and_summarize
from .deps import DashboardFilters, get_filters

router = APIRouter(prefix="/daily", tags=["Daily Dashboard"])


@router.get("", summary="Daily KPI breakdown + charts")
def get_daily(filters: DashboardFilters = Depends(get_filters)):
    df = excel_loader.load_all()
    if df.empty:
        raise HTTPException(status_code=404, detail="No data available. Upload a workbook first.")

    filtered = apply_filters(
        df,
        lob=filters.lob,
        queue=filters.queue,
        site=filters.site,
        start_date=filters.start_date,
        end_date=filters.end_date,
    )

    records = group_and_summarize(filtered, "Date")
    charts = chart_service.build_daily_charts(records)

    return {"records": records, "charts": charts}
