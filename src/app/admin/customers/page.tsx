"use client";

import React, { useEffect, useState } from "react";
import { Search, ChevronUp, ChevronDown, User, Phone, AlertCircle, CheckCircle, X, FileText } from "lucide-react";
import Link from "next/link";

type CustomerRow = {
  name: string;
  phone: string;
  totalRentals: number;
  totalAmount: number;
  totalPaid: number;
  totalDue: number;
};

export default function CustomersPage() {
  const [list, setList] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const [sortBy, setSortBy] = useState<{
    key: keyof CustomerRow;
    dir: "asc" | "desc";
  }>({ key: "name", dir: "asc" });

  // ------------------ TOAST STATE ------------------
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  // -------------------------------------------------

  // ---------------- FETCH CUSTOMERS ----------------
  async function loadCustomers() {
    setLoading(true);
    try {
      const res = await fetch("/api/rentals");
      const j = await res.json();
      if (!j.ok) throw new Error("Failed to load data");

      const rentals = j.data || [];
      const map = new Map<string, CustomerRow>();

      rentals.forEach((r: any) => {
        // Normalize name/phone to group correctly
        const name = (r.customerName || "Unknown").trim();
        const phone = (r.customerPhone || "").trim();
        const key = `${name.toLowerCase()}||${phone}`; // composite key

        if (!map.has(key)) {
          map.set(key, {
            name: name,
            phone: phone,
            totalRentals: 0,
            totalAmount: 0,
            totalPaid: 0,
            totalDue: 0,
          });
        }
        const row = map.get(key)!;
        row.totalRentals += 1;
        row.totalAmount += Number(r.totalAmount || 0);
        row.totalPaid += Number(r.paidAmount || 0);
        row.totalDue += Number(r.dueAmount || 0);
      });

      let arr = Array.from(map.values());

      // Filter
      if (q.trim()) {
        const s = q.trim().toLowerCase();
        arr = arr.filter(
          (c) => c.name.toLowerCase().includes(s) || c.phone.includes(s)
        );
      }

      // Sort
      arr.sort((a, b) => {
        const k = sortBy.key;
        const va = a[k];
        const vb = b[k];
        if (va < vb) return sortBy.dir === "asc" ? -1 : 1;
        if (va > vb) return sortBy.dir === "asc" ? 1 : -1;
        return 0;
      });

      setList(arr);
    } catch (err: any) {
      showToast(err.message || "Error loading customers", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sortBy]);

  function toggleSort(key: keyof CustomerRow) {
    setSortBy((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  return (
    <div className="space-y-6 pb-10 relative">
      {/* --- TOAST CONTAINER --- */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-white transform transition-all duration-300 ease-in-out animate-slide-up ${
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

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Overview of customer history and outstanding balances.</p>
        </div>
        
        {/* Stats Card (Mini) */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-3 rounded-xl border border-emerald-100 shadow-sm">
            <span className="text-xs text-emerald-600 uppercase font-bold tracking-wider">Total Customers</span>
            <div className="text-2xl font-extrabold text-emerald-900">{list.length}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or phone..."
            className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
          />
        </div>
        <div className="text-sm text-gray-500 ml-auto hidden sm:block">
            Showing {list.length} results
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Emerald Gradient Header */}
            <thead className="bg-gradient-to-br from-emerald-700 to-teal-600 text-white"><tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-white/10 transition" onClick={() => toggleSort("name")}>
                  <div className="flex items-center gap-2">
                    Customer {sortBy.key === "name" && (sortBy.dir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>

                {/* Hidden on mobile, visible on Tablet+ */}
                <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Contact</th>
                <th className="hidden sm:table-cell px-6 py-4 text-right text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-white/10 transition" onClick={() => toggleSort("totalRentals")}>Rentals</th>
                <th className="hidden lg:table-cell px-6 py-4 text-right text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-white/10 transition" onClick={() => toggleSort("totalAmount")}>Total Billed</th>
                <th className="hidden lg:table-cell px-6 py-4 text-right text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-white/10 transition" onClick={() => toggleSort("totalPaid")}>Paid</th>
                
                {/* Always visible */}
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-white/10 transition" onClick={() => toggleSort("totalDue")}>Due Amount</th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">History</th>
              </tr></thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-500">
                    <div className="flex justify-center items-center gap-2 animate-pulse">Loading customer data...</div>
                </td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-500 italic">No customers found matching "{q}"</td></tr>
              ) : (
                list.map((c, i) => (
                  <tr key={i} className="hover:bg-emerald-50/50 transition duration-150 group">
                    {/* Name & Mobile Layout */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-base group-hover:text-emerald-700 transition-colors">{c.name}</span>
                        {/* Show phone here only on mobile */}
                        <span className="md:hidden text-xs text-gray-500 mt-1 flex items-center gap-1"><Phone size={12}/> {c.phone || "—"}</span>
                      </div>
                    </td>

                    {/* Desktop Phone */}
                    <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">{c.phone || "—"}</td>

                    <td className="hidden sm:table-cell px-6 py-4 text-right text-sm font-medium text-gray-700 bg-gray-50/50">{c.totalRentals}</td>

                    <td className="hidden lg:table-cell px-6 py-4 text-right text-sm text-gray-600">₹{c.totalAmount.toLocaleString()}</td>

                    <td className="hidden lg:table-cell px-6 py-4 text-right text-sm text-emerald-600 font-medium">₹{c.totalPaid.toLocaleString()}</td>

                    {/* Due Amount - Highlighted */}
                    <td className="px-6 py-4 text-right">
                        {c.totalDue > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 shadow-sm">
                                ₹{c.totalDue.toLocaleString()}
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 opacity-80">
                                Settled
                            </span>
                        )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/admin/customers/${encodeURIComponent(c.phone || c.name)}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 text-xs font-medium hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                      >
                        <FileText size={14} /> View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}