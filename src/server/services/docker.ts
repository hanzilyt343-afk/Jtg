import Docker from "dockerode";
import fs from "fs-extra";
import path from "path";
import { io } from "../../../server.js"; // Import socket for logs
import { readJSON } from "./db.js";

export const isSandbox = !fs.existsSync("/var/run/docker.sock") && process.platform !== "win32";

export const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });

const mockState: Record<string, boolean> = {};

export const getVersions = async (type: string = "PAPER") => {
  const normalizedType = type.toUpperCase();
  if (normalizedType === "VELOCITY") {
    return ["latest", "3.3.0-SNAPSHOT"];
  }
  if (normalizedType === "BUNGEECORD" || normalizedType === "WATERFALL") {
    return ["latest"];
  }
  if (normalizedType === "POCKETMINE") {
    return ["latest", "5.10.0", "5.0.0", "4.23.0"];
  }
  if (normalizedType === "VPS") {
    return ["22.04", "24.04", "latest"];
  }
  
  return [
    "latest", "1.21.11", "1.21.10", "1.21.9", "1.21.8", "1.21.7", "1.21.6", "1.21.5", "1.21.4", "1.21.3", "1.21.1", "1.21", 
    "1.20.6", "1.20.5", "1.20.4", "1.20.2", "1.20.1", "1.20", 
    "1.19.4", "1.19.3", "1.19.2", "1.19.1", "1.19", 
    "1.18.2", "1.18.1", "1.18", "1.17.1", "1.17", "1.16.5", "1.16.4"
  ];
};

export const createServerContainer = async (serverData: any) => {
  if (isSandbox) {
    mockState[serverData.id] = false;
    return "mock-container-id-" + serverData.id;
  }

  const serverType = (serverData.type || "PAPER").toUpperCase();
  
  // 1. Determine Docker Image & Protocol based on Server Type
  let dockerImage = "itzg/minecraft-server";
  let protocol = "tcp";

  if (["VELOCITY", "BUNGEECORD", "WATERFALL"].includes(serverType)) {
    dockerImage = "itzg/bungeecord";
  } else if (serverType === "POCKETMINE") {
    dockerImage = "pmmp/pocketmine-mp";
    protocol = "udp"; // Bedrock uses UDP
  } else if (serverType === "VPS") {
    dockerImage = `ubuntu:${serverData.version || "22.04"}`;
  }

  // Pull image if not exists
  console.log(`Ensuring ${dockerImage} is pulled...`);
  await new Promise((resolve, reject) => {
    docker.pull(dockerImage, (err: any, stream: any) => {
      if (err) return reject(err);
      docker.modem.followProgress(stream, onFinished);
      function onFinished(err: any, output: any) {
        if (err) return reject(err);
        resolve(output);
      }
    });
  });

  const serverDir = path.join(process.cwd(), ".data", "servers", serverData.id);
  await fs.ensureDir(serverDir);

  // 2. Setup Environment Variables
  const envVars: string[] = [];

  if (serverType === "VPS") {
    envVars.push("DEBIAN_FRONTEND=noninteractive");
  } else if (serverType === "POCKETMINE") {
    envVars.push("EULA=TRUE");
  } else {
    envVars.push(
      `TYPE=${serverType}`,
      `VERSION=${serverData.version}`,
      `MEMORY=${serverData.ram}G`,
      `INIT_MEMORY=128M`,
      `SERVER_PORT=${serverData.port}`
    );

    if (!["VELOCITY", "BUNGEECORD", "WATERFALL"].includes(serverType)) {
      envVars.push(
        `EULA=TRUE`,
        `ENABLE_RCON=true`,
        `RCON_PASSWORD=admin`,
        `JVM_OPTS=-DPaper.IgnoreWorldDataVersion=true`
      );
    }
  }

  const portSpec = `${serverData.port}/${protocol}`;

  // 3. Create Container Configuration
  const containerConfig: any = {
    Image: dockerImage,
    name: `jtg-server-${serverData.id}`,
    Tty: true,
    OpenStdin: true,
    StdinOnce: false,
    Env: envVars,
    ExposedPorts: {
      [portSpec]: {}
    },
    HostConfig: {
      PortBindings: {
        [portSpec]: [{ HostPort: `${serverData.port}` }]
      },
      Binds: [`${serverDir}:${serverType === "VPS" ? "/root" : "/data"}`]
    }
  };

  // For Linux VPS, default shell execution command
  if (serverType === "VPS") {
    containerConfig.Cmd = ["/bin/bash"];
  }

  const container = await docker.createContainer(containerConfig);
  return container.id;
};

