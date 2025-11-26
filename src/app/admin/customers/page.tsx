"use client";

import React, { useEffect, useState } from "react";
import { Search, ChevronUp, ChevronDown, User, Phone } from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

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

  // ---------------- FETCH CUSTOMERS ----------------
  async function loadCustomers() {
    setLoading(true);
    try {
      const res = await fetch("/api/rentals");
      const j = await res.json();
      if (!j.ok) throw new Error("Failed to load rentals");

      const rentals = j.data || [];
      const map = new Map<string, CustomerRow>();

      rentals.forEach((r: any) => {
        const key = `${r.customerName}||${r.customerPhone}`;
        if (!map.has(key)) {
          map.set(key, {
            name: r.customerName || "Unknown",
            phone: r.customerPhone || "",
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

      if (q.trim()) {
        const s = q.trim().toLowerCase();
        arr = arr.filter(
          (c) => c.name.toLowerCase().includes(s) || c.phone.includes(s)
        );
      }

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
      toast.error(err.message);
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
    <div className="space-y-6 pb-10">
      <Toaster position="top-right" />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Overview of customer history and outstanding balances.</p>
        </div>
        
        {/* Stats Card (Mini) */}
        <div className="bg-white px-4 py-2 rounded-xl border border-emerald-100 shadow-sm bg-emerald-50/50">
            <span className="text-xs text-emerald-600 uppercase font-bold">Total Customers</span>
            <div className="text-xl font-bold text-emerald-900">{list.length}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/5 p-4 rounded-2xl shadow-sm border border-white/50 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or phone..."
            className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-emerald-100">
            {/* Emerald Gradient Header */}
            <thead className="bg-gradient-to-br from-emerald-700 to-teal-500 text-white"><tr>
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
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">View</th>
              </tr></thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading customers...</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">No customers found matching "{q}"</td></tr>
              ) : (
                list.map((c, i) => (
                  <tr key={i} className="hover:bg-emerald-50 transition duration-150 group">
                    {/* Name & Mobile Layout */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 text-base">{c.name}</span>
                        {/* Show phone here only on mobile */}
                        <span className="md:hidden text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Phone size={10}/> {c.phone || "—"}</span>
                      </div>
                    </td>

                    {/* Desktop Phone */}
                    <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">{c.phone || "—"}</td>

                    <td className="hidden sm:table-cell px-6 py-4 text-right text-sm font-medium text-gray-700">{c.totalRentals}</td>

                    <td className="hidden lg:table-cell px-6 py-4 text-right text-sm text-gray-600">₹{c.totalAmount.toLocaleString()}</td>

                    <td className="hidden lg:table-cell px-6 py-4 text-right text-sm text-emerald-600 font-medium">₹{c.totalPaid.toLocaleString()}</td>

                    {/* Due Amount - Highlighted */}
                    <td className="px-6 py-4 text-right">
                        {c.totalDue > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                ₹{c.totalDue.toLocaleString()}
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Paid
                            </span>
                        )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/admin/customers/${encodeURIComponent(c.phone || c.name)}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                      >
                        <User size={16} />
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