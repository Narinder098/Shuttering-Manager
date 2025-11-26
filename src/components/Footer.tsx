"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // HIDE FOOTER ON ADMIN PAGES
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="bg-linear-to-r from-emerald-400 via-teal-400 to-emerald-600 text-white mt-20">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6">

        {/* BRAND */}
        <div>
          <h2 className="text-2xl font-bold">Shuttering Manager</h2>
          <p className="text-blue-200 mt-2 text-sm">
            Manage rentals, inventory, and payments with ease.
          </p>
        </div>

        {/* QUICK LINKS */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
          <ul className="grid grid-cols-2 space-y-2 text-sm">
            <li><a className="text-blue-200 hover:text-white" href="/">Home</a></li>
            <li><a className="text-blue-200 hover:text-white" href="/materials">Materials</a></li>
            <li><a className="text-blue-200 hover:text-white" href="/calculator">Calculator</a></li>
            <li><a className="text-blue-200 hover:text-white" href="/contact">Contact</a></li>
          </ul>
        </div>

        {/* CONTACT */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Contact</h3>
          <p className="text-blue-200 text-sm">📍 Gurudwara Road, Village Narainpura, Abohar</p>
          <p className="text-blue-200 text-sm">📞 +91 94178 94500</p>
          <p className="text-blue-200 text-sm"><span className="text-red-400 text-lg" >✉</span> sutharbuildingmaterial@gmail.com</p>
        </div>

      </div>

      <div className="bg-black/20 text-center py-3 text-sm text-blue-200">
        © {new Date().getFullYear()} Shuttering Manager. All rights reserved.
      </div>
    </footer>
  );
}
