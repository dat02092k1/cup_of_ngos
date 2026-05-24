import { siteConfig } from "@/lib/utils/site";

export const revalidate = 86400;

export async function GET() {
  const body = `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${siteConfig.url}/sitemap.xml\n`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
