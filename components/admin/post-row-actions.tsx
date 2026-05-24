"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import DeleteDialog from "@/components/admin/delete-dialog";
import { deletePost } from "@/lib/actions/posts";

interface PostRowActionsProps {
  id: string;
  slug: string;
  status: string;
  title: string;
}

export default function PostRowActions({
  id,
  title,
}: PostRowActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await deletePost(id);
      if (result.ok) {
        toast({ title: `Đã xóa bài: ${title}` });
        router.refresh();
      } else {
        toast({
          title: "Xóa thất bại",
          description: result.error,
          variant: "destructive",
        });
      }
      setOpen(false);
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="ghost" size="icon" title="Sửa">
        <Link href={`/admin/posts/${id}/edit`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon" title="Xem trước">
        <Link href={`/admin/posts/${id}/preview`} target="_blank">
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="Xóa"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <DeleteDialog
        open={open}
        onOpenChange={setOpen}
        loading={isPending}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
