import React, { useEffect, useState } from "react";
import axios from "axios";
import { Server, Activity, Cpu, MemoryStick, ChevronRight, Plus, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [servers, setServers] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, serversRes] = await Promise.all([
          axios.get("/api/system/stats"),
          axios.get("/api/servers")
        ]);
        setStats(statsRes.data);
        setServers(serversRes.data);
      } catch(e) {
        console.error("Failed to fetch system stats or servers", e);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 min-h-[60vh]">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 border-2 border-sky-500/20 border-t-sky-400 rounded-full animate-spin"></div>
        <div className="absolute w-10 h-10 border-2 border-indigo-500/20 border-b-indigo-400 rounded-full animate-spin [animation-direction:reverse]"></div>
      </div>
      <p className="mt-4 text-xs font-mono uppercase tracking-widest text-gray-500 animate-pulse">Loading Infrastructure...</p>
    </div>
  );

  const runningServers = servers.filter(s => s.status === 'online').length;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 text-gray-100"
    >
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">System Overview</h1>
          <p className="text-xs md:text-sm font-semibold text-gray-400 mt-1">Real-time infrastructure performance and active server instances.</p>
        </div>
        
        {user?.role === "admin" && (
          <Link 
            to="/servers/create" 
            className="px-5 py-3 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold rounded-2xl transition-all shadow-lg shadow-sky-500/20 text-xs md:text-sm whitespace-nowrap inline-flex items-center gap-2 self-start md:self-auto relative z-10"
          >
            <Plus size={18} />
            <span>Deploy New Server</span>
          </Link>
        )}
      </div>
      
      {/* Metric Cards Grid */}
      <motion.div 
        variants={container} 
        initial="hidden" 
        animate="show" 
        className={`grid grid-cols-1 md:grid-cols-2 ${user?.role === 'admin' ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-5`}
      >
        <StatCard 
          title="Total Servers" 
          value={servers.length.toString()} 
          icon={<Server size={22} className="text-sky-400" />} 
          trend="Provisioned" 
          chartColor="from-sky-500/20 to-sky-500/0" 
          borderColor="hover:border-sky-500/30"
        />
        <StatCard 
          title="Running Servers" 
          value={runningServers.toString()} 
          icon={<Activity size={22} className="text-emerald-400" />} 
          trend="Active Online" 
          chartColor="from-emerald-500/20 to-emerald-500/0" 
          borderColor="hover:border-emerald-500/30"
        />
        {user?.role === "admin" && (
          <>
            <StatCard 
              title="CPU Usage" 
              value={`${stats.cpuUsage}%`} 
              icon={<Cpu size={22} className="text-blue-400" />} 
              trend="Dedicated Core Load" 
              chartColor="from-blue-500/20 to-blue-500/0" 
              borderColor="hover:border-blue-500/30"
            />
            <StatCard 
              title="RAM Usage" 
              value={`${stats.ramUsage}%`} 
              icon={<MemoryStick size={22} className="text-purple-400" />} 
              trend="Memory Allocation" 
              chartColor="from-purple-500/20 to-purple-500/0" 
              borderColor="hover:border-purple-500/30"
            />
          </>
        )}
      </motion.div>

      {/* Activity List Container */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Recent Server Activity
          </h2>
          <Link to="/servers" className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center transition-colors gap-1 group">
            View All Instances <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2, duration: 0.4 }} 
          className="bg-black/50 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative"
        >
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
          
          {servers.length === 0 ? (
             <div className="p-12 text-center relative overflow-hidden">
               <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-inner">
                  <Server className="text-gray-500" size={32} />
               </div>
               <h3 className="text-base font-bold text-white mb-1">No Active Servers</h3>
               <p className="text-gray-400 text-xs font-medium">Create a new server instance to start monitoring activities.</p>
             </div>
          ) : (
            <div className="divide-y divide-white/5">
              {servers.slice(0, 5).map((server, index) => (
                <motion.div 
                  key={server.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + (index * 0.04) }}
                >
                  <Link 
                    to={`/servers/${server.id}`} 
                    className="flex items-center justify-between p-4 md:p-5 hover:bg-white/[0.03] transition-all group relative overflow-hidden"
                  >
                    <div className="flex items-center gap-4 relative z-10 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-sky-500/40 group-hover:bg-sky-500/10 transition-all shadow-inner shrink-0">
                        <Server className="w-5 h-5 text-gray-400 group-hover:text-sky-400 transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-100 group-hover:text-sky-300 transition-colors text-sm md:text-base truncate">
                          {server.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex h-2 w-2 relative shrink-0">
                            {server.status === 'online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${server.status === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-gray-600'}`}></span>
                          </span>
                          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">{server.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 relative z-10 shrink-0">
                      <div className="text-[11px] font-mono text-gray-400 hidden sm:block bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                        {new Date(server.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="p-2 text-gray-400 group-hover:text-white group-hover:bg-white/10 rounded-xl transition-all">
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon, trend, chartColor, borderColor }: { title: string, value: string, icon: React.ReactNode, trend?: string, chartColor: string, borderColor: string }) {
  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };
  return (
    <motion.div 
      variants={itemAnim} 
      className={`bg-black/50 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 ${borderColor} relative overflow-hidden group transition-all shadow-xl`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${chartColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner group-hover:scale-105 transition-transform">
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <h3 className="text-3xl font-extrabold text-white tracking-tight mb-1">{value}</h3>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
      </div>
      {trend && (
        <div className="relative z-10 mt-4 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
          {trend}
        </div>
      )}
    </motion.div>
  );
      }
            
