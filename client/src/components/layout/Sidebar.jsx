import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/helpers";


// ── Inline SVG icon components ────────────────────────────────
const Ic = ({ d, size = 16, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

const GridIcon = ({ size }) => <Ic size={size} d={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>} />;
const BoxIcon = ({ size }) => <Ic size={size} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />;
const BellIcon = ({ size }) => <Ic size={size} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />;
const TrendIcon = ({ size }) => <Ic size={size} d="M22 12h-4l-3 9L9 3l-3 9H2" />;
const FileIcon = ({ size }) => <Ic size={size} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>} />;
const UserIcon = ({ size }) => <Ic size={size} d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />;
const SettingsIcon = ({ size }) => <Ic size={size} d={<><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M20 12h2M2 12h2M12 20v2M12 2v2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41"/></>} />;
const LogoutIcon = ({ size }) => <Ic size={size} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>} />;


const NAV = [
  { to: "/",           label: "Dashboard",   icon: GridIcon },
  { to: "/inventory",  label: "Inventory",   icon: BoxIcon },
  { to: "/alerts",     label: "Alerts",      icon: BellIcon,  badge: true },
  { to: "/predictions",label: "Predictions", icon: TrendIcon },
  { to: "/reports",    label: "Reports",     icon: FileIcon },
];

const SETTINGS_NAV = [
  { to: "/staff",    label: "Staff",    icon: UserIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar({ alertCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-[220px] bg-navy flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="font-display text-lg text-white tracking-tight">
            Track<span className="text-brand-400">Med</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest px-2 mb-2">Main</p>

        {NAV.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] transition-all duration-150 group ${
                isActive ? "nav-active" : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`
            }
          >
            <Icon size={15} />
            <span className="flex-1">{label}</span>
            {badge && alertCount > 0 && (
              <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-medium min-w-[18px] text-center">
                {alertCount > 99 ? "99+" : alertCount}
              </span>
            )}
          </NavLink>
        ))}

        <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest px-2 mb-2 mt-5">Settings</p>

        {SETTINGS_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] transition-all duration-150 ${
                isActive ? "nav-active" : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer group">
          <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
            {getInitials(user?.name || "U")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[12px] font-medium truncate">{user?.name || "User"}</p>
            <p className="text-white/40 text-[11px] capitalize truncate">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/40 hover:text-red-400"
            title="Logout"
          >
            <LogoutIcon size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}

