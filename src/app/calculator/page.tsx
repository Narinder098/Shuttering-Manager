"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import CountUp from "react-countup";
import { X, Calculator, Calendar, Package, Plus, Trash2, Share2, ArrowRight, Tag } from "lucide-react";

// Utility – days between 2 dates
function daysBetween(out: string, _in: string) {
  const d1 = new Date(out);
  const d2 = new Date(_in);
  const diff = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
  return isNaN(diff) ? 1 : diff;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

/* ---------------- TYPES ---------------- */
type Variant = {
  _id: string;
  label: string;
  pricePerDay: number;
  availableQuantity?: number;
};

type Material = {
  _id: string;
  name: string;
  category?: string;
  variants?: Variant[];
};

type Row = {
  id: string;
  material: string;
  variant?: string | null;
  qty: number;
  days: number;
  pricePerDay: number;
  subtotal: number;
  from: string;
  to: string;
};

/* ---------------- COMPONENT ---------------- */
export default function CalculatorPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);

  // User Input
  const [materialId, setMaterialId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [qty, setQty] = useState(1);
  const [dateOut, setDateOut] = useState(todayISO());
  const [dateIn, setDateIn] = useState(todayISO());

  // Items List
  const [rows, setRows] = useState<Row[]>([]);

  // Load backend materials
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/materials");
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        setMaterials(json.data || []);
      } catch (err: any) {
        toast.error(err.message || "Failed to load materials");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Current selected objects
  const selectedMaterial = materials.find((m) => m._id === materialId);
  const selectedVariant = selectedMaterial?.variants?.find((v) => v._id === variantId);

  const price = selectedVariant?.pricePerDay ?? 0;
  const days = daysBetween(dateOut, dateIn);
  const previewSubtotal = qty * price * days;

  const addItem = () => {
    if (!materialId || !variantId) {
      toast.error("Please select a material and variant");
      return;
    }

    // Check if item with same material, variant AND dates already exists
    const existingIndex = rows.findIndex(
      (r) => 
        r.material === selectedMaterial?.name && 
        r.variant === selectedVariant?.label && 
        r.from === dateOut && 
        r.to === dateIn
    );

    if (existingIndex >= 0) {
      // Update existing row
      const updatedRows = [...rows];
      const existingRow = updatedRows[existingIndex];
      const newQty = existingRow.qty + qty;
      
      updatedRows[existingIndex] = {
        ...existingRow,
        qty: newQty,
        subtotal: newQty * price * days // Recalculate subtotal
      };
      
      setRows(updatedRows);
      toast.success("Updated existing item quantity!");
    } else {
      // Add new row
      setRows((r) => [
        ...r,
        {
          id: Math.random().toString(),
          material: selectedMaterial?.name || "",
          variant: selectedVariant?.label ?? null,
          qty,
          days,
          pricePerDay: price,
          subtotal: previewSubtotal,
          from: dateOut,
          to: dateIn,
        },
      ]);
      toast.success("Item added to estimate!");
    }
  };

  const total = useMemo(() => rows.reduce((s, r) => s + r.subtotal, 0), [rows]);

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 relative overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-linear-to-b from-emerald-50/80 to-transparent -z-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm mb-4 border border-emerald-100">
            <Calculator className="text-emerald-600 w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Rental <span className="text-emerald-600">Estimator</span>
          </h1>
          <p className="text-slate-500 mt-3 text-lg">
            Build a quote instantly. Add materials, calculate dates, and share the estimate on WhatsApp.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: INPUT FORM (Sticky on Desktop) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-100 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" /> Add Items
              </h2>

              <div className="space-y-5">
                {/* Material Select */}
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5 ml-1">Material</label>
                  <div className="relative">
                    <Package className="absolute left-3.5 top-3.5 text-slate-400 w-5 h-5" />
                    <select
                      value={materialId}
                      onChange={(e) => {
                        setMaterialId(e.target.value);
                        setVariantId(""); 
                      }}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select Material</option>
                      {materials.map((m) => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Variant Select */}
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5 ml-1">Size / Variant</label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-3.5 text-slate-400 w-5 h-5" />
                    <select
                      value={variantId}
                      onChange={(e) => setVariantId(e.target.value)}
                      disabled={!selectedMaterial}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed appearance-none cursor-pointer"
                    >
                      <option value="">Select Variant</option>
                      {selectedMaterial?.variants?.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.label} — ₹{v.pricePerDay}/day
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5 ml-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Dates Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1.5 ml-1">From</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                        <input
                        type="date"
                        value={dateOut}
                        onChange={(e) => setDateOut(e.target.value)}
                        className="w-full pl-9 pr-2 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1.5 ml-1">To</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                        <input
                        type="date"
                        value={dateIn}
                        onChange={(e) => setDateIn(e.target.value)}
                        className="w-full pl-9 pr-2 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 flex justify-between items-center">
                    <div className="text-sm text-emerald-800">
                        <span className="block text-xs text-emerald-600 font-semibold uppercase">Estimated Cost</span>
                        {qty} x ₹{price} x {days} days
                    </div>
                    <div className="text-2xl font-bold text-emerald-700">
                        ₹{previewSubtotal.toLocaleString()}
                    </div>
                </div>

                {/* Add Button */}
                <button
                  onClick={addItem}
                  className="w-full py-3.5 bg-linear-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Add to Estimate <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: ITEMS LIST (Scrollable) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Empty State */}
            {rows.length === 0 && (
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Calculator className="text-slate-300 w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Your estimate is empty</h3>
                <p className="text-slate-400 mt-1 max-w-xs">Add materials from the left to start building your cost estimate.</p>
              </div>
            )}

            {/* Items List */}
            <AnimatePresence>
              {rows.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-lg font-bold text-slate-800">Estimate Details</h2>
                        <span className="text-sm font-medium text-slate-500">{rows.length} items added</span>
                    </div>

                    {rows.map((r) => (
                        <motion.div
                        key={r.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group"
                        >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">{r.material}</h3>
                                <div className="text-sm text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1">
                                    {r.variant || "Standard"}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-extrabold text-slate-900">₹{r.subtotal.toLocaleString()}</div>
                                <div className="text-xs text-slate-400 font-medium">Subtotal</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-500 bg-slate-50 p-3 rounded-xl">
                            <div className="flex-1">
                                <span className="block text-xs font-bold uppercase text-slate-400">Rate</span>
                                <span className="font-medium text-slate-700">₹{r.pricePerDay}/day</span>
                            </div>
                            <div className="w-px h-8 bg-slate-200"></div>
                            <div className="flex-1">
                                <span className="block text-xs font-bold uppercase text-slate-400">Qty</span>
                                <span className="font-medium text-slate-700">{r.qty} units</span>
                            </div>
                            <div className="w-px h-8 bg-slate-200"></div>
                            <div className="flex-1">
                                <span className="block text-xs font-bold uppercase text-slate-400">Duration</span>
                                <span className="font-medium text-slate-700">{r.days} days</span>
                            </div>
                        </div>

                        <div className="mt-3 flex justify-between items-center text-xs text-slate-400 px-1">
                            <span>{r.from} <span className="mx-1">→</span> {r.to}</span>
                        </div>

                        <button
                            onClick={() => setRows(rows.filter((i) => i.id !== r.id))}
                            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove Item"
                        >
                            <Trash2 size={18} />
                        </button>
                        </motion.div>
                    ))}
                </div>
              )}
            </AnimatePresence>

            {/* Grand Total & Actions */}
            {rows.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl shadow-slate-900/20"
                >
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                        <div className="text-center sm:text-left">
                            <p className="text-slate-400 font-medium mb-1">Total Estimated Cost</p>
                            <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-emerald-400">
                                <CountUp end={total} duration={1} separator="," prefix="₹" />
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                const message = rows
                                .map(
                                    (i) =>
                                    `• ${i.material} (${i.variant || "Std"})\n   Qty: ${i.qty} | Days: ${i.days} | Rate: ₹${i.pricePerDay}\n   Sub: ₹${i.subtotal}`
                                )
                                .join("\n\n");

                                const finalMessage = `🧾 *Shuttering Estimate*\n\n${message}\n\n──────────────\n*Grand Total: ₹${total.toLocaleString()}*\n──────────────`;

                                window.open(`https://wa.me/?text=${encodeURIComponent(finalMessage)}`);
                            }}
                            className="w-full sm:w-auto px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                        >
                            <Share2 size={20} /> Share on WhatsApp
                        </button>
                    </div>
                </motion.div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}