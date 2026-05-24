"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  autosavePost,
  publishPost,
  unpublishPost,
  deletePost,
} from "@/lib/actions/posts";
import { uploadImage } from "@/lib/actions/upload";
import NovelEditor, { type JSONContent } from "@/components/admin/novel-editor";
import TagInput from "@/components/admin/tag-input";
import ImageUploadButton from "@/components/admin/image-upload-button";
import AutosaveIndicator from "@/components/admin/autosave-indicator";
import PublishDialog from "@/components/admin/publish-dialog";
import DeleteDialog from "@/components/admin/delete-dialog";
import { vietnameseSlugify } from "@/lib/utils/slug";
import type { Post } from "@/types/post";

// Suppress unused import warning — uploadImage is kept available for potential
// direct use; the actual cover-image upload goes through ImageUploadButton.
void uploadImage;

interface PostFormProps {
  post: Post;
}

export default function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // ── field state ──────────────────────────────────────────────────────────
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    post.cover_image_url,
  );
  const [tags, setTags] = useState<string[]>(post.tags);
  const [contentJson, setContentJson] = useState<JSONContent | null>(
    post.content_json as JSONContent | null,
  );
  const [status, setStatus] = useState(post.status);

  // Track whether user has manually edited the slug
  const [isSlugDirty, setIsSlugDirty] = useState(
    !post.slug.startsWith("untitled-"),
  );

  // ── autosave state ───────────────────────────────────────────────────────
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // ── dialog state ─────────────────────────────────────────────────────────
  const [publishDialog, setPublishDialog] = useState<{
    open: boolean;
    mode: "publish" | "unpublish";
  }>({ open: false, mode: "publish" });
  const [deleteDialog, setDeleteDialog] = useState({ open: false });

  // ── auto-derive slug from title ──────────────────────────────────────────
  useEffect(() => {
    if (!isSlugDirty) {
      const derived = vietnameseSlugify(title);
      setSlug(derived || slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  // ── autosave with 1500ms debounce ────────────────────────────────────────
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    setSaveState("saving");

    const timer = setTimeout(async () => {
      const res = await autosavePost(post.id, {
        title,
        slug,
        excerpt,
        cover_image_url: coverImageUrl,
        tags,
        content_json: contentJson,
      });

      if (res.ok) {
        setSaveState("saved");
        setSavedAt(res.updated_at);
      } else {
        setSaveState("error");
        toast({
          variant: "destructive",
          title: "Lỗi tự động lưu",
          description: res.error,
        });
      }
    }, 1500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, slug, excerpt, coverImageUrl, tags, contentJson]);

  // ── publish / unpublish ──────────────────────────────────────────────────
  function handlePublish() {
    setPublishDialog({
      open: true,
      mode: status === "published" ? "unpublish" : "publish",
    });
  }

  function handlePublishConfirm() {
    startTransition(async () => {
      if (publishDialog.mode === "publish") {
        const res = await publishPost(post.id);
        if (res.ok) {
          toast({ title: "Đã đăng bài" });
          setStatus("published");
        } else {
          toast({
            variant: "destructive",
            title: "Đăng bài thất bại",
            description: res.error,
          });
        }
      } else {
        const res = await unpublishPost(post.id);
        if (res.ok) {
          toast({ title: "Đã hủy đăng bài" });
          setStatus("draft");
        } else {
          toast({
            variant: "destructive",
            title: "Hủy đăng thất bại",
            description: res.error,
          });
        }
      }
      setPublishDialog((prev) => ({ ...prev, open: false }));
    });
  }

  // ── delete ───────────────────────────────────────────────────────────────
  function handleDelete() {
    setDeleteDialog({ open: true });
  }

  function handleDeleteConfirm() {
    startTransition(async () => {
      const res = await deletePost(post.id);
      if (res.ok) {
        router.push("/admin");
      } else {
        toast({
          variant: "destructive",
          title: "Xóa thất bại",
          description: res.error,
        });
        setDeleteDialog({ open: false });
      }
    });
  }

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* ── LEFT column ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <AutosaveIndicator state={saveState} savedAt={savedAt} />
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={`/admin/posts/${post.id}/preview`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye />
                  Xem trước
                </a>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePublish}
                disabled={isPending}
              >
                {status === "published" ? "Hủy đăng" : "Đăng bài"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
              >
                <Trash2 />
                Xóa
              </Button>
            </div>
          </div>

          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề bài viết"
            className="w-full bg-transparent text-4xl font-bold tracking-tight placeholder:text-muted-foreground focus:outline-none"
          />

          {/* Slug */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>/blog/</span>
            <input
              value={slug}
              onChange={(e) => {
                setIsSlugDirty(true);
                setSlug(e.target.value);
              }}
              className="flex-1 bg-transparent focus:outline-none"
            />
          </div>

          {/* Editor */}
          <NovelEditor
            value={contentJson}
            onChange={(json) => {
              setContentJson(json);
            }}
            placeholder="Bắt đầu viết..."
          />
        </div>

        {/* ── RIGHT sidebar ────────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-24 h-fit space-y-6">
          {/* Status */}
          <div className="space-y-2">
            <Badge variant={status === "published" ? "default" : "secondary"}>
              {status === "published" ? "Đã đăng" : "Bản nháp"}
            </Badge>
            {status === "published" && (
              <div>
                <a
                  href={`/blog/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" />
                  Xem bài đăng
                </a>
              </div>
            )}
          </div>

          {/* Cover image */}
          <div className="space-y-2">
            <Label>Ảnh bìa</Label>
            <ImageUploadButton value={coverImageUrl} onChange={setCoverImageUrl} />
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label>Tóm tắt</Label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Vài câu mô tả..."
              rows={4}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tag</Label>
            <TagInput value={tags} onChange={setTags} />
          </div>
        </aside>
      </div>

      {/* Dialogs */}
      <PublishDialog
        open={publishDialog.open}
        onOpenChange={(open) =>
          setPublishDialog((prev) => ({ ...prev, open }))
        }
        mode={publishDialog.mode}
        onConfirm={handlePublishConfirm}
        loading={isPending}
      />
      <DeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open })}
        onConfirm={handleDeleteConfirm}
        loading={isPending}
      />
    </>
  );
}
