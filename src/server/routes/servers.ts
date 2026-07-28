import express from "express";
import path from "path";
import { requireAuth } from "../middleware/auth.js";
import { getServers, createServer, getServer, deleteServer, startServer, stopServer, restartServer, changeServerVersion, getFiles, uploadFile, deleteFile, renameFile, saveFileContent, sendCommand, getServerStats, updateOwner, updateIpAlias, getBackups, createBackup, downloadBackup, deleteBackup, unzipFile, zipFiles, installPlugin, installMod } from "../controllers/servers.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: path.join(process.cwd(), ".data/temp/") });

router.use(requireAuth);

router.get("/", getServers);
router.post("/", createServer);
router.get("/:id", getServer);
router.get("/:id/stats", getServerStats);
router.delete("/:id", deleteServer);
router.put("/:id/owner", updateOwner);
router.put("/:id/ipalias", updateIpAlias);

router.put("/:id/version", changeServerVersion);

router.post("/:id/start", startServer);
router.post("/:id/stop", stopServer);
router.post("/:id/restart", restartServer);
router.post("/:id/command", sendCommand);

// Simple file endpoints
router.get("/:id/files", getFiles);
router.post("/:id/files/upload", upload.single("file"), uploadFile);
router.post("/:id/files/rename", renameFile);
router.post("/:id/files/save", saveFileContent);
router.post("/:id/files/unzip", unzipFile);
router.post("/:id/files/zip", zipFiles);
router.delete("/:id/files", deleteFile);

// Backup endpoints
router.get("/:id/backups", getBackups);
router.post("/:id/backups", createBackup);
router.get("/:id/backups/:filename", downloadBackup);
router.delete("/:id/backups/:filename", deleteBackup);


router.get("/:id/playit", async (req, res) => {
  const user = (req as any).user;
  if (user.role !== "admin" && user.role !== "owner") return res.status(403).json({ error: "Forbidden" });

  const { id } = req.params;
  const serversJSON = await (await import("fs/promises")).readFile(path.join(process.cwd(), ".data", "servers.json"), "utf8");
  const servers = JSON.parse(serversJSON);
  const server = servers.find((s: any) => s.id === id);
  const serverName = server ? server.name.replace(/[^a-zA-Z0-9_-]/g, "_") : id;
  const pm2Name = `playit_${serverName}`;
  
  const { exec } = await import("child_process");
  
  exec("npx pm2 jlist", (err, stdout) => {
    let status = "stopped";
    try {
      const jsonStart = stdout.indexOf('[');
      const jsonEnd = stdout.lastIndexOf(']');
      const jsonStr = jsonStart !== -1 && jsonEnd !== -1 ? stdout.substring(jsonStart, jsonEnd + 1) : stdout;
      const pm2List = JSON.parse(jsonStr);
      const playitProcess = pm2List.find((p: any) => p.name === pm2Name);
      if (playitProcess && playitProcess.pm2_env && playitProcess.pm2_env.status === "online") {
        status = "running";
      }
    } catch (e) {}

    if (status === "running") {
      exec(`npx pm2 logs ${pm2Name} --nostream --lines 200`, async (err, logStdout, logStderr) => {
        const logs = (logStdout || "").replace(/\x1b\[[0-9;]*[a-zA-Z]|\x1b./g, "");
        const claimLinkMatches = logs.match(/https:\/\/playit\.gg\/claim\/[a-zA-Z0-9]+/g);
        
        // Try to extract the tunnel address (assigned IP:port by playit)
        let tunnelAddress: string | null = null;
        
        // Pattern 1: "ip:port" style (e.g. "147.185.221.11:25565")
        const ipPortMatches = logs.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{2,5})\b/g);
        // Pattern 2: playit subdomain addresses
        const domainMatches = logs.match(/\b([a-z0-9\-]+\.ply\.gg:\d{2,5})\b/g) ||
                              logs.match(/\b([a-z0-9\-]+\.playit\.gg:\d{2,5})\b/g) ||
                              logs.match(/\b([a-z0-9\-]+\.joinmc\.io:\d{2,5})\b/g);
        // Pattern 3: "tunnel_address" or "alloc" log lines
        const allocMatch = logs.match(/alloc\s+(?:tcp|udp)\s+([^\s]+)/i) ||
                           logs.match(/tunnel[_\s]address[:\s]+["]?([^\s"]+)/i) ||
                           logs.match(/address[:\s]+["]([^"]+)"/i);

        if (domainMatches) {
          tunnelAddress = domainMatches[domainMatches.length - 1];
        } else if (allocMatch) {
          tunnelAddress = allocMatch[1];
        } else if (ipPortMatches) {
          // filter out private IPs
          const publicIp = ipPortMatches.find(ip => {
            const [host] = ip.split(":");
            return !host.startsWith("127.") && !host.startsWith("10.") && !host.startsWith("172.") && !host.startsWith("192.168.");
          });
          if (publicIp) tunnelAddress = publicIp;
        }

        // Auto-persist the tunnel address to the server's ipAlias when detected
        if (tunnelAddress && server && server.ipAlias !== tunnelAddress) {
          try {
            const { readJSON: rj, writeJSON: wj } = await import("../services/db.js");
            const freshServers = await rj("servers.json") || [];
            const idx = freshServers.findIndex((s: any) => s.id === id);
            if (idx !== -1) {
              freshServers[idx].ipAlias = tunnelAddress;
              await wj("servers.json", freshServers);
            }
          } catch (e) {
            console.error("Failed to auto-persist tunnel address:", e);
          }
        }

        res.json({
          status,
          claimLink: claimLinkMatches ? claimLinkMatches[claimLinkMatches.length - 1] : null,
          tunnelAddress,
          logs: logs.split('\n').slice(-60).join('\n')
        });
      });
    } else {
      res.json({ status: "stopped", claimLink: null, tunnelAddress: null, logs: "" });
    }
  });
});

