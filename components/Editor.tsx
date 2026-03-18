// components/Editor.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Tiptap rich text editor component.
//
// Tiptap is built on top of ProseMirror, a powerful but complex editor library.
// Tiptap makes ProseMirror much easier to use by providing a React component
// and a set of "extensions" (plugins) that add features like bold, headings, etc.
//
// StarterKit includes: bold, italic, headings (h1-h6), bullet list, ordered list,
// blockquote, code, code block, horizontal rule, hard break, and history (undo/redo).
//
// The editor outputs a JSON document (ProseMirror document format) which we
// store in the database as the `body` field of an Idea.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/react";

interface EditorProps {
  // Initial content to load (a Tiptap JSON document, or null for empty)
  initialContent?: JSONContent | null;
  // Called every time the document changes, with the new JSON content
  onChange?: (content: JSONContent) => void;
  // Placeholder text shown when the editor is empty
  placeholder?: string;
}

export function Editor({ initialContent, onChange, placeholder }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable the heading levels we don't want
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Begin writing...",
      }),
    ],

    // Load initial content if we're editing an existing idea
    content: initialContent ?? undefined,

    // Fire onChange whenever the document changes
    onUpdate({ editor }) {
      onChange?.(editor.getJSON());
    },

    // Prevents server/client HTML mismatch in Next.js
    immediatelyRender: false,
  });

  return (
    <div className="prose-container">
      {/* Toolbar */}
      {editor && (
        <div className="flex flex-wrap gap-1 mb-3 pb-3 border-b border-parchment-border">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold"
          >
            <strong>B</strong>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic"
          >
            <em>I</em>
          </ToolbarButton>

          <div className="w-px bg-parchment-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            H1
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            H2
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            H3
          </ToolbarButton>

          <div className="w-px bg-parchment-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet list"
          >
            • List
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Numbered list"
          >
            1. List
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Blockquote"
          >
            ❝
          </ToolbarButton>
        </div>
      )}

      {/* The actual editable content area */}
      <EditorContent
        editor={editor}
        className="text-ink leading-relaxed min-h-[300px]"
      />
    </div>
  );
}

// ── ToolbarButton ─────────────────────────────────────────────────────────────
interface ToolbarButtonProps {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
        active
          ? "bg-ink text-parchment"
          : "text-ink-muted hover:bg-parchment-dark hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
