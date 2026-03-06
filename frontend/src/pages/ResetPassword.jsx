import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;

  const handleSubmit = async () => {
    if (!password)              return toast.error("Enter a new password"); 
    if (password.length < 6)   return toast.error("Password must be 6+ characters");
    if (password !== confirm)   return toast.error("Passwords don't match");
    if (!token)                 return toast.error("Invalid reset link");

    setLoading(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || "http://localhost:8000")/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) { setDone(true); toast.success("Password reset!"); }
      else toast.error(data.message || "Reset failed");
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
          <h1 className="text-2xl font-black text-white">{done ? "All done!" : "Set New Password"}</h1>
          <p className="text-slate-400 text-sm mt-1">{done ? "Your password has been changed" : "Choose a strong new password"}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {done ? (
            <div className="text-center">
              <div className="text-5xl mb-4">🔓</div>
              <p className="text-slate-300 text-sm mb-6">You can now sign in with your new password.</p>
              <button onClick={() => navigate("/login")} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all">
                Go to Sign In →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">New Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} placeholder="Min 6 characters" value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all pr-12"/>
                  <button onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs">{showPw ? "Hide" : "Show"}</button>
                </div>
                {password && (
                  <div className="flex items-center gap-2 mt-1.5">
                    {[1,2,3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                        strength >= i ? ["","bg-red-400","bg-yellow-400","bg-green-400"][strength] : "bg-white/10"}`}/>
                    ))}
                    <span className="text-[10px] text-slate-400 w-10">{["","Weak","Good","Strong"][strength]}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">Confirm Password</label>
                <input type="password" placeholder="Repeat new password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none transition-all ${
                    confirm && confirm !== password ? "border-red-500" : "border-white/20 focus:border-blue-400"}`}/>
              </div>
              <button onClick={handleSubmit} disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Resetting...</> : "🔒 Reset Password"}
              </button>
            </div>
          )}
          {!done && (
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors">← Back to Sign In</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}