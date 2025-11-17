"use client";

import { useParams } from "next/navigation";
import { materials } from "@/lib/mock";
import { motion } from "framer-motion";
import Link from "next/link";

export default function MaterialDetails() {
  const { id } = useParams();
  const material = materials.find((m) => m.id === id);

  if (!material) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Material not found.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-white px-4 sm:px-6 py-16">

      <div className="max-w-3xl mx-auto">

        {/* BACK BUTTON */}
        <Link 
          href="/materials"
          className="inline-flex items-center gap-2 text-blue-700 text-sm font-medium hover:underline mb-4"
        >
          ← Back to Materials
        </Link>

        {/* HEADER CARD */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white rounded-3xl shadow-xl p-8 sm:p-10 mb-10">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl sm:text-4xl font-extrabold tracking-wide"
          >
            {material.name}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-blue-100 mt-2 text-sm sm:text-base"
          >
            Detailed information and availability for rental.
          </motion.p>
        </div>

        {/* DETAILS SECTION */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8 sm:p-10">
          
          {/* TITLE */}
          <h2 className="text-xl sm:text-2xl font-bold text-blue-700 mb-6">
            Material Information
          </h2>

          {/* INFO GRID */}
          <div className="grid sm:grid-cols-2 gap-6">

            {/* RATE CARD */}
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 shadow-sm hover:shadow-md transition">
              <p className="text-sm text-blue-600 font-semibold mb-1">Daily Rate</p>
              <p className="text-2xl font-bold text-blue-800">₹{material.dailyRate}</p>
              <p className="text-gray-500 text-sm">Per day</p>
            </div>

            {/* STOCK CARD */}
            <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm hover:shadow-md transition">
              <p className="text-sm text-indigo-600 font-semibold mb-1">Available Stock</p>
              <p className="text-2xl font-bold text-indigo-800">{material.stock}</p>
              <p className="text-gray-500 text-sm">Units available</p>
            </div>

          </div>

          {/* STATUS */}
          <div className="mt-8">
            <span
              className={`
                px-4 py-2 text-sm rounded-full font-medium 
                ${
                  material.stock > 0
                    ? "bg-green-100 text-green-900 border border-green-200"
                    : "bg-red-100 text-red-900 border border-red-200"
                }
              `}
            >
              {material.stock > 0 ? "In Stock" : "Out of Stock"}
            </span>
          </div>

        </div>
      </div>
    </main>
  );
}
