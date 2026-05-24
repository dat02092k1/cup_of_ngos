import Image from "next/image";
import { PostMeta } from "@/components/public/post-meta";
import { TableOfContents } from "@/components/public/table-of-contents";
import { ShareButtons } from "@/components/public/share-buttons";
import { RelatedPosts } from "@/components/public/related-posts";
import { siteConfig } from "@/lib/utils/site";
import type { Post, PostListItem } from "@/types/post";

interface Props {
  post: Post;
  relatedPosts?: PostListItem[];
  showShare?: boolean;
}

export function PostArticle({ post, relatedPosts = [], showShare = true }: Props) {
  const publicUrl = `${siteConfig.url}/blog/${post.slug}`;
  return (
    <>
      <TableOfContents html={post.content_html} />
      <article>
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
          <div className="mt-3">
            <PostMeta
              publishedAt={post.published_at}
              readingTimeMinutes={post.reading_time_minutes}
              tags={post.tags}
            />
          </div>
        </header>
        {post.cover_image_url ? (
          <div className="mb-8 overflow-hidden rounded-lg">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              width={1200}
              height={630}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        ) : null}
        {/* content_html is generated server-side from content_json (we control) — safe to render */}
        <div
          className="prose prose-neutral max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: post.content_html }}
        />
        {showShare ? (
          <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">Chia sẻ bài viết</p>
            <ShareButtons url={publicUrl} title={post.title} />
          </div>
        ) : null}
        <RelatedPosts posts={relatedPosts} />
      </article>
    </>
  );
}
