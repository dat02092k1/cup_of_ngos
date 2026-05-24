import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PostCard } from "@/components/public/post-card";
import { siteConfig } from "@/lib/utils/site";
import type { PostListItem } from "@/types/post";

export const revalidate = 60;

export async function generateMetadata(
  { params }: { params: Promise<{ tag: string }> },
): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `Tag: #${decoded} — ${siteConfig.name}`,
    description: `Các bài viết được gắn tag #${decoded}.`,
  };
}

export default async function TagPage(
  { params }: { params: Promise<{ tag: string }> },
) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, cover_image_url, tags, published_at, reading_time_minutes")
    .eq("status", "published")
    .contains("tags", [decoded])
    .order("published_at", { ascending: false });

  const posts = (data ?? []) as PostListItem[];

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Tag: #{decoded}</h1>
      </header>
      {posts.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <p>Chưa có bài viết với tag này.</p>
          <p className="mt-2">
            <Link href="/" className="underline underline-offset-4 hover:no-underline">
              Về trang chủ
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </section>
  );
}
