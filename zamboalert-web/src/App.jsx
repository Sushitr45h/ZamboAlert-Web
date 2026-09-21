import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/login/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import SettingsPage from "./pages/settings/SettingsPage";
import PersonnelAlertPage from "./pages/personnel-alert/PersonnelAlertPage";

function PrivateRoute({ children }) {
  const auth = localStorage.getItem("zamboalert_auth");
  if (!auth) return <Navigate to="/login" replace />;
  try {
    const { expiry } = JSON.parse(auth);
    if (Date.now() > expiry) {
      localStorage.removeItem("zamboalert_auth");
      return <Navigate to="/login" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/personnel-alert"
          element={
            <PrivateRoute>
              <PersonnelAlertPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/manpower-alert"
          element={
            <PrivateRoute>
              <PersonnelAlertPage />
            </PrivateRoute>
          }
        />
        {/* Catch-all: redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

