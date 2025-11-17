"use client";

import { useState } from "react";
import { ShieldCheck, KeyRound } from "lucide-react";

// ADMIN TYPE
interface Admin {
  email: string;
  phone: string;
  name: string;
}

// LOAD ADMINS SAFELY (NO UNDEFINED)
const admins: Admin[] = [
  {
    email: process.env.NEXT_PUBLIC_ADMIN1_EMAIL || "",
    phone: process.env.NEXT_PUBLIC_ADMIN1_PHONE || "",
    name: "Admin One",
  },
  {
    email: process.env.NEXT_PUBLIC_ADMIN2_EMAIL || "",
    phone: process.env.NEXT_PUBLIC_ADMIN2_PHONE || "",
    name: "Admin Two",
  },
  {
    email: process.env.NEXT_PUBLIC_ADMIN3_EMAIL || "",
    phone: process.env.NEXT_PUBLIC_ADMIN3_PHONE || "",
    name: "Admin Three",
  },
];

export default function AdminLogin() {
  const [input, setInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);

  const checkAdmin = () => {
    const admin = admins.find(
      (a) => a.email === input.trim() || a.phone === input.trim()
    );

    if (!admin) {
      alert("❌ You are not authorized to access the Admin Panel");
      return;
    }

    setCurrentAdmin(admin);

    setOtpSent(true);

    alert(`OTP sent to ${admin.phone} (simulated)`);
  };

  const verifyOtp = () => {
    if (otp === "1234") {
      alert(`Welcome, ${currentAdmin?.name}!`);
      window.location.href = `/admin/dashboard?admin=${currentAdmin?.name}`;
    } else {
      alert("❌ Incorrect OTP");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-300 via-indigo-300 to-purple-300 px-4">
      
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl p-8 w-full max-w-md text-center text-white bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 ">
        
        {/* ICON */}
        <div className="flex justify-center mb-4">
          <ShieldCheck className="w-14 h-14 text-white drop-shadow-xl" />
        </div>

        {/* HEADING */}
        <h1 className="text-3xl font-bold">Admin Login</h1>
        <p className="text-blue-100 mt-2 text-sm">
          Email or Phone — both accepted.
        </p>

        {/* INPUT STEP */}
        {!otpSent ? (
          <>
            <input
              type="text"
              placeholder="Enter Admin Email or Phone"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 placeholder-white/60 text-white mt-6 focus:ring-2 focus:ring-blue-300 outline-none"
            />

            <button
              onClick={checkAdmin}
              className="w-full mt-6 bg-white text-blue-700 hover:bg-blue-100 py-3 rounded-xl shadow-lg font-semibold transition"
            >
              Send OTP
            </button>
          </>
        ) : (
          <>
            {/* OTP INPUT */}
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 placeholder-white/60 text-white mt-6 focus:ring-2 focus:ring-green-300 outline-none"
            />

            {/* VERIFY BUTTON */}
            <button
              onClick={verifyOtp}
              className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg font-semibold transition"
            >
              <KeyRound className="w-5 h-5" /> Verify OTP
            </button>

            {/* GO BACK BUTTON */}
            <button
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setInput("");
              }}
              className="w-full mt-3 text-sm text-blue-200 hover:text-white transition"
            >
              ← Change email or phone
            </button>
          </>
        )}

      </div>
    </div>
  );
}
