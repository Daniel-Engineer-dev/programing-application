"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Image as ImageIcon } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({
  value,
  onChange,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  // đồng bộ value từ ngoài vào editor (khi edit bài)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const syncContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execStyle = (command: "bold" | "italic") => {
    // áp dụng style
    document.execCommand(command, false);
    // cập nhật trạng thái highlight
    setIsBold(document.queryCommandState("bold"));
    setIsItalic(document.queryCommandState("italic"));
    syncContent();
  };

  const handleImageClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result;
        if (!url || !editorRef.current) return;

        editorRef.current.focus();
        // chèn ảnh vào vị trí con trỏ
        document.execCommand("insertImage", false, url.toString());
        syncContent();
      };
      reader.readAsDataURL(file);
    };

    input.click();
  };

  const handleInput = () => {
    syncContent();
  };

  const toolbarBtnClass = (active: boolean) =>
    `inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs ${
      active
        ? "border-blue-500 bg-blue-600/20 text-blue-300"
        : "border-slate-700 bg-slate-800 text-slate-200 hover:border-blue-400"
    }`;

  return (
    <div className="space-y-2">
      {/* thanh công cụ */}
      <div className="flex gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1">
        <button
          type="button"
          onClick={() => execStyle("bold")}
          className={toolbarBtnClass(isBold)}
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => execStyle("italic")}
          className={toolbarBtnClass(isItalic)}
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onClick={handleImageClick}
          className={toolbarBtnClass(false)}
        >
          <ImageIcon size={14} />
        </button>
      </div>

      {/* vùng soạn nội dung */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={syncContent}
        className="min-h-[200px] w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
