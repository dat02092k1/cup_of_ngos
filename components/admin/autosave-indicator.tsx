"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface AutosaveIndicatorProps {
  state: "idle" | "saving" | "saved" | "error";
  savedAt?: string | null;
}

export default function AutosaveIndicator({ state, savedAt }: AutosaveIndicatorProps) {
  if (state === "idle") {
    return null;
  }

  if (state === "saving") {
    return (
      <span className="text-xs text-muted-foreground">Đang lưu…</span>
    );
  }

  if (state === "saved") {
    if (savedAt) {
      const formatted = format(new Date(savedAt), "HH:mm", { locale: vi });
      return (
        <span className="text-xs text-muted-foreground">
          Đã lưu lúc {formatted}
        </span>
      );
    }
    return (
      <span className="text-xs text-muted-foreground">Đã lưu</span>
    );
  }

  if (state === "error") {
    return (
      <span className="text-xs text-destructive">Lỗi lưu</span>
    );
  }

  return null;
}
