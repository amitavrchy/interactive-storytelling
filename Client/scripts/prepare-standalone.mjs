import { cpSync, existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = fileURLToPath(new URL("../", import.meta.url));
const buildName = process.env.NEXT_BUILD_DIR || ".next";
const buildRoot = resolve(clientRoot, buildName);
if (
  !buildRoot.startsWith(resolve(clientRoot) + sep) ||
  !buildName.startsWith(".next")
) {
  throw new Error(
    "The build directory must be a .next directory inside Client.",
  );
}
const standalone = resolve(buildRoot, "standalone");
if (!existsSync(resolve(standalone, "server.js")))
  throw new Error(
    "Run the Next.js standalone build before preparing its assets.",
  );
cpSync(resolve(clientRoot, "public"), resolve(standalone, "public"), {
  recursive: true,
});
cpSync(resolve(buildRoot, "static"), resolve(standalone, buildName, "static"), {
  recursive: true,
});
console.log("Standalone server and public assets are ready.");
