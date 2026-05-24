import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Về mình",
  description: "Vài dòng về chủ blog cupofngos.",
};

export default function AboutPage() {
  return (
    <article className="prose prose-neutral max-w-none dark:prose-invert">
      <h1>Về mình</h1>
      <p>
        Chào, mình là chủ blog <strong>cupofngos</strong>. Đây là nơi mình ghi
        lại những điều thú vị về code, AI, đời sống và cà phê.
      </p>
      <p>
        Blog này được dựng bằng <em>Next.js</em>, <em>Supabase</em>, và{" "}
        <em>Tailwind CSS</em>. Mọi bài viết đều xuất phát từ một tách cà phê
        nóng.
      </p>
      <p>
        Nếu bạn thấy nội dung gì hữu ích, đừng ngại để lại bình luận hoặc theo
        dõi RSS.
      </p>
    </article>
  );
}
