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
    .select("title, slug, excerpt, published_at, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(20);

  const posts = data ?? [];

  const items = posts
    .map((p) => {
      const link = `${siteConfig.url}/blog/${p.slug}`;
      const pubDate = p.published_at ? new Date(p.published_at).toUTCString() : "";
      const description = p.excerpt ? xmlEscape(p.excerpt) : "";
      return `  <item>
    <title>${xmlEscape(p.title)}</title>
    <link>${xmlEscape(link)}</link>
    <guid isPermaLink="true">${xmlEscape(link)}</guid>
    ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ""}
    <description>${description}</description>
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(siteConfig.name)}</title>
    <link>${xmlEscape(siteConfig.url)}</link>
    <description>${xmlEscape(siteConfig.description)}</description>
    <language>vi</language>
    <atom:link href="${xmlEscape(siteConfig.url)}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
