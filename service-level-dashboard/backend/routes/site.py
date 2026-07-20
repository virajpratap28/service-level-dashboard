"""
routes/site.py
---------------
Site Analysis: per-site Assigned / SLA / ASA / AHT + insight callouts
(best performing site, highest SLA site, highest traffic site).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from services import chart_service, excel_loader
from services.metrics import apply_filters, group_and_summarize, group_and_summarize_multi, top_n
from .deps import DashboardFilters, get_filters

router = APIRouter(prefix="/site", tags=["Site Analysis"])


@router.get("", summary="Site-level KPI breakdown + insights + charts")
def get_site_analysis(filters: DashboardFilters = Depends(get_filters)):
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

    records = group_and_summarize(filtered, "Site")
    charts = chart_service.build_site_charts(records)

    highest_sla = sorted(records, key=lambda r: r["under_2_sla"]["percentage"], reverse=True)[:1]

    insights = {
        "best_performing_site": _first_or_none(highest_sla),
        "highest_sla_site": _first_or_none(highest_sla),
        "highest_traffic_site": _first_or_none(top_n(records, "assigned", 1)),
        "highest_asa_site": _first_or_none(top_n(records, "asa", 1)),
    }

    return {"records": records, "charts": charts, "insights": insights}


@router.get("/sla-trend", summary="Under-2-minute SLA %, one trend line per site")
def get_sla_trend_by_site(target: float = 80, filters: DashboardFilters = Depends(get_filters)):
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

    daily_site_records = group_and_summarize_multi(filtered, ["Site", "Date"])

    labels = sorted({str(r["Date"]) for r in daily_site_records})
    label_index = {d: i for i, d in enumerate(labels)}

    by_site: dict[str, list] = {}
    for r in daily_site_records:
        site = r["Site"]
        by_site.setdefault(site, [None] * len(labels))
        by_site[site][label_index[str(r["Date"])]] = r["under_2_sla"]["percentage"]

    series = [{"site": site, "data": data} for site, data in sorted(by_site.items())]

    return {"labels": labels, "series": series, "target": target}


def _first_or_none(items: list[dict]):
    return items[0] if items else None
