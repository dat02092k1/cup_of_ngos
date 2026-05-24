"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { normalizeTag } from "@/lib/utils/tags";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}

export default function TagInput({ value, onChange, suggestions }: TagInputProps) {
  const [input, setInput] = useState("");

  function addTag(raw: string) {
    const tag = normalizeTag(raw);
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim()) {
        addTag(input.trim());
        setInput("");
      }
    } else if (e.key === "Backspace" && input === "") {
      if (value.length > 0) {
        onChange(value.slice(0, -1));
      }
    }
  }

  const availableSuggestions = suggestions?.filter((s) => !value.includes(s)) ?? [];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
        {value.map((tag, i) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? "Thêm tag..." : ""}
          className="flex-1 min-w-[6rem] outline-none bg-transparent text-sm"
        />
      </div>
      {availableSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {availableSuggestions.map((s) => (
            <Badge
              key={s}
              variant="outline"
              className="cursor-pointer hover:bg-secondary"
              onClick={() => addTag(s)}
            >
              {s}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
