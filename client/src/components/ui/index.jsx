// ── Stat Card ──────────────────────────────────────────────────
export function StatCard({ label, value, icon, trend, trendUp, color = "teal", delay = "" }) {
  const colors = {
    teal:  { bg: "bg-brand-50",   text: "text-brand-500",   border: "border-brand-100" },
    amber: { bg: "bg-amber-50",   text: "text-amber-500",   border: "border-amber-100" },
    red:   { bg: "bg-red-50",     text: "text-red-500",     border: "border-red-100" },
    blue:  { bg: "bg-blue-50",    text: "text-blue-500",    border: "border-blue-100" },
    green: { bg: "bg-emerald-50", text: "text-emerald-500", border: "border-emerald-100" },
  };
  const c = colors[color] || colors.teal;
  return (
    <div
      className={`card card-lift p-5 opacity-0 animate-fade-up ${delay} border-t-2 ${c.border}`}
      style={{ animationFillMode: "forwards" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} ${c.text}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
          }`}>
            {trendUp ? "↑" : "↓"} {trend}
          </span>
        )}
      </div>
      <p className={`text-2xl font-display font-bold text-gray-900 leading-none mb-1 opacity-0 animate-num-pop ${delay}`}
         style={{ animationFillMode: "forwards", animationDelay: `calc(${delay ? "0.1s" : "0s"} + 0.15s)` }}>
        {value}
      </p>
      <p className="text-xs text-gray-400 font-medium mt-1">{label}</p>
    </div>
  );
}

// ── Page Header ────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-7 opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 mt-1">{actions}</div>}
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────
export function Spinner({ size = "md" }) {
  const s = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-10 w-10" : "h-6 w-6";
  return (
    <svg className={`${s} animate-spin text-brand-500`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-gray-400 text-sm mt-3">Loading...</p>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300 text-3xl mb-4">
        {icon || "📦"}
      </div>
      <p className="text-gray-600 font-medium text-sm mb-1">{title || "Nothing here yet"}</p>
      {subtitle && <p className="text-gray-400 text-xs mb-4 max-w-xs">{subtitle}</p>}
      {action}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = "md" }) {
  if (!open) return null;
  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[90vh] overflow-y-auto animate-dropdown`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-display font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Search Input ───────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-base pl-9 w-64"
      />
    </div>
  );
}

// ── Alert Banner ───────────────────────────────────────────────
export function AlertBanner({ type = "warning", message }) {
  const styles = {
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    error:   "bg-red-50 border-red-200 text-red-700",
    info:    "bg-blue-50 border-blue-200 text-blue-700",
  };
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-2 ${styles[type]}`}>
      <span>⚠️</span> {message}
    </div>
  );
}

// ── Confirm Dialog ─────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm", danger = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-dropdown">
        <h3 className="font-display font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className={danger ? "btn-danger" : "btn-primary"}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
