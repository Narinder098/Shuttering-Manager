"use client";

import { useState, useMemo } from "react";
import { materials } from "@/lib/mock";
import { daysBetween, todayISO } from "@/lib/calc";
import CountUp from "react-countup";

export default function CalculatorPage() {
  // TOP BAR STATES
  const [selectMaterial, setSelectMaterial] = useState(materials[0].id);
  const [selectQty, setSelectQty] = useState(1);
  const [dateOut, setDateOut] = useState(todayISO());
  const [dateIn, setDateIn] = useState(todayISO());

  // ADDED MATERIALS
  type Row = {
    id: string;
    materialId: string;
    qty: number;
    dateOut: string;
    dateIn: string;
  };

  type ComputedRow = Row & {
    material: (typeof materials)[number];
    days: number;
    subtotal: number;
  };

  const [rows, setRows] = useState<Row[]>([]);

  const addRow = () => {
    if (!dateOut || !dateIn) return;

    setRows((r) => [
      ...r,
      {
        id: Math.random().toString(),
        materialId: selectMaterial,
        qty: selectQty,
        dateOut,
        dateIn,
      },
    ]);
  };

  const removeRow = (id: string) =>
    setRows((r) => r.filter((row) => row.id !== id));

  // COMPUTE TOTALS
  const computed = useMemo(() => {
    return rows.map((row) => {
      const material = materials.find((m) => m.id === row.materialId)!;
      const days = daysBetween(row.dateOut, row.dateIn);
      const subtotal = row.qty * material.dailyRate * days;

      return { ...row, material, days, subtotal } as ComputedRow;
    });
  }, [rows]);

  const total = computed.reduce((s, r) => s + r.subtotal, 0);

  return (
    <main className="min-h-screen bg-linear-to-b from-blue-50 to-white px-4 py-14 sm:px-8">
      <div className="max-w-4xl mx-auto">

        {/* PAGE TITLE */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700 text-center">
          Price Calculator
        </h1>
        <p className="text-gray-600 text-center mt-2 text-sm mb-10">
          Add materials and calculate totals instantly.
        </p>

        {/* 🔵 TOP BAR */}
        <div className="
           
          bg-white/90 backdrop-blur-xl 
          border border-blue-100 shadow-xl
          rounded-2xl p-5 mb-12
        ">
          <h2 className="font-semibold text-blue-700 mb-3 text-lg">
            Add Material
          </h2>

          {/* BAR GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">

            {/* MATERIAL */}
            <select
              value={selectMaterial}
              onChange={(e) => setSelectMaterial(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm shadow-sm"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.nameHi ? `(${m.nameHi})` : ""}
                </option>
              ))}
            </select>

            {/* QTY */}
            <input
              type="number"
              min="1"
              value={selectQty}
              onChange={(e) =>
                setSelectQty(Math.max(1, Number(e.target.value)))
              }
              className="px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm shadow-sm"
            />

            {/* DATE OUT */}
            <input
              type="date"
              value={dateOut}
              onChange={(e) => setDateOut(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm shadow-sm"
            />

            {/* DATE IN */}
            <input
              type="date"
              value={dateIn}
              onChange={(e) => setDateIn(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm shadow-sm"
            />

            {/* ADD BUTTON */}
            <button
              onClick={addRow}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-4 py-3 shadow-md text-sm transition w-full"
            >
              + Add
            </button>
          </div>
        </div>

        {/* ITEMS ADDED */}
        <div className="space-y-6">
          {computed.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-blue-100 rounded-2xl shadow-md p-6 hover:shadow-xl transition"
            >
              {/* HEADER */}
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-blue-800">
                  {r.material.name}{" "}
                  {r.material.nameHi && (
                    <span className="text-gray-500 text-sm">
                      ({r.material.nameHi})
                    </span>
                  )}
                </h3>

                <button
                  onClick={() => removeRow(r.id)}
                  className="px-3 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 text-xs hover:bg-red-100"
                >
                  Remove
                </button>
              </div>

              {/* INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">

                {/* QTY */}
                <div>
                  <p className="text-xs text-gray-500">Quantity</p>
                  <p className="text-lg font-semibold">{r.qty}</p>
                </div>

                {/* DAYS */}
                <div>
                  <p className="text-xs text-gray-500">Days</p>
                  <p className="text-lg font-semibold text-blue-700">{r.days}</p>
                </div>

                {/* RATE */}
                <div>
                  <p className="text-xs text-gray-500">Rate / Day</p>
                  <p className="text-lg font-semibold">₹{r.material.dailyRate}</p>
                </div>

                {/* SUBTOTAL */}
                <div>
                  <p className="text-xs text-gray-500">Subtotal</p>
                  <p className="text-2xl font-bold text-blue-700">₹{r.subtotal}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* GRAND TOTAL + WHATSAPP SHARE */}
        <div className="mt-12 bg-white border border-blue-100 rounded-2xl shadow-md p-6">

          <div className="text-center sm:text-right">
            <p className="text-gray-500 text-sm">Grand Total</p>
            <h2 className="text-4xl font-extrabold text-blue-700 mb-4">
              <CountUp end={total} duration={0.6} separator="," prefix="₹" />
            </h2>
          </div>

          {/* WHATSAPP BUTTON */}
          <button
            onClick={() => {
              const message = computed
                .map(
                  (item) =>
                    `• ${item.material.name} (${item.material.nameHi || ""})\n  Qty: ${item.qty
                    }\n  Days: ${item.days}\n  Rate: ₹${item.material.dailyRate}/day\n  Subtotal: ₹${item.subtotal
                    }\n`
                )
                .join("\n");

              const finalMessage = `🧾 *Shuttering Rent Bill*\n\n${message}\n----------------------------------\nGrand Total: *₹${total}*\n----------------------------------\n\nThank you!`;

              const encoded = encodeURIComponent(finalMessage);
              window.open(`https://wa.me/?text=${encoded}`, "_blank");
            }}
            className="w-full sm:w-auto mt-4 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition text-sm mx-auto"
          >
            <span>📲 Share on WhatsApp</span>
          </button>
        </div>


      </div>
    </main>
  );
}
