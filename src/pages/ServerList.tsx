import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Server, Plus, Search, Filter, ArrowUpRight, Cpu, HardDrive, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import ServerLiveStats from "../components/ServerLiveStats";

export default function ServerList() {
  const [servers, setServers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const { user } = useAuth();

  const fetchServers = async () => {
    try {
      const res = await axios.get("/api/servers");
      setServers(res.data);
    } catch(e) {
      console.error("Failed to fetch servers", e);
    }
  };

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredServers = servers.filter((server) => {
    const matchesSearch = server.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          server.version?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || server.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 text-gray-100"
    >
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 blur-[90px] pointer-events-none rounded-full" />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">Server Instances</h1>
          <p className="text-xs md:text-sm font-semibold text-gray-400 mt-1">Manage and monitor your active server fleet.</p>
        </div>
        
        {user?.role === "admin" && (
          <Link 
            to="/servers/create" 
            className="px-5 py-3 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold rounded-2xl transition-all shadow-lg shadow-sky-500/20 text-xs md:text-sm whitespace-nowrap inline-flex items-center gap-2 self-start md:self-auto relative z-10"
          >
            <Plus size={18} />
            <span>Deploy Instance</span>
          </Link>
        )}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search instances by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 backdrop-blur-xl border border-white/10 focus:border-sky-500/50 rounded-2xl py-2.5 pl-11 pr-4 text-xs md:text-sm text-white placeholder-gray-500 outline-none transition-all shadow-lg"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-xl p-1.5 border border-white/10 rounded-2xl w-full sm:w-auto justify-center">
          {(["all", "online", "offline"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                statusFilter === status 
                  ? "bg-white/10 text-white shadow-inner border border-white/10" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Server Grid/List */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:gap-5">
        <AnimatePresence>
          {filteredServers.map(server => (
            <motion.div 
              variants={itemAnim} 
              key={server.id} 
              layout
              className="bg-black/50 backdrop-blur-2xl rounded-3xl border border-white/10 p-5 md:p-6 flex flex-col group hover:bg-black/70 transition-all shadow-2xl relative overflow-hidden"
            >
              {/* Dynamic Status Glow Line */}
              <div 
                className={`absolute top-0 left-0 right-0 h-[2px] opacity-80 ${
                  server.status === 'online' 
                    ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.8)]' 
                    : 'bg-gradient-to-r from-transparent via-gray-600 to-transparent'
                }`} 
              />
              
              <Link to={`/servers/${server.id}`} className="block flex-1 z-10 relative">
                {/* Header row in Card */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-sky-500/40 group-hover:bg-sky-500/10 transition-all shadow-inner">
                      <Server className="w-6 h-6 text-gray-400 group-hover:text-sky-400 transition-colors" />
                    </div>
                    <div>
                      <h2 className="font-bold tracking-tight text-white text-base md:text-lg group-hover:text-sky-300 transition-colors drop-shadow-sm">
                        {server.name}
                      </h2>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className="flex h-2 w-2 relative">
                          {server.status === 'online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${server.status === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-gray-600'}`}></span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">{server.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Open Icon */}
                  <div className="p-2 text-gray-400 group-hover:text-white group-hover:bg-white/10 rounded-xl transition-all">
                    <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
                
                {/* Metrics Stats Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 px-4 border border-white/5 my-2 bg-white/[0.02] rounded-2xl text-xs">
                  <div>
                    <p className="text-sky-400/80 text-[10px] font-mono font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Cpu size={12} /> CPU Limit
                    </p>
                    <p className="font-mono text-white font-bold text-xs md:text-sm">{server.cpu || 100} <span className="text-gray-500">%</span></p>
                  </div>
                  <div>
                    <p className="text-emerald-400/80 text-[10px] font-mono font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Layers size={12} /> RAM Usage
                    </p>
                    <div className="font-mono text-white font-bold text-xs md:text-sm">
                      <ServerLiveStats serverId={server.id} limitRam={server.ram} status={server.status} />
                    </div>
                  </div>
                  <div>
                    <p className="text-amber-400/80 text-[10px] font-mono font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <HardDrive size={12} /> Disk Limit
                    </p>
                    <p className="font-mono text-white font-bold text-xs md:text-sm">{server.disk || 10} <span className="text-gray-500">GB</span></p>
                  </div>
                  <div>
                    <p className="text-purple-400/80 text-[10px] font-mono font-bold uppercase tracking-wider mb-1">Version</p>
                    <p className="text-white font-bold text-xs md:text-sm truncate font-mono" title={server.version}>
                      {server.version || "N/A"}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {filteredServers.length === 0 && (
          <motion.div 
            variants={itemAnim} 
            className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-3xl bg-black/20"
          >
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                <Server className="w-8 h-8 opacity-40 text-sky-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Instances Found</h3>
            <p className="max-w-xs text-center text-xs text-gray-400 mb-6">
              {searchQuery ? "No server matches your search filter." : "You haven't deployed any servers yet."}
            </p>
            {user?.role === "admin" && !searchQuery && (
              <Link 
                to="/servers/create" 
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-sky-500/20 text-xs"
              >
                Deploy your first instance
              </Link>
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
          }
              
