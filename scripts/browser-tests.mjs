import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const cwd = fileURLToPath(new URL("../Client/", import.meta.url));
const env = {
  ...process.env,
  NEXT_PUBLIC_API_URL: "http://localhost:4100",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3100",
};
const serverBuild = spawnSync(
  process.execPath,
  ["node_modules/@nestjs/cli/bin/nest.js", "build"],
  {
    cwd: fileURLToPath(new URL("../Server/", import.meta.url)),
    env,
    stdio: "inherit",
  },
);
if (serverBuild.status !== 0) process.exit(serverBuild.status || 1);
for (const args of [
  ["node_modules/next/dist/bin/next", "build"],
  ["node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)],
]) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
