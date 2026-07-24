import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Server, ArrowLeft, Cpu, HardDrive, MemoryStick, Globe, User, AlertTriangle, Sparkles, Check, Box, FastForward, Network, Wrench, Feather, CheckCircle2, Smartphone, Terminal, Zap
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import SearchableDropdown from "../components/SearchableDropdown";

const SOFT_TYPES = [
  { id: "PAPER", name: "Paper", desc: "Vanilla", port: "25565", icon: Zap, color: "amber" },
  { id: "POCKETMINE", name: "PocketMine-MP", desc: "Bedrock Edition", port: "19132", icon: Smartphone, color: "emerald" },
  { id: "VPS", name: "Linux VPS", desc: "Ubuntu Terminal", port: "2222", icon: Terminal, color: "sky" },
  { id: "VELOCITY", name: "Velocity", desc: "Next-gen Proxy", port: "25577", icon: FastForward, color: "cyan" },
  { id: "BUNGEECORD", name: "BungeeCord", desc: "Proxy", port: "25577", icon: Network, color: "orange" },
  { id: "FORGE", name: "Forge", desc: "Modded", port: "25565", icon: Wrench, color: "stone" },
  { id: "FABRIC", name: "Fabric", desc: "Lightweight", port: "25565", icon: Feather, color: "indigo" },
];

export default function CreateServer() {
  const [form, setForm] = useState({ name: "", ram: "4", cpu: "150", disk: "10", port: "25565", ipAlias: "", type: "PAPER", version: "1.21.1", owner: "" });
  const [versions, setVersions] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sysRam, setSysRam] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user } = useAuth();

  const updateForm = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  const handleRam = (val: number) => {
    const cpus = [100, 150, 200, 300, 400, 500, 600, 800];
    const idx = [2, 4, 8, 16, 24, 32, 48, 64].indexOf(val);
    updateForm("ram", val.toString());
    updateForm("cpu", (idx !== -1 ? cpus[idx] : 150).toString());
  };

  const handleSoftware = (soft: typeof SOFT_TYPES[0]) => {
    setForm(p => ({ ...p, type: soft.id, port: soft.port }));
  };

  useEffect(() => {
    axios.get(`/api/system/versions?type=${form.type}`)
      .then(r => { setVersions(r.data); if (r.data[0]) updateForm("version", r.data[0]); })
      .catch(() => {
        const fallbacks: Record<string, string[]> = {
          POCKETMINE: ["5.10.0", "5.0.0"], VPS: ["Ubuntu 22.04 LTS", "Debian 12"]
        };
        setVersions(fallbacks[form.type] || ["1.21.1", "1.20.4"]);
      });
  }, [form.type]);

  useEffect(() => {
    axios.get("/api/system/stats").then(r => setSysRam(r.data.totalMemory / (1024 ** 3))).catch(() => {});
    axios.get("/api/auth/users").then(r => {
      setUsers(r.data);
      if (r.data.length) updateForm("owner", r.data.find((u: any) => u.id === user?.id)?.id || r.data[0].id);
    }).catch(() => {});
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sysRam > 0 && Number(form.ram) > sysRam && !showWarning) return setShowWarning(true);
    executeSubmit();
  };

  const executeSubmit = async () => {
    setShowWarning(false);
    setLoading(true);
    setProgress(10);
    setError(null);

    try {
      await axios.post("/api/servers", { ...form, ram: Number(form.ram), cpu: Number(form.cpu), disk: Number(form.disk), port: Number(form.port) });
      setProgress(100);
      setTimeout(() => navigate("/servers"), 500);
    } catch (e: any) {
      setError(e.response?.data?.error || "Deployment failed");
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-8 max-w-3xl mx-auto text-white space-y-6">
      <div>
        <Link to="/servers" className="inline-flex items-center text-xs text-zinc-400 hover:text-white mb-2"><ArrowLeft size={14} className="mr-1" /> Back</Link>
        <h1 className="text-3xl font-extrabold">Deploy Instance</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-black/50 p-6 rounded-3xl border border-white/10 space-y-6 relative overflow-hidden backdrop-blur-xl">
        {/* Name Input */}
        <div>
          <label className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-2"><Server size={14} className="text-sky-400"/> Instance Name</label>
          <input required type="text" value={form.name} onChange={e => updateForm("name", e.target.value)} placeholder="e.g. Bedrock World" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-500" />
        </div>

        {/* Resource Allocation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-2"><MemoryStick size={14} className="text-purple-400"/> RAM (GB)</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mb-2">
              {[2, 4, 8, 16, 24, 32, 48, 64].map(v => (
                <button key={v} type="button" onClick={() => handleRam(v)} className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${form.ram === v.toString() ? "bg-sky-500/20 border-sky-500 text-sky-300" : "bg-black/40 border-white/10 text-zinc-400"}`}>{v}GB</button>
              ))}
            </div>
            <input type="number" min={1} required value={form.ram} onChange={e => updateForm("ram", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono" />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-2"><Cpu size={14} className="text-blue-400"/> CPU (%)</label>
            <input type="number" required value={form.cpu} onChange={e => updateForm("cpu", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono" />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-2"><HardDrive size={14} className="text-emerald-400"/> Disk (GB)</label>
            <input type="number" required value={form.disk} onChange={e => updateForm("disk", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono" />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-2"><Globe size={14} className="text-amber-400"/> Port</label>
            <input type="number" required value={form.port} onChange={e => updateForm("port", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono" />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-2"><Globe size={14} className="text-sky-400"/> IP Alias</label>
            <input type="text" value={form.ipAlias} onChange={e => updateForm("ipAlias", e.target.value)} placeholder="play.domain.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono" />
          </div>
        </div>

        {/* Owner */}
        <div>
          <label className="text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-2"><User size={14} className="text-sky-400"/> Assign Owner</label>
          <SearchableDropdown value={form.owner} onChange={v => updateForm("owner", v)} options={users.map(u => ({ value: u.id, label: u.username }))} placeholder="Select user..." searchPlaceholder="Search..." />
        </div>

        {/* Software Selector */}
        <div>
          <label className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-2"><Box size={14} className="text-sky-400"/> Software Template</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SOFT_TYPES.map(s => {
              const active = form.type === s.id;
              const Icon = s.icon;
              return (
                <button key={s.id} type="button" onClick={() => handleSoftware(s)} className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center transition-all ${active ? "bg-sky-500/20 border-sky-500 text-white" : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"}`}>
                  <Icon size={20} className="mb-1" />
                  <span className="text-xs font-bold">{s.name}</span>
                  <span className="text-[10px] opacity-60">{s.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Version */}
        <div>
          <label className="text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-2"><Box size={14} className="text-cyan-400"/> Version</label>
          <SearchableDropdown value={form.version} onChange={v => updateForm("version", v)} options={versions.map(v => ({ value: v, label: v }))} placeholder="Select version..." searchPlaceholder="Search..." className="font-mono" />
        </div>

        {/* Actions */}
        {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle size={14}/> {error}</p>}
        <button type="submit" disabled={loading} className="w-full py-3 bg-sky-600 hover:bg-sky-500 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all">
          <Sparkles size={16} /> {loading ? "Deploying..." : "Launch Instance"}
        </button>
      </form>
    </motion.div>
  );
}
  
