import { Link, useLocation } from "react-router-dom";
import { Server, LayoutDashboard, Plus, LogOut, X, Settings, Key, Package, CreditCard, Globe, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { motion } from "framer-motion";

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { panelName, panelLogo } = useSettings();
  
  const links = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard size={17} />, exact: true },
    { name: "My Servers", path: "/servers", icon: <Server size={17} /> },
    { name: "Hosting Plans", path: "/plans", icon: <Package size={17} /> },
  ];

  if (user?.role === "admin") {
    links.push({ name: "Deploy Server", path: "/servers/create", icon: <Plus size={17} />, exact: false });
    links.push({ name: "API Keys", path: "/api-keys", icon: <Key size={17} />, exact: false });
  }

  links.push({ name: "Settings", path: "/settings", icon: <Settings size={17} />, exact: false });

  const isActive = (link: any) => link.exact
    ? location.pathname === link.path
    : (location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path)));

  return (
    <div className="w-64 h-full flex flex-col py-5 border-r border-white/10 relative z-20"
      style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.45) 100%)", backdropFilter: "blur(24px)" }}>
      
      {onClose && (
        <button onClick={onClose} className="md:hidden flex items-center justify-center absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
          <X size={18} />
        </button>
      )}
      
      {/* Logo / Brand */}
      <div className="px-5 mb-8 mt-1">
        <div className="flex items-center gap-3">
          {panelLogo ? (
            <img src={panelLogo} alt="Logo" className="w-9 h-9 rounded-xl object-cover shadow-[0_0_15px_rgba(16,185,129,0.3)] flex-shrink-0" />
          ) : (
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              style={{ background: "linear-gradient(135deg, #10b981, #0ea5e9)" }}>
              <Zap className="w-4.5 h-4.5 text-white" size={18} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-[15px] font-extrabold text-white tracking-tight truncate leading-tight">{panelName}</h1>
            <p className="text-[9px] text-emerald-400/80 font-bold uppercase tracking-widest">Control Panel</p>
          </div>
        </div>

        {/* Thin separator */}
        <div className="mt-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 w-full px-3 space-y-0.5">
        {/* Section label */}
        <p className="px-3 text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2">Navigation</p>

        {links.map(link => {
          const active = isActive(link);
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={onClose}
              className={`relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all group overflow-hidden text-sm font-medium ${
                active ? 'text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(14,165,233,0.15))", borderLeft: "2px solid rgba(16,185,129,0.6)" }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 350, damping: 35 }}
                />
              )}
              <span className={`relative z-10 transition-colors ${active ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                {link.icon}
              </span>
              <span className="relative z-10">{link.name}</span>

              {active && (
                <span className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="w-full px-4 mt-4 space-y-2">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-3" />

        {/* User card */}
        <div className="relative rounded-2xl p-3 flex items-center gap-3 border border-white/5 overflow-hidden group cursor-default"
          style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.05), rgba(14,165,233,0.05))" }} />
          
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-[0_0_10px_rgba(16,185,129,0.3)] flex-shrink-0 relative z-10"
            style={{ background: "linear-gradient(135deg, #10b981, #0ea5e9)" }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="overflow-hidden flex-1 relative z-10">
            <p className="font-bold text-white truncate text-[13px] tracking-tight">{user?.username}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest truncate"
              style={{ color: user?.role === 'admin' ? '#10b981' : '#64748b' }}>
              {user?.role || "User"}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all group text-sm font-medium"
        >
          <LogOut size={16} className="group-hover:scale-110 transition-transform shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
