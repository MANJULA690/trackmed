import { createPortal } from "react-dom";

// ── Stat Card ──────────────────────────────────────────────────
export function StatCard({ label, value, icon, trend, trendUp, color = "teal", delay = "", sublabel }) {
  const configs = {
    teal:  { iconBg: "linear-gradient(135deg,#d0f5f3,#a5eeeb)", iconColor: "#00857f", border: "stat-card-teal" },
    amber: { iconBg: "linear-gradient(135deg,#fef3c7,#fde68a)", iconColor: "#b45309", border: "stat-card-amber" },
    red:   { iconBg: "linear-gradient(135deg,#fee2e2,#fecaca)", iconColor: "#dc2626", border: "stat-card-red" },
    blue:  { iconBg: "linear-gradient(135deg,#dbeafe,#bfdbfe)", iconColor: "#2563eb", border: "stat-card-blue" },
  };
  const c = configs[color] || configs.teal;

  return (
    <div
      className={`card card-hover opacity-0 animate-fade-up ${c.border} ${delay}`}
      style={{ padding: "20px 22px", animationFillMode: "forwards" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: c.iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: c.iconColor,
        }}>
          {icon}
        </div>
        {trend && (
          <span style={{
            fontSize: 11, fontWeight: 700,
            padding: "3px 8px", borderRadius: 20,
            background: trendUp ? "#d1fae5" : "#fee2e2",
            color: trendUp ? "#065f46" : "#991b1b",
          }}>
            {trendUp ? "▲" : "▼"} {trend}
          </span>
        )}
      </div>
      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 800, color: "#0f172a", lineHeight: 1.1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: "#64748b", fontWeight: 500 }}>{label}</div>
      {sublabel && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{sublabel}</div>}
    </div>
  );
}

// ── Page Header ────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      marginBottom: 26,
    }}
      className="opacity-0 animate-fade-up"
      style2={{ animationFillMode: "forwards" }}
    >
      <div>
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <p className="page-header-sub">{subtitle}</p>}
      </div>
      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
          {actions}
        </div>
      )}
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────
export function Spinner({ size = "md" }) {
  const px = size === "sm" ? 16 : size === "lg" ? 40 : 24;
  return (
    <svg width={px} height={px} viewBox="0 0 24 24" fill="none" className="animate-spin" style={{ color: "#00B5AD" }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path fill="currentColor" opacity="0.8" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "55vh" }}>
      <div style={{ textAlign: "center" }}>
        <Spinner size="lg" />
        <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 12 }}>Loading...</p>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, marginBottom: 16,
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.06)",
      }}>
        {icon || "📦"}
      </div>
      <p style={{ color: "#374151", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title || "Nothing here yet"}</p>
      {subtitle && <p style={{ color: "#9ca3af", fontSize: 12.5, marginBottom: 16, maxWidth: 280 }}>{subtitle}</p>}
      {action}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = "md" }) {
  if (!open) return null;
  const maxW = { sm: 420, md: 560, lg: 720, xl: 960 }[size] || 560;
  const h    = Math.min(window.innerHeight * 0.9, 680);
  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "#fff", borderRadius: 20, width: "100%", maxWidth: maxW, height: h, display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.22)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: "1px solid #f1f5f9", flexShrink: 0, background: "#fff" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{title}</div>
          <button onClick={onClose} style={{ border: "none", background: "#f1f5f9", color: "#64748b", padding: 6, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", minHeight: 0 }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}


export function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <div style={{ position: "relative" }}>
      <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-base"
        style={{ paddingLeft: 34, width: 260 }}
      />
    </div>
  );
}

// ── Alert Banner ───────────────────────────────────────────────
export function AlertBanner({ type = "warning", message }) {
  const styles = {
    warning: { bg: "#fffbeb", border: "#fcd34d", color: "#92400e" },
    error:   { bg: "#fff5f5", border: "#fca5a5", color: "#991b1b" },
    info:    { bg: "#eff6ff", border: "#93c5fd", color: "#1e40af" },
  };
  const s = styles[type];
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      borderRadius: 12, padding: "12px 16px",
      fontSize: 13, display: "flex", alignItems: "center", gap: 8,
    }}>
      ⚠️ {message}
    </div>
  );
}

// ── Confirm Dialog ─────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm", danger = false }) {
  if (!open) return null;
  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420, padding: "24px", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}>
        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>{title}</div>
        <p style={{ fontSize: 13.5, color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className={danger ? "btn-danger" : "btn-primary"}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