router.post("/:id/playit/start", async (req, res) => { 
  const user = (req as any).user;
  if (user.role !== "admin" && user.role !== "owner") return res.status(403).json({ error: "Forbidden" });

  const { id } = req.params;
  const serversJSON = await (await import("fs/promises")).readFile(path.join(process.cwd(), ".data", "servers.json"), "utf8");
  const servers = JSON.parse(serversJSON);
  const server = servers.find((s: any) => s.id === id);
  const serverName = server ? server.name.replace(/[^a-zA-Z0-9_-]/g, "_") : id;
  const pm2Name = `playit_${serverName}`;
  
  const serverDir = path.join(process.cwd(), ".data", "servers", id);
  const playitBin = path.join(serverDir, `playit_${serverName}`);
  const secretPath = path.join(serverDir, "playit.toml");
  
  const { exec } = await import("child_process");
  
  const setupCmd = `mkdir -p "${serverDir}"; if [ ! -f "${playitBin}" ]; then wget -qO "${playitBin}" "https://github.com/playit-cloud/playit-agent/releases/download/v0.15.26/playit-linux-amd64" && chmod +x "${playitBin}"; fi`;
  
  exec(`npx pm2 delete ${pm2Name} || true; npx pm2 flush ${pm2Name} || true; ${setupCmd} && npx pm2 start "${playitBin}" --name ${pm2Name} -- -s --secret_path "${secretPath}" && npx pm2 save`, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ error: "Failed to start Playit Tunnel", details: stderr });
    }
    res.json({ success: true });
  });
});

router.post("/:id/playit/stop", async (req, res) => {
  const user = (req as any).user;
  if (user.role !== "admin" && user.role !== "owner") return res.status(403).json({ error: "Forbidden" });

  const { id } = req.params;
  const serversJSON = await (await import("fs/promises")).readFile(path.join(process.cwd(), ".data", "servers.json"), "utf8");
  const servers = JSON.parse(serversJSON);
  const server = servers.find((s: any) => s.id === id);
  const serverName = server ? server.name.replace(/[^a-zA-Z0-9_-]/g, "_") : id;
  const pm2Name = `playit_${serverName}`;
  
  const { exec } = await import("child_process");
  
  exec(`npx pm2 delete ${pm2Name} && npx pm2 save`, (err, stdout, stderr) => {
    res.json({ success: true });
  });
});

