import Link from "next/link";
import { PostMeta } from "@/components/public/post-meta";
import type { PostListItem } from "@/types/post";

interface Props {
  post: PostListItem;
  variant?: "default" | "compact";
}

export function PostCard({ post, variant = "default" }: Props) {
  if (variant === "compact") {
    return (
      <article className="py-3">
        <Link href={`/blog/${post.slug}`} className="block">
          <h3 className="font-medium leading-snug hover:underline">{post.title}</h3>
          <PostMeta
            publishedAt={post.published_at}
            readingTimeMinutes={post.reading_time_minutes}
          />
        </Link>
      </article>
    );
  }
  return (
    <article className="border-b border-border py-8 first:pt-0 last:border-b-0">
      <Link href={`/blog/${post.slug}`} className="group block">
        <h2 className="text-2xl font-semibold tracking-tight group-hover:underline">
          {post.title}
        </h2>
        <div className="mt-2">
          <PostMeta
            publishedAt={post.published_at}
            readingTimeMinutes={post.reading_time_minutes}
            tags={post.tags}
          />
        </div>
        {post.excerpt ? (
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{post.excerpt}</p>
        ) : null}
      </Link>
    </article>
  );
}
