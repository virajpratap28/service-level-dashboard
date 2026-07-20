import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * Dropdown
 * --------
 * A fully custom single-select control (no native <select>/<option>).
 * Native option popups are rendered by the OS/browser, not by our
 * CSS, which is why they could go invisible under dark mode on some
 * browsers. Rendering our own list sidesteps that entirely and looks
 * identical everywhere.
 */
export default function Dropdown({ value, onChange, options, placeholder = "All", className = "" }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selectedLabel = value ? options.find((o) => o.value === value)?.label || value : placeholder;

  const itemClasses = (active) =>
    `flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm transition-colors ${
      active
        ? "bg-brand-blueLight text-brand-blueDark dark:bg-brand-blue/20 dark:text-brand-blueLight"
        : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
    }`;

  return (
    <div className={`relative shrink-0 ${className}`} ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-brand-blueLight focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 max-h-72 w-full min-w-[11rem] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={itemClasses(!value)}
          >
            {placeholder}
            {!value && <Check size={14} />}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={itemClasses(value === opt.value)}
            >
              <span className="truncate">{opt.label}</span>
              {value === opt.value && <Check size={14} className="shrink-0" />}
            </button>
          ))}
          {options.length === 0 && <p className="px-3.5 py-2 text-sm text-slate-400">No options available</p>}
        </div>
      )}
    </div>
  );
}
