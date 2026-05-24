# cupofngos — Blog cá nhân tiếng Việt

## Giới thiệu

**cupofngos** là blog cá nhân viết bằng tiếng Việt, xây dựng để giải quyết nhu cầu đơn giản: viết và đăng bài trực tiếp từ trình duyệt — không cần Git, không cần terminal. Mục tiêu:

- Giao diện admin trên web (đăng nhập bằng GitHub) để soạn, sửa, xuất bản và xóa bài viết với editor kiểu Notion có hỗ trợ upload ảnh.
- Trải nghiệm đọc tối giản, tối/sáng mode, highlight code, lọc theo tag, RSS, sitemap, bình luận (Giscus) và gợi ý bài liên quan.
- SEO-ready: OG image, sitemap, RSS, server-rendered pages.
- Hosting 100% miễn phí trên Vercel + Supabase free tier, tại `https://cupofngos.vercel.app`.

---

## Stack

| Thành phần | Mô tả |
|---|---|
| **Next.js 15** | App Router, TypeScript strict |
| **Supabase** | Postgres + Auth (GitHub OAuth) + Storage |
| **Tailwind CSS + shadcn/ui** | Styling và UI components |
| **Novel.sh editor** | Notion-style editor (TipTap bên dưới) |
| **Vercel** | Hosting, Edge Functions, OG image runtime, Analytics |
| **Giscus** | Hệ thống bình luận dựa trên GitHub Discussions |

---

## Yêu cầu

