"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { vietnameseSlugify } from "@/lib/utils/slug";
import { normalizeTag } from "@/lib/utils/tags";
import { jsonToHtml, htmlToPlainText } from "@/lib/utils/tiptap-html";
import { extractTocAndAnchorize } from "@/lib/utils/extract-toc";
import { readingTimeMinutes } from "@/lib/utils/reading-time";
import { autoExcerpt } from "@/lib/utils/excerpt";
import type { Post } from "@/types/post";
import type { PostUpdate } from "@/types/database";

type Result<T> = ({ ok: true } & T) | { ok: false; error: string };

// ─── 1. createDraftPost ────────────────────────────────────────────────────

export async function createDraftPost(): Promise<Result<{ id: string }>> {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();

  try {
    const uuid = crypto.randomUUID();
    const slug = "untitled-" + uuid.slice(0, 8);
    const title = "Bài viết không tiêu đề";
    const content_json = { type: "doc", content: [{ type: "paragraph" }] };

    const { data, error } = await supabase
      .from("posts")
      .insert({ title, slug, content_json, status: "draft" })
      .select("id")
      .single();

    if (error) {
      return { ok: false, error: "Đã xảy ra lỗi: " + error.message };
    }

    return { ok: true, id: data.id };
  } catch (e) {
    return {
      ok: false,
      error: "Đã xảy ra lỗi: " + (e instanceof Error ? e.message : String(e)),
    };
  }
}

// ─── 2. autosavePost ───────────────────────────────────────────────────────

export async function autosavePost(
  id: string,
  patch: {
    title?: string;
    slug?: string;
    content_json?: unknown;
    excerpt?: string;
    cover_image_url?: string | null;
    tags?: string[];
  },
): Promise<Result<{ updated_at: string }>> {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();

  try {
    // Build update object with only fields present in patch
    const update: PostUpdate = {};

    if (patch.title !== undefined) {
      update.title = patch.title;
    }

    if (patch.slug !== undefined) {
      // Normalize the provided slug
      update.slug = vietnameseSlugify(patch.slug);
    } else if (patch.title !== undefined) {
      // No slug provided but title changed: check if current slug is "untitled-*"
      const { data: currentRow, error: fetchError } = await supabase
        .from("posts")
        .select("slug")
        .eq("id", id)
        .single();

      if (fetchError) {
        return { ok: false, error: "Đã xảy ra lỗi: " + fetchError.message };
      }

      if (currentRow && currentRow.slug.startsWith("untitled-")) {
        const newSlug = vietnameseSlugify(patch.title);
        if (newSlug) {
          update.slug = newSlug;
        }
      }
    }

    if (patch.content_json !== undefined) {
      update.content_json = patch.content_json as Record<string, unknown>;
    }

    if (patch.excerpt !== undefined) {
      update.excerpt = patch.excerpt;
    }

    if (patch.cover_image_url !== undefined) {
      update.cover_image_url = patch.cover_image_url;
    }

    if (patch.tags !== undefined) {
      const normalized = Array.from(
        new Set(patch.tags.map((t) => normalizeTag(t)).filter(Boolean)),
      );
      update.tags = normalized;
    }

    const { data, error } = await supabase
      .from("posts")
      .update(update)
      .eq("id", id)
      .select("updated_at")
      .single();

    if (error) {
      return { ok: false, error: "Đã xảy ra lỗi: " + error.message };
    }

    return { ok: true, updated_at: data.updated_at };
  } catch (e) {
    return {
      ok: false,
      error: "Đã xảy ra lỗi: " + (e instanceof Error ? e.message : String(e)),
    };
  }
}

// ─── 3. publishPost ────────────────────────────────────────────────────────

