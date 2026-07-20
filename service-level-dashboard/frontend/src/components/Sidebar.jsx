import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  Headphones,
  Grid3x3,
  BarChart3,
  Timer,
  Calendar,
  CalendarDays,
  CalendarRange,
  Folder,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const ANALYTICS_ITEMS = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/queue", label: "Queue Analysis", icon: Headphones },
  { to: "/site", label: "Site × Queue", icon: Grid3x3 },
  { to: "/story", label: "Trends & Stories", icon: BarChart3 },
];

const OPERATIONS_ITEMS = [
  { to: "/hourly", label: "Hourly", icon: Timer },
  { to: "/daily", label: "Daily", icon: Calendar },
  { to: "/weekly", label: "Weekly", icon: CalendarDays },
  { to: "/monthly", label: "Monthly", icon: CalendarRange },
  { to: "/reports", label: "Reports", icon: Folder },
];

function NavGroup({ title, items }) {
  return (
    <div className="mb-5">
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-blueLight text-brand-blue dark:bg-brand-blue/15 dark:text-brand-blueLight"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                }`
              }
            >
              <Icon size={17} strokeWidth={2} />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-5 dark:border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue text-white">
          <Activity size={18} strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-slate-800 dark:text-white">Service Level</p>
          <p className="text-[11px] font-medium leading-tight tracking-wider text-slate-400 dark:text-slate-500">
            DASHBOARD
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <NavGroup title="Analytics" items={ANALYTICS_ITEMS} />
        <NavGroup title="Operations" items={OPERATIONS_ITEMS} />
      </nav>

      <div className="border-t border-slate-200 px-4 py-3 dark:border-white/10">
        <div className="flex items-center justify-between rounded-lg px-1 py-2">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
            Theme: {theme === "dark" ? "Dark" : "Light"}
          </span>
          <button
            onClick={toggleTheme}
            role="switch"
            aria-checked={theme === "dark"}
            aria-label="Toggle theme"
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              theme === "dark" ? "bg-brand-blue" : "bg-slate-200"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                theme === "dark" ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-2 rounded-lg px-1 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-brand-orange dark:text-slate-400 dark:hover:text-brand-orange"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
