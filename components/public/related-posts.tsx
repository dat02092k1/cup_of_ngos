import { PostCard } from "@/components/public/post-card";
import type { PostListItem } from "@/types/post";

interface Props {
  posts: PostListItem[];
}

export function RelatedPosts({ posts }: Props) {
  if (posts.length === 0) return null;
  return (
    <aside className="mt-12">
      <h2 className="mb-4 text-lg font-semibold">Bài viết liên quan</h2>
      <div className="divide-y divide-border">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} variant="compact" />
        ))}
      </div>
    </aside>
  );
}
