const FALLBACK_SITE_URL =
  "https://lunario-educacao-cultura.pages.dev";

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.CF_PAGES_URL ??
  FALLBACK_SITE_URL
).replace(/\/+$/, "");

export const siteTitle = "Lunário — Educação e Cultura";
export const siteDescription =
  "Conhecimento que transforma. Cultura que conecta. Textos, cursos, publicações, eventos e projetos do Lunário.";
