import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { alertAPI } from "../../api/services";

export default function Layout() {
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await alertAPI.getAll({ isResolved: "false", isRead: "false", limit: 1 });
        setAlertCount(data.total || 0);
      } catch { /* silent */ }
    };
    fetch();
    const id = setInterval(fetch, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="page-bg" style={{ display: "flex" }}>
      <Sidebar alertCount={alertCount} />
      <main style={{ marginLeft: 240, flex: 1, minHeight: "100vh", position: "relative", zIndex: 1 }}>
        <div style={{ padding: "28px 32px", maxWidth: 1400 }}>
          <Outlet context={{ alertCount, setAlertCount }} />
        </div>
      </main>
    </div>
  );
}
