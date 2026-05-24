import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { TagBadge } from "@/components/public/tag-badge";

interface Props {
  publishedAt: string | null;
  readingTimeMinutes: number;
  tags?: string[];
}

export function PostMeta({ publishedAt, readingTimeMinutes, tags = [] }: Props) {
  const dateText = publishedAt
    ? format(new Date(publishedAt), "d 'tháng' M, yyyy", { locale: vi })
    : null;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
      {dateText ? <span>{dateText}</span> : null}
      {dateText ? <span>·</span> : null}
      <span>{readingTimeMinutes} phút đọc</span>
      {tags.length > 0 ? (
        <>
          <span>·</span>
          <div className="flex flex-wrap items-center gap-1">
            {tags.map((t) => (
              <TagBadge key={t} tag={t} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
