# Plan — cupofngos (personal Vietnamese blog)

> Every task MUST be self-contained: a fresh-read subagent (no conversation context) must be able to execute it with just the task + `spec.md`.
> Read `spec.md` in the same folder for overall context before any task.

## Execution order

Foundational tasks (1–7) must run sequentially. After Task 7, several branches run in parallel; see "Depends on" per task.

Working directory: `d:\projects\vibe_blog\`. The project is being created from scratch (only `.claude/` and `specs/` currently exist).

---

## Task 1 — Initialize Next.js project, install dependencies, base config

- **Type:** create
- **Files involved:**
  - `package.json`
  - `tsconfig.json`
  - `next.config.ts`
  - `postcss.config.mjs`
  - `tailwind.config.ts`
  - `.gitignore`
  - `.eslintrc.json`
  - `.prettierrc`
- **Depends on:** none
- **What to do:**
  - Initialize a Next.js 15 project with TypeScript, App Router, Tailwind CSS, ESLint. (You may run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --no-turbopack` or write the files manually; do NOT enable Turbopack to avoid Novel.sh / TipTap issues.)
  - Set `tsconfig.json` `"strict": true`, `"noUncheckedIndexedAccess": true`.
  - Configure `tsconfig.json` paths: `"@/*": ["./*"]`.
  - In `next.config.ts`, configure `images.remotePatterns` to allow `https://*.supabase.co` (use a wildcard `protocol: 'https', hostname: '*.supabase.co'`).
  - Install runtime deps (single command):
    ```
    npm i @supabase/supabase-js @supabase/ssr novel slugify date-fns next-themes @vercel/analytics @giscus/react lucide-react class-variance-authority clsx tailwind-merge tailwindcss-animate node-html-parser @tiptap/html @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-task-list @tiptap/extension-task-item @tiptap/extension-code-block-lowlight lowlight server-only
    ```
  - Install dev deps:
    ```
    npm i -D @tailwindcss/typography prettier prettier-plugin-tailwindcss
    ```
  - Configure `.prettierrc`:
    ```json
    { "semi": true, "singleQuote": false, "trailingComma": "all", "plugins": ["prettier-plugin-tailwindcss"] }
    ```
  - Add to `package.json` `scripts`: `"lint:fix": "next lint --fix"`, `"format": "prettier --write ."`.
  - Ensure `.gitignore` includes `.env.local`, `.env`, `.vercel`, `node_modules`, `.next`.
- **Constraints / conventions:** see spec §6.
- **Done criteria:**
  - [ ] `npm run dev` starts on http://localhost:3000 and shows the default Next.js page (or a placeholder; will be replaced later).
  - [ ] `npm run build` succeeds.
  - [ ] `tsconfig.json` has `strict: true` and `noUncheckedIndexedAccess: true`.
- **How to verify:** run `npm run build` and confirm zero errors.

---

## Task 2 — Tailwind + Typography + global styles + fonts

- **Type:** edit
- **Files involved:**
  - `tailwind.config.ts`
  - `app/globals.css`
  - `app/layout.tsx` (root layout — overwrite default)
- **Depends on:** Task 1
- **What to do:**
  - In `tailwind.config.ts`:
    - Set `darkMode: ["class"]`.
    - Add `content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"]`.
    - Add `plugins: [require("@tailwindcss/typography"), require("tailwindcss-animate")]`.
    - Extend theme with shadcn-style CSS variables (`background`, `foreground`, `card`, `border`, `primary`, `muted`, `accent`, `destructive`) — see `https://ui.shadcn.com/docs/installation/manual` for exact variables (use the "neutral" base color).
    - Add `extend.typography` config that makes `prose` work in dark mode (`prose-invert` styles for `.dark .prose`).
    - Set font families: `sans: ["var(--font-inter)", "system-ui", "sans-serif"]`, `mono: ["var(--font-jetbrains-mono)", "monospace"]`.
  - In `app/globals.css`:
    - `@tailwind base; @tailwind components; @tailwind utilities;`
    - Add `:root { ... }` and `.dark { ... }` CSS variables (copy from shadcn neutral palette).
    - Add `html { scroll-behavior: smooth; }`.
    - Add `body { @apply bg-background text-foreground antialiased; }`.
  - In `app/layout.tsx`:
    - Use `next/font/google` to load `Inter` (subsets: `["latin", "vietnamese"]`, variable: `--font-inter`) and `JetBrains_Mono` (variable: `--font-jetbrains-mono`).
    - Set `<html lang="vi" suppressHydrationWarning>`.
    - Set `<body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>`.
    - Wrap children with `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` — import from a yet-to-be-created `@/components/theme-provider`.
    - Add `<Analytics />` from `@vercel/analytics/next` at end of body.
    - Set `export const metadata: Metadata` with `metadataBase: new URL(siteConfig.url)`, `title: { default: siteConfig.name, template: '%s — ' + siteConfig.name }`, `description: siteConfig.description`, OpenGraph + Twitter defaults. Import siteConfig from `@/lib/utils/site` (created in Task 4).
- **Constraints / conventions:** see spec §6.
- **Done criteria:**
  - [ ] `app/globals.css` includes both light and dark color vars.
  - [ ] `tailwind.config.ts` has typography plugin and dark mode class strategy.
  - [ ] Root layout sets `lang="vi"`, font variables, ThemeProvider, Analytics.
- **How to verify:** `npm run build` succeeds (ThemeProvider import will fail until Task 11 — temporarily inline a `(props) => <>{props.children}</>` placeholder if needed, then replace in Task 11).

---

## Task 3 — Supabase schema migration + seed file

- **Type:** create
- **Files involved:**
  - `supabase/migrations/0001_init.sql`
  - `supabase/seed.sql`
- **Depends on:** none (can run parallel with Tasks 1–2)
- **What to do:**
  - Create `supabase/migrations/0001_init.sql` with:
    - `create extension if not exists "pgcrypto";` (for `gen_random_uuid`).
    - `create table public.posts (...)` matching spec §3 exactly (all columns, types, defaults, constraints).
    - Unique index on `slug`.
    - B-tree index on `(status, published_at desc)`.
    - GIN index on `tags`.
    - Trigger function `set_updated_at()` returning trigger.
    - `before update` trigger on `posts` using that function.
    - `alter table public.posts enable row level security;`
    - Policy `posts_public_read`: `for select to anon, authenticated using (status = 'published')`.
    - Create storage bucket via SQL: `insert into storage.buckets (id, name, public) values ('blog-images', 'blog-images', true) on conflict do nothing;`.
    - Storage policies for `blog-images`:
      - Public read: `for select to anon, authenticated using (bucket_id = 'blog-images');`
      - No public write — uploads will use service role.
  - Create `supabase/seed.sql` that inserts one welcome post:
    - title: `Chào mừng đến với cupofngos`
    - slug: `chao-mung-den-voi-cupofngos`
    - content_json: minimal valid TipTap doc with one paragraph: `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Đây là bài viết đầu tiên trên blog của mình. Một tách cà phê, một dòng code, một suy nghĩ — mình sẽ ghi lại ở đây."}]}]}`
    - content_html: `<p>Đây là bài viết đầu tiên trên blog của mình. Một tách cà phê, một dòng code, một suy nghĩ — mình sẽ ghi lại ở đây.</p>`
    - excerpt: `Đây là bài viết đầu tiên trên blog của mình.`
    - status: `'published'`, published_at: `now()`
    - tags: `'{welcome}'::text[]`
    - reading_time_minutes: `1`
