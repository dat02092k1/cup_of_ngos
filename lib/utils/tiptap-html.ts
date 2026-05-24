import "server-only";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import { parse } from "node-html-parser";

const lowlight = createLowlight(common);

const extensions = [
  StarterKit.configure({ codeBlock: false }),
  Image,
  Link.configure({ openOnClick: false, autolink: true }),
  TaskList,
  TaskItem.configure({ nested: true }),
  CodeBlockLowlight.configure({ lowlight }),
];

export function jsonToHtml(doc: unknown): string {
  // generateHTML expects a JSONContent shape — we trust the editor on insert
  return generateHTML(doc as Parameters<typeof generateHTML>[0], extensions);
}

export function htmlToPlainText(html: string): string {
  const root = parse(html);
  return root.text || "";
}
