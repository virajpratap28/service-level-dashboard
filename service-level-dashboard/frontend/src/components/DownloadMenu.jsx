import React, { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { exportCsvUrl, exportPdfUrl } from "../api/client";

const cleanParams = (obj) =>
  Object.fromEntries(Object.entries(obj || {}).filter(([, v]) => v !== undefined && v !== ""));

/**
 * DownloadMenu
 * ------------
 * A "download this page" control: exports the currently filtered
 * dataset as CSV, or a KPI summary as PDF. Rendered once per page
 * (via Layout -> Header) so every page gets a consistent download
 * section without each page needing its own export UI.
 */
export default function DownloadMenu({ filters = {}, dark = false }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const params = cleanParams(filters);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          dark
            ? "flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"
            : "flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-brand-blueLight hover:text-brand-blue dark:border-white/10 dark:text-slate-300 dark:hover:border-brand-blue dark:hover:text-brand-blueLight"
        }
      >
        <Download size={15} />
        Download
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-white/10 dark:bg-slate-900">
          <a
            href={exportCsvUrl(params)}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
          >
            <FileSpreadsheet size={16} className="text-brand-blue" />
            <div>
              <p className="font-medium">Export data (CSV)</p>
              <p className="text-xs text-slate-400">Filtered raw records</p>
            </div>
          </a>
          <a
            href={exportPdfUrl(params)}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
          >
            <FileText size={16} className="text-brand-orange" />
            <div>
              <p className="font-medium">Export summary (PDF)</p>
              <p className="text-xs text-slate-400">KPI summary snapshot</p>
            </div>
          </a>
        </div>
      )}
    </div>
  );
}
