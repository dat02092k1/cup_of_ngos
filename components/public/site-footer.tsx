import { siteConfig } from "@/lib/utils/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-2 px-4 py-8 text-xs text-muted-foreground sm:flex-row">
        <p>
          © {year} {siteConfig.name}
        </p>
        <div className="flex items-center gap-4">
          <a href="/rss.xml" className="hover:text-foreground">
            RSS
          </a>
          <a href="https://github.com/" target="_blank" rel="noreferrer" className="hover:text-foreground">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
