"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { User, Lock, Shield, Smartphone, Globe, Laptop, Save, Mail, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";

export default function AccountSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<any>(null);

  // Form States
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

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
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      return toast.error("New passwords do not match");
    }

    setUpdating(true);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      toast.success("Profile updated successfully");
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Update local admin state
      setAdmin({ ...admin, name });
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setUpdating(false);
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
      <Toaster position="top-right" />
      
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-emerald-100/40 via-teal-50/30 to-transparent -z-10 pointer-events-none" />
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Header */}
        <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
            <p className="text-slate-500 mt-2 text-lg">Manage your personal information and security preferences.</p>
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

          {/* Main Form & Settings */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Profile Edit Form */}
            <form onSubmit={handleUpdate} className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-100 p-8">
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

              <div className="flex items-center gap-3 mb-6 pt-2 pb-4 border-b border-slate-100">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <Lock size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Security</h3>
                    <p className="text-sm text-slate-500">Change your password to keep your account secure.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Current Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                    <input 
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium placeholder:text-slate-400"
                        placeholder="Enter current password to change"
                    />
                  </div>
                </div>
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
              </div>

              <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    "Saving Changes..."
                  ) : (
                    <>
                        <Save size={18} /> Save Changes
                    </>
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
                      <p className="text-sm font-bold text-slate-800">Windows PC - Chrome</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full">Current Session</span>
                        <p className="text-xs text-slate-500">192.168.1.1</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-emerald-600">Active Now</p>
                    <p className="text-xs text-slate-400">Jakarta, Indonesia</p>
                  </div>
                </div>

                {/* Mock Session 2 */}
                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 rounded-xl text-slate-500">
                      <Smartphone size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">iPhone 13 - Safari</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500">192.168.1.56</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-slate-500">2 days ago</p>
                    <p className="text-xs text-slate-400">New Delhi, India</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}