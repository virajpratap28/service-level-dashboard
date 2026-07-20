import React, { useState } from "react";
import Layout from "../components/Layout.jsx";
import FilterBar from "../components/FilterBar.jsx";
import ChartCard from "../components/ChartCard.jsx";
import RecordsTable from "../components/RecordsTable.jsx";
import { LoadingState, ErrorState } from "../components/StateViews.jsx";
import { useApiData } from "../hooks/useApiData.js";
import { getDaily } from "../api/client";

export default function DailyDashboard() {
  const [filters, setFilters] = useState({});
  const { data, loading, error, refetch } = useApiData(getDaily, filters);

  return (
    <Layout title="Daily Dashboard" subtitle="Daily Volume, Assigned, SLA & ASA" filters={filters}>
      <div className="mb-6">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {data && !loading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard title="Daily Volume" chart={data.charts.daily_volume} />
            <ChartCard title="Daily Assigned" chart={data.charts.daily_assigned} />
            <ChartCard title="Daily SLA" chart={data.charts.daily_sla} />
            <ChartCard title="Daily ASA" chart={data.charts.daily_asa} />
          </div>
          <RecordsTable records={data.records} groupKey="Date" groupLabel="Date" />
        </div>
      )}
    </Layout>
  );
}
