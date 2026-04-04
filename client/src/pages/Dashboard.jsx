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
// import { formatDate, getExpiryLabel, formatCurrency } from "../utils/helpers";

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
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <PageLoader />;

  // Build chart data from stockMovement
  const movementDays = [...new Set((stats?.stockMovement || []).map(d => d._id.date))].sort();
  const issued   = movementDays.map(day => {
    const found = stats.stockMovement.find(d => d._id.date === day && d._id.type === "issued");
    return found?.total || 0;
  });
  const received = movementDays.map(day => {
    const found = stats.stockMovement.find(d => d._id.date === day && d._id.type === "received");
    return found?.total || 0;
  });

  const lineData = {
    labels: movementDays.map(d => {
      const dt = new Date(d);
      return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    }),
    datasets: [
      {
        label: "Issued",
        data: issued,
        borderColor: "#00B5AD",
        backgroundColor: "rgba(0,181,173,0.08)",
        fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2,
      },
      {
        label: "Received",
        data: received,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.05)",
        fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2,
      },
    ],
  };

  const doughnutData = {
    labels: ["Healthy", "Low Stock", "Critical/Expired"],
    datasets: [{
      data: [
        Math.max(0, (stats?.totalMedicines || 0) - (stats?.lowStock || 0) - (stats?.outOfStock || 0)),
        stats?.lowStock || 0,
        (stats?.outOfStock || 0) + (stats?.expiredCount || 0),
      ],
      backgroundColor: ["#00B5AD", "#f59e0b", "#ef4444"],
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  const barData = {
    labels: preds.slice(0, 5).map(p => p.medicineName.split(" ").slice(0, 2).join(" ")),
    datasets: [{
      label: "Predicted 30-day demand",
      data: preds.slice(0, 5).map(p => p.predictedNext30Days),
      backgroundColor: ["#00B5AD","#6366f1","#f59e0b","#10b981","#3b82f6"],
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { color: "#9ca3af", font: { size: 11 } } },
      y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { color: "#9ca3af", font: { size: 11 } } },
    },
  };

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-7 opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
        <h1 className="font-display text-2xl font-bold text-gray-900 tracking-tight">
          {greet()}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total medicines tracked" value={stats?.totalMedicines?.toLocaleString() || "0"}
          color="teal" delay="anim-delay-1"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
        />
        <StatCard label="Expiring within 30 days" value={stats?.expiringIn30 || "0"}
          color="amber" delay="anim-delay-2"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
        <StatCard label="Low / out of stock" value={`${stats?.lowStock || 0} / ${stats?.outOfStock || 0}`}
          color="red" delay="anim-delay-3"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
        />
        <StatCard label="Unread alerts" value={stats?.unreadAlerts || "0"}
          color="blue" delay="anim-delay-4"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Stock movement line chart */}
        <div className="lg:col-span-2 card p-5 opacity-0 animate-fade-up anim-delay-2" style={{ animationFillMode: "forwards" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-gray-900 text-sm">Stock Movement</h3>
              <p className="text-xs text-gray-400">Last 7 days — issued vs received</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-brand-500 inline-block"/>Issued</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block"/>Received</span>
            </div>
          </div>
          <div className="h-[200px]">
            <Line data={lineData} options={chartOpts} />
          </div>
        </div>

        {/* Doughnut */}
        <div className="card p-5 opacity-0 animate-fade-up anim-delay-3" style={{ animationFillMode: "forwards" }}>
          <h3 className="font-display font-bold text-gray-900 text-sm mb-1">Stock Health</h3>
          <p className="text-xs text-gray-400 mb-4">Overall inventory status</p>
          <div className="h-[150px] flex items-center justify-center">
            <Doughnut data={doughnutData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              cutout: "70%",
            }} />
          </div>
          <div className="space-y-1.5 mt-4">
            {["Healthy","Low Stock","Critical/Expired"].map((l, i) => (
              <div key={l} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-gray-500">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: ["#00B5AD","#f59e0b","#ef4444"][i] }}/>
                  {l}
                </span>
                <span className="font-medium text-gray-700">{doughnutData.datasets[0].data[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active alerts */}
        <div className="card p-5 opacity-0 animate-fade-up anim-delay-3" style={{ animationFillMode: "forwards" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-gray-900 text-sm">Active Alerts</h3>
            <button onClick={() => navigate("/alerts")} className="text-xs text-brand-500 hover:text-brand-600 font-medium">View all →</button>
          </div>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">🎉 No active alerts</div>
          ) : (
            <div className="space-y-2">
              {alerts.map((a) => (
                <div key={a._id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => navigate("/alerts")}>
                  <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    a.severity === "critical" ? "bg-red-500" : a.severity === "warning" ? "bg-amber-400" : "bg-blue-400"
                  }`}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{a.medicineName}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{a.message}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    a.severity === "critical" ? "pill-critical" : "pill-low"
                  }`}>
                    {a.alertType.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Demand predictions bar */}
        <div className="card p-5 opacity-0 animate-fade-up anim-delay-4" style={{ animationFillMode: "forwards" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-gray-900 text-sm">Demand Predictions</h3>
              <p className="text-xs text-gray-400">Predicted units needed — next 30 days</p>
            </div>
            <button onClick={() => navigate("/predictions")} className="text-xs text-brand-500 hover:text-brand-600 font-medium">Details →</button>
          </div>
          {preds.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No prediction data yet</div>
          ) : (
            <div className="h-[180px]">
              <Bar data={barData} options={{
                ...chartOpts,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, ticks: { color: "#9ca3af", font: { size: 10 } } },
                  y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { color: "#9ca3af", font: { size: 10 } } },
                },
              }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
