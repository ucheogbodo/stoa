// components/FileUpload.tsx
// Drag-and-drop file uploader for Project workbenches.
"use client";

import { useState, useRef } from "react";

interface FileUploadProps {
  projectId: string;
}

export default function FileUpload({ projectId }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/projects/${projectId}/files`, {
      method: "POST",
      body: formData,
    });

    setUploading(false);
    if (res.ok) {
      setMessage(`✓ "${file.name}" uploaded`);
      // Refresh page data — a full router refresh shows the new file
      window.location.reload();
    } else {
      setMessage("Upload failed. Please try again.");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
        dragging
          ? "border-sage bg-sage/10"
          : "border-parchment-dark hover:border-sage bg-parchment"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
      {uploading ? (
        <p className="text-sm text-ink-muted">Uploading…</p>
      ) : (
        <>
          <p className="text-sm text-ink-muted">
            Drag a file here or <span className="text-sage font-medium">click to browse</span>
          </p>
          <p className="text-xs text-ink-muted mt-1">PDFs, images, text files</p>
        </>
      )}
      {message && (
        <p className={`text-xs mt-2 ${message.startsWith("✓") ? "text-sage" : "text-rust"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
