import { useState, useCallback } from "react";
import { alertAPI } from "../api/services";
import { PageHeader, EmptyState, PageLoader } from "../components/ui";
import { useFetch } from "../hooks/useFetch";
import { timeAgo } from "../utils/helpers";
import toast from "react-hot-toast";

const SEVERITY_STYLES = {
  critical: { dot: "bg-red-500",   pill: "pill-critical", row: "border-l-2 border-l-red-400" },
  warning:  { dot: "bg-amber-400", pill: "pill-low",      row: "border-l-2 border-l-amber-400" },
  info:     { dot: "bg-blue-400",  pill: "pill-info",     row: "border-l-2 border-l-blue-300" },
};

const ALERT_ICONS = {
  low_stock:       "📦",
  out_of_stock:    "🚫",
  expiry_warning:  "⏳",
  expiry_critical: "🔴",
  expired:         "☠️",
};

export default function Alerts() {
  const [filter,   setFilter]   = useState("all");       // all | critical | warning
  const [resolved, setResolved] = useState(false);
  const [page,     setPage]     = useState(1);

  const buildParams = useCallback(() => ({
    isResolved: String(resolved),
    ...(filter !== "all" ? { severity: filter } : {}),
    page, limit: 20,
  }), [filter, resolved, page]);

  const { data, loading, refetch } = useFetch(
    () => alertAPI.getAll(buildParams()),
    [filter, resolved, page]
  );

  const handleRead   = async (id) => { await alertAPI.markRead(id);   refetch(); };
  const handleResolve = async (id) => { await alertAPI.resolve(id);   toast.success("Alert resolved"); refetch(); };
  const handleMarkAll = async () => { await alertAPI.markAllRead();   toast.success("All marked read"); refetch(); };
  const handleScan   = async () => {
    toast.loading("Scanning...");
    await alertAPI.triggerScan();
    toast.dismiss();
    toast.success("Scan complete");
    refetch();
  };

  const alerts    = data?.alerts || [];
  const total     = data?.total || 0;
  const totalPgs  = Math.ceil(total / 20);

  return (
    <div>
      <PageHeader
        title="Alerts"
        subtitle={`${total} active alert${total !== 1 ? "s" : ""}`}
        actions={
          <>
            <button onClick={handleMarkAll} className="btn-secondary text-xs">Mark all read</button>
            <button onClick={handleScan} className="btn-primary text-xs">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              Run scan
            </button>
          </>
        }
      />

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {[["all","All"], ["critical","Critical"], ["warning","Warning"], ["info","Info"]].map(([v,l]) => (
          <button key={v} onClick={() => { setFilter(v); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
              filter === v ? "bg-navy text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}>
            {l}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
            <input type="checkbox" checked={resolved} onChange={e => { setResolved(e.target.checked); setPage(1); }}
              className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
            Show resolved
          </label>
        </div>
      </div>

      {/* Alerts list */}
      {loading ? <PageLoader /> : alerts.length === 0 ? (
        <div className="card">
          <EmptyState icon="🎉" title="No alerts found" subtitle="All medicines are within safe stock and expiry limits" />
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const s = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
            return (
              <div key={alert._id}
                   className={`card p-4 flex items-start gap-3 transition-all duration-150 ${s.row} ${!alert.isRead ? "bg-white" : "bg-gray-50/80"}`}>
                <span className="text-xl flex-shrink-0 mt-0.5">{ALERT_ICONS[alert.alertType] || "⚠️"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className={`text-sm font-medium ${!alert.isRead ? "text-gray-900" : "text-gray-600"}`}>
                      {alert.medicineName}
                    </p>
                    <span className={s.pill}>{alert.alertType.replace(/_/g, " ")}</span>
                    {!alert.isRead && <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0"/>}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{alert.message}</p>
                  <p className="text-[11px] text-gray-400">{timeAgo(alert.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!alert.isRead && (
                    <button onClick={() => handleRead(alert._id)}
                      className="text-[11px] text-gray-400 hover:text-brand-500 px-2 py-1 rounded hover:bg-brand-50 transition-colors">
                      Mark read
                    </button>
                  )}
                  {!alert.isResolved && (
                    <button onClick={() => handleResolve(alert._id)}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50 transition-colors font-medium">
                      Resolve ✓
                    </button>
                  )}
                  {alert.isResolved && (
                    <span className="text-[11px] text-gray-400 px-2 py-1">Resolved</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPgs > 1 && (
        <div className="flex justify-between items-center mt-4">
          <p className="text-xs text-gray-400">Page {page} of {totalPgs}</p>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs py-1 px-2.5 disabled:opacity-40">← Prev</button>
            <button disabled={page === totalPgs} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs py-1 px-2.5 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
