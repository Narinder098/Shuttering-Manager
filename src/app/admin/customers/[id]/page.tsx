"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp, Calendar, FileText, AlertCircle, CheckCircle, X, Phone, User } from "lucide-react";
import Link from "next/link";
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
      showToast(err.message || "Error loading data", "error");
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/admin/customers" className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 transition shadow-sm">
          <ArrowLeft size={20} />
        </Link>
        <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                <User className="text-emerald-600" size={28}/>
                {customerName || "Unknown Customer"}
            </h1>
            <p className="text-gray-500 text-sm flex items-center gap-3 mt-1 ml-1">
                {customerPhone && <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-gray-700"><Phone size={12}/> {customerPhone}</span>}
                <span className="text-gray-400">|</span>
                <span className="font-medium text-gray-700">{rentals.length} Rentals Found</span>
            </p>
        </div>
      </div>

      {/* Stats Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full -mr-4 -mt-4"></div>
            <div className="relative z-10">
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Billed</div>
                <div className="text-2xl font-extrabold text-gray-800">₹ {totalAmount.toLocaleString()}</div>
            </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-full -mr-4 -mt-4"></div>
            <div className="relative z-10">
                <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Total Paid</div>
                <div className="text-2xl font-extrabold text-emerald-600">₹ {totalPaid.toLocaleString()}</div>
            </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-bl-full -mr-4 -mt-4"></div>
            <div className="relative z-10">
                <div className="text-xs text-red-600 font-bold uppercase tracking-wider mb-1">Outstanding Due</div>
                <div className="text-2xl font-extrabold text-red-600">₹ {totalDue.toLocaleString()}</div>
            </div>
        </div>
      </div>

      {/* Rental List Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <FileText size={18} className="text-gray-500"/>
                Rental History
            </h2>
        </div>
        
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            {/* Header */}
            <thead className="bg-white text-gray-500"><tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-emerald-600 transition" onClick={() => toggleSort("rentedAt")}>
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

            <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-500">Loading history...</td></tr>
                ) : rentals.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-500 italic">No rentals found for this customer.</td></tr>
                ) : (
                rentals.map((r) => (
                    <tr key={r._id} className="hover:bg-emerald-50/30 transition duration-150">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <Calendar size={14} />
                            </div>
                            {format(new Date(r.rentedAt), "dd MMM yyyy")}
                        </div>
                    </td>

                    <td className="hidden sm:table-cell px-6 py-4 text-right text-sm text-gray-600">₹{r.totalAmount.toFixed(2)}</td>
                    <td className="hidden md:table-cell px-6 py-4 text-right text-sm text-emerald-600 font-medium">₹{r.paidAmount.toFixed(2)}</td>
                    
                    <td className="px-6 py-4 text-right text-sm">
                        {r.dueAmount > 0 ? (
                            <span className="text-red-600 font-bold">₹{r.dueAmount.toFixed(2)}</span>
                        ) : (
                            <span className="text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-1 rounded">Settled</span>
                        )}
                    </td>

                    <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        r.status === "returned"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : r.status === "partial_returned"
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : "bg-blue-100 text-blue-700 border-blue-200"
                        }`}>
                        {r.status === "partial_returned" ? "Partial" : r.status === "active" ? "Active" : "Returned"}
                        </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                        <Link
                        href={`/admin/rentals?id=${r._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm"
                        >
                        Details <ArrowLeft size={12} className="rotate-180"/>
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