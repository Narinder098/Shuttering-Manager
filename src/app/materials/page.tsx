// app/materials/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Package, Tag, Info, Sparkles, ChevronDown, Filter } from "lucide-react";

/* ---------------- TYPES ---------------- */
type Variant = {
  _id: string;
  label: string;
  pricePerDay: number;
  availableQuantity?: number;
  description?: string;
};

type Material = {
  _id: string;
  name: string;
  category?: string;
  description?: string;
  availableQuantity?: number;
  variants?: Variant[];
};

/* ---------------- COMPONENT ---------------- */
export default function MaterialsPage() {
  const [query, setQuery] = useState("");
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState(""); // New filter state
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [openVariant, setOpenVariant] = useState<{ material: Material; variant: Variant } | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/materials");
        const j = await res.json();
        if (!j.ok) throw new Error(j.error || "Failed to load materials");
        if (!mounted) return;
        
        const data: Material[] = (j.data || []).map((m: any) => ({
          _id: m._id,
          name: m.name,
          category: m.category,
          description: m.description,
          availableQuantity: m.availableQuantity,
          variants: (m.variants || []).map((v: any) => ({
            _id: v._id,
            label: v.label,
            pricePerDay: Number(v.pricePerDay || 0),
            availableQuantity: v.availableQuantity ?? 0,
            description: v.description,
          })),
        }));
        setMaterials(data);
      } catch (err: any) {
        setError(err.message || "Network error");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Extract unique material names for the dropdown
  const uniqueMaterialNames = useMemo(() => {
    const names = new Set(materials.map(m => m.name));
    return Array.from(names).sort();
  }, [materials]);

  // Flatten variants into cards and apply filters
  const variantsList = useMemo(() => {
    const arr: { material: Material; variant: Variant }[] = [];
    for (const m of materials) {
      if (m.variants && m.variants.length > 0) {
        for (const v of m.variants) {
          arr.push({ material: m, variant: v });
        }
      } else {
        // if no variants, present the material as single "variant"
        arr.push({
          material: m,
          variant: {
            _id: `${m._id}-base`,
            label: m.name,
            pricePerDay: Number((m as any).pricePerDay || 0),
            availableQuantity: m.availableQuantity ?? 0,
            description: m.description,
          },
        });
      }
    }
    
    let result = arr;

    // 1. Filter by Dropdown (Exact Material Name)
    if (selectedMaterialFilter) {
        result = result.filter(x => x.material.name === selectedMaterialFilter);
    }

    // 2. Filter by Search Query (Text search on top of dropdown)
    if (query.trim()) {
        const q = query.toLowerCase();
        result = result.filter(
          (x) =>
            x.material.name.toLowerCase().includes(q) ||
            x.material.category?.toLowerCase().includes(q) ||
            x.variant.label.toLowerCase().includes(q)
        );
    }

    return result;
  }, [materials, query, selectedMaterialFilter]);

  return (
    <main className="min-h-screen py-10 px-4 bg-slate-50 relative overflow-hidden">
      {/* Decorative background blob */}
      <div className="absolute top-0 left-0 w-full h-96 bg-linear-to-b from-emerald-50/80 to-transparent -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-emerald-950 tracking-tight flex items-center gap-3">
              Materials Catalog <Sparkles className="text-emerald-500 hidden sm:block" size={24} />
            </h1>
            <p className="text-emerald-900/60 mt-2 text-lg font-medium">Browse inventory, check live stock, and view rates.</p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            
            {/* 1. Dropdown Filter */}
            <div className="w-full sm:w-56 relative group">
                <div className="absolute -inset-0.5 bg-linear-to-r from-emerald-400 to-teal-400 rounded-xl opacity-20 group-focus-within:opacity-100 transition duration-500 blur-sm"></div>
                <div className="relative flex items-center bg-white rounded-xl shadow-sm">
                    <Filter size={20} className="absolute left-3 text-emerald-500 pointer-events-none" />
                    <select
                        value={selectedMaterialFilter}
                        onChange={(e) => setSelectedMaterialFilter(e.target.value)}
                        className="w-full pl-10 pr-8 py-3.5 rounded-xl bg-transparent border-none focus:ring-0 text-slate-700 font-medium outline-none appearance-none cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                        <option value="">All Materials</option>
                        {uniqueMaterialNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* 2. Search Bar */}
            <div className="w-full sm:w-72 relative group">
                <div className="absolute -inset-0.5 bg-linear-to-r from-emerald-400 to-teal-400 rounded-xl opacity-30 group-focus-within:opacity-100 transition duration-500 blur-md"></div>
                <div className="relative flex items-center bg-white rounded-xl shadow-sm">
                    <Search size={20} className="absolute left-3 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search variants..."
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-emerald-900/30 outline-none font-medium"
                    />
                    {/* Clear search button */}
                    {query && (
                        <button onClick={() => setQuery("")} className="absolute right-2 p-1 rounded-full hover:bg-slate-100 text-slate-400">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-900/50 px-1">
          {loading ? (
            <span className="animate-pulse flex items-center gap-2"><div className="w-2 h-2 bg-emerald-400 rounded-full"/> Syncing inventory...</span>
          ) : error ? (
            <span className="text-red-500 flex items-center gap-1"><Info size={14}/> {error}</span>
          ) : (
            <span>Showing {variantsList.length} items</span>
          )}
        </div>

        {/* Materials Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {variantsList.length === 0 && !loading && !error && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-emerald-900/30 bg-white/50 rounded-3xl border border-dashed border-emerald-200/50">
                <Package size={48} className="mb-4 opacity-50"/>
                <p className="text-lg font-medium">No materials found</p>
                <p className="text-sm mt-1">Try adjusting your filter or search query</p>
                <button 
                    onClick={() => { setQuery(""); setSelectedMaterialFilter(""); }} 
                    className="mt-4 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-bold hover:bg-emerald-200 transition"
                >
                    Clear Filters
                </button>
            </div>
          )}

          <AnimatePresence>
            {variantsList.map(({ material, variant }, idx) => {
              const inStock = (variant.availableQuantity ?? 0) > 0;
              return (
                <motion.div
                  key={variant._id}
                  layoutId={variant._id}
                  onClick={() => setOpenVariant({ material, variant })}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05, duration: 0.2 }}
                  className="group relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-emerald-100/50 border border-slate-100 hover:border-emerald-200 transition-all duration-300 cursor-pointer flex flex-col justify-between h-full"
                >
                  {/* Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        inStock 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                        : "bg-rose-50 text-rose-700 border border-rose-100"
                    }`}>
                        {inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>

                  {/* Content */}
                  <div>
                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                        {material.category || "Equipment"}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2">
                        {variant.label}
                    </h3>
                    {material.name !== variant.label && (
                        <p className="text-xs text-slate-400 mt-1 group-hover:text-emerald-600/70 transition-colors">{material.name}</p>
                    )}
                  </div>

                  {/* Footer Stats */}
                  <div className="mt-6 pt-4 border-t border-slate-50 flex items-end justify-between group-hover:border-emerald-50 transition-colors">
                    <div>
                        <p className="text-xs text-slate-400 font-medium mb-0.5">Rate per day</p>
                        <p className="text-lg font-extrabold text-slate-700 group-hover:text-emerald-800 transition-colors">₹{Number(variant.pricePerDay || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 font-medium mb-0.5">Available</p>
                        <p className={`text-lg font-bold ${inStock ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {variant.availableQuantity ?? 0}
                        </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Detail Modal */}
        <AnimatePresence>
          {openVariant && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-emerald-950/20 backdrop-blur-sm"
                onClick={() => setOpenVariant(null)}
              />
              
              <motion.div
                layoutId={openVariant.variant._id}
                className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-emerald-900/20 overflow-hidden z-10"
              >
                {/* Modal Header */}
                <div className="relative h-32 bg-linear-to-br from-emerald-600 to-teal-700 p-6 flex flex-col justify-end">
                    <button
                        onClick={() => setOpenVariant(null)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">
                        {openVariant.material.category || "Material Details"}
                    </div>
                    <h2 className="text-2xl font-bold text-white">{openVariant.variant.label}</h2>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Key Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-slate-400 text-xs font-bold uppercase mb-1">Daily Rate</div>
                        <div className="text-2xl font-extrabold text-slate-900">₹ {Number(openVariant.variant.pricePerDay || 0).toLocaleString()}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-slate-400 text-xs font-bold uppercase mb-1">In Stock</div>
                        <div className={`text-2xl font-extrabold ${(openVariant.variant.availableQuantity ?? 0) > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {openVariant.variant.availableQuantity ?? 0} <span className="text-sm font-medium text-slate-400">units</span>
                        </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Tag size={16} className="text-emerald-500"/> Description
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                        {openVariant.variant.description || openVariant.material.description || "No additional description available for this item."}
                    </p>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-2">
                    <button
                        onClick={() => setOpenVariant(null)}
                        className="w-full py-3.5 rounded-xl font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-100"
                    >
                        Close Details
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}