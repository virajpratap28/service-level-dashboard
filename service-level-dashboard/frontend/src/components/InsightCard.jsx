import React from "react";

export default function InsightCard({ label, record, groupKey, metricLabel, metricKey, suffix = "" }) {
  if (!record) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-white/10 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-2 text-sm text-slate-400">No data</p>
      </div>
    );
  }

  const metricValue = metricKey.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), record);

  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-brand-blueLight/40 p-4 shadow-card dark:border-white/10 dark:from-slate-900 dark:to-slate-900 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-blueDark">{label}</p>
      <p className="mt-2 text-lg font-bold text-brand-navyDark dark:text-white">{record[groupKey]}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {metricLabel}: <span className="font-semibold text-slate-700 dark:text-slate-200">{metricValue?.toLocaleString?.() ?? metricValue}{suffix}</span>
      </p>
    </div>
  );
}
