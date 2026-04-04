import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/helpers";

const GridIcon     = (p) => <Ic {...p} d={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>} />;
const BoxIcon      = (p) => <Ic {...p} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />;
const BellIcon     = (p) => <Ic {...p} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />;
const TrendIcon    = (p) => <Ic {...p} d="M22 12h-4l-3 9L9 3l-3 9H2" />;
const FileIcon     = (p) => <Ic {...p} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>} />;
const UserIcon     = (p) => <Ic {...p} d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />;
const SettingsIcon = (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M20 12h2M2 12h2M12 20v2M12 2v2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41"/></>} />;
const LogoutIcon   = (p) => <Ic {...p} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>} />;
const ChevronIcon  = (p) => <Ic {...p} d="M6 9l6 6 6-6" />;
const MenuIcon     = (p) => <Ic {...p} d={<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>} />;
const XIcon        = (p) => <Ic {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />;

const NAV = [
  { to: "/",            label: "Dashboard",   icon: GridIcon },
  { to: "/inventory",   label: "Inventory",   icon: BoxIcon },
  { to: "/alerts",      label: "Alerts",      icon: BellIcon, badge: true },
  { to: "/predictions", label: "Predictions", icon: TrendIcon },
  { to: "/reports",     label: "Reports",     icon: FileIcon },
];

const MORE_NAV = [
  { to: "/staff",    label: "Staff",    icon: UserIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];



export default function Navbar({ alertCount = 0 }) {
  const { user, logout }    = useAuth();
  const navigate             = useNavigate();
  const location             = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Shrink navbar on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setProfileOpen(false); }, [location]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-navy/95 backdrop-blur-md shadow-lg shadow-black/20 py-2"
            : "bg-navy py-3"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-5 flex items-center gap-6">

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-display text-lg text-white font-bold tracking-tight hidden sm:block">
              Track<span className="text-brand-400">Med</span>
            </span>
          </NavLink>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV.map(({ to, label, icon: Icon, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                   transition-all duration-200 group
                   ${isActive
                     ? "text-white bg-white/10"
                     : "text-white/55 hover:text-white hover:bg-white/8"
                   }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={15} />
                    <span>{label}</span>
                    {badge && alertCount > 0 && (
                      <span className="absolute -top-1 -right-1 text-[9px] bg-red-500 text-white px-1 py-px rounded-full font-bold min-w-[16px] text-center leading-tight animate-pulse-slow">
                        {alertCount > 99 ? "99+" : alertCount}
                      </span>
                    )}
                    {/* Active underline indicator */}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-400 rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto md:ml-0">

            {/* More nav — desktop dropdown */}
            <div className="hidden md:flex items-center gap-1">
              {MORE_NAV.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      isActive
                        ? "text-white bg-white/10"
                        : "text-white/45 hover:text-white/80 hover:bg-white/8"
                    }`
                  }
                  title={label}
                >
                  <Icon size={15} />
                  <span className="text-xs">{label}</span>
                </NavLink>
              ))}
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-5 bg-white/15 mx-1" />

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(o => !o)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200 group ${
                  profileOpen ? "bg-white/10" : "hover:bg-white/8"
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 ring-2 ring-brand-400/30 group-hover:ring-brand-400/60 transition-all">
                  {getInitials(user?.name || "U")}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-white text-xs font-medium leading-tight truncate max-w-[90px]">{user?.name?.split(" ")[0]}</p>
                  <p className="text-white/40 text-[10px] capitalize">{user?.role}</p>
                </div>
                <ChevronIcon size={12} className={`text-white/40 transition-transform duration-200 hidden lg:block ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-dropdown">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    <span className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full font-medium bg-brand-50 text-brand-700 capitalize">
                      {user?.role}
                    </span>
                  </div>
                  {/* Menu items */}
                  <div className="py-1">
                    {MORE_NAV.map(({ to, label, icon: Icon }) => (
                      <button key={to} onClick={() => navigate(to)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                        <Icon size={14} className="text-gray-400" />
                        {label}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogoutIcon size={14} />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              {mobileOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        {/* Drawer */}
        <div className={`absolute top-0 right-0 bottom-0 w-72 bg-navy flex flex-col transition-transform duration-300 ease-out ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <span className="font-display text-white font-bold">Menu</span>
            <button onClick={() => setMobileOpen(false)} className="text-white/50 hover:text-white p-1">
              <XIcon size={16} />
            </button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {[...NAV, ...MORE_NAV].map(({ to, label, icon: Icon, badge }) => (
              <NavLink key={to} to={to} end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? "bg-brand-500/15 text-brand-400" : "text-white/60 hover:text-white hover:bg-white/5"
                  }`
                }>
                <Icon size={16} />
                <span className="flex-1">{label}</span>
                {badge && alertCount > 0 && (
                  <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">{alertCount}</span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="px-4 py-4 border-t border-white/10">
            <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-white/5 rounded-lg transition-colors">
              <LogoutIcon size={15} /> Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Icons ─────────────────────────────────────────────────────
const Ic = ({ d, size = 16, className = "", ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} {...p}>
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

