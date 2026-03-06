import { useState } from "react";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function ForgotPassword() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async () => {
    if (!email) return toast.error("Enter your email");
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch { toast.error("Server error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <Toaster position="top-center"/>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-blue-600 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
            <span className="text-white text-2xl font-black">K</span>
          </div>
          <h1 className="text-2xl font-black text-white">{sent ? "Check your email" : "Forgot Password?"}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {sent ? `We sent a reset link to ${email}` : "We'll send a reset link to your email"}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">📧</div>
              <p className="text-slate-300 text-sm mb-6">Check your inbox and click the reset link. It expires in 1 hour.</p>
              <p className="text-slate-500 text-xs mb-4">Didn't get it? Check your spam folder.</p>
              <button onClick={() => setSent(false)} className="text-blue-400 hover:text-blue-300 text-sm transition-colors">Try again</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">Email Address</label>
                <input type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"/>
              </div>
              <button onClick={handleSubmit} disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Sending...</> : "📧 Send Reset Link"}
              </button>
            </div>
          )}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors">← Back to Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}