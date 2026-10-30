import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { copyFileSync, existsSync } from "node:fs";
const local = process.argv.includes("--local");
const clientPort = process.env.CLIENT_PORT || "3000";
const apiPort = process.env.API_PORT || "4000";
for (const target of ["Client/.env.local", "Server/.env"]) {
  const destination = new URL(`../../${target}`, import.meta.url);
  if (!existsSync(destination))
    copyFileSync(
      new URL(`../../${target.split("/")[0]}/.env.example`, import.meta.url),
      destination,
    );
}
const jobs = [
  ["Server", ["node_modules/@nestjs/cli/bin/nest.js", "start", "--watch"]],
  ["Client", ["node_modules/next/dist/bin/next", "dev"]],
];
const processes = jobs.map(([folder, args]) =>
  spawn(process.execPath, args, {
    cwd: fileURLToPath(new URL(`../../${folder}/`, import.meta.url)),
    stdio: "inherit",
    windowsHide: true,
    env: {
      ...process.env,
      PORT: folder === "Client" ? clientPort : apiPort,
      ...(folder === "Client" && process.env.API_PORT
        ? { NEXT_PUBLIC_API_URL: `http://localhost:${apiPort}` }
        : {}),
      ...(folder === "Client" && process.env.CLIENT_PORT
        ? { NEXT_PUBLIC_SITE_URL: `http://localhost:${clientPort}` }
        : {}),
      ...(folder === "Server"
        ? { CLIENT_ORIGIN: `http://localhost:${clientPort}` }
        : {}),
      ...(local ? { STORAGE_MODE: "file" } : {}),
    },
  }),
);
let closing = false;
function stop() {
  if (closing) return;
  closing = true;
  for (const child of processes) {
    if (!child.pid || child.exitCode !== null) continue;
    if (process.platform === "win32")
      spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore",
      });
    else child.kill();
  }
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const child of processes) {
  child.on("error", (error) => {
    console.error(error.message);
    process.exitCode = 1;
    stop();
  });
  child.on("exit", (code) => {
    if (!closing) {
      process.exitCode = code || 0;
      stop();
    }
  });
}
