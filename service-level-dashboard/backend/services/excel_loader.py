"""
excel_loader.py
----------------
Handles discovery, loading, cleaning and caching of the SL_*.xlsx
workbooks that back the Service Level Dashboard.

All Excel I/O for the application is centralised here so that the
route layer never touches pandas / openpyxl directly.
"""

from __future__ import annotations

import threading
from pathlib import Path
from typing import Optional

import pandas as pd

# ---------------------------------------------------------------------------
# Paths & constants
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

REQUIRED_COLUMNS = [
    "Days in Datetime_EST",
    "Hours in Datetime_EST",
    "Queue Name",
    "LOB",
    "Site",
    "Assigned",
    "ASA",
    "Total Time in Queue - Assignments",
    "Under 2 %",
    "Total SLA Missed 120 Sec",
    "AHT",
    "Total Assignment Duration Time",
    "Abandonment",
    "Offered Completed",
    "Queue Abandon",
]

OPTIONAL_COLUMNS = [
    "Total Cumulative Utilized Time",
    "Total Cumulative Occupable Time",
    "Forecast Volume",
    "Planned Assigned",
    "Queue Wait Time",
]

NUMERIC_COLUMNS = [
    "Assigned",
    "ASA",
    "Total Time in Queue - Assignments",
    "Under 2 %",
    "Total SLA Missed 120 Sec",
    "AHT",
    "Total Assignment Duration Time",
    "Abandonment",
    "Offered Completed",
    "Queue Abandon",
    "Total Cumulative Utilized Time",
    "Total Cumulative Occupable Time",
    "Forecast Volume",
    "Planned Assigned",
    "Queue Wait Time",
]

# Internal, in-memory cache so we don't re-read every workbook on every
# request. Invalidated whenever a new file is uploaded.
_lock = threading.Lock()
_cache: Optional[pd.DataFrame] = None


def _normalize(df: pd.DataFrame) -> pd.DataFrame:
    """Ensure required columns exist, coerce dtypes, derive helper cols."""
    for col in REQUIRED_COLUMNS:
        if col not in df.columns:
            df[col] = pd.NA
    for col in OPTIONAL_COLUMNS:
        if col not in df.columns:
            df[col] = pd.NA

    for col in NUMERIC_COLUMNS:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df["Days in Datetime_EST"] = pd.to_datetime(
        df["Days in Datetime_EST"], errors="coerce"
    )

    # Hour as integer 0-23 when possible (source may be "08:00", 8, "8 AM" etc.)
    def _parse_hour(val):
        if pd.isna(val):
            return pd.NA
        try:
            return int(val)
        except (ValueError, TypeError):
            try:
                return pd.to_datetime(str(val)).hour
            except Exception:
                return pd.NA

    df["Hour"] = df["Hours in Datetime_EST"].apply(_parse_hour)
    df["Date"] = df["Days in Datetime_EST"].dt.date
    df["Weekday"] = df["Days in Datetime_EST"].dt.day_name()
    df["Month"] = df["Days in Datetime_EST"].dt.to_period("M").astype(str)
    df["Week"] = df["Days in Datetime_EST"].dt.strftime("%G-W%V")

    df["LOB"] = df["LOB"].astype("string").fillna("Unknown")
    df["Site"] = df["Site"].astype("string").fillna("Unknown")
    df["Queue Name"] = df["Queue Name"].astype("string").fillna("Unknown")

    return df


def _read_single_workbook(path: Path) -> pd.DataFrame:
    df = pd.read_excel(path, engine="openpyxl")
    df["__source_file"] = path.name
    return _normalize(df)


def load_all(force_reload: bool = False) -> pd.DataFrame:
    """Load & concatenate every workbook found in DATA_DIR (cached)."""
    global _cache
    with _lock:
        if _cache is not None and not force_reload:
            return _cache

        files = sorted(DATA_DIR.glob("SL_*.xlsx"))
        if not files:
            _cache = _normalize(pd.DataFrame(columns=REQUIRED_COLUMNS))
            return _cache

        frames = [_read_single_workbook(f) for f in files]
        combined = pd.concat(frames, ignore_index=True)
        _cache = combined
        return _cache


def invalidate_cache() -> None:
    global _cache
    with _lock:
        _cache = None


def save_upload(filename: str, content: bytes) -> Path:
    """Persist an uploaded workbook into DATA_DIR and bust the cache."""
    safe_name = Path(filename).name
    dest = DATA_DIR / safe_name
    dest.write_bytes(content)
    invalidate_cache()
    return dest


def list_available_files() -> list[str]:
    return sorted(p.name for p in DATA_DIR.glob("SL_*.xlsx"))
