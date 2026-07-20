import React from "react";

function fmt(n) {
  if (n === null || n === undefined) return "-";
  if (typeof n !== "number") return n;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * RecordsTable
 * ------------
 * Renders the group_and_summarize() records list (one row per
 * hour/day/weekday/month/queue/site) as a scrollable table.
 */
export default function RecordsTable({ records, groupKey, groupLabel }) {
  if (!records || records.length === 0) {
    return <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 dark:border-white/10 dark:bg-slate-900">No records to display</div>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-card dark:border-white/10 dark:bg-slate-900">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            <th className="px-4 py-3">{groupLabel}</th>
            <th className="px-4 py-3">Volume</th>
            <th className="px-4 py-3">Assigned</th>
            <th className="px-4 py-3">Under 2 SLA %</th>
            <th className="px-4 py-3">SLA Breached %</th>
            <th className="px-4 py-3">Abandonment %</th>
            <th className="px-4 py-3">ASA (sec)</th>
            <th className="px-4 py-3">AHT (sec)</th>
            <th className="px-4 py-3">Occupancy %</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, idx) => (
            <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-brand-blueLight/30 dark:border-white/5 dark:hover:bg-white/5">
              <td className="px-4 py-2.5 font-medium text-brand-navyDark dark:text-slate-100">{String(r[groupKey])}</td>
              <td className="px-4 py-2.5 dark:text-slate-300">{fmt(r.volume)}</td>
              <td className="px-4 py-2.5 dark:text-slate-300">{fmt(r.assigned)}</td>
              <td className="px-4 py-2.5 text-brand-blue">{fmt(r.under_2_sla?.percentage)}%</td>
              <td className="px-4 py-2.5 text-brand-orangeDark">{fmt(r.sla_breached?.percentage)}%</td>
              <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{fmt(r.abandonment?.percentage)}%</td>
              <td className="px-4 py-2.5 dark:text-slate-300">{fmt(r.asa)}</td>
              <td className="px-4 py-2.5 dark:text-slate-300">{fmt(r.aht)}</td>
              <td className="px-4 py-2.5 dark:text-slate-300">{fmt(r.occupancy)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
