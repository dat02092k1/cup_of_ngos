"use client";
import Link from "next/link";
import { siteConfig } from "@/lib/utils/site";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6">
        <div>
          <Link href="/" className="text-xl font-semibold tracking-tight">
            {siteConfig.name}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">{siteConfig.description}</p>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/about" className="text-muted-foreground hover:text-foreground">
            Về mình
          </Link>
          <a href="/rss.xml" className="text-muted-foreground hover:text-foreground">
            RSS
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