export async function publishPost(
  id: string,
): Promise<Result<{ slug: string }>> {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();

  try {
    // Fetch the full row
    const { data: row, error: fetchError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      return { ok: false, error: "Đã xảy ra lỗi: " + fetchError.message };
    }

    const post = row as Post;

    // Validation: title non-empty
    if (!post.title.trim()) {
      return { ok: false, error: "Tiêu đề không được để trống" };
    }

    // Validation: slug non-empty
    if (!post.slug) {
      return { ok: false, error: "Slug không được để trống" };
    }

    // Validation: content_json has at least one non-empty child
    const structuralTypes = new Set([
      "image",
      "horizontalRule",
      "taskList",
      "codeBlock",
      "table",
      "blockquote",
    ]);
    const contentDoc = post.content_json as {
      content?: Array<{ content?: unknown[]; type?: string }>;
    };
    const hasContent =
      Array.isArray(contentDoc?.content) &&
      contentDoc.content.some(
        (child) =>
          (Array.isArray(child.content) && child.content.length > 0) ||
          (child.type !== undefined && structuralTypes.has(child.type)),
      );

    if (!hasContent) {
      return { ok: false, error: "Nội dung bài viết trống" };
    }

    // Check slug uniqueness against other rows
    const { data: slugConflict, error: slugError } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", post.slug)
      .neq("id", id)
      .limit(1);

    if (slugError) {
      return { ok: false, error: "Đã xảy ra lỗi: " + slugError.message };
    }

    if (slugConflict && slugConflict.length > 0) {
      return { ok: false, error: "Slug đã tồn tại" };
    }

    // Compute HTML with anchored headings
    let html = jsonToHtml(post.content_json);
    const { html: anchored } = extractTocAndAnchorize(html);
    html = anchored;

    // Compute plain text and reading time
    const plainText = htmlToPlainText(html);
    const reading_time_minutes = readingTimeMinutes(plainText);

    // Compute excerpt if blank
    const originalExcerptBlank = !post.excerpt.trim();
    const excerpt = originalExcerptBlank ? autoExcerpt(plainText) : post.excerpt;

    // Build update payload
    const updatePayload: PostUpdate = {
      status: "published",
      published_at: post.published_at ?? new Date().toISOString(),
      content_html: html,
      reading_time_minutes,
    };

    if (originalExcerptBlank) {
      updatePayload.excerpt = excerpt;
    }

    const { error: updateError } = await supabase
      .from("posts")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      return { ok: false, error: "Đã xảy ra lỗi: " + updateError.message };
    }

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/blog/" + post.slug);
    for (const tag of post.tags) {
      revalidatePath("/tags/" + tag);
    }
    revalidatePath("/sitemap.xml");
    revalidatePath("/rss.xml");

    return { ok: true, slug: post.slug };
  } catch (e) {
    return {
      ok: false,
      error: "Đã xảy ra lỗi: " + (e instanceof Error ? e.message : String(e)),
    };
  }
}

// ─── 4. unpublishPost ──────────────────────────────────────────────────────

export async function unpublishPost(id: string): Promise<Result<object>> {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();

  try {
    // Fetch row for slug + tags (needed for revalidation)
    const { data: row, error: fetchError } = await supabase
      .from("posts")
      .select("slug, tags")
      .eq("id", id)
      .single();

    if (fetchError) {
      return { ok: false, error: "Đã xảy ra lỗi: " + fetchError.message };
    }

    const { error: updateError } = await supabase
      .from("posts")
      .update({ status: "draft" })
      .eq("id", id);

    if (updateError) {
      return { ok: false, error: "Đã xảy ra lỗi: " + updateError.message };
    }

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/blog/" + row.slug);
    for (const tag of row.tags as string[]) {
      revalidatePath("/tags/" + tag);
    }
    revalidatePath("/sitemap.xml");
    revalidatePath("/rss.xml");

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: "Đã xảy ra lỗi: " + (e instanceof Error ? e.message : String(e)),
    };
  }
}

// ─── 5. deletePost ─────────────────────────────────────────────────────────

export async function deletePost(id: string): Promise<Result<object>> {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();

  try {
    // Fetch row first to capture slug + tags for revalidation
    const { data: row, error: fetchError } = await supabase
      .from("posts")
      .select("slug, tags")
      .eq("id", id)
      .single();

    if (fetchError) {
      return { ok: false, error: "Đã xảy ra lỗi: " + fetchError.message };
    }

    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return { ok: false, error: "Đã xảy ra lỗi: " + deleteError.message };
    }

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/blog/" + row.slug);
    for (const tag of row.tags as string[]) {
      revalidatePath("/tags/" + tag);
    }
    revalidatePath("/sitemap.xml");
    revalidatePath("/rss.xml");

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: "Đã xảy ra lỗi: " + (e instanceof Error ? e.message : String(e)),
    };
  }
}
