import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { predictionAPI } from "../api/services";
import { PageHeader, PageLoader, EmptyState } from "../components/ui";
import { useFetch } from "../hooks/useFetch";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const TREND_BADGE = {
  increasing:        { label: "↑ Increasing", cls: "bg-emerald-50 text-emerald-700" },
  decreasing:        { label: "↓ Decreasing", cls: "bg-red-50 text-red-500" },
  stable:            { label: "→ Stable",      cls: "bg-gray-100 text-gray-600" },
  insufficient_data: { label: "~ No data",    cls: "bg-gray-100 text-gray-400" },
};

const CONF_BADGE = { 
  high:   "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  low:    "bg-red-50 text-red-400",
};

export default function Predictions() {
  const { data, loading } = useFetch(() => predictionAPI.getAll({ limit: 12 }), []);
  const predictions = data?.predictions || [];

  const barData = {
    labels: predictions.map(p => p.medicineName.split(" ").slice(0, 2).join(" ")),
    datasets: [{
      label: "Predicted demand (30 days)",
      data: predictions.map(p => p.predictedNext30Days),
      backgroundColor: predictions.map(p =>
        p.needsRestock ? "#ef4444" : p.trend === "increasing" ? "#00B5AD" : "#6366f1"
      ),
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const stockData = {
    labels: predictions.map(p => p.medicineName.split(" ").slice(0, 2).join(" ")),
    datasets: [
      {
        label: "Current stock",
        data: predictions.map(p => p.currentStock),
        backgroundColor: "rgba(99,102,241,0.7)",
        borderRadius: 4, borderSkipped: false,
      },
      {
        label: "Predicted need",
        data: predictions.map(p => p.predictedNext30Days),
        backgroundColor: "rgba(0,181,173,0.7)",
        borderRadius: 4, borderSkipped: false,
      },
    ],
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#9ca3af", font: { size: 10 }, maxRotation: 35 } },
      y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { color: "#9ca3af", font: { size: 11 } } },
    },
  };

  const needsRestock = predictions.filter(p => p.needsRestock).length;

  return (
    <div>
      <PageHeader
        title="Demand Predictions"
        subtitle="ML-powered forecast based on last 90 days of usage"
      />

      {/* Summary pills */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="card px-4 py-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center text-sm">📊</div>
          <div>
            <p className="text-lg font-display font-bold text-gray-900">{predictions.length}</p>
            <p className="text-xs text-gray-400">Medicines analyzed</p>
          </div>
        </div>
        <div className="card px-4 py-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center text-sm">⚠️</div>
          <div>
            <p className="text-lg font-display font-bold text-gray-900">{needsRestock}</p>
            <p className="text-xs text-gray-400">Need restocking</p>
          </div>
        </div>
        <div className="card px-4 py-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center text-sm">🤖</div>
          <div>
            <p className="text-lg font-display font-bold text-gray-900">WMA + LR</p>
            <p className="text-xs text-gray-400">Prediction model</p>
          </div>
        </div>
      </div>

      {loading ? <PageLoader /> : predictions.length === 0 ? (
        <EmptyState icon="📈" title="No prediction data" subtitle="Add medicines and record stock transactions to enable predictions" />
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display font-bold text-gray-900 text-sm">Predicted 30-Day Demand</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                <span className="inline-block w-2 h-2 rounded-sm bg-brand-500 mr-1"/>Adequate stock ·
                <span className="inline-block w-2 h-2 rounded-sm bg-red-400 ml-2 mr-1"/>Needs restock
              </p>
              <div className="h-[220px]">
                <Bar data={barData} options={chartOpts} />
              </div>
            </div>
            <div className="card p-5">
              <h3 className="font-display font-bold text-gray-900 text-sm mb-1">Stock vs Predicted Need</h3>
              <p className="text-xs text-gray-400 mb-4">
                <span className="inline-block w-2 h-2 rounded-sm bg-indigo-500 mr-1"/>Current stock ·
                <span className="inline-block w-2 h-2 rounded-sm bg-brand-500 ml-2 mr-1"/>Predicted need
              </p>
              <div className="h-[220px]">
                <Bar data={stockData} options={{ ...chartOpts, plugins: { legend: { display: false } } }} />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-display font-bold text-gray-900 text-sm">Detailed Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="tm-table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Current Stock</th>
                    <th>Avg Daily Usage</th>
                    <th>Predicted (30d)</th>
                    <th>Days Until Runout</th>
                    <th>Trend</th>
                    <th>Confidence</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((p) => {
                    const tb = TREND_BADGE[p.trend] || TREND_BADGE.stable;
                    const cb = CONF_BADGE[p.confidence] || CONF_BADGE.low;
                    return (
                      <tr key={p.medicineId}>
                        <td>
                          <p className="font-medium text-sm text-gray-900">{p.medicineName}</p>
                        </td>
                        <td className="font-mono text-sm text-gray-700">{p.currentStock}</td>
                        <td className="font-mono text-sm text-gray-700">{p.averageDailyUsage}/day</td>
                        <td className="font-mono text-sm font-medium text-gray-900">{p.predictedNext30Days}</td>
                        <td>
                          {p.stockRunoutDays !== null ? (
                            <span className={`font-mono text-sm ${p.stockRunoutDays < 15 ? "text-red-600 font-medium" : "text-gray-700"}`}>
                              {p.stockRunoutDays} days
                            </span>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                        <td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tb.cls}`}>{tb.label}</span></td>
                        <td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cb}`}>{p.confidence}</span></td>
                        <td>
                          {p.needsRestock
                            ? <span className="pill-critical">Restock needed</span>
                            : <span className="pill-ok">Adequate</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Model info card */}
          <div className="card p-5 mt-4 bg-gradient-to-r from-brand-50 to-blue-50 border-brand-100">
            <h4 className="font-display font-bold text-gray-800 text-sm mb-2">About the Prediction Model</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              TrackMed uses a <strong>Weighted Moving Average (WMA)</strong> blended with <strong>Linear Regression</strong>
              to forecast demand. The model analyzes the last 90 days of stock transactions (issued quantities) per medicine.
              Recent data is weighted more heavily (60% WMA + 40% regression trend). Confidence is calculated using the
              coefficient of variation — high confidence means consistent usage patterns.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
