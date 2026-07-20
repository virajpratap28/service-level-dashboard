"""
routes/queue.py
----------------
Queue Analysis: per-queue Assigned / SLA / ASA / AHT / Abandonment +
insight callouts (highest traffic, highest ASA, highest abandonment).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from services import chart_service, excel_loader
from services.metrics import apply_filters, group_and_summarize, group_and_summarize_multi, peak_day, top_n
from .deps import DashboardFilters, get_filters

router = APIRouter(prefix="/queue", tags=["Queue Analysis"])


@router.get("", summary="Queue-level KPI breakdown + insights + charts")
def get_queue_analysis(filters: DashboardFilters = Depends(get_filters)):
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

    records = group_and_summarize(filtered, "Queue Name")
    charts = chart_service.build_queue_charts(records)

    insights = {
        "highest_traffic_queue": _first_or_none(top_n(records, "assigned", 1)),
        "highest_asa_queue": _first_or_none(top_n(records, "asa", 1)),
        "highest_abandonment_queue": _first_or_none(
            sorted(records, key=lambda r: r["abandonment"]["percentage"], reverse=True)[:1]
        ),
    }

    return {"records": records, "charts": charts, "insights": insights}


@router.get("/wait-drilldown", summary="Queues ranked by ASA, with per-queue site (L3) breakdown")
def get_wait_drilldown(
    min_assigned: int = 100,
    filters: DashboardFilters = Depends(get_filters),
):
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

    queue_records = [r for r in group_and_summarize(filtered, "Queue Name") if r["assigned"] >= min_assigned]
    queue_records.sort(key=lambda r: r["asa"], reverse=True)

    site_records = group_and_summarize_multi(filtered, ["Queue Name", "Site"])

    queues = []
    for q in queue_records:
        qname = q["Queue Name"]
        sites = sorted(
            [
                {
                    "site": r["Site"],
                    "asa": r["asa"],
                    "sla_pct": r["under_2_sla"]["percentage"],
                    "assigned": r["assigned"],
                }
                for r in site_records
                if r["Queue Name"] == qname
            ],
            key=lambda r: r["asa"],
            reverse=True,
        )

        queue_df = filtered[filtered["Queue Name"] == qname]
        peak = peak_day(queue_df)

        queues.append(
            {
                "queue": qname,
                "asa": q["asa"],
                "assigned": q["assigned"],
                "sla_pct": q["under_2_sla"]["percentage"],
                "sites": sites,
                "peak": peak,
            }
        )

    return {"min_assigned": min_assigned, "queues": queues}


def _first_or_none(items: list[dict]):
    return items[0] if items else None
