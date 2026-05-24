import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PostCard } from "@/components/public/post-card";
import { siteConfig } from "@/lib/utils/site";
import type { PostListItem } from "@/types/post";

const PAGE_SIZE = 10;

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: siteConfig.name,
    description: siteConfig.description,
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const pageNum = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const offset = (pageNum - 1) * PAGE_SIZE;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, cover_image_url, tags, published_at, reading_time_minutes")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const posts = (error ? [] : data ?? []) as PostListItem[];

  if (posts.length === 0 && pageNum === 1) {
    return (
      <section className="py-8 text-center text-muted-foreground">
        <p>Chưa có bài viết nào.</p>
      </section>
    );
  }

  const hasNext = posts.length === PAGE_SIZE;
  const hasPrev = pageNum > 1;

  return (
    <section>
      <div className="space-y-0">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
      <nav className="mt-10 flex items-center justify-between text-sm">
        {hasPrev ? (
          <Link
            href={pageNum - 1 === 1 ? "/" : `/?page=${pageNum - 1}`}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Bài mới hơn
          </Link>
        ) : (
          <span />
        )}
        {hasNext ? (
          <Link href={`/?page=${pageNum + 1}`} className="text-muted-foreground hover:text-foreground">
            Bài cũ hơn →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </section>
  );
}
