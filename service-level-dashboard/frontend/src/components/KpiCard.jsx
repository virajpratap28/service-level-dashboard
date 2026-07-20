import React, { useState } from "react";

function formatNumber(n) {
  if (n === null || n === undefined) return "-";
  if (typeof n !== "number") return n;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * KpiCard
 * -------
 * If `dual` is provided ({ percentage, count }) the card renders a
 * [%] [Count] toggle, per the "Special Requirement" in the spec
 * (Under 2 SLA / SLA Breached / Abandonment).
 */
export default function KpiCard({ label, value, suffix = "", dual = null, accent = "blue", icon }) {
  const [mode, setMode] = useState("percentage");

  const accentClasses = {
    blue: "text-brand-blueDark bg-brand-blueLight",
    navy: "text-brand-navy bg-brand-gray",
    orange: "text-brand-orangeDark bg-brand-orangeLight",
    black: "text-slate-800 bg-brand-gray",
    green: "text-brand-blueDark bg-brand-blueLight",
    amber: "text-slate-800 bg-brand-gray",
    red: "text-brand-orangeDark bg-brand-orangeLight",
  };

  const displayValue = dual
    ? mode === "percentage"
      ? `${formatNumber(dual.percentage)}%`
      : formatNumber(dual.count)
    : `${formatNumber(value)}${suffix}`;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-white/10 dark:bg-slate-900">
      <div className="mb-2 flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
        {icon && (
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${accentClasses[accent]}`}>
            {icon}
          </span>
        )}
      </div>

      <p className="text-2xl font-bold text-brand-navyDark dark:text-white">{displayValue}</p>

      {dual && (
        <div className="mt-3 flex w-fit rounded-lg bg-slate-100 p-0.5 text-xs font-medium dark:bg-white/10">
          <button
            onClick={() => setMode("percentage")}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              mode === "percentage" ? "bg-white text-brand-blueDark shadow-sm dark:bg-slate-800" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            %
          </button>
          <button
            onClick={() => setMode("count")}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              mode === "count" ? "bg-white text-brand-blueDark shadow-sm dark:bg-slate-800" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            Count
          </button>
        </div>
      )}
    </div>
  );
}
