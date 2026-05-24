"use client";

import { useMemo } from "react";
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandList,
  EditorCommandItem,
  EditorCommandEmpty,
  Command,
  StarterKit,
  TiptapImage,
  TiptapLink,
  TaskList,
  TaskItem,
  CodeBlockLowlight,
  Placeholder,
  UploadImagesPlugin,
  handleImagePaste,
  handleImageDrop,
  handleCommandNavigation,
  createImageUpload,
  createSuggestionItems,
  renderItems,
  type SuggestionItem,
} from "novel";
import type { JSONContent } from "@tiptap/core";
import { createLowlight, common } from "lowlight";
import { uploadImage } from "@/lib/actions/upload";
import { toast } from "@/components/ui/use-toast";

export type { JSONContent };

const lowlight = createLowlight(common);

export async function uploadImageFile(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await uploadImage(fd);
  if (!res.ok) {
    toast({
      variant: "destructive",
      title: "Tải ảnh thất bại",
      description: res.error,
    });
    return null;
  }
  return res.url;
}

const uploadFn = createImageUpload({
  onUpload: (file) => uploadImageFile(file).then((url) => url ?? ""),
  validateFn: (file) => {
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Tải ảnh thất bại",
        description: "Chỉ hỗ trợ tệp ảnh",
      });
      return false;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Tải ảnh thất bại",
        description: "Ảnh vượt quá giới hạn 8MB",
      });
      return false;
    }
    return true;
  },
});

const suggestionItems: SuggestionItem[] = createSuggestionItems([
  {
    title: "Tiêu đề 1",
    description: "Tiêu đề lớn",
    searchTerms: ["h1", "tieu de 1", "heading"],
    icon: <span className="font-bold">H1</span>,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run();
    },
  },
  {
    title: "Tiêu đề 2",
    description: "Tiêu đề vừa",
    searchTerms: ["h2", "tieu de 2"],
    icon: <span className="font-bold">H2</span>,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run();
    },
  },
  {
    title: "Tiêu đề 3",
    description: "Tiêu đề nhỏ",
    searchTerms: ["h3", "tieu de 3"],
    icon: <span className="font-bold">H3</span>,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run();
    },
  },
  {
    title: "Danh sách",
    description: "Danh sách dấu chấm",
    searchTerms: ["ul", "bullet", "danh sach"],
    icon: <span className="font-bold">•</span>,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Danh sách số",
    description: "Danh sách đánh số",
    searchTerms: ["ol", "numbered", "danh sach so"],
    icon: <span className="font-bold">1.</span>,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Việc cần làm",
    description: "Danh sách checklist",
    searchTerms: ["todo", "task", "viec can lam"],
    icon: <span className="font-bold">☑</span>,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Trích dẫn",
    description: "Khối trích dẫn",
    searchTerms: ["quote", "blockquote", "trich dan"],
    icon: <span className="font-bold">&ldquo;</span>,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Khối mã",
    description: "Code block",
    searchTerms: ["code", "khoi ma"],
    icon: <span className="font-mono font-bold">{"{}"}</span>,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "Đường kẻ ngang",
    description: "Chia phần",
    searchTerms: ["hr", "divider", "duong ke"],
    icon: <span className="font-bold">—</span>,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "Ảnh",
    description: "Tải ảnh từ máy",
    searchTerms: ["img", "image", "anh", "picture"],
    icon: <span>🖼</span>,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const pos = editor.view.state.selection.from;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (uploadFn as any)(file, editor.view, pos);
      };
      input.click();
    },
  },
]);

const slashCommand = Command.configure({
  suggestion: {
    items: () => suggestionItems,
    render: renderItems,
  },
});

interface NovelEditorProps {
  value: JSONContent | null;
  onChange: (json: JSONContent, html: string) => void;
  placeholder?: string;
}

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export default function NovelEditor({
  value,
  onChange,
  placeholder,
}: NovelEditorProps) {
  const initialContent = value ?? EMPTY_DOC;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorExtensions: any[] = useMemo(
    () => [
      StarterKit.configure({ codeBlock: false }),
      TiptapImage.extend({
        addProseMirrorPlugins() {
          return [UploadImagesPlugin({ imageClass: "opacity-40 rounded-lg" })];
        },
      }).configure({ allowBase64: true, inline: false }),
      TiptapLink.configure({ openOnClick: false, autolink: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({
        placeholder: placeholder ?? "Nhập nội dung... (gõ '/' cho lệnh)",
      }),
      slashCommand,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="relative">
      <EditorRoot>
        <EditorContent
          initialContent={initialContent}
          extensions={editorExtensions}
          className="prose dark:prose-invert max-w-none"
          editorProps={{
            attributes: {
              class:
                "prose dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-2",
            },
            handleKeyDown: (_view, event) => handleCommandNavigation(event),
            handlePaste: (view, event) =>
              handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) =>
              handleImageDrop(view, event, moved, uploadFn),
          }}
          onUpdate={({ editor }) => {
            onChange(editor.getJSON(), editor.getHTML());
          }}
        >
          <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-border bg-background px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="px-2 py-1 text-sm text-muted-foreground">
              Không tìm thấy lệnh
            </EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item) => (
                <EditorCommandItem
                  key={item.title}
                  value={item.title}
                  onCommand={(val) => item.command?.(val)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent aria-selected:bg-accent"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background">
                    {item.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.title}</span>
                    {item.description ? (
                      <span className="text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    ) : null}
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>
        </EditorContent>
      </EditorRoot>
    </div>
  );
}