- **Constraints / conventions:** SQL uses `public` schema explicitly. Use lowercase identifiers.
- **Done criteria:**
  - [ ] Migration SQL, when pasted into Supabase SQL Editor of a fresh project, runs without error.
  - [ ] Seed SQL inserts one row and the row is visible in `posts` table.
- **How to verify:** the README (Task 32) will instruct the user to paste these files in order in Supabase SQL Editor. The author of this task should mentally run-through the SQL or use a local Postgres to validate syntax.

---

## Task 4 — Environment variables template + site config

- **Type:** create
- **Files involved:**
  - `.env.example`
  - `lib/utils/site.ts`
- **Depends on:** Task 1
- **What to do:**
  - `.env.example` exact contents:
    ```
    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_ROLE_KEY=
    ADMIN_GITHUB_EMAIL=
    NEXT_PUBLIC_SITE_URL=https://cupofngos.vercel.app
    NEXT_PUBLIC_SITE_NAME=cupofngos
    NEXT_PUBLIC_SITE_DESCRIPTION=Blog cá nhân — ghi lại những điều thú vị
    NEXT_PUBLIC_GISCUS_REPO=
    NEXT_PUBLIC_GISCUS_REPO_ID=
    NEXT_PUBLIC_GISCUS_CATEGORY=
    NEXT_PUBLIC_GISCUS_CATEGORY_ID=
    ```
  - `lib/utils/site.ts`:
    ```ts
    export const siteConfig = {
      name: process.env.NEXT_PUBLIC_SITE_NAME || "cupofngos",
      description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Blog cá nhân",
      url: process.env.NEXT_PUBLIC_SITE_URL || "https://cupofngos.vercel.app",
      author: { name: "cupofngos", url: "https://github.com/" },
      ogImage: "/og-default.png",
    } as const;
    export type SiteConfig = typeof siteConfig;
    ```
  - Create a placeholder `public/og-default.png` (any 1200x630 PNG; if you cannot generate, create the file empty so the path resolves; user can replace later).
- **Constraints / conventions:** All `NEXT_PUBLIC_*` are safe to read in client code. Non-prefixed are server-only.
- **Done criteria:**
  - [ ] `.env.example` contains exactly the keys above.
  - [ ] `lib/utils/site.ts` exports `siteConfig` and `SiteConfig`.
- **How to verify:** TypeScript compiles. `siteConfig.name` etc. are accessible.

---

## Task 5 — Supabase clients + database types

- **Type:** create
- **Files involved:**
  - `lib/supabase/server.ts`
  - `lib/supabase/browser.ts`
  - `lib/supabase/admin.ts`
  - `types/database.ts`
  - `types/post.ts`
