"use client";

import { motion } from "framer-motion";
import { Phone, MapPin, Mail, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-white pb-20">
      
      {/* HERO HEADER */}
      <section className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white py-20 px-4 text-center shadow-xl">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl font-extrabold tracking-tight"
        >
          Contact Us
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-blue-200 mt-4 text-lg max-w-2xl mx-auto"
        >
          Need assistance? We respond quickly to calls and WhatsApp messages.
        </motion.p>
      </section>

      {/* CONTACT CARDS */}
      <div className="max-w-6xl mx-auto px-6 -mt-12 grid grid-cols-1 sm:grid-cols-4 gap-6 mb-14">

        {/* PHONE CARD */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-lg border border-gray-100 rounded-2xl p-6 text-center hover:shadow-xl transition group"
        >
          <Phone className="w-12 h-12 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition" />
          <h3 className="text-lg font-semibold text-blue-700">Call Us</h3>
          <p className="text-gray-600 mt-1">+91 98765 43210</p>

          {/* CALL BUTTON */}
          <a
            href="tel:+919876543210"
            className="mt-4 block w-full bg-blue-200 hover:bg-blue-400 text-white py-2 rounded-xl text-sm font-semibold transition"
          >
            📞 Call Now
          </a>
        </motion.div>

        {/* LOCATION CARD */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white shadow-lg border border-gray-100 rounded-2xl p-6 text-center hover:shadow-xl transition group"
        >
          <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition" />
          <h3 className="text-lg font-semibold text-blue-700">Location</h3>
          <p className="text-gray-600 mt-1">Your Shop Address Here</p>

          {/* OPEN MAPS BUTTON */}
          <a
            href="https://maps.google.com/?q=Your+Shop+Address+Here"
            target="_blank"
            className="mt-4 block w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-semibold transition"
          >
            📍 Open in Maps
          </a>
        </motion.div>

        {/* EMAIL CARD */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white shadow-lg border border-gray-100 rounded-2xl p-6 text-center hover:shadow-xl transition group"
        >
          <Mail className="w-12 h-12 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition" />
          <h3 className="text-lg font-semibold text-blue-700">Email Us</h3>
          <p className="text-gray-600 mt-1">support@shutteringmanager.com</p>
        </motion.div>

        {/* HOURS CARD */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white shadow-lg border border-gray-100 rounded-2xl p-6 text-center hover:shadow-xl transition group"
        >
          <Clock className="w-12 h-12 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition" />
          <h3 className="text-lg font-semibold text-blue-700">Store Hours</h3>

          <p className="text-gray-700 mt-2 text-sm">Mon – Sat</p>
          <p className="font-semibold text-gray-900">7:00 AM - 7:00 PM</p>

          {/* <p className="text-gray-700 mt-2 text-sm">Sunday</p>
          <p className="font-semibold text-gray-900">Closed</p> */}
        </motion.div>
      </div>

      {/* FORM + MAP */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* CONTACT FORM */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-blue-100 rounded-3xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-blue-700 mb-6">Send us a message</h2>

          <form className="grid grid-cols-1 gap-5">
            <input
              type="text"
              placeholder="Your Name"
              className="px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="email"
              placeholder="Your Email"
              className="px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <textarea
              placeholder="Your Message"
              rows={5}
              className="px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            ></textarea>

            <button
              type="button"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition"
            >
              Send Message
            </button>
          </form>
        </motion.div>

        {/* GOOGLE MAP */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-3xl overflow-hidden shadow-xl border border-gray-200"
        >
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3497.902554684346!2d75.86338777551546!3d28.614398985008137!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39127f80a19c5ab1%3A0x388b35f087f7efb!2sYour%20Shop%20Location!5e0!3m2!1sen!2sin!4v1700000000000"
            width="100%"
            height="100%"
            style={{ minHeight: "350px" }}
            loading="lazy"
          ></iframe>
        </motion.div>
      </div>
    </main>
  );
}
