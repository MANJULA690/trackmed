import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm]       = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fill = (email, password) => setForm({ email, password });

  return (
    <div className="min-h-screen bg-navy flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] p-12 bg-navy border-r border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="font-display text-xl text-white font-bold tracking-tight">
            Track<span className="text-brand-400">Med</span>
          </span>
        </div>

        <div>
          <h2 className="font-display text-4xl font-bold text-white leading-tight mb-4">
            Smart medicine<br />stock management
          </h2>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            Track inventory, predict demand, and get automatic alerts for expiring medicines and low stock — all in one place.
          </p>

          <div className="space-y-3">
            {[
              { icon: "🔔", text: "Auto alerts for low stock & expiry" },
              { icon: "📊", text: "ML-powered demand prediction" },
              { icon: "🔍", text: "Search & filter 2,800+ medicines" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-white/60 text-sm">
                <span className="text-base">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/25 text-xs">
          TrackMed v1.0 · 6th Semester Project
        </p>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-display text-lg text-white font-bold">Track<span className="text-brand-400">Med</span></span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-white mb-1">Sign in</h1>
            <p className="text-white/40 text-sm">Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="admin@trackmed.com"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10
                           text-white placeholder-white/25 text-sm focus:outline-none
                           focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10
                           text-white placeholder-white/25 text-sm focus:outline-none
                           focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm
                         rounded-lg transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in...
                </>
              ) : "Sign in →"}
            </button>
          </form>

          {/* Quick fill demo credentials */}
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-white/40 text-xs mb-2.5 font-medium">Demo credentials</p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => fill("admin@trackmed.com", "Admin@123")}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <span className="text-white/70 text-xs font-medium group-hover:text-white transition-colors">Admin</span>
                <span className="text-white/30 text-xs ml-2">admin@trackmed.com</span>
              </button>
              <button
                type="button"
                onClick={() => fill("pharmacist@trackmed.com", "Pharma@123")}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <span className="text-white/70 text-xs font-medium group-hover:text-white transition-colors">Pharmacist</span>
                <span className="text-white/30 text-xs ml-2">pharmacist@trackmed.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
