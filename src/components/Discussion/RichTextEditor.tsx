"use client";
import { markdownToHtml } from "./Markdown";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Heading,
  List,
  ListOrdered,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
} from "lucide-react";

interface RichTextEditorProps {
  value: string; // markdown
  onChange: (value: string) => void;
}

type TipKey =
  | "heading"
  | "bold"
  | "italic"
  | "underline"
  | "ul"
  | "ol"
  | "code"
  | "link"
  | "image"
  | "hr";

const TIP_TEXT: Record<TipKey, string> = {
  heading: "Tiêu đề",
  bold: "In đậm (Ctrl + B)",
  italic: "In nghiêng (Ctrl + I)",
  underline: "Gạch chân",
  ul: "Danh sách gạch đầu dòng",
  ol: "Danh sách đánh số",
  code: "Khối mã / đoạn mã",
  link: "Chèn liên kết",
  image: "Chèn ảnh",
  hr: "Đường phân cách",
};

/** Inline formatter cho 1 dòng text (đã escape) */
function formatInline(text: string) {
  let t = text;

  // Inline code: `code`
  t = t.replace(
    /`([^`]+)`/g,
    `<code class="rounded bg-slate-950 px-1 py-0.5 border border-slate-700">$1</code>`
  );

  // Underline custom: ++text++
  t = t.replace(/\+\+([^+]+)\+\+/g, `<u>$1</u>`);

  // Bold: **text**
  t = t.replace(/\*\*([^*]+)\*\*/g, `<strong>$1</strong>`);

  // Italic: _text_  (dùng "_" để không đụng với **bold**)
  t = t.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, `$1<em>$2</em>`);

  // Image: ![alt](url)
  t = t.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    `<img alt="$1" src="$2" class="my-2 max-w-full rounded-lg border border-slate-700" />`
  );

  // Link: [text](url)
  t = t.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    `<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline hover:text-blue-300">$1</a>`
  );

  return t;
}

/** Lấy thông tin dòng hiện tại */
function getLineInfo(text: string, pos: number) {
  const start = text.lastIndexOf("\n", pos - 1) + 1;
  const endIdx = text.indexOf("\n", pos);
  const end = endIdx === -1 ? text.length : endIdx;
  const line = text.slice(start, end);
  return { start, end, line };
}

/** Toggle prefix ở đầu dòng (vd: "# ", "- ", "1. ") */
function toggleLinePrefix(
  text: string,
  pos: number,
  prefix: string,
  altPrefix?: string
) {
  const { start, end, line } = getLineInfo(text, pos);

  let newLine = line;
  if (line.startsWith(prefix)) {
    newLine = line.slice(prefix.length);
  } else if (altPrefix && line.startsWith(altPrefix)) {
    newLine = prefix + line.slice(altPrefix.length);
  } else {
    newLine = prefix + line;
  }

  const next = text.slice(0, start) + newLine + text.slice(end);

  const delta = newLine.length - line.length;
  const nextPos = pos + delta;
  return { next, nextPos };
}

/** Toggle wrap selection (vd: ** **, _ _, ++ ++, ` `) */
function toggleWrap(
  text: string,
  start: number,
  end: number,
  left: string,
  right = left
) {
  const selected = text.slice(start, end);
  const before = text.slice(0, start);
  const after = text.slice(end);

  const hasWrap =
    start >= left.length &&
    text.slice(start - left.length, start) === left &&
    text.slice(end, end + right.length) === right;

  if (hasWrap) {
    const next =
      text.slice(0, start - left.length) +
      selected +
      text.slice(end + right.length);
    return {
      next,
      nextStart: start - left.length,
      nextEnd: end - left.length,
    };
  }

  const next = before + left + selected + right + after;
  return {
    next,
    nextStart: start + left.length,
    nextEnd: end + left.length,
  };
}

/** Tính active state dựa trên cursor/selection (chỉ để logic, không highlight UI) */
function computeActive(md: string, selStart: number) {
  const { line } = getLineInfo(md, selStart);

  const isHeading = line.startsWith("# ");
  const isUl = line.startsWith("- ");
  const isOl = /^\s*\d+\.\s+/.test(line);

  // kiểm tra wrap quanh selection
  const leftWindow = md.slice(Math.max(0, selStart - 6), selStart);
  const rightWindow = md.slice(selStart, Math.min(md.length, selStart + 6));
  const around = leftWindow + rightWindow;

  const isBold = around.includes("**");
  const isItalic = around.includes("_");
  const isUnderline = around.includes("++");
  const isInlineCode = around.includes("`");

  return { isHeading, isUl, isOl, isBold, isItalic, isUnderline, isInlineCode };
}