export const startContainer = async (containerId: string) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    mockState[id] = true;
    io.to(`server_${id}`).emit("log", `[System] Server started (Sandbox Mode).\r\n`);
    return;
  }
  const container = docker.getContainer(containerId);
  await container.start();
};

export const stopContainer = async (containerId: string) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    mockState[id] = false;
    io.to(`server_${id}`).emit("log", `[System] Server stopped (Sandbox Mode).\r\n`);
    return;
  }
  const container = docker.getContainer(containerId);
  await container.stop();
};

export const restartContainer = async (containerId: string) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    mockState[id] = true;
    io.to(`server_${id}`).emit("log", `[System] Server restarted (Sandbox Mode).\r\n`);
    return;
  }
  const container = docker.getContainer(containerId);
  await container.restart();
};

export const deleteContainer = async (containerId: string) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    delete mockState[id];
    return;
  }
  const container = docker.getContainer(containerId);
  try {
    const info = await container.inspect();
    if (info.State.Running) {
      await container.stop();
    }
    await container.remove({ force: true });
  } catch (err) {
    console.error("Error deleting container", err);
  }
};

export const getContainerStatus = async (containerId: string) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    const isRunning = mockState[id] || false;
    return { State: { Running: isRunning, Status: isRunning ? "running" : "exited" } };
  }
  try {
    const container = docker.getContainer(containerId);
    return await container.inspect();
  } catch (e) {
    return null;
  }
};

export const getContainerStats = async (containerId: string) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    if (!mockState[id]) return { cpu: 0, ram: 0, disk: 0 };
    return { cpu: 5.2, ram: 512, disk: 2.1 };
  }
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    if (!info.State.Running) return { cpu: 0, ram: 0, disk: 0 };

    const statsResult = await container.stats({ stream: false });
    
    let cpuPercent = 0.0;
    try {
      const cpuDelta = statsResult.cpu_stats.cpu_usage.total_usage - statsResult.precpu_stats.cpu_usage.total_usage;
      const systemDelta = statsResult.cpu_stats.system_cpu_usage - statsResult.precpu_stats.system_cpu_usage;
      if (systemDelta > 0.0 && cpuDelta > 0.0) {
        const cpus = statsResult.cpu_stats.online_cpus || 1;
        cpuPercent = (cpuDelta / systemDelta) * cpus * 100.0;
      }
    } catch(e) {}

    let ramMB = 0.0;
    try {
      ramMB = statsResult.memory_stats.usage / 1024 / 1024;
    } catch(e) {}

    return { cpu: cpuPercent, ram: ramMB, disk: 2.1 };
  } catch (e) {
    return { cpu: 0, ram: 0, disk: 0 };
  }
};

export const getContainerLogs = async (containerId: string): Promise<string> => {
  if (isSandbox) return "[System] Sandbox mode. No logs.\r\n";
  try {
    const container = docker.getContainer(containerId);
    const logsBuffer = await container.logs({ stdout: true, stderr: true, tail: 100 });
    return logsBuffer.toString('utf8');
  } catch (e) {
    return "";
  }
};

const activeStreams: Record<string, NodeJS.ReadWriteStream> = {};

export const attachContainerSocket = async (containerId: string, serverId: string) => {
  if (isSandbox) return;
  try {
    const container = docker.getContainer(containerId);
    if (!activeStreams[containerId]) {
      const stream = await container.attach({ stream: true, stdout: true, stderr: true, stdin: true });
      activeStreams[containerId] = stream;
      stream.on('data', (chunk) => {
        io.to(`server_${serverId}`).emit("log", chunk.toString());
      });
      stream.on('end', () => {
        delete activeStreams[containerId];
      });
    }
  } catch(e) {
    console.error("Attach error", e);
  }
};

export const sendContainerCommand = async (containerId: string, command: string) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    io.to(`server_${id}`).emit("log", `> ${command}\r\n`);
    return;
  }
  if (activeStreams[containerId]) {
    activeStreams[containerId].write(command + "\n");
  } else {
    try {
      const container = docker.getContainer(containerId);
      const stream = await container.attach({ stream: true, stdout: true, stderr: true, stdin: true });
      activeStreams[containerId] = stream;
      stream.write(command + "\n");
    } catch(e) {
       console.error("Command error", e);
    }
  }
};

