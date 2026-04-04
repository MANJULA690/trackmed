import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/layout/Layout";

import Login       from "./pages/Login";
import Dashboard   from "./pages/Dashboard";
import Inventory   from "./pages/Inventory";
import Alerts      from "./pages/Alerts";
import Predictions from "./pages/Predictions";
import Reports     from "./pages/Reports";
import Staff       from "./pages/Staff";
import Settings    from "./pages/Settings";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "13px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            },
            success: { iconTheme: { primary: "#00B5AD", secondary: "#fff" } },
          }}
        />

        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected — wrapped in Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index            element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="alerts"    element={<Alerts />} />
            <Route path="predictions" element={<Predictions />} />
            <Route path="reports"   element={<Reports />} />
            <Route path="staff"     element={<Staff />} />
            <Route path="settings"  element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
