import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { rmSync } from "node:fs";
const serverRoot = fileURLToPath(new URL("../Server/", import.meta.url));
const file = fileURLToPath(
  new URL(`../Server/.data/browser-${process.pid}.json`, import.meta.url),
);
const child = spawn(process.execPath, ["dist/main.js"], {
  cwd: serverRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "test",
    STORAGE_MODE: "file",
    DATA_FILE: file,
    PORT: "4100",
    CLIENT_ORIGIN: "http://localhost:3100",
    JWT_SECRET: randomBytes(48).toString("hex"),
    ADMIN_EMAIL: "studio@example.test",
    ADMIN_PASSWORD: "browser-test-only-password-0123",
  },
});
function stop() {
  child.kill();
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
child.on("exit", (code) => {
  rmSync(file, { force: true });
  process.exitCode = code ?? 0;
});
