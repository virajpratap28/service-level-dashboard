import React, { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import FilterBar from "../components/FilterBar.jsx";
import ChartCard from "../components/ChartCard.jsx";
import RecordsTable from "../components/RecordsTable.jsx";
import { LoadingState, ErrorState } from "../components/StateViews.jsx";
import { exportPdfUrl, getDashboard, getQueueAnalysis, getSiteAnalysis } from "../api/client";

function fmt(n, opts = {}) {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2, ...opts });
}

function sentimentWord(pct, goodAbove = 95) {
  if (pct >= goodAbove) return "strong";
  if (pct >= goodAbove - 8) return "steady";
  return "under pressure";
}

export default function DetailedReport() {
  const [filters, setFilters] = useState({});
  const [dashboard, setDashboard] = useState(null);
  const [queue, setQueue] = useState(null);
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cleanParams = (obj) =>
    Object.fromEntries(Object.entries(obj || {}).filter(([, v]) => v !== undefined && v !== ""));

  const load = () => {
    setLoading(true);
    setError(null);
    const params = cleanParams(filters);
    Promise.all([getDashboard(params), getQueueAnalysis(params), getSiteAnalysis(params)])
      .then(([d, q, s]) => {
        setDashboard(d);
        setQueue(q);
        setSite(s);
      })
      .catch((err) => setError(err?.response?.data?.detail || "Failed to load the report."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  return (
    <Layout title="Detailed Report" subtitle="A narrative walkthrough of service level performance" filters={filters}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <FilterBar filters={filters} onChange={setFilters} />
        <a
          href={exportPdfUrl(cleanParams(filters))}
          className="rounded-lg bg-gradient-to-r from-brand-navy to-brand-black px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-opacity hover:opacity-90"
        >
          ⬇ Download PDF Summary
        </a>
      </div>

      {loading && <LoadingState label="Compiling the detailed report..." />}
      {error && <ErrorState message={error} onRetry={load} />}

      {dashboard && queue && site && !loading && !error && (
        <StoryBody dashboard={dashboard} queue={queue} site={site} />
      )}
    </Layout>
  );
}

function StoryBody({ dashboard, queue, site }) {
  const k = dashboard.kpis;
  const slaWord = sentimentWord(k.under_2_sla.percentage);
  const abandonWord = k.abandonment.percentage <= 3 ? "well controlled" : "elevated";
  const varianceDirection = k.variance >= 0 ? "above" : "below";

  const topQueue = queue.insights.highest_traffic_queue;
  const worstAsaQueue = queue.insights.highest_asa_queue;
  const worstAbandonQueue = queue.insights.highest_abandonment_queue;
  const bestSite = site.insights.best_performing_site;
  const busiestSite = site.insights.highest_traffic_site;

  return (
    <article className="space-y-8">
      {/* Executive Summary */}
      <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand-blue" />
          <h2 className="text-lg font-bold text-brand-navyDark">Executive Summary</h2>
        </div>
        <p className="leading-relaxed text-slate-600">
          Across the selected period, the operation handled{" "}
          <span className="font-semibold text-brand-navyDark">{fmt(k.assigned)}</span> assigned interactions
          against <span className="font-semibold text-brand-navyDark">{fmt(k.offered_completed)}</span> offered,
          landing volume <span className="font-semibold text-brand-navyDark">{fmt(Math.abs(k.variance))}%</span>{" "}
          {varianceDirection} forecast. Service level came in{" "}
          <span className="font-semibold text-brand-blue">{slaWord}</span> at{" "}
          <span className="font-semibold text-brand-navyDark">{fmt(k.under_2_sla.percentage)}%</span> under the
          2‑minute threshold ({fmt(k.under_2_sla.count)} calls), while{" "}
          <span className="font-semibold text-brand-orangeDark">{fmt(k.sla_breached.percentage)}%</span> breached SLA (
          {fmt(k.sla_breached.count)} calls). Abandonment was{" "}
          <span className="font-semibold text-slate-700">{abandonWord}</span> at{" "}
          {fmt(k.abandonment.percentage)}% ({fmt(k.abandonment.count)} calls lost from queue). Average speed of
          answer held at <span className="font-semibold text-brand-navyDark">{fmt(k.asa)} sec</span>, with an
          average handle time of <span className="font-semibold text-brand-navyDark">{fmt(k.aht)} sec</span> and
          occupancy at <span className="font-semibold text-brand-navyDark">{fmt(k.occupancy)}%</span>. The single
          longest customer wait recorded was{" "}
          <span className="font-semibold text-brand-navyDark">{fmt(k.longest_wait)} sec</span>.
        </p>
      </section>

      {/* Queue Spotlight */}
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-brand-orangeLight/40 p-7 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand-orange" />
          <h2 className="text-lg font-bold text-brand-navyDark">Queue Spotlight</h2>
        </div>
        <p className="leading-relaxed text-slate-600">
          {topQueue ? (
            <>
              <span className="font-semibold text-brand-navyDark">{topQueue["Queue Name"]}</span> carried the
              heaviest load this period with <span className="font-semibold">{fmt(topQueue.assigned)}</span>{" "}
              assigned interactions.{" "}
            </>
          ) : null}
          {worstAsaQueue ? (
            <>
              <span className="font-semibold text-brand-navyDark">{worstAsaQueue["Queue Name"]}</span> showed the
              longest average speed of answer at{" "}
              <span className="font-semibold">{fmt(worstAsaQueue.asa)} sec</span>, a queue worth watching for
              staffing or routing adjustments.{" "}
            </>
          ) : null}
          {worstAbandonQueue ? (
            <>
              Abandonment concentrated most in{" "}
              <span className="font-semibold text-brand-navyDark">{worstAbandonQueue["Queue Name"]}</span> at{" "}
              <span className="font-semibold text-brand-orangeDark">
                {fmt(worstAbandonQueue.abandonment.percentage)}%
              </span>
              .
            </>
          ) : null}
        </p>
      </section>

      {/* Site Spotlight */}
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-brand-navyLight/40 p-7 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand-navy" />
          <h2 className="text-lg font-bold text-brand-navyDark">Site Spotlight</h2>
        </div>
        <p className="leading-relaxed text-slate-600">
          {bestSite ? (
            <>
              <span className="font-semibold text-brand-navyDark">{bestSite.Site}</span> led on service level,
              posting <span className="font-semibold text-brand-blue">{fmt(bestSite.under_2_sla.percentage)}%</span>{" "}
              under 2‑minute SLA.{" "}
            </>
          ) : null}
          {busiestSite ? (
            <>
              <span className="font-semibold text-brand-navyDark">{busiestSite.Site}</span> handled the highest
              traffic overall, at <span className="font-semibold">{fmt(busiestSite.assigned)}</span> assigned
              interactions.
            </>
          ) : null}
        </p>
      </section>

      {/* Trend Narrative + charts */}
      <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand-orange" />
          <h2 className="text-lg font-bold text-brand-navyDark">Trend Detail</h2>
        </div>
        <p className="mb-5 leading-relaxed text-slate-600">
          The charts below trace daily volume, SLA attainment, and speed of answer across the selected range —
          useful for spotting spikes, slow recoveries, or day-of-week patterns that the summary numbers alone
          don't show.
        </p>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard title="Volume Trend" chart={dashboard.charts.volume_trend} />
          <ChartCard title="SLA Trend" chart={dashboard.charts.sla_trend} />
          <ChartCard title="ASA Trend" chart={dashboard.charts.asa_trend} />
          <ChartCard title="Abandonment Trend" chart={dashboard.charts.abandonment_trend} />
        </div>
      </section>

      {/* Detailed data tables */}
      <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand-blue" />
          <h2 className="text-lg font-bold text-brand-navyDark">Queue-Level Detail</h2>
        </div>
        <RecordsTable records={queue.records} groupKey="Queue Name" groupLabel="Queue" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand-navy" />
          <h2 className="text-lg font-bold text-brand-navyDark">Site-Level Detail</h2>
        </div>
        <RecordsTable records={site.records} groupKey="Site" groupLabel="Site" />
      </section>
    </article>
  );
}
