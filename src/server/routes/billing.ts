import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { readJSON, writeJSON } from "../services/db.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// --- Plans (admin CRUD) ---

router.get("/plans", requireAuth, async (req, res) => {
  const plans = await readJSON("plans.json") || [];
  res.json(plans);
});

router.post("/plans", requireAuth, async (req: any, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { name, price, ram, cpu, disk, maxServers, description, featured, color } = req.body;
  if (!name || !price || !ram) return res.status(400).json({ error: "Name, price, and RAM required" });

  const plans = await readJSON("plans.json") || [];
  const plan = {
    id: uuidv4(),
    name,
    price: Number(price),
    ram: Number(ram),
    cpu: Number(cpu) || 100,
    disk: Number(disk) || 10,
    maxServers: Number(maxServers) || 1,
    description: description || "",
    featured: !!featured,
    color: color || "emerald",
    createdAt: new Date().toISOString(),
  };
  plans.push(plan);
  await writeJSON("plans.json", plans);
  res.status(201).json(plan);
});

router.put("/plans/:id", requireAuth, async (req: any, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const plans = await readJSON("plans.json") || [];
  const idx = plans.findIndex((p: any) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Plan not found" });

  const { name, price, ram, cpu, disk, maxServers, description, featured, color } = req.body;
  plans[idx] = { ...plans[idx], name, price: Number(price), ram: Number(ram), cpu: Number(cpu) || 100, disk: Number(disk) || 10, maxServers: Number(maxServers) || 1, description, featured: !!featured, color };
  await writeJSON("plans.json", plans);
  res.json(plans[idx]);
});

router.delete("/plans/:id", requireAuth, async (req: any, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  let plans = await readJSON("plans.json") || [];
  plans = plans.filter((p: any) => p.id !== req.params.id);
  await writeJSON("plans.json", plans);
  res.json({ success: true });
});

// --- Subscriptions ---

router.get("/my-subscription", requireAuth, async (req: any, res) => {
  const subs = await readJSON("subscriptions.json") || [];
  const sub = subs.find((s: any) => s.userId === req.user.id && s.status === "active");
  res.json(sub || null);
});

router.get("/subscriptions", requireAuth, async (req: any, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const subs = await readJSON("subscriptions.json") || [];
  res.json(subs);
});

router.post("/subscribe/:planId", requireAuth, async (req: any, res) => {
  const plans = await readJSON("plans.json") || [];
  const plan = plans.find((p: any) => p.id === req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  let subs = await readJSON("subscriptions.json") || [];
  // Cancel existing subscription
  subs = subs.map((s: any) => s.userId === req.user.id && s.status === "active" ? { ...s, status: "cancelled" } : s);

  const nextBilling = new Date();
  nextBilling.setMonth(nextBilling.getMonth() + 1);

  const newSub = {
    id: uuidv4(),
    userId: req.user.id,
    planId: plan.id,
    planName: plan.name,
    status: "active",
    startDate: new Date().toISOString(),
    nextBilling: nextBilling.toISOString(),
    ram: plan.ram,
    cpu: plan.cpu,
    disk: plan.disk,
    maxServers: plan.maxServers,
    price: plan.price,
  };
  subs.push(newSub);
  await writeJSON("subscriptions.json", subs);
  res.status(201).json(newSub);
});

router.post("/cancel", requireAuth, async (req: any, res) => {
  let subs = await readJSON("subscriptions.json") || [];
  subs = subs.map((s: any) => s.userId === req.user.id && s.status === "active" ? { ...s, status: "cancelled" } : s);
  await writeJSON("subscriptions.json", subs);
  res.json({ success: true });
});

export default router;
