import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/helpers";
import { authAPI } from "../../api/services";
import toast from "react-hot-toast";

/* ── Icons ───────────────────────────────────────────────────── */
const Ic = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);
const GridIcon  = (p) => <Ic {...p} d={<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>} />;
const BoxIcon   = (p) => <Ic {...p} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />;
const BellIcon  = (p) => <Ic {...p} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />;
const TrendIcon = (p) => <Ic {...p} d="M22 12h-4l-3 9L9 3l-3 9H2" />;
const FileIcon  = (p) => <Ic {...p} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>} />;
const ChevronL  = (p) => <Ic {...p} d="M15 18l-6-6 6-6" />;
const ChevronR  = (p) => <Ic {...p} d="M9 18l6-6-6-6" />;
const KeyIcon   = (p) => <Ic {...p} d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />;
const OutIcon   = (p) => <Ic {...p} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>} />;
const XIcon     = (p) => <Ic {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />;

const NAV = [
  { to: "/",            label: "Dashboard",   icon: GridIcon },
  { to: "/inventory",   label: "Inventory",   icon: BoxIcon },
  { to: "/alerts",      label: "Alerts",      icon: BellIcon, badge: true },
  { to: "/predictions", label: "Predictions", icon: TrendIcon },
  { to: "/reports",     label: "Reports",     icon: FileIcon },
];

/* ── Settings Modal ──────────────────────────────────────────── */
function SettingsModal({ open, onClose, user }) {
  const [tab, setTab] = useState("profile");
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const handlePw = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error("Passwords don't match"); return; }
    setSaving(true);
    try {
      await authAPI.updatePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success("Password updated!");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally { setSaving(false); }
  };

  const roleColor = user?.role === "admin" ? "#7c3aed" : user?.role === "pharmacist" ? "#00857f" : "#6b7280";
  const roleBg    = user?.role === "admin" ? "#f3e8ff" : user?.role === "pharmacist" ? "#ccfbf1" : "#f3f4f6";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{
        position: "relative", background: "#fff", borderRadius: 20,
        width: "100%", maxWidth: 480, maxHeight: "88vh",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        display: "flex", flexDirection: "column",
        animation: "scaleIn 0.2s cubic-bezier(.22,1,.36,1) both",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Account Settings</div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#9ca3af", padding: 4, borderRadius: 8 }}>
            <XIcon size={16} />
          </button>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, padding: "10px 22px 0", borderBottom: "1px solid #f1f5f9" }}>
          {[["profile", "Profile"], ["password", "Change Password"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: "8px 14px", borderRadius: "10px 10px 0 0", border: "none",
              background: tab === k ? "#f8fafc" : "transparent",
              borderBottom: tab === k ? "2px solid #00B5AD" : "2px solid transparent",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              color: tab === k ? "#00B5AD" : "#64748b",
              transition: "all 0.15s",
            }}>{l}</button>
          ))}
        </div>
        {/* Body */}
        <div style={{ overflow: "auto", flex: 1, padding: "22px" }}>
          {tab === "profile" && (
            <div>
              {/* Avatar + name */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: 18, background: "linear-gradient(135deg,#f0fffe,#f8faff)", borderRadius: 16, border: "1px solid #e0f7f6" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "linear-gradient(135deg, #00C5BC, #0077b6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 20, fontWeight: 800,
                  boxShadow: "0 4px 14px rgba(0,181,173,0.35)",
                }}>
                  {getInitials(user?.name || "U")}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 16 }}>{user?.name}</div>
                  <div style={{ color: "#64748b", fontSize: 12.5, marginTop: 2 }}>{user?.email}</div>
                  <span style={{ display: "inline-block", marginTop: 5, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: roleBg, color: roleColor }}>
                    {user?.role}
                  </span>
                </div>
              </div>
              {/* Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  ["Department", user?.department || "—"],
                  ["Role",       user?.role],
                  ["Account ID", user?.id?.slice(-8) || "—"],
                  ["System",     "TrackMed v1.0"],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px", border: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === "password" && (
            <form onSubmit={handlePw} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                ["Current password", "currentPassword", "Enter current password"],
                ["New password",     "newPassword",     "Min. 6 characters"],
                ["Confirm password", "confirmPassword", "Re-enter new password"],
              ].map(([label, key, placeholder]) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
                  <input type="password" required placeholder={placeholder}
                    value={pwForm[key]} onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })}
                    className="input-base" minLength={key !== "currentPassword" ? 6 : undefined} />
                </div>
              ))}
              <button type="submit" disabled={saving} className="btn-primary" style={{ justifyContent: "center", marginTop: 4 }}>
                {saving ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sidebar ─────────────────────────────────────────────────── */
export default function Sidebar({ alertCount = 0, collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on route change
  useEffect(() => { setProfileOpen(false); }, [location]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const W = collapsed ? 68 : 240;

  return (
    <>
      <aside style={{
        position: "fixed", inset: "0 auto 0 0", width: W, zIndex: 30,
        display: "flex", flexDirection: "column",
        background: "linear-gradient(180deg, #0d2d4e 0%, #091e36 100%)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        transition: "width 0.28s cubic-bezier(.22,1,.36,1)",
        overflow: "hidden",
      }}>

        {/* Logo + toggle */}
        <div style={{ padding: collapsed ? "20px 0" : "22px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between" }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#00C5BC,#007f7b)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,181,173,0.4)", flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px", lineHeight: 1 }}>
                  Track<span style={{ color: "#4dd4cf" }}>Med</span>
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2, letterSpacing: "0.08em" }}>PHARMACY SYSTEM</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#00C5BC,#007f7b)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,181,173,0.4)" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
          )}
          {!collapsed && (
            <button onClick={onToggle} title="Collapse sidebar" style={{ border: "none", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s", flexShrink: 0 }}>
              <ChevronL size={14} />
            </button>
          )}
          {collapsed && (
            <div></div>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 10 }}>
            <button onClick={onToggle} title="Expand sidebar" style={{ border: "none", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", borderRadius: 8, width: 32, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <ChevronR size={14} />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: collapsed ? "14px 10px" : "14px 12px", overflowY: "auto", overflowX: "hidden" }}>
          {!collapsed && <div className="section-label" style={{ marginTop: 0 }}>Main</div>}

          {NAV.map(({ to, label, icon: Icon, badge }) => (
            <NavLink key={to} to={to} end={to === "/"}
              title={collapsed ? label : undefined}
              className={({ isActive }) => isActive ? "nav-active" : "nav-inactive"}
              style={{
                display: "flex", alignItems: "center",
                gap: collapsed ? 0 : 10,
                justifyContent: collapsed ? "center" : "flex-start",
                padding: collapsed ? "10px 0" : "9px 10px",
                borderRadius: 10, fontSize: 13.5, fontWeight: 500,
                marginBottom: 2, textDecoration: "none",
                transition: "all 0.15s ease",
                position: "relative",
              }}>
              <span style={{ flexShrink: 0, display: "flex" }}><Icon size={16} /></span>
              {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
              {!collapsed && badge && alertCount > 0 && (
                <span style={{ fontSize: 10, background: "#ef4444", color: "#fff", padding: "1px 6px", borderRadius: 20, fontWeight: 700, minWidth: 18, textAlign: "center", boxShadow: "0 2px 6px rgba(239,68,68,0.4)" }}>
                  {alertCount > 99 ? "99+" : alertCount}
                </span>
              )}
              {collapsed && badge && alertCount > 0 && (
                <span style={{ position: "absolute", top: 6, right: 8, width: 7, height: 7, background: "#ef4444", borderRadius: "50%", boxShadow: "0 0 0 2px #091e36" }} />
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: collapsed ? "12px 10px" : "12px", borderTop: "1px solid rgba(255,255,255,0.07)", position: "relative" }} ref={profileRef}>
          <div
            onClick={() => setProfileOpen(o => !o)}
            title={collapsed ? user?.name : undefined}
            style={{
              display: "flex", alignItems: "center",
              gap: collapsed ? 0 : 10,
              justifyContent: collapsed ? "center" : "flex-start",
              padding: collapsed ? "8px 0" : "10px 10px",
              borderRadius: 12,
              background: profileOpen ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#00C5BC,#0077b6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,181,173,0.3)" }}>
              {getInitials(user?.name || "U")}
            </div>
            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#fff", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || "User"}</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textTransform: "capitalize" }}>{user?.role}</div>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" style={{ transform: profileOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </>
            )}
          </div>

          {/* Profile dropdown */}
          {profileOpen && (
            <div style={{
              position: "absolute", bottom: "calc(100% - 4px)", left: collapsed ? 68 : 12, right: collapsed ? "auto" : 12,
              width: collapsed ? 200 : "auto",
              background: "#fff", borderRadius: 14,
              boxShadow: "0 -8px 32px rgba(0,0,0,0.16)", border: "1px solid #e5e7eb",
              overflow: "hidden",
              animation: "fadeUp 0.2s cubic-bezier(.22,1,.36,1) both",
            }}>
              {/* User info strip */}
              <div style={{ padding: "14px 16px", background: "linear-gradient(135deg,#f0fffe,#f8faff)", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13 }}>{user?.name}</div>
                <div style={{ color: "#64748b", fontSize: 11, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
              </div>
              <div style={{ padding: "6px" }}>
                <button onClick={() => { setSettingsOpen(true); setProfileOpen(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", background: "transparent", color: "#374151", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "background 0.1s", textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <KeyIcon size={14} style={{ color: "#9ca3af" }} />
                  Account Settings
                </button>
                <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />
                <button onClick={handleLogout}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", background: "transparent", color: "#dc2626", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "background 0.1s", textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fff5f5"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <OutIcon size={14} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} user={user} />
    </>
  );
}
