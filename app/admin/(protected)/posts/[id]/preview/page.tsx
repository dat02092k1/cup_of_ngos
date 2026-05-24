import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PostArticle } from "@/components/public/post-article";
import { jsonToHtml } from "@/lib/utils/tiptap-html";
import { extractTocAndAnchorize } from "@/lib/utils/extract-toc";
import { htmlToPlainText } from "@/lib/utils/tiptap-html";
import { readingTimeMinutes } from "@/lib/utils/reading-time";
import type { Post } from "@/types/post";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) notFound();
  const post = data as Post;

  if (!post.content_html || post.status === "draft") {
    try {
      const rawHtml = jsonToHtml(post.content_json);
      const { html } = extractTocAndAnchorize(rawHtml);
      post.content_html = html;
      const plain = htmlToPlainText(html);
      post.reading_time_minutes = readingTimeMinutes(plain);
    } catch {
      post.content_html = "";
    }
  }

  return (
    <div>
      {post.status === "draft" ? (
        <div className="sticky top-0 z-50 border-b border-yellow-300 bg-yellow-100 px-4 py-2 text-center text-sm font-medium text-yellow-900 dark:border-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200">
          BẢN NHÁP — chỉ admin xem được
        </div>
      ) : null}
      <div className="mx-auto w-full max-w-[680px] px-4 py-10">
        <PostArticle post={post} showShare={false} />
      </div>
    </div>
  );
}
