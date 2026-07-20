import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, CalendarDays } from "lucide-react";
import { listReportFiles } from "../api/client";

const MONTH_MAP = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toISO(d) {
  return d.toISOString().slice(0, 10);
}

function endOfMonth(year, monthIdx) {
  return new Date(year, monthIdx + 1, 0);
}

// Parse filenames like "SL_Jul_26.xlsx" -> { year: 2026, monthIdx: 6, label: "July 2026" }
function parseAvailableMonths(files) {
  const months = [];
  for (const f of files || []) {
    const match = /SL_([A-Za-z]{3})_(\d{2,4})/i.exec(f);
    if (!match) continue;
    const monKey = match[1].toLowerCase();
    if (!(monKey in MONTH_MAP)) continue;
    let year = parseInt(match[2], 10);
    if (year < 100) year += 2000;
    months.push({ year, monthIdx: MONTH_MAP[monKey] });
  }
  months.sort((a, b) => a.year - b.year || a.monthIdx - b.monthIdx);
  const seen = new Set();
  return months.filter((m) => {
    const key = `${m.year}-${m.monthIdx}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * DateRangeDropdown
 * ------------------
 * A single styled dropdown that replaces raw Start/End date pickers.
 * Offers relative ranges (All data / Last 90 days / Last 30 days /
 * Month to date) plus one entry per month that actually has data
 * loaded on the backend (via /reports/files), with the current
 * calendar month flagged "(partial)".
 */
export default function DateRangeDropdown({ filters, onChange, dark = false, onLabelChange }) {
  const [open, setOpen] = useState(false);
  const [months, setMonths] = useState([]);
  const [customMode, setCustomMode] = useState(false);
  const [customStart, setCustomStart] = useState(filters.start_date || "");
  const [customEnd, setCustomEnd] = useState(filters.end_date || "");
  const wrapRef = useRef(null);

  useEffect(() => {
    listReportFiles()
      .then((res) => setMonths(parseAvailableMonths(res.files)))
      .catch(() => setMonths([]));
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const today = useMemo(() => new Date(), []);

  const options = useMemo(() => {
    const opts = [];

    if (months.length > 0) {
      const first = months[0];
      const last = months[months.length - 1];
      const rangeLabel =
        first.monthIdx === last.monthIdx && first.year === last.year
          ? MONTH_NAMES[first.monthIdx].slice(0, 3)
          : `${MONTH_NAMES[first.monthIdx].slice(0, 3)}\u2013${MONTH_NAMES[last.monthIdx].slice(0, 3)}`;
      opts.push({
        key: "all",
        label: `All data (${rangeLabel})`,
        start: toISO(new Date(first.year, first.monthIdx, 1)),
        end: toISO(endOfMonth(last.year, last.monthIdx)),
      });
    }

    opts.push({
      key: "last90",
      label: "Last 90 days",
      start: toISO(new Date(today.getTime() - 89 * 86400000)),
      end: toISO(today),
    });
    opts.push({
      key: "last30",
      label: "Last 30 days",
      start: toISO(new Date(today.getTime() - 29 * 86400000)),
      end: toISO(today),
    });
    opts.push({
      key: "mtd",
      label: "Month to date",
      start: toISO(new Date(today.getFullYear(), today.getMonth(), 1)),
      end: toISO(today),
    });

    for (const m of months) {
      const isCurrent = m.year === today.getFullYear() && m.monthIdx === today.getMonth();
      opts.push({
        key: `${m.year}-${m.monthIdx}`,
        label: `${MONTH_NAMES[m.monthIdx]} ${m.year}${isCurrent ? " (partial)" : ""}`,
        start: toISO(new Date(m.year, m.monthIdx, 1)),
        end: toISO(isCurrent ? today : endOfMonth(m.year, m.monthIdx)),
      });
    }

    return opts;
  }, [months, today]);

  const selectedKey = useMemo(() => {
    const match = options.find((o) => o.start === filters.start_date && o.end === filters.end_date);
    return match?.key || (filters.start_date && filters.end_date ? "custom" : null);
  }, [options, filters.start_date, filters.end_date]);

  const selectedLabel =
    options.find((o) => o.key === selectedKey)?.label ||
    (selectedKey === "custom" ? `${filters.start_date} \u2192 ${filters.end_date}` : "Select date range");

  useEffect(() => {
    setCustomStart(filters.start_date || "");
    setCustomEnd(filters.end_date || "");
  }, [filters.start_date, filters.end_date]);

  useEffect(() => {
    onLabelChange?.(selectedLabel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLabel]);

  const handleSelect = (opt) => {
    onChange({ ...filters, start_date: opt.start, end_date: opt.end });
    setCustomMode(false);
    setOpen(false);
  };

  const applyCustomRange = () => {
    if (!customStart || !customEnd) return;
    const [start, end] = customStart <= customEnd ? [customStart, customEnd] : [customEnd, customStart];
    onChange({ ...filters, start_date: start, end_date: end });
    setCustomMode(false);
    setOpen(false);
  };

  const dateInputClasses =
    "w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-white [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-brand-blue";

  return (
    <div className="relative flex flex-col gap-1" ref={wrapRef}>
      {!dark && <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Date Range</label>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          dark
            ? "flex min-w-[170px] items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-brand-blue"
            : "flex min-w-[190px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-brand-blueLight focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
        }
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full z-20 mt-1 w-72 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
          {!customMode ? (
            <>
              <div className="max-h-72 overflow-y-auto py-1.5">
                {options.map((opt) => {
                  const isSelected = opt.key === selectedKey;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleSelect(opt)}
                      className={`flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm transition-colors ${
                        isSelected ? "bg-brand-blue/20 text-brand-blueLight" : "text-slate-200 hover:bg-white/5"
                      }`}
                    >
                      {opt.label}
                      {isSelected && <Check size={14} className="shrink-0" />}
                    </button>
                  );
                })}
                {options.length === 0 && (
                  <p className="px-3.5 py-2 text-sm text-slate-400">No workbooks loaded yet</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setCustomMode(true)}
                className={`flex w-full items-center justify-between gap-2 border-t border-slate-800 px-3.5 py-2.5 text-left text-sm font-semibold transition-colors ${
                  selectedKey === "custom" ? "bg-brand-blue/20 text-brand-blueLight" : "text-brand-blueLight hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={14} />
                  Custom range{"\u2026"}
                </span>
                {selectedKey === "custom" && <Check size={14} className="shrink-0" />}
              </button>
            </>
          ) : (
            <div className="p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Pick any start and end date
              </p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">From</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className={dateInputClasses}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">To</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className={dateInputClasses}
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setCustomMode(false)}
                  className="text-sm font-medium text-slate-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={applyCustomRange}
                  disabled={!customStart || !customEnd}
                  className="rounded-lg bg-brand-blue px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