- **Depends on:** Task 1, Task 4
- **What to do:**
  - `types/database.ts`: define minimal types matching the `posts` table (don't rely on `supabase gen types` for v1, hand-roll):
    ```ts
    export type PostStatus = "draft" | "published";
    export interface PostRow {
      id: string;
      title: string;
      slug: string;
      content_json: unknown;
      content_html: string;
      excerpt: string;
      cover_image_url: string | null;
      status: PostStatus;
      published_at: string | null;
      tags: string[];
      reading_time_minutes: number;
      created_at: string;
      updated_at: string;
    }
    export interface Database {
      public: {
        Tables: {
          posts: { Row: PostRow; Insert: Partial<PostRow> & { title: string; slug: string; content_json: unknown }; Update: Partial<PostRow> };
        };
      };
    }
    ```
  - `types/post.ts`: re-export `PostRow as Post`, `PostStatus`, plus type aliases used by UI (e.g. `PostListItem = Pick<Post, "id" | "title" | "slug" | "excerpt" | "cover_image_url" | "tags" | "published_at" | "reading_time_minutes">`).
  - `lib/supabase/browser.ts` (Client Components):
    ```ts
    "use client";
    import { createBrowserClient } from "@supabase/ssr";
    import type { Database } from "@/types/database";
    export function createSupabaseBrowserClient() {
      return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
    }
    ```
  - `lib/supabase/server.ts` (Server Components / Route Handlers / Server Actions):
    ```ts
    import "server-only";
    import { cookies } from "next/headers";
    import { createServerClient } from "@supabase/ssr";
    import type { Database } from "@/types/database";
    export async function createSupabaseServerClient() {
      const cookieStore = await cookies();
      return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: (cookiesToSet) => {
              try {
                cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
              } catch { /* called from Server Component — ignore, middleware will refresh */ }
            },
          },
        },
      );
    }
    ```
  - `lib/supabase/admin.ts` (service-role; bypasses RLS):
    ```ts
    import "server-only";
    import { createClient } from "@supabase/supabase-js";
    import type { Database } from "@/types/database";
    export function createSupabaseAdminClient() {
      return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
    }
    ```
- **Constraints / conventions:** never import `admin.ts` or `server.ts` from a Client Component. `"server-only"` guards this at build time.
- **Done criteria:**
  - [ ] All three client factories exist and compile.
  - [ ] `Database` type covers the `posts` table.
- **How to verify:** `npm run build` succeeds.

---

## Task 6 — Utility modules (slug, reading time, excerpt, TOC, TipTap→HTML, tags)

- **Type:** create
- **Files involved:**
  - `lib/utils/slug.ts`
  - `lib/utils/reading-time.ts`
  - `lib/utils/excerpt.ts`
  - `lib/utils/extract-toc.ts`
  - `lib/utils/tiptap-html.ts`
  - `lib/utils/tags.ts`
  - `lib/utils/cn.ts`
- **Depends on:** Task 1
- **What to do:**
  - `cn.ts`: standard shadcn `cn` helper using `clsx` + `tailwind-merge`.
  - `slug.ts`:
    ```ts
    import slugify from "slugify";
    export function vietnameseSlugify(input: string): string {
      return slugify(input, { lower: true, strict: true, locale: "vi", trim: true });
    }
    ```
  - `tags.ts`: `normalizeTag(raw) => vietnameseSlugify(raw).slice(0, 40)`; `parseTagsInput(commaOrChip) => string[]` (dedupe, drop empties).
  - `tiptap-html.ts`: server-only utility that converts TipTap JSON to HTML using `@tiptap/html` `generateHTML`. Configure the SAME extensions used by Novel editor in Task 12 (StarterKit, Image, Link, TaskList, TaskItem, CodeBlockLowlight with `lowlight` for syntax highlighting — pass common languages: `javascript, typescript, bash, json, sql, python, html, css`). Export:
    ```ts
    import "server-only";
    export function jsonToHtml(doc: unknown): string { /* ... */ }
    export function htmlToPlainText(html: string): string { /* strip tags via node-html-parser */ }
    ```
  - `reading-time.ts`:
    ```ts
    export function readingTimeMinutes(plainText: string): number {
      const words = plainText.trim().split(/\s+/).filter(Boolean).length;
      return Math.max(1, Math.ceil(words / 200));
    }
    ```
  - `excerpt.ts`:
    ```ts
    export function autoExcerpt(plainText: string, max = 160): string {
      const trimmed = plainText.trim().replace(/\s+/g, " ");
      if (trimmed.length <= max) return trimmed;
      return trimmed.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
    }
    ```
  - `extract-toc.ts`: uses `node-html-parser`. For each `<h2>` in `content_html`, generate an `id` (vietnameseSlugify of text). Mutate the HTML to add `id` attribute on `<h2>` and return both the modified HTML AND a TOC array `{ id, text }[]`. The publish action will call this BEFORE persisting `content_html` so headings already carry IDs for anchor links. Signature:
    ```ts
    export function extractTocAndAnchorize(html: string): { html: string; toc: { id: string; text: string }[] };
    ```
- **Constraints / conventions:** all utility files are pure functions where possible; `tiptap-html.ts` and `extract-toc.ts` import `"server-only"` because they run during publish on the server.
- **Done criteria:**
  - [ ] All seven utility files compile and export their named functions.
  - [ ] `vietnameseSlugify("Học AI cùng Claude!")` returns `"hoc-ai-cung-claude"` (verify manually by adding a temporary `console.log` and running `npm run build`, then remove).
- **How to verify:** `npm run build`. Optionally write a 5-line ad-hoc Node script that imports and tests each function, then delete it.

---

## Task 7 — Auth: require-admin util, OAuth callback, sign-out

- **Type:** create
- **Files involved:**
  - `lib/auth/require-admin.ts`
  - `app/api/auth/callback/route.ts`
  - `app/api/auth/signout/route.ts`
- **Depends on:** Task 5
- **What to do:**
  - `lib/auth/require-admin.ts`:
    ```ts
    import "server-only";
    import { redirect } from "next/navigation";
    import { createSupabaseServerClient } from "@/lib/supabase/server";
    export async function requireAdmin() {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      const allowed = process.env.ADMIN_GITHUB_EMAIL?.toLowerCase().trim();
      if (!user || !allowed || user.email?.toLowerCase() !== allowed) {
        redirect("/admin/login");
      }
      return user;
    }
    export async function getAdminUserOrNull() {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      const allowed = process.env.ADMIN_GITHUB_EMAIL?.toLowerCase().trim();
      if (!user || !allowed || user.email?.toLowerCase() !== allowed) return null;
      return user;
    }
    ```
  - `app/api/auth/callback/route.ts`:
    ```ts
    import { NextResponse } from "next/server";
    import { createSupabaseServerClient } from "@/lib/supabase/server";
    export async function GET(request: Request) {
      const { searchParams, origin } = new URL(request.url);
      const code = searchParams.get("code");
      if (code) {
        const supabase = await createSupabaseServerClient();
        await supabase.auth.exchangeCodeForSession(code);
        const { data: { user } } = await supabase.auth.getUser();
        const allowed = process.env.ADMIN_GITHUB_EMAIL?.toLowerCase().trim();
        if (user?.email?.toLowerCase() === allowed) {
          return NextResponse.redirect(`${origin}/admin`);
        }
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/admin/login?error=not_allowed`);
      }
      return NextResponse.redirect(`${origin}/admin/login?error=missing_code`);
    }
    ```
  - `app/api/auth/signout/route.ts`:
    ```ts
    import { NextResponse } from "next/server";
    import { createSupabaseServerClient } from "@/lib/supabase/server";
    export async function GET(request: Request) {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
      const { origin } = new URL(request.url);
      return NextResponse.redirect(`${origin}/`);
    }
    ```
- **Constraints / conventions:** all server-only files use `"server-only"` import. Email comparison is case-insensitive and trimmed.
- **Done criteria:**
  - [ ] `requireAdmin()` redirects to `/admin/login` if not authed or not allowlisted.
  - [ ] Callback exchanges code, validates email, redirects appropriately.
  - [ ] Sign-out route clears session and redirects home.
- **How to verify:** code compiles. Full e2e verification happens after Task 8 (login page).

---

## Task 8 — Admin login page

- **Type:** create
- **Files involved:** `app/admin/login/page.tsx`
- **Depends on:** Task 5
- **What to do:**
  - Client Component (since it uses Supabase browser client to initiate OAuth).
  - UI: centered card, site name, "Đăng nhập với GitHub" button.
  - On button click: call `supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: `${window.location.origin}/api/auth/callback` } })`.
  - Read `?error=` from `useSearchParams`. If `error === "not_allowed"` show "Tài khoản GitHub không được phép truy cập trang quản trị."; if `error === "missing_code"` show "Đã xảy ra lỗi xác thực, vui lòng thử lại."
  - Wrap in `<Suspense>` because `useSearchParams` requires it.
- **Constraints / conventions:** Vietnamese strings. Tailwind utility classes only. No shadcn yet (Task 11 installs shadcn); use plain `<button>` with `className="..."`.
- **Done criteria:**
  - [ ] Visiting `/admin/login` shows the login UI.
  - [ ] Clicking the button initiates GitHub OAuth flow.
- **How to verify:** in dev, manually click and confirm redirect to GitHub. (Requires Supabase project set up per README.)

---

## Task 9 — Admin layout, admin shell, theme provider, theme toggle, shadcn/ui base

- **Type:** create
- **Files involved:**
  - `components/theme-provider.tsx`
  - `components/theme-toggle.tsx`
  - `components/ui/button.tsx`
  - `components/ui/input.tsx`
  - `components/ui/textarea.tsx`
  - `components/ui/label.tsx`
  - `components/ui/dialog.tsx`
  - `components/ui/dropdown-menu.tsx`
  - `components/ui/toast.tsx` (with `toaster.tsx` and `use-toast.ts` hook — shadcn style)
  - `components/ui/badge.tsx`
  - `components/ui/card.tsx`
  - `components/admin/admin-shell.tsx`
  - `app/admin/layout.tsx`
- **Depends on:** Task 2, Task 7
- **What to do:**
  - Install shadcn components manually (do NOT run the shadcn CLI which would require initialization confirmations; copy the component code from `https://ui.shadcn.com/docs/components/<name>` into each file). Required installs: install also `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-slot`, `@radix-ui/react-toast`:
    ```
    npm i @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-slot @radix-ui/react-toast
    ```
  - `theme-provider.tsx`: thin wrapper over `next-themes`' `ThemeProvider`. Mark `"use client"`.
  - `theme-toggle.tsx`: Client Component using `useTheme()` from `next-themes`; renders sun/moon icon (lucide-react) toggle button. Avoid hydration mismatch via mounted check.
  - `admin-shell.tsx`: Client Component (uses interactive nav). Top bar with site name + "Admin" badge + user email + sign-out link (`<a href="/api/auth/signout">`). Body wraps `{children}`. Use Tailwind for layout, mobile responsive.
  - `app/admin/layout.tsx`:
    - Server Component.
    - Calls `await requireAdmin()` for any route under `/admin` EXCEPT `/admin/login`. Pattern: check `headers().get("x-pathname")` won't work reliably; instead, place `app/admin/login/page.tsx` OUTSIDE this layout by using a route group. Restructure: move login to `app/(auth)/admin/login/page.tsx`? Simpler approach: keep `app/admin/login/page.tsx` but make `app/admin/layout.tsx` skip the guard when `children` is the login page. Cleanest pattern: use a route group: rename to `app/admin/(protected)/layout.tsx` containing the guard, with admin pages inside the group; login stays at `app/admin/login/page.tsx` (outside the group).
    - **Final structure (use this):**
      - `app/admin/login/page.tsx` (no guard layout)
      - `app/admin/(protected)/layout.tsx` (calls `requireAdmin`, renders `<AdminShell>`)
      - `app/admin/(protected)/page.tsx` (dashboard, Task 14)
      - `app/admin/(protected)/posts/new/page.tsx` (Task 16)
      - `app/admin/(protected)/posts/[id]/edit/page.tsx` (Task 17)
      - `app/admin/(protected)/posts/[id]/preview/page.tsx` (Task 18)
      - URLs remain `/admin`, `/admin/posts/new`, etc. (route groups don't appear in URL).
  - Update Task 2's root layout to import the real `ThemeProvider` from `@/components/theme-provider`.
- **Constraints / conventions:** Vietnamese UI strings. All Client Components mark `"use client"`. shadcn components reference `@/lib/utils/cn`.
- **Done criteria:**
  - [ ] Unauthed visit to `/admin` redirects to `/admin/login`.
  - [ ] Allowlisted-email visit to `/admin` renders the shell.
  - [ ] Theme toggle works on the admin shell.
  - [ ] All shadcn primitives compile.
- **How to verify:** `npm run dev`, hit `/admin`, observe redirect; sign in via GitHub (after Supabase setup per README), see shell.

---

## Task 10 — Post server actions (CRUD + publish/unpublish)

- **Type:** create
- **Files involved:** `lib/actions/posts.ts`
- **Depends on:** Task 5, Task 6, Task 7
- **What to do:**
  - First line: `"use server";`
  - Import `requireAdmin` for ALL actions (defense in depth).
  - Use `createSupabaseAdminClient()` for all DB mutations (bypasses RLS, since we already authenticated).
  - Use `revalidatePath` from `next/cache` after publish/unpublish/delete.
  - Implement exactly per spec §5:
    - `createDraftPost()`:
      - title default `"Bài viết không tiêu đề"`, slug `"untitled-" + first-8-chars-of-uuid`.
      - content_json: empty TipTap doc `{ type: "doc", content: [{ type: "paragraph" }] }`.
      - status: `'draft'`.
      - Returns `{ ok: true, id }`.
    - `autosavePost(id, patch)`:
      - Build update object containing ONLY the fields in `patch` (so we don't accidentally set other fields to undefined).
      - If `patch.title` provided and `patch.slug` NOT provided, auto-fill slug from title via `vietnameseSlugify` (but only if current slug starts with `"untitled-"` — don't overwrite a custom slug).
      - Tags array: normalize each tag.
      - Returns `{ ok: true, updated_at }` (read back the returned row).
    - `publishPost(id)`:
      - Fetch row.
      - Validate: title trim non-empty, slug non-empty, content_json has at least one non-empty child.
      - Check slug uniqueness against other rows: `select id from posts where slug = $1 and id <> $2 limit 1`.
      - Compute HTML: `jsonToHtml(content_json)` → `extractTocAndAnchorize(html)` → use the modified html.
      - Compute plain text via `htmlToPlainText(html)`; compute reading time via `readingTimeMinutes`.
      - If `excerpt` is blank, set to `autoExcerpt(plainText)`.
      - Update row: `status='published'`, `published_at = coalesce(published_at, now())`, `content_html`, `reading_time_minutes`, `excerpt` (if was blank).
      - `revalidatePath("/")`, `revalidatePath("/blog/${slug}")`, then for each tag `revalidatePath("/tags/${tag}")`.
      - `revalidatePath("/sitemap.xml")`, `revalidatePath("/rss.xml")`.
      - Return `{ ok: true, slug }`.
    - `unpublishPost(id)`: set `status='draft'`, do NOT touch `published_at`. Revalidate.
    - `deletePost(id)`: fetch row first to know slug+tags for revalidation, then delete, then revalidate. Returns `{ ok: true }`.
- **Constraints / conventions:** all returned strings (errors) in Vietnamese. Use try/catch around DB calls; on error return `{ ok: false, error: "Đã xảy ra lỗi: " + e.message }`.
- **Done criteria:**
  - [ ] All five functions exported and typed per spec §5.
  - [ ] Each calls `await requireAdmin()` at top.
  - [ ] Compiles with no `any` leaks.
- **How to verify:** TypeScript check. Functional check happens after Task 13 (post form) and Task 14 (dashboard).

---

## Task 11 — Image upload server action

- **Type:** create
- **Files involved:** `lib/actions/upload.ts`
- **Depends on:** Task 5, Task 7
- **What to do:**
  - First line: `"use server";`
  - Function `uploadImage(formData: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }>`.
  - Call `requireAdmin()`.
  - Read `file = formData.get("file")` as `File`. If not File → error.
  - Validate: `file.type` ∈ {`image/jpeg`, `image/png`, `image/webp`, `image/gif`}; `file.size <= 8 * 1024 * 1024`.
  - Generate path: `<year>/<month>/<uuid>.<ext>`. Ext from `file.name` or from mime.
  - Use `createSupabaseAdminClient().storage.from("blog-images").upload(path, file, { contentType: file.type, cacheControl: "31536000" })`.
  - Get public URL via `storage.from("blog-images").getPublicUrl(path).data.publicUrl`.
  - Return `{ ok: true, url }`.
- **Constraints / conventions:** errors in Vietnamese.
- **Done criteria:**
  - [ ] Compiles.
  - [ ] On valid image, returns Supabase public URL.
- **How to verify:** functional check happens after Task 12 (editor uses this).

---

## Task 12 — Novel.sh editor wrapper with image upload

- **Type:** create
- **Files involved:** `components/admin/novel-editor.tsx`
- **Depends on:** Task 11
- **What to do:**
  - `"use client";`
  - Use `EditorRoot`, `EditorContent`, `EditorBubble`, `EditorCommand` etc. from `novel` package per Novel's docs: https://github.com/steven-tey/novel
  - Props: `{ value: JSONContent | null; onChange: (json: JSONContent, html: string) => void; placeholder?: string }`.
  - Configure extensions matching `lib/utils/tiptap-html.ts` (StarterKit, Image, Link, TaskList, TaskItem, CodeBlockLowlight + lowlight).
  - Image upload handler: when user pastes/drops/inserts an image, call `uploadImage` via a form action or direct fetch:
    - Wrap `uploadImage` server action invocation: convert File to FormData, call action; on success insert image node with the returned URL.
    - Show toast on failure.
  - Slash command menu items (Vietnamese labels): Heading 1, Heading 2, Heading 3, Bullet List, Numbered List, To-do, Quote, Code Block, Image, Divider.
  - Apply `prose dark:prose-invert max-w-none` className to editor surface.
- **Constraints / conventions:** stop typing autosave is handled by parent (`PostForm`), this component just emits onChange. Debounce is NOT inside this component.
- **Done criteria:**
  - [ ] Renders editor with toolbar bubble + slash menu.
  - [ ] Image drop/paste uploads to Supabase Storage and inserts the URL.
  - [ ] Component exports `JSONContent` type-compatible value/onChange.
- **How to verify:** mount in a sandbox page, paste an image, confirm URL appears.

---

## Task 13 — Post form (autosave + Novel + meta fields), tag input, cover image, autosave indicator, publish/delete dialogs

- **Type:** create
- **Files involved:**
  - `components/admin/tag-input.tsx`
  - `components/admin/image-upload-button.tsx`
  - `components/admin/autosave-indicator.tsx`
  - `components/admin/publish-dialog.tsx`
  - `components/admin/delete-dialog.tsx`
  - `components/admin/post-form.tsx`
- **Depends on:** Task 9, Task 10, Task 11, Task 12
- **What to do:**
  - All `"use client"`.
  - `tag-input.tsx`: chip-style input. Props: `{ value: string[]; onChange: (tags: string[]) => void; suggestions?: string[] }`. Enter or comma adds tag (normalized via `normalizeTag`). Backspace on empty input removes last tag. Render existing tags as Badge with × button. Show suggestions below as clickable chips.
  - `image-upload-button.tsx`: button + hidden file input. On select: call `uploadImage` via formData; on success call `onUploaded(url)` prop. Show preview thumbnail when `value` URL is set; show "Remove" button to clear. Props: `{ value: string | null; onChange: (url: string | null) => void }`.
  - `autosave-indicator.tsx`: small text component. Props: `{ state: "idle" | "saving" | "saved" | "error"; savedAt?: string }`. Idle: nothing. Saving: "Đang lưu…". Saved: "Đã lưu lúc HH:MM". Error: red "Lỗi lưu".
  - `publish-dialog.tsx`: shadcn Dialog. Trigger button "Publish" / "Unpublish". Body: "Đăng bài này lên blog công khai?" or similar. Confirm/Cancel buttons. Calls action passed via prop.
  - `delete-dialog.tsx`: similar but red "Xóa". Body: "Xóa bài viết này? Hành động không hoàn tác."
  - `post-form.tsx`: main form component.
    - Props: `{ post: Post }` (always has an id — created by Task 16).
    - Local state: title, slug, excerpt, cover_image_url, tags, content_json, content_html (derived from editor).
    - Autosave: `useEffect` watching the state, debounced 1500ms via `setTimeout` + clearTimeout pattern (don't add lodash). On debounce fire: call `autosavePost(id, patch)`; set indicator state. Skip first render (initial mount).
    - Slug: if user manually edited slug, stop auto-deriving. Track an "isSlugDirty" boolean; once true, keep manual value.
    - Layout: two-column on desktop, stacked on mobile. Left: title input (big, no border), slug input (small, prefixed `/blog/`), editor (Novel). Right sidebar: status badge, Publish/Unpublish button, "View public" link if published, Delete button, cover image upload, excerpt textarea, tag input.
    - "Preview" button: opens `/admin/posts/<id>/preview` in new tab.
    - "Publish": triggers `publish-dialog`, then calls `publishPost(id)`. On success, toast + revalidate UI.
    - "Delete": triggers `delete-dialog`, calls `deletePost(id)`. On success, redirect to `/admin`.
- **Constraints / conventions:** all Vietnamese strings. Debounce logic stays inside component; do not pull in extra libs. Use `useTransition` for action calls to keep UI responsive.
- **Done criteria:**
  - [ ] Form renders, autosave fires after typing pauses, indicator updates.
  - [ ] Slug auto-derives from title until user manually edits slug.
  - [ ] Image upload works.
  - [ ] Publish & delete dialogs trigger their actions.
- **How to verify:** mount in `/admin/posts/<id>/edit` (Task 17), drive manually.

---

## Task 14 — Admin dashboard (post list)

- **Type:** create
- **Files involved:** `app/admin/(protected)/page.tsx`
- **Depends on:** Task 9, Task 10
- **What to do:**
  - Server Component. Fetches all posts (admin can see drafts) using `createSupabaseAdminClient()` (or server client; service-role is simpler here): `select id, title, slug, status, published_at, updated_at, tags from posts order by updated_at desc`.
  - Renders:
    - Page header "Bài viết" + button "Tạo bài mới" (link to `/admin/posts/new`).
    - Table: columns Title (with status badge: Bản nháp / Đã đăng), Tags, Updated at (formatted vi locale), Actions (Edit, Preview, Delete).
    - Empty state: "Chưa có bài viết nào. Tạo bài đầu tiên!"
  - Delete column: use a small Client Component wrapper that opens `<DeleteDialog>` and calls `deletePost(id)` action via form action.
- **Constraints / conventions:** Vietnamese strings, date in `dd/MM/yyyy HH:mm` format.
- **Done criteria:**
  - [ ] List renders with seeded welcome post visible.
  - [ ] "Tạo bài mới" navigates to /admin/posts/new.
- **How to verify:** dev server, visit `/admin`.

---

## Task 15 — Admin new-post page (creates draft and redirects)

- **Type:** create
- **Files involved:** `app/admin/(protected)/posts/new/page.tsx`
- **Depends on:** Task 10
- **What to do:**
  - Server Component.
  - On render: call `createDraftPost()`. If `ok`, `redirect(`/admin/posts/${id}/edit`)`. If not ok, render error message.
  - **Important:** because this is a server action call from a render, mark the file as a Server Component and call it inside the page function body BEFORE returning JSX (Next.js `redirect` throws). To make it safe against double-execution from React Strict Mode in dev, this is acceptable since Server Components don't re-render in Strict Mode.
- **Constraints / conventions:** none.
- **Done criteria:**
  - [ ] Visiting `/admin/posts/new` creates a draft row and lands on the edit page for that row.
- **How to verify:** click "Tạo bài mới" on dashboard, observe new row in DB and editor page.

---

## Task 16 — Admin edit-post page

- **Type:** create
- **Files involved:** `app/admin/(protected)/posts/[id]/edit/page.tsx`
- **Depends on:** Task 13
- **What to do:**
  - Server Component. Params include `id`.
  - Fetch the post via admin client. If not found → `notFound()` (Next.js helper, renders 404).
  - Render `<PostForm post={post} />`.
- **Constraints / conventions:** none.
- **Done criteria:**
  - [ ] `/admin/posts/<id>/edit` loads with the post data populated.
- **How to verify:** open edit page for seeded welcome post.

---

## Task 17 — Admin preview page

- **Type:** create
- **Files involved:** `app/admin/(protected)/posts/[id]/preview/page.tsx`
- **Depends on:** Task 9, Task 10
- **What to do:**
  - Server Component. Fetch the post via admin client (so drafts work).
  - Render IDENTICALLY to the public `/blog/<slug>` page (Task 23) but:
    - Always renders even if `status='draft'`.
    - Adds a fixed banner at top: a colored bar with "BẢN NHÁP — chỉ admin xem được" if draft.
    - No Giscus comments (drafts shouldn't generate Discussion threads).
  - To avoid duplicating the render, extract a shared `<PostArticle post={post} />` component in `components/public/post-article.tsx` and import it both here and in Task 23. The component renders title, meta, cover, TOC, prose body, share buttons, related posts. Make Giscus a separate component included only by the public page, not by preview.
- **Constraints / conventions:** none.
- **Done criteria:**
  - [ ] `/admin/posts/<id>/preview` opens a faithful preview with the DRAFT banner when applicable.
- **How to verify:** open preview for a draft post.

---

## Task 18 — Public layout, header, footer

- **Type:** create
- **Files involved:**
  - `app/(public)/layout.tsx`
  - `components/public/site-header.tsx`
  - `components/public/site-footer.tsx`
- **Depends on:** Task 2, Task 9 (theme toggle)
- **What to do:**
  - `app/(public)/layout.tsx`: Server Component. Renders `<SiteHeader />`, `<main className="mx-auto w-full max-w-[680px] px-4 py-10">{children}</main>`, `<SiteFooter />`. (Max-width matches Substack-style reading column per spec.)
  - `site-header.tsx`: Client Component (uses ThemeToggle). Renders site name link to `/`, tagline (siteConfig.description) below or beside, ThemeToggle on the right. Also: small nav links to `/about` and "RSS" → `/rss.xml`.
  - `site-footer.tsx`: Server Component. Renders © year + site name + small links (GitHub, RSS).
- **Constraints / conventions:** minimal style, lots of whitespace, focus on readability.
- **Done criteria:**
  - [ ] Layout wraps public pages with header & footer.
  - [ ] Dark mode toggle in header works.
- **How to verify:** `/` (Task 19) and `/about` render with header/footer.

---

## Task 19 — Homepage (post list with pagination)

- **Type:** create
- **Files involved:**
  - `app/(public)/page.tsx`
  - `components/public/post-card.tsx`
  - `components/public/post-meta.tsx`
  - `components/public/tag-badge.tsx`
- **Depends on:** Task 18
- **What to do:**
  - `app/(public)/page.tsx`:
    - Server Component, accepts `searchParams: Promise<{ page?: string }>` (Next 15 makes searchParams a Promise).
    - `export const revalidate = 60;`
    - `generateMetadata` returns title=`siteConfig.name`, description=`siteConfig.description`.
    - Fetch page: `select id, title, slug, excerpt, tags, published_at, reading_time_minutes from posts where status='published' order by published_at desc range(offset, offset+9)` (10 per page).
    - Render: site header tagline (large), then list of `<PostCard>`s, then pagination (Older / Newer links).
    - Empty state: "Chưa có bài viết nào."
  - `post-card.tsx`: Server Component. Renders `<article>` with title (link), date + reading time + tags (PostMeta), excerpt.
  - `post-meta.tsx`: Server Component. Renders ` · ` separated: formatted Vietnamese date (`d 'tháng' M, yyyy`), `<n> phút đọc`, tags as small links to `/tags/<tag>`.
  - `tag-badge.tsx`: small link styled like a chip, links to `/tags/<tag>`.
- **Constraints / conventions:** use `next/link` for internal links. Use `date-fns` with `vi` locale for date formatting.
- **Done criteria:**
  - [ ] Homepage lists the seeded welcome post.
  - [ ] Pagination renders correctly when >10 posts (verifiable by adding more posts later).
- **How to verify:** visit `/`.

---

## Task 20 — Shared post-article component (used by public detail & admin preview)

- **Type:** create
- **Files involved:**
  - `components/public/post-article.tsx`
  - `components/public/table-of-contents.tsx`
  - `components/public/share-buttons.tsx`
  - `components/public/related-posts.tsx`
- **Depends on:** Task 6, Task 18, Task 19
- **What to do:**
  - `post-article.tsx`: Server Component. Props: `{ post: Post; relatedPosts: PostListItem[] }`.
    - Renders: `<article>` with `<h1>` title, `<PostMeta>`, optional `<img>` cover (use `next/image`), the body as `<div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content_html }} />`, divider, `<ShareButtons />`, `<RelatedPosts posts={relatedPosts} />`.
    - Layout includes a `<TableOfContents html={post.content_html} />` floating on desktop (`hidden xl:block fixed right-8 top-32 w-64`) and hidden on mobile.
  - `table-of-contents.tsx`: Server Component. Parses `content_html` via `node-html-parser`, finds `<h2 id="...">`, renders an ordered list of links to `#${id}`. Client-side interactivity (highlighting current section on scroll) is OUT OF SCOPE for v1.
  - `share-buttons.tsx`: Client Component. Renders three icon buttons: Twitter (link `https://twitter.com/intent/tweet?url=...&text=...`), Facebook (`https://www.facebook.com/sharer/sharer.php?u=...`), Copy link (uses `navigator.clipboard.writeText`, shows toast "Đã sao chép liên kết"). Use `lucide-react` icons. Props: `{ url: string; title: string }`.
  - `related-posts.tsx`: Server Component. Props: `{ posts: PostListItem[] }`. If empty array, render nothing. Else `<aside>` with heading "Bài viết liên quan" and list of `<PostCard>` (compact variant: just title + date).
- **Constraints / conventions:** `dangerouslySetInnerHTML` is safe here because `content_html` was generated server-side by us from `content_json` (no external input). Document this with a one-line comment justifying it (one of the rare cases the project allows comments).
- **Done criteria:**
  - [ ] Components render without runtime errors.
  - [ ] TOC links jump to in-page anchors.
  - [ ] Share buttons open correct URLs / copy link works.
- **How to verify:** view a post on `/blog/<slug>` (Task 23).

---

## Task 21 — Giscus comments component

- **Type:** create
- **Files involved:** `components/public/giscus-comments.tsx`
- **Depends on:** Task 1
- **What to do:**
  - `"use client";`
  - Use `@giscus/react`'s `<Giscus>` component. Read repo/repoId/category/categoryId from `NEXT_PUBLIC_GISCUS_*` env vars.
  - If any required var is missing, render nothing (don't error).
  - Use `term` = post slug, `mapping="specific"`, `theme={resolvedTheme === "dark" ? "dark" : "light"}` (read via `useTheme` from next-themes).
  - Render under a heading "Bình luận".
- **Constraints / conventions:** keep it small. Don't fetch.
- **Done criteria:**
  - [ ] Component compiles.
  - [ ] When env vars set, Giscus iframe appears under post.
  - [ ] When env vars missing, component silently renders nothing.
- **How to verify:** view a post; if env not set, no errors thrown.

---

## Task 22 — Public post detail page

- **Type:** create
- **Files involved:** `app/(public)/blog/[slug]/page.tsx`
- **Depends on:** Task 20, Task 21
- **What to do:**
  - Server Component. `params: Promise<{ slug: string }>`.
  - `export const revalidate = 0;` (always fresh).
  - Fetch post by slug where `status='published'`. If not found → `notFound()`.
  - Fetch related posts: `select ... from posts where status='published' and id <> $1 and tags && $2::text[] order by published_at desc limit 3`. If post has empty tags, skip this query (related = []).
  - `generateMetadata(params)`:
    - title = post.title.
    - description = post.excerpt.
    - OpenGraph: `images: [post.cover_image_url ?? `/api/og?title=${encodeURIComponent(post.title)}`]`.
    - Twitter: card `summary_large_image`.
    - `alternates.canonical = ${siteConfig.url}/blog/${slug}`.
  - Render: `<PostArticle post={post} relatedPosts={related} />` then `<GiscusComments slug={slug} />`.
- **Constraints / conventions:** see spec §7 (perf/SEO).
- **Done criteria:**
  - [ ] `/blog/chao-mung-den-voi-cupofngos` renders with full layout.
  - [ ] Visiting a non-existent slug returns 404.
  - [ ] Metadata in `<head>` includes correct title/description/OG.
- **How to verify:** view source on the page; inspect `<head>`.

---

## Task 23 — Tag filter page

- **Type:** create
- **Files involved:** `app/(public)/tags/[tag]/page.tsx`
- **Depends on:** Task 19
- **What to do:**
  - Server Component. `params: Promise<{ tag: string }>`.
  - `export const revalidate = 60;`
  - Fetch: `select ... from posts where status='published' and $1 = any(tags) order by published_at desc`.
  - Render: heading "Tag: <tag>" + list of `<PostCard>`.
  - Empty: "Chưa có bài viết với tag này." + link to `/`.
  - `generateMetadata`: title = `Tag: <tag> — ${siteConfig.name}`.
- **Constraints / conventions:** Vietnamese strings.
- **Done criteria:**
  - [ ] `/tags/welcome` shows the seeded post.
  - [ ] `/tags/nonexistent` shows empty state, not 404.
- **How to verify:** navigate from a post's tag chip.

---

## Task 24 — About page + 404

- **Type:** create
- **Files involved:**
  - `app/(public)/about/page.tsx`
  - `app/not-found.tsx`
- **Depends on:** Task 18
- **What to do:**
  - `about/page.tsx`: Server Component. Static Vietnamese content in JSX using `<div className="prose dark:prose-invert">`. Placeholder content the user can edit later:
    > # Về mình
    >
    > Chào, mình là chủ blog `cupofngos`. Đây là nơi mình ghi lại những điều thú vị về code, AI, đời sống và cà phê. ...
  - `generateMetadata`: title "Về mình".
  - `not-found.tsx` (root-level): centered "404 — Không tìm thấy trang" + link "Về trang chủ" → `/`. Simple Tailwind layout.
- **Constraints / conventions:** see spec.
- **Done criteria:**
  - [ ] `/about` renders.
  - [ ] Visiting a non-existent route shows the styled 404.
- **How to verify:** visit `/about` and `/asdf`.

---

## Task 25 — OG image dynamic route

- **Type:** create
- **Files involved:** `app/api/og/route.tsx`
- **Depends on:** Task 4
- **What to do:**
  - Use Next.js `ImageResponse` from `next/og`. `export const runtime = "edge";`.
  - `GET(request)`: read `title` from `searchParams`, fallback to siteConfig.name.
  - Render 1200x630 JSX: dark background, site name small at top, title large centered, siteConfig.description at bottom. Use system fonts (no external font loading for simplicity).
  - Return `new ImageResponse(<jsx>, { width: 1200, height: 630 })`.
- **Constraints / conventions:** stick to Tailwind-like inline styles compatible with `next/og` (only a subset of CSS supported; see Next docs).
- **Done criteria:**
  - [ ] `GET /api/og?title=Hello` returns a PNG.
- **How to verify:** open `/api/og?title=Test` in browser; see an image.

---

## Task 26 — RSS feed

- **Type:** create
- **Files involved:** `app/rss.xml/route.ts`
- **Depends on:** Task 5
- **What to do:**
  - `export const revalidate = 300;`
  - `GET()`:
    - Fetch 20 latest published posts.
    - Build RSS 2.0 XML string with `<channel>` (title, description, link, language `vi`), and one `<item>` per post (title, link `${siteConfig.url}/blog/${slug}`, guid same, pubDate as RFC 822, description as excerpt).
    - Escape XML special chars in all string fields.
    - Return `new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } })`.
- **Constraints / conventions:** valid XML; test by passing through an online RSS validator (manual).
- **Done criteria:**
  - [ ] `/rss.xml` returns valid RSS XML listing the published posts.
- **How to verify:** view in browser, validate with `https://validator.w3.org/feed/`.

---

## Task 27 — Sitemap + robots.txt

- **Type:** create
- **Files involved:**
  - `app/sitemap.xml/route.ts`
  - `app/robots.txt/route.ts`
- **Depends on:** Task 5
- **What to do:**
  - `sitemap.xml/route.ts`: `export const revalidate = 300;` GET returns sitemap XML with:
    - `${siteConfig.url}/` (priority 1.0).
    - `${siteConfig.url}/about` (priority 0.5).
    - For each published post: `${siteConfig.url}/blog/${slug}` (lastmod = updated_at).
    - For each distinct tag across published posts: `${siteConfig.url}/tags/${tag}` (priority 0.4).
  - `robots.txt/route.ts`: GET returns text:
    ```
    User-agent: *
    Allow: /
    Disallow: /admin/

    Sitemap: ${siteConfig.url}/sitemap.xml
    ```
- **Constraints / conventions:** valid XML and text.
- **Done criteria:**
  - [ ] `/sitemap.xml` lists at least `/`, `/about`, the welcome post URL, and `/tags/welcome`.
  - [ ] `/robots.txt` disallows `/admin/`.
- **How to verify:** visit URLs in browser.

---

## Task 28 — Wire up final pieces in root layout and verify build

- **Type:** edit
- **Files involved:**
  - `app/layout.tsx`
- **Depends on:** Tasks 2, 9 (real ThemeProvider available)
- **What to do:**
  - Replace any placeholder ThemeProvider in root layout (from Task 2) with the real import from `@/components/theme-provider`.
  - Ensure `<Analytics />` from `@vercel/analytics/next` is mounted at end of `<body>`.
  - Verify metadata defaults set.
- **Constraints / conventions:** none.
- **Done criteria:**
  - [ ] Root layout uses real ThemeProvider.
  - [ ] Analytics mounted.
  - [ ] `npm run build` succeeds with zero errors.
- **How to verify:** build command output.

---

## Task 29 — README + .env documentation + Vercel/Supabase/Giscus setup guide

- **Type:** create
- **Files involved:** `README.md`
- **Depends on:** everything (write last)
- **What to do:**
  - Write a `README.md` in Vietnamese (with English headings allowed) covering:
    1. **Giới thiệu** — what this project is.
    2. **Yêu cầu** — Node 20+, npm, Supabase account, GitHub account, Vercel account.
    3. **Cài đặt local:**
       - Clone, `npm install`, copy `.env.example` to `.env.local`.
    4. **Tạo Supabase project:**
       - Tạo project mới tại https://supabase.com.
       - Lấy `Project URL` (→ `NEXT_PUBLIC_SUPABASE_URL`), `anon public key` (→ `NEXT_PUBLIC_SUPABASE_ANON_KEY`), `service_role secret` (→ `SUPABASE_SERVICE_ROLE_KEY`).
       - Vào **SQL Editor**, dán nội dung `supabase/migrations/0001_init.sql` và Run.
       - Dán `supabase/seed.sql` và Run.
    5. **Cấu hình GitHub OAuth (cho Supabase Auth):**
       - GitHub Settings → Developer settings → OAuth Apps → New OAuth App.
       - Homepage URL: `https://cupofngos.vercel.app` (hoặc local `http://localhost:3000`).
       - Authorization callback URL: `<NEXT_PUBLIC_SUPABASE_URL>/auth/v1/callback`.
       - Save Client ID + Secret.
       - Trong Supabase Dashboard → Authentication → Providers → GitHub: enable + paste Client ID + Secret.
       - Đặt `ADMIN_GITHUB_EMAIL` = email primary của GitHub account của bạn.
    6. **Cấu hình Giscus (optional, có thể bỏ qua nếu chưa muốn comment):**
       - Tạo public repo trên GitHub (vd: `cupofngos-comments`), bật **Discussions** trong Settings.
       - Vào https://giscus.app → cấu hình → copy ra các giá trị Repo / Repo ID / Category / Category ID vào env.
    7. **Chạy local:** `npm run dev` → http://localhost:3000.
    8. **Deploy Vercel:**
       - Push code lên GitHub repo.
       - Vào vercel.com → Import GitHub repo.
       - Thêm tất cả env vars trong Project Settings → Environment Variables.
       - Deploy. URL sẽ là `https://<project-name>.vercel.app` (đổi project name thành `cupofngos` nếu muốn).
       - Quay lại GitHub OAuth App + Supabase Auth Redirect URLs, thêm production URL.
    9. **Stack:** liệt kê short.
    10. **Cấu trúc thư mục:** copy từ spec §6.
- **Constraints / conventions:** Vietnamese primary language. Use code fences for commands and URLs.
- **Done criteria:**
  - [ ] A first-time user can follow the README from scratch and reach a deployed working blog.
- **How to verify:** read it cold and try to mentally execute.

---

## Overall acceptance checklist
- [ ] All tasks done in dependency order.
- [ ] `npm run build` passes with zero errors and zero warnings.
- [ ] `npm run dev` shows homepage with seeded welcome post.
- [ ] All spec §8 "Done criteria" items pass via manual click-through:
  - Auth gating on `/admin`.
  - GitHub OAuth login (allowlisted email succeeds; other email rejected).
  - Create / autosave / publish / unpublish / delete post flows.
  - Image paste/drop into editor uploads to Supabase Storage.
  - Dark mode toggle persists.
  - `/`, `/blog/<slug>`, `/tags/<tag>`, `/about`, `/rss.xml`, `/sitemap.xml`, `/robots.txt`, 404 all render correctly.
  - OG image route returns image; per-post metadata includes correct OG/Twitter tags.
  - Giscus mounts (when env configured).
  - Vietnamese slug generation correct.
- [ ] README is followable end-to-end.
