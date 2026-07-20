"""
chart_service.py
-----------------
Turns aggregated KPI records into Chart.js-ready payloads
({ labels: [...], datasets: [...] }) so the React frontend can feed
them directly into react-chartjs-2 components with zero transformation.
"""

from __future__ import annotations

from typing import Optional

PALETTE = {
    "pink": "#0046ff",       # Energy Blue — primary series
    "navy": "#002864",       # Navy — secondary series
    "pink_light": "#6b8aff",
    "navy_light": "#3d5a94",
    "green": "#F66608",      # Optimum Orange — used for contrast against navy in combo charts
    "amber": "#F66608",      # Optimum Orange
    "red": "#d9560a",        # Orange (dark) — abandonment
    "purple": "#002864",     # Navy
    "teal": "#0038cc",       # Blue (dark)
    "cyan": "#0046ff",       # Energy Blue
    "indigo": "#002864",     # Navy
    "orange": "#F66608",     # Optimum Orange
}


def line_or_bar_dataset(
    records: list[dict],
    label_key: str,
    metrics: list[tuple[str, str, str]],
    chart_type: str = "line",
) -> dict:
    """
    metrics: list of (field_path, display_label, color)
    field_path may use dot notation for nested dict fields, e.g. "sla_breached.percentage"
    """
    labels = [str(r.get(label_key, "")) for r in records]

    def _get(rec: dict, path: str):
        cur = rec
        for part in path.split("."):
            if isinstance(cur, dict):
                cur = cur.get(part, 0)
            else:
                return 0
        return cur if isinstance(cur, (int, float)) else 0

    datasets = []
    for field_path, display_label, color in metrics:
        datasets.append(
            {
                "label": display_label,
                "data": [_get(r, field_path) for r in records],
                "borderColor": color,
                "backgroundColor": color if chart_type == "bar" else _with_alpha(color),
                "tension": 0.35,
                "fill": chart_type == "line",
            }
        )

    return {"type": chart_type, "labels": labels, "datasets": datasets}


def _with_alpha(hex_color: str, alpha: float = 0.15) -> str:
    hex_color = hex_color.lstrip("#")
    r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
    return f"rgba({r},{g},{b},{alpha})"


def build_hourly_charts(records: list[dict]) -> dict:
    return {
        "assigned_by_hour": line_or_bar_dataset(records, "Hour", [("assigned", "Assigned", PALETTE["navy"])], "bar"),
        "volume_by_hour": line_or_bar_dataset(records, "Hour", [("volume", "Volume", PALETTE["pink"])], "bar"),
        "asa_by_hour": line_or_bar_dataset(records, "Hour", [("asa", "ASA (sec)", PALETTE["amber"])], "line"),
        "aht_by_hour": line_or_bar_dataset(records, "Hour", [("aht", "AHT (sec)", PALETTE["purple"])], "line"),
        "sla_by_hour": line_or_bar_dataset(
            records, "Hour", [("under_2_sla.percentage", "Under 2 SLA %", PALETTE["green"])], "line"
        ),
    }


def build_daily_charts(records: list[dict]) -> dict:
    return {
        "daily_volume": line_or_bar_dataset(records, "Date", [("volume", "Volume", PALETTE["pink"])], "bar"),
        "daily_assigned": line_or_bar_dataset(records, "Date", [("assigned", "Assigned", PALETTE["navy"])], "bar"),
        "daily_sla": line_or_bar_dataset(
            records, "Date", [("under_2_sla.percentage", "Under 2 SLA %", PALETTE["green"])], "line"
        ),
        "daily_asa": line_or_bar_dataset(records, "Date", [("asa", "ASA (sec)", PALETTE["amber"])], "line"),
    }


def build_weekly_charts(records: list[dict]) -> dict:
    return {
        "weekly_volume": line_or_bar_dataset(records, "Weekday", [("volume", "Volume", PALETTE["pink"])], "bar"),
        "weekly_sla": line_or_bar_dataset(
            records, "Weekday", [("under_2_sla.percentage", "Under 2 SLA %", PALETTE["green"])], "line"
        ),
        "weekly_asa": line_or_bar_dataset(records, "Weekday", [("asa", "ASA (sec)", PALETTE["amber"])], "line"),
        "weekly_abandonment": line_or_bar_dataset(
            records, "Weekday", [("abandonment.percentage", "Abandonment %", PALETTE["red"])], "line"
        ),
    }


def build_monthly_charts(records: list[dict]) -> dict:
    return {
        "monthly_volume": line_or_bar_dataset(records, "Month", [("volume", "Volume", PALETTE["pink"])], "bar"),
        "monthly_assigned": line_or_bar_dataset(records, "Month", [("assigned", "Assigned", PALETTE["navy"])], "bar"),
        "monthly_sla": line_or_bar_dataset(
            records, "Month", [("under_2_sla.percentage", "Under 2 SLA %", PALETTE["green"])], "line"
        ),
        "monthly_asa": line_or_bar_dataset(records, "Month", [("asa", "ASA (sec)", PALETTE["amber"])], "line"),
        "monthly_aht": line_or_bar_dataset(records, "Month", [("aht", "AHT (sec)", PALETTE["purple"])], "line"),
    }


def build_queue_charts(records: list[dict]) -> dict:
    return {
        "queue_comparison": line_or_bar_dataset(
            records,
            "Queue Name",
            [
                ("assigned", "Assigned", PALETTE["navy"]),
                ("under_2_sla.percentage", "Under 2 SLA %", PALETTE["green"]),
            ],
            "bar",
        ),
        "queue_asa": line_or_bar_dataset(records, "Queue Name", [("asa", "ASA (sec)", PALETTE["amber"])], "bar"),
        "queue_abandonment": line_or_bar_dataset(
            records, "Queue Name", [("abandonment.percentage", "Abandonment %", PALETTE["red"])], "bar"
        ),
    }


def build_site_charts(records: list[dict]) -> dict:
    return {
        "site_comparison": line_or_bar_dataset(
            records,
            "Site",
            [
                ("assigned", "Assigned", PALETTE["navy"]),
                ("under_2_sla.percentage", "Under 2 SLA %", PALETTE["green"]),
            ],
            "bar",
        ),
        "site_asa": line_or_bar_dataset(records, "Site", [("asa", "ASA (sec)", PALETTE["amber"])], "bar"),
        "site_aht": line_or_bar_dataset(records, "Site", [("aht", "AHT (sec)", PALETTE["purple"])], "bar"),
    }
