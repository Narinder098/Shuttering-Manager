"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp, Calendar, FileText } from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { format } from "date-fns";

type Rental = {
  _id: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  rentedAt: string;
  expectedReturnDate?: string | null;
  status: "active" | "partial_returned" | "returned";
};

export default function CustomerDetailsPage() {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);

  const [loading, setLoading] = useState(false);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [sortBy, setSortBy] = useState<{ key: keyof Rental; dir: "asc" | "desc" }>({
    key: "rentedAt",
    dir: "desc",
  });

  /* ---------------- FETCH rentals for customer ---------------- */
  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/rentals");
      const j = await res.json();
      if (!j.ok) throw new Error("Failed loading rentals");

      let list: Rental[] = j.data || [];

      // filter by phone OR name
      list = list.filter(
        (r: Rental) =>
          r.customerPhone === id || r.customerName.toLowerCase() === id.toLowerCase()
      );

      if (list.length > 0) {
        setCustomerName(list[0].customerName);
        setCustomerPhone(list[0].customerPhone);
      } else {
        setCustomerName(id);
      }

      // sorting
      list = list.sort((a: any, b: any) => {
        const k = sortBy.key;
        let va = a[k];
        let vb = b[k];
        if (k === "rentedAt") {
          va = new Date(va).getTime();
          vb = new Date(vb).getTime();
        }
        if (va < vb) return sortBy.dir === "asc" ? -1 : 1;
        if (va > vb) return sortBy.dir === "asc" ? 1 : -1;
        return 0;
      });

      setRentals(list);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const totalAmount = rentals.reduce((s, r) => s + Number(r.totalAmount || 0), 0);
  const totalPaid = rentals.reduce((s, r) => s + Number(r.paidAmount || 0), 0);
  const totalDue = rentals.reduce((s, r) => s + Number(r.dueAmount || 0), 0);

  function toggleSort(key: keyof Rental) {
    setSortBy((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <Toaster position="top-right"/>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/admin/customers" className="inline-flex items-center justify-center w-10 h-10 rounded-full border bg-white hover:bg-emerald-50 text-emerald-700 transition shadow-sm">
          <ArrowLeft size={20} />
        </Link>
        <div>
            <h1 className="text-3xl font-extrabold text-gray-900">{customerName || "Unknown Customer"}</h1>
            <p className="text-gray-500 text-sm flex items-center gap-2">
                {customerPhone ? <span>{customerPhone}</span> : <span>No phone number</span>}
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span>{rentals.length} Rentals History</span>
            </p>
        </div>
      </div>

      {/* Stats Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
            <div className="text-sm text-gray-500 font-medium mb-1">Total Billed</div>
            <div className="text-2xl font-bold text-gray-800">₹ {totalAmount.toLocaleString()}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
            <div className="text-sm text-gray-500 font-medium mb-1">Total Paid</div>
            <div className="text-2xl font-bold text-emerald-600">₹ {totalPaid.toLocaleString()}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
            <div className="text-sm text-gray-500 font-medium mb-1">Outstanding Due</div>
            <div className="text-2xl font-bold text-red-600">₹ {totalDue.toLocaleString()}</div>
        </div>
      </div>

      {/* Rental List Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/50">
            <h2 className="font-semibold text-emerald-800">Rental History</h2>
        </div>
        
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-emerald-100">
            {/* Emerald Header */}
            <thead className="bg-emerald-50 text-emerald-700"><tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer" onClick={() => toggleSort("rentedAt")}>
                    <div className="flex items-center gap-2">
                    Date {sortBy.key === "rentedAt" && (sortBy.dir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </div>
                </th>

                {/* Hide on mobile */}
                <th className="hidden sm:table-cell px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Total</th>
                <th className="hidden md:table-cell px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Paid</th>
                
                {/* Visible */}
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Due</th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Action</th>
                </tr></thead>

            <tbody className="bg-white divide-y divide-emerald-50">
                {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading history...</td></tr>
                ) : rentals.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">No rentals found for this customer.</td></tr>
                ) : (
                rentals.map((r) => (
                    <tr key={r._id} className="hover:bg-emerald-50 transition duration-150">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-emerald-500" />
                            {format(new Date(r.rentedAt), "dd MMM yyyy")}
                        </div>
                    </td>

                    <td className="hidden sm:table-cell px-6 py-4 text-right text-sm text-gray-600">₹{r.totalAmount.toFixed(2)}</td>
                    <td className="hidden md:table-cell px-6 py-4 text-right text-sm text-emerald-600">₹{r.paidAmount.toFixed(2)}</td>
                    
                    <td className="px-6 py-4 text-right text-sm font-semibold text-red-600">
                        {r.dueAmount > 0 ? `₹${r.dueAmount.toFixed(2)}` : <span className="text-gray-400">-</span>}
                    </td>

                    <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        r.status === "returned"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : r.status === "partial_returned"
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : "bg-blue-100 text-blue-700 border-blue-200"
                        }`}>
                        {r.status === "partial_returned" ? "Partial" : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                        <Link
                        href={`/admin/rentals?id=${r._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 text-xs font-medium hover:bg-emerald-600 hover:text-white transition-colors"
                        >
                        <FileText size={14} /> Details
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