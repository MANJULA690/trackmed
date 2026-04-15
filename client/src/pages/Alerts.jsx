import { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { alertAPI } from "../api/services";
import { PageHeader, EmptyState, PageLoader } from "../components/ui";
import { timeAgo } from "../utils/helpers";
import toast from "react-hot-toast";

const SEV = {
  critical: { dot: "#ef4444", leftBar: "#ef4444", bg: "#fff5f5", border: "#fecaca" },
  warning:  { dot: "#f59e0b", leftBar: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
};
const ICONS = { low_stock:"📦", out_of_stock:"🚫", expiry_warning:"⏳", expiry_critical:"🔴", expired:"❌" };

// Maps filter button → alertType values
// const TYPE_FILTER_MAP = {
//   all:      null,
//   critical: ["expiry_critical", "out_of_stock", "expired"],
//   warning:  ["expiry_warning", "low_stock"],
//   resolved: null,
// };

export default function Alerts() {
  const { refetchAlerts } = useOutletContext() || {};
  const [filter,   setFilter]   = useState("all");
  const [page,     setPage]     = useState(1);
  const [alerts,   setAlerts]   = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);

  // Use a ref-based interval so alerts auto-refresh every 30s
  const fetchRef = useRef(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const isResolved = filter === "resolved";
      const params = { isResolved: String(isResolved), page, limit: 20 };

      // Apply alertType filter for critical/warning
      if (filter === "critical") params.alertType = "expiry_critical,out_of_stock,expired";
      if (filter === "warning")  params.alertType = "expiry_warning,low_stock";

      const { data } = await alertAPI.getAll(params);
      setAlerts(data.alerts || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchAlerts();
    // Auto-refresh every 30s to stay in sync with inventory changes
    const id = setInterval(fetchAlerts, 30000);
    fetchRef.current = id;
    return () => clearInterval(id);
  }, [fetchAlerts]);

  const totalPgs = Math.ceil(total / 20);

  const handleRead    = async (id) => { await alertAPI.markRead(id); fetchAlerts(); refetchAlerts?.(); };
  const handleResolve = async (id) => { await alertAPI.resolve(id); toast.success("Alert resolved ✓"); fetchAlerts(); refetchAlerts?.(); };
  const handleMarkAll = async ()   => { await alertAPI.markAllRead(); toast.success("All marked as read"); fetchAlerts(); refetchAlerts?.(); };
  // const handleScan    = async ()   => {
  //   const tid = toast.loading("Scanning inventory...");
  //   try { await alertAPI.triggerScan(); toast.dismiss(tid); toast.success("Scan complete — alerts updated!"); fetchAlerts(); refetchAlerts?.(); }
  //   catch { toast.dismiss(tid); toast.error("Scan failed"); }
  // };

  const FILTER_BTNS = [
    { key: "all",      label: "All" },
    { key: "critical", label: "Critical" },
    { key: "warning",  label: "Warning" },
    { key: "resolved", label: "Resolved" },
  ];

  return (
    <div>
      <PageHeader
        title="Alerts"
        subtitle={`${total} ${filter === "resolved" ? "resolved" : "active"} alert${total !== 1 ? "s" : ""}`}
        actions={
          <>
            <button onClick={handleMarkAll} className="btn-secondary" style={{ fontSize: 12 }}>Mark all read</button>
            {/* <button onClick={handleScan} className="btn-primary" style={{ fontSize: 12 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              Run scan
            </button> */}
          </>
        }
      />

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, background: "#fff", padding: 4, borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          {FILTER_BTNS.map(({ key, label }) => (
            <button key={key} onClick={() => { setFilter(key); setPage(1); }} style={{
              padding: "6px 16px", borderRadius: 9, border: "none",
              fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
              background: filter === key ? "#0d2d4e" : "transparent",
              color: filter === key ? "#fff" : "#64748b",
              boxShadow: filter === key ? "0 2px 6px rgba(13,45,78,0.2)" : "none",
            }}>{label}</button>
          ))}
        </div>

        {/* Live indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse-ring 2s ease-in-out infinite" }}/>
          Auto-refreshes every 30s
        </div>
      </div>

      {/* List */}
      {loading ? <PageLoader /> : alerts.length === 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState icon={filter === "resolved" ? "✅" : "🎉"}
            title={filter === "resolved" ? "No resolved alerts" : "No alerts"}
            subtitle={filter === "resolved" ? "Nothing has been resolved yet" : "All medicines are within safe limits"} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {alerts.map((alert, idx) => {
            const s = SEV[alert.severity] || { dot: "#94a3b8", leftBar: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0" };
            return (
              <div key={alert._id}
                className="opacity-0 animate-fade-up"
                style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  padding: "14px 18px",
                  background: alert.isResolved ? "#fafafa" : (!alert.isRead ? s.bg : "#fff"),
                  border: `1px solid ${alert.isResolved ? "#f1f5f9" : (!alert.isRead ? s.border : "#f1f5f9")}`,
                  borderRadius: 14,
                  borderLeft: `4px solid ${alert.isResolved ? "#d1d5db" : s.leftBar}`,
                  transition: "all 0.15s",
                  animationDelay: `${idx * 0.04}s`,
                  animationFillMode: "forwards",
                  opacity: alert.isResolved ? 0.7 : 1,
                }}>
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{ICONS[alert.alertType] || "⚠️"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: alert.isResolved ? "#6b7280" : "#1e293b" }}>{alert.medicineName}</span>
                    <span className={alert.severity === "critical" ? "pill-critical" : "pill-low"}>
                      {alert.alertType.replace(/_/g, " ")}
                    </span>
                    {!alert.isRead && !alert.isResolved && (
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00B5AD", display: "inline-block", flexShrink: 0, boxShadow: "0 0 0 2px rgba(0,181,173,0.25)" }} />
                    )}
                    {alert.isResolved && (
                      <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>✓ Resolved</span>
                    )}
                  </div>
                  <p style={{ fontSize: 12.5, color: "#64748b", marginBottom: 4, lineHeight: 1.5 }}>{alert.message}</p>
                  <p style={{ fontSize: 11, color: "#94a3b8" }}>{timeAgo(alert.createdAt)}</p>
                </div>
                {!alert.isResolved && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                    {!alert.isRead && (
                      <button onClick={() => handleRead(alert._id)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#64748b", cursor: "pointer", fontWeight: 500 }}>
                        Mark read
                      </button>
                    )}
                    <button onClick={() => handleResolve(alert._id)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534", cursor: "pointer", fontWeight: 700 }}>
                      Resolve ✓
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPgs > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Page {page} of {totalPgs} · {total} total</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary" style={{ fontSize: 12, padding: "6px 12px", opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
            <button disabled={page === totalPgs} onClick={() => setPage(p => p + 1)} className="btn-secondary" style={{ fontSize: 12, padding: "6px 12px", opacity: page === totalPgs ? 0.4 : 1 }}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
