import { redirect } from "next/navigation";
import { createDraftPost } from "@/lib/actions/posts";

export default async function NewPostPage() {
  const result = await createDraftPost();
  if (!result.ok) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-xl font-semibold">Không thể tạo bài viết</h1>
        <p className="mt-2 text-sm text-muted-foreground">{result.error}</p>
      </div>
    );
  }
  redirect(`/admin/posts/${result.id}/edit`);
}
