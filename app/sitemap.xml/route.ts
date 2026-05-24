import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/lib/utils/site";

export const revalidate = 300;

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("posts")
    .select("slug, updated_at, tags")
    .eq("status", "published");

  const posts = data ?? [];
  const distinctTags = new Set<string>();
  for (const p of posts) for (const t of p.tags ?? []) distinctTags.add(t);

  const entries: { loc: string; lastmod?: string; priority: number }[] = [
    { loc: `${siteConfig.url}/`, priority: 1.0 },
    { loc: `${siteConfig.url}/about`, priority: 0.5 },
  ];
  for (const p of posts) {
    entries.push({
      loc: `${siteConfig.url}/blog/${p.slug}`,
      lastmod: p.updated_at ?? undefined,
      priority: 0.8,
    });
  }
  for (const t of distinctTags) {
    entries.push({
      loc: `${siteConfig.url}/tags/${encodeURIComponent(t)}`,
      priority: 0.4,
    });
  }

  const urls = entries
    .map((e) => {
      const lm = e.lastmod ? `\n    <lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : "";
      return `  <url>\n    <loc>${xmlEscape(e.loc)}</loc>${lm}\n    <priority>${e.priority.toFixed(1)}</priority>\n  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
