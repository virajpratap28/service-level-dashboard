"""
deps.py
-------
Shared FastAPI dependency for the LOB / Queue / Site / date-range
filters used across almost every dashboard endpoint.
"""

from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import Query
from pydantic import BaseModel


class DashboardFilters(BaseModel):
    lob: Optional[str] = None
    queue: Optional[str] = None
    site: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    view: Optional[str] = "daily"  # daily | weekly | monthly | custom


def get_filters(
    lob: Optional[str] = Query(None, description="Filter by Line of Business"),
    queue: Optional[str] = Query(None, description="Filter by Queue Name"),
    site: Optional[str] = Query(None, description="Filter by Site"),
    start_date: Optional[date] = Query(None, description="Range start (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Range end (YYYY-MM-DD)"),
    view: Optional[str] = Query("daily", description="daily | weekly | monthly | custom"),
) -> DashboardFilters:
    return DashboardFilters(
        lob=lob, queue=queue, site=site, start_date=start_date, end_date=end_date, view=view
    )
