import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  Package, Plus, Trash2, Check, Zap, Server, HardDrive, Cpu, MemoryStick,
  Edit3, X, AlertCircle, Star, Crown, Sparkles, Globe
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  ram: number;
  cpu: number;
  disk: number;
  maxServers: number;
  description: string;
  featured?: boolean;
  color?: string;
  createdAt: string;
}

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: "active" | "cancelled" | "expired";
  startDate: string;
  nextBilling: string;
}

const PLAN_COLORS: Record<string, string> = {
  emerald: "from-emerald-500 to-teal-600",
  sky: "from-sky-500 to-indigo-600",
  purple: "from-purple-500 to-pink-600",
  amber: "from-amber-500 to-orange-600",
};

export default function PlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: "", ram: "", cpu: "", disk: "", maxServers: "1", description: "", featured: false, color: "emerald" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        axios.get("/api/billing/plans"),
        axios.get("/api/billing/my-subscription").catch(() => ({ data: null })),
      ]);
      setPlans(plansRes.data || []);
      setSubscription(subRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name || !form.price || !form.ram) {
      setFormError("Name, price, and RAM are required.");
      return;
    }
    setSaving(true);
    try {
      if (editingPlan) {
        await axios.put(`/api/billing/plans/${editingPlan.id}`, form);
      } else {
        await axios.post("/api/billing/plans", form);
      }
      setShowCreateModal(false);
      setEditingPlan(null);
      setForm({ name: "", price: "", ram: "", cpu: "", disk: "", maxServers: "1", description: "", featured: false, color: "emerald" });
      await fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to save plan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    await axios.delete(`/api/billing/plans/${id}`);
    await fetchData();
  };

  const handleSubscribe = async (plan: Plan) => {
    setSubscribing(plan.id);
    try {
      await axios.post(`/api/billing/subscribe/${plan.id}`);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Subscription failed.");
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Cancel your current subscription?")) return;
    await axios.post("/api/billing/cancel");
    await fetchData();
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      price: String(plan.price),
      ram: String(plan.ram),
      cpu: String(plan.cpu),
      disk: String(plan.disk),
      maxServers: String(plan.maxServers),
      description: plan.description || "",
      featured: plan.featured || false,
      color: plan.color || "emerald",
    });
    setShowCreateModal(true);
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-sky-500/20 border-t-sky-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-sky-500/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <Package className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Hosting Plans</h1>
          </div>
          <p className="text-sm text-gray-400 font-medium">Choose the perfect plan for your Minecraft servers</p>
        </div>
        {user?.role === "admin" && (
          <button
            onClick={() => { setEditingPlan(null); setForm({ name: "", price: "", ram: "", cpu: "", disk: "", maxServers: "1", description: "", featured: false, color: "emerald" }); setShowCreateModal(true); }}
            className="relative z-10 flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-sm font-bold text-white transition-all shadow-lg shadow-emerald-500/20 self-start md:self-auto"
          >
            <Plus size={18} /> New Plan
          </button>
        )}
      </div>

      {/* Active Subscription Banner */}
      {subscription && subscription.status === "active" && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-300">Active Plan: {subscription.planName}</p>
              <p className="text-xs text-emerald-400/70">Next billing: {new Date(subscription.nextBilling).toLocaleDateString()}</p>
            </div>
          </div>
          <button onClick={handleCancelSubscription} className="text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors">Cancel</button>
        </div>
      )}

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
            <Package className="w-7 h-7 text-gray-500" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No Plans Yet</h3>
          <p className="text-xs text-gray-400">{user?.role === "admin" ? "Create your first hosting plan above." : "No plans available. Check back later."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan, i) => {
            const grad = PLAN_COLORS[plan.color || "emerald"] || PLAN_COLORS.emerald;
            const isCurrentPlan = subscription?.planId === plan.id && subscription?.status === "active";
            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className={`relative bg-black/50 backdrop-blur-2xl rounded-3xl border overflow-hidden shadow-xl transition-all group ${plan.featured ? 'border-emerald-500/40 shadow-emerald-500/10' : 'border-white/10 hover:border-white/20'}`}
              >
                {plan.featured && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">
                    <Star size={10} /> Popular
                  </div>
                )}

                {/* Gradient top bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${grad}`} />

                <div className="p-6 space-y-5">
                  {/* Plan Name & Price */}
                  <div>
                    <h3 className="text-lg font-extrabold text-white tracking-tight">{plan.name}</h3>
                    {plan.description && <p className="text-xs text-gray-400 mt-1">{plan.description}</p>}
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">${Number(plan.price).toFixed(2)}</span>
                      <span className="text-xs text-gray-500 font-medium">/month</span>
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="space-y-2.5">
                    {[
                      { icon: <MemoryStick size={14} />, label: `${plan.ram} GB RAM` },
                      { icon: <Cpu size={14} />, label: `${plan.cpu || 100}% CPU` },
                      { icon: <HardDrive size={14} />, label: `${plan.disk || 10} GB Storage` },
                      { icon: <Server size={14} />, label: `${plan.maxServers || 1} Server${(plan.maxServers || 1) > 1 ? 's' : ''}` },
                    ].map((spec, si) => (
                      <div key={si} className="flex items-center gap-2.5 text-xs text-gray-300">
                        <span className="text-emerald-400">{spec.icon}</span>
                        <span>{spec.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-1">
                    {isCurrentPlan ? (
                      <div className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-bold text-emerald-400">
                        <Check size={14} /> Current Plan
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(plan)}
                        disabled={!!subscribing}
                        className={`flex-1 py-2.5 rounded-2xl text-xs font-bold text-white transition-all shadow-lg disabled:opacity-50 bg-gradient-to-r ${grad} hover:opacity-90 active:scale-95`}
                      >
                        {subscribing === plan.id ? "Processing..." : subscription ? "Switch Plan" : "Get Started"}
                      </button>
                    )}
                    {user?.role === "admin" && (
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(plan)} className="p-2.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleDeletePlan(plan.id)} className="p-2.5 rounded-2xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editingPlan ? "Edit Plan" : "New Hosting Plan"}</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white transition-colors p-1"><X size={18} /></button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                <AlertCircle size={14} className="shrink-0" />{formError}
              </div>
            )}

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Plan Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Starter, Pro, Enterprise" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500/40 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Price ($/month) *</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required placeholder="9.99" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500/40 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1.5 block">RAM (GB) *</label>
                  <input type="number" min="1" value={form.ram} onChange={e => setForm(f => ({ ...f, ram: e.target.value }))} required placeholder="2" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500/40 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1.5 block">CPU (%)</label>
                  <input type="number" min="10" max="1000" value={form.cpu} onChange={e => setForm(f => ({ ...f, cpu: e.target.value }))} placeholder="100" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500/40 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Disk (GB)</label>
                  <input type="number" min="1" value={form.disk} onChange={e => setForm(f => ({ ...f, disk: e.target.value }))} placeholder="10" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500/40 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Max Servers</label>
                  <input type="number" min="1" value={form.maxServers} onChange={e => setForm(f => ({ ...f, maxServers: e.target.value }))} placeholder="1" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500/40 transition-all" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Description</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Perfect for small servers..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500/40 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Color Theme</label>
                  <select value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/40 transition-all">
                    {Object.keys(PLAN_COLORS).map(c => <option key={c} value={c} className="bg-zinc-900 capitalize">{c}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <input id="featured" type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 accent-emerald-500 rounded" />
                  <label htmlFor="featured" className="text-xs text-gray-300 font-semibold">Mark as Featured / Popular</label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all disabled:opacity-50">
                  {saving ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
