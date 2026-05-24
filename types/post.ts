import type { PostRow, PostStatus } from "@/types/database";

export type Post = PostRow;
export type { PostStatus };

export type PostListItem = Pick<
  Post,
  "id" | "title" | "slug" | "excerpt" | "cover_image_url" | "tags" | "published_at" | "reading_time_minutes"
>;

export type PostAdminListItem = Pick<
  Post,
  "id" | "title" | "slug" | "status" | "published_at" | "updated_at" | "tags"
>;
