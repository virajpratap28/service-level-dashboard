# Service Level Dashboard (SL Dashboard)

An enterprise-grade Workforce Management (WFM) Service Level Dashboard for
monitoring Volume, SLA, ASA, AHT, Occupancy, Abandonment, and related KPIs
across LOBs, Queues, and Sites.

**Stack:** FastAPI + Pandas + OpenPyXL (backend) · React + Tailwind CSS +
Chart.js + Axios + React Router (frontend)

---

## 1. Project Structure

```
service-level-dashboard/
├── backend/
│   ├── app.py                  # FastAPI entrypoint
│   ├── routes/                 # dashboard, hourly, daily, weekly, monthly, queue, site, reports, auth
│   ├── services/                # excel_loader, metrics, chart_service
│   └── data/                    # SL_<Month>_26.xlsx workbooks live here (sample data included)
├── frontend/
│   └── src/
│       ├── pages/                # Login, ExecutiveDashboard, Hourly/Daily/Weekly/Monthly, Queue, Site, Reports
│       ├── components/           # Sidebar, Header, KpiCard, ChartCard, FilterBar, RecordsTable, InsightCard
│       ├── context/AuthContext.jsx
│       ├── api/client.js
│       └── hooks/useApiData.js
└── requirements.txt
```

## 2. Backend Setup

```bash
cd service-level-dashboard
python3 -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements.txt

cd backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

- API base URL: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`
- Sample data is already seeded in `backend/data/` (7 months, Jan–Jul 2026,
  synthetic but realistic — replace with your real `SL_*.xlsx` workbooks any
  time, or upload new ones from the Reports page).

## 3. Frontend Setup

```bash
cd service-level-dashboard/frontend
npm install
npm run dev
```

- App URL: `http://localhost:5173`
- The Vite dev server proxies `/api/*` → `http://localhost:8000/*`
  (see `vite.config.js`), so no CORS configuration is needed in dev.
- For production, run `npm run build` and serve the `dist/` folder from any
  static host / Nginx / the FastAPI app itself; point `/api` at your deployed
  backend URL.

## 4. Login

Demo credentials (see `backend/routes/auth.py` — swap for a real user store
+ JWT/OAuth before production):

| Username | Password   | Role                |
|----------|-----------|---------------------|
| admin    | admin123  | Administrator       |
| wfm      | wfm123    | WFM Analyst         |
| manager  | manager123| Operations Manager  |

## 5. Excel Workbook Schema

Files must be named `SL_<Month>_<Year>.xlsx` (e.g. `SL_Jan_26.xlsx`) and
placed in `backend/data/`, or uploaded via the Reports page.

**Required columns:** Days in Datetime_EST, Hours in Datetime_EST, Queue Name,
LOB, Site, Assigned, ASA, Total Time in Queue - Assignments, Under 2 %,
Total SLA Missed 120 Sec, AHT, Total Assignment Duration Time, Abandonment,
Offered Completed, Queue Abandon.

**Optional columns:** Total Cumulative Utilized Time, Total Cumulative
Occupable Time, Forecast Volume, Planned Assigned, Queue Wait Time (used for
Occupancy, Variance, and Longest Queue — these metrics return 0 if omitted).

## 6. KPI Formulas

All formulas live in `backend/services/metrics.py` and match the spec:

- **ASA** = Total Time in Queue - Assignments / Assigned
- **AHT** = Total Assignment Duration Time / Assigned
- **Under 2 SLA %** = (1 − (Total SLA Missed 120 Sec / Assigned)) × 100
- **SLA Breached** = Total SLA Missed 120 Sec (count) and its % of Assigned
- **Abandonment %** = (Queue Abandon / Offered Completed) × 100
- **Occupancy** = (Total Cumulative Utilized Time / Total Cumulative Occupable Time) × 100
- **Longest Wait** = MAX(Total Time in Queue - Assignments)
- **Longest Queue** = MAX(Queue Wait Time)
- **Volume** = Assigned
- **Variance** = (Actual Volume − Forecast Volume) / Forecast Volume × 100

`Under 2 SLA`, `SLA Breached`, and `Abandonment` are returned as
`{ percentage, count }` pairs so the frontend can render the `[%] [Count]`
toggle required by the spec.

## 7. API Reference

| Method | Path                        | Purpose                                   |
|--------|------------------------------|--------------------------------------------|
| GET    | `/`                          | Health check                              |
| POST   | `/auth/login`                | Authenticate, returns a session token     |
| GET    | `/dashboard`                 | Executive KPI cards + trend charts        |
| GET    | `/dashboard/filters`         | Distinct LOB / Queue / Site values         |
| GET    | `/hourly`                    | Hourly breakdown + charts                  |
| GET    | `/daily`                     | Daily breakdown + charts                   |
| GET    | `/weekly`                    | Day-of-week breakdown + charts             |
| GET    | `/monthly`                   | Monthly breakdown + charts                 |
| GET    | `/queue`                     | Per-queue breakdown + insights + charts    |
| GET    | `/site`                      | Per-site breakdown + insights + charts     |
| POST   | `/upload`                    | Upload a new SL_*.xlsx workbook            |
| GET    | `/reports/files`             | List currently loaded workbooks            |
| GET    | `/reports/export/csv`        | Export filtered raw data as CSV            |
| GET    | `/reports/export/pdf`        | Export filtered KPI summary as PDF         |

All GET endpoints accept optional query params: `lob`, `queue`, `site`,
`start_date`, `end_date`, `view`.

## 8. Notes on V2 (PostgreSQL)

The current version reads directly from Excel workbooks via Pandas
(`services/excel_loader.py`), cached in memory and invalidated on upload.
To move to PostgreSQL: swap `excel_loader.load_all()` for a query layer
(e.g. SQLAlchemy) that returns the same normalized DataFrame shape — the
`metrics.py` and `chart_service.py` layers are storage-agnostic and require
no changes.
