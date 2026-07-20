import React, { useEffect, useState } from "react";
import { RotateCcw, LogOut } from "lucide-react";
import { getFilterOptions } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import DateRangeDropdown from "./DateRangeDropdown.jsx";
import DownloadMenu from "./DownloadMenu.jsx";
import Dropdown from "./Dropdown.jsx";

const VIEWS = [
  { key: "daily", label: "Day" },
  { key: "weekly", label: "Week" },
  { key: "monthly", label: "Month" },
];

/**
 * OverviewHeader
 * --------------
 * A self-contained control bar for the Overview page: title +
 * breadcrumb subtitle, a Day/Week/Month view toggle, the shared date
 * range dropdown, LOB/site/queue selects, and a reset button — plus a
 * small download cluster so nothing from the standard header is
 * lost. Follows the app's light/dark theme toggle.
 */
export default function OverviewHeader({ filters, onChange }) {
  const [options, setOptions] = useState({ lob: [], queue: [], site: [] });
  const [dateLabel, setDateLabel] = useState("");
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getFilterOptions()
      .then(setOptions)
      .catch(() => setOptions({ lob: [], queue: [], site: [] }));
  }, []);

  const update = (key, value) => onChange({ ...filters, [key]: value || undefined });
  const view = filters.view || "daily";
  const toOptions = (arr) => arr.map((v) => ({ value: v, label: v }));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-brand-black">
      <div className="mb-3">
        <h1 className="text-xl font-extrabold text-brand-navy dark:text-white">Overview</h1>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-brand-blueLight">
          Chat operations · {dateLabel || "\u2014"} · {filters.site || "All sites"} · {filters.queue || "All queues"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex shrink-0 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-white/10 dark:bg-white/5">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => update("view", v.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                view === v.key
                  ? "bg-brand-blue text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <DateRangeDropdown filters={filters} onChange={onChange} onLabelChange={setDateLabel} />

        <Dropdown
          value={filters.lob || ""}
          onChange={(v) => update("lob", v)}
          options={toOptions(options.lob)}
          placeholder="All LOBs"
          className="w-36"
        />

        <Dropdown
          value={filters.site || ""}
          onChange={(v) => update("site", v)}
          options={toOptions(options.site)}
          placeholder="All sites"
          className="w-36"
        />

        <Dropdown
          value={filters.queue || ""}
          onChange={(v) => update("queue", v)}
          options={toOptions(options.queue)}
          placeholder="All queues"
          className="w-40"
        />

        <button
          type="button"
          onClick={() => onChange({ view })}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <RotateCcw size={14} />
          Reset
        </button>

        <div className="mx-1 h-6 w-px shrink-0 bg-slate-200 dark:bg-white/10" />

        <DownloadMenu filters={filters} />

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Logout"
          className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
}
