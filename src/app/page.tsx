"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center text-center bg-linear-to-b from-blue-50 to-gray-50 text-gray-900">
      {/* === HERO SECTION === */}
      <section className="w-full bg-linear-to-br from-emerald-300 via-teal-300 to-emerald-400 py-20 sm:py-24 text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-5xl font-extrabold bg-linear-to-r from-purple-400 via-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight"
          >
            Welcome to Shuttering Manager
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-blue-50 mt-4 text-sm sm:text-lg leading-relaxed"
          >
            Track inventory in real-time and never lose sight of your equipment again. 
            Designed to help you rent more and worry less.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-4 mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Link
              href="/materials"
              className="px-8 py-3 rounded-md text-white font-medium bg-blue-300 hover:bg-blue-400 transition transform hover:scale-105 shadow-md text-sm sm:text-base"
            >
              View Materials
            </Link>
            <Link
              href="/calculator"
              className="px-8 py-3 rounded-md font-medium bg-white text-blue-300 hover:bg-blue-50 border transition transform hover:scale-105 shadow-md text-sm sm:text-base"
            >
              Price Calculator
            </Link>
          </motion.div>
        </div>
      </section>

      {/* === FEATURES SECTION === */}
      <section className="max-w-6xl mx-auto mt-16 grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-3 px-4 pb-24">
        {[
          { emoji: "⚙️", title: "Smart Inventory", text: "Automatic stock updates when materials move." },
          { emoji: "💰", title: "Rent Tracking", text: "Instant rent calculation by quantity & days." },
          { emoji: "🤖", title: "AI Insights", text: "Get reminders and predictive suggestions." },
        ].map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 + 0.4 }}
            className="bg-white border border-gray-100 rounded-2xl shadow-md p-6 hover:shadow-2xl transition duration-300"
          >
            <div className="text-4xl mb-3">{f.emoji}</div>
            <h3 className="font-semibold text-lg text-blue-700 mb-2">{f.title}</h3>
            <p className="text-gray-600 text-sm sm:text-base">{f.text}</p>
          </motion.div>
        ))}
      </section>
    </main>
  );
}
