import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const outputRoot = fileURLToPath(new URL("../dist/client/", import.meta.url));
const serverEntry = fileURLToPath(
  new URL("../dist/server/index.js", import.meta.url),
);
const siteUrl = "https://lunario-educacao-cultura.pages.dev";

const routes = [
  "/",
  "/editorial/",
  "/editorial/a-leitura-como-forma-de-presenca/",
  "/editorial/entre-a-sala-de-aula-e-o-mundo/",
  "/editorial/cronica-de-uma-cidade-que-le/",
  "/editorial/o-intervalo-entre-duas-paginas/",
  "/editorial/cultura-tambem-se-faz-por-aproximacao/",
  "/editorial/palavras-em-uso-sentidos-em-transito/",
  "/cursos/",
  "/cursos/oficina-de-escrita-literaria/",
  "/cursos/leitura-e-mediacao-cultural/",
  "/cursos/literatura-na-escola/",
  "/cursos/cronica-olhar-memoria-e-cidade/",
  "/cursos/producao-cultural-em-pequena-escala/",
  "/cursos/laboratorio-de-leitura-critica/",
  "/producao-bibliografica/",
  "/producao-bibliografica/cadernos-de-leitura-e-cultura/",
  "/producao-bibliografica/educacao-linguagem-e-presenca/",
  "/producao-bibliografica/percursos-de-escrita/",
  "/producao-bibliografica/notas-sobre-a-cidade-leitora/",
  "/producao-bibliografica/mediacao-e-repertorio/",
  "/producao-bibliografica/cartografias-da-palavra/",
  "/eventos-e-projetos/",
  "/eventos/bienal-internacional-do-livro-2026/",
  "/projetos/sarau-lunario/",
  "/projetos/circulo-de-leitura/",
  "/formularios/",
  "/formularios/avaliacao-caderno-6-01/",
  "/formularios/inscricao-em-cursos/",
  "/formularios/participacao-em-eventos/",
  "/formularios/contato/",
  "/politica-de-privacidade/",
];

const confirmationRoutes = [
  "/formularios/avaliacao-caderno-6-01/enviado/",
];

const expectedAssets = [
  "apple-touch-icon.png",
  "favicon-32.png",
  "favicon.ico",
  "lunario-brand-mark.webp",
  "lunario-event-books.webp",
  "lunario-hero-bg.webp",
  "lunario-social-2026.jpg",
  "_headers",
];

function routeFile(route) {
  const segments = route.split("/").filter(Boolean);
  return join(outputRoot, ...segments, "index.html");
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

test("exports every public route as directly addressable HTML", async () => {
  for (const route of routes) {
    const path = routeFile(route);
    assert.equal(await fileExists(path), true, `Missing export for ${route}`);

    const html = await readFile(path, "utf8");
    assert.match(html, /<!DOCTYPE html>/i, `Invalid HTML for ${route}`);
    assert.match(html, /<html[^>]+lang="pt-BR"/i, `Missing language for ${route}`);
    assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
  }
});

test("keeps all internal navigation links resolvable", async () => {
  for (const route of routes) {
    const html = await readFile(routeFile(route), "utf8");
    const links = html.matchAll(/<a\b[^>]*\bhref=(["'])(.*?)\1/gi);

    for (const [, , href] of links) {
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("//")
      ) {
        continue;
      }

      const pathname = decodeURIComponent(
        new URL(href, "https://lunario.test").pathname,
      );
      const target = extname(pathname)
        ? join(outputRoot, ...pathname.split("/").filter(Boolean))
        : routeFile(pathname);

      assert.equal(
        await fileExists(target),
        true,
        `${route} links to missing target ${href}`,
      );
    }
  }
});

test("exports confirmation pages without indexing them", async () => {
  for (const route of confirmationRoutes) {
    const path = routeFile(route);
    assert.equal(await fileExists(path), true, `Missing export for ${route}`);

    const html = await readFile(path, "utf8");
    assert.match(html, /<!DOCTYPE html>/i, `Invalid HTML for ${route}`);
    const robotsMeta = html.match(
      /<meta[^>]+name="robots"[^>]+content="[^"]*"[^>]*>/i,
    )?.[0];
    assert.ok(robotsMeta, `Missing robots metadata for ${route}`);
    assert.match(robotsMeta, /\bnoindex\b/i, `Missing noindex for ${route}`);
    assert.match(robotsMeta, /\bnofollow\b/i, `Missing nofollow for ${route}`);
  }
});

test("embeds admin HTML in the worker without public admin assets", async () => {
  assert.equal(
    await fileExists(join(outputRoot, "admin")),
    false,
    "The public admin asset tree must be removed after the build",
  );
  assert.equal(
    await fileExists(join(outputRoot, "_private")),
    false,
    "No private HTML should remain addressable through the asset service",
  );

  const worker = await readFile(join(outputRoot, "_worker.js"), "utf8");
  assert.match(worker, /<!DOCTYPE html>/i, "Admin HTML is missing from the worker");
  assert.match(worker, /\bnoindex\b/i, "Embedded admin HTML is missing noindex");
  assert.match(worker, /\bnofollow\b/i, "Embedded admin HTML is missing nofollow");
  assert.match(worker, /admin-login-form/i, "Login HTML is missing from the worker");
  assert.match(
    worker,
    /admin-dashboard/i,
    "Dashboard HTML is missing from the worker",
  );

  const sitesWorker = await readFile(serverEntry, "utf8");
  assert.equal(
    sitesWorker,
    worker,
    "Sites must deploy the same authenticated advanced-mode Worker",
  );
});

test("exports SEO, social, crawler and error assets", async () => {
  assert.equal(
    await fileExists(join(outputRoot, "_worker.js")),
    true,
    "Missing the Cloudflare Pages advanced-mode worker",
  );

  const [rootHtml, notFoundHtml, robots, sitemap] = await Promise.all([
    readFile(routeFile("/"), "utf8"),
    readFile(join(outputRoot, "404.html"), "utf8"),
    readFile(join(outputRoot, "robots.txt"), "utf8"),
    readFile(join(outputRoot, "sitemap.xml"), "utf8"),
  ]);

  assert.match(rootHtml, /<title>Lunário — Educação e Cultura<\/title>/i);
  assert.match(rootHtml, /property="og:image"/i);
  assert.match(rootHtml, /name="twitter:card" content="summary_large_image"/i);
  assert.match(rootHtml, /rel="canonical"/i);
  assert.match(notFoundHtml, /Página não encontrada/i);
  assert.match(robots, /User-Agent:\s*\*/i);
  assert.match(robots, /Disallow:\s*\/admin\//i);
  assert.match(robots, /Disallow:\s*\/api\/admin\//i);
  assert.match(robots, new RegExp(`Sitemap:\\s*${siteUrl}/sitemap\\.xml`, "i"));

  for (const route of routes) {
    const canonicalRoute = route === "/" ? "" : route.replace(/\/$/, "");
    assert.match(sitemap, new RegExp(`<loc>${siteUrl}${canonicalRoute}</loc>`));
  }

  for (const asset of expectedAssets) {
    assert.equal(
      await fileExists(join(outputRoot, asset)),
      true,
      `Missing public asset ${asset}`,
    );
  }
});
