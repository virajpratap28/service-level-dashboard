import React, { useState } from "react";
import Layout from "../components/Layout.jsx";
import FilterBar from "../components/FilterBar.jsx";
import ChartCard from "../components/ChartCard.jsx";
import RecordsTable from "../components/RecordsTable.jsx";
import InsightCard from "../components/InsightCard.jsx";
import { LoadingState, ErrorState } from "../components/StateViews.jsx";
import { useApiData } from "../hooks/useApiData.js";
import { getSiteAnalysis } from "../api/client";

export default function SiteAnalysis() {
  const [filters, setFilters] = useState({});
  const { data, loading, error, refetch } = useApiData(getSiteAnalysis, filters);

  return (
    <Layout title="Site Analysis" subtitle="Assigned, SLA, ASA & AHT by site" filters={filters}>
      <div className="mb-6">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {data && !loading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InsightCard
              label="Best Performing Site"
              record={data.insights.best_performing_site}
              groupKey="Site"
              metricLabel="Under 2 SLA"
              metricKey="under_2_sla.percentage"
              suffix="%"
            />
            <InsightCard
              label="Highest SLA Site"
              record={data.insights.highest_sla_site}
              groupKey="Site"
              metricLabel="Under 2 SLA"
              metricKey="under_2_sla.percentage"
              suffix="%"
            />
            <InsightCard
              label="Highest Traffic Site"
              record={data.insights.highest_traffic_site}
              groupKey="Site"
              metricLabel="Assigned"
              metricKey="assigned"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard title="Site Comparison" chart={data.charts.site_comparison} />
            <ChartCard title="Site ASA" chart={data.charts.site_asa} />
            <ChartCard title="Site AHT" chart={data.charts.site_aht} />
          </div>

          <RecordsTable records={data.records} groupKey="Site" groupLabel="Site" />
        </div>
      )}
    </Layout>
  );
}
