# Mineactyl Panel

A premium web-based Minecraft & game server management panel — the all-in-one alternative to Pterodactyl + Paymenter.

## Stack

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS v4 + Framer Motion + GSAP
- **Backend**: Express + TypeScript (`server.ts`) + Socket.IO (real-time console logs)
- **Storage**: JSON files in `.data/` (users, servers, settings, plans, subscriptions)
- **Infra**: Dockerode (Minecraft containers), SSH2 (SFTP), PM2, playit.gg tunnel support

## Running

```bash
npm run dev      # Development (hot-reload via tsx watch + Vite middleware)
npm run build    # Production build
npm run start    # Production server (serves dist/)
npm run createuser  # Create an admin user interactively
```

Server runs on port **3000** in dev.

## Project Structure

```
server.ts              # Express + Socket.IO entry point
src/
  App.tsx              # Routes and auth guards
  pages/               # Login, Signup, Dashboard, ServerList, ServerView,
                       #   PlansPage, SettingsPage, ApiKeysPage, CreateServer, PlayitTunnel
  components/          # Sidebar, Layout, FileManager, ServerConsole, etc.
  context/             # AuthContext, SettingsContext (panelName, panelDomain, etc.)
  server/
    controllers/       # auth.ts (login + register), servers.ts
    routes/            # auth.ts, servers.ts, billing.ts, system.ts, api.ts
    services/          # docker.ts, db.ts (JSON CRUD), sftp.ts
.data/                 # Runtime data (gitignored): users.json, servers.json,
                       #   plans.json, subscriptions.json, settings.json
```

## Key Features

1. **Minecraft server deployment** via Docker (Paper, Spigot, Velocity, BungeeCord, Fabric, Forge, PocketMine, VPS)
2. **Billing / Hosting Plans** — admin creates plans, users subscribe (`/plans`)
3. **Signup + Login** — JWT auth; signup at `/signup`, login at `/login`
4. **Dedicated IP display** — configure `panelDomain` in Settings → shown as `<domain>:<port>` on each server
5. **File manager, console, SFTP, backups, plugins, mods, server properties**
6. **Playit.gg tunnel** for exposing servers without port-forwarding
7. **Sub-user management**, API keys, system settings

## Environment Variables

| Variable | Description |
|---|---|
| `SESSION_SECRET` | App session secret |
| `JWT_SECRET` | JWT signing secret (falls back to built-in default) |
| `NODE_ENV` | Set to `production` for production mode |
| `PORT` | Server port (default 3000) |

## User Preferences

- Panel name: **Mineactyl Panel** (was JTG Panel / Mine Panel — all references updated)
- Docker container names use prefix `mineactyl-server-` (was `jtg-server-`)
