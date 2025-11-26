import "@/styles/globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Shuttering Manager",
  description: "AI-powered shuttering shop management system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
        
        {/* NAVBAR - AUTO SWITCHES */}
        <Navbar />

        {/* MAIN */}
        <main className="flex-1 px-4 sm:px-6 md:px-8 py-8">{children}</main>

        {/* TOASTER */}
        <Toaster position="top-right" />

        {/* FOOTER (HIDDEN ON ADMIN PAGES) */}
        <Footer />

      </body>
    </html>
  );
}
