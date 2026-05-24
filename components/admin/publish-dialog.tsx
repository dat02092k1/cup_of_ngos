"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "publish" | "unpublish";
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export default function PublishDialog({
  open,
  onOpenChange,
  mode,
  onConfirm,
  loading,
}: PublishDialogProps) {
  const isPublish = mode === "publish";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isPublish ? "Đăng bài lên blog?" : "Hủy đăng bài?"}
          </DialogTitle>
          <DialogDescription>
            {isPublish
              ? "Bài viết sẽ hiển thị công khai trên blog."
              : "Bài viết sẽ chuyển về bản nháp và bị ẩn khỏi blog."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
          >
            {isPublish ? "Đăng" : "Hủy đăng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
