import React, { useState } from "react";
import Layout from "../components/Layout.jsx";
import FilterBar from "../components/FilterBar.jsx";
import ChartCard from "../components/ChartCard.jsx";
import RecordsTable from "../components/RecordsTable.jsx";
import InsightCard from "../components/InsightCard.jsx";
import { LoadingState, ErrorState } from "../components/StateViews.jsx";
import { useApiData } from "../hooks/useApiData.js";
import { getQueueAnalysis } from "../api/client";

export default function QueueAnalysis() {
  const [filters, setFilters] = useState({});
  const { data, loading, error, refetch } = useApiData(getQueueAnalysis, filters);

  return (
    <Layout title="Queue Analysis" subtitle="Assigned, SLA, ASA, AHT & Abandonment by queue" filters={filters}>
      <div className="mb-6">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {data && !loading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InsightCard
              label="Highest Traffic Queue"
              record={data.insights.highest_traffic_queue}
              groupKey="Queue Name"
              metricLabel="Assigned"
              metricKey="assigned"
            />
            <InsightCard
              label="Highest ASA Queue"
              record={data.insights.highest_asa_queue}
              groupKey="Queue Name"
              metricLabel="ASA"
              metricKey="asa"
              suffix=" sec"
            />
            <InsightCard
              label="Highest Abandonment Queue"
              record={data.insights.highest_abandonment_queue}
              groupKey="Queue Name"
              metricLabel="Abandonment"
              metricKey="abandonment.percentage"
              suffix="%"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard title="Queue Comparison" chart={data.charts.queue_comparison} />
            <ChartCard title="Queue ASA" chart={data.charts.queue_asa} />
            <ChartCard title="Queue Abandonment" chart={data.charts.queue_abandonment} />
          </div>

          <RecordsTable records={data.records} groupKey="Queue Name" groupLabel="Queue" />
        </div>
      )}
    </Layout>
  );
}
