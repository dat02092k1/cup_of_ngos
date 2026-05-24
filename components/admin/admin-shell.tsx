"use client";
import * as React from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/utils/site";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/toaster";

export function AdminShell({ children, userEmail }: { children: React.ReactNode; userEmail?: string | null }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-lg font-semibold">
              {siteConfig.name}
            </Link>
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {userEmail ? <span className="hidden text-muted-foreground sm:inline">{userEmail}</span> : null}
            <ThemeToggle />
            <a className="text-muted-foreground hover:text-foreground" href="/api/auth/signout">
              Đăng xuất
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <Toaster />
    </div>
  );
}
