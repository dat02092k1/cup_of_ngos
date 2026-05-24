import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const allowed = process.env.ADMIN_GITHUB_EMAIL?.toLowerCase().trim();
  if (!user || !allowed || user.email?.toLowerCase() !== allowed) {
    redirect("/admin/login");
  }
  return user;
}

export async function getAdminUserOrNull() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const allowed = process.env.ADMIN_GITHUB_EMAIL?.toLowerCase().trim();
  if (!user || !allowed || user.email?.toLowerCase() !== allowed) return null;
  return user;
}
