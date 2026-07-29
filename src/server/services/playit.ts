import path from "path";
import { exec } from "child_process";
import { readJSON, writeJSON } from "./db.js";

const PLAYIT_VERSION = "v0.15.26";
const PLAYIT_DOWNLOAD_URL = `https://github.com/playit-cloud/playit-agent/releases/download/${PLAYIT_VERSION}/playit-linux-amd64`;

// Proxy / VPS types that should NOT get auto-playit
const SKIP_TYPES = new Set(["VPS", "VELOCITY", "BUNGEECORD", "WATERFALL"]);

export const shouldAutoPlayit = (serverType: string): boolean =>
  !SKIP_TYPES.has((serverType || "PAPER").toUpperCase());

const safeName = (name: string) => name.replace(/[^a-zA-Z0-9_-]/g, "_");
const getPm2Name  = (serverName: string) => `playit_${safeName(serverName)}`;
const getPlayitBin = (serverId: string, serverName: string) =>
  path.join(process.cwd(), ".data", "servers", serverId, `playit_${safeName(serverName)}`);
const getSecretPath = (serverId: string) =>
  path.join(process.cwd(), ".data", "servers", serverId, "playit.toml");

/** Download the playit binary (if missing) and launch it via PM2. */
export const startPlayitTunnel = (serverId: string, serverName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const pm2Name   = getPm2Name(serverName);
    const serverDir = path.join(process.cwd(), ".data", "servers", serverId);
    const playitBin = getPlayitBin(serverId, serverName);
    const secretPath = getSecretPath(serverId);

    const setupCmd =
      `mkdir -p "${serverDir}"; ` +
      `if [ ! -f "${playitBin}" ]; then ` +
        `wget -qO "${playitBin}" "${PLAYIT_DOWNLOAD_URL}" && chmod +x "${playitBin}"; ` +
      `fi`;

    const launchCmd =
      `npx pm2 delete ${pm2Name} 2>/dev/null || true; ` +
      `npx pm2 flush ${pm2Name} 2>/dev/null || true; ` +
      `${setupCmd} && ` +
      `npx pm2 start "${playitBin}" --name ${pm2Name} -- -s --secret_path "${secretPath}" && ` +
      `npx pm2 save`;

    exec(launchCmd, (err, _stdout, stderr) => {
      if (err) {
        console.error(`[Playit] Failed to start tunnel for "${serverName}":`, stderr);
        reject(err);
        return;
      }
      console.log(`[Playit] Tunnel process started for "${serverName}" (pm2: ${pm2Name})`);
      resolve();
    });
  });
};

/** Stop (delete) the PM2 playit process for a server. */
export const stopPlayitTunnel = (serverId: string, serverName: string): Promise<void> => {
  return new Promise((resolve) => {
    const pm2Name = getPm2Name(serverName);
    exec(
      `npx pm2 delete ${pm2Name} 2>/dev/null || true; npx pm2 save 2>/dev/null || true`,
      () => {
        console.log(`[Playit] Tunnel stopped for "${serverName}"`);
        resolve();
      }
    );
  });
};

/**
 * Background poller: reads PM2 logs every 5 s until a public tunnel address is
 * detected, then persists it as the server's ipAlias so the UI picks it up.
 * Gives up after ~3 minutes (36 attempts).
 */
export const pollAndPersistTunnelAddress = (serverId: string, serverName: string): void => {
  const pm2Name   = getPm2Name(serverName);
  let   attempts  = 0;
  const maxAttempts = 36; // 36 × 5 s = 3 min

  const poll = () => {
    attempts++;
    if (attempts > maxAttempts) {
      console.log(`[Playit] Gave up polling tunnel address for "${serverName}" after ${maxAttempts} attempts`);
      return;
    }

    exec(`npx pm2 logs ${pm2Name} --nostream --lines 300 2>/dev/null`, async (_err, stdout) => {
      const logs = stdout.replace(/\x1b\[[0-9;]*[a-zA-Z]|\x1b./g, "");

      // --- Address extraction (same patterns as the GET /playit route) ---
      let tunnelAddress: string | null = null;

      const domainMatches =
        logs.match(/\b([a-z0-9-]+\.ply\.gg:\d{2,5})\b/g) ||
        logs.match(/\b([a-z0-9-]+\.playit\.gg:\d{2,5})\b/g) ||
        logs.match(/\b([a-z0-9-]+\.joinmc\.io:\d{2,5})\b/g);

      const allocMatch =
        logs.match(/alloc\s+(?:tcp|udp)\s+([^\s]+)/i) ||
        logs.match(/tunnel[_\s]address[:\s]+"?([^\s"]+)/i) ||
        logs.match(/address[:\s]+"([^"]+)"/i);

      const ipPortMatches = logs.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{2,5})\b/g);

      if (domainMatches) {
        tunnelAddress = domainMatches[domainMatches.length - 1];
      } else if (allocMatch) {
        tunnelAddress = allocMatch[1];
      } else if (ipPortMatches) {
        const publicIp = ipPortMatches.find(ip => {
          const [host] = ip.split(":");
          return (
            !host.startsWith("127.") &&
            !host.startsWith("10.")  &&
            !host.startsWith("172.") &&
            !host.startsWith("192.168.")
          );
        });
        if (publicIp) tunnelAddress = publicIp;
      }
      // -------------------------------------------------------------------

      if (tunnelAddress) {
        try {
          const servers = await readJSON("servers.json") as any[] || [];
          const idx = servers.findIndex((s: any) => s.id === serverId);
          if (idx !== -1 && servers[idx].ipAlias !== tunnelAddress) {
            servers[idx].ipAlias = tunnelAddress;
            await writeJSON("servers.json", servers);
            console.log(`[Playit] ✅ ipAlias set for "${serverName}": ${tunnelAddress}`);
          }
        } catch (e) {
          console.error("[Playit] Failed to persist tunnel address:", e);
        }
        return; // done — IP saved
      }

      // Not found yet — try again in 5 s
      setTimeout(poll, 5000);
    });
  };

  // Give playit ~8 s to initialise before the first log read
  setTimeout(poll, 8000);
  console.log(`[Playit] Started background IP poller for "${serverName}"`);
};
