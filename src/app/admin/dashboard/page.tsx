"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Users,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  ArrowRight,
  Package,
  ShoppingCart,
  Activity,
  Calendar,
  RefreshCw,
  ChevronDown,
  AlertTriangle
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, isSameDay, parseISO } from "date-fns";

/* ------------------- TYPES ------------------- */

type RentalItem = {
  materialId: string;
  label?: string;
  qtyRented: number;
  qtyReturned: number;
};

type Rental = {
  _id: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  rentedAt: string;
  status: string;
  items: RentalItem[];
};

type Material = {
  _id: string;
  name: string;
  availableQuantity?: number;
  variants?: { label: string; availableQuantity: number }[];
};

/* ------------------- COMPONENTS ------------------- */

function StatCard({ title, value, subtext, icon: Icon, color, trend }: any) {
  return (
    <div className="relative overflow-hidden p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className={`absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color.text}`}>
        <Icon size={80} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${color.bg} ${color.text}`}>
            <Icon size={20} />
          </div>
          <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">{title}</span>
        </div>
        
        <div className="flex items-end gap-2">
          <h3 className="text-3xl font-extrabold text-slate-800">{value}</h3>
        </div>
        
        {subtext && (
          <div className="flex items-center gap-1 mt-2 text-xs font-medium">
            {trend === "up" ? (
              <span className="text-emerald-600 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp size={12} className="mr-1" /> {subtext}
              </span>
            ) : trend === "down" ? (
              <span className="text-red-600 flex items-center bg-red-50 px-1.5 py-0.5 rounded">
                <TrendingDown size={12} className="mr-1" /> {subtext}
              </span>
            ) : (
              <span className="text-slate-400">{subtext}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, color }: any) {
  return (
    <Link 
      href={href}
      className={`flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group ${color}`}
    >
      <div className="p-3 rounded-full bg-slate-50 group-hover:bg-white transition-colors mb-2 shadow-sm">
        <Icon size={24} className="text-slate-600 group-hover:text-current transition-colors" />
      </div>
      <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800">{label}</span>
    </Link>
  );
}

/* ------------------- MAIN DASHBOARD ------------------- */

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [stats, setStats] = useState({
    revenue: 0,
    activeRentals: 0,
    pendingDues: 0,
    itemsOut: 0
  });
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  // Fetch Data
  async function loadDashboardData() {
    setLoading(true);
    try {
      const [rentalsRes, materialsRes] = await Promise.all([
        fetch("/api/rentals"),
        fetch("/api/materials")
      ]);

      const rentalsData = await rentalsRes.json();
      const materialsData = await materialsRes.json();

      if (rentalsData.ok && materialsData.ok) {
        processData(rentalsData.data || [], materialsData.data || []);
      }
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  }

  function processData(rentals: Rental[], materials: Material[]) {
    // 1. Calculate Key Stats
    let totalRevenue = 0;
    let activeCount = 0;
    let totalDues = 0;
    let totalItemsOut = 0;

    rentals.forEach(r => {
      // Revenue (Total Paid)
      totalRevenue += Number(r.paidAmount || 0);
      
      // Pending Dues
      totalDues += Number(r.dueAmount || 0);

      // Active Rentals Count
      if (r.status === 'active' || r.status === 'partial_returned') {
        activeCount++;
      }

      // Items Out Calculation
      if (r.status !== 'returned') {
        r.items.forEach(item => {
          const remaining = (item.qtyRented || 0) - (item.qtyReturned || 0);
          if (remaining > 0) totalItemsOut += remaining;
        });
      }
    });

    setStats({
      revenue: totalRevenue,
      activeRentals: activeCount,
      pendingDues: totalDues,
      itemsOut: totalItemsOut
    });

    // 2. Prepare Revenue Chart Data (Last 7 Days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStr = format(date, "EEE"); // Mon, Tue...
      
      // Find rentals created on this day and sum their payments
      // Note: In a real app, you'd check a separate Payments table/collection.
      // Here we assume paidAmount correlates to rentedAt for simplicity.
      const dayRevenue = rentals
        .filter(r => isSameDay(parseISO(r.rentedAt), date))
        .reduce((sum, r) => sum + Number(r.paidAmount || 0), 0);

      chartData.push({ name: dayStr, revenue: dayRevenue });
    }
    setRevenueChart(chartData);

    // 3. Recent Activity (Last 5 rentals)
    const activity = rentals
      .sort((a, b) => new Date(b.rentedAt).getTime() - new Date(a.rentedAt).getTime())
      .slice(0, 5)
      .map(r => ({
        id: r._id,
        text: `New rental for ${r.customerName}`,
        time: format(parseISO(r.rentedAt), "dd MMM, HH:mm"),
        type: "rental" // Could distinguish based on status too
      }));
    setRecentActivity(activity);

    // 4. Inventory Health (Low Stock)
    const lowStock: any[] = [];
    materials.forEach(m => {
      // Check top-level available
      if (m.availableQuantity !== undefined && m.availableQuantity <= 5) {
        lowStock.push({ name: m.name, count: m.availableQuantity, severity: m.availableQuantity === 0 ? 'critical' : 'low' });
      }
      // Check variants
      if (m.variants) {
        m.variants.forEach(v => {
          if (v.availableQuantity <= 5) {
            lowStock.push({ name: `${m.name} (${v.label})`, count: v.availableQuantity, severity: v.availableQuantity === 0 ? 'critical' : 'low' });
          }
        });
      }
    });
    setLowStockItems(lowStock.slice(0, 3)); // Top 3 alerts
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  // --- Skeleton Loader ---
  if (loading) {
    return (
      <div className="space-y-6 p-4 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-200 rounded-2xl"></div>
          <div className="h-80 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      
      {/* HEADER AREA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Welcome back, here's what's happening with your inventory today.</p>
        </div>
        
        <button 
          onClick={loadDashboardData}
          className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
        >
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      {/* KEY STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={`₹ ${stats.revenue.toLocaleString()}`} 
          subtext="Total Collected" 
          trend="up" 
          icon={IndianRupee} 
          color={{ bg: "bg-emerald-100", text: "text-emerald-600" }} 
        />
        <StatCard 
          title="Active Rentals" 
          value={stats.activeRentals} 
          subtext="Currently ongoing" 
          trend="neutral" 
          icon={ShoppingCart} 
          color={{ bg: "bg-blue-100", text: "text-blue-600" }} 
        />
        <StatCard 
          title="Pending Dues" 
          value={`₹ ${stats.pendingDues.toLocaleString()}`} 
          subtext="Total Outstanding" 
          trend="down" 
          icon={Clock} 
          color={{ bg: "bg-amber-100", text: "text-amber-600" }} 
        />
        <StatCard 
          title="Items Out" 
          value={stats.itemsOut} 
          subtext="In circulation" 
          trend="neutral" 
          icon={Boxes} 
          color={{ bg: "bg-purple-100", text: "text-purple-600" }} 
        />
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COL: Charts & Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Activity size={18} className="text-emerald-500" /> Revenue Trend
                </h2>
                <p className="text-xs text-slate-400">Income over the last 7 days</p>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#94a3b8' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#94a3b8' }} 
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10B981" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <QuickAction href="/admin/rentals" icon={Plus} label="New Rental" color="hover:border-emerald-200 hover:text-emerald-600" />
                <QuickAction href="/admin/materials" icon={Package} label="Add Material" color="hover:border-blue-200 hover:text-blue-600" />
                <QuickAction href="/admin/customers" icon={Users} label="Add Customer" color="hover:border-purple-200 hover:text-purple-600" />
                <QuickAction href="/admin/reports" icon={Calendar} label="View Reports" color="hover:border-amber-200 hover:text-amber-600" />
            </div>
          </div>

        </div>

        {/* RIGHT COL: Activity & Alerts */}
        <div className="space-y-6">
          
          {/* Recent Activity Feed */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="font-bold text-slate-800 text-sm">Recent Activity</h2>
              <Link href="/admin/rentals" className="text-xs text-emerald-600 font-medium hover:underline flex items-center">View All <ArrowRight size={12} className="ml-1"/></Link>
            </div>
            <div className="p-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No recent activity</p>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:h-full before:w-0.5 before:-z-10 before:bg-slate-100">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="flex relative">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-sm flex-shrink-0 mr-3 bg-blue-500">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{item.text}</p>
                        <span className="text-xs text-slate-400">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mini Inventory Health */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                  Inventory Health 
                  {lowStockItems.length > 0 && <AlertTriangle size={16} className="text-amber-400"/>}
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  {lowStockItems.length > 0 
                    ? `${lowStockItems.length} items are running low.` 
                    : "All items are well stocked."}
                </p>
                
                <div className="space-y-3">
                    {lowStockItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm items-center">
                          <span className="text-slate-300 truncate max-w-[150px]">{item.name}</span>
                          <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                            item.severity === 'critical' 
                              ? 'text-red-400 bg-red-400/10' 
                              : 'text-amber-400 bg-amber-400/10'
                          }`}>
                            {item.severity === 'critical' ? 'Empty' : `Low (${item.count})`}
                          </span>
                      </div>
                    ))}
                </div>

                <Link href="/admin/materials" className="mt-6 block w-full text-center py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors border border-white/5">
                    Manage Inventory
                </Link>
            </div>
            {/* Decoration */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"></div>
          </div>

        </div>
      </div>
    </div>
  );
}