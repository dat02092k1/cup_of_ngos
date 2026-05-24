export function autoExcerpt(plainText: string, max = 160): string {
  const trimmed = plainText.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}
