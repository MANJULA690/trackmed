import { useState, useCallback } from "react";
import { alertAPI } from "../api/services";
import { PageHeader, EmptyState, PageLoader } from "../components/ui";
import { useFetch } from "../hooks/useFetch";
import { timeAgo } from "../utils/helpers";
import toast from "react-hot-toast";

const SEV = {
  critical: { dot: "#ef4444", leftBar: "#ef4444", bg: "#fff5f5", border: "#fecaca" },
  warning:  { dot: "#f59e0b", leftBar: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
  info:     { dot: "#3b82f6", leftBar: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
};

const ICONS = { low_stock:"📦", out_of_stock:"🚫", expiry_warning:"⏳", expiry_critical:"🔴", expired:"💀" };

export default function Alerts() {
  const [filter,   setFilter]   = useState("all");
  const [resolved, setResolved] = useState(false);
  const [page,     setPage]     = useState(1);

  const buildParams = useCallback(() => ({
    isResolved: String(resolved),
    ...(filter !== "all" ? { severity: filter } : {}),
    page, limit: 20,
  }), [filter, resolved, page]);

  const { data, loading, refetch } = useFetch(() => alertAPI.getAll(buildParams()), [filter, resolved, page]);

  const alerts   = data?.alerts || [];
  const total    = data?.total || 0;
  const totalPgs = Math.ceil(total / 20);

  const handleRead    = async (id) => { await alertAPI.markRead(id); refetch(); };
  const handleResolve = async (id) => { await alertAPI.resolve(id); toast.success("Alert resolved ✓"); refetch(); };
  const handleMarkAll = async ()   => { await alertAPI.markAllRead(); toast.success("All marked as read"); refetch(); };
  const handleScan    = async ()   => { toast.loading("Scanning inventory..."); await alertAPI.triggerScan(); toast.dismiss(); toast.success("Scan complete!"); refetch(); };

  const FILTERS = [["all","All"], ["critical","Critical"], ["warning","Warning"], ["info","Info"]];

  return (
    <div>
      <PageHeader
        title="Alerts"
        subtitle={`${total} active alert${total !== 1 ? "s" : ""}`}
        actions={
          <>
            <button onClick={handleMarkAll} className="btn-secondary" style={{ fontSize: 12 }}>Mark all read</button>
            <button onClick={handleScan} className="btn-primary" style={{ fontSize: 12 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              Run scan
            </button>
          </>
        }
      />

      {/* Filter row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, background: "#fff", padding: 4, borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          {FILTERS.map(([v, l]) => (
            <button key={v} onClick={() => { setFilter(v); setPage(1); }} style={{
              padding: "6px 16px", borderRadius: 9, border: "none",
              fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              transition: "all 0.15s",
              background: filter === v ? "#0d2d4e" : "transparent",
              color: filter === v ? "#fff" : "#64748b",
              boxShadow: filter === v ? "0 2px 6px rgba(13,45,78,0.2)" : "none",
            }}>{l}</button>
          ))}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b", cursor: "pointer", marginLeft: "auto" }}>
          <input type="checkbox" checked={resolved} onChange={e => { setResolved(e.target.checked); setPage(1); }}
            style={{ accentColor: "#00B5AD", width: 15, height: 15 }} />
          Show resolved
        </label>
      </div>

      {/* Alert list */}
      {loading ? <PageLoader /> : alerts.length === 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState icon="🎉" title="No alerts" subtitle="All medicines are within safe stock and expiry limits" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {alerts.map(alert => {
            const s = SEV[alert.severity] || SEV.info;
            return (
              <div key={alert._id} style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "14px 18px",
                background: !alert.isRead ? s.bg : "#fafafa",
                border: `1px solid ${!alert.isRead ? s.border : "#f1f5f9"}`,
                borderRadius: 14,
                borderLeft: `4px solid ${s.leftBar}`,
                transition: "all 0.15s",
                position: "relative",
              }}>
                {/* Icon */}
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{ICONS[alert.alertType] || "⚠️"}</span>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b" }}>{alert.medicineName}</span>
                    <span className={alert.severity === "critical" ? "pill-critical" : alert.severity === "warning" ? "pill-low" : "pill-info"}>
                      {alert.alertType.replace(/_/g, " ")}
                    </span>
                    {!alert.isRead && (
                      <span style={{
                        width: 7, height: 7, borderRadius: "50%", background: "#00B5AD",
                        display: "inline-block", flexShrink: 0,
                        boxShadow: "0 0 0 2px rgba(0,181,173,0.25)",
                      }} />
                    )}
                  </div>
                  <p style={{ fontSize: 12.5, color: "#64748b", marginBottom: 4, lineHeight: 1.5 }}>{alert.message}</p>
                  <p style={{ fontSize: 11, color: "#94a3b8" }}>{timeAgo(alert.createdAt)}</p>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                  {!alert.isRead && (
                    <button onClick={() => handleRead(alert._id)} style={{
                      fontSize: 11, padding: "4px 10px", borderRadius: 8,
                      border: "1px solid #e5e7eb", background: "#fff",
                      color: "#64748b", cursor: "pointer", fontWeight: 500,
                      transition: "all 0.15s",
                    }}>Mark read</button>
                  )}
                  {!alert.isResolved && (
                    <button onClick={() => handleResolve(alert._id)} style={{
                      fontSize: 11, padding: "4px 10px", borderRadius: 8,
                      border: "1px solid #bbf7d0", background: "#f0fdf4",
                      color: "#166534", cursor: "pointer", fontWeight: 700,
                      transition: "all 0.15s",
                    }}>Resolve ✓</button>
                  )}
                  {alert.isResolved && (
                    <span style={{ fontSize: 11, color: "#94a3b8", padding: "4px 10px" }}>Resolved</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
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
