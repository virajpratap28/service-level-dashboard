import React, { useState } from "react";
import Layout from "../components/Layout.jsx";
import FilterBar from "../components/FilterBar.jsx";
import ChartCard from "../components/ChartCard.jsx";
import RecordsTable from "../components/RecordsTable.jsx";
import { LoadingState, ErrorState } from "../components/StateViews.jsx";
import { useApiData } from "../hooks/useApiData.js";
import { getWeekly } from "../api/client";

export default function WeeklyDashboard() {
  const [filters, setFilters] = useState({});
  const { data, loading, error, refetch } = useApiData(getWeekly, filters);

  return (
    <Layout title="Weekly Dashboard" subtitle="Monday through Sunday performance breakdown" filters={filters}>
      <div className="mb-6">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {data && !loading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard title="Weekly Volume" chart={data.charts.weekly_volume} />
            <ChartCard title="Weekly SLA" chart={data.charts.weekly_sla} />
            <ChartCard title="Weekly ASA" chart={data.charts.weekly_asa} />
            <ChartCard title="Weekly Abandonment" chart={data.charts.weekly_abandonment} />
          </div>
          <RecordsTable records={data.records} groupKey="Weekday" groupLabel="Day" />
        </div>
      )}
    </Layout>
  );
}
