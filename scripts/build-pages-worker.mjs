import { build } from "esbuild";
import {
  access,
  copyFile,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";

const outputRoot = join("dist", "client");
const cacheRoot = join(".wrangler", "admin-pages");
const privatePages = [
  {
    source: join(outputRoot, "admin", "login", "index.html"),
    cache: join(cacheRoot, "admin-login.html"),
    define: "__ADMIN_LOGIN_HTML__",
  },
  {
    source: join(outputRoot, "admin", "formularios", "index.html"),
    cache: join(cacheRoot, "admin-formularios.html"),
    define: "__ADMIN_DASHBOARD_HTML__",
  },
];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

await mkdir(cacheRoot, { recursive: true });

const pageDefinitions = {};
for (const page of privatePages) {
  const sourcePath = (await exists(page.source)) ? page.source : page.cache;
  if (!(await exists(sourcePath))) {
    throw new Error(`Missing generated admin page: ${page.source}`);
  }

  const html = await readFile(sourcePath, "utf8");
  await writeFile(page.cache, html, "utf8");
  pageDefinitions[page.define] = JSON.stringify(html);
}

await build({
  entryPoints: ["worker/pages.ts"],
  outfile: join(outputRoot, "_worker.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  legalComments: "none",
  sourcemap: false,
  define: pageDefinitions,
});

// Remove every generated admin asset, including RSC payloads. The authenticated
// HTML is embedded in the Worker and never exists at a public asset URL.
await rm(join(outputRoot, "admin"), { recursive: true, force: true });
await rm(join(outputRoot, "_private"), { recursive: true, force: true });

// The Cloudflare Vite plugin emits a Workers-oriented redirect config that is
// not accepted by `wrangler pages deploy`. Pages uses the root wrangler.toml.
await rm(join(outputRoot, "wrangler.json"), { force: true });
await rm(join(".wrangler", "deploy", "config.json"), { force: true });

// Sites expects the deployed Worker at dist/server/index.js. The same
// self-contained advanced-mode Worker is valid there and keeps the authenticated
// admin HTML out of the public asset tree for both hosting targets.
await copyFile(
  join(outputRoot, "_worker.js"),
  join("dist", "server", "index.js"),
);
