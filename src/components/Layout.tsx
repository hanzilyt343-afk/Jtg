import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, X } from "lucide-react";
import { useLocation, matchPath } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { panelName, panelLogo } = useSettings();

  const isServerView = matchPath("/servers/:id/*", location.pathname) && !matchPath("/servers/create", location.pathname);

  // If viewing individual server pages (Console, File Manager, etc.)
  if (isServerView) {
    return (
      <div className="flex h-[100dvh] w-full bg-[#030408] text-gray-100 font-sans overflow-hidden selection:bg-sky-500/30">
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          {/* Cyber Ambient Lighting Effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[350px] bg-sky-500/10 blur-[130px] rounded-full pointer-events-none z-0" />
          <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none z-0" />

          <main className="flex-1 w-full h-full relative z-10 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full bg-[#030408] text-gray-100 font-sans overflow-hidden selection:bg-sky-500/30">
      
      {/* Mobile Overlay with Blur */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 md:hidden" 
            onClick={() => setMobileOpen(false)} 
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 transform flex-shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition-transform duration-300 cubic-bezier(0.22, 1, 0.36, 1)`}
      >
        <Sidebar onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        
        {/* Background Ambient Lights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none z-0" />
        <div className="absolute top-10 left-10 w-80 h-80 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none z-0" />

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-black/60 backdrop-blur-xl border-b border-white/10 flex-shrink-0 relative z-20 shadow-xl">
          <div className="flex items-center gap-3">
            {panelLogo ? (
              <img src={panelLogo} alt="Logo" className="w-8 h-8 rounded-xl object-cover border border-white/10 shadow-lg shadow-sky-500/20" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 border border-white/20 shadow-lg shadow-sky-500/30 flex items-center justify-center font-bold text-white text-xs">
                {panelName ? panelName.charAt(0) : "M"}
              </div>
            )}
            <h1 className="text-base font-extrabold tracking-tight text-white truncate max-w-[180px]">
              {panelName || "Panel"}
            </h1>
          </div>

          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            className="p-2.5 text-gray-300 hover:text-white bg-white/5 active:scale-95 border border-white/10 rounded-xl transition-all shadow-md"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </header>
        
        {/* Children Render Area */}
        <main className="flex-1 w-full h-full relative z-10 overflow-x-hidden overflow-y-auto custom-scrollbar pb-safe">
          {children}
        </main>
      </div>
    </div>
  );
              }
