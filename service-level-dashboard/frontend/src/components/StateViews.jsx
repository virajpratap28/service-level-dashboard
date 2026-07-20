import React from "react";

export function LoadingState({ label = "Loading dashboard data..." }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-blue border-t-transparent" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-brand-orangeLight bg-brand-orangeLight/40 text-brand-orangeDark">
      <p className="text-sm font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg border border-brand-orangeLight bg-white px-4 py-1.5 text-sm font-medium text-brand-orangeDark hover:bg-brand-orangeLight"
        >
          Retry
        </button>
      )}
    </div>
  );
}
