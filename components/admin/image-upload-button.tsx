"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { uploadImage } from "@/lib/actions/upload";

interface ImageUploadButtonProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export default function ImageUploadButton({ value, onChange }: ImageUploadButtonProps) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadImage(fd);
      if (res.ok) {
        onChange(res.url);
      } else {
        toast({
          variant: "destructive",
          title: "Tải ảnh thất bại",
          description: res.error,
        });
      }
    } finally {
      setLoading(false);
      // Reset input so the same file can be re-selected
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  if (value) {
    return (
      <div className="space-y-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Ảnh bìa"
          className="aspect-video w-full object-cover rounded-md border border-border"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(null)}
        >
          Xóa ảnh bìa
        </Button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload />
        {loading ? "Đang tải..." : "Tải ảnh bìa"}
      </Button>
    </>
  );
}
