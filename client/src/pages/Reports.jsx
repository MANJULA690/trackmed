import { useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend
} from "chart.js";
import { reportAPI } from "../api/services";
import { PageHeader, PageLoader, EmptyState } from "../components/ui";
import { useFetch } from "../hooks/useFetch";
import { formatDate, formatCurrency } from "../utils/helpers";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const TABS = ["Expiry", "Stock", "Category Overview", "Transactions"];

export default function Reports() {
  const [tab, setTab] = useState(0);

  return (
    <div>
      <PageHeader title="Reports" subtitle="Detailed analytics and compliance reports" />

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-100 shadow-card w-fit">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              tab === i ? "bg-navy text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && <ExpiryReport />}
      {tab === 1 && <StockReport />}
      {tab === 2 && <CategoryReport />}
      {tab === 3 && <TransactionReport />}
    </div>
  );
}

/* ── Expiry Report ──────────────────────────────────────────── */
function ExpiryReport() {
  const { data, loading } = useFetch(() => reportAPI.expiry(), []);
  const r = data?.report;

  if (loading) return <PageLoader />;
  if (!r) return <EmptyState icon="📋" title="No data" />;

  const sections = [
    { key: "expired",      label: "Already Expired",     color: "red",   pill: "pill-critical" },
    { key: "within30Days", label: "Expiring in 30 days", color: "amber", pill: "pill-low" },
    { key: "within60Days", label: "Expiring in 31–60 days", color: "amber", pill: "pill-low" },
    { key: "within90Days", label: "Expiring in 61–90 days", color: "blue",  pill: "pill-info" },
  ];

  const doughnutData = {
    labels: sections.map(s => s.label),
    datasets: [{
      data: sections.map(s => r[s.key]?.count || 0),
      backgroundColor: ["#ef4444", "#f59e0b", "#fbbf24", "#3b82f6"],
      borderWidth: 0, hoverOffset: 4,
    }],
  };

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {sections.map(s => (
          <div key={s.key} className="card p-4">
            <p className="text-2xl font-display font-bold text-gray-900">{r[s.key]?.count || 0}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <h3 className="font-display font-bold text-gray-900 text-sm mb-4">Expiry Distribution</h3>
          <div className="h-[180px] flex items-center justify-center">
            <Doughnut data={doughnutData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } }, cutout: "65%",
            }} />
          </div>
          <div className="space-y-1.5 mt-4">
            {sections.map((s, i) => (
              <div key={s.key} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-gray-500">
                  <span className="w-2 h-2 rounded-full" style={{ background: doughnutData.datasets[0].backgroundColor[i] }}/>
                  {s.label}
                </span>
                <span className="font-medium text-gray-700">{r[s.key]?.count || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-red-50/50">
            <h3 className="font-display font-bold text-red-700 text-sm">⚠️ Expired Medicines ({r.expired?.count || 0})</h3>
          </div>
          {r.expired?.medicines?.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">🎉 No expired medicines</div>
          ) : (
            <table className="tm-table">
              <thead><tr><th>Medicine</th><th>Batch</th><th>Expired On</th><th>Qty</th></tr></thead>
              <tbody>
                {r.expired?.medicines?.map(m => (
                  <tr key={m._id}>
                    <td className="font-medium text-gray-900 text-sm">{m.name}</td>
                    <td><span className="font-mono text-xs text-gray-500">{m.batchNumber}</span></td>
                    <td><span className="pill-critical">{formatDate(m.expiryDate)}</span></td>
                    <td className="text-gray-700">{m.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Expiring soon tables */}
      {[{ key: "within30Days", label: "Expiring within 30 days" }, { key: "within60Days", label: "Expiring in 31–60 days" }].map(s => (
        r[s.key]?.medicines?.length > 0 && (
          <div key={s.key} className="card overflow-hidden mb-4">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-display font-bold text-gray-900 text-sm">{s.label} ({r[s.key]?.count})</h3>
            </div>
            <table className="tm-table">
              <thead><tr><th>Medicine</th><th>Batch</th><th>Manufacturer</th><th>Expiry</th><th>Qty</th></tr></thead>
              <tbody>
                {r[s.key]?.medicines?.map(m => (
                  <tr key={m._id}>
                    <td className="font-medium text-sm text-gray-900">{m.name}</td>
                    <td><span className="font-mono text-xs text-gray-500">{m.batchNumber}</span></td>
                    <td className="text-gray-500 text-sm">{m.manufacturerName || "—"}</td>
                    <td><span className="pill-low">{formatDate(m.expiryDate)}</span></td>
                    <td className="text-gray-700">{m.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ))}
    </div>
  );
}

/* ── Stock Report ───────────────────────────────────────────── */
function StockReport() {
  const { data, loading } = useFetch(() => reportAPI.stock(), []);
  const r = data?.report;

  if (loading) return <PageLoader />;
  if (!r) return <EmptyState icon="📦" title="No data" />;

  const barData = {
    labels: r.lowStock?.medicines?.slice(0, 8).map(m => m.name.split(" ").slice(0, 2).join(" ")) || [],
    datasets: [
      {
        label: "Current quantity",
        data: r.lowStock?.medicines?.slice(0, 8).map(m => m.quantity) || [],
        backgroundColor: "#f59e0b", borderRadius: 5, borderSkipped: false,
      },
      {
        label: "Threshold",
        data: r.lowStock?.medicines?.slice(0, 8).map(m => m.lowStockThreshold) || [],
        backgroundColor: "rgba(239,68,68,0.25)", borderRadius: 5, borderSkipped: false,
      },
    ],
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-5 border-l-2 border-l-red-400">
          <p className="text-3xl font-display font-bold text-red-600">{r.outOfStock?.count || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Out of stock</p>
        </div>
        <div className="card p-5 border-l-2 border-l-amber-400">
          <p className="text-3xl font-display font-bold text-amber-600">{r.lowStock?.count || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Low stock (above 0)</p>
        </div>
      </div>

      {r.lowStock?.medicines?.length > 0 && (
        <div className="card p-5 mb-4">
          <h3 className="font-display font-bold text-gray-900 text-sm mb-4">Low Stock Visualised (top 8)</h3>
          <div className="h-[220px]">
            <Bar data={barData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false }, ticks: { color: "#9ca3af", font: { size: 10 }, maxRotation: 30 } },
                y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { color: "#9ca3af", font: { size: 11 } } },
              },
            }} />
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400"/>Current qty</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-200"/>Threshold</span>
          </div>
        </div>
      )}

      {r.outOfStock?.medicines?.length > 0 && (
        <div className="card overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-gray-100 bg-red-50/50">
            <h3 className="font-display font-bold text-red-700 text-sm">🚫 Out of Stock ({r.outOfStock.count})</h3>
          </div>
          <table className="tm-table">
            <thead><tr><th>Medicine</th><th>Category</th><th>Manufacturer</th><th>Threshold</th></tr></thead>
            <tbody>
              {r.outOfStock.medicines.map(m => (
                <tr key={m._id}>
                  <td className="font-medium text-sm text-gray-900">{m.name}</td>
                  <td><span className="pill-gray">{m.category}</span></td>
                  <td className="text-gray-500 text-sm">{m.manufacturerName || "—"}</td>
                  <td className="text-red-600 font-medium">{m.lowStockThreshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {r.lowStock?.medicines?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-display font-bold text-gray-900 text-sm">Low Stock Details ({r.lowStock.count})</h3>
          </div>
          <table className="tm-table">
            <thead><tr><th>Medicine</th><th>Category</th><th>Qty</th><th>Threshold</th><th>Deficit</th></tr></thead>
            <tbody>
              {r.lowStock.medicines.map(m => (
                <tr key={m._id}>
                  <td className="font-medium text-sm text-gray-900">{m.name}</td>
                  <td><span className="pill-gray">{m.category}</span></td>
                  <td className="font-mono text-amber-600 font-medium">{m.quantity}</td>
                  <td className="font-mono text-gray-500">{m.lowStockThreshold}</td>
                  <td className="font-mono text-red-500 font-medium">{m.deficit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Category Overview ──────────────────────────────────────── */
function CategoryReport() {
  const { data, loading } = useFetch(() => reportAPI.categoryOverview(), []);
  const overview = data?.overview || [];

  if (loading) return <PageLoader />;

  const barData = {
    labels: overview.map(o => o._id),
    datasets: [
      {
        label: "Total medicines",
        data: overview.map(o => o.totalMedicines),
        backgroundColor: "#00B5AD", borderRadius: 6, borderSkipped: false,
      },
    ],
  };

  const doughnutData = {
    labels: overview.map(o => o._id),
    datasets: [{
      data: overview.map(o => o.totalMedicines),
      backgroundColor: ["#00B5AD","#6366f1","#f59e0b","#10b981","#3b82f6","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"],
      borderWidth: 0, hoverOffset: 4,
    }],
  };

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <h3 className="font-display font-bold text-gray-900 text-sm mb-4">Medicines per Category</h3>
          <div className="h-[240px]">
            <Bar data={barData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false }, ticks: { color: "#9ca3af", font: { size: 10 }, maxRotation: 35 } },
                y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { color: "#9ca3af", font: { size: 11 } } },
              },
            }} />
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-display font-bold text-gray-900 text-sm mb-4">Category Distribution</h3>
          <div className="h-[180px]">
            <Doughnut data={doughnutData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } }, cutout: "60%",
            }} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4">
            {overview.map((o, i) => (
              <div key={o._id} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-gray-500 truncate">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: doughnutData.datasets[0].backgroundColor[i] }}/>
                  {o._id}
                </span>
                <span className="font-medium text-gray-700 ml-1">{o.totalMedicines}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-display font-bold text-gray-900 text-sm">Category Details</h3>
        </div>
        <table className="tm-table">
          <thead>
            <tr><th>Category</th><th>Total Medicines</th><th>Total Quantity</th><th>Avg Price</th><th>Low Stock Count</th></tr>
          </thead>
          <tbody>
            {overview.map(o => (
              <tr key={o._id}>
                <td><span className="pill-gray">{o._id}</span></td>
                <td className="font-medium text-gray-800">{o.totalMedicines}</td>
                <td className="font-mono text-gray-700">{o.totalQuantity?.toLocaleString()}</td>
                <td className="font-mono text-gray-700">{formatCurrency(o.avgPrice)}</td>
                <td>
                  <span className={o.lowStockCount > 0 ? "pill-low" : "pill-ok"}>
                    {o.lowStockCount}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Transaction Report ─────────────────────────────────────── */
function TransactionReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [type,      setType]      = useState("");
  const [triggered, setTriggered] = useState(false);

  const { data, loading } = useFetch(
    () => reportAPI.transactions({ startDate, endDate, type }),
    [triggered]
  );

  const transactions = data?.report?.transactions || [];
  const summary      = data?.report?.summary || [];

  const TYPE_COLORS = {
    received: "pill-ok", issued: "pill-info",
    adjusted: "pill-gray", disposed: "pill-critical", returned: "pill-low",
  };

  return (
    <div>
      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-base w-auto" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-base w-auto" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="input-base w-auto">
            <option value="">All types</option>
            <option value="received">Received</option>
            <option value="issued">Issued</option>
            <option value="adjusted">Adjusted</option>
            <option value="disposed">Disposed</option>
            <option value="returned">Returned</option>
          </select>
        </div>
        {/* <button onClick={() => { setTriggered(t => !t); }} className="btn-primary">
          Generate Report
        </button> */}
      </div>

      {/* Summary badges */}
      {summary.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-5">
          {summary.map(s => (
            <div key={s._id} className="card px-4 py-3 flex items-center gap-3">
              <div>
                <p className="text-lg font-display font-bold text-gray-900">{s.totalQuantity?.toLocaleString()}</p>
                <p className="text-xs text-gray-400 capitalize">{s._id} · {s.count} transactions</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? <PageLoader /> : transactions.length === 0 ? (
        <EmptyState icon="📋" title="No transactions found" subtitle="Adjust the filters and generate a report" />
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-display font-bold text-gray-900 text-sm">
              {transactions.length} Transactions
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="tm-table">
              <thead>
                <tr>
                  <th>Date</th><th>Medicine</th><th>Type</th>
                  <th>Qty Before</th><th>Change</th><th>Qty After</th>
                  <th>Reason</th><th>Performed By</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t._id}>
                    <td className="text-xs text-gray-500 whitespace-nowrap">{formatDate(t.transactionDate)}</td>
                    <td className="font-medium text-sm text-gray-900">{t.medicine?.name || t.medicineName}</td>
                    <td><span className={TYPE_COLORS[t.transactionType] || "pill-gray"}>{t.transactionType}</span></td>
                    <td className="font-mono text-sm text-gray-600">{t.quantityBefore}</td>
                    <td className={`font-mono text-sm font-medium ${t.quantity >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {t.quantity >= 0 ? "+" : ""}{t.quantity}
                    </td>
                    <td className="font-mono text-sm text-gray-600">{t.quantityAfter}</td>
                    <td className="text-xs text-gray-500 max-w-[150px] truncate">{t.reason || "—"}</td>
                    <td className="text-xs text-gray-500">{t.performedBy?.name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
