import React, { useEffect, useRef, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Download, Image as ImageIcon, FileSpreadsheet, ChevronDown } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } },
    tooltip: { mode: "index", intersect: false },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { autoSkip: false, maxRotation: 65, minRotation: 45, font: { size: 10 } },
    },
    y: { grid: { color: "#f1f5f9" } },
  },
};

function slugify(text) {
  return (text || "chart").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function chartToCsv(chart) {
  const header = ["Label", ...chart.datasets.map((d) => d.label || "Series")];
  const rows = chart.labels.map((label, i) => [label, ...chart.datasets.map((d) => d.data[i] ?? "")]);
  return [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
}

/**
 * ChartCard
 * ---------
 * Renders a Chart.js payload of the shape returned by the backend's
 * chart_service: { type: "line"|"bar", labels: [...], datasets: [...] }
 * Includes a per-chart download menu (PNG image / CSV of the plotted data).
 */
export default function ChartCard({ title, chart, height = 260 }) {
  const chartRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleDownloadPng = () => {
    const instance = chartRef.current;
    if (!instance) return;
    const url = instance.toBase64Image("image/png", 1);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugify(title)}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setMenuOpen(false);
  };

  const handleDownloadCsv = () => {
    if (!chart) return;
    downloadBlob(chartToCsv(chart), `${slugify(title)}.csv`, "text/csv;charset=utf-8;");
    setMenuOpen(false);
  };

  const hasData = chart && chart.labels && chart.labels.length > 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-white/10 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-navyDark dark:text-white">{title}</h3>

        {hasData && (
          <div className="relative" ref={wrapRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={`Download ${title}`}
              className="flex items-center gap-1 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
            >
              <Download size={14} />
              <ChevronDown size={11} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-slate-900">
                <button
                  onClick={handleDownloadPng}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  <ImageIcon size={13} /> Download PNG
                </button>
                <button
                  onClick={handleDownloadCsv}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  <FileSpreadsheet size={13} /> Download CSV
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-400">No data available</div>
      ) : (
        <div style={{ height }}>
          {chart.type === "bar" ? (
            <Bar ref={chartRef} data={{ labels: chart.labels, datasets: chart.datasets }} options={baseOptions} />
          ) : (
            <Line ref={chartRef} data={{ labels: chart.labels, datasets: chart.datasets }} options={baseOptions} />
          )}
        </div>
      )}
    </div>
  );
}
