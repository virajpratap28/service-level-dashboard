import React, { useState } from "react";
import Layout from "../components/Layout.jsx";
import FilterBar from "../components/FilterBar.jsx";
import ChartCard from "../components/ChartCard.jsx";
import RecordsTable from "../components/RecordsTable.jsx";
import { LoadingState, ErrorState } from "../components/StateViews.jsx";
import { useApiData } from "../hooks/useApiData.js";
import { getMonthly } from "../api/client";

export default function MonthlyDashboard() {
  const [filters, setFilters] = useState({});
  const { data, loading, error, refetch } = useApiData(getMonthly, filters);

  return (
    <Layout title="Monthly Dashboard" subtitle="Monthly Volume, Assigned, SLA, ASA & AHT" filters={filters}>
      <div className="mb-6">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {data && !loading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard title="Monthly Volume" chart={data.charts.monthly_volume} />
            <ChartCard title="Monthly Assigned" chart={data.charts.monthly_assigned} />
            <ChartCard title="Monthly SLA" chart={data.charts.monthly_sla} />
            <ChartCard title="Monthly ASA" chart={data.charts.monthly_asa} />
            <ChartCard title="Monthly AHT" chart={data.charts.monthly_aht} />
          </div>
          <RecordsTable records={data.records} groupKey="Month" groupLabel="Month" />
        </div>
      )}
    </Layout>
  );
}
