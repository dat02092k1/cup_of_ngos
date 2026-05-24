export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "cupofngos",
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Blog cá nhân",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://cupofngos.vercel.app",
  author: { name: "cupofngos", url: "https://github.com/" },
  ogImage: "/og-default.png",
} as const;
export type SiteConfig = typeof siteConfig;
