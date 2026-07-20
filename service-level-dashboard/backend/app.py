"""
app.py
------
Service Level Dashboard — FastAPI entrypoint.

Run with:
    uvicorn app:app --reload --host 0.0.0.0 --port 8000

Swagger docs available at /docs, ReDoc at /redoc.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import auth, daily, dashboard, hourly, monthly, queue, reports, site, weekly

app = FastAPI(
    title="Service Level Dashboard API",
    description=(
        "Backend API for the Workforce Management Service Level Dashboard. "
        "Provides executive KPIs, hourly/daily/weekly/monthly breakdowns, "
        "queue & site analysis, and Excel-based reporting."
    ),
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — open for local dev; restrict allow_origins in production.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(hourly.router)
app.include_router(daily.router)
app.include_router(weekly.router)
app.include_router(monthly.router)
app.include_router(queue.router)
app.include_router(site.router)
app.include_router(reports.router)


@app.get("/", tags=["Health"], summary="API health check")
def root():
    return {
        "service": "Service Level Dashboard API",
        "status": "healthy",
        "docs": "/docs",
        "version": "1.0.0",
    }
