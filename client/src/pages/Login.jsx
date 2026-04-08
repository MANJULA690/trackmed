import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm]       = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      background: "linear-gradient(135deg, #061628 0%, #0d2d4e 50%, #091e36 100%)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: "absolute", top: -120, left: -120, width: 500, height: 500,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,181,173,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -80, right: -80, width: 400, height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Left panel — branding */}
      <div style={{
        width: 480, flexShrink: 0,
        padding: "48px 52px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }} className="hidden lg:flex">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: "linear-gradient(135deg, #00C5BC, #007f7b)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(0,181,173,0.4)",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
              Track<span style={{ color: "#4dd4cf" }}>Med</span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>PHARMACY SYSTEM</div>
          </div>
        </div>

        {/* Headline */}
        <div>
          <h2 style={{
            fontFamily: "'Outfit',sans-serif", fontSize: 42, fontWeight: 800,
            color: "#fff", lineHeight: 1.15, letterSpacing: "-1px", marginBottom: 20,
          }}>
            Smarter<br />
            <span style={{ color: "#4dd4cf" }}>medicine</span><br />
            management.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.7, marginBottom: 36 }}>
            Track inventory, predict demand, and get automatic alerts — all in one platform built for hospital pharmacies.
          </p>

          {/* Feature list */}
          {/* {[
            { icon: "🔔", text: "Auto-alerts for low stock & expiry" },
            { icon: "📊", text: "ML-powered 30-day demand prediction" },
            { icon: "💊", text: "Manage 2,800+ medicines from Kaggle dataset" },
            { icon: "🔒", text: "Role-based access for pharmacists & admins" },
          ].map(f => (
            <div key={f.text} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 0",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.55)", fontSize: 13,
            }}>
              <span style={{ fontSize: 16, width: 24 }}>{f.icon}</span>
              {f.text}
            </div>
          ))} */}
        </div>

        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
          {/* TrackMed v1.0 · 6th Semester Project */}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32,
      }}>
        <div style={{ width: "100%", maxWidth: 400 }} className="animate-fade-up" style2={{ animationFillMode: "forwards" }}>

          {/* Glass card */}
          <div style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 24,
            padding: "36px 36px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
          }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 6 }}>
                Sign in
              </h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13.5 }}>
                Enter your credentials to continue
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: 7, letterSpacing: "0.04em" }}>
                  EMAIL ADDRESS
                </label>
                <input
                  type="email" required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@trackmed.com"
                  style={{
                    width: "100%", padding: "11px 14px",
                    background: "rgba(255,255,255,0.07)",
                    border: "1.5px solid rgba(255,255,255,0.12)",
                    borderRadius: 12, color: "#fff", fontSize: 14,
                    outline: "none", transition: "all 0.15s",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                  onFocus={e => { e.target.style.borderColor = "#00B5AD"; e.target.style.background = "rgba(0,181,173,0.08)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.background = "rgba(255,255,255,0.07)"; }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: 7, letterSpacing: "0.04em" }}>
                  PASSWORD
                </label>
                <input
                  type="password" required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  style={{
                    width: "100%", padding: "11px 14px",
                    background: "rgba(255,255,255,0.07)",
                    border: "1.5px solid rgba(255,255,255,0.12)",
                    borderRadius: 12, color: "#fff", fontSize: 14,
                    outline: "none", transition: "all 0.15s",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                  onFocus={e => { e.target.style.borderColor = "#00B5AD"; e.target.style.background = "rgba(0,181,173,0.08)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.background = "rgba(255,255,255,0.07)"; }}
                />
              </div>

              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "13px",
                background: loading ? "#005f5c" : "linear-gradient(135deg, #00C5BC, #009990)",
                color: "#fff", border: "none", borderRadius: 12,
                fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                boxShadow: "0 4px 16px rgba(0,181,173,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" opacity="0.3"/>
                      <path fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Signing in...
                  </>
                ) : "Sign in →"}
              </button>
            </form>

            {/* Demo creds */}
            <div style={{
              marginTop: 22, padding: "14px 16px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
            }}>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 10 }}>
                DEMO CREDENTIALS
              </p>
              {[
                { role: "Admin", email: "admin@trackmed.com", pw: "Admin@123" },
                { role: "Pharmacist", email: "pharmacist@trackmed.com", pw: "Pharma@123" },
              ].map(c => (
                <button key={c.role} type="button"
                  onClick={() => setForm({ email: c.email, password: c.pw })}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "8px 10px", borderRadius: 10,
                    background: "transparent", border: "none", cursor: "pointer",
                    marginBottom: 4, transition: "background 0.15s",
                    color: "rgba(255,255,255,0.6)",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{c.role}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono',monospace" }}>{c.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
