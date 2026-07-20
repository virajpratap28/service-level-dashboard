import React, { useState } from "react";
import Layout from "../components/Layout.jsx";
import OverviewHeader from "../components/OverviewHeader.jsx";
import KpiCard from "../components/KpiCard.jsx";
import ChartCard from "../components/ChartCard.jsx";
import { LoadingState, ErrorState } from "../components/StateViews.jsx";
import { useApiData } from "../hooks/useApiData.js";
import { getDashboard } from "../api/client";

export default function ExecutiveDashboard() {
  const [filters, setFilters] = useState({ view: "monthly" });
  const { data, loading, error, refetch } = useApiData(getDashboard, filters);

  return (
    <Layout filters={filters} hideHeader>
      <OverviewHeader filters={filters} onChange={setFilters} />

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {data && !loading && !error && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Volume" value={data.kpis.volume} accent="blue" icon="📈" />
            <KpiCard label="Assigned" value={data.kpis.assigned} accent="navy" icon="👥" />
            <KpiCard label="Offered Completed" value={data.kpis.offered_completed} accent="blue" icon="✅" />
            <KpiCard label="Under 2 SLA" dual={data.kpis.under_2_sla} accent="green" icon="🎯" />
            <KpiCard label="SLA Breached" dual={data.kpis.sla_breached} accent="red" icon="⚠️" />
            <KpiCard label="Abandonment" dual={data.kpis.abandonment} accent="amber" icon="📵" />
            <KpiCard label="ASA" value={data.kpis.asa} suffix=" sec" accent="navy" icon="⏱️" />
            <KpiCard label="AHT" value={data.kpis.aht} suffix=" sec" accent="orange" icon="🕒" />
            <KpiCard label="Occupancy" value={data.kpis.occupancy} suffix="%" accent="blue" icon="📊" />
            <KpiCard label="Longest Wait" value={data.kpis.longest_wait} suffix=" sec" accent="orange" icon="⏳" />
            <KpiCard label="Longest Queue" value={data.kpis.longest_queue} suffix=" sec" accent="navy" icon="📶" />
            <KpiCard label="Variance" value={data.kpis.variance} suffix="%" accent="black" icon="📉" />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard title="Volume Trend" chart={data.charts.volume_trend} />
            <ChartCard title="Assigned Trend" chart={data.charts.assigned_trend} />
            <ChartCard title="SLA Trend" chart={data.charts.sla_trend} />
            <ChartCard title="ASA Trend" chart={data.charts.asa_trend} />
            <ChartCard title="Abandonment Trend" chart={data.charts.abandonment_trend} />
            <ChartCard title="Monthly Volume" chart={data.charts.monthly_volume} />
          </div>
        </>
      )}
    </Layout>
  );
}
