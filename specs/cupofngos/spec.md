# Spec — cupofngos (personal Vietnamese blog)

> This document is the source of truth for implementation. Subagents read this file instead of re-reading the brainstorming conversation.

## 1. Goal
- **Problem to solve:** the owner (a Vietnamese developer) wants a personal blog where they can publish written content from a web admin (no Git required), have a clean public reading experience, and host it 100% free with a real URL.
- **Value delivered:** end-to-end working blog at `https://cupofngos.vercel.app` with:
  - Web-based admin (GitHub login) to draft, edit, publish, and delete posts using a Notion-like editor with image upload.
  - Public reader experience: minimal Substack-like design, dark mode, code highlighting, tag filtering, RSS, sitemap, comments (Giscus), share buttons, and related-post suggestions.
  - SEO-ready (OG images, sitemap, RSS, semantic HTML, server-rendered pages).

## 2. Scope

**In scope (v1)**
- Next.js 15 (App Router, TypeScript strict) hosted on Vercel free tier.
- Supabase (single free-tier project) for Postgres + Auth + Storage.
- GitHub OAuth login for the single admin user (allowlist by email via `ADMIN_GITHUB_EMAIL`).
- Notion-style editor (Novel.sh) with slash commands, drag-and-drop / paste image upload to Supabase Storage.
- Posts schema with: title, slug, content_json, content_html, excerpt, cover_image_url, status, published_at, tags (text[]), reading_time_minutes, timestamps.
- Public pages: `/`, `/blog/<slug>`, `/tags/<tag>`, `/about`, `/rss.xml`, `/sitemap.xml`, `/robots.txt`, 404.
- Admin pages: `/admin` (list), `/admin/login`, `/admin/posts/new`, `/admin/posts/<id>/edit`, `/admin/posts/<id>/preview`.
- Admin UX: autosave drafts + explicit Publish button, slug & excerpt auto-generated with manual override, cover image upload (optional), tag chip input with suggestions, hard delete with confirmation dialog.
- Reading UX: reading time, Table of Contents (h2 anchors), share buttons (Twitter/Facebook/copy-link), related posts (tag overlap, 3 items), Giscus comments.
- Dark mode (toggle in header, `next-themes`, persisted to localStorage).
- OG image: use `cover_image_url` if set, otherwise auto-generate via `next/og` from title.
- Vercel Analytics (privacy-friendly, no cookie banner).
- Vietnamese UI strings, Vietnamese-aware slug generation (diacritics removed).
- Seed: 1 welcome post.

**Out of scope (v1) — do NOT implement**
- Multi-author / reader accounts / reader subscriptions.
- View count, pinned/featured posts, post series, newsletters/email digest.
- Custom domain configuration (Vercel auto-subdomain `cupofngos.vercel.app` only; user will add custom domain later via Vercel dashboard).
- i18n (Vietnamese only; no `/vi/` or `/en/` routes).
- Search page (small post count; skip until needed).
- Archive page (homepage list + tags is enough navigation).
- Soft delete / audit log / undo.
- Tests (manual verification only).
- Sentry / error monitoring.
- Local Supabase via Docker (use cloud Supabase directly for v1).
- Separate dev/prod Supabase projects (single project for v1).
- "Previous / Next post" navigation.
- Reading progress bar.
- PWA / offline support.
- Image transforms beyond client-side resize-before-upload (no on-the-fly resize service).

## 3. Data model

