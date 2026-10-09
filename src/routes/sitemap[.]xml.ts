import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { fetchActiveProductsCached } from "@/lib/catalog.server";

// Sitemaps MUST contain absolute URLs (https://host/path). Relative ones make Google report
// "Couldn't fetch". www is the canonical host of the live site.
const BASE_URL = "https://www.versatilehub.in";

const escapeXml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // Never fail the whole sitemap just because the product query hiccupped.
        const products = await fetchActiveProductsCached().catch(() => []);
        const today = new Date().toISOString().slice(0, 10);
        const entries = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/shop", changefreq: "daily", priority: "0.9" },
          ...["/shipping", "/returns", "/terms", "/privacy", "/size-guide", "/care", "/nature-initiative"].map(
            (path) => ({ path, changefreq: "monthly", priority: "0.4" }),
          ),
          ...products.map((p) => ({
            path: `/product/${p.slug}`,
            changefreq: "weekly",
            priority: "0.7",
          })),
        ];


        const urls = entries
          .map(
            (e) =>
              `  <url>\n    <loc>${escapeXml(BASE_URL + e.path)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
          )
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
