import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import DownloadMenu from "./DownloadMenu.jsx";

export default function Header({ title, subtitle, filters }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4 dark:border-white/10 dark:bg-slate-900">
      <div>
        <h1 className="text-xl font-bold text-brand-navyDark dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <DownloadMenu filters={filters} />

        <div className="text-right">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user?.username}</p>
          <p className="text-xs text-slate-400">{user?.role}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blueLight font-semibold text-brand-blueDark">
          {user?.username?.[0]?.toUpperCase() || "U"}
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-brand-blue hover:text-brand-blue dark:border-white/10 dark:text-slate-300"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
