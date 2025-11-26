// src/app/admin/reports/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
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
import { Search, DownloadCloud, Printer, MessageSquare, AlertTriangle, Calendar, FileText } from "lucide-react";

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
  const [q, setQ] = useState("");
  const [rangeStart, setRangeStart] = useState<string>(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [rangeEnd, setRangeEnd] = useState<string>(() => format(endOfMonth(new Date()), "yyyy-MM-dd"));

  // UI state
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
      toast.success("Data loaded");
    } catch (err: any) {
      toast.error(err.message || "Load error");
    } finally {
      setLoading(false);
    }
  }

  /* -------------------- Derived Reports -------------------- */

  const payments = useMemo(() => {
    return rentals.flatMap((r) =>
      r.paidAmount > 0
        ? [
            {
              date: r.rentedAt,
              customer: r.customerName || "—",
              phone: r.customerPhone || "—",
              rentalId: r._id,
              amount: r.paidAmount,
            },
          ]
        : []
    );
  }, [rentals]);

  const pendingDues = useMemo(() => {
    const map: Record<string, { name: string; phone: string; totalDue: number; lastRented?: string; count: number }> = {};
    for (const r of rentals) {
      const due = Number(r.dueAmount || 0);
      if (due <= 0) continue;
      const key = (r.customerPhone || r.customerName || r._id) as string;
      if (!map[key]) map[key] = { name: r.customerName || "—", phone: r.customerPhone || "—", totalDue: 0, lastRented: r.rentedAt, count: 0 };
      map[key].totalDue += due;
      map[key].count += 1;
      if (!map[key].lastRented || new Date(r.rentedAt) > new Date(map[key].lastRented!)) map[key].lastRented = r.rentedAt;
    }
    return Object.entries(map).map(([k, v]) => ({ id: k, ...v }));
  }, [rentals]);

  const overdueRentals = useMemo(() => {
    const now = new Date();
    return rentals
      .filter((r) => r.expectedReturnDate && new Date(r.expectedReturnDate) < now && r.status !== "returned")
      .map((r) => ({
        ...r,
        daysOverdue: Math.ceil((new Date().getTime() - new Date(r.expectedReturnDate!).getTime()) / (1000 * 60 * 60 * 24)),
      }));
  }, [rentals]);

  const inventoryMovement = useMemo(() => {
    const map: Record<string, { materialId: string; name: string; rentedOut: number; returned: number; lastMovement?: string }> = {};
    for (const r of rentals) {
      for (const it of r.items || []) {
        const id = it.materialId;
        if (!map[id]) map[id] = { materialId: id, name: it.label || id, rentedOut: 0, returned: 0, lastMovement: r.rentedAt };
        map[id].rentedOut += it.qtyRented || 0;
        map[id].returned += it.qtyReturned || 0;
        if (!map[id].lastMovement || new Date(r.rentedAt) > new Date(map[id].lastMovement!)) map[id].lastMovement = r.rentedAt;
      }
    }
    return Object.values(map).map((v) => ({ ...v, netOut: v.rentedOut - v.returned }));
  }, [rentals]);

  const lowStock = useMemo(() => {
    const list: { materialId: string; name: string; available?: number }[] = [];
    for (const m of materials) {
      const avail = m.availableQuantity ?? m.variants?.reduce((s, v) => s + (v.availableQuantity ?? 0), 0) ?? undefined;
      if (avail != null && avail <= lowStockThreshold) {
        list.push({ materialId: m._id, name: m.name, available: avail });
      }
    }
    return list;
  }, [materials, lowStockThreshold]);

  const neverReturned = useMemo(() => {
    return inventoryMovement.filter((i) => i.netOut > 0);
  }, [inventoryMovement]);

  /* -------------------- Chart Data -------------------- */
  const dailyRentalsByDate = useMemo(() => {
    const days = 14;
    const arr: { date: string; rentals: number; itemsOut: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push({ date: format(d, "dd MMM"), rentals: 0, itemsOut: 0 });
    }
    
    for (const r of rentals) {
      const key = format(new Date(r.rentedAt), "dd MMM");
      const idx = arr.findIndex((a) => a.date === key);
      if (idx >= 0) {
        arr[idx].rentals += 1;
        arr[idx].itemsOut += (r.items || []).reduce((s, it) => s + (it.qtyRented || 0), 0);
      }
    }
    return arr;
  }, [rentals]);

  const statusPie = useMemo(() => {
    const agg: Record<string, number> = { active: 0, partial_returned: 0, returned: 0 };
    for (const r of rentals) agg[r.status] = (agg[r.status] || 0) + 1;
    return [
      { name: "Active", value: agg.active },
      { name: "Partial", value: agg.partial_returned },
      { name: "Returned", value: agg.returned },
    ];
  }, [rentals]);

  /* -------------------- Actions: notify / export -------------------- */
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

  function exportPaymentsCSV() {
    const rows = [["Date", "Customer", "Phone", "Rental ID", "Amount"]];
    for (const p of payments) rows.push([format(new Date(p.date), "yyyy-MM-dd HH:mm"), p.customer, p.phone, p.rentalId, String(p.amount)]);
    downloadCSV(`payments_${format(new Date(), "yyyyMMdd")}.csv`, rows);
  }

  function exportPendingCSV() {
    const rows = [["Customer", "Phone", "Total Due", "Outstanding Rentals", "Last Rented"]];
    for (const p of pendingDues) rows.push([p.name, p.phone, String(p.totalDue), String(p.count), p.lastRented || ""]);
    downloadCSV(`pending_dues_${format(new Date(), "yyyyMMdd")}.csv`, rows);
  }

  /* -------------------- Date range summary -------------------- */
  function filterRange(start: string, end: string) {
    const s = startOfDay(new Date(start));
    const e = endOfDay(new Date(end));
    const subset = rentals.filter((r) => {
      const dt = new Date(r.rentedAt);
      return dt >= s && dt <= e;
    });
    const totalRentals = subset.length;
    const totalCollected = subset.reduce((s2, x) => s2 + (x.paidAmount || 0), 0);
    const totalDue = subset.reduce((s2, x) => s2 + (x.dueAmount || 0), 0);
    const itemsRented = subset.reduce((s2, x) => s2 + ((x.items || []).reduce((s3, it) => s3 + (it.qtyRented || 0), 0)), 0);
    return { totalRentals, totalCollected, totalDue, itemsRented, subset };
  }

  const rangeSummary = useMemo(() => filterRange(rangeStart, rangeEnd), [rangeStart, rangeEnd, rentals]);

  /* -------------------- Render -------------------- */
  return (
    <div className="space-y-6 pb-10">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Admin Reports</h1>
          <p className="text-slate-500 mt-1">Financials, inventory insights, and operational alerts.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
                placeholder="Filter customer..." 
                value={filterPhoneOrName} 
                onChange={(e) => setFilterPhoneOrName(e.target.value)} 
                className="pl-9 pr-4 py-2 w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" 
            />
          </div>

          <div className="flex gap-2">
            <button
                onClick={() => { window.print(); }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
            >
                <Printer size={16} /> <span className="hidden sm:inline">Print</span>
            </button>
            <button
                onClick={() => { downloadJSON(`reports_${format(new Date(), "yyyyMMdd")}.json`, { rentals, materials, generatedAt: new Date() }); }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition shadow-sm"
            >
                <DownloadCloud size={16} /> <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Date Range Card */}
        <div className="p-5 rounded-2xl bg-white border border-emerald-100 shadow-sm">
          <div className="text-xs font-bold text-emerald-600 uppercase mb-1">Selected Range</div>
          <div className="text-sm font-medium text-slate-800 mb-3">
            {format(new Date(rangeStart), "dd MMM")} — {format(new Date(rangeEnd), "dd MMM")}
          </div>
          <div className="pt-3 border-t border-emerald-50">
             <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500">Rentals</span>
                <span className="font-bold text-slate-800">{rangeSummary.totalRentals}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-slate-500">Revenue</span>
                <span className="font-bold text-emerald-600">{toCurrency(rangeSummary.totalCollected)}</span>
             </div>
          </div>
        </div>

        {/* Today's Activity */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">Today's Activity</div>
          <div className="text-2xl font-extrabold text-slate-900">
            {rentals.filter(r => new Date(r.rentedAt) >= startOfDay(new Date())).length} <span className="text-sm font-normal text-slate-500">Rentals</span>
          </div>
          <div className="mt-2 text-sm text-slate-600">
             collected: <span className="font-bold text-emerald-600">{toCurrency(rentals.reduce((s, r) => s + (new Date(r.rentedAt) >= startOfDay(new Date()) ? r.paidAmount : 0), 0))}</span>
          </div>
        </div>

        {/* Overdue Card */}
        <div className="p-5 rounded-2xl bg-white border border-red-100 shadow-sm">
          <div className="text-xs font-bold text-red-500 uppercase mb-1">Overdue Alerts</div>
          <div className="text-2xl font-extrabold text-slate-900">
            {overdueRentals.length} <span className="text-sm font-normal text-slate-500">Late</span>
          </div>
          <div className="mt-2 text-sm text-slate-600">
             Pending Value: <span className="font-bold text-red-600">{toCurrency(overdueRentals.reduce((s, r) => s + (r.dueAmount || 0), 0))}</span>
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="p-5 rounded-2xl bg-white border border-amber-100 shadow-sm">
          <div className="flex justify-between items-start">
             <div className="text-xs font-bold text-amber-600 uppercase mb-1">Inventory Health</div>
             <AlertTriangle size={16} className="text-amber-500" />
          </div>
          
          <div className="space-y-1 mt-1">
            <div className="flex justify-between text-sm">
                <span className="text-slate-600">Low Stock</span>
                <span className="font-bold text-amber-600">{lowStock.length}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-slate-600">Unreturned</span>
                <span className="font-bold text-slate-800">{neverReturned.length}</span>
            </div>
          </div>
          
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Threshold:</span>
            <input 
                type="range" 
                min={1} 
                max={50} 
                value={lowStockThreshold} 
                onChange={(e) => setLowStockThreshold(Number(e.target.value))} 
                className="h-1.5 w-full bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="text-[10px] font-medium text-slate-600 w-4">{lowStockThreshold}</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
                <h3 className="font-bold text-slate-800">Rental Trends</h3>
                <p className="text-xs text-slate-500">Last 14 days performance</p>
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
            <p className="text-xs text-slate-500">Current rental status distribution</p>
          </div>
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  <Cell fill="#10B981" /> {/* Active - Emerald */}
                  <Cell fill="#F59E0B" /> {/* Partial - Amber */}
                  <Cell fill="#64748B" /> {/* Returned - Slate */}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Date Range Picker (Full Width) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Calendar size={18} className="text-emerald-600"/> 
                <span>Report Range:</span>
            </div>
            <div className="flex items-center gap-2 flex-1">
                <input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="border border-slate-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none flex-1 sm:flex-none" />
                <span className="text-slate-400">to</span>
                <input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className="border border-slate-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none flex-1 sm:flex-none" />
            </div>
            <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => { downloadJSON(`range_summary_${rangeStart}_${rangeEnd}.json`, rangeSummary); }} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-50 uppercase tracking-wide">Export Data</button>
            </div>
        </div>
      </div>

      {/* Tables section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Payments Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="font-bold text-slate-800 flex items-center gap-2"><FileText size={16} className="text-emerald-600"/> Recent Payments</div>
            <button onClick={exportPaymentsCSV} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline">Download CSV</button>
          </div>

          {payments.length === 0 ? (
            <div className="text-center text-slate-400 p-8 text-sm">No payments found in this view</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold text-left">
                  <tr>
                    <th className="py-3 px-6">Date</th>
                    <th className="py-3 px-6">Customer</th>
                    <th className="py-3 px-6 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.slice(0, 10).map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-3 px-6 text-slate-600">{format(new Date(p.date), "dd MMM")}</td>
                      <td className="py-3 px-6 font-medium text-slate-800">
                        {p.customer}
                        <div className="text-[10px] text-slate-400 font-normal">{p.phone}</div>
                      </td>
                      <td className="py-3 px-6 text-right font-bold text-emerald-600">{toCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {payments.length > 10 && <div className="p-2 text-center text-xs text-slate-400 bg-slate-50">Showing recent 10 of {payments.length}</div>}
            </div>
          )}
        </div>

        {/* Pending Dues Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="font-bold text-slate-800 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500"/> Outstanding Dues</div>
            <button onClick={exportPendingCSV} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline">Download CSV</button>
          </div>

          {pendingDues.length === 0 ? (
            <div className="text-center text-slate-400 p-8 text-sm">No pending dues</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold text-left"><tr>
                    <th className="py-3 px-6">Customer</th>
                    <th className="py-3 px-6 text-right">Due Amount</th>
                    <th className="py-3 px-6 text-center">Action</th>
                  </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingDues.slice(0, 10).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-6 font-medium text-slate-800">
                        {p.name}
                        <div className="text-[10px] text-slate-400 font-normal">{p.phone} • Last: {p.lastRented ? format(new Date(p.lastRented), "dd MMM") : "-"}</div>
                      </td>
                      <td className="py-3 px-6 text-right font-bold text-red-600">{toCurrency(p.totalDue)}</td>
                      <td className="py-3 px-6 text-center">
                        <button 
                            onClick={() => notifyCustomer(p.phone, `Hi ${p.name}, you have an outstanding due of ${toCurrency(p.totalDue)}.`)} 
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium hover:bg-emerald-50 hover:text-emerald-700 transition"
                        >
                            <MessageSquare size={12} /> Remind
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Inventory Movement (Bottom Full Width) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Top Inventory Movement</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="bg-gradient-to-br from-emerald-700 to-teal-500 text-white"><tr>
                    <th className="py-3 px-6 text-left font-semibold">Material Name</th>
                    <th className="py-3 px-6 text-right font-semibold">Total Rented Out</th>
                    <th className="py-3 px-6 text-right font-semibold">Returned</th>
                    <th className="py-3 px-6 text-right font-semibold">Net Still Out</th>
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
         </div>
      </div>

    </div>
  );

  /* -------------------- helper open rental detail -------------------- */
  function openRentalDetail(id: string) {
    const url = `/admin/rentals?q=${encodeURIComponent(id)}`;
    window.open(url, "_blank");
  }
}