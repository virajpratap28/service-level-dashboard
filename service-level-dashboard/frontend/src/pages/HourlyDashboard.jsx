import React, { useState } from "react";
import Layout from "../components/Layout.jsx";
import FilterBar from "../components/FilterBar.jsx";
import ChartCard from "../components/ChartCard.jsx";
import RecordsTable from "../components/RecordsTable.jsx";
import { LoadingState, ErrorState } from "../components/StateViews.jsx";
import { useApiData } from "../hooks/useApiData.js";
import { getHourly } from "../api/client";

export default function HourlyDashboard() {
  const [filters, setFilters] = useState({});
  const { data, loading, error, refetch } = useApiData(getHourly, filters);

  return (
    <Layout title="Hourly Dashboard" subtitle="Assigned, Volume, ASA, AHT & SLA by hour of day" filters={filters}>
      <div className="mb-6">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {data && !loading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard title="Assigned by Hour" chart={data.charts.assigned_by_hour} />
            <ChartCard title="Volume by Hour" chart={data.charts.volume_by_hour} />
            <ChartCard title="ASA by Hour" chart={data.charts.asa_by_hour} />
            <ChartCard title="AHT by Hour" chart={data.charts.aht_by_hour} />
            <ChartCard title="SLA by Hour" chart={data.charts.sla_by_hour} />
          </div>
          <RecordsTable records={data.records} groupKey="Hour" groupLabel="Hour" />
        </div>
      )}
    </Layout>
  );
}
