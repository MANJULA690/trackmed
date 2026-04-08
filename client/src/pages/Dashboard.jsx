import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from "chart.js";
import { medicineAPI, alertAPI, predictionAPI } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { StatCard, PageLoader } from "../components/ui";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [alerts,  setAlerts]  = useState([]);
  const [preds,   setPreds]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a, p] = await Promise.all([
          medicineAPI.getStats(),
          alertAPI.getAll({ isResolved: "false", limit: 5 }),
          predictionAPI.getAll({ limit: 6 }),
        ]);
        setStats(s.data.stats);
        setAlerts(a.data.alerts);
        setPreds(p.data.predictions);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <PageLoader />;

  const movementDays = [...new Set((stats?.stockMovement || []).map(d => d._id.date))].sort();
  const issued   = movementDays.map(day => stats.stockMovement.find(d => d._id.date === day && d._id.type === "issued")?.total || 0);
  const received = movementDays.map(day => stats.stockMovement.find(d => d._id.date === day && d._id.type === "received")?.total || 0);

  const lineData = {
    labels: movementDays.map(d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })),
    datasets: [
      { label: "Issued",   data: issued,   borderColor: "#00B5AD", backgroundColor: "rgba(0,181,173,0.08)", fill: true, tension: 0.45, pointRadius: 4, pointBackgroundColor: "#00B5AD", borderWidth: 2.5 },
      { label: "Received", data: received, borderColor: "#6366f1", backgroundColor: "rgba(99,102,241,0.06)", fill: true, tension: 0.45, pointRadius: 4, pointBackgroundColor: "#6366f1", borderWidth: 2.5 },
    ],
  };

  const doughnutData = {
    labels: ["Healthy", "Low Stock", "Critical"],
    datasets: [{
      data: [
        Math.max(0, (stats?.totalMedicines || 0) - (stats?.lowStock || 0) - (stats?.outOfStock || 0)),
        stats?.lowStock || 0,
        (stats?.outOfStock || 0) + (stats?.expiredCount || 0),
      ],
      backgroundColor: ["#00B5AD", "#f59e0b", "#ef4444"],
      borderWidth: 0, hoverOffset: 6,
    }],
  };

  const barData = {
    labels: preds.slice(0, 5).map(p => p.medicineName.split(" ").slice(0, 2).join(" ")),
    datasets: [{
      data: preds.slice(0, 5).map(p => p.predictedNext30Days),
      backgroundColor: ["rgba(0,181,173,0.85)","rgba(99,102,241,0.85)","rgba(245,158,11,0.85)","rgba(16,185,129,0.85)","rgba(59,130,246,0.85)"],
      borderRadius: 8, borderSkipped: false,
    }],
  };

  const baseOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#0f172a", padding: 10, cornerRadius: 8 } },
    scales: {
      x: { grid: { color: "rgba(0,0,0,0.04)", drawBorder: false }, ticks: { color: "#94a3b8", font: { size: 11 } } },
      y: { grid: { color: "rgba(0,0,0,0.04)", drawBorder: false }, ticks: { color: "#94a3b8", font: { size: 11 } } },
    },
  };

  const greet = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
  const ICONS = { low_stock:"📦", out_of_stock:"🚫", expiry_warning:"⏳", expiry_critical:"🔴", expired:"💀" };

  return (
    <div>
      {/* Header — no Add Medicine button */}
      <div className="opacity-0 animate-fade-up" style={{ marginBottom: 28, animationFillMode: "forwards" }}>
        <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
          {greet()}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        {stats?.expiringIn7 > 0 && (
          <div style={{ marginTop: 14, padding: "10px 16px", background: "linear-gradient(135deg,#fff5f5,#fff)", border: "1px solid #fecaca", borderRadius: 12, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#991b1b" }}>
            <span>🔴</span>
            <strong>{stats.expiringIn7}</strong> medicine{stats.expiringIn7 > 1 ? "s" : ""} expiring within 7 days —&nbsp;
            <button onClick={() => navigate("/alerts")} style={{ color: "#dc2626", fontWeight: 600, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>
              view alerts →
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        <StatCard label="Total medicines" value={stats?.totalMedicines?.toLocaleString() || "0"} color="teal" delay="anim-delay-1"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
        />
        <StatCard label="Expiring in 30 days" value={stats?.expiringIn30 || "0"} sublabel={`${stats?.expiringIn7 || 0} critical (≤7 days)`} color="amber" delay="anim-delay-2"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
        <StatCard label="Low / Out of stock" value={`${stats?.lowStock || 0} / ${stats?.outOfStock || 0}`} sublabel="Low stock / Out of stock" color="red" delay="anim-delay-3"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
        />
        <StatCard label="Unread alerts" value={stats?.unreadAlerts || "0"} color="blue" delay="anim-delay-4"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
        />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="chart-panel opacity-0 animate-fade-up anim-delay-2" style={{ animationFillMode: "forwards" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div><div className="chart-title">Stock Movement</div><div className="chart-subtitle">Last 7 days — issued vs received</div></div>
            <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#94a3b8" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#00B5AD", display: "inline-block" }}/>Issued</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#6366f1", display: "inline-block" }}/>Received</span>
            </div>
          </div>
          <div style={{ height: 210 }}><Line data={lineData} options={baseOpts} /></div>
        </div>
        <div className="chart-panel opacity-0 animate-fade-up anim-delay-3" style={{ animationFillMode: "forwards" }}>
          <div className="chart-title" style={{ marginBottom: 4 }}>Stock Health</div>
          <div className="chart-subtitle" style={{ marginBottom: 16 }}>Overall inventory status</div>
          <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: "#0f172a", cornerRadius: 8 } }, cutout: "72%" }} />
          </div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {["Healthy","Low Stock","Critical"].map((l, i) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#6b7280" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: ["#00B5AD","#f59e0b","#ef4444"][i], display: "inline-block" }}/>{l}
                </span>
                <span style={{ fontWeight: 700, color: "#374151" }}>{doughnutData.datasets[0].data[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="chart-panel opacity-0 animate-fade-up anim-delay-3" style={{ animationFillMode: "forwards" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div className="chart-title">Active Alerts</div>
            <button onClick={() => navigate("/alerts")} style={{ fontSize: 12, color: "#00B5AD", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>View all →</button>
          </div>
          {alerts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8", fontSize: 13 }}>🎉 No active alerts</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {alerts.map(a => (
                <div key={a._id} className="alert-item" onClick={() => navigate("/alerts")}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{ICONS[a.alertType] || "⚠️"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.medicineName}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.message}</p>
                  </div>
                  <span className={a.severity === "critical" ? "pill-critical" : "pill-low"} style={{ flexShrink: 0 }}>{a.alertType.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="chart-panel opacity-0 animate-fade-up anim-delay-4" style={{ animationFillMode: "forwards" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div><div className="chart-title">Demand Predictions</div><div className="chart-subtitle">Predicted units — next 30 days</div></div>
            <button onClick={() => navigate("/predictions")} style={{ fontSize: 12, color: "#00B5AD", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Details →</button>
          </div>
          {preds.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8", fontSize: 13 }}>No prediction data yet</div>
          ) : (
            <div style={{ height: 200 }}>
              <Bar data={barData} options={{ ...baseOpts, scales: { x: { grid: { display: false }, ticks: { color: "#94a3b8", font: { size: 10 } } }, y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { color: "#94a3b8", font: { size: 10 } } } } }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
