// tsx derives its Windows cache directory from os.userInfo(), which can fail
// under memory pressure. A stable synthetic uid avoids that optional lookup.
import { fileURLToPath } from "node:url";

if (typeof process.geteuid !== "function") {
  Object.defineProperty(process, "geteuid", {
    configurable: true,
    value: () => 0,
  });
}

process.env.TSX_TSCONFIG_PATH = fileURLToPath(
  new URL("./tsconfig.json", import.meta.url),
);

await import("tsx");