### Table: `posts`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `title` | `text` | not null | Plain string, can contain Vietnamese diacritics. |
| `slug` | `text` | unique, not null | URL segment. Auto-generated from title (diacritics removed, lowercase, dash-separated), editable. |
| `content_json` | `jsonb` | not null | TipTap/Novel document JSON. Source of truth for editing. |
| `content_html` | `text` | not null, default `''` | Pre-rendered HTML cached on save. Used for public render + TOC extraction. |
| `excerpt` | `text` | not null, default `''` | 1–2 sentence summary. Auto from first 160 chars of plain text if blank at save. |
| `cover_image_url` | `text` | nullable | Public Supabase Storage URL or external URL. |
| `status` | `text` | not null, default `'draft'`, check (`status in ('draft','published')`) | |
| `published_at` | `timestamptz` | nullable | Set when status transitions draft → published (don't overwrite on subsequent edits). |
| `tags` | `text[]` | not null, default `'{}'::text[]` | Lowercase, ASCII (diacritics removed), dash-separated tag slugs. |
| `reading_time_minutes` | `integer` | not null, default `1` | `ceil(plain_text_word_count / 200)`, min 1. |
| `created_at` | `timestamptz` | not null, default `now()` | |
| `updated_at` | `timestamptz` | not null, default `now()` | Updated via trigger on row update. |

Indexes:
- Unique index on `slug`.
- B-tree index on `(status, published_at desc)` for homepage list query.
- GIN index on `tags` for tag-filter queries.

Row Level Security (RLS):
- Enable RLS on `posts`.
- Policy `posts_public_read`: `for select to anon, authenticated using (status = 'published')`.
- All mutations (insert/update/delete) and draft reads go through Next.js API/server actions using the Supabase **service role key** (bypasses RLS) — never expose service role to browser.

Trigger:
- `set_updated_at` BEFORE UPDATE: sets `NEW.updated_at = now()`.

### Storage bucket: `blog-images`
- Public bucket (objects readable by anyone with URL).
- Upload restricted server-side to authenticated admin via API route.
- Path convention: `<year>/<month>/<uuid>.<ext>` (e.g., `2026/05/abc123.png`).
- Client-side resize before upload: max width 1920px, JPEG/PNG/WebP allowed, max original size 8MB.

### Auth (Supabase Auth)
- Provider: GitHub OAuth (configured in Supabase dashboard).
- Single allowlisted user identified by primary GitHub email matching `ADMIN_GITHUB_EMAIL` env var.
- Session via Supabase Auth cookies (`@supabase/ssr`).

## 4. Flows & states

### Happy path: create & publish a post
1. Admin visits `/admin/login`, clicks "Sign in with GitHub".
2. OAuth round-trip via Supabase → callback at `/api/auth/callback` exchanges code, sets session cookie.
3. Server checks `session.user.email === process.env.ADMIN_GITHUB_EMAIL`. If yes → redirect to `/admin`. If no → sign out + show error.
4. `/admin` shows list of all posts (draft + published) sorted by `updated_at desc`. Buttons: "New post", per-row "Edit", "Preview", "Delete".
5. Admin clicks "New post" → `/admin/posts/new`:
   - Server action creates an empty draft row, redirects to `/admin/posts/<new-id>/edit`.
6. On the edit page: title input, slug input (auto-filled from title, editable), Novel editor body, excerpt textarea, cover image upload, tags chip input.
   - Every change debounced 1500ms triggers an autosave server action that updates the row (status stays `draft`).
   - Toast shows "Saving…" / "Saved at HH:MM".
7. Admin clicks "Preview" → opens `/admin/posts/<id>/preview` in new tab, renders exactly like a public post but with a "DRAFT" badge if `status='draft'`.
8. Admin clicks "Publish" → confirmation dialog → server action:
   - Validates: title non-empty, slug non-empty + unique, content_json non-empty.
   - Renders content_html from content_json server-side.
   - Computes reading_time_minutes from plain-text word count.
   - Sets `status='published'`, sets `published_at = now()` only if previously NULL.
   - Returns success → toast → "View public post" link to `/blog/<slug>`.
9. Public page `/blog/<slug>` (Server Component) fetches post (status='published'), renders prose, TOC sidebar, share buttons, related posts, Giscus.

### Happy path: edit a published post
- Same edit flow as above; on save, `content_html` and `reading_time_minutes` are recomputed; `published_at` is NOT changed; `updated_at` reflects edit.
- Public page picks up changes immediately (no static caching in v1; pages use `force-dynamic` or `revalidate: 0` for `/blog/[slug]` — or use `revalidatePath` after publish).

### Happy path: delete
- Admin clicks "Delete" on dashboard or edit page → confirm dialog "Xóa bài viết này? Hành động không hoàn tác." → server action hard-deletes row → redirect to `/admin`.
- Associated images in Storage remain (orphan); v1 does not clean up Storage on post delete.

### Edge cases & errors
- **Slug collision:** publish action returns error "Slug đã tồn tại"; admin must change slug.
- **Title empty on publish:** error "Tiêu đề không được để trống".
- **Image upload failure (>8MB / wrong type / network):** toast error, editor stays editable.
- **Session expired during autosave:** API returns 401 → toast "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại" with link.
- **Non-allowlisted GitHub email logs in:** server signs them out immediately and shows "Tài khoản không được phép" on login page.
- **Public visit to draft URL `/blog/<draft-slug>`:** 404 (RLS blocks anon SELECT of drafts).
- **Tag with no posts:** `/tags/<tag>` shows "Chưa có bài viết với tag này" + link back to home.
- **Post with no `published_at` somehow (data integrity):** treat as draft, exclude from public.
- **Concurrent edits (very unlikely, single admin):** last-write-wins; no locking in v1.

## 5. Interface / Contract

### Server actions (Next.js Server Actions, called from admin pages)

```ts
// All admin actions require admin session check; return { ok: true, ... } | { ok: false, error: string }

createDraftPost(): Promise<{ ok: true; id: string } | { ok: false; error: string }>
// Inserts empty draft row, returns id.

autosavePost(id: string, patch: {
  title?: string;
  slug?: string;
  content_json?: unknown;
  excerpt?: string;
  cover_image_url?: string | null;
  tags?: string[];
}): Promise<{ ok: true; updated_at: string } | { ok: false; error: string }>
// Updates draft fields only. Does NOT touch status / published_at / content_html / reading_time.

publishPost(id: string): Promise<{ ok: true; slug: string } | { ok: false; error: string }>
// Validates, renders HTML, computes reading time, sets status='published', sets published_at if null,
// revalidates `/`, `/blog/<slug>`, all `/tags/<tag>` for tags on the post.

unpublishPost(id: string): Promise<{ ok: true } | { ok: false; error: string }>
// Sets status='draft'. Keeps published_at (so re-publish doesn't reset). Revalidates affected pages.

deletePost(id: string): Promise<{ ok: true } | { ok: false; error: string }>
// Hard delete row. Revalidates affected pages.

uploadImage(formData: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }>
// Validates file (type, size), uploads to `blog-images/<year>/<month>/<uuid>.<ext>`, returns public URL.
```

### API routes

- `GET /api/auth/callback?code=...` — Supabase OAuth callback; exchanges code, sets session, validates admin allowlist, redirects to `/admin` or back to `/admin/login?error=not_allowed`.
- `GET /api/auth/signout` — clears session, redirects to `/`.
- `GET /rss.xml` — RSS 2.0 feed of latest 20 published posts.
- `GET /sitemap.xml` — sitemap with `/`, `/about`, every `/blog/<slug>`, every `/tags/<tag>`.
- `GET /robots.txt` — allow all, disallow `/admin/*`, link to sitemap.
- `GET /api/og?title=<title>` — dynamic OG image (1200x630) using `next/og`.

### Public pages (Server Components)

- `/` — fetches first 10 published posts ordered by `published_at desc`; pagination via query `?page=N` (10 per page).
- `/blog/[slug]` — fetches one post by slug where `status='published'`; renders title, meta, cover (if any), prose body, TOC (extracted from `<h2>` in content_html), share buttons, related posts (3 published posts sharing ≥1 tag, excluding self, ordered by published_at desc), Giscus.
- `/tags/[tag]` — fetches all published posts where `tags && ARRAY[tag]`; displays list.
- `/about` — fully static markdown content in code (no DB query).

### Error format
All server actions return `{ ok: false, error: <user-facing Vietnamese string> }` on failure. UI displays via toast.

## 6. Dependencies & technical constraints

### Modules / services
- **Vercel** (hosting, edge functions, OG image runtime, Analytics).
- **Supabase** (Postgres, Auth, Storage). Single project.
- **GitHub** (OAuth provider for Supabase Auth; Giscus backend).

### Libraries (exact deps)
- `next@^15`, `react@^19`, `react-dom@^19`, `typescript@^5`
- `tailwindcss@^3`, `@tailwindcss/typography@^0.5`, `postcss`, `autoprefixer`
- `@supabase/supabase-js@^2`, `@supabase/ssr@^0.5`
- `novel@^0.5` (or current stable) — Notion-style editor
- `slugify@^1` — slug generator with `locale: 'vi'`
- `date-fns@^3` — date formatting (`vi` locale)
- `next-themes@^0.3` — dark mode
- `@vercel/analytics@^1` — analytics
- `@giscus/react@^3` — comments embed
- `lucide-react@^0.4xx` — icons
- shadcn/ui generated components (via `npx shadcn@latest add ...`): `button`, `input`, `textarea`, `dialog`, `dropdown-menu`, `toast`, `badge`, `card`, `label`.
- `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate` (shadcn deps)
- `node-html-parser@^6` — for TOC extraction from `content_html`
- For HTML rendering from TipTap JSON server-side: use `@tiptap/html` + the same Novel extensions used in the editor. (Required so we can serialize `content_json` → `content_html` on publish.)

### Required folder structure
```
.env.example                        # template for env vars
.env.local                          # gitignored, real values
next.config.ts
tailwind.config.ts
tsconfig.json
postcss.config.mjs
package.json
README.md
public/
  favicon.ico
  og-default.png
supabase/
  migrations/
    0001_init.sql                   # full schema + RLS + trigger
  seed.sql                          # 1 welcome post
app/
  layout.tsx                        # root: html lang="vi", ThemeProvider, Analytics
  globals.css                       # tailwind directives
  not-found.tsx                     # 404
  (public)/
    layout.tsx                      # Header + Footer + container
    page.tsx                        # home /
    blog/[slug]/page.tsx
    tags/[tag]/page.tsx
    about/page.tsx
  admin/
    layout.tsx                      # admin guard + sidebar
    page.tsx                        # dashboard list
    login/page.tsx
    posts/
      new/page.tsx                  # creates draft, redirects to edit
      [id]/edit/page.tsx
      [id]/preview/page.tsx
  api/
    auth/callback/route.ts
    auth/signout/route.ts
    og/route.tsx
  rss.xml/route.ts
  sitemap.xml/route.ts
  robots.txt/route.ts
components/
  ui/                               # shadcn/ui generated
  theme-provider.tsx
  theme-toggle.tsx
  public/
    site-header.tsx
    site-footer.tsx
    post-card.tsx
    post-meta.tsx                   # date + reading time + tags
    table-of-contents.tsx
    share-buttons.tsx
    related-posts.tsx
    giscus-comments.tsx
    tag-badge.tsx
  admin/
    admin-shell.tsx                 # sidebar + topbar layout
    post-form.tsx                   # shared by new/edit (Novel + meta fields)
    novel-editor.tsx                # Novel.sh wrapper with image upload handler
    image-upload-button.tsx
    tag-input.tsx                   # chip input with suggestions
    autosave-indicator.tsx
    publish-dialog.tsx
    delete-dialog.tsx
lib/
  supabase/
    server.ts                       # createServerClient (cookies)
    browser.ts                      # createBrowserClient
    admin.ts                        # service-role client (server-only)
  auth/
    require-admin.ts                # server util: redirects if not admin
  utils/
    slug.ts                         # vietnameseSlugify(text)
    reading-time.ts                 # readingTimeMinutes(html | json)
    extract-toc.ts                  # extractToc(html) -> { id, text, level }[]
    excerpt.ts                      # autoExcerpt(html, maxChars=160)
    tiptap-html.ts                  # jsonToHtml(json) using tiptap extensions
    tags.ts                         # normalizeTag, parseTags
    site.ts                         # site config (title, description, author, URLs)
  actions/
    posts.ts                        # all post server actions
    upload.ts                       # uploadImage action
types/
  database.ts                       # Supabase generated types (via `supabase gen types`)
  post.ts                           # Post, PostStatus, etc.
```

### Conventions
- **TypeScript strict:** `"strict": true` in tsconfig.
- **Imports:** use `@/` alias to project root (`tsconfig.json` `paths`).
- **Server-only files:** any file using `SUPABASE_SERVICE_ROLE_KEY` MUST start with `import "server-only";` to ensure it never bundles to client.
- **Server Components by default** for public pages; mark Client Components with `"use client"` only where interactive (theme toggle, editor, dialogs, autosave hooks).
- **No emoji in code or UI** unless asked by user later.
- **All user-facing strings in Vietnamese.**
- **Date format (public):** `d 'tháng' M, yyyy` (e.g., "24 tháng 5, 2026") using `date-fns/locale/vi`.
- **No comments in code** unless a non-obvious WHY needs documenting.
- **Code style:** ESLint + Prettier defaults from `create-next-app`. No custom rules.
- **Naming:** files kebab-case, React components PascalCase, hooks camelCase prefixed `use`, server actions camelCase verbs.

### Environment variables (`.env.example` must list all of these)
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

## 7. Non-functional

- **Performance:**
  - Public pages must be Server Components and render <1s TTFB on Vercel Edge.
  - Images use `next/image` with Supabase Storage `remotePatterns` whitelisted in `next.config.ts`.
  - Use `revalidatePath` after publish/unpublish/delete to refresh static caches; otherwise `revalidate = 60` on home and tag pages, `revalidate = 0` on `/blog/[slug]` (always fresh).
- **Security:**
  - Service role key only used in server actions / API routes.
  - All admin actions assert `requireAdmin()` server-side before any mutation.
  - GitHub email allowlist enforced on auth callback AND on every admin server action / page render (defense in depth).
  - Image uploads: validate MIME type (image/jpeg, image/png, image/webp) and size ≤8MB server-side regardless of client check.
  - No `dangerouslySetInnerHTML` on user input from anonymous sources; `content_html` is generated server-side from `content_json` we control — safe to render directly.
- **SEO:**
  - Every public page sets `<title>`, `<meta description>`, OpenGraph, Twitter Card tags via Next.js `generateMetadata`.
  - Canonical URLs use `NEXT_PUBLIC_SITE_URL`.
  - Sitemap and RSS regenerate per request (`revalidate = 300`).
- **Accessibility:**
  - All images require alt text. Cover image alt = post title. Inline images: Novel editor must allow setting alt.
  - Color contrast in both light & dark modes ≥ WCAG AA.
  - Keyboard-navigable admin (focus rings visible).
- **i18n:** Vietnamese only; HTML root `lang="vi"`.

## 8. Done criteria
- [ ] `npm run build` succeeds with zero errors / warnings.
- [ ] `npm run dev` shows working homepage, post list (seeded welcome post), post detail with TOC + share + related-posts area + Giscus mount (may be empty until repo configured).
- [ ] Dark mode toggle in header works and persists across reload.
- [ ] Admin: `/admin` is gated — visiting unauthenticated redirects to `/admin/login`.
- [ ] Sign in with GitHub using the allowlisted email succeeds and shows dashboard; signing in with a non-allowlisted email is rejected with a clear Vietnamese message.
- [ ] Admin can create a new post, autosave triggers within ~2s of typing, "Saved at HH:MM" indicator updates.
- [ ] Admin can paste/drop an image in editor; image appears in body with a `https://*.supabase.co/storage/v1/object/public/blog-images/...` URL.
- [ ] Admin can publish the post; visiting `/blog/<slug>` returns 200 and renders content; `/` lists it; `/tags/<tag>` lists it for each of its tags.
- [ ] Admin can unpublish; the post disappears from public pages within one request (revalidation triggered).
- [ ] Admin can delete; confirmation dialog shows; deletion succeeds; dashboard reflects removal.
- [ ] `/rss.xml` returns valid XML with the published posts.
- [ ] `/sitemap.xml` lists `/`, `/about`, all `/blog/<slug>`, all `/tags/<tag>`.
- [ ] `/robots.txt` disallows `/admin/`.
- [ ] OG image: posts without cover render an auto-generated `next/og` image at `/api/og?title=...`; posts with cover use the cover URL.
- [ ] Vietnamese slug generation works: "Học AI cùng Claude!" → `hoc-ai-cung-claude`.
- [ ] Project deploys to Vercel: connect GitHub repo, set env vars in dashboard, `cupofngos.vercel.app` serves the site.
- [ ] README documents: setup steps, env vars, how to create the Supabase project + GitHub OAuth app + Giscus repo, how to deploy to Vercel, how to seed the welcome post.
