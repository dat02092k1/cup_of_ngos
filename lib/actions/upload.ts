"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function uploadImage(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Bạn không có quyền thực hiện thao tác này" };
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { ok: false, error: "Không tìm thấy tệp ảnh" };
  }

  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return { ok: false, error: "Định dạng ảnh không hỗ trợ" };
  }

  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, error: "Ảnh vượt quá giới hạn 8MB" };
  }

  const nameParts = file.name.split(".");
  const lastPart = nameParts.length > 1 ? nameParts[nameParts.length - 1] : undefined;
  const rawExt = lastPart ? lastPart.toLowerCase() : "";
  const ext = rawExt || MIME_TO_EXT[file.type] || "jpg";

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const id = crypto.randomUUID();
  const path = `${year}/${month}/${id}.${ext}`;

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.storage
    .from("blog-images")
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    return { ok: false, error: "Đã xảy ra lỗi khi tải ảnh: " + error.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("blog-images").getPublicUrl(path);

  return { ok: true, url: publicUrl };
}
