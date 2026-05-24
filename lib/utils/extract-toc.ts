import "server-only";
import { parse } from "node-html-parser";
import { vietnameseSlugify } from "@/lib/utils/slug";

export function extractTocAndAnchorize(html: string): {
  html: string;
  toc: { id: string; text: string }[];
} {
  const root = parse(html);
  const toc: { id: string; text: string }[] = [];
  const seen = new Set<string>();

  root.querySelectorAll("h2").forEach((h2) => {
    const text = (h2.text || "").trim();
    if (!text) return;
    let id = vietnameseSlugify(text);
    if (!id) return;
    let candidate = id;
    let n = 2;
    while (seen.has(candidate)) {
      candidate = id + "-" + n;
      n++;
    }
    id = candidate;
    seen.add(id);
    h2.setAttribute("id", id);
    toc.push({ id, text });
  });

  return { html: root.toString(), toc };
}
