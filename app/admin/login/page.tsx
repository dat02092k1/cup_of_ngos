"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { siteConfig } from "@/lib/utils/site";

function GithubIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.254-.447-1.27.098-2.645 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.547 1.375.203 2.391.1 2.645.641.698 1.028 1.591 1.028 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

function LoginCardShell() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-center mb-2">
          {siteConfig.name}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Trang quản trị
        </p>
        <div className="w-full rounded-md bg-primary text-primary-foreground py-2 font-medium inline-flex items-center justify-center gap-2 opacity-50">
          <GithubIcon />
          Đăng nhập với GitHub
        </div>
      </div>
    </div>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);

  let errorMessage: string | null = null;
  if (error === "not_allowed") {
    errorMessage =
      "Tài khoản GitHub không được phép truy cập trang quản trị.";
  } else if (error === "missing_code") {
    errorMessage = "Đã xảy ra lỗi xác thực, vui lòng thử lại.";
  }

  async function handleLogin() {
    setIsLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    // isLoading stays true while browser navigates away
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-center mb-2">
          {siteConfig.name}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Trang quản trị
        </p>

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full rounded-md bg-primary text-primary-foreground py-2 font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          <GithubIcon />
          {isLoading ? "Đang chuyển hướng…" : "Đăng nhập với GitHub"}
        </button>

        {errorMessage && (
          <p className="mt-4 text-sm text-destructive text-center">
            {errorMessage}
          </p>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:underline"
          >
            Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoginCardShell />}>
      <LoginContent />
    </Suspense>
  );
}
