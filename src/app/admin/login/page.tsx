"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, KeyRound, Mail, Smartphone, ArrowRight, Loader2, Lock, CheckCircle2, AlertCircle, CheckCircle, X } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"password" | "otp">("password");

  // Password Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP Login State
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // ------------------ TOAST STATE ------------------
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  // -------------------------------------------------

  // --- Handlers ---

  async function loginWithPassword(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (!data.ok) {
        showToast(data.error || "Login failed", "error");
        setLoading(false);
        return;
      }
      
      showToast("Welcome back! Redirecting...", "success");
      // Force full reload to ensure Middleware picks up the new cookie immediately
      window.location.href = "/admin/dashboard"; 
    } catch {
      showToast("Network connection error", "error");
      setLoading(false);
    }
  }

  async function sendOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!identifier) {
      showToast("Please enter your email or phone number", "error");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!data.ok) {
        showToast(data.error || "Could not send OTP", "error");
        setLoading(false);
        return;
      }
      setOtpSent(true);
      
      if (data.otpSample) {
        // For demo purposes only
        showToast(`Code sent! (Dev: ${data.otpSample})`, "success");
      } else {
        showToast("Verification code sent!", "success");
      }
    } catch {
      showToast("Network connection error", "error");
    }
    setLoading(false);
  }

  async function verifyOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!identifier || !otp) {
      showToast("Please enter the verification code", "error");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, code: otp }),
      });
      const data = await res.json();
      if (!data.ok) {
        showToast(data.error || "Invalid code", "error");
        setLoading(false);
        return;
      }
      showToast("Verified successfully!", "success");
      window.location.href = "/admin/dashboard";
    } catch {
      showToast("Network connection error", "error");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      
      {/* --- TOAST CONTAINER --- */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-white transform transition-all duration-300 ease-in-out animate-slide-down ${
              toast.type === "success" 
                ? "bg-emerald-600 border-emerald-500" 
                : "bg-red-600 border-red-500"
            }`}
          >
            <div className="flex-shrink-0">
              {toast.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>
            <p className="text-sm font-medium">{toast.message}</p>
            <button onClick={() => dismissToast(toast.id)} className="ml-2 opacity-80 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      
      {/* Background Decoration */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-teal-200/20 rounded-full blur-3xl -z-10" />

      {/* Brand / Logo Area */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-200 mb-6 transform rotate-3 hover:rotate-0 transition-all duration-300">
          <ShieldCheck size={48} />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">SBM Admin</h1>
        <p className="text-slate-500 mt-2 text-base font-medium">Secure management portal</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-emerald-500 to-teal-500" />
        
        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 m-2 rounded-2xl">
          <button
            onClick={() => setTab("password")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              tab === "password"
                ? "bg-white text-emerald-700 shadow-sm ring-1 ring-black/5"
                : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
            }`}
          >
            <Lock size={16} strokeWidth={2.5} /> Password
          </button>
          <button
            onClick={() => setTab("otp")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              tab === "otp"
                ? "bg-white text-emerald-700 shadow-sm ring-1 ring-black/5"
                : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
            }`}
          >
            <Smartphone size={16} strokeWidth={2.5} /> OTP Login
          </button>
        </div>

        <div className="p-8 pt-6">
          {tab === "password" ? (
            <form onSubmit={loginWithPassword} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-slate-800 font-medium placeholder:text-slate-400"
                    type="email"
                    placeholder="admin@sbm.com"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                </div>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-slate-800 font-medium placeholder:text-slate-400"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                {/* Forgot Password Link */}
                <div className="flex justify-end mt-2">
                  <button 
                    type="button"
                    onClick={() => {
                        setTab("otp");
                        showToast("Switched to OTP login for recovery", "success");
                    }}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors focus:outline-none"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>Sign In <ArrowRight size={20} /></>}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {!otpSent ? (
                <form onSubmit={sendOtp} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email or Phone</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                      <input
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-slate-800 font-medium placeholder:text-slate-400"
                        placeholder="e.g. admin@sbm.com"
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">We'll send a verification code to this ID.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <>Send Code <ArrowRight size={20} /></>}
                  </button>
                </form>
              ) : (
                <form onSubmit={verifyOtp} className="space-y-6">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                    <p className="text-sm text-emerald-800 font-medium">Code sent to <span className="font-bold">{identifier}</span></p>
                    <button 
                      type="button" 
                      onClick={() => { setOtpSent(false); setOtp(""); }} 
                      className="text-xs text-emerald-600 hover:text-emerald-800 hover:underline mt-1"
                    >
                      Change Address
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Enter Verification Code</label>
                    <div className="relative group">
                      <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                      <input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-slate-800 tracking-[0.25em] font-mono text-lg font-bold placeholder:tracking-normal"
                        placeholder="123456"
                        required
                        autoFocus
                        maxLength={6}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Verify & Login"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-slate-400 text-sm font-medium">&copy; {new Date().getFullYear()} SBM Shuttering Manager</p>
      </div>
    </div>
  );
}