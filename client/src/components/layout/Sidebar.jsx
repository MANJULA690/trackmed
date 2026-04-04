import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/helpers";

const Ic = ({ d, size = 16, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

const GridIcon  = ({ size }) => <Ic size={size} d={<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>} />;
const BoxIcon   = ({ size }) => <Ic size={size} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />;
const BellIcon  = ({ size }) => <Ic size={size} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />;
const TrendIcon = ({ size }) => <Ic size={size} d="M22 12h-4l-3 9L9 3l-3 9H2" />;
const FileIcon  = ({ size }) => <Ic size={size} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>} />;
const UserIcon  = ({ size }) => <Ic size={size} d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />;
const CogIcon   = ({ size }) => <Ic size={size} d={<><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M20 12h2M2 12h2M12 20v2M12 2v2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41"/></>} />;
const OutIcon   = ({ size }) => <Ic size={size} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>} />;

const NAV = [
  { to: "/",            label: "Dashboard",    icon: GridIcon },
  { to: "/inventory",   label: "Inventory",    icon: BoxIcon },
  { to: "/alerts",      label: "Alerts",       icon: BellIcon, badge: true },
  { to: "/predictions", label: "Predictions",  icon: TrendIcon },
  { to: "/reports",     label: "Reports",      icon: FileIcon },
];
const SETTINGS_NAV = [
  { to: "/staff",    label: "Staff",    icon: UserIcon },
  { to: "/settings", label: "Settings", icon: CogIcon },
];

export default function Sidebar({ alertCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex flex-col sidebar-root" style={{ width: "240px" }}>

      {/* Logo */}
      <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
          {/* Icon with glow */}
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #00C5BC, #007f7b)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(0,181,173,0.4)",
            flexShrink: 0,
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px", lineHeight: 1 }}>
              Track<span style={{ color: "#4dd4cf" }}>Med</span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2, letterSpacing: "0.08em" }}>PHARMACY SYSTEM</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "14px 12px", overflowY: "auto" }}>
        <div className="section-label" style={{ marginTop: 0 }}>Main</div>

        {NAV.map(({ to, label, icon: Icon, badge }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) => isActive ? "nav-active" : "nav-inactive"}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 10px", borderRadius: 10,
              fontSize: 13.5, fontWeight: 500,
              marginBottom: 2, textDecoration: "none",
              transition: "all 0.15s ease",
            }}
          >
            <Icon size={15} />
            <span style={{ flex: 1 }}>{label}</span>
            {badge && alertCount > 0 && (
              <span style={{
                fontSize: 10, background: "#ef4444", color: "#fff",
                padding: "1px 6px", borderRadius: 20, fontWeight: 700,
                minWidth: 18, textAlign: "center",
                boxShadow: "0 2px 6px rgba(239,68,68,0.4)",
              }}>
                {alertCount > 99 ? "99+" : alertCount}
              </span>
            )}
          </NavLink>
        ))}

        <div className="section-label">Admin</div>

        {SETTINGS_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => isActive ? "nav-active" : "nav-inactive"}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 10px", borderRadius: 10,
              fontSize: 13.5, fontWeight: 500,
              marginBottom: 2, textDecoration: "none",
              transition: "all 0.15s ease",
            }}
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 10px", borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
          cursor: "pointer",
          position: "relative",
        }}
          className="group"
          onClick={() => { logout(); navigate("/login"); }}
          title="Click to logout"
        >
          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #00C5BC, #0077b6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0,
            boxShadow: "0 2px 8px rgba(0,181,173,0.3)",
          }}>
            {getInitials(user?.name || "U")}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#fff", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.name || "User"}
            </div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textTransform: "capitalize" }}>
              {user?.role}
            </div>
          </div>
          <OutIcon size={13} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
