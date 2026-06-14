import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../api/services";
import toast from "react-hot-toast";

export default function Login() {
  const [tab,     setTab]     = useState("login");   // "login" | "register"
  const [loading, setLoading] = useState(false);

  /* Login form */
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  /* Register form */
  const [regForm, setRegForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    role: "pharmacist", department: "Pharmacy",
  });

  const { login } = useAuth();
  const navigate  = useNavigate();

  /* ── Login ───────────────────────────────────────────────── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Register ────────────────────────────────────────────── */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (regForm.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await authAPI.register({
        name:       regForm.name,
        email:      regForm.email,
        password:   regForm.password,
        role:       regForm.role,
        department: regForm.department,
      });
      toast.success("Account created! Please sign in.");
      setTab("login");
      setLoginForm({ email: regForm.email, password: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Shared input style ──────────────────────────────────── */
  const inputStyle = {
    width: "100%", padding: "10px 14px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10, color: "#fff", fontSize: 13,
    outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
    transition: "border 0.15s",
  };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 6 };

  return (
    <div style={{ minHeight: "100vh", background: "#0A2540", display: "flex" }}>

      {/* ── Left branding panel ─────────────────────────────── */}
      <div style={{ width: 420, borderRight: "1px solid rgba(255,255,255,0.08)", padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
        className="hidden lg:flex">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#00C5BC,#007f7b)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,181,173,0.4)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>
              Track<span style={{ color: "#4dd4cf" }}>Med</span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>PHARMACY SYSTEM</div>
          </div>
        </div>

        {/* Tagline */}
        <div>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 34, fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 16 }}>
            Smart medicine<br />stock management
          </h2>
          <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 28 }}>
            Track inventory, predict demand, and get automatic alerts for expiring medicines and low stock.
          </p>
          {/* {[
            ["🔔", "Auto alerts for expiry & low stock"],
            ["📊", "ML-powered demand prediction"],
            ["🔍", "Search from 500+ Kaggle medicines"],
            ["👥", "Role-based access control"],
          ].map(([ic, txt]) => (
            <div key={txt} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
              <span style={{ fontSize: 16 }}>{ic}</span>{txt}
            </div>
          ))} */}
        </div>

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>TrackMed v1.0 </p>
      </div>

      {/* ── Right form panel ─────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* Tab switcher */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 4, marginBottom: 28 }}>
            {["login", "register"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: "10px 0", borderRadius: 9, border: "none", cursor: "pointer",
                fontSize: 13.5, fontWeight: 700, transition: "all 0.2s",
                background: tab === t ? "#00B5AD" : "transparent",
                color: tab === t ? "#fff" : "rgba(255,255,255,0.45)",
                boxShadow: tab === t ? "0 2px 8px rgba(0,181,173,0.35)" : "none",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                textTransform: "capitalize",
              }}>
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* ── LOGIN FORM ──────────────────────────────────── */}
          {tab === "login" && (
            <>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Welcome back</h1>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Sign in to your TrackMed account</p>
              </div>
              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Email address</label>
                  <input type="email" required value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="admin@trackmed.com" style={inputStyle}
                    onFocus={e => e.target.style.border = "1px solid #00B5AD"}
                    onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.12)"} />
                </div>
                <div>
                  <label style={labelStyle}>Password</label>
                  <input type="password" required value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••" style={inputStyle}
                    onFocus={e => e.target.style.border = "1px solid #00B5AD"}
                    onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.12)"} />
                </div>
                <button type="submit" disabled={loading} style={{
                  padding: "12px", background: "linear-gradient(135deg,#00C5BC,#00A09A)",
                  color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: "0 4px 12px rgba(0,181,173,0.35)", transition: "all 0.15s",
                }}>
                  {loading ? "Signing in..." : "Sign in →"}
                </button>
              </form>
              
              <p style={{ marginTop: 16, textAlign: "center", fontSize: 12.5, color: "rgba(255,255,255,0.35)" }}>
                Don't have an account?{" "}
                <button onClick={() => setTab("register")} style={{ color: "#00B5AD", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12.5 }}>
                  Register here
                </button>
              </p>
            </>
          )}

          {/* ── REGISTER FORM ───────────────────────────────── */}
          {tab === "register" && (
            <>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Create account</h1>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Register to access TrackMed</p>
              </div>
              <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Full name *</label>
                  <input type="text" required value={regForm.name}
                    onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                    placeholder="Dr. Arjun Patel" style={inputStyle}
                    onFocus={e => e.target.style.border = "1px solid #00B5AD"}
                    onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.12)"} />
                </div>
                <div>
                  <label style={labelStyle}>Email address *</label>
                  <input type="email" required value={regForm.email}
                    onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="arjun@hospital.com" style={inputStyle}
                    onFocus={e => e.target.style.border = "1px solid #00B5AD"}
                    onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.12)"} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Role</label>
                    <select value={regForm.role} onChange={e => setRegForm({ ...regForm, role: e.target.value })}
                      style={{ ...inputStyle, appearance: "none" }}>
                      <option value="pharmacist">Pharmacist</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Department</label>
                    <input type="text" value={regForm.department}
                      onChange={e => setRegForm({ ...regForm, department: e.target.value })}
                      placeholder="Pharmacy" style={inputStyle}
                      onFocus={e => e.target.style.border = "1px solid #00B5AD"}
                      onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.12)"} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Password * <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>(min. 6 characters)</span></label>
                  <input type="password" required minLength={6} value={regForm.password}
                    onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="••••••••" style={inputStyle}
                    onFocus={e => e.target.style.border = "1px solid #00B5AD"}
                    onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.12)"} />
                </div>
                <div>
                  <label style={labelStyle}>Confirm password *</label>
                  <input type="password" required minLength={6} value={regForm.confirmPassword}
                    onChange={e => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                    placeholder="••••••••" style={{ ...inputStyle, borderColor: regForm.confirmPassword && regForm.confirmPassword !== regForm.password ? "#ef4444" : "rgba(255,255,255,0.12)" }}
                    onFocus={e => e.target.style.border = "1px solid #00B5AD"}
                    onBlur={e => e.target.style.border = `1px solid ${regForm.confirmPassword && regForm.confirmPassword !== regForm.password ? "#ef4444" : "rgba(255,255,255,0.12)"}`} />
                  {regForm.confirmPassword && regForm.confirmPassword !== regForm.password && (
                    <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>Passwords do not match</p>
                  )}
                </div>
                <button type="submit" disabled={loading} style={{
                  marginTop: 4, padding: "12px",
                  background: "linear-gradient(135deg,#00C5BC,#00A09A)",
                  color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: "0 4px 12px rgba(0,181,173,0.35)", transition: "all 0.15s",
                }}>
                  {loading ? "Creating account..." : "Create account →"}
                </button>
              </form>
              <p style={{ marginTop: 16, textAlign: "center", fontSize: 12.5, color: "rgba(255,255,255,0.35)" }}>
                Already have an account?{" "}
                <button onClick={() => setTab("login")} style={{ color: "#00B5AD", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12.5 }}>
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
