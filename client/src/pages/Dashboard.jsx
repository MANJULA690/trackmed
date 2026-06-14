import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from "chart.js";
import { medicineAPI, alertAPI, predictionAPI } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { PageLoader } from "../components/ui";

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
      { label: "Issued",   data: issued,   borderColor: "#6C47FF", backgroundColor: "rgba(108,71,255,0.08)", fill: true, tension: 0.45, pointRadius: 4, pointBackgroundColor: "#6C47FF", borderWidth: 2.5 },
      { label: "Received", data: received, borderColor: "#a78bfa", backgroundColor: "rgba(167,139,250,0.06)", fill: true, tension: 0.45, pointRadius: 4, pointBackgroundColor: "#a78bfa", borderWidth: 2.5 },
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
      backgroundColor: ["#6C47FF", "#f59e0b", "#ef4444"],
      borderWidth: 0, hoverOffset: 6,
    }],
  };

  const barData = {
    labels: preds.slice(0, 5).map(p => p.medicineName.split(" ").slice(0, 2).join(" ")),
    datasets: [{
      data: preds.slice(0, 5).map(p => p.predictedNext30Days),
      backgroundColor: ["rgba(108,71,255,0.85)","rgba(167,139,250,0.85)","rgba(245,158,11,0.85)","rgba(16,185,129,0.85)","rgba(59,130,246,0.85)"],
      borderRadius: 8, borderSkipped: false,
    }],
  };

  const baseOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1a1060", padding: 10, cornerRadius: 8 } },
    scales: {
      x: { grid: { color: "rgba(0,0,0,0.04)", drawBorder: false }, ticks: { color: "#94a3b8", font: { size: 11 } } },
      y: { grid: { color: "rgba(0,0,0,0.04)", drawBorder: false }, ticks: { color: "#94a3b8", font: { size: 11 } } },
    },
  };

  const greet = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
  const ICONS = { low_stock:"📦", out_of_stock:"🚫", expiry_warning:"⏳", expiry_critical:"🔴", expired:"❌" };

  return (
    <div>
      {/* ── Hero Banner (Medicotary-style) ─────────────────────── */}
      <div className="opacity-0 animate-fade-up" style={{
        marginBottom: 24, animationFillMode: "forwards",
        background: "linear-gradient(135deg, #ede9ff 0%, #ddd6fe 60%, #c4b5fd 100%)",
        borderRadius: 20,
        padding: "28px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        border: "1px solid #c4b5fd",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", right: 180, top: -40, width: 140, height: 140, borderRadius: "50%", background: "rgba(108,71,255,0.12)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 80, top: 10, width: 80, height: 80, borderRadius: "50%", background: "rgba(108,71,255,0.10)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 26, fontWeight: 800, color: "#1a1060", marginBottom: 6, letterSpacing: "-0.5px" }}>
            {greet()}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p style={{ fontSize: 13.5, color: "#5434d4", marginBottom: 14, fontWeight: 500 }}>
            Never worry about your Inventory
          </p>
          <p style={{ fontSize: 12, color: "#7c3aed" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          {stats?.expiringIn7 > 0 && (
            <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 14px", fontSize: 12.5, color: "#991b1b" }}>
              <span>🔴</span>
              <strong>{stats.expiringIn7}</strong> medicine{stats.expiringIn7 > 1 ? "s" : ""} expiring within 7 days —&nbsp;
              <button onClick={() => navigate("/alerts")} style={{ color: "#dc2626", fontWeight: 700, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontSize: 12.5 }}>
                view alerts →
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate("/inventory")}
          style={{
            position: "relative", zIndex: 1,
            padding: "12px 22px", background: "#6C47FF", color: "#fff",
            border: "none", borderRadius: 12, fontSize: 13.5, fontWeight: 700,
            cursor: "pointer", flexShrink: 0,
            boxShadow: "0 4px 16px rgba(108,71,255,0.40)",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            transition: "all 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#5434d4"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#6C47FF"; e.currentTarget.style.transform = "none"; }}
        >
          Manage Inventory →
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
        <div className="card opacity-0 animate-fade-up anim-delay-1" style={{ padding: "20px 22px", animationFillMode: "forwards", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 30, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{stats?.outOfStock || 0}</div>
            <div style={{ fontSize: 12.5, color: "#64748b", fontWeight: 500, marginTop: 4 }}>Out of stock products</div>
          </div>
        </div>

        <div className="card opacity-0 animate-fade-up anim-delay-2" style={{ padding: "20px 22px", animationFillMode: "forwards", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 30, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{stats?.lowStock || 0}</div>
            <div style={{ fontSize: 12.5, color: "#64748b", fontWeight: 500, marginTop: 4 }}>Products on low stock</div>
          </div>
        </div>

        <div className="card opacity-0 animate-fade-up anim-delay-3" style={{ padding: "20px 22px", animationFillMode: "forwards", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#ede9ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6C47FF" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 30, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{stats?.totalMedicines?.toLocaleString() || "0"}</div>
            <div style={{ fontSize: 12.5, color: "#64748b", fontWeight: 500, marginTop: 4 }}>Number of products</div>
          </div>
        </div>
      </div>

      {/* Stock percentage + weighted score row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Doughnut — Stock Health */}
        <div className="chart-panel opacity-0 animate-fade-up anim-delay-2" style={{ animationFillMode: "forwards" }}>
          <div className="chart-title" style={{ marginBottom: 4 }}>Stock Health</div>
          <div className="chart-subtitle" style={{ marginBottom: 16 }}>Overall inventory status</div>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <div style={{ height: 160, width: 160, flexShrink: 0 }}>
              <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1a1060", cornerRadius: 8 } }, cutout: "72%" }} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {["Healthy","Low Stock","Critical"].map((l, i) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#6b7280" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: ["#6C47FF","#f59e0b","#ef4444"][i], display: "inline-block" }}/>{l}
                  </span>
                  <span style={{ fontWeight: 700, color: "#374151" }}>{doughnutData.datasets[0].data[i]}</span>
                </div>
              ))}
              <div style={{ marginTop: 8, padding: "10px 14px", background: "#f8f7ff", borderRadius: 10, border: "1px solid #ede9ff" }}>
                <div style={{ fontSize: 11, color: "#b0a8d0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Stock %</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 24, fontWeight: 800, color: "#6C47FF" }}>
                  {stats?.totalMedicines ? Math.round(((stats.totalMedicines - (stats.outOfStock || 0)) / stats.totalMedicines) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Line chart — Stock Movement */}
        <div className="chart-panel opacity-0 animate-fade-up anim-delay-3" style={{ animationFillMode: "forwards" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div><div className="chart-title">Stock Movement</div><div className="chart-subtitle">Last 7 days — issued vs received</div></div>
            <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#94a3b8" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#6C47FF", display: "inline-block" }}/>Issued</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#a78bfa", display: "inline-block" }}/>Received</span>
            </div>
          </div>
          <div style={{ height: 200 }}><Line data={lineData} options={baseOpts} /></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="chart-panel opacity-0 animate-fade-up anim-delay-3" style={{ animationFillMode: "forwards" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div className="chart-title">Active Alerts</div>
            <button onClick={() => navigate("/alerts")} style={{ fontSize: 12, color: "#6C47FF", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>View all →</button>
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
            <button onClick={() => navigate("/predictions")} style={{ fontSize: 12, color: "#6C47FF", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Details →</button>
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
