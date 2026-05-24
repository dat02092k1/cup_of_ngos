import { vietnameseSlugify } from "@/lib/utils/slug";

export function normalizeTag(raw: string): string {
  return vietnameseSlugify(raw).slice(0, 40);
}

export function parseTagsInput(input: string): string[] {
  const parts = input.split(/[,\n]/).map((s) => normalizeTag(s)).filter(Boolean);
  return Array.from(new Set(parts));
}