router.post("/:id/playit/reset", async (req, res) => {
  const user = (req as any).user;
  if (user.role !== "admin" && user.role !== "owner") return res.status(403).json({ error: "Forbidden" });

  const { id } = req.params;
  const serversJSON = await (await import("fs/promises")).readFile(path.join(process.cwd(), ".data", "servers.json"), "utf8");
  const servers = JSON.parse(serversJSON);
  const server = servers.find((s: any) => s.id === id);
  const serverName = server ? server.name.replace(/[^a-zA-Z0-9_-]/g, "_") : id;
  const pm2Name = `playit_${serverName}`;
  const serverDir = path.join(process.cwd(), ".data", "servers", id);
  const secretPath = path.join(serverDir, "playit.toml");

  const { exec } = await import("child_process");

  exec(`npx pm2 delete ${pm2Name} || true; npx pm2 flush ${pm2Name} || true; rm -f "${secretPath}" && npx pm2 save`, (err, stdout, stderr) => {
    res.json({ success: true });
  });
});

// Sub-users endpoints
router.get("/:id/subusers", async (req, res) => {
  try {
    const { id } = req.params;
    const { readJSON } = await import("../services/db.js");
    const servers = await readJSON("servers.json") || [];
    const server = servers.find((s: any) => s.id === id);
    if (!server) return res.status(404).json({ error: "Server not found" });

    const users = await readJSON("users.json") || [];
    res.json({
      subUsers: server.subUsers || [],
      availableUsers: users.map((u: any) => ({ id: u.id, username: u.username }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/subusers", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, permissions } = req.body;
    const { readJSON, writeJSON } = await import("../services/db.js");
    const servers = await readJSON("servers.json") || [];
    const serverIndex = servers.findIndex((s: any) => s.id === id);
    if (serverIndex === -1) return res.status(404).json({ error: "Server not found" });

    if (!servers[serverIndex].subUsers) servers[serverIndex].subUsers = [];
    const subUserIndex = servers[serverIndex].subUsers.findIndex((su: any) => su.userId === userId);
    
    if (subUserIndex !== -1) {
      servers[serverIndex].subUsers[subUserIndex].permissions = permissions;
    } else {
      servers[serverIndex].subUsers.push({ userId, permissions });
    }

    await writeJSON("servers.json", servers);
    res.json({ success: true, subUsers: servers[serverIndex].subUsers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id/subusers/:userId", async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { readJSON, writeJSON } = await import("../services/db.js");
    const servers = await readJSON("servers.json") || [];
    const serverIndex = servers.findIndex((s: any) => s.id === id);
    if (serverIndex === -1) return res.status(404).json({ error: "Server not found" });

    if (!servers[serverIndex].subUsers) servers[serverIndex].subUsers = [];
    servers[serverIndex].subUsers = servers[serverIndex].subUsers.filter((su: any) => su.userId !== userId);

    await writeJSON("servers.json", servers);
    res.json({ success: true, subUsers: servers[serverIndex].subUsers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

import { createSftpUser, resetSftpPassword, getSftpUser, deleteSftpUser } from "../services/sftp.js";

// SFTP endpoints
router.get("/:id/sftp", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getSftpUser(id);
    if (!user) return res.status(404).json({ error: "SFTP user not found" });
    
    // We don't send the password hash, but we might want to generate a new temporary 
    // or just say it's hidden. But the UI expects the password to be returned upon creation/reset.
    // So for GET, we don't have the plaintext password. We'll return a placeholder.
    res.json({
      host: req.headers.host?.split(":")[0] || "127.0.0.1",
      port: 6868,
      username: user.username,
      password: "(Hidden - Reset to reveal)"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/sftp/create", async (req, res) => {
  try {
    const { id } = req.params;
    const creds = await createSftpUser(id);
    res.json({
      host: req.headers.host?.split(":")[0] || "127.0.0.1",
      port: 6868,
      username: creds.username,
      password: creds.password
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/sftp/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const creds = await resetSftpPassword(id);
    res.json({
      host: req.headers.host?.split(":")[0] || "127.0.0.1",
      port: 6868,
      username: creds.username,
      password: creds.password
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id/sftp", async (req, res) => {
  try {
    const { id } = req.params;
    await deleteSftpUser(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/plugins/install", installPlugin);
router.post("/:id/mods/install", installMod);

// ─── VPS Management ───────────────────────────────────────────────────────────

router.get("/:id/vps/tmate", async (req, res) => {
  try {
    const user = (req as any).user;

    const { id } = req.params;
    const { readJSON } = await import("../services/db.js");
    const { docker, isSandbox } = await import("../services/docker.js");
    const servers = await readJSON("servers.json") || [];
    const server = servers.find((s: any) => s.id === id);

    if (!server) return res.status(404).json({ error: "Server not found" });

    // Ownership check: admin/owner role can manage any server; regular users only their own
    if (user.role !== "admin" && user.role !== "owner" && server.owner !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if ((server.type || "").toUpperCase() !== "VPS") return res.status(400).json({ error: "Not a VPS server" });
    if (!server.containerId) return res.status(400).json({ error: "Container not created" });

    if (isSandbox) {
      return res.json({ ssh: "ssh abcdef@nyc1.tmate.io", web: "https://tmate.io/t/abcdef", note: "Sandbox mode" });
    }

    const container = docker.getContainer(server.containerId);
    const info = await container.inspect();
    if (!info.State.Running) return res.status(400).json({ error: "VPS must be running to generate a tmate session" });

    // Install tmate if missing and start a new session
    const installCmd = [
      "bash", "-c",
      `export DEBIAN_FRONTEND=noninteractive; \
       which tmate 2>/dev/null || (apt-get update -qq 2>/dev/null && apt-get install -y tmate -qq 2>/dev/null); \
       pkill tmate 2>/dev/null; sleep 0.5; \
       tmate -S /tmp/tmate.sock new-session -d 2>/dev/null; \
       tmate -S /tmp/tmate.sock wait tmate-ready 2>/dev/null; \
       echo "SSH_LINE:$(tmate -S /tmp/tmate.sock display-message -p '#{tmate_ssh}' 2>/dev/null)"; \
       echo "WEB_LINE:$(tmate -S /tmp/tmate.sock display-message -p '#{tmate_web}' 2>/dev/null)"`
    ];

    const exec = await container.exec({ Cmd: installCmd, AttachStdout: true, AttachStderr: true });
    const stream = await exec.start({ hijack: true, stdin: false });

    let output = "";
    await new Promise<void>((resolve) => {
      stream.on("data", (chunk: Buffer) => { output += chunk.toString(); });
      stream.on("end", resolve);
      setTimeout(resolve, 30000); // 30s timeout
    });

    const sshMatch = output.match(/SSH_LINE:(.+)/);
    const webMatch = output.match(/WEB_LINE:(.+)/);

    res.json({
      ssh: sshMatch ? sshMatch[1].trim() : null,
      web: webMatch ? webMatch[1].trim() : null,
    });
  } catch (err: any) {
    console.error("VPS tmate error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/vps/reinstall", async (req, res) => {
  try {
    const user = (req as any).user;

    const { id } = req.params;
    const { readJSON, writeJSON } = await import("../services/db.js");
    const { docker, isSandbox, createServerContainer, deleteContainer, startContainer } = await import("../services/docker.js");
    const servers = await readJSON("servers.json") || [];
    const serverIndex = servers.findIndex((s: any) => s.id === id);

    if (serverIndex === -1) return res.status(404).json({ error: "Server not found" });
    const server = servers[serverIndex];

    // Reinstall is destructive — only admin/owner role may perform it
    if (user.role !== "admin" && user.role !== "owner") {
      return res.status(403).json({ error: "Only admins can reinstall a VPS" });
    }

    if ((server.type || "").toUpperCase() !== "VPS") return res.status(400).json({ error: "Not a VPS server" });

    // Stop and delete old container
    if (server.containerId) {
      await deleteContainer(server.containerId).catch(e => console.error("Delete container error:", e));
    }

    // Wipe server data directory (preserving backups)
    const fsExtra = (await import("fs-extra")).default;
    const serverDir = path.join(process.cwd(), ".data", "servers", id);
    await fsExtra.emptyDir(serverDir);

    // Remove init marker so packages get reinstalled
    // (the container is fresh, so /etc/.mineactyl_init won't exist)

    // Recreate container
    const newContainerId = await createServerContainer(server);
    servers[serverIndex].containerId = newContainerId;
    servers[serverIndex].status = "offline";
    await writeJSON("servers.json", servers);

    res.json({ success: true, message: "VPS reinstalled. Start the server to boot it up." });
  } catch (err: any) {
    console.error("VPS reinstall error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/vps/ssh-keys", async (req, res) => {
  try {
    const user = (req as any).user;

    const { id } = req.params;
    const { readJSON } = await import("../services/db.js");
    const { docker, isSandbox } = await import("../services/docker.js");
    const servers = await readJSON("servers.json") || [];
    const server = servers.find((s: any) => s.id === id);

    if (!server) return res.status(404).json({ error: "Server not found" });

    // Ownership check: admin/owner can manage any server; regular users only their own
    if (user.role !== "admin" && user.role !== "owner" && server.owner !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if ((server.type || "").toUpperCase() !== "VPS") return res.status(400).json({ error: "Not a VPS server" });
    if (!server.containerId) return res.status(400).json({ error: "Container not created" });

    if (isSandbox) {
      return res.json({ publicKey: "ssh-rsa AAAAB3Nza...SANDBOX_MODE root@vps", privateKey: "-----BEGIN RSA PRIVATE KEY-----\nSANDBOX\n-----END RSA PRIVATE KEY-----" });
    }

    const container = docker.getContainer(server.containerId);
    const info = await container.inspect();
    if (!info.State.Running) return res.status(400).json({ error: "VPS must be running" });

    // Generate the key pair in /tmp (NOT the bind-mounted /root volume).
    // Only the public key is written to /root/.ssh/authorized_keys (public keys are not sensitive).
    // The private key is streamed once via stdout and immediately deleted — it is never persisted
    // to the server file area accessible via File Manager or SFTP.
    const keyCmd = [
      "bash", "-c",
      `TMPKEY=/tmp/vps_key_$$ ; \
       ssh-keygen -t rsa -b 2048 -f "$TMPKEY" -N "" -q 2>/dev/null; \
       mkdir -p /root/.ssh && chmod 700 /root/.ssh; \
       cat "$TMPKEY.pub" >> /root/.ssh/authorized_keys 2>/dev/null; \
       sort -u /root/.ssh/authorized_keys -o /root/.ssh/authorized_keys 2>/dev/null; \
       chmod 600 /root/.ssh/authorized_keys 2>/dev/null; \
       echo "PUBKEY:$(cat "$TMPKEY.pub" 2>/dev/null)"; \
       echo "PRIVKEY_START"; \
       cat "$TMPKEY" 2>/dev/null; \
       echo "PRIVKEY_END"; \
       rm -f "$TMPKEY" "$TMPKEY.pub"`
    ];

    const exec = await container.exec({ Cmd: keyCmd, AttachStdout: true, AttachStderr: true });
    const stream = await exec.start({ hijack: true, stdin: false });
    let output = "";
    await new Promise<void>((resolve) => {
      stream.on("data", (chunk: Buffer) => { output += chunk.toString(); });
      stream.on("end", resolve);
      setTimeout(resolve, 15000);
    });

    const pubMatch = output.match(/PUBKEY:(.+)/);
    const privStart = output.indexOf("PRIVKEY_START\n");
    const privEnd = output.indexOf("PRIVKEY_END");
    const privateKey = privStart !== -1 && privEnd !== -1 ? output.substring(privStart + "PRIVKEY_START\n".length, privEnd).trim() : null;

    res.json({
      publicKey: pubMatch ? pubMatch[1].trim() : null,
      privateKey,
    });
  } catch (err: any) {
    console.error("VPS SSH key error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
