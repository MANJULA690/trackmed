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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: "\'Plus Jakarta Sans\', sans-serif",
              fontSize: "13px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
            },
            success: { iconTheme: { primary: "#00B5AD", secondary: "#fff" } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index              element={<Dashboard />} />
            <Route path="inventory"   element={<Inventory />} />
            <Route path="alerts"      element={<Alerts />} />
            <Route path="predictions" element={<Predictions />} />
            <Route path="reports"     element={<Reports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