- Node.js **20+** và npm
- Tài khoản [Supabase](https://supabase.com) (miễn phí)
- Tài khoản [GitHub](https://github.com)
- Tài khoản [Vercel](https://vercel.com) (miễn phí)

---

## Cài đặt local

```bash
git clone <your-repo-url>
cd vibe_blog
npm install
cp .env.example .env.local
# Điền các biến vào .env.local (xem mục Supabase + GitHub OAuth bên dưới)
npm run dev
```

Mở `http://localhost:3000`.

---

## Cấu hình Supabase

1. Tạo project mới tại [https://supabase.com](https://supabase.com) (chọn region **Southeast Asia**, free tier).
2. Vào **Project Settings → API** lấy các giá trị sau:
   - `Project URL` → điền vào `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → điền vào `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → điền vào `SUPABASE_SERVICE_ROLE_KEY` (**giữ bí mật tuyệt đối**, chỉ dùng phía server, không bao giờ đưa ra client)
3. Vào **SQL Editor**, chạy lần lượt:
   - Dán toàn bộ nội dung `supabase/migrations/0001_init.sql` → nhấn **Run**.
   - Dán toàn bộ nội dung `supabase/seed.sql` → nhấn **Run**.
4. Mở **Database → Tables**, kiểm tra bảng `posts` đã xuất hiện và có **1 bài seed**.
5. Vào **Storage**, kiểm tra bucket `blog-images` đã được tạo với chế độ **public**.

---

## Cấu hình GitHub OAuth (cho Supabase Auth)

1. Trên GitHub, vào **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Điền thông tin:
   - **Application name:** `cupofngos` (hoặc tên bất kỳ)
   - **Homepage URL:**
     - Dev: `http://localhost:3000`
     - Prod: `https://cupofngos.vercel.app`
   - **Authorization callback URL:**
     ```
     <NEXT_PUBLIC_SUPABASE_URL>/auth/v1/callback
     ```
     Ví dụ: `https://abcxyz.supabase.co/auth/v1/callback`
3. Nhấn **Register application**. Lưu lại **Client ID** và **Client Secret**.
4. Trong Supabase Dashboard → **Authentication → Providers → GitHub**:
   - Bật **Enable**.
   - Paste **Client ID** và **Client Secret** vào các ô tương ứng.
   - Nhấn **Save**.
5. Trong `.env.local`, đặt `ADMIN_GITHUB_EMAIL` = địa chỉ email primary của tài khoản GitHub bạn dùng để đăng nhập admin. Nếu email không khớp, đăng nhập sẽ bị từ chối ngay lập tức.

---

## Cấu hình Giscus (tùy chọn)

> Có thể bỏ qua ở bước đầu. Component bình luận sẽ ẩn nếu thiếu các biến env Giscus.

1. Tạo **public repo** trên GitHub (ví dụ: `cupofngos-comments`). Vào **Settings** của repo đó, bật tính năng **Discussions**.
2. Truy cập [https://giscus.app](https://giscus.app) và cấu hình:
   - **Repository:** chọn repo vừa tạo.
   - **Page ↔ Discussions Mapping:** chọn **Specific term**.
   - **Discussion Category:** chọn `Announcements` hoặc tạo category tên `Comments`.
3. Copy các giá trị xuất ra từ giscus.app:

   | Giá trị từ giscus.app | Biến môi trường |
   |---|---|
   | `data-repo` | `NEXT_PUBLIC_GISCUS_REPO` |
   | `data-repo-id` | `NEXT_PUBLIC_GISCUS_REPO_ID` |
   | `data-category` | `NEXT_PUBLIC_GISCUS_CATEGORY` |
   | `data-category-id` | `NEXT_PUBLIC_GISCUS_CATEGORY_ID` |

---

## Chạy local

```bash
npm run dev
```

Truy cập `http://localhost:3000`, sau đó vào `/admin/login` để đăng nhập bằng GitHub.

---

## Deploy lên Vercel

1. Push code lên GitHub repo.
2. Vào [https://vercel.com](https://vercel.com) → **Add New Project** → import repo vừa push.
3. Trong bước **Configure Project**, mục **Environment Variables**: dán tất cả các biến từ `.env.local` (chọn preset **Production**).
4. Nhấn **Deploy**. URL mặc định sẽ là `https://<project-name>.vercel.app`.
   - Để đổi thành `https://cupofngos.vercel.app`, vào **Project Settings → General → Name** và đổi tên project thành `cupofngos`.
5. Quay lại GitHub OAuth App đã tạo:
   - Thêm production URL (`https://cupofngos.vercel.app`) vào **Homepage URL**, hoặc tạo một OAuth App riêng cho môi trường production.
   - Cập nhật **Authorization callback URL** tương ứng.
6. Nếu dùng custom domain: vào **Vercel → Domains**, thêm domain và cập nhật biến `NEXT_PUBLIC_SITE_URL` trong Vercel Environment Variables.

---

## Biến môi trường — bảng tóm tắt

| Biến | Ý nghĩa | Bí mật? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL của Supabase project | Không |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key của Supabase | Không |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (chỉ server) | **Có** |
| `ADMIN_GITHUB_EMAIL` | Email GitHub được phép vào admin | Không |
| `NEXT_PUBLIC_SITE_URL` | URL của site (prod hoặc `http://localhost:3000`) | Không |
| `NEXT_PUBLIC_SITE_NAME` | Tên site hiển thị | Không |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | Mô tả ngắn cho SEO / OG | Không |
| `NEXT_PUBLIC_GISCUS_REPO` | Tên repo Giscus (`owner/repo`) | Không |
| `NEXT_PUBLIC_GISCUS_REPO_ID` | Repo ID lấy từ giscus.app | Không |
| `NEXT_PUBLIC_GISCUS_CATEGORY` | Tên Discussion category | Không |
| `NEXT_PUBLIC_GISCUS_CATEGORY_ID` | Category ID lấy từ giscus.app | Không |

> Template đầy đủ xem tại `.env.example`.

---

## Cấu trúc thư mục

```
app/
  (public)/         # Các trang công khai: trang chủ, bài viết, tags, about
  admin/            # Các trang quản trị (bảo vệ bằng session)
  api/              # Route handlers: auth callback, OG image, RSS, sitemap, robots
components/
  ui/               # shadcn/ui generated components
  public/           # Components dùng trên trang công khai (header, footer, post card…)
  admin/            # Components dùng trong admin (editor, form, dialogs…)
lib/
  supabase/         # Supabase client: server, browser, admin (service-role)
  auth/             # Utility kiểm tra admin session
  utils/            # slug, reading-time, TOC, excerpt, tiptap-html, tags, site config
  actions/          # Next.js Server Actions: posts, upload
supabase/
  migrations/       # SQL migrations (0001_init.sql — schema + RLS + trigger)
  seed.sql          # 1 bài viết welcome mẫu
types/
  database.ts       # Supabase generated types
  post.ts           # Post, PostStatus và các type liên quan
public/
  favicon.ico
  og-default.png    # Ảnh OG mặc định khi bài không có cover
```

---

## Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy development server (không Turbopack) |
| `npm run build` | Build production |
| `npm run start` | Chạy production server sau khi build |
| `npm run lint` | Kiểm tra code với ESLint |
| `npm run format` | Format code với Prettier |

---

## Ghi chú

- **Ảnh upload:** Hình ảnh được upload từ editor lưu trong bucket `blog-images` theo đường dẫn `<year>/<month>/<uuid>.<ext>`. Khi xóa bài viết, các file ảnh **không** bị xóa tự động (orphan files) — v1 chấp nhận điều này; có thể dọn dẹp thủ công trong Supabase Storage sau.
- **Tìm kiếm:** Không có trang `/search` trong v1 do số lượng bài còn ít. Có thể bổ sung sau khi nội dung tăng.
- **Bình luận:** Giscus dùng GitHub Discussions làm backend — người bình luận cần có tài khoản GitHub.
- **Quyền admin:** Chỉ một tài khoản GitHub duy nhất được phép, xác định bằng biến `ADMIN_GITHUB_EMAIL`. Tài khoản khác đăng nhập sẽ bị từ chối ngay lập tức và không lưu session.
