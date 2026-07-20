import React, { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout.jsx";
import FilterBar from "../components/FilterBar.jsx";
import { exportCsvUrl, exportPdfUrl, listReportFiles, uploadWorkbook } from "../api/client";

export default function Reports() {
  const [filters, setFilters] = useState({});
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const refreshFiles = () => {
    listReportFiles()
      .then((res) => setFiles(res.files || []))
      .catch(() => setFiles([]));
  };

  useEffect(() => {
    refreshFiles();
  }, []);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await uploadWorkbook(file);
      setMessage(`"${res.filename}" uploaded and indexed successfully.`);
      refreshFiles();
    } catch (err) {
      setError(err?.response?.data?.detail || "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const cleanParams = () => Object.fromEntries(Object.entries(filters).filter(([, v]) => v));

  return (
    <Layout title="Reports" subtitle="Upload workbooks and export filtered reports" filters={filters}>
      <div className="space-y-6">
        {/* Upload */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="mb-1 text-sm font-semibold text-brand-navyDark">Upload Excel Workbook</h3>
          <p className="mb-4 text-xs text-slate-500">
            Upload SL_&lt;Month&gt;_&lt;Year&gt;.xlsx workbooks matching the expected schema. New uploads are
            indexed immediately.
          </p>

          <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blueDark">
            {uploading ? "Uploading..." : "Choose File"}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>

          {message && <p className="mt-3 rounded-lg bg-brand-blueLight px-3 py-2 text-xs text-brand-blueDark">{message}</p>}
          {error && <p className="mt-3 rounded-lg bg-brand-orangeLight px-3 py-2 text-xs text-brand-orangeDark">{error}</p>}

          {files.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Currently Loaded Workbooks
              </p>
              <ul className="flex flex-wrap gap-2">
                {files.map((f) => (
                  <li
                    key={f}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Export */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-brand-navyDark">Export Report</h3>
          <div className="mb-4">
            <FilterBar filters={filters} onChange={setFilters} />
          </div>

          <div className="flex gap-3">
            <a
              href={exportCsvUrl(cleanParams())}
              className="rounded-lg border border-brand-navy px-4 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-navy hover:text-white"
            >
              ⬇ Export CSV
            </a>
            <a
              href={exportPdfUrl(cleanParams())}
              className="rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navyDark"
            >
              ⬇ Export PDF Summary
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
