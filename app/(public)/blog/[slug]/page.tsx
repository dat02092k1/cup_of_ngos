import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PostArticle } from "@/components/public/post-article";
import { GiscusComments } from "@/components/public/giscus-comments";
import { siteConfig } from "@/lib/utils/site";
import type { Post, PostListItem } from "@/types/post";

export const revalidate = 0;

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("posts")
    .select("title, excerpt, cover_image_url")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return { title: "Không tìm thấy" };

  const url = `${siteConfig.url}/blog/${slug}`;
  const ogImage =
    data.cover_image_url || `/api/og?title=${encodeURIComponent(data.title)}`;

  return {
    title: data.title,
    description: data.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: data.title,
      description: data.excerpt ?? undefined,
      type: "article",
      url,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.excerpt ?? undefined,
    },
  };
}

export default async function PostDetailPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = createSupabaseAdminClient();
  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !post) notFound();
  const typedPost = post as Post;

  let related: PostListItem[] = [];
  if (typedPost.tags && typedPost.tags.length > 0) {
    const { data: rel } = await supabase
      .from("posts")
      .select("id, title, slug, excerpt, cover_image_url, tags, published_at, reading_time_minutes")
      .eq("status", "published")
      .neq("id", typedPost.id)
      .overlaps("tags", typedPost.tags)
      .order("published_at", { ascending: false })
      .limit(3);
    related = (rel ?? []) as PostListItem[];
  }

  return (
    <>
      <PostArticle post={typedPost} relatedPosts={related} />
      <GiscusComments slug={slug} />
    </>
  );
}
