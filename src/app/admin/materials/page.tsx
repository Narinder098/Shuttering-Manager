// src/app/admin/materials/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, Search, ChevronDown, ChevronUp, X } from "lucide-react";

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

function cls(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

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
    } catch (e: any) { alert(e.message || "Error"); }
  }

  async function updateMaterial(id: string, payload: any) {
    try {
      const res = await fetch(`/api/materials/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");
      setRefetch(s => s + 1);
      setShowEditMaterial(false);
      setEditingMaterial(null);
    } catch (e: any) { alert(e.message || "Error"); }
  }

  async function deleteMaterial(id: string) {
    if (!confirm("Delete material? This action is irreversible.")) return;
    try {
      const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to delete");
      setRefetch(s => s + 1);
    } catch (e: any) { alert(e.message || "Error"); }
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
    } catch (e: any) { alert(e.message || "Error adding variant"); }
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
    } catch (e: any) { alert(e.message || "Error"); }
  }

  async function removeVariant(matId: string, variantId: string) {
    if (!confirm("Delete variant?")) return;
    try {
      const res = await fetch(`/api/materials/${matId}/variants/${variantId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to delete variant");
      setRefetch(s => s + 1);
    } catch (e: any) { alert(e.message || "Error"); }
  }

  async function handleAddVariant() {
    if (!variantMaterial) return;

    if (!newVariantLabel.trim() || newVariantPrice === "" || newVariantQty === "") {
      return alert("All fields required");
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
    if (!newName.trim()) return alert("Name required");
    // validate variants
    for (let i = 0; i < newVariants.length; i++) {
      const v = newVariants[i];
      if (!v.label.trim()) return alert(`Variant ${i + 1} label required`);
      if (v.pricePerDay === "" || isNaN(Number(v.pricePerDay)) || Number(v.pricePerDay) < 0) return alert(`Variant ${i + 1} price required and must be non-negative`);
      if (v.totalQuantity === "" || isNaN(Number(v.totalQuantity)) || Number(v.totalQuantity) <= 0) return alert(`Variant ${i + 1} total quantity required and must be greater than 0`);
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
    <div className="space-y-6 pb-8">
      {/* header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Materials Inventory</h1>
          <p className="text-gray-600 mt-1 max-w-xl">Click a material to expand its variants. Add/edit/delete variants inline.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowAddMaterial(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md">
            <Plus size={16} /> Add Material
          </button>
        </div>
      </div>

      ---

      {/* Mixed Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Hero gradient card - Takes up full width on mobile/tablet */}
        <div className="lg:col-span-4 bg-gradient-to-br from-emerald-600 to-teal-400 text-white rounded-2xl p-6 shadow-lg border border-emerald-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm opacity-90">Inventory Overview</div>
              {/* FIX APPLIED HERE: Removed extra '}' */}
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

      ---

      {/* controls */}
      <div className="bg-black/10 p-4 rounded-2xl shadow border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by material name..." className="pl-10 pr-4 py-2 rounded-md border w-full" />
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

      ---

      {/* table */}
      <div className="bg-white rounded-2xl shadow-xl border border-emerald-300 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-br from-emerald-700 to-teal-500 text-white"><tr>
            {/* Name - Visible on all screens, flexible width */}
            <th className="text-left px-4 py-3 text-sm font-semibold w-[40%] sm:w-[35%]">Name</th>
            {/* Total Qty - Hidden on small mobile */}
            <th className="hidden sm:table-cell text-right px-4 py-3 text-sm font-semibold w-[15%]">Total Qty</th>
            {/* Available Qty - Visible on all screens, fixed width */}
            <th className="text-right px-4 py-3 text-sm font-semibold w-[15%]">Available</th>
            {/* Status - Visible on all screens, fixed width */}
            <th className="text-center px-4 py-3 text-sm font-semibold w-[15%]">Status</th>
            {/* Actions - Visible on all screens, smallest width */}
            <th className="text-center px-4 py-3 text-sm font-semibold w-[15%]">Actions</th>
          </tr></thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-600">Loading...</td></tr>
            ) : pageItems.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-600">No materials found</td></tr>
            ) : pageItems.map((m) => {
              const lowThreshold = Math.max(0, Math.ceil(m.totalQuantity * LOW_RATIO));
              const status = m.availableQuantity <= 0 
                ? { label: "Out of Stock", color: "bg-red-100 text-red-700" } 
                : m.availableQuantity <= lowThreshold 
                ? { label: "Low Stock", color: "bg-amber-100 text-amber-700" } 
                : { label: "In Stock", color: "bg-emerald-100 text-emerald-700" };

              return (
                <React.Fragment key={m._id}>
                  <tr 
                    className="hover:bg-emerald-50 transition duration-150 cursor-pointer"
                    onClick={() => toggleExpand(m._id)} // Click row to expand
                  ><td className="px-4 py-3 flex items-center gap-3"> {/* FIX: <td> immediately follows <tr> */}
                      <button className="p-1 rounded hover:bg-gray-100 flex-shrink-0">
                        {expanded[m._id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <div className="truncate">
                        <div className="font-medium text-gray-900">{m.name}</div>
                        <div className="text-xs text-gray-500 truncate">{m.category || "Uncategorized"}</div>
                      </div>
                    </td>

                    {/* Total Qty - Hidden on small mobile */}
                    <td className="hidden sm:table-cell px-4 py-3 text-right text-gray-600">{m.totalQuantity}</td>
                    
                    {/* Available Qty */}
                    <td className="px-4 py-3 text-right font-semibold text-gray-700">{m.availableQuantity}</td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${status.color}`}>{status.label}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setEditingMaterial(m); setShowEditMaterial(true); }} className="p-1 rounded-md border text-gray-700 hover:bg-teal-100"><Edit size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); deleteMaterial(m._id); }} className="p-1 rounded-md border text-red-600 hover:bg-red-100"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>

                  {expanded[m._id] && (
                    <tr className="bg-gray-50/70 border-b border-gray-200">
                      <td colSpan={5} className="p-4 sm:px-6 sm:py-4">
                        <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="font-semibold text-gray-800">Variants ({m.variants?.length || 0})</div>
                          <div>
                            <button
                              onClick={() => {
                                setVariantMaterial(m);
                                setShowAddVariantModal(true);
                              }}
                              className="px-3 py-1 rounded bg-emerald-100 text-emerald-800 text-sm font-medium"
                            >
                              <Plus size={14} className="inline mr-1"/> Add Variant
                            </button>
                          </div>
                        </div>

                        {/* Variant List (Responsive) */}
                        <div className="space-y-2 mt-3">
                          {m.variants && m.variants.length ? m.variants.map((v) => (
                            <div key={(v as any)._id} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center bg-white border rounded-xl p-3 shadow-sm text-sm">
                              {/* Variant Info */}
                              <div className="col-span-1 md:col-span-3">
                                <div className="font-medium text-gray-900">{v.label}</div>
                                <div className="text-xs text-gray-500">
                                  Price: **₹ {v.pricePerDay}** | Total: **{v.totalQuantity}** | Avl: **{v.availableQuantity}**
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="col-span-1 md:col-span-2 flex items-center gap-2 justify-end">
                                <button onClick={() => setEditingVariant({ matId: m._id, variant: v })} className="px-3 py-1 rounded border text-sm hover:bg-gray-100">Edit</button>
                                <button onClick={() => removeVariant(m._id, (v as any)._id)} className="px-3 py-1 rounded border text-red-600 text-sm hover:bg-red-50">Delete</button>
                              </div>
                            </div>
                          )) : <div className="text-sm text-gray-500 p-2">No variants yet</div>}
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

      ---

      {/* pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
        <div className="text-sm text-gray-600">Showing <strong>{start}</strong> - <strong>{end}</strong> of <strong>{filtered.length}</strong> materials</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(1)} className="px-3 py-1 rounded-md border text-sm" disabled={safePage === 1}>First</button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded-md border text-sm" disabled={safePage === 1}>Prev</button>
          <div className="px-3 py-1 border rounded-md text-sm">{safePage} / {totalPages}</div>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded-md border text-sm" disabled={safePage === totalPages}>Next</button>
          <button onClick={() => setPage(totalPages)} className="px-3 py-1 rounded-md border text-sm" disabled={safePage === totalPages}>Last</button>
        </div>
      </div>

      {/* ----------------- MODALS (Responsive containers) ----------------- */}

      {/* Add Material Modal */}
      {showAddMaterial && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-10">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddMaterial(false)} />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-xl font-semibold">Create New Material</h3>
                <button onClick={() => setShowAddMaterial(false)} className="p-2 rounded-full hover:bg-gray-100"><X size={20}/></button>
            </div>
            
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="text-sm text-gray-600">Name *</label>
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="text-sm text-gray-600">Category</label>
                    <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full border p-2 rounded" />
                </div>
                <div className="md:col-span-2">
                    <label className="text-sm text-gray-600">Description</label>
                    <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full border p-2 rounded" />
                </div>
                </div>

                <div className="border p-4 rounded-xl bg-gray-50">
                <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-800">Variants</div>
                    <button onClick={addNewVariantRow} className="px-3 py-1 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700">+ Add Variant</button>
                </div>

                <div className="mt-3 space-y-3">
                    {newVariants.map((v, i) => (
                    <div key={i} className="grid grid-cols-12 gap-3 items-center bg-white p-3 rounded-lg shadow-sm border">
                        {/* Responsive inputs for mobile */}
                        <div className="col-span-12">
                            <label className="text-xs text-gray-500 block">Label</label>
                            <input value={v.label} onChange={(e) => updateNewVariant(i, "label", e.target.value)} placeholder="e.g. 15 inch" className="w-full border p-2 rounded focus:ring-2 focus:ring-emerald-300" />
                        </div>
                        
                        <div className="col-span-6 md:col-span-4">
                            <label className="text-xs text-gray-500 block">Price/day</label>
                            <input value={v.pricePerDay} onChange={(e) => updateNewVariant(i, "pricePerDay", e.target.value)} placeholder="Price" type="number" min="0" className="w-full border p-2 rounded focus:ring-2 focus:ring-emerald-300" />
                        </div>
                        
                        <div className="col-span-6 md:col-span-4">
                            <label className="text-xs text-gray-500 block">Total Qty</label>
                            <input value={v.totalQuantity} onChange={(e) => updateNewVariant(i, "totalQuantity", e.target.value)} placeholder="Total qty" type="number" min="1" className="w-full border p-2 rounded focus:ring-2 focus:ring-emerald-300" />
                        </div>
                        
                        <div className="col-span-12 md:col-span-4 flex justify-end">
                            <button onClick={() => removeNewVariantRow(i)} className="w-full md:w-auto text-red-600 text-sm font-semibold bg-red-100 hover:bg-red-200 px-3 py-2 rounded-md transition" disabled={newVariants.length === 1}>Remove</button>
                        </div>
                    </div>
                    ))}
                </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setShowAddMaterial(false)} className="px-3 py-2 rounded border">Cancel</button>
                <button onClick={submitNewMaterial} className="px-4 py-2 rounded bg-emerald-600 text-white">Create Material</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Variant Modal */}
      {showAddVariantModal && variantMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowAddVariantModal(false); setVariantMaterial(null); }} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl p-6 z-10">
            <h2 className="text-xl font-semibold mb-2">Add Variant — {variantMaterial.name}</h2>

            <div className="space-y-3 pt-3">
              <div>
                <label className="text-sm text-gray-600">Label</label>
                <input className="w-full border p-2 rounded" placeholder="15 inch" value={newVariantLabel} onChange={(e) => setNewVariantLabel(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Price per day</label>
                <input className="w-full border p-2 rounded" type="number" placeholder="₹" min="0" value={newVariantPrice} onChange={(e) => setNewVariantPrice(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Total quantity</label>
                <input className="w-full border p-2 rounded" type="number" placeholder="100" min="1" value={newVariantQty} onChange={(e) => setNewVariantQty(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button className="px-3 py-2 rounded border" onClick={() => { setShowAddVariantModal(false); setVariantMaterial(null); }}>Cancel</button>
              <button className="px-4 py-2 rounded bg-emerald-600 text-white" onClick={handleAddVariant}>Add Variant</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Material Modal */}
      {showEditMaterial && editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setShowEditMaterial(false); setEditingMaterial(null); }} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 z-10">
            <h3 className="text-xl font-semibold mb-4">Edit Material: {editingMaterial.name}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <input value={editingMaterial.name} onChange={(e) => setEditingMaterial(prev => prev ? ({ ...prev, name: e.target.value }) : prev)} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Category</label>
                <input value={editingMaterial.category || ""} onChange={(e) => setEditingMaterial(prev => prev ? ({ ...prev, category: e.target.value }) : prev)} className="w-full border p-2 rounded" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Description</label>
                <input value={editingMaterial.description || ""} onChange={(e) => setEditingMaterial(prev => prev ? ({ ...prev, description: e.target.value }) : prev)} className="w-full border p-2 rounded" />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setShowEditMaterial(false); setEditingMaterial(null); }} className="px-3 py-2 rounded border">Cancel</button>
              <button onClick={() => updateMaterial(editingMaterial._id, { name: editingMaterial.name, category: editingMaterial.category, description: editingMaterial.description })} className="px-4 py-2 rounded bg-emerald-600 text-white">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Variant modal */}
      {editingVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditingVariant(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lg p-6 z-10">
            <h3 className="text-xl font-semibold mb-2">Edit Variant: {editingVariant.variant.label}</h3>

            <div className="space-y-3 pt-3">
              <div>
                <label className="text-sm text-gray-600">Label</label>
                <input value={variantEditLabel} onChange={(e) => setVariantEditLabel(e.target.value)} className="w-full border p-2 rounded" />
              </div>

              <div>
                <label className="text-sm text-gray-600">Price per day</label>
                <input type="number" min="0" value={variantEditPrice as any} onChange={(e) => setVariantEditPrice(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border p-2 rounded" />
              </div>

              <div>
                <label className="text-sm text-gray-600">Total quantity</label>
                <input type="number" min="1" value={variantEditTotal as any} onChange={(e) => setVariantEditTotal(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border p-2 rounded" />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditingVariant(null)} className="px-3 py-2 rounded border">Cancel</button>
              <button onClick={() => {
                if (!editingVariant) return;
                const matId = editingVariant.matId;
                const variantId = (editingVariant.variant as any)._id;
                editVariant(matId, variantId, { label: variantEditLabel, pricePerDay: Number(variantEditPrice), totalQuantity: Number(variantEditTotal) });
              }} className="px-4 py-2 rounded bg-emerald-600 text-white">Save</button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">{error}</div>}
    </div>
  );
}