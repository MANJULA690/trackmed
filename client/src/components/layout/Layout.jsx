import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { alertAPI } from "../../api/services";

export default function Layout() {
  const [alertCount, setAlertCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await alertAPI.getAll({ isResolved: "false", isRead: "false", limit: 1 });
        setAlertCount(data.total || 0);
      } catch { /* silent */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-page">
      <Navbar alertCount={alertCount} />
      <main className="pt-[64px]">
        <div
          key={location.pathname}
          className="page-enter max-w-[1400px] mx-auto px-5 py-7 lg:px-8 lg:py-8"
        >
          <Outlet context={{ alertCount, setAlertCount }} />
        </div>
      </main>
    </div>
  );
}
