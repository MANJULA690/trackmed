import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../api/services";
import toast from "react-hot-toast";

const PURPLE = "#6C47FF";
const PURPLE_DARK = "#5434d4";

const Field = ({ label, children }) => (
  <div>
    <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const Input = ({ ...props }) => (
  <input
    {...props}
    style={{
      width: "100%", padding: "11px 14px",
      border: "1.5px solid #e5e7eb", borderRadius: 12,
      fontSize: 13.5, fontFamily: "'Plus Jakarta Sans', sans-serif",
      background: "#fafafa", color: "#111827", outline: "none",
      transition: "all 0.15s",
    }}
    onFocus={e => { e.target.style.border = `1.5px solid ${PURPLE}`; e.target.style.background = "#fff"; e.target.style.boxShadow = `0 0 0 3px rgba(108,71,255,0.10)`; }}
    onBlur={e => { e.target.style.border = "1.5px solid #e5e7eb"; e.target.style.background = "#fafafa"; e.target.style.boxShadow = "none"; }}
  />
);

export default function Login() {
  const [tab,     setTab]     = useState("login");
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "pharmacist", department: "Pharmacy" });
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await login(loginForm.email, loginForm.password); toast.success("Welcome back!"); navigate("/"); }
    catch (err) { toast.error(err.response?.data?.message || "Invalid email or password."); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword) { toast.error("Passwords do not match."); return; }
    if (regForm.password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await authAPI.register({ name: regForm.name, email: regForm.email, password: regForm.password, role: regForm.role, department: regForm.department });
      toast.success("Account created! Please sign in.");
      setTab("login"); setLoginForm({ email: regForm.email, password: "" });
    } catch (err) { toast.error(err.response?.data?.message || "Registration failed."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f9", display: "flex" }}>

      {/* ── Left panel ─────────────────────────────────────── */}
      <div style={{
        width: 420, background: "linear-gradient(160deg, #ede9ff 0%, #ddd6fe 50%, #c4b5fd 100%)",
        borderRight: "1px solid #c4b5fd",
        padding: "44px 40px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        position: "relative", overflow: "hidden",
      }} className="hidden lg:flex">
        {/* Decorative circles */}
        <div style={{ position: "absolute", right: -60, top: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(108,71,255,0.12)" }} />
        <div style={{ position: "absolute", left: -40, bottom: 80, width: 140, height: 140, borderRadius: "50%", background: "rgba(108,71,255,0.09)" }} />
        <div style={{ position: "absolute", right: 30, bottom: 160, width: 80, height: 80, borderRadius: "50%", background: "rgba(108,71,255,0.10)" }} />

        {/* Logo */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "#6C47FF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(108,71,255,0.45)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, color: "#1a1060" }}>
              Track<span style={{ color: "#6C47FF" }}>Med</span>
            </div>
            <div style={{ fontSize: 10, color: "#7c3aed", letterSpacing: "0.08em", fontWeight: 600 }}>PHARMACY SYSTEM</div>
          </div>
        </div>

        {/* Tagline */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 34, fontWeight: 800, color: "#1a1060", lineHeight: 1.2, marginBottom: 16, letterSpacing: "-0.5px" }}>
            Never worry about<br />your Inventory
          </h2>
          <p style={{ fontSize: 13.5, color: "#5b21b6", lineHeight: 1.75, marginBottom: 28, fontWeight: 500 }}>
            Track stock, predict demand, and get automatic alerts for expiring medicines and low inventory.
          </p>
          {[
            ["🔔", "Auto alerts for expiry & low stock"],
            ["📊", "ML-powered demand prediction"],
            ["🔍", "Search from 500+ medicines"],
            ["👥", "Role-based access control"],
          ].map(([ic, txt]) => (
            <div key={txt} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11, fontSize: 13, color: "#5434d4", fontWeight: 500 }}>
              <span style={{ fontSize: 16 }}>{ic}</span>{txt}
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600, position: "relative", zIndex: 1 }}>TrackMed v1.0 — © 2026</p>
      </div>

      {/* ── Right form panel ────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Tabs */}
          <div style={{ display: "flex", background: "#ede9ff", borderRadius: 14, padding: 4, marginBottom: 32, gap: 4 }}>
            {[["login", "Welcome back!"], ["register", "Welcome"]].map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: "11px 0", borderRadius: 11, border: "none", cursor: "pointer",
                fontSize: 13.5, fontWeight: 700, transition: "all 0.2s",
                background: tab === t ? PURPLE : "transparent",
                color: tab === t ? "#fff" : "#7c3aed",
                boxShadow: tab === t ? "0 2px 10px rgba(108,71,255,0.35)" : "none",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* LOGIN */}
          {tab === "login" && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 26, fontWeight: 800, color: "#0f172a", marginBottom: 4, letterSpacing: "-0.4px" }}>Welcome back!</h1>
                <p style={{ fontSize: 13, color: "#94a3b8" }}>Sign in to your TrackMed account</p>
              </div>
              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <Field label="E-mail">
                  <Input type="email" required placeholder="Enter your email" value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} />
                </Field>
                <Field label="Password">
                  <Input type="password" required placeholder="Enter your password" value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
                </Field>
                <div style={{ textAlign: "right", marginTop: -10 }}>
                  <span style={{ fontSize: 12.5, color: PURPLE, fontWeight: 600, cursor: "pointer" }}>Forgot password?</span>
                </div>
                <button type="submit" disabled={loading} style={{
                  padding: "13px", background: PURPLE, color: "#fff",
                  border: "none", borderRadius: 12, fontSize: 14.5, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: "0 4px 16px rgba(108,71,255,0.40)", transition: "all 0.15s",
                }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = PURPLE_DARK; e.currentTarget.style.transform = "translateY(-1px)"; } }}
                  onMouseLeave={e => { e.currentTarget.style.background = PURPLE; e.currentTarget.style.transform = "none"; }}
                >
                  {loading ? "Signing in..." : "Login"}
                </button>
              </form>
              <p style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "#94a3b8" }}>
                New here?{" "}
                <button onClick={() => setTab("register")} style={{ color: PURPLE, background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                  Register
                </button>
              </p>
            </>
          )}

          {/* REGISTER */}
          {tab === "register" && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 26, fontWeight: 800, color: "#0f172a", marginBottom: 4, letterSpacing: "-0.4px" }}>Welcome</h1>
                <p style={{ fontSize: 13, color: "#94a3b8" }}>Create your TrackMed account</p>
              </div>
              <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                <Field label="Full name">
                  <Input type="text" required placeholder="Dr. Arjun Patel" value={regForm.name}
                    onChange={e => setRegForm({ ...regForm, name: e.target.value })} />
                </Field>
                <Field label="E-mail">
                  <Input type="email" required placeholder="Enter your email" value={regForm.email}
                    onChange={e => setRegForm({ ...regForm, email: e.target.value })} />
                </Field>
                <Field label="Company Name">
                  <Input type="text" placeholder="Huma medical store" value={regForm.department}
                    onChange={e => setRegForm({ ...regForm, department: e.target.value })} />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Field label="Role">
                    <select value={regForm.role} onChange={e => setRegForm({ ...regForm, role: e.target.value })}
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e5e7eb", borderRadius: 12, fontSize: 13.5, fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#fafafa", color: "#111827", outline: "none" }}>
                      <option value="pharmacist">Pharmacist</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </Field>
                  <Field label="Business location">
                    <Input type="text" placeholder="Delhi, NCR" value={regForm.department}
                      onChange={e => setRegForm({ ...regForm, department: e.target.value })} />
                  </Field>
                </div>
                <Field label="Password">
                  <Input type="password" required minLength={6} placeholder="Min. 6 characters" value={regForm.password}
                    onChange={e => setRegForm({ ...regForm, password: e.target.value })} />
                </Field>
                <Field label="Confirm password">
                  <Input type="password" required minLength={6} placeholder="Re-enter password" value={regForm.confirmPassword}
                    onChange={e => setRegForm({ ...regForm, confirmPassword: e.target.value })} />
                  {regForm.confirmPassword && regForm.confirmPassword !== regForm.password && (
                    <p style={{ fontSize: 11.5, color: "#ef4444", marginTop: 5 }}>Passwords do not match</p>
                  )}
                </Field>
                <button type="submit" disabled={loading} style={{
                  marginTop: 4, padding: "13px", background: PURPLE, color: "#fff",
                  border: "none", borderRadius: 12, fontSize: 14.5, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: "0 4px 16px rgba(108,71,255,0.40)", transition: "all 0.15s",
                }}>
                  {loading ? "Creating account..." : "Register"}
                </button>
              </form>
              <p style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "#94a3b8" }}>
                Already a member?{" "}
                <button onClick={() => setTab("login")} style={{ color: PURPLE, background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                  Log in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
