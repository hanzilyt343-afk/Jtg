import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, Key, RefreshCw, Loader2, Copy, Check, AlertTriangle,
  Cpu, HardDrive, MemoryStick, Server, Wifi, ExternalLink, Eye, EyeOff, RotateCcw
} from "lucide-react";

export default function VpsManagement({ serverId, server }: { serverId: string; server: any }) {
  const [tmate, setTmate] = useState<{ ssh: string; web: string } | null>(null);
  const [tmatLoading, setTmateLoading] = useState(false);
  const [tmateError, setTmateError] = useState<string | null>(null);

  const [sshKeys, setSshKeys] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const [reinstalling, setReinstalling] = useState(false);
  const [reinstallConfirm, setReinstallConfirm] = useState(false);
  const [reinstallMsg, setReinstallMsg] = useState<string | null>(null);

  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(key);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const generateTmate = async () => {
    setTmateLoading(true);
    setTmateError(null);
    setTmate(null);
    try {
      const res = await axios.get(`/api/servers/${serverId}/vps/tmate`);
      setTmate(res.data);
    } catch (e: any) {
      setTmateError(e.response?.data?.error || "Failed to generate tmate session");
    } finally {
      setTmateLoading(false);
    }
  };

  const generateSshKeys = async () => {
    setKeysLoading(true);
    setKeysError(null);
    setSshKeys(null);
    try {
      const res = await axios.post(`/api/servers/${serverId}/vps/ssh-keys`);
      setSshKeys(res.data);
    } catch (e: any) {
      setKeysError(e.response?.data?.error || "Failed to generate SSH keys");
    } finally {
      setKeysLoading(false);
    }
  };

  const handleReinstall = async () => {
    setReinstalling(true);
    setReinstallMsg(null);
    setReinstallConfirm(false);
    try {
      const res = await axios.post(`/api/servers/${serverId}/vps/reinstall`);
      setReinstallMsg(res.data.message || "VPS reinstalled successfully.");
    } catch (e: any) {
      setReinstallMsg("Error: " + (e.response?.data?.error || e.message));
    } finally {
      setReinstalling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-6 h-full overflow-y-auto custom-scrollbar"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Server className="w-6 h-6 text-sky-400" />
            VPS Management
          </h1>
          <p className="text-zinc-400 text-sm">Manage your Linux VPS container.</p>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "RAM", value: `${server?.ram || "?"} GB`, icon: MemoryStick, color: "text-purple-400" },
            { label: "CPU", value: `${server?.cpu || "?"}%`, icon: Cpu, color: "text-blue-400" },
            { label: "Disk", value: `${server?.disk || "?"} GB`, icon: HardDrive, color: "text-emerald-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex flex-col items-center gap-1">
              <Icon size={18} className={color} />
              <p className="text-xs text-zinc-500 font-medium">{label}</p>
              <p className="text-white font-bold font-mono text-sm">{value}</p>
            </div>
          ))}
        </div>

        {/* Access Info */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
          <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
            <Terminal size={16} className="text-sky-400" /> SSH Access
          </h2>
          <p className="text-zinc-400 text-xs mb-3">
            SSH is configured on port <code className="text-sky-300 font-mono font-bold">{server?.port || 2222}</code> with key-based auth only.
            Generate an SSH key pair below, then connect with:
          </p>
          <div className="bg-black/40 rounded-lg p-3 flex items-center justify-between gap-2 mb-3">
            <code className="text-emerald-300 font-mono text-xs">
              ssh -i id_rsa -p {server?.port || 2222} root@YOUR_HOST_IP
            </code>
            <button
              onClick={() => copyText(`ssh -i id_rsa -p ${server?.port || 2222} root@YOUR_HOST_IP`, "ssh-cmd")}
              className="text-zinc-400 hover:text-white transition-colors shrink-0"
            >
              {copiedItem === "ssh-cmd" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          </div>
          <ul className="text-zinc-400 text-xs space-y-1 list-disc list-inside">
            <li><span className="text-white font-medium">Tmate</span> — browser/SSH session without needing a public IP (below)</li>
            <li><span className="text-white font-medium">File Manager tab</span> — browse and edit files in the panel</li>
            <li><span className="text-white font-medium">Console tab</span> — send commands directly to the container</li>
            <li><span className="text-white font-medium">SFTP tab</span> — file transfers via any SFTP client</li>
          </ul>
        </div>

        {/* Tmate SSH Terminal */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Wifi size={16} className="text-indigo-400" /> Tmate Web Terminal
              </h2>
              <p className="text-zinc-400 text-xs mt-0.5">Get an on-demand public SSH/browser session via tmate. VPS must be running. Session expires if the container restarts — click Generate again to create a new one.</p>
            </div>
            <button
              onClick={generateTmate}
              disabled={tmatLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-sm font-medium rounded-xl transition-all disabled:opacity-50"
            >
              {tmatLoading ? <Loader2 size={14} className="animate-spin" /> : <Terminal size={14} />}
              {tmatLoading ? "Starting..." : "Generate Session"}
            </button>
          </div>

          {tmateError && (
            <p className="text-red-400 text-xs flex items-center gap-1 mt-2">
              <AlertTriangle size={12} /> {tmateError}
            </p>
          )}

          <AnimatePresence>
            {tmate && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 mt-3">
                {tmate.ssh && (
                  <div className="bg-black/40 rounded-lg p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-zinc-500 text-[10px] mb-1 uppercase tracking-wider">SSH Command</p>
                      <code className="text-emerald-300 font-mono text-xs truncate block">{tmate.ssh}</code>
                    </div>
                    <button onClick={() => copyText(tmate.ssh, "tmate-ssh")} className="text-zinc-400 hover:text-white transition-colors shrink-0">
                      {copiedItem === "tmate-ssh" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                )}
                {tmate.web && (
                  <div className="bg-black/40 rounded-lg p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-zinc-500 text-[10px] mb-1 uppercase tracking-wider">Web Browser URL</p>
                      <code className="text-sky-300 font-mono text-xs truncate block">{tmate.web}</code>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a href={tmate.web} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-sky-400 transition-colors">
                        <ExternalLink size={14} />
                      </a>
                      <button onClick={() => copyText(tmate.web, "tmate-web")} className="text-zinc-400 hover:text-white transition-colors">
                        {copiedItem === "tmate-web" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                )}
                {!tmate.ssh && !tmate.web && (
                  <p className="text-amber-400 text-xs">Tmate session started but no address was returned yet. Try again in a few seconds.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SSH Key Generation */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Key size={16} className="text-amber-400" /> SSH Key Pair
              </h2>
              <p className="text-zinc-400 text-xs mt-0.5">Generate an RSA key pair inside the VPS. VPS must be running.</p>
            </div>
            <button
              onClick={generateSshKeys}
              disabled={keysLoading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-sm font-medium rounded-xl transition-all disabled:opacity-50"
            >
              {keysLoading ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
              {keysLoading ? "Generating..." : "Generate Keys"}
            </button>
          </div>

          {keysError && (
            <p className="text-red-400 text-xs flex items-center gap-1 mt-2">
              <AlertTriangle size={12} /> {keysError}
            </p>
          )}

          <AnimatePresence>
            {sshKeys && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 mt-3">
                {sshKeys.publicKey && (
                  <div className="bg-black/40 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Public Key</p>
                      <button onClick={() => copyText(sshKeys.publicKey, "pub")} className="text-zinc-400 hover:text-white transition-colors">
                        {copiedItem === "pub" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <code className="text-sky-300 font-mono text-[11px] break-all">{sshKeys.publicKey}</code>
                  </div>
                )}
                {sshKeys.privateKey && (
                  <div className="bg-black/40 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Private Key</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowPrivateKey(v => !v)} className="text-zinc-400 hover:text-white transition-colors">
                          {showPrivateKey ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button onClick={() => copyText(sshKeys.privateKey, "priv")} className="text-zinc-400 hover:text-white transition-colors">
                          {copiedItem === "priv" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                    {showPrivateKey ? (
                      <code className="text-amber-300 font-mono text-[11px] break-all whitespace-pre-wrap block">{sshKeys.privateKey}</code>
                    ) : (
                      <p className="text-zinc-500 text-xs italic">Hidden — click eye to reveal</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reinstall */}
        <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-5">
          <h2 className="text-base font-semibold text-red-400 flex items-center gap-2 mb-1">
            <RotateCcw size={16} /> Reinstall VPS
          </h2>
          <p className="text-zinc-400 text-xs mb-4">
            Completely wipes the VPS filesystem and reinstalls a fresh Ubuntu container with the same specs.
            <span className="text-red-400 font-medium"> All data will be lost.</span>
          </p>

          {reinstallMsg && (
            <p className={`text-xs mb-3 flex items-center gap-1 ${reinstallMsg.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
              {reinstallMsg.startsWith("Error") ? <AlertTriangle size={12} /> : <Check size={12} />} {reinstallMsg}
            </p>
          )}

          {!reinstallConfirm ? (
            <button
              onClick={() => setReinstallConfirm(true)}
              disabled={reinstalling}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl transition-all"
            >
              <RotateCcw size={14} /> Reinstall VPS
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              <span className="text-red-300 text-sm font-medium">Are you sure? All data will be lost.</span>
              <button onClick={handleReinstall} disabled={reinstalling} className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-sm flex items-center gap-1.5">
                {reinstalling ? <><Loader2 size={13} className="animate-spin" /> Reinstalling...</> : "Yes, Reinstall"}
              </button>
              <button onClick={() => setReinstallConfirm(false)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm">Cancel</button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
