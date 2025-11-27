"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Search, DownloadCloud, Printer, MessageSquare, AlertTriangle, Calendar, FileText, RefreshCw, Filter } from "lucide-react";

/* -------------------- Types -------------------- */
type RentalItem = {
  materialId: string;
  variantId?: string | null;
  label?: string;
  pricePerDay: number;
  qtyRented: number;
  qtyReturned: number;
  subtotal?: number;
};

type Rental = {
  _id: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  rentedAt: string;
  expectedReturnDate?: string | null;
  status: "active" | "partial_returned" | "returned";
  items: RentalItem[];
};

type Material = {
  _id: string;
  name: string;
  variants?: { _id: string; label: string; availableQuantity?: number }[];
  availableQuantity?: number;
  category?: string;
};

/* -------------------- Helper utilities -------------------- */
function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCurrency(n: number) {
  return `₹ ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* -------------------- Component -------------------- */
export default function AdminReportsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Date Range State (Defaults to current month)
  const [rangeStart, setRangeStart] = useState<string>(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [rangeEnd, setRangeEnd] = useState<string>(() => format(endOfMonth(new Date()), "yyyy-MM-dd"));

  // UI State
  const [filterPhoneOrName, setFilterPhoneOrName] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [rRes, mRes] = await Promise.all([fetch("/api/rentals"), fetch("/api/materials")]);
      const rJson = await rRes.json();
      const mJson = await mRes.json();
      
      if (!rJson.ok) throw new Error(rJson.error || "Failed rentals");
      if (!mJson.ok) throw new Error(mJson.error || "Failed materials");
      
      const r: Rental[] = (rJson.data || []).map((x: any) => ({
        ...x,
        totalAmount: Number(x.totalAmount || 0),
        paidAmount: Number(x.paidAmount || 0),
        dueAmount: Number(x.dueAmount || 0),
        items: (x.items || []).map((it: any) => ({
          ...it,
          pricePerDay: Number(it.pricePerDay || 0),
          qtyRented: Number(it.qtyRented || 0),
          qtyReturned: Number(it.qtyReturned || 0),
          subtotal: Number(it.subtotal || 0),
        })),
      }));
      setRentals(r);
      setMaterials(mJson.data || []);
      toast.success("Data refreshed");
    } catch (err: any) {
      toast.error(err.message || "Load error");
    } finally {
      setLoading(false);
    }
  }

  /* -------------------- 1. GLOBAL FILTER LOGIC -------------------- */
  // First, filter everything by the search bar (Customer Name/Phone)
  const searchFilteredRentals = useMemo(() => {
    if (!filterPhoneOrName.trim()) return rentals;
    const lower = filterPhoneOrName.toLowerCase();
    return rentals.filter(r => 
      (r.customerName || "").toLowerCase().includes(lower) || 
      (r.customerPhone || "").includes(lower)
    );
  }, [rentals, filterPhoneOrName]);

  /* -------------------- 2. DATE RANGE FILTER LOGIC -------------------- */
  // Filter the search results by date range (For Charts & Summaries)
  const rangeFilteredRentals = useMemo(() => {
    const s = startOfDay(new Date(rangeStart));
    const e = endOfDay(new Date(rangeEnd));
    return searchFilteredRentals.filter(r => {
        const d = new Date(r.rentedAt);
        return d >= s && d <= e;
    });
  }, [searchFilteredRentals, rangeStart, rangeEnd]);

  /* -------------------- 3. DERIVED REPORTS -------------------- */

  // Range Summary (Uses Date Filtered Data)
  const rangeSummary = useMemo(() => {
    const totalRentals = rangeFilteredRentals.length;
    const totalCollected = rangeFilteredRentals.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
    const totalDue = rangeFilteredRentals.reduce((sum, r) => sum + (r.dueAmount || 0), 0);
    const itemsRented = rangeFilteredRentals.reduce((sum, r) => sum + ((r.items || []).reduce((si, it) => si + (it.qtyRented || 0), 0)), 0);
    return { totalRentals, totalCollected, totalDue, itemsRented };
  }, [rangeFilteredRentals]);

  // Pending Dues (Uses Search Filtered Data - All Time)
  // We want to see ALL debts for a customer, even if outside the date range
  const pendingDues = useMemo(() => {
    const map: Record<string, { name: string; phone: string; totalDue: number; lastRented?: string; count: number }> = {};
    for (const r of searchFilteredRentals) { // Uses searchFiltered, NOT rangeFiltered
      const due = Number(r.dueAmount || 0);
      if (due <= 0) continue;
      const key = (r.customerPhone || r.customerName || r._id) as string;
      if (!map[key]) map[key] = { name: r.customerName || "—", phone: r.customerPhone || "—", totalDue: 0, lastRented: r.rentedAt, count: 0 };
      map[key].totalDue += due;
      map[key].count += 1;
      if (!map[key].lastRented || new Date(r.rentedAt) > new Date(map[key].lastRented!)) map[key].lastRented = r.rentedAt;
    }
    return Object.entries(map).map(([k, v]) => ({ id: k, ...v }));
  }, [searchFilteredRentals]);

  // Overdue Rentals (Uses Search Filtered Data - All Time)
  const overdueRentals = useMemo(() => {
    const now = new Date();
    return searchFilteredRentals
      .filter((r) => r.expectedReturnDate && new Date(r.expectedReturnDate) < now && r.status !== "returned")
      .map((r) => ({
        ...r,
        daysOverdue: Math.ceil((new Date().getTime() - new Date(r.expectedReturnDate!).getTime()) / (1000 * 60 * 60 * 24)),
      }));
  }, [searchFilteredRentals]);

  // Inventory Movement (Uses Search Filtered Data)
  // Shows what THIS customer (if searched) has taken
  const inventoryMovement = useMemo(() => {
    const map: Record<string, { materialId: string; name: string; rentedOut: number; returned: number; lastMovement?: string }> = {};
    for (const r of searchFilteredRentals) {
      for (const it of r.items || []) {
        const id = it.materialId;
        if (!map[id]) map[id] = { materialId: id, name: it.label || id, rentedOut: 0, returned: 0, lastMovement: r.rentedAt };
        map[id].rentedOut += it.qtyRented || 0;
        map[id].returned += it.qtyReturned || 0;
        if (!map[id].lastMovement || new Date(r.rentedAt) > new Date(map[id].lastMovement!)) map[id].lastMovement = r.rentedAt;
      }
    }
    return Object.values(map).map((v) => ({ ...v, netOut: v.rentedOut - v.returned })).sort((a, b) => b.netOut - a.netOut);
  }, [searchFilteredRentals]);

  // Low Stock (Real-time from Materials API)
  const lowStock = useMemo(() => {
    const list: { materialId: string; name: string; available?: number }[] = [];
    for (const m of materials) {
      if(m.variants && m.variants.length > 0) {
         m.variants.forEach(v => {
             if((v.availableQuantity ?? 0) <= lowStockThreshold) {
                 list.push({ materialId: v._id, name: `${m.name} (${v.label})`, available: v.availableQuantity });
             }
         });
      } else {
         const avail = m.availableQuantity ?? 0;
         if (avail <= lowStockThreshold) {
            list.push({ materialId: m._id, name: m.name, available: avail });
         }
      }
    }
    return list;
  }, [materials, lowStockThreshold]);

  /* -------------------- 4. CHARTS (Uses Range Filtered Data) -------------------- */
  const dailyRentalsByDate = useMemo(() => {
    // Create a map for the date range
    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);
    const daysMap: Record<string, { rentals: number; itemsOut: number }> = {};
    
    // Generate labels for chart
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        daysMap[format(d, "yyyy-MM-dd")] = { rentals: 0, itemsOut: 0 };
    }

    for (const r of rangeFilteredRentals) {
      const key = format(new Date(r.rentedAt), "yyyy-MM-dd");
      if (daysMap[key]) {
        daysMap[key].rentals += 1;
        daysMap[key].itemsOut += (r.items || []).reduce((s, it) => s + (it.qtyRented || 0), 0);
      }
    }
    
    return Object.entries(daysMap).map(([date, val]) => ({
        date: format(new Date(date), "dd MMM"),
        ...val
    }));
  }, [rangeFilteredRentals, rangeStart, rangeEnd]);

  const statusPie = useMemo(() => {
    const agg: Record<string, number> = { active: 0, partial_returned: 0, returned: 0 };
    for (const r of rangeFilteredRentals) agg[r.status] = (agg[r.status] || 0) + 1;
    return [
      { name: "Active", value: agg.active },
      { name: "Partial", value: agg.partial_returned },
      { name: "Returned", value: agg.returned },
    ];
  }, [rangeFilteredRentals]);

  /* -------------------- UTILS: PRESET DATES -------------------- */
  const setDatePreset = (preset: 'thisMonth' | 'lastMonth' | 'last3Months' | 'allTime') => {
      const now = new Date();
      switch(preset) {
          case 'thisMonth':
              setRangeStart(format(startOfMonth(now), "yyyy-MM-dd"));
              setRangeEnd(format(endOfMonth(now), "yyyy-MM-dd"));
              break;
          case 'lastMonth':
              const lastMonth = subMonths(now, 1);
              setRangeStart(format(startOfMonth(lastMonth), "yyyy-MM-dd"));
              setRangeEnd(format(endOfMonth(lastMonth), "yyyy-MM-dd"));
              break;
          case 'last3Months':
              setRangeStart(format(subMonths(now, 3), "yyyy-MM-dd"));
              setRangeEnd(format(now, "yyyy-MM-dd"));
              break;
          case 'allTime':
              setRangeStart("2020-01-01");
              setRangeEnd(format(endOfMonth(now), "yyyy-MM-dd"));
              break;
      }
  };

  /* -------------------- ACTIONS -------------------- */
  async function notifyCustomer(phone: string, message?: string) {
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message: message || "Reminder: please return your rented items." }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Notify failed");
      toast.success("Notification queued");
    } catch (err: any) {
      toast.error(err.message || "Notify error");
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <Toaster position="top-right" />
      
      {/* Header & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Admin Reports</h1>
          <p className="text-slate-500 mt-1">Financials, inventory insights, and operational alerts.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
            <input 
                placeholder="Search customer name or phone..." 
                value={filterPhoneOrName} 
                onChange={(e) => setFilterPhoneOrName(e.target.value)} 
                className="pl-9 pr-4 py-2.5 w-full rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm shadow-sm transition-all" 
            />
          </div>

          <button onClick={loadAll} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm transition" title="Refresh Data">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          <div className="flex gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition">
                <Printer size={16} /> <span className="hidden sm:inline">Print</span>
            </button>
            <button onClick={() => downloadJSON(`reports_${format(new Date(), "yyyyMMdd")}.json`, { rentals, materials })} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition shadow-sm shadow-emerald-200">
                <DownloadCloud size={16} /> <span className="hidden sm:inline">Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Selector - Full Width */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
         <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Calendar size={20} />
             </div>
             <div>
                 <label className="text-xs font-bold text-slate-500 uppercase block mb-0.5">Report Period</label>
                 <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="bg-transparent outline-none hover:text-emerald-600 cursor-pointer" />
                    <span className="text-slate-400">→</span>
                    <input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className="bg-transparent outline-none hover:text-emerald-600 cursor-pointer" />
                 </div>
             </div>
         </div>

         {/* Date Presets */}
         <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
             <button onClick={() => setDatePreset('thisMonth')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition whitespace-nowrap">This Month</button>
             <button onClick={() => setDatePreset('lastMonth')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition whitespace-nowrap">Last Month</button>
             <button onClick={() => setDatePreset('last3Months')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition whitespace-nowrap">Last 3 Months</button>
             <button onClick={() => setDatePreset('allTime')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition whitespace-nowrap">All Time</button>
         </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Period Summary */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 shadow-sm">
          <div className="text-xs font-bold text-emerald-600 uppercase mb-3">Period Summary</div>
          <div className="space-y-2">
             <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Rentals</span>
                <span className="font-bold text-slate-800">{rangeSummary.totalRentals}</span>
             </div>
             <div className="flex justify-between text-sm items-center pt-2 border-t border-emerald-100">
                <span className="text-slate-500">Items Rented</span>
                <span className="font-bold text-emerald-700">{rangeSummary.itemsRented}</span>
             </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">Total Revenue</div>
          <div className="text-2xl font-extrabold text-slate-900">
            {toCurrency(rangeSummary.totalCollected)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
             <Filter size={12} /> Based on selected date range
          </div>
        </div>

        {/* Overdue Card */}
        <div className="p-5 rounded-2xl bg-white border border-red-100 shadow-sm">
          <div className="text-xs font-bold text-red-500 uppercase mb-1">Overdue & Outstanding</div>
          <div className="text-2xl font-extrabold text-slate-900">
            {toCurrency(rangeSummary.totalDue)}
          </div>
          <div className="mt-2 text-sm text-slate-600 flex items-center gap-2">
             <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">{overdueRentals.length} Late Rentals</span>
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="p-5 rounded-2xl bg-white border border-amber-100 shadow-sm">
          <div className="flex justify-between items-start">
             <div className="text-xs font-bold text-amber-600 uppercase mb-1">Inventory Alerts</div>
             <AlertTriangle size={16} className="text-amber-500" />
          </div>
          
          <div className="flex justify-between items-end mt-2">
             <div>
                <div className="text-2xl font-extrabold text-slate-900">{lowStock.length}</div>
                <div className="text-xs text-slate-500">Low Stock Items</div>
             </div>
             <div className="text-right">
                <div className="text-lg font-bold text-slate-800">{inventoryMovement.filter(i => i.netOut > 0).length}</div>
                <div className="text-xs text-slate-500">Active Out</div>
             </div>
          </div>
          
          <div className="mt-3 flex items-center gap-2 bg-amber-50/50 p-1 rounded">
            <span className="text-[10px] text-slate-400 pl-1">Threshold:</span>
            <input 
                type="range" 
                min={1} 
                max={50} 
                value={lowStockThreshold} 
                onChange={(e) => setLowStockThreshold(Number(e.target.value))} 
                className="h-1.5 w-full bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="text-[10px] font-bold text-slate-600 w-4">{lowStockThreshold}</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
                <h3 className="font-bold text-slate-800">Rental Trends</h3>
                <p className="text-xs text-slate-500">Performance over selected period</p>
            </div>
          </div>
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={dailyRentalsByDate}>
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="rentals" name="Rentals" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="itemsOut" name="Items Out" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800">Status Breakdown</h3>
            <p className="text-xs text-slate-500">Distribution in selected period</p>
          </div>
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  <Cell fill="#10B981" /> {/* Active */}
                  <Cell fill="#F59E0B" /> {/* Partial */}
                  <Cell fill="#64748B" /> {/* Returned */}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Pending Dues Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="font-bold text-slate-800 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500"/> Outstanding Dues</div>
            <button onClick={() => downloadCSV("pending.csv", [])} className="text-xs font-bold text-emerald-600 hover:underline">Download CSV</button>
          </div>

          {pendingDues.length === 0 ? (
            <div className="text-center text-slate-400 p-8 text-sm">No pending dues found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold text-left"><tr>
                    <th className="py-3 px-6">Customer</th>
                    <th className="py-3 px-6 text-right">Due Amount</th>
                    <th className="py-3 px-6 text-center">Action</th>
                  </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingDues.slice(0, 10).map((p) => {
                    const hasPhone = p.phone && p.phone !== "—" && p.phone.trim().length > 0;
                    return (
                      <tr key={p.id} className="hover:bg-red-50/30 transition-colors">
                        <td className="py-3 px-6 font-medium text-slate-800">
                          {p.name}
                          <div className="text-[10px] text-slate-400 font-normal">{p.phone || "No Phone"} • Last: {p.lastRented ? format(new Date(p.lastRented), "dd MMM") : "-"}</div>
                        </td>
                        <td className="py-3 px-6 text-right font-bold text-red-600">{toCurrency(p.totalDue)}</td>
                        <td className="py-3 px-6 text-center">
                          <button 
                              onClick={() => hasPhone && notifyCustomer(p.phone, `Hi ${p.name}, you have an outstanding due of ${toCurrency(p.totalDue)}.`)} 
                              disabled={!hasPhone}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                                  hasPhone 
                                  ? "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer" 
                                  : "bg-slate-50 text-slate-400 cursor-not-allowed opacity-60"
                              }`}
                          >
                              <MessageSquare size={12} /> {hasPhone ? "Remind" : "No #"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inventory Movement */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Top Inventory Movement (Filtered)</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="bg-gradient-to-br from-emerald-700 to-teal-500 text-white"><tr>
                    <th className="py-3 px-6 text-left font-semibold">Material Name</th>
                    <th className="py-3 px-6 text-right font-semibold">Out</th>
                    <th className="py-3 px-6 text-right font-semibold">Returned</th>
                    <th className="py-3 px-6 text-right font-semibold">Still Out</th>
                </tr></thead>
                <tbody className="divide-y divide-emerald-50">
                    {inventoryMovement.slice(0, 8).map((m, i) => (
                        <tr key={i} className="hover:bg-emerald-50 transition">
                            <td className="py-3 px-6 font-medium text-slate-800">{m.name}</td>
                            <td className="py-3 px-6 text-right text-slate-600">{m.rentedOut}</td>
                            <td className="py-3 px-6 text-right text-emerald-600">{m.returned}</td>
                            <td className={`py-3 px-6 text-right font-bold ${m.netOut > 0 ? "text-amber-600" : "text-slate-400"}`}>{m.netOut}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {inventoryMovement.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No movement found for this filter</div>}
         </div>
        </div>
      </div>

    </div>
  );
}