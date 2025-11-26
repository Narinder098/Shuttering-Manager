"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

// --- NavItem Component ---
function NavItem({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname.startsWith(href) && href !== "/";
  const isExactActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        relative text-sm font-medium transition duration-200
        py-2 px-1
        ${
          (active || isExactActive)
            ? "text-white after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:bg-teal-300" 
            : "text-slate-200 hover:text-white hover:bg-white/10 rounded" 
        }
      `}
    >
      {children}
    </Link>
  );
}

// --- Main Navbar Component ---
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function fetchAdmin() {
      try {
        const res = await fetch("/api/admin/me");
        const data = await res.json();
        if (data.ok) setAdmin(data.admin);
        else setAdmin(null);
      } catch {
        setAdmin(null);
      }
      setLoading(false);
    }
    fetchAdmin();
    setMenuOpen(false); 
  }, [pathname]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAdmin(null);
    // CHANGED: Redirect to Home Page instead of Admin Login
    router.push("/"); 
  };
  
  if (loading) {
    return (
      <header className="sticky top-0 z-50 bg-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 text-white font-medium">Loading...</div>
      </header>
    );
  }

  const navLinks = admin
    ? [
        { href: "/admin/rentals", label: "Rentals" },
        { href: "/admin/materials", label: "Materials" },
        { href: "/admin/customers", label: "Customers" },
        { href: "/admin/reports", label: "Reports" },
        { href: "/admin/accounts", label: "Accounts" },
      ]
    : [
        { href: "/materials", label: "Materials" },
        { href: "/calculator", label: "Calculator" },
        { href: "/contact", label: "Contact" },
      ];
      
  const logoHref = admin ? "/admin/dashboard" : "/";
  const isDashboardActive = admin && pathname === "/admin/dashboard";

  return (
    <header className="sticky top-0 z-50 bg-slate-800 shadow-xl border-b border-teal-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between">
        
        <div className="flex items-center gap-4">
            <Link
                href={logoHref}
                className={`
                    text-2xl font-extrabold flex-shrink-0 transition duration-200 
                    ${isDashboardActive ? 'text-teal-300' : 'text-white hover:text-teal-300'}
                `}
            >
                SBM <span className="text-teal-300">{admin ? "Admin" : "Manager"}</span>
            </Link>
        </div>

        {/* DESKTOP MENU */}
        <nav className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-4">
            {navLinks.map((link) => (
              <NavItem key={link.href} href={link.href}>
                {link.label}
              </NavItem>
            ))}
          </div>

          {!admin ? (
            <Link
              href="/admin/login"
              className="px-4 py-2 bg-blue-900 text-white rounded-lg font-medium shadow-md hover:bg-teal-600 transition duration-150"
            >
              Login
            </Link>
          ) : (
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium shadow-md hover:bg-red-700 transition duration-150"
            >
              <LogOut size={16} /> Logout
            </button>
          )}
        </nav>

        {/* MOBILE TOGGLE */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white p-2 rounded hover:bg-slate-700 transition"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 bg-slate-800 shadow-inner">
          <div className="flex flex-col space-y-2 mt-2 border-t border-slate-700 pt-3">
            {navLinks.map((link) => (
              <NavItem key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </NavItem>
            ))}

            {!admin ? (
              <Link
                href="/admin/login"
                onClick={() => setMenuOpen(false)}
                className="w-full text-left px-3 py-2 mt-2 bg-teal-500 text-white rounded-lg text-sm font-medium"
              >
                Admin Login
              </Link>
            ) : (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="w-full text-left inline-flex items-center gap-2 px-3 py-2 mt-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                <LogOut size={16} /> Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}