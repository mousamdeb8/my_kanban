import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return toast.error("Please fill in all fields");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        toast.success(`Welcome back, ${data.user.name}! 👋`);
        setTimeout(() => navigate("/projects"), 500);
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch { toast.error("Server error — is backend running?"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <Toaster position="top-center"/>

      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"/>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"/>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-blue-600 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
            <span className="text-white text-2xl font-black">K</span>
          </div>
          <h1 className="text-2xl font-black text-white">Kanban Workspace</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">Email</label>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"/>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all pr-12"/>
                <button onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs transition-colors">
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setRemember(!remember)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${remember ? "bg-blue-600 border-blue-600" : "border-slate-500"}`}>
                  {remember && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                </div>
                <span className="text-xs text-slate-400">Remember me for 30 days</span>
              </label>
              <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</Link>
            </div>

            {/* Submit */}
            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Signing in...</>
                : "Sign In →"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-slate-400">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Create one free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}