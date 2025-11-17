"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block px-4 py-2 rounded-md text-sm font-medium transition ${
        isActive
          ? "bg-white text-blue-700 shadow-sm"
          : "text-white/90 hover:text-white hover:bg-white/10"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* LOGO */}
        <Link
          href="/"
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white hover:opacity-90 transition"
        >
          SBM<span className="text-blue-200 font-normal"> Manager</span>
        </Link>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex gap-2">
          <NavLink href="/materials" label="Materials" />
          <NavLink href="/calculator" label="Calculator" />
          <NavLink href="/contact" label="Contact" />
          <NavLink href="/login" label="Admin" />
        </div>

        {/* MOBILE TOGGLE BUTTON */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 text-white hover:bg-white/10 rounded-md transition"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden bg-gradient-to-b from-indigo-700 to-blue-700 border-t border-white/10 shadow-inner">
          <NavLink href="/materials" label="Materials" onClick={() => setMenuOpen(false)} />
          <NavLink href="/calculator" label="Calculator" onClick={() => setMenuOpen(false)} />
          <NavLink href="/contact" label="Contact" onClick={() => setMenuOpen(false)} />
          <NavLink href="/login" label="Admin" onClick={() => setMenuOpen(false)} />
        </div>
      )}
    </header>
  );
}
