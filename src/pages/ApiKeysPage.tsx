import React from "react";
import { motion } from "framer-motion";
import { Key, ShieldAlert, ShieldCheck } from "lucide-react";
import ApiKeysManager from "../components/ApiKeysManager";
import { useAuth } from "../context/AuthContext";

export default function ApiKeysPage() {
  const { user } = useAuth();

  // Non-Admin Permission Denied View
  if (user?.role !== "admin") {
    return (
      <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 mb-4 text-red-400">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Access Restricted</h2>
        <p className="text-xs text-zinc-400 max-w-xs">
          You do not have administrative privileges to manage system API keys.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 text-white"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-6 h-6 text-sky-400" />
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">API Management</h1>
          </div>
          <p className="text-xs text-zinc-400">
            Generate and control authentication keys for automated panel integrations.
          </p>
        </div>

        {/* Security Badge */}
        <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-xl text-xs text-sky-300 font-medium self-start md:self-auto">
          <ShieldCheck size={14} />
          <span>Admin Access Only</span>
        </div>
      </div>

      {/* Main API Manager Component */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-6 shadow-2xl">
        <ApiKeysManager />
      </div>
    </motion.div>
  );
}
