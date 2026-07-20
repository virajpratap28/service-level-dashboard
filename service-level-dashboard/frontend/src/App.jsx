import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import ExecutiveDashboard from "./pages/ExecutiveDashboard.jsx";
import HourlyDashboard from "./pages/HourlyDashboard.jsx";
import DailyDashboard from "./pages/DailyDashboard.jsx";
import WeeklyDashboard from "./pages/WeeklyDashboard.jsx";
import MonthlyDashboard from "./pages/MonthlyDashboard.jsx";
import QueueAnalysis from "./pages/QueueAnalysis.jsx";
import SiteAnalysis from "./pages/SiteAnalysis.jsx";
import DetailedReport from "./pages/DetailedReport.jsx";
import Reports from "./pages/Reports.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ExecutiveDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hourly"
        element={
          <ProtectedRoute>
            <HourlyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/daily"
        element={
          <ProtectedRoute>
            <DailyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/weekly"
        element={
          <ProtectedRoute>
            <WeeklyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/monthly"
        element={
          <ProtectedRoute>
            <MonthlyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/queue"
        element={
          <ProtectedRoute>
            <QueueAnalysis />
          </ProtectedRoute>
        }
      />
      <Route
        path="/site"
        element={
          <ProtectedRoute>
            <SiteAnalysis />
          </ProtectedRoute>
        }
      />
      <Route
        path="/story"
        element={
          <ProtectedRoute>
            <DetailedReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
