import React, { useEffect, useState } from "react";
import { getFilterOptions } from "../api/client";
import DateRangeDropdown from "./DateRangeDropdown.jsx";
import Dropdown from "./Dropdown.jsx";

export default function FilterBar({ filters, onChange, showDateRange = true }) {
  const [options, setOptions] = useState({ lob: [], queue: [], site: [] });

  useEffect(() => {
    getFilterOptions()
      .then(setOptions)
      .catch(() => setOptions({ lob: [], queue: [], site: [] }));
  }, []);

  const update = (key, value) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  const toOptions = (arr) => arr.map((v) => ({ value: v, label: v }));

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-white/10 dark:bg-slate-900">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">LOB</label>
        <Dropdown value={filters.lob || ""} onChange={(v) => update("lob", v)} options={toOptions(options.lob)} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Queue</label>
        <Dropdown
          value={filters.queue || ""}
          onChange={(v) => update("queue", v)}
          options={toOptions(options.queue)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Site</label>
        <Dropdown value={filters.site || ""} onChange={(v) => update("site", v)} options={toOptions(options.site)} />
      </div>

      {showDateRange && <DateRangeDropdown filters={filters} onChange={onChange} />}

      <button
        onClick={() => onChange({})}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:border-brand-blue hover:text-brand-blue dark:border-white/10 dark:text-slate-400 dark:hover:border-brand-blue"
      >
        Clear
      </button>
    </div>
  );
}
