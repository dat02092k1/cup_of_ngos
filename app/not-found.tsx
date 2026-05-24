import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-semibold">404 — Không tìm thấy trang</h1>
      <p className="mt-2 text-muted-foreground">
        Trang bạn tìm có thể đã bị xóa hoặc chưa được đăng.
      </p>
      <Link href="/" className="mt-6 text-sm underline underline-offset-4 hover:no-underline">
        Về trang chủ
      </Link>
    </div>
  );
}
