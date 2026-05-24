import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import PostRowActions from "@/components/admin/post-row-actions";

export default async function AdminDashboardPage() {
  const supabase = createSupabaseAdminClient();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, slug, status, published_at, updated_at, tags")
    .order("updated_at", { ascending: false });

  const isEmpty = error || !posts || posts.length === 0;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bài viết</h1>
        <Button asChild>
          <Link href="/admin/posts/new">Tạo bài mới</Link>
        </Button>
      </div>

      {/* Empty state */}
      {isEmpty ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">
            Chưa có bài viết nào. Tạo bài đầu tiên!
          </p>
          <Button asChild>
            <Link href="/admin/posts/new">Tạo bài mới</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Tiêu đề</th>
                <th className="px-4 py-3 text-left font-medium">Tag</th>
                <th className="px-4 py-3 text-left font-medium">Cập nhật</th>
                <th className="px-4 py-3 text-left font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const visibleTags = post.tags.slice(0, 3);
                const extraCount = post.tags.length - visibleTags.length;
                const formattedDate = format(
                  new Date(post.updated_at),
                  "dd/MM/yyyy HH:mm",
                  { locale: vi },
                );

                return (
                  <tr key={post.id} className="border-b hover:bg-muted/50">
                    {/* Title + status */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="font-medium hover:underline"
                        >
                          {post.title}
                        </Link>
                        <Badge
                          variant={
                            post.status === "published" ? "default" : "secondary"
                          }
                          className="w-fit"
                        >
                          {post.status === "published" ? "Đã đăng" : "Bản nháp"}
                        </Badge>
                      </div>
                    </td>

                    {/* Tags */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {visibleTags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                        {extraCount > 0 && (
                          <Badge variant="outline">+{extraCount}</Badge>
                        )}
                      </div>
                    </td>

                    {/* Updated at */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {formattedDate}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <PostRowActions
                        id={post.id}
                        slug={post.slug}
                        status={post.status}
                        title={post.title}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
