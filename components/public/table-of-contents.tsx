import { parse } from "node-html-parser";

interface Props {
  html: string;
}

export function TableOfContents({ html }: Props) {
  const root = parse(html);
  const items = root
    .querySelectorAll("h2")
    .map((h) => ({
      id: h.getAttribute("id") ?? "",
      text: (h.text || "").trim(),
    }))
    .filter((i) => i.id && i.text);

  if (items.length < 2) return null;

  return (
    <nav className="hidden xl:fixed xl:right-8 xl:top-32 xl:block xl:w-64">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Mục lục
      </p>
      <ol className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="text-muted-foreground hover:text-foreground">
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
