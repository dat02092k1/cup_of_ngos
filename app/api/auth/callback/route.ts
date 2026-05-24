import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const allowed = process.env.ADMIN_GITHUB_EMAIL?.toLowerCase().trim();
    if (user?.email?.toLowerCase() === allowed) {
      return NextResponse.redirect(`${origin}/admin`);
    }
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/admin/login?error=not_allowed`);
  }
  return NextResponse.redirect(`${origin}/admin/login?error=missing_code`);
}
