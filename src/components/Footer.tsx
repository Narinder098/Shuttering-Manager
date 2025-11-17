export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 text-white mt-20">
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
          <ul className="space-y-2 text-sm">
            <li><a className="text-blue-200 hover:text-white" href="/">Home</a></li>
            <li><a className="text-blue-200 hover:text-white" href="/materials">Materials</a></li>
            <li><a className="text-blue-200 hover:text-white" href="/calculator">Calculator</a></li>
            <li><a className="text-blue-200 hover:text-white" href="/contact">Contact</a></li>
          </ul>
        </div>

        {/* CONTACT */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Contact</h3>
          <p className="text-blue-200 text-sm">📍 Your Shop Address</p>
          <p className="text-blue-200 text-sm">📞 +91 98765 43210</p>
          <p className="text-blue-200 text-sm">✉ support@shutteringmanager.com</p>
        </div>

      </div>

      <div className="bg-black/20 text-center py-3 text-sm text-blue-200">
        © {new Date().getFullYear()} Shuttering Manager. All rights reserved.
      </div>
    </footer>
  );
}
