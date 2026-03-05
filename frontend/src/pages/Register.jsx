import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const API = "http://localhost:8000";

const STEP_CONFIG = [
  { n: 1, label: "Your Details" },
  { n: 2, label: "Verify Email" },
  { n: 3, label: "All Done!" },
];

export default function Register() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [step,        setStep]        = useState(1);
  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [otp,         setOtp]         = useState("");
  const [loading,     setLoading]     = useState(false);
  const [showPass,    setShowPass]    = useState(false);
  const [otpSent,     setOtpSent]     = useState(false);

  // ── Step 1 → 2: validate details, send OTP ──
  const handleSendOTP = async () => {
    if (!name.trim())           return toast.error("Name is required");
    if (!/\S+@\S+\.\S+/.test(email)) return toast.error("Enter a valid email");
    if (password.length < 6)    return toast.error("Password must be at least 6 characters");
    if (password !== confirmPass) return toast.error("Passwords do not match");

    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/send-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Verification code sent to your email!");
        setOtpSent(true);
        setStep(2);
      } else {
        toast.error(data.message || "Failed to send code");
      }
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  };

  // ── Step 2 → 3: verify OTP + register ──
  const handleVerifyAndRegister = async () => {
    if (otp.length !== 6) return toast.error("Enter the 6-digit code");

    setLoading(true);
    try {
      // First verify OTP
      const verifyRes  = await fetch(`${API}/api/auth/verify-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, otp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) { toast.error(verifyData.message || "Invalid code"); setLoading(false); return; }

      // Then register — role is NOT sent, backend defaults to "member"
      const regRes  = await fetch(`${API}/api/auth/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim(), email, password }),
      });
      const regData = await regRes.json();
      if (regRes.ok) {
        login(regData.token, regData.user);
        setStep(3);
        setTimeout(() => navigate("/"), 2000);
      } else {
        toast.error(regData.message || "Registration failed");
      }
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  };

  const resendOTP = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/send-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) toast.success("New code sent!");
      else toast.error(data.message || "Failed");
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <Toaster position="top-center"/>

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-xl mb-3">K</div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-sm text-slate-400 mt-1">Join Kanban Workspace</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {STEP_CONFIG.map((s, i) => (
            <div key={s.n} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > s.n  ? "bg-green-500 text-white" :
                  step === s.n ? "bg-blue-600 text-white ring-4 ring-blue-600/30" :
                                 "bg-slate-700 text-slate-400"
                }`}>
                  {step > s.n ? "✓" : s.n}
                </div>
                <span className={`text-[10px] font-medium ${step === s.n ? "text-blue-400" : "text-slate-500"}`}>{s.label}</span>
              </div>
              {i < STEP_CONFIG.length - 1 && (
                <div className={`w-8 h-0.5 mb-4 transition-all ${step > s.n ? "bg-green-500" : "bg-slate-700"}`}/>
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">

          {/* ── Step 1: Your Details ── */}
          {step === 1 && (
            <div className="p-8 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Your Details</h2>
                <p className="text-sm text-slate-400">Tell us who you are. Your role will be assigned by an admin after joining.</p>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">Full Name *</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  onKeyDown={e => e.key === "Enter" && handleSendOTP()}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"/>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">Work / Personal Email *</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  onKeyDown={e => e.key === "Enter" && handleSendOTP()}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"/>
                <p className="text-[11px] text-slate-500 mt-1.5">A 6-digit verification code will be sent to this email.</p>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">Password *</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"/>
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-sm px-1">
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">Confirm Password *</label>
                <input
                  type={showPass ? "text" : "password"} value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Re-enter password"
                  onKeyDown={e => e.key === "Enter" && handleSendOTP()}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"/>
              </div>

              {/* Info box */}
              <div className="flex items-start gap-3 p-3 bg-blue-900/30 border border-blue-800/50 rounded-xl">
                <span className="text-blue-400 mt-0.5 flex-shrink-0">ℹ️</span>
                <p className="text-xs text-blue-300">
                  Your account will start as a <strong>Member</strong>. An admin will assign your role (Developer, Intern, etc.) from the Accounts page after you join.
                </p>
              </div>

              <button onClick={handleSendOTP} disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Sending code...</> : "Continue →"}
              </button>

              <p className="text-center text-sm text-slate-400">
                Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
              </p>
            </div>
          )}

          {/* ── Step 2: Verify Email ── */}
          {step === 2 && (
            <div className="p-8 space-y-5">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">📧</div>
                <h2 className="text-lg font-bold text-white mb-1">Check your email</h2>
                <p className="text-sm text-slate-400">
                  We sent a 6-digit code to <span className="text-blue-400 font-semibold">{email}</span>
                </p>
              </div>

              {/* OTP input */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5 text-center">Verification Code</label>
                <input
                  type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
                  placeholder="• • • • • •"
                  maxLength={6}
                  onKeyDown={e => e.key === "Enter" && handleVerifyAndRegister()}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-4 text-2xl text-white text-center placeholder-slate-600 font-mono tracking-[0.5em] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"/>
                <p className="text-[11px] text-slate-500 mt-1.5 text-center">Code expires in 10 minutes</p>
              </div>

              <button onClick={handleVerifyAndRegister} disabled={loading || otp.length !== 6}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Verifying...</>
                  : "Verify & Create Account ✓"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-200">← Back</button>
                <button onClick={resendOTP} disabled={loading} className="text-blue-400 hover:text-blue-300 disabled:opacity-50">
                  Resend code
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div className="p-8 text-center space-y-4">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-4xl mx-auto animate-bounce">🎉</div>
              <h2 className="text-xl font-bold text-white">Welcome aboard!</h2>
              <p className="text-sm text-slate-400">
                Your account has been created. You've joined as a <span className="text-blue-400 font-semibold">Member</span>.
              </p>
              <div className="p-3 bg-amber-900/30 border border-amber-700/50 rounded-xl">
                <p className="text-xs text-amber-300">
                  ⏳ An admin will assign your role shortly. You'll receive a notification when your role is updated.
                </p>
              </div>
              <p className="text-xs text-slate-500">Redirecting to your dashboard...</p>
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}