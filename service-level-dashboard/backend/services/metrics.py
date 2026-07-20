"""
metrics.py
----------
All KPI formulas + aggregation / filtering helpers for the Service
Level Dashboard. Pure pandas in, pure python-native types out (so the
route layer can drop the result straight into a JSON response without
worrying about numpy dtypes).
"""

from __future__ import annotations

from datetime import date
from typing import Optional

import numpy as np
import pandas as pd


def to_native(value):
    """Convert numpy / pandas scalar types to plain python types."""
    if value is None:
        return None
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        if np.isnan(value):
            return 0
        return round(float(value), 2)
    if isinstance(value, (np.bool_,)):
        return bool(value)
    if isinstance(value, float):
        if pd.isna(value):
            return 0
        return round(value, 2)
    if pd.isna(value) if not isinstance(value, (list, dict)) else False:
        return 0
    return value


def safe_div(numerator: float, denominator: float) -> float:
    if not denominator or pd.isna(denominator) or denominator == 0:
        return 0.0
    if pd.isna(numerator):
        return 0.0
    return float(numerator) / float(denominator)


# ---------------------------------------------------------------------------
# Filtering
# ---------------------------------------------------------------------------

def apply_filters(
    df: pd.DataFrame,
    lob: Optional[str] = None,
    queue: Optional[str] = None,
    site: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> pd.DataFrame:
    out = df
    if lob and lob.lower() != "all":
        out = out[out["LOB"].str.lower() == lob.lower()]
    if queue and queue.lower() != "all":
        out = out[out["Queue Name"].str.lower() == queue.lower()]
    if site and site.lower() != "all":
        out = out[out["Site"].str.lower() == site.lower()]
    if start_date:
        out = out[out["Date"] >= start_date]
    if end_date:
        out = out[out["Date"] <= end_date]
    return out


# ---------------------------------------------------------------------------
# Core KPI formulas (operate on an already-filtered DataFrame slice)
# ---------------------------------------------------------------------------

def compute_asa(df: pd.DataFrame) -> float:
    """ASA = Total Time in Queue - Assignments / Assigned"""
    return safe_div(df["Total Time in Queue - Assignments"].sum(), df["Assigned"].sum())


def compute_aht(df: pd.DataFrame) -> float:
    """AHT = Total Assignment Duration Time / Assigned"""
    return safe_div(df["Total Assignment Duration Time"].sum(), df["Assigned"].sum())


def compute_under_2_sla_pct(df: pd.DataFrame) -> float:
    """Under 2 SLA % = (1 - (Total SLA Missed 120 Sec / Assigned)) * 100"""
    assigned = df["Assigned"].sum()
    missed = df["Total SLA Missed 120 Sec"].sum()
    if not assigned:
        return 0.0
    return round((1 - safe_div(missed, assigned)) * 100, 2)


def compute_sla_breached_count(df: pd.DataFrame) -> float:
    """SLA Breached (count) = sum(Total SLA Missed 120 Sec)"""
    return float(df["Total SLA Missed 120 Sec"].sum() or 0)


def compute_sla_breached_pct(df: pd.DataFrame) -> float:
    assigned = df["Assigned"].sum()
    missed = df["Total SLA Missed 120 Sec"].sum()
    return round(safe_div(missed, assigned) * 100, 2)


def compute_abandonment_pct(df: pd.DataFrame) -> float:
    """Abandonment % = (Queue Abandon / Offered Completed) * 100"""
    offered = df["Offered Completed"].sum()
    abandoned = df["Queue Abandon"].sum()
    return round(safe_div(abandoned, offered) * 100, 2)


def compute_abandonment_count(df: pd.DataFrame) -> float:
    return float(df["Queue Abandon"].sum() or 0)


def compute_occupancy(df: pd.DataFrame) -> float:
    """Occupancy = (Utilized Time / Occupable Time) * 100"""
    util = df["Total Cumulative Utilized Time"].sum()
    occ = df["Total Cumulative Occupable Time"].sum()
    return round(safe_div(util, occ) * 100, 2)


def compute_longest_wait(df: pd.DataFrame) -> float:
    """Longest Wait = MAX(Total Time in Queue - Assignments)"""
    if df.empty:
        return 0.0
    val = df["Total Time in Queue - Assignments"].max()
    return float(val) if pd.notna(val) else 0.0


def compute_longest_queue(df: pd.DataFrame) -> float:
    """Longest Queue = MAX(Queue Wait Time)"""
    if df.empty or "Queue Wait Time" not in df.columns:
        return 0.0
    val = df["Queue Wait Time"].max()
    return float(val) if pd.notna(val) else 0.0


def compute_volume(df: pd.DataFrame) -> float:
    """Volume = Assigned"""
    return float(df["Assigned"].sum() or 0)


def compute_offered_completed(df: pd.DataFrame) -> float:
    return float(df["Offered Completed"].sum() or 0)


def compute_assigned(df: pd.DataFrame) -> float:
    return float(df["Assigned"].sum() or 0)


def compute_variance(df: pd.DataFrame) -> float:
    """Variance = (Actual Volume - Forecast Volume) / Forecast Volume * 100"""
    actual = df["Assigned"].sum()
    forecast = df["Forecast Volume"].sum() if "Forecast Volume" in df.columns else 0
    if not forecast:
        return 0.0
    return round(safe_div(actual - forecast, forecast) * 100, 2)


def kpi_summary(df: pd.DataFrame) -> dict:
    """Full executive KPI card payload, including % / count dual metrics."""
    return {
        "volume": to_native(compute_volume(df)),
        "assigned": to_native(compute_assigned(df)),
        "offered_completed": to_native(compute_offered_completed(df)),
        "under_2_sla": {
            "percentage": to_native(compute_under_2_sla_pct(df)),
            "count": to_native(compute_assigned(df) - compute_sla_breached_count(df)),
        },
        "sla_breached": {
            "percentage": to_native(compute_sla_breached_pct(df)),
            "count": to_native(compute_sla_breached_count(df)),
        },
        "abandonment": {
            "percentage": to_native(compute_abandonment_pct(df)),
            "count": to_native(compute_abandonment_count(df)),
        },
        "asa": to_native(compute_asa(df)),
        "aht": to_native(compute_aht(df)),
        "occupancy": to_native(compute_occupancy(df)),
        "longest_wait": to_native(compute_longest_wait(df)),
        "longest_queue": to_native(compute_longest_queue(df)),
        "variance": to_native(compute_variance(df)),
        "row_count": int(len(df)),
    }


# ---------------------------------------------------------------------------
# Grouped aggregations (used by hourly / daily / weekly / monthly / queue / site)
# ---------------------------------------------------------------------------

def group_and_summarize(df: pd.DataFrame, group_col: str, order: Optional[list] = None) -> list[dict]:
    if df.empty or group_col not in df.columns:
        return []

    records = []
    for key, chunk in df.groupby(group_col, dropna=True):
        row = kpi_summary(chunk)
        row[group_col] = key if not isinstance(key, (np.generic,)) else to_native(key)
        records.append(row)

    if order:
        order_index = {v: i for i, v in enumerate(order)}
        records.sort(key=lambda r: order_index.get(r[group_col], len(order)))
    else:
        records.sort(key=lambda r: str(r[group_col]))

    return records


def group_and_summarize_multi(df: pd.DataFrame, group_cols: list[str]) -> list[dict]:
    """Like group_and_summarize but groups on more than one column at once
    (e.g. ["Queue Name", "Site"]). Each record carries every group column."""
    if df.empty or any(c not in df.columns for c in group_cols):
        return []

    records = []
    for key, chunk in df.groupby(group_cols, dropna=True):
        if not isinstance(key, tuple):
            key = (key,)
        row = kpi_summary(chunk)
        for col, val in zip(group_cols, key):
            row[col] = to_native(val) if isinstance(val, np.generic) else val
        records.append(row)

    records.sort(key=lambda r: str(r[group_cols[0]]))
    return records


def peak_day(df: pd.DataFrame, metric_fn=None) -> Optional[dict]:
    """Given an already-filtered slice, find the single Date with the
    highest daily-average ASA (used for 'peak wait' callouts)."""
    if df.empty or "Date" not in df.columns:
        return None

    fn = metric_fn or compute_asa
    best = None
    for key, chunk in df.groupby("Date", dropna=True):
        val = fn(chunk)
        if best is None or val > best["value"]:
            best = {"date": to_native(key) if isinstance(key, np.generic) else str(key), "value": to_native(val)}
    return best



def top_n(records: list[dict], key: str, n: int = 1, reverse: bool = True) -> list[dict]:
    return sorted(records, key=lambda r: r.get(key, 0), reverse=reverse)[:n]


WEEKDAY_ORDER = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]
