"use client";

import { useEffect, useState } from "react";
import { User, Lock, Shield, Laptop, Save, Mail, CheckCircle2, AlertCircle, X, Globe, Smartphone, KeyRound, Loader2 } from "lucide-react";

export default function AccountSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<any>(null);

  // Form States
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // OTP States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [processing, setProcessing] = useState(false);

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

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/me");
        const data = await res.json();
        if (data.ok) {
          setAdmin(data.admin);
          setName(data.admin.name);
        }
      } catch {
        showToast("Failed to load profile", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Step 1: Initiate Update (Send OTP if password changing)
  async function handleInitiateUpdate(e: React.FormEvent) {
    e.preventDefault();
    
    if (newPassword && newPassword !== confirmPassword) {
      return showToast("New passwords do not match", "error");
    }

    // If only updating name, proceed directly (or add OTP here too if highly secure)
    if (!newPassword && name === admin?.name) {
      return showToast("No changes detected", "error");
    }

    setProcessing(true);

    // If password is changing, require OTP
    if (newPassword) {
      try {
        // Request OTP from backend
        const res = await fetch("/api/admin/login/request-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: admin.email }), // Send to current admin email
        });
        
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        setOtpSent(true);
        setShowOtpModal(true);
        showToast("Verification code sent to your email", "success");
        
      } catch (err: any) {
        showToast(err.message || "Failed to send OTP", "error");
      } finally {
        setProcessing(false);
      }
    } else {
      // Just updating name, proceed
      handleFinalUpdate();
    }
  }

  // Step 2: Finalize Update with OTP
  async function handleFinalUpdate() {
    setProcessing(true);
    try {
      const payload: any = { name };
      if (newPassword) {
        payload.newPassword = newPassword;
        payload.otp = otp; // Send OTP for verification
      }

      const res = await fetch("/api/admin/accounts", { // Ensure this matches your actual API route
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      showToast("Profile updated successfully", "success");
      
      // Reset states
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
      setShowOtpModal(false);
      setOtpSent(false);
      
      // Update local state
      setAdmin({ ...admin, name });

    } catch (err: any) {
      showToast(err.message || "Update failed", "error");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
            <div className="w-12 h-12 bg-emerald-100 rounded-full"></div>
            <div className="text-emerald-700 font-medium">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20 relative overflow-hidden">
      
      {/* --- TOAST CONTAINER --- */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-white transform transition-all duration-300 ease-in-out animate-slide-up backdrop-blur-md ${
              toast.type === "success" 
                ? "bg-emerald-600/95 border-emerald-500" 
                : "bg-red-600/95 border-red-500"
            }`}
          >
            <div className="flex-shrink-0">
              {toast.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            </div>
            <p className="text-sm font-medium">{toast.message}</p>
            <button onClick={() => dismissToast(toast.id)} className="ml-2 opacity-80 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      
      {/* Backgrounds */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-emerald-100/40 via-teal-50/30 to-transparent -z-10 pointer-events-none" />
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Page Header */}
        <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
            <p className="text-slate-500 mt-2 text-lg">Manage your profile and secure your account.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar / User Info Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-100 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-emerald-500 to-teal-600" />
              
              <div className="relative z-10">
                <div className="w-28 h-28 mx-auto bg-white p-1.5 rounded-full shadow-lg mb-4">
                    <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center text-emerald-700 text-4xl font-bold">
                        {admin?.name?.[0]?.toUpperCase() || "A"}
                    </div>
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900">{admin?.name}</h2>
                <p className="text-slate-500 font-medium mb-6">{admin?.email}</p>
                
                <div className="flex flex-col gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 border border-slate-100">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                            <Shield size={18} />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Role</p>
                            <p className="text-sm font-bold text-slate-700 capitalize">{admin?.role || "Admin"}</p>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 border border-slate-100">
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                            <Globe size={18} />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status</p>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                <p className="text-sm font-bold text-slate-700">Active</p>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-8 space-y-8">
            
            <form onSubmit={handleInitiateUpdate} className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-100 p-8">
              {/* Profile Section */}
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <User size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Profile Details</h3>
                    <p className="text-sm text-slate-500">Update your name and view your email.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                    <input 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium"
                        placeholder="Your Name"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                    <input 
                        value={admin?.email || ""}
                        disabled
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Security Section - Removed Current Password */}
              <div className="flex items-center gap-3 mb-6 pt-2 pb-4 border-b border-slate-100">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <Lock size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Reset Password</h3>
                    <p className="text-sm text-slate-500">Securely change your password using OTP verification.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">New Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                        <input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium placeholder:text-slate-400"
                        placeholder="Min 8 characters"
                        />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Confirm New Password</label>
                    <div className="relative">
                        <CheckCircle2 className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                        <input 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium placeholder:text-slate-400"
                        placeholder="Re-enter new password"
                        />
                    </div>
                  </div>
                </div>
                
                {newPassword && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 items-start">
                        <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                        <p className="text-sm text-amber-700">
                            For security, we will send a <strong>One-Time Password (OTP)</strong> to your registered email 
                            (<strong>{admin?.email}</strong>) to verify this change.
                        </p>
                    </div>
                )}
              </div>

              <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={processing}
                  className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
                >
                  {processing ? (
                    <> <Loader2 className="animate-spin" size={18} /> Processing...</>
                  ) : (
                    <> <Save size={18} /> Save Changes </>
                  )}
                </button>
              </div>
            </form>

            {/* Active Sessions */}
            <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <Laptop size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Active Sessions</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl text-slate-600 shadow-sm border border-slate-100">
                      <Laptop size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Current Session</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full">Active</span>
                        <p className="text-xs text-slate-500">Accessed via Browser</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-emerald-600">Online</p>
                    <p className="text-xs text-slate-400">Now</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- OTP VERIFICATION MODAL --- */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
                <button 
                    onClick={() => setShowOtpModal(false)} 
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                        <KeyRound size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Verify It's You</h2>
                    <p className="text-slate-500 mt-2 text-sm">
                        Enter the 6-digit code sent to <br/>
                        <span className="font-bold text-slate-700">{admin?.email}</span>
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="relative">
                        <input
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-0 outline-none text-slate-800 placeholder:text-slate-300 transition-all"
                            placeholder="••••••"
                            maxLength={6}
                            autoFocus
                        />
                    </div>

                    <button
                        onClick={handleFinalUpdate}
                        disabled={processing || otp.length < 6}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {processing ? <Loader2 className="animate-spin" /> : "Verify & Update Password"}
                    </button>
                </div>
            </div>
        </div>
      )}

    </main>
  );
}