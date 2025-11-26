"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, Search, ChevronDown, ChevronUp, X, CheckCircle, AlertCircle } from "lucide-react";

type Variant = {
  _id?: string;
  label: string;
  pricePerDay: number;
  totalQuantity: number;
  availableQuantity: number;
};

type Material = {
  _id: string;
  name: string;
  category?: string;
  description?: string;
  variants: Variant[];
  totalQuantity: number;
  availableQuantity: number;
};

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [refetch, setRefetch] = useState(0);

  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showEditMaterial, setShowEditMaterial] = useState(false);

  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingVariant, setEditingVariant] = useState<{ matId: string; variant: Variant } | null>(null);

  const LOW_RATIO = 0.1;

  // Add variant modal state
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [variantMaterial, setVariantMaterial] = useState<Material | null>(null);
  const [newVariantLabel, setNewVariantLabel] = useState("");
  const [newVariantPrice, setNewVariantPrice] = useState("");
  const [newVariantQty, setNewVariantQty] = useState("");

  // ------------------ TOAST STATE & HELPERS ------------------
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  // -----------------------------------------------------------

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/materials");
        const data = await res.json();
        if (!alive) return;
        if (!data.ok) {
          setError(data.error || "Failed to load");
          setMaterials([]);
        } else {
          setMaterials(data.data || []);
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e.message || "Network error");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [refetch]);

  // derived stats
  const stats = useMemo(() => {
    const totalItems = materials.length;
    const totalStock = materials.reduce((s, m) => s + (Number(m.totalQuantity) || 0), 0);
    const totalAvailable = materials.reduce((s, m) => s + (Number(m.availableQuantity) || 0), 0);
    const lowStockCount = materials.reduce((c, m) => c + ((m.availableQuantity <= Math.max(0, Math.ceil(m.totalQuantity * LOW_RATIO))) ? 1 : 0), 0);
    return { totalItems, totalStock, totalAvailable, lowStockCount };
  }, [materials]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return materials.filter(m => !q || m.name.toLowerCase().includes(q));
  }, [materials, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  useEffect(() => { if (page !== safePage) setPage(safePage); }, [safePage]);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const start = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = filtered.length === 0 ? 0 : Math.min(safePage * pageSize, filtered.length);

  /* ---------- CRUD helpers (material & variant) ---------- */

  async function createMaterial(payload: { name: string; category?: string; description?: string; variants?: any[] }) {
    try {
      const res = await fetch("/api/materials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");
      setRefetch(s => s + 1);
      setShowAddMaterial(false);
      showToast("Material created successfully!", "success");
    } catch (e: any) { 
      showToast(e.message || "Error creating material", "error"); 
    }
  }

  async function updateMaterial(id: string, payload: any) {
    try {
      const res = await fetch(`/api/materials/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");
      setRefetch(s => s + 1);
      setShowEditMaterial(false);
      setEditingMaterial(null);
      showToast("Material updated successfully!", "success");
    } catch (e: any) { 
      showToast(e.message || "Error updating material", "error"); 
    }
  }

  async function deleteMaterial(id: string) {
    if (!confirm("Delete material? This action is irreversible.")) return;
    try {
      const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to delete");
      setRefetch(s => s + 1);
      showToast("Material deleted", "success");
    } catch (e: any) { 
      showToast(e.message || "Error deleting material", "error"); 
    }
  }

  // variants
  async function addVariant(matId: string, variant: { label: string; pricePerDay: number; totalQuantity: number }) {
    try {
      const res = await fetch(`/api/materials/${matId}/variants`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(variant)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to add variant");
      setRefetch(s => s + 1);
      showToast("Variant added successfully!", "success");
    } catch (e: any) { 
      showToast(e.message || "Error adding variant", "error"); 
    }
  }

  async function editVariant(matId: string, variantId: string, payload: any) {
    try {
      const res = await fetch(`/api/materials/${matId}/variants/${variantId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to update variant");
      setRefetch(s => s + 1);
      setEditingVariant(null);
      showToast("Variant updated successfully!", "success");
    } catch (e: any) { 
      showToast(e.message || "Error updating variant", "error"); 
    }
  }

  async function removeVariant(matId: string, variantId: string) {
    if (!confirm("Delete variant?")) return;
    try {
      const res = await fetch(`/api/materials/${matId}/variants/${variantId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to delete variant");
      setRefetch(s => s + 1);
      showToast("Variant deleted", "success");
    } catch (e: any) { 
      showToast(e.message || "Error deleting variant", "error"); 
    }
  }

  async function handleAddVariant() {
    if (!variantMaterial) return;

    if (!newVariantLabel.trim() || newVariantPrice === "" || newVariantQty === "") {
      return showToast("All fields are required", "error");
    }

    await addVariant(variantMaterial._id, {
      label: newVariantLabel.trim(),
      pricePerDay: Number(newVariantPrice),
      totalQuantity: Number(newVariantQty),
    });

    // close modal & clear
    setShowAddVariantModal(false);
    setVariantMaterial(null);
    setNewVariantLabel("");
    setNewVariantPrice("");
    setNewVariantQty("");
  }

  /* ---------- UI helpers ---------- */
  function toggleExpand(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  /* ---------- Add Material modal state ---------- */
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newVariants, setNewVariants] = useState<Array<{ label: string; pricePerDay: string; totalQuantity: string }>>([
    { label: "", pricePerDay: "", totalQuantity: "" },
  ]);

  function addNewVariantRow() {
    setNewVariants(s => [...s, { label: "", pricePerDay: "", totalQuantity: "" }]);
  }
  function updateNewVariant(i: number, field: string, value: string) {
    setNewVariants(s => s.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)));
  }
  function removeNewVariantRow(i: number) {
    setNewVariants(s => s.filter((_, idx) => idx !== i));
  }

  async function submitNewMaterial() {
    if (!newName.trim()) return showToast("Material name is required", "error");
    // validate variants
    for (let i = 0; i < newVariants.length; i++) {
      const v = newVariants[i];
      if (!v.label.trim()) return showToast(`Variant ${i + 1} label is required`, "error");
      if (v.pricePerDay === "" || isNaN(Number(v.pricePerDay)) || Number(v.pricePerDay) < 0) return showToast(`Variant ${i + 1} price must be valid`, "error");
      if (v.totalQuantity === "" || isNaN(Number(v.totalQuantity)) || Number(v.totalQuantity) <= 0) return showToast(`Variant ${i + 1} quantity must be > 0`, "error");
    }

    const payload = {
      name: newName.trim(),
      category: newCategory.trim(),
      description: newDesc.trim(),
      variants: newVariants.map(v => ({ label: v.label.trim(), pricePerDay: Number(v.pricePerDay), totalQuantity: Number(v.totalQuantity) })),
    };

    await createMaterial(payload);
    // reset
    setNewName(""); setNewCategory(""); setNewDesc("");
    setNewVariants([{ label: "", pricePerDay: "", totalQuantity: "" }]);
  }

  /* ---------- Edit variant modal state ---------- */
  const [variantEditLabel, setVariantEditLabel] = useState("");
  const [variantEditPrice, setVariantEditPrice] = useState<number | "">("");
  const [variantEditTotal, setVariantEditTotal] = useState<number | "">("");

  useEffect(() => {
    if (!editingVariant) {
      setVariantEditLabel("");
      setVariantEditPrice("");
      setVariantEditTotal("");
      return;
    }
    const v = editingVariant.variant;
    setVariantEditLabel(v.label);
    setVariantEditPrice(v.pricePerDay);
    setVariantEditTotal(v.totalQuantity);
  }, [editingVariant]);

  return (
    <div className="space-y-6 pb-8 relative">
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

      {/* header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Materials Inventory</h1>
          <p className="text-gray-600 mt-1 max-w-xl">Click a material to expand its variants. Add/edit/delete variants inline.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowAddMaterial(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-linear-to-r from-emerald-600 to-teal-500 text-white shadow-md hover:shadow-lg transition-all">
            <Plus size={16} /> Add Material
          </button>
        </div>
      </div>

      {/* Mixed Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Hero linear card - Takes up full width on mobile/tablet */}
        <div className="lg:col-span-4 bg-linear-to-br from-emerald-600 to-teal-400 text-white rounded-2xl p-6 shadow-lg border border-emerald-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm opacity-90">Inventory Overview</div>
              <div className="mt-2 text-3xl font-extrabold">{stats.totalItems} Items</div>
              <div className="mt-1 text-sm opacity-80">Total & available stock summary</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/20 rounded-xl p-3">
              <div className="text-xs">Total Stock</div>
              <div className="text-lg font-bold">{stats.totalStock}</div>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <div className="text-xs">Available</div>
              <div className="text-lg font-bold">{stats.totalAvailable}</div>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <div className="text-xs">Low stock</div>
              <div className="text-lg font-bold">{stats.lowStockCount}</div>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <div className="text-xs">Tracked types</div>
              <div className="text-lg font-bold">{stats.totalItems}</div>
            </div>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="bg-black/5 p-4 rounded-2xl shadow border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by material name..." className="pl-10 pr-4 py-2 rounded-md border w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">Rows</div>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="border rounded-md p-2">
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* table */}
      <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-linear-to-br from-emerald-700 to-teal-500 text-white"><tr>
              <th className="text-left px-4 py-3 text-sm font-semibold w-[40%] sm:w-[35%]">Name</th>
              <th className="hidden sm:table-cell text-right px-4 py-3 text-sm font-semibold w-[15%]">Total Qty</th>
              <th className="text-right px-4 py-3 text-sm font-semibold w-[15%]">Available</th>
              <th className="text-center px-4 py-3 text-sm font-semibold w-[15%]">Status</th>
              <th className="text-center px-4 py-3 text-sm font-semibold w-[15%]">Actions</th>
            </tr></thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex justify-center items-center gap-2"><div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div> Loading data...</div>
                </td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500 italic">No materials found</td></tr>
              ) : pageItems.map((m) => {
                const lowThreshold = Math.max(0, Math.ceil(m.totalQuantity * LOW_RATIO));
                const status = m.availableQuantity <= 0 
                  ? { label: "Out of Stock", color: "bg-red-100 text-red-700 border border-red-200" } 
                  : m.availableQuantity <= lowThreshold 
                  ? { label: "Low Stock", color: "bg-amber-100 text-amber-700 border border-amber-200" } 
                  : { label: "In Stock", color: "bg-emerald-100 text-emerald-700 border border-emerald-200" };

                return (
                  <React.Fragment key={m._id}>
                    <tr 
                      className={`hover:bg-emerald-50/50 transition duration-150 cursor-pointer ${expanded[m._id] ? 'bg-emerald-50/30' : ''}`}
                      onClick={() => toggleExpand(m._id)}
                    ><td className="px-4 py-3 flex items-center gap-3">
                        <button className="p-1 rounded hover:bg-gray-200 text-gray-500 flex-shrink-0 transition-colors">
                          {expanded[m._id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <div className="truncate">
                          <div className="font-medium text-gray-900">{m.name}</div>
                          <div className="text-xs text-gray-500 truncate">{m.category || "Uncategorized"}</div>
                        </div>
                      </td>

                      <td className="hidden sm:table-cell px-4 py-3 text-right text-gray-600">{m.totalQuantity}</td>
                      
                      <td className="px-4 py-3 text-right font-semibold text-gray-700">{m.availableQuantity}</td>

                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${status.color}`}>{status.label}</span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setEditingMaterial(m); setShowEditMaterial(true); }} className="p-1.5 rounded-md border text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Edit Material"><Edit size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); deleteMaterial(m._id); }} className="p-1.5 rounded-md border text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete Material"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>

                    {expanded[m._id] && (
                      <tr className="bg-gray-50/70 border-b border-gray-200 shadow-inner">
                        <td colSpan={5} className="p-4 sm:px-6 sm:py-4">
                          <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="font-semibold text-gray-800 flex items-center gap-2">
                              <span>Variants ({m.variants?.length || 0})</span>
                              {m.description && <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{m.description}</span>}
                            </div>
                            <div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setVariantMaterial(m);
                                  setShowAddVariantModal(true);
                                }}
                                className="px-3 py-1.5 rounded bg-white border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-50 transition-colors shadow-sm"
                              >
                                <Plus size={14} className="inline mr-1"/> Add Variant
                              </button>
                            </div>
                          </div>

                          {/* Variant List (Responsive) */}
                          <div className="space-y-2 mt-3">
                            {m.variants && m.variants.length ? m.variants.map((v) => (
                              <div key={(v as any)._id} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-sm hover:border-emerald-300 transition-colors">
                                {/* Variant Info */}
                                <div className="col-span-1 md:col-span-3">
                                  <div className="font-medium text-gray-900 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                    {v.label}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 ml-4">
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">Price: ₹{v.pricePerDay}/day</span>
                                    <span className="mx-2 text-gray-300">|</span>
                                    <span>Total: {v.totalQuantity}</span>
                                    <span className="mx-2 text-gray-300">|</span>
                                    <span className={v.availableQuantity < 5 ? "text-red-600 font-medium" : "text-emerald-600 font-medium"}>Avl: {v.availableQuantity}</span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 md:col-span-2 flex items-center gap-2 justify-end">
                                  <button onClick={() => setEditingVariant({ matId: m._id, variant: v })} className="px-3 py-1 rounded border text-xs hover:bg-gray-100">Edit</button>
                                  <button onClick={() => removeVariant(m._id, (v as any)._id)} className="px-3 py-1 rounded border text-red-600 text-xs hover:bg-red-50">Delete</button>
                                </div>
                              </div>
                            )) : <div className="text-sm text-gray-500 p-4 text-center border border-dashed rounded-lg bg-gray-50">No variants added yet. Click "Add Variant" to start.</div>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
        <div className="text-sm text-gray-600">Showing <strong>{start}</strong> - <strong>{end}</strong> of <strong>{filtered.length}</strong> materials</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(1)} className="px-3 py-1 rounded-md border text-sm bg-white hover:bg-gray-50 disabled:opacity-50" disabled={safePage === 1}>First</button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded-md border text-sm bg-white hover:bg-gray-50 disabled:opacity-50" disabled={safePage === 1}>Prev</button>
          <div className="px-3 py-1 border rounded-md text-sm bg-white font-medium">{safePage} / {totalPages}</div>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded-md border text-sm bg-white hover:bg-gray-50 disabled:opacity-50" disabled={safePage === totalPages}>Next</button>
          <button onClick={() => setPage(totalPages)} className="px-3 py-1 rounded-md border text-sm bg-white hover:bg-gray-50 disabled:opacity-50" disabled={safePage === totalPages}>Last</button>
        </div>
      </div>

      {/* ----------------- MODALS (Responsive containers) ----------------- */}

      {/* Add Material Modal */}
      {showAddMaterial && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-10 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowAddMaterial(false)} />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Create New Material</h3>
                <button onClick={() => setShowAddMaterial(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"><X size={20}/></button>
            </div>
            
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Name *</label>
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="e.g. Scaffolding Pipe" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                    <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="e.g. Steel" />
                </div>
                <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                    <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="Optional details" />
                </div>
                </div>

                <div className="border border-gray-200 p-4 rounded-xl bg-gray-50/50">
                <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-800">Variants</div>
                    <button onClick={addNewVariantRow} className="px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-700 text-sm hover:bg-emerald-50 transition-colors shadow-sm">+ Add Variant</button>
                </div>

                <div className="mt-3 space-y-3">
                    {newVariants.map((v, i) => (
                    <div key={i} className="grid grid-cols-12 gap-3 items-end bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                        <div className="col-span-12 md:col-span-4">
                            <label className="text-xs font-medium text-gray-500 block mb-1">Label (Size/Type)</label>
                            <input value={v.label} onChange={(e) => updateNewVariant(i, "label", e.target.value)} placeholder="e.g. 10 ft" className="w-full border p-2 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                        </div>
                        
                        <div className="col-span-6 md:col-span-3">
                            <label className="text-xs font-medium text-gray-500 block mb-1">Price/day (₹)</label>
                            <input value={v.pricePerDay} onChange={(e) => updateNewVariant(i, "pricePerDay", e.target.value)} placeholder="0" type="number" min="0" className="w-full border p-2 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                        </div>
                        
                        <div className="col-span-6 md:col-span-3">
                            <label className="text-xs font-medium text-gray-500 block mb-1">Total Qty</label>
                            <input value={v.totalQuantity} onChange={(e) => updateNewVariant(i, "totalQuantity", e.target.value)} placeholder="0" type="number" min="1" className="w-full border p-2 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                        </div>
                        
                        <div className="col-span-12 md:col-span-2">
                            <button onClick={() => removeNewVariantRow(i)} className="w-full text-red-600 text-xs font-medium bg-red-50 hover:bg-red-100 border border-red-100 py-2.5 rounded-md transition-colors h-[38px]" disabled={newVariants.length === 1}>
                              <Trash2 size={14} className="inline mr-1"/> Remove
                            </button>
                        </div>
                    </div>
                    ))}
                </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowAddMaterial(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                <button onClick={submitNewMaterial} className="px-6 py-2 rounded-lg bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:shadow-lg hover:from-emerald-700 hover:to-teal-700 font-medium transition-all">Create Material</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Variant Modal */}
      {showAddVariantModal && variantMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => { setShowAddVariantModal(false); setVariantMaterial(null); }} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl p-6 z-10 animate-scale-in">
            <h2 className="text-xl font-semibold mb-1 text-gray-900">Add Variant</h2>
            <p className="text-sm text-gray-500 mb-4">Adding to: <span className="font-medium text-emerald-600">{variantMaterial.name}</span></p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Label</label>
                <input className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. 15 inch" value={newVariantLabel} onChange={(e) => setNewVariantLabel(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Price / day</label>
                  <input className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" type="number" placeholder="₹" min="0" value={newVariantPrice} onChange={(e) => setNewVariantPrice(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Quantity</label>
                  <input className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" type="number" placeholder="100" min="1" value={newVariantQty} onChange={(e) => setNewVariantQty(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium" onClick={() => { setShowAddVariantModal(false); setVariantMaterial(null); }}>Cancel</button>
              <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium shadow-md" onClick={handleAddVariant}>Add Variant</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Material Modal */}
      {showEditMaterial && editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => { setShowEditMaterial(false); setEditingMaterial(null); }} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 z-10 animate-scale-in">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Edit Material</h3>
              <button onClick={() => { setShowEditMaterial(false); setEditingMaterial(null); }} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Name</label>
                <input value={editingMaterial.name} onChange={(e) => setEditingMaterial(prev => prev ? ({ ...prev, name: e.target.value }) : prev)} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
                <input value={editingMaterial.category || ""} onChange={(e) => setEditingMaterial(prev => prev ? ({ ...prev, category: e.target.value }) : prev)} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
                <input value={editingMaterial.description || ""} onChange={(e) => setEditingMaterial(prev => prev ? ({ ...prev, description: e.target.value }) : prev)} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setShowEditMaterial(false); setEditingMaterial(null); }} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
              <button onClick={() => updateMaterial(editingMaterial._id, { name: editingMaterial.name, category: editingMaterial.category, description: editingMaterial.description })} className="px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-md font-medium">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Variant modal */}
      {editingVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setEditingVariant(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 z-10 animate-scale-in">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Edit Variant</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Label</label>
                <input value={variantEditLabel} onChange={(e) => setVariantEditLabel(e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Price per day</label>
                  <input type="number" min="0" value={variantEditPrice as any} onChange={(e) => setVariantEditPrice(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Total quantity</label>
                  <input type="number" min="1" value={variantEditTotal as any} onChange={(e) => setVariantEditTotal(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditingVariant(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
              <button onClick={() => {
                if (!editingVariant) return;
                const matId = editingVariant.matId;
                const variantId = (editingVariant.variant as any)._id;
                editVariant(matId, variantId, { label: variantEditLabel, pricePerDay: Number(variantEditPrice), totalQuantity: Number(variantEditTotal) });
              }} className="px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-md font-medium">Save</button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2"><AlertCircle size={20}/> {error}</div>}
    </div>
  );
}