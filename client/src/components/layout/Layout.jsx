import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { alertAPI } from "../../api/services";

export default function Layout() {
  const [alertCount, setAlertCount] = useState(0);
  const [collapsed,  setCollapsed]  = useState(false);
  const location = useLocation();

  const fetchCount = async () => {
    try {
      const { data } = await alertAPI.getAll({ isResolved: "false", isRead: "false", limit: 1 });
      setAlertCount(data.total || 0);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 60000);
    return () => clearInterval(id);
  }, []);

  const sideW = collapsed ? 68 : 240;

  return (
    <div className="page-bg" style={{ display: "flex" }}>
      <Sidebar
        alertCount={alertCount}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      />
      <main
        key={location.pathname}
        style={{
          marginLeft: sideW,
          flex: 1,
          minHeight: "100vh",
          transition: "margin-left 0.28s cubic-bezier(.22,1,.36,1)",
          animation: "pageEnter 0.35s cubic-bezier(.22,1,.36,1) both",
        }}
      >
        <div style={{ padding: "28px 32px", maxWidth: 1400 }}>
          <Outlet context={{ alertCount, setAlertCount, refetchAlerts: fetchCount }} />
        </div>
      </main>
    </div>
  );
}
