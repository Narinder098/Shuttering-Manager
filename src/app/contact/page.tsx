"use client";

import { motion } from "framer-motion";
import { Phone, MapPin, Mail, Clock, Send, ExternalLink, Sparkles } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-20 relative overflow-hidden">

      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-emerald-100/40 via-teal-50/30 to-transparent -z-10 pointer-events-none" />
      {/* Abstract Shapes for Depth */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl -z-10" />
      <div className="absolute top-[20%] left-[-10%] w-72 h-72 bg-teal-200/20 rounded-full blur-3xl -z-10" />

      {/* HERO HEADER */}
      <section className="relative py-20 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/50 border border-emerald-200 text-emerald-700 text-sm font-medium mb-2 backdrop-blur-sm">
            <Sparkles size={14} /> We're here to help
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight">
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Touch</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Have a question about inventory or need a custom quote? <br className="hidden sm:block" />
            We are here to help you with all your shuttering needs.
          </p>
        </motion.div>
      </section>

      {/* CONTACT CARDS GRID */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">

        {/* PHONE CARD */}
        <ContactCard
          icon={Phone}
          title="Call Us"
          info="+91 9417894500"
          actionText="Call Now"
          actionLink="tel:+919417894500"
          delay={0}
          color="black"
        />

        {/* LOCATION CARD */}
        <ContactCard
          icon={MapPin}
          title="Visit Us"
          info="Gurudwara Road, Village Narainpura, Abohar"
          actionText="Open Maps"
          actionLink="https://maps.app.goo.gl/ynhTLCjV2jC65C446"
          delay={0.1}
          color="black"
          isExternal
        />

        {/* EMAIL CARD */}
        <ContactCard
          icon={Mail}
          title="Email Us"
          info="sutharbuildingmaterial@gmail.com"
          actionText="Send Email"
          actionLink="mailto:sutharbuildingmaterial@gmail.com"
          delay={0.2}
          color="black"
        />

        {/* HOURS CARD (Custom Layout) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -5 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-sm hover:shadow-xl border border-slate-100 hover:border-amber-200 transition-all duration-300 group h-full flex flex-col items-center justify-between"
        >
          <div className="flex flex-col items-center w-full">
            <div className="w-14 h-14 mb-4 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors group-hover:rotate-3 duration-300 shadow-sm">
              <Clock className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Open Hours</h3>
            <div className="space-y-1 mb-2">
              <p className="text-sm text-slate-600 font-medium">Everyday</p>
              <p className="text-lg font-bold text-slate-900">07:00 - 19:00</p>
            </div>
          </div>

        </motion.div>
      </div>

      {/* FORM + MAP SECTION */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">

        {/* CONTACT FORM */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/90 backdrop-blur rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-100 p-8 sm:p-10 relative overflow-hidden"
        >
          {/* Corner decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-bl-[100px] -z-10 opacity-50" />

          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Send a Message</h2>
          <p className="text-slate-500 mb-8">Fill out the form below and we'll get back to you within 2 hours.</p>

          <form className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputGroup label="Name" placeholder="John Doe" type="text" />
              <InputGroup label="Phone" placeholder="+91 98..." type="tel" />
            </div>

            <InputGroup label="Email Address" placeholder="john@example.com" type="email" />

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Message</label>
              <textarea
                rows={4}
                placeholder="How can we help you?"
                className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none font-medium placeholder:text-slate-400"
              ></textarea>
            </div>

            <button
              type="button"
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Send size={18} /> Send Message
            </button>
          </form>
        </motion.div>

        {/* GOOGLE MAP */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 border border-white ring-1 ring-slate-200 h-[500px] lg:h-[600px] relative group">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3456.7677912916783!2d74.3259273753414!3d29.95735717496753!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39170385426869b7%3A0x606a3f3668e5df6f!2sShuttering%20Building%20Material%20(SBM)!5e0!3m2!1sen!2sin!4v1764047130424!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            className="filter grayscale group-hover:grayscale-0 transition-all duration-700"></iframe>

          {/* Map Overlay Label */}
          <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md px-5 py-4 rounded-2xl shadow-lg border border-slate-100 flex items-start gap-3 max-w-xs">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">SBM</p>
              <p className="font-bold text-slate-800 text-sm leading-snug">Gurudwara Road, village Rampura Narainpura, Abohar </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

// --- REUSABLE COMPONENTS ---

function ContactCard({ icon: Icon, title, info, actionText, actionLink, delay, color, isExternal }: any) {

  let iconStyles = "";
  let btnStyles = "";

  // Dynamic Styles based on color prop
  switch (color) {
    case "emerald":
      iconStyles = "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100";
      btnStyles = "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 hover:shadow-emerald-300";
      break;
    case "blue":
      iconStyles = "bg-blue-50 text-blue-600 group-hover:bg-blue-100";
      btnStyles = "bg-blue-600 hover:bg-blue-700 shadow-blue-200 hover:shadow-blue-300";
      break;
    case "purple":
      iconStyles = "bg-purple-50 text-purple-600 group-hover:bg-purple-100";
      btnStyles = "bg-purple-600 hover:bg-purple-700 shadow-purple-200 hover:shadow-purple-300";
      break;
    default:
      iconStyles = "bg-slate-50 text-slate-600 group-hover:bg-slate-100";
      btnStyles = "bg-slate-800 hover:bg-slate-900 shadow-slate-200";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5 }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-sm hover:shadow-xl border border-slate-100 hover:border-emerald-100 transition-all duration-300 group h-full flex flex-col justify-between"
    >
      <div className="flex flex-col items-center w-full">
        <div className={`w-14 h-14 mb-4 rounded-2xl flex items-center justify-center transition-colors group-hover:rotate-3 duration-300 shadow-sm ${iconStyles}`}>
          <Icon className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
        <p className="text-slate-500 text-sm font-medium mb-6 break-all">{info}</p>
      </div>
      <a
        href={actionLink}
        target={isExternal ? "_blank" : undefined}
        className={`inline-flex items-center justify-center w-full py-3 rounded-xl text-white text-sm font-bold transition-all shadow-md ${btnStyles}`}
      >
        {actionText} {isExternal && <ExternalLink size={14} className="ml-1.5" />}
      </a>
    </motion.div>
  );
}

function InputGroup({ label, type, placeholder }: any) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700 ml-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium placeholder:text-slate-400"
      />
    </div>
  )
}