"use client";

import * as React from "react";
import { Share2, Share, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: Props) {
  const { toast } = useToast();
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Đã sao chép liên kết" });
    } catch {
      toast({ variant: "destructive", title: "Không thể sao chép liên kết" });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="icon" aria-label="Chia sẻ lên Twitter">
        <a
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
          target="_blank"
          rel="noreferrer"
        >
          <Share2 className="h-4 w-4" />
        </a>
      </Button>
      <Button asChild variant="ghost" size="icon" aria-label="Chia sẻ lên Facebook">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
        >
          <Share className="h-4 w-4" />
        </a>
      </Button>
      <Button variant="ghost" size="icon" aria-label="Sao chép liên kết" onClick={copyLink}>
        <Link2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
