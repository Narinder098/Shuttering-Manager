"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  X,
  ArrowRightCircle,
  DollarSign,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

/* -------------------- Types -------------------- */
type Variant = {
  _id: string;
  label: string;
  pricePerDay: number;
  totalQuantity: number;
  availableQuantity: number;
};

type Material = {
  _id: string;
  name: string;
  category?: string;
  variants?: Variant[];
  availableQuantity?: number;
};

type RentalItem = {
  materialId: string;
  variantId?: string | null;
  label?: string;
  pricePerDay: number;
  qtyRented: number;
  qtyReturned: number;
  subtotal?: number;
};

// Type for creating new rentals
type RentalItemDraft = {
  materialId: string | null;
  materialName?: string;
  variantId?: string | null;
  variantLabel?: string;
  pricePerDay: number;
  qtyRented: number;
};

type RentalSummary = {
  _id: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  rentedAt: string;
  expectedReturnDate?: string | null;
  status: "active" | "partial_returned" | "returned";
};

type RentalFull = RentalSummary & {
  items: RentalItem[];
  createdAt?: string;
  updatedAt?: string;
};

/* -------------------- Component -------------------- */
export default function AdminRentalsPro() {
  /* ----- list state ----- */
  const [list, setList] = useState<RentalSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  /* ----- modal & active rental ----- */
  const [modalOpen, setModalOpen] = useState<false | "view" | "create">(false);
  const [activeRental, setActiveRental] = useState<RentalFull | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  /* ----- materials for create (NEW) ----- */
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  /* ----- returns & payment local UI state ----- */
  const [returnQtysStr, setReturnQtysStr] = useState<Record<string, string>>({});
  const [payAmountStr, setPayAmountStr] = useState<string>("");

  /* ----- create rental form state (NEW) ----- */
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState<string | "">("");
  const [paidAmountOnCreate, setPaidAmountOnCreate] = useState<number | "">("");
  const [items, setItems] = useState<RentalItemDraft[]>([
    { materialId: null, pricePerDay: 0, qtyRented: 1 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const qtyInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  /* ----- sorting ----- */
  const [sortBy, setSortBy] = useState<{
    key: "rentedAt" | "totalAmount" | "dueAmount" | "paidAmount" | "customerName" | "status";
    dir: "asc" | "desc";
  }>({ key: "rentedAt", dir: "desc" });

  /* ------------------ TOAST STATE & HELPERS ------------------ */
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  /* ----------------------------------------------------------- */

  /* ---------------- Fetch list ---------------- */
  async function loadList() {
    setLoading(true);
    try {
      const res = await fetch(`/api/rentals?q=${encodeURIComponent(q)}&page=${page}`);
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Failed to load rentals");
      let data: RentalSummary[] = j.data || [];
      
      // apply local sort client-side
      data = data.sort((a: any, b: any) => {
        const k = sortBy.key;
        let va: any = (a as any)[k];
        let vb: any = (b as any)[k];
        if (k === "rentedAt") {
          va = new Date(va).getTime();
          vb = new Date(vb).getTime();
        }
        if (va == null) va = "";
        if (vb == null) vb = "";
        if (va < vb) return sortBy.dir === "asc" ? -1 : 1;
        if (va > vb) return sortBy.dir === "asc" ? 1 : -1;
        return 0;
      });
      setList(data);
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page, sortBy]);

  /* ---------------- FETCH MATERIALS (NEW) ---------------- */
  async function loadMaterials() {
    setMaterialsLoading(true);
    try {
      const res = await fetch(`/api/materials`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to load materials");
      setMaterials(json.data || []);
    } catch (err: any) {
      showToast(err.message || "Error loading materials", "error");
    } finally {
      setMaterialsLoading(false);
    }
  }

  useEffect(() => {
    if (modalOpen === "create") loadMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  /* ---------------- Modal: open rental (view) ---------------- */
  async function openRentalModal(id: string) {
    setModalOpen("view");
    setModalLoading(true);
    setActiveRental(null);
    setReturnQtysStr({});
    setPayAmountStr("");
    try {
      const res = await fetch(`/api/rentals/${id}`);
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Rental not found");
      const r: RentalFull = j.data;
      
      r.totalAmount = Number(r.totalAmount || 0);
      r.paidAmount = Number(r.paidAmount || 0);
      r.dueAmount = Number(r.dueAmount || 0);
      r.items = (r.items || []).map((it: any) => ({
        ...it,
        pricePerDay: Number(it.pricePerDay || 0),
        qtyRented: Number(it.qtyRented || 0),
        qtyReturned: Number(it.qtyReturned || 0),
        subtotal: Number(it.subtotal || 0),
      }));
      setActiveRental(r);
    } catch (err: any) {
      showToast(err.message || "Failed to load rental", "error");
      setModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  }

  /* ---------------- Return helpers ---------------- */
  function itemKey(it: { materialId: string; variantId?: string | null }) {
    return `${it.materialId}::${it.variantId ?? "null"}`;
  }

  function setReturnQtyStr(key: string, val: string) {
    setReturnQtysStr((s) => ({ ...s, [key]: val }));
  }

  async function submitReturn() {
    if (!activeRental) return showToast("No rental loaded", "error");
    
    const returnedItems: any[] = [];
    for (const it of activeRental.items) {
      const k = itemKey(it);
      const s = (returnQtysStr[k] || "").trim();
      if (!s) continue;
      if (!/^\d+$/.test(s)) return showToast("Invalid return quantity", "error");
      const num = Number(s);
      if (num <= 0) continue;
      const remaining = Math.max(0, it.qtyRented - (it.qtyReturned || 0));
      if (num > remaining) return showToast(`Return qty for ${it.label || "item"} exceeds remaining (${remaining})`, "error");
      returnedItems.push({ materialId: it.materialId, variantId: it.variantId ?? null, quantityReturned: num });
    }

    if (returnedItems.length === 0) return showToast("Enter return quantity for at least one item", "error");

    const id = activeRental._id;
    try {
      const res = await fetch(`/api/rentals/${id}/return`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnedItems }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Return failed");
      
      showToast("Return processed successfully!", "success");
      await openRentalModal(id);
      await loadList();
      setReturnQtysStr({});
    } catch (err: any) {
      showToast(err.message || "Return failed", "error");
    }
  }

  async function returnAll() {
    if (!activeRental) return showToast("No rental loaded", "error");
    const returnedItems = activeRental.items
      .map((it) => {
        const remaining = Math.max(0, it.qtyRented - (it.qtyReturned || 0));
        if (remaining <= 0) return null;
        return { materialId: it.materialId, variantId: it.variantId ?? null, quantityReturned: remaining };
      })
      .filter(Boolean);
    if (returnedItems.length === 0) return showToast("Nothing to return", "success");

    const id = activeRental._id;
    try {
      const res = await fetch(`/api/rentals/${id}/return`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnedItems }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Return all failed");
      
      showToast("All items returned successfully", "success");
      await openRentalModal(id);
      await loadList();
    } catch (err: any) {
      showToast(err.message || "Return all failed", "error");
    }
  }

  /* ---------------- Payment helpers ---------------- */
  async function makePayment() {
    if (!activeRental) return showToast("No rental loaded", "error");
    const s = (payAmountStr || "").trim();
    if (!s || !/^\d+(\.\d{1,2})?$/.test(s)) return showToast("Enter valid amount", "error");
    const amount = Number(s);
    if (amount <= 0) return showToast("Enter amount > 0", "error");

    const id = activeRental._id;
    try {
      const res = await fetch(`/api/rentals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addPayment: amount }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Payment failed");
      
      showToast("Payment recorded successfully", "success");
      await openRentalModal(id);
      await loadList();
      setPayAmountStr("");
    } catch (err: any) {
      showToast(err.message || "Payment failed", "error");
    }
  }

  /* ---------------- Sorting handler ---------------- */
  function toggleSort(key: typeof sortBy.key) {
    setSortBy((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  /* ---------------- Qty input component ---------------- */
  function QtyInput({
    initial,
    onSync,
    max,
  }: {
    initial: number;
    onSync: (n: number) => void;
    max: number;
  }) {
    const [local, setLocal] = useState<string>(() => (initial === 0 ? "" : String(initial)));

    useEffect(() => {
      setLocal(initial === 0 ? "" : String(initial));
    }, [initial]);

    return (
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        className="w-20 border p-1 rounded text-center focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
        value={local}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") { setLocal(""); return; }
          if (!/^\d*$/.test(v)) return;
          if (/^0\d+/.test(v)) return;
          const num = Number(v || 0);
          if (max != null && num > max) return;
          setLocal(v);
        }}
        onBlur={() => {
          const v = local.trim();
          if (v === "") { onSync(0); setLocal(""); return; }
          const num = Number(v);
          if (isNaN(num)) { setLocal(initial === 0 ? "" : String(initial)); return; }
          onSync(num);
          setLocal(String(num === 0 ? "" : num));
        }}
        onKeyDown={(e) => {
          if (["Backspace", "ArrowLeft", "ArrowRight", "Delete", "Tab"].includes(e.key)) return;
          if (!/^\d$/.test(e.key)) e.preventDefault();
        }}
      />
    );
  }
  
  /* ---------------- CALCULATE TOTALS ---------------- */
  const totals = useMemo(() => {
    let total = 0;
    for (const it of items)
      total += Number(it.pricePerDay || 0) * Number(it.qtyRented || 0);

    const paid = Number(paidAmountOnCreate || 0);
    return { total, paid, due: Math.max(0, total - paid) };
  }, [items, paidAmountOnCreate]);

  /* ---------------- ROW HELPERS ---------------- */
  function addRow() {
    setItems((s) => [...s, { materialId: null, pricePerDay: 0, qtyRented: 1 }]);
    setTimeout(() => {
      const idx = items.length;
      const el = qtyInputRefs.current[idx];
      if (el) { el.focus(); el.select(); }
    }, 50);
  }

  function removeRow(i: number) {
    setItems((s) => s.filter((_, idx) => idx !== i));
    qtyInputRefs.current.splice(i, 1);
  }

  function updateRow(i: number, patch: Partial<RentalItemDraft>) {
    setItems((s) => s.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function onSelectMaterial(i: number, matId: string) {
    const mat = materials.find((m) => m._id === matId);
    if (!mat)
      return updateRow(i, { materialId: null, variantId: null, pricePerDay: 0, qtyRented: 1 });

    const first = mat.variants?.[0] || null;

    updateRow(i, {
      materialId: mat._id,
      materialName: mat.name,
      variantId: first?._id || null,
      variantLabel: first?.label,
      pricePerDay: first?.pricePerDay || 0,
      qtyRented: 1,
    });

    setTimeout(() => {
      const el = qtyInputRefs.current[i];
      if (el) { el.focus(); el.select(); }
    }, 30);
  }

  function onSelectVariant(i: number, varId: string) {
    const row = items[i];
    const mat = materials.find((m) => m._id === row.materialId);
    const v = mat?.variants?.find((x) => x._id === varId);
    if (!v) return updateRow(i, { variantId: null, variantLabel: undefined });

    updateRow(i, {
      variantId: v._id,
      variantLabel: v.label,
      pricePerDay: v.pricePerDay,
    });

    setTimeout(() => {
      const el = qtyInputRefs.current[i];
      if (el) { el.focus(); el.select(); }
    }, 30);
  }

  /* ---------------- SUBMIT CREATE ---------------- */
  async function submitCreate() {
    if (!customerName.trim()) return showToast("Customer name required", "error");

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.materialId) return showToast(`Row ${i + 1}: Select material`, "error");
      if (!it.qtyRented || Number(it.qtyRented) <= 0)
        return showToast(`Row ${i + 1}: Quantity must be > 0`, "error");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: (customerPhone || "").trim(),
        expectedReturnDate: expectedReturnDate || null,
        paidAmount: Number(paidAmountOnCreate || 0),
        items: items.map((it) => ({
          materialId: it.materialId,
          variantId: it.variantId || undefined,
          pricePerDay: Number(it.pricePerDay || 0),
          qtyRented: Number(it.qtyRented || 1),
        })),
      };

      const res = await fetch(`/api/rentals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Create failed");

      showToast("Rental created successfully!", "success");
      setModalOpen(false);

      // Reset form state
      setCustomerName("");
      setCustomerPhone("");
      setExpectedReturnDate("");
      setPaidAmountOnCreate("");
      setItems([{ materialId: null, pricePerDay: 0, qtyRented: 1 }]);
      qtyInputRefs.current = [];

      loadList();
    } catch (err: any) {
      showToast(err.message || "Create failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ---------------- COMPONENT: Create Qty Input ---------------- */
  function CreateQtyInput({ row, i }: { row: RentalItemDraft; i: number }) {
    const mat = materials.find((m) => m._id === row.materialId);
    const maxQty =
      row.variantId
        ? mat?.variants?.find((v) => v._id === row.variantId)
            ?.availableQuantity ?? 9999
        : mat?.availableQuantity ?? 9999;

    const [str, setStr] = useState<string>(() =>
      row.qtyRented ? String(row.qtyRented) : "1"
    );

    useEffect(() => {
      setStr(row.qtyRented ? String(row.qtyRented) : "1");
    }, [row.qtyRented]);

    const inputRef = useRef<HTMLInputElement | null>(null);
    useEffect(() => {
      qtyInputRefs.current[i] = inputRef.current;
      return () => {};
    }, [i]);

    function commit(valueStr: string) {
      const cleaned = valueStr.replace(/^0+/, "") || "0";
      if (!/^\d+$/.test(cleaned)) {
        setStr(String(row.qtyRented || 1));
        return;
      }
      let num = Number(cleaned);
      if (isNaN(num) || num <= 0) num = 1;
      if (num > maxQty) {
        num = maxQty;
      }
      setStr(String(num));
      updateRow(i, { qtyRented: num });
    }

    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className="w-full border p-2 rounded text-center focus:ring-2 focus:ring-emerald-500 outline-none"
        value={str}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") { setStr(""); return; }
          if (!/^\d+$/.test(v)) return;
          if (/^0\d+/.test(v)) { setStr(v.replace(/^0+/, "")); return; }
          const num = Number(v);
          if (!isNaN(num) && num > maxQty) { setStr(String(maxQty)); return; }
          setStr(v);
        }}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit(str);
            (e.target as HTMLInputElement).blur();
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const n = Math.min(maxQty, (Number(str || row.qtyRented || 1) || 1) + 1);
            setStr(String(n));
            updateRow(i, { qtyRented: n });
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            const n = Math.max(1, (Number(str || row.qtyRented || 1) || 1) - 1);
            setStr(String(n));
            updateRow(i, { qtyRented: n });
          }
        }}
      />
    );
  }

  /* ---------------- COMPONENT: Row Input ---------------- */
  function RowInput({ i }: { i: number }) {
    const row = items[i];

    return (
      <div className="grid grid-cols-12 gap-3 items-end">
        <div className="col-span-12 md:col-span-4">
          <label className="text-sm text-gray-600">Material</label>
          <select
            value={row.materialId || ""}
            onChange={(e) => onSelectMaterial(i, e.target.value)}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="">— Select —</option>
            {materials.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-6 md:col-span-3">
          <label className="text-sm text-gray-600">Variant</label>
          <select
            value={row.variantId || ""}
            onChange={(e) => onSelectVariant(i, e.target.value)}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
            disabled={!row.materialId}
          >
            <option value="">None</option>
            {materials
              .find((m) => m._id === row.materialId)
              ?.variants?.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.label} • ₹{v.pricePerDay} • Avl {v.availableQuantity}
                </option>
              ))}
          </select>
        </div>

        <div className="col-span-6 md:col-span-2">
          <label className="text-sm text-gray-600">Price/day</label>
          <input
            type="number"
            min={0}
            value={row.pricePerDay}
            onChange={(e) =>
              updateRow(i, { pricePerDay: Math.max(0, Number(e.target.value || 0)) })
            }
            className="w-full border p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="col-span-6 md:col-span-2">
          <label className="text-sm text-gray-600">Qty</label>
          <CreateQtyInput row={row} i={i} />
        </div>

        <div className="col-span-6 md:col-span-1 flex items-center justify-end">
          <button
            onClick={() => removeRow(i)}
            className="px-3 py-2 rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            title="Remove row"
            disabled={items.length <= 1}
          >
            <Trash2 size={20}/>
          </button>
        </div>
      </div>
    );
  }

  const totalCount = list.length;

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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Rentals</h1>
          <p className="text-gray-500 mt-1">Create & manage rentals — view, return, and collect payments.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalOpen("create")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-500 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus size={18} /> <span className="hidden sm:inline font-medium">New Rental</span>
          </button>

          <button onClick={() => loadList()} className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm" title="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* controls */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or phone…"
            className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
          />
        </div>
        <div className="text-sm text-gray-500 ml-auto hidden sm:block">Showing {totalCount} rentals</div>
      </div>

      {/* table */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-linear-to-br from-emerald-700 to-teal-500 text-white text-sm"><tr>
                <th className="w-[25%] sm:w-[20%] text-left px-6 py-4 font-semibold cursor-pointer hover:bg-white/10 transition" onClick={() => toggleSort("customerName")}>
                  <div className="flex items-center gap-2">
                    Customer
                    {sortBy.key === "customerName" ? (sortBy.dir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : null}
                  </div>
                </th>
                <th className="hidden sm:table-cell w-[15%] text-left px-6 py-4 font-semibold">Phone</th>
                <th className="hidden sm:table-cell w-[10%] text-right px-6 py-4 font-semibold cursor-pointer hover:bg-white/10 transition" onClick={() => toggleSort("totalAmount")}>
                  Total
                </th>
                <th className="hidden sm:table-cell w-[10%] text-right px-6 py-4 font-semibold cursor-pointer hover:bg-white/10 transition" onClick={() => toggleSort("paidAmount")}>
                  Paid
                </th>
                <th className="hidden sm:table-cell w-[10%] text-right px-6 py-4 font-semibold cursor-pointer hover:bg-white/10 transition" onClick={() => toggleSort("dueAmount")}>
                  Due
                </th>
                <th className="w-[25%] sm:w-[15%] text-left px-6 py-4 font-semibold cursor-pointer hover:bg-white/10 transition" onClick={() => toggleSort("rentedAt")}>
                  <div className="flex items-center gap-2">
                    Rented
                    {sortBy.key === "rentedAt" ? (sortBy.dir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : null}
                  </div>
                </th>
                <th className="w-[25%] sm:w-[15%] text-left px-6 py-4 font-semibold cursor-pointer hover:bg-white/10 transition" onClick={() => toggleSort("status")}>
                  Status
                </th>
                <th className="w-[25%] sm:w-[15%] text-center px-6 py-4 font-semibold">Actions</th>
              </tr></thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Loading rentals...</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">No rentals found</td></tr>
              ) : (
                list.map((r) => {
                  const overdue = r.expectedReturnDate && new Date(r.expectedReturnDate) < new Date() && r.status !== "returned";
                  return (
                    <tr key={r._id} className={`hover:bg-emerald-50 transition duration-150 ${overdue ? "bg-red-50/40" : ""}`}>
                      {/* Customer */}
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        <div className="flex flex-col">
                            <span>{r.customerName || "—"}</span>
                            <span className="sm:hidden text-xs text-gray-500 font-normal mt-0.5">{r.customerPhone}</span>
                        </div>
                      </td>
                      
                      {/* Phone - Hidden on mobile */}
                      <td className="hidden sm:table-cell px-6 py-4 text-sm text-slate-600">{r.customerPhone || "—"}</td>
                      
                      {/* Financials - Hidden on mobile */}
                      <td className="hidden sm:table-cell px-6 py-4 text-right text-sm text-slate-600">₹{Number(r.totalAmount || 0).toLocaleString()}</td>
                      <td className="hidden sm:table-cell px-6 py-4 text-right text-sm text-emerald-600 font-medium">₹{Number(r.paidAmount || 0).toLocaleString()}</td>
                      <td className="hidden sm:table-cell px-6 py-4 text-right text-sm text-red-600 font-medium">₹{Number(r.dueAmount || 0).toLocaleString()}</td>
                      
                      {/* Rented Date */}
                      <td className="px-6 py-4 text-sm text-slate-600">{format(new Date(r.rentedAt), "dd MMM yyyy")}</td>
                      
                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            r.status === "returned"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : r.status === "partial_returned"
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : "bg-blue-100 text-blue-700 border-blue-200"
                          }`}>
                          {r.status === "active" ? "Active" : r.status === "partial_returned" ? "Partial" : "Returned"}
                        </span>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <button 
                            onClick={() => openRentalModal(r._id)} 
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors"
                        >
                            View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* pagination */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <button 
            onClick={() => setPage((p) => Math.max(1, p - 1))} 
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            disabled={page === 1}
        >
            Previous
        </button>
        <span className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg">
            Page {page}
        </span>
        <button 
            onClick={() => setPage((p) => p + 1)} 
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
            Next
        </button>
      </div>

      {/* ---------------- Modal: View Rental ---------------- */}
      {modalOpen === "view" && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-10 px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setModalOpen(false); setActiveRental(null); setReturnQtysStr({}); }}
          />
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Rental Details</h2>
                <div className="text-xs text-slate-500 mt-0.5">{modalLoading ? "Loading..." : activeRental ? `ID: #${activeRental._id.slice(-6).toUpperCase()}` : ""}</div>
              </div>
              <button onClick={() => { setModalOpen(false); setActiveRental(null); setReturnQtysStr({}); }} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
              {!activeRental ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                    <RefreshCw className="animate-spin mb-2" />
                    Loading details...
                </div>
              ) : (
                <>
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">Customer</div>
                      <div className="font-bold text-slate-800 text-lg">{activeRental.customerName || "—"}</div>
                      <div className="text-sm text-slate-500">{activeRental.customerPhone || "—"}</div>
                    </div>
                    
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">Dates</div>
                      <div className="text-sm text-slate-700"><span className="font-medium">Rented:</span> {new Date(activeRental.rentedAt).toLocaleDateString()}</div>
                      <div className="text-sm text-slate-700 mt-1"><span className="font-medium">Expected:</span> {activeRental.expectedReturnDate ? new Date(activeRental.expectedReturnDate).toLocaleDateString() : "—"}</div>
                    </div>
                    
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className="text-xs font-bold text-slate-400 uppercase">Status</div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            activeRental.status === 'returned' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                            {activeRental.status}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-500">Paid</span>
                            <span className="font-medium text-emerald-600">₹{Number(activeRental.paidAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Due</span>
                            <span className="font-bold text-red-600">₹{Number(activeRental.dueAmount).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items Section */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-bold text-slate-700">Items & Returns</h3>
                      <div className="flex items-center gap-2">
                        <button onClick={() => {
                          const map: Record<string, string> = {};
                          activeRental.items.forEach(it => {
                            const rem = Math.max(0, it.qtyRented - (it.qtyReturned || 0));
                            if (rem > 0) map[itemKey(it)] = String(rem);
                          });
                          setReturnQtysStr(map);
                        }} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium hover:bg-white transition">Select Remaining</button>

                        <button onClick={() => setReturnQtysStr({})} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium hover:bg-white transition">Clear</button>

                        <button onClick={returnAll} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 shadow-sm transition">Return All</button>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {activeRental.items.map((it) => {
                        const key = itemKey(it);
                        const remaining = Math.max(0, it.qtyRented - (it.qtyReturned || 0));
                        return (
                          <div key={key} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                            <div className="flex-1 pr-4">
                              <div className="font-semibold text-slate-800">{it.label || "Unknown Item"}</div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                Rate: ₹{it.pricePerDay} • Rented: <span className="font-medium text-slate-700">{it.qtyRented}</span> • Returned: <span className="font-medium text-emerald-600">{it.qtyReturned}</span>
                              </div>
                              <div className="text-xs font-medium text-blue-600 mt-1">
                                Remaining to Return: {remaining}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="text-xs text-slate-400 font-medium mr-1">Return:</label>
                              <QtyInput
                                initial={Number(returnQtysStr[key] ? Number(returnQtysStr[key]) : 0)}
                                max={remaining}
                                onSync={(n) => setReturnQtyStr(key, n === 0 ? "" : String(n))}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                      <button onClick={submitReturn} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium shadow hover:bg-blue-700 transition flex items-center gap-2">
                        <ArrowRightCircle size={16} /> Process Return
                      </button>
                    </div>
                  </div>

                  {/* Payments Section */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><DollarSign size={18} className="text-emerald-600"/> Record Payment</h3>

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Amount to Pay</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                            <input 
                                value={payAmountStr} 
                                onChange={(e) => payAmountStr.includes('.') && e.target.value.split('.')[1]?.length > 2 ? null : setPayAmountStr(e.target.value)} 
                                placeholder="0.00" 
                                className="w-full pl-7 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-medium text-slate-800" 
                                inputMode="decimal"
                                type="text" 
                            />
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                            Outstanding Balance: <span className="font-bold text-red-600">₹ {Number(activeRental.dueAmount).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button onClick={() => { setPayAmountStr(String(Number(activeRental.dueAmount || 0).toFixed(2))); }} className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50 transition">Full Amount</button>
                        <button onClick={makePayment} className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-medium shadow-md hover:bg-emerald-700 transition">
                            Pay Now
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Modal: Create Rental ---------------- */}
      {modalOpen === "create" && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-10 px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl z-10 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-800">Create New Rental</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Customer Name <span className="text-red-500">*</span></label>
                  <input
                    className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Phone Number</label>
                  <input
                    className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="10-digit mobile"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Expected Return</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Items */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-700">Rental Items</h3>
                  <button onClick={addRow} className="px-3 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1">
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {materialsLoading ? (
                    <div className="text-center text-gray-500 py-4">Loading inventory...</div>
                  ) : (
                    items.map((_, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                        <RowInput i={i} />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Total & Payment */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4 border-t border-slate-100">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">Total Rental Value</div>
                  <div className="text-2xl font-bold text-slate-800">
                    ₹ {totals.total.toFixed(2)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Initial Payment</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                    <input
                        type="number"
                        min={0}
                        max={totals.total}
                        step="0.01"
                        className="w-full pl-7 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={paidAmountOnCreate === "" ? "" : paidAmountOnCreate}
                        onChange={(e) => {
                        const val = e.target.value;
                        setPaidAmountOnCreate(val === "" ? "" : Number(val));
                        }}
                    />
                  </div>
                </div>

                <div className="text-right pb-2">
                  <div className="text-sm text-slate-500">Balance Due</div>
                  <div className="text-xl font-bold text-red-600">
                    ₹ {totals.due.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  disabled={isSubmitting || !customerName.trim() || items.some(it => !it.materialId || it.qtyRented <= 0)}
                  onClick={submitCreate}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold shadow-lg hover:bg-emerald-700 hover:shadow-xl transition disabled:opacity-50 disabled:shadow-none"
                >
                  {isSubmitting ? "Creating..." : "Confirm Rental"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}