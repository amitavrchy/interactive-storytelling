import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { copyFileSync, existsSync } from "node:fs";
const local = process.argv.includes("--local");
for (const target of ["Client/.env.local", "Server/.env"]) {
  const destination = new URL(`../${target}`, import.meta.url);
  if (!existsSync(destination))
    copyFileSync(
      new URL(`../${target.split("/")[0]}/.env.example`, import.meta.url),
      destination,
    );
}
const jobs = [
  ["Server", ["node_modules/@nestjs/cli/bin/nest.js", "start", "--watch"]],
  ["Client", ["node_modules/next/dist/bin/next", "dev"]],
];
const processes = jobs.map(([folder, args]) =>
  spawn(process.execPath, args, {
    cwd: fileURLToPath(new URL(`../${folder}/`, import.meta.url)),
    stdio: "inherit",
    env: { ...process.env, ...(local ? { STORAGE_MODE: "file" } : {}) },
  }),
);
let closing = false;
function stop() {
  if (closing) return;
  closing = true;
  for (const child of processes) child.kill();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const child of processes)
  child.on("exit", (code) => {
    if (!closing) {
      process.exitCode = code || 0;
      stop();
    }
  });
