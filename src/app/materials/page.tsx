"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { materials } from "@/lib/mock";

export default function MaterialsPage() {
  const [query, setQuery] = useState("");

  // Filter logic
  const filtered = materials.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-white py-14 px-4 sm:px-6">
      {/* === HEADER === */}
      <div className="max-w-6xl mx-auto mb-10 text-center px-2">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-extrabold text-blue-700"
        >
          Our Materials
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-gray-600 mt-2 max-w-xl mx-auto text-sm sm:text-base"
        >
          Browse, search, and explore all our shuttering materials.
        </motion.p>
      </div>

      {/* === SEARCH BAR === */}
      <div className="max-w-6xl mx-auto mb-8 px-2">
        <input
          type="text"
          placeholder="Search materials (e.g. Prop, Plate, Jack)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-3 text-sm sm:text-base rounded-xl border border-blue-200 shadow-sm focus:ring-2 focus:ring-blue-400 outline-none transition"
        />
      </div>

      {/* === GRID === */}
      <div className="
        max-w-6xl mx-auto 
        grid gap-5 sm:gap-6 
        grid-cols-1 
        sm:grid-cols-2 
        md:grid-cols-3 
        lg:grid-cols-4 
        xl:grid-cols-5
      ">
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 col-span-full text-sm sm:text-base">
            No materials found.
          </p>
        )}

        {filtered.map((m, i) => (
          <motion.a
            key={m.id}
            href={`/materials/${m.id}`}   // NEW → LINKS TO DETAILS PAGE
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ scale: 1.02 }}
            className="
              relative bg-white rounded-2xl shadow-sm hover:shadow-xl 
              border border-blue-100 overflow-hidden transition-all p-5 group cursor-pointer
            "
          >
            <h2 className="text-lg sm:text-xl font-semibold text-blue-800 mb-1">
              {m.name}
            </h2>

            <div className="h-[2px] w-10 bg-blue-500 rounded mb-4 group-hover:w-14 transition-all"></div>

            <div className="space-y-2 text-sm sm:text-base text-gray-700">
              <p><b>Rate:</b> ₹{m.dailyRate}/day</p>
              <p><b>Stock:</b> {m.stock} units</p>
            </div>

            <span className={`
              text-xs mt-4 inline-block px-3 py-1 rounded-full font-medium
              ${m.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}
            `}>
              {m.stock > 0 ? "In Stock" : "Out of Stock"}
            </span>
          </motion.a>
        ))}
      </div>
    </main>
  );
}
