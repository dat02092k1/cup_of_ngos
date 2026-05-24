"use client";

import { useMemo, useRef } from "react";
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandList,
  EditorCommandItem,
  EditorCommandEmpty,
  Command,
  Placeholder,
  handleImagePaste,
  handleImageDrop,
  createImageUpload,
} from "novel";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
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
  onUpload: uploadImageFile,
  validateFn: (file) => {
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Tải ảnh thất bại",
        description: "Chỉ hỗ trợ tệp ảnh",
      });
    }
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

const INSERT_IMAGE_EVENT = "novel-insert-image";

export default function NovelEditor({
  value,
  onChange,
  placeholder,
}: NovelEditorProps) {
  const commandRef = useRef<HTMLDivElement>(null);
  const initialContent = value ?? EMPTY_DOC;

  // Build extensions with placeholder text.
  // Type cast is required because novel bundles its own @tiptap/core
  // (novel/node_modules/@tiptap/core) which differs from the project-level one.
  // At runtime the extension objects are compatible.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorExtensions: any[] = useMemo(
    () => [
      StarterKit.configure({ codeBlock: false }),
      Image,
      Link.configure({ openOnClick: false, autolink: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({
        placeholder: placeholder ?? "Nhập nội dung... (gõ '/' cho lệnh)",
      }),
      Command.configure({
        suggestion: {
          items: () => [],
        },
      }),
    ],
    // placeholder is only used for the initial extension config; re-creating
    // extensions on every placeholder change would re-mount the editor, so
    // we intentionally omit it from the dep array here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function handleSlashImageInsert() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const url = await uploadImageFile(file);
      if (url) {
        document.dispatchEvent(
          new CustomEvent<{ url: string }>(INSERT_IMAGE_EVENT, {
            detail: { url },
          }),
        );
      }
    };
    input.click();
  }

  return (
    <div className="relative">
      <EditorRoot>
        <EditorContent
          ref={commandRef}
          initialContent={initialContent}
          extensions={editorExtensions}
          className="prose dark:prose-invert max-w-none"
          editorProps={{
            attributes: {
              class:
                "prose dark:prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-2",
            },
            handlePaste: (view, event) => {
              if (
                event.clipboardData?.files &&
                event.clipboardData.files.length > 0
              ) {
                return handleImagePaste(view, event, uploadFn);
              }
              return false;
            },
            handleDrop: (view, event, _slice, moved) => {
              return handleImageDrop(
                view,
                event as DragEvent,
                moved,
                uploadFn,
              );
            },
          }}
          onUpdate={({ editor }) => {
            onChange(editor.getJSON(), editor.getHTML());
          }}
          onCreate={({ editor }) => {
            const handler = (e: Event) => {
              const url = (e as CustomEvent<{ url: string }>).detail?.url;
              if (url) {
                editor.chain().focus().setImage({ src: url }).run();
              }
            };
            document.addEventListener(INSERT_IMAGE_EVENT, handler);
            editor.on("destroy", () => {
              document.removeEventListener(INSERT_IMAGE_EVENT, handler);
            });
          }}
        >
          <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="px-2 py-1 text-sm text-muted-foreground">
              Không tìm thấy lệnh
            </EditorCommandEmpty>
            <EditorCommandList>
              <EditorCommandItem
                value="heading1"
                keywords={["h1", "tieu de 1", "tiêu đề 1"]}
                onCommand={({ editor, range }) => {
                  editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleHeading({ level: 1 })
                    .run();
                }}
              >
                <div className="flex items-center gap-2 px-2 py-1">
                  <span className="w-6 text-sm font-bold">H1</span>
                  <span className="text-sm">Tiêu đề 1</span>
                </div>
              </EditorCommandItem>

              <EditorCommandItem
                value="heading2"
                keywords={["h2", "tieu de 2", "tiêu đề 2"]}
                onCommand={({ editor, range }) => {
                  editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleHeading({ level: 2 })
                    .run();
                }}
              >
                <div className="flex items-center gap-2 px-2 py-1">
                  <span className="w-6 text-sm font-bold">H2</span>
                  <span className="text-sm">Tiêu đề 2</span>
                </div>
              </EditorCommandItem>

              <EditorCommandItem
                value="heading3"
                keywords={["h3", "tieu de 3", "tiêu đề 3"]}
                onCommand={({ editor, range }) => {
                  editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleHeading({ level: 3 })
                    .run();
                }}
              >
                <div className="flex items-center gap-2 px-2 py-1">
                  <span className="w-6 text-sm font-bold">H3</span>
                  <span className="text-sm">Tiêu đề 3</span>
                </div>
              </EditorCommandItem>

              <EditorCommandItem
                value="bulletList"
                keywords={["ul", "danh sach", "danh sách", "bullet"]}
                onCommand={({ editor, range }) => {
                  editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleBulletList()
                    .run();
                }}
              >
                <div className="flex items-center gap-2 px-2 py-1">
                  <span className="w-6 text-sm font-bold">•</span>
                  <span className="text-sm">Danh sách</span>
                </div>
              </EditorCommandItem>

              <EditorCommandItem
                value="orderedList"
                keywords={["ol", "numbered", "danh sach so", "danh sách số"]}
                onCommand={({ editor, range }) => {
                  editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleOrderedList()
                    .run();
                }}
              >
                <div className="flex items-center gap-2 px-2 py-1">
                  <span className="w-6 text-sm font-bold">1.</span>
                  <span className="text-sm">Danh sách số</span>
                </div>
              </EditorCommandItem>

              <EditorCommandItem
                value="taskList"
                keywords={["todo", "task", "viec can lam", "việc cần làm"]}
                onCommand={({ editor, range }) => {
                  editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleTaskList()
                    .run();
                }}
              >
                <div className="flex items-center gap-2 px-2 py-1">
                  <span className="w-6 text-sm font-bold">☑</span>
                  <span className="text-sm">Việc cần làm</span>
                </div>
              </EditorCommandItem>

              <EditorCommandItem
                value="blockquote"
                keywords={["quote", "trich dan", "trích dẫn"]}
                onCommand={({ editor, range }) => {
                  editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleBlockquote()
                    .run();
                }}
              >
                <div className="flex items-center gap-2 px-2 py-1">
                  <span className="w-6 text-sm font-bold">&ldquo;</span>
                  <span className="text-sm">Trích dẫn</span>
                </div>
              </EditorCommandItem>

              <EditorCommandItem
                value="codeBlock"
                keywords={["code", "khoi ma", "khối mã"]}
                onCommand={({ editor, range }) => {
                  editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleCodeBlock()
                    .run();
                }}
              >
                <div className="flex items-center gap-2 px-2 py-1">
                  <span className="w-6 font-mono text-sm font-bold">{"{}"}</span>
                  <span className="text-sm">Khối mã</span>
                </div>
              </EditorCommandItem>

              <EditorCommandItem
                value="horizontalRule"
                keywords={[
                  "hr",
                  "divider",
                  "duong ke ngang",
                  "đường kẻ ngang",
                ]}
                onCommand={({ editor, range }) => {
                  editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setHorizontalRule()
                    .run();
                }}
              >
                <div className="flex items-center gap-2 px-2 py-1">
                  <span className="w-6 text-sm font-bold">—</span>
                  <span className="text-sm">Đường kẻ ngang</span>
                </div>
              </EditorCommandItem>

              <EditorCommandItem
                value="image"
                keywords={["img", "anh", "ảnh", "image"]}
                onCommand={({ editor, range }) => {
                  editor.chain().focus().deleteRange(range).run();
                  handleSlashImageInsert();
                }}
              >
                <div className="flex items-center gap-2 px-2 py-1">
                  <span className="w-6 text-sm font-bold">🖼</span>
                  <span className="text-sm">Ảnh</span>
                </div>
              </EditorCommandItem>
            </EditorCommandList>
          </EditorCommand>
        </EditorContent>
      </EditorRoot>
    </div>
  );
}