export default function RichTextEditor({
  value,
  onChange,
}: RichTextEditorProps) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const [hoverTip, setHoverTip] = useState<TipKey | null>(null);

  // giữ state để sync selection (không dùng để làm nút sáng)
  const [, setActive] = useState({
    isHeading: false,
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isUl: false,
    isOl: false,
    isInlineCode: false,
  });

  const previewHtml = useMemo(() => markdownToHtml(value || ""), [value]);

  const updateActiveFromSelection = () => {
    const el = taRef.current;
    if (!el) return;
    const next = computeActive(value || "", el.selectionStart);
    setActive(next);
  };

  useEffect(() => {
    updateActiveFromSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const setValueKeepSelection = (
    next: string,
    nextStart?: number,
    nextEnd?: number
  ) => {
    onChange(next);
    requestAnimationFrame(() => {
      const el = taRef.current;
      if (!el) return;
      if (typeof nextStart === "number" && typeof nextEnd === "number") {
        el.setSelectionRange(nextStart, nextEnd);
      }
      el.focus();
      updateActiveFromSelection();
    });
  };

  const handleHeading = () => {
    const el = taRef.current;
    if (!el) return;
    const { next, nextPos } = toggleLinePrefix(
      value || "",
      el.selectionStart,
      "# "
    );
    setValueKeepSelection(next, nextPos, nextPos);
  };

  const handleUl = () => {
    const el = taRef.current;
    if (!el) return;
    // toggle "- " (nếu đang "1. " thì chuyển sang "- ")
    const { next, nextPos } = toggleLinePrefix(
      value || "",
      el.selectionStart,
      "- ",
      "1. "
    );
    setValueKeepSelection(next, nextPos, nextPos);
  };

  const handleOl = () => {
    const el = taRef.current;
    if (!el) return;

    const { start, end, line } = getLineInfo(value || "", el.selectionStart);
    const isOl = /^\s*\d+\.\s+/.test(line);

    let newLine = line;
    if (isOl) {
      newLine = line.replace(/^\s*\d+\.\s+/, "");
    } else if (line.startsWith("- ")) {
      newLine = "1. " + line.slice(2);
    } else {
      newLine = "1. " + line;
    }

    const next =
      (value || "").slice(0, start) + newLine + (value || "").slice(end);
    const delta = newLine.length - line.length;
    const nextPos = el.selectionStart + delta;
    setValueKeepSelection(next, nextPos, nextPos);
  };

  const handleBold = () => {
    const el = taRef.current;
    if (!el) return;
    const { next, nextStart, nextEnd } = toggleWrap(
      value || "",
      el.selectionStart,
      el.selectionEnd,
      "**"
    );
    setValueKeepSelection(next, nextStart, nextEnd);
  };

  const handleItalic = () => {
    const el = taRef.current;
    if (!el) return;
    // dùng "_" để không bị đụng với "**" của bold
    const { next, nextStart, nextEnd } = toggleWrap(
      value || "",
      el.selectionStart,
      el.selectionEnd,
      "_"
    );
    setValueKeepSelection(next, nextStart, nextEnd);
  };

  const handleUnderline = () => {
    const el = taRef.current;
    if (!el) return;
    const { next, nextStart, nextEnd } = toggleWrap(
      value || "",
      el.selectionStart,
      el.selectionEnd,
      "++"
    );
    setValueKeepSelection(next, nextStart, nextEnd);
  };

  const handleInlineCode = () => {
    const el = taRef.current;
    if (!el) return;
    const { next, nextStart, nextEnd } = toggleWrap(
      value || "",
      el.selectionStart,
      el.selectionEnd,
      "`"
    );
    setValueKeepSelection(next, nextStart, nextEnd);
  };

  const handleCodeBlock = () => {
    const el = taRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;

    const before = (value || "").slice(0, start);
    const selected = (value || "").slice(start, end);
    const after = (value || "").slice(end);

    const wrap = "```\n" + (selected || "code") + "\n```";
    const next = before + wrap + after;

    const nextStart = start + 4; // sau ```\n
    const nextEnd = start + 4 + (selected || "code").length;

    setValueKeepSelection(next, nextStart, nextEnd);
  };

  const handleHR = () => {
    const el = taRef.current;
    if (!el) return;

    const { end } = getLineInfo(value || "", el.selectionStart);
    const before = (value || "").slice(0, end);
    const after = (value || "").slice(end);

    const insert = (before.endsWith("\n") ? "" : "\n") + "---\n";
    const next = before + insert + after;

    const nextPos = end + insert.length;
    setValueKeepSelection(next, nextPos, nextPos);
  };

  const handleLink = () => {
    const el = taRef.current;
    if (!el) return;

    const url = window.prompt("Nhập đường dẫn (URL):");
    if (!url) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;

    const selected = (value || "").slice(start, end).trim();
    const text = selected || "liên kết";

    const before = (value || "").slice(0, start);
    const after = (value || "").slice(end);

    const insert = `[${text}](${url})`;
    const next = before + insert + after;

    const nextStart = start + 1;
    const nextEnd = start + 1 + text.length;

    setValueKeepSelection(next, nextStart, nextEnd);
  };

  const handleImage = () => {
    const el = taRef.current;
    if (!el) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = String(e.target?.result || "");
        if (!url) return;

        const start = el.selectionStart;
        const before = (value || "").slice(0, start);
        const after = (value || "").slice(start);

        const insert = `![ảnh](${url})`;
        const next = before + insert + after;

        const nextPos = start + insert.length;
        setValueKeepSelection(next, nextPos, nextPos);
      };
      reader.readAsDataURL(file);
    };

    input.click();
  };

  // ✅ bỏ “nút sáng lên”: luôn 1 style cố định
  const toolbarBtnClass = () =>
    `relative inline-flex h-9 w-9 items-center justify-center rounded-md border text-xs transition-colors
     border-slate-700 bg-slate-800 text-slate-200 hover:border-blue-400`;

  const ToolBtn = ({
    tip,
    onClick,
    children,
  }: {
    tip: TipKey;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHoverTip(tip)}
      onMouseLeave={() => setHoverTip(null)}
      className={toolbarBtnClass()}
    >
      {children}

      {hoverTip === tip && (
        <span className="absolute left-1/2 top-[calc(100%+8px)] z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 shadow-lg">
          {TIP_TEXT[tip]}
          <span className="absolute left-1/2 -top-1.5 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-slate-700 bg-slate-950" />
        </span>
      )}
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-2">
        <ToolBtn tip="heading" onClick={() => handleHeading()}>
          <Heading size={16} />
        </ToolBtn>

        <div className="mx-1 h-9 w-px bg-slate-700" />

        <ToolBtn tip="bold" onClick={() => handleBold()}>
          <Bold size={16} />
        </ToolBtn>
        <ToolBtn tip="italic" onClick={() => handleItalic()}>
          <Italic size={16} />
        </ToolBtn>
        <ToolBtn tip="underline" onClick={() => handleUnderline()}>
          <Underline size={16} />
        </ToolBtn>

        <div className="mx-1 h-9 w-px bg-slate-700" />

        <ToolBtn tip="ul" onClick={() => handleUl()}>
          <List size={16} />
        </ToolBtn>
        <ToolBtn tip="ol" onClick={() => handleOl()}>
          <ListOrdered size={16} />
        </ToolBtn>

        <div className="mx-1 h-9 w-px bg-slate-700" />

        {/* Code: click => inline code, Shift+click => code block */}
        <ToolBtn
          tip="code"
          onClick={(e) => {
            if (e.shiftKey) handleCodeBlock();
            else handleInlineCode();
          }}
        >
          <Code size={16} />
        </ToolBtn>

        <ToolBtn tip="link" onClick={() => handleLink()}>
          <LinkIcon size={16} />
        </ToolBtn>

        <ToolBtn tip="image" onClick={() => handleImage()}>
          <ImageIcon size={16} />
        </ToolBtn>

        <ToolBtn tip="hr" onClick={() => handleHR()}>
          <Minus size={16} />
        </ToolBtn>
      </div>

      {/* 2 màn hình: trái nhập, phải preview */}
      <div className="grid grid-cols-2 gap-4">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={updateActiveFromSelection}
          onKeyUp={updateActiveFromSelection}
          onMouseUp={updateActiveFromSelection}
          className="min-h-[280px] w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Soạn nội dung ở đây..."
        />

        <div className="min-h-[280px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Mẹo: Bấm <b>Mã</b> để chèn <code>`code`</code>. Giữ <b>Shift</b> rồi bấm{" "}
        <b>Mã</b> để tạo khối mã <code>```...```</code>.
      </p>
    </div>
  );
}
