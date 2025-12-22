/** Escape HTML để preview an toàn hơn */
function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
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

/** Render markdown mini (đủ các chức năng toolbar) */
export function markdownToHtml(md: string) {
  // tách theo code block ```...```
  const parts = md.split("```");
  let html = "";

  for (let i = 0; i < parts.length; i++) {
    const chunk = parts[i];

    // odd index => code block
    if (i % 2 === 1) {
      html += `<pre class="rounded-lg border border-slate-700 bg-slate-950 p-3 overflow-auto"><code>${escapeHtml(
        chunk.trimEnd()
      )}</code></pre>`;
      continue;
    }

    // text bình thường
    const rawLines = chunk.split("\n");
    const out: string[] = [];

    let inUl = false;
    let inOl = false;

    const closeLists = () => {
      if (inUl) {
        out.push("</ul>");
        inUl = false;
      }
      if (inOl) {
        out.push("</ol>");
        inOl = false;
      }
    };

    for (const rawLine of rawLines) {
      const escapedLine = escapeHtml(rawLine);

      const trimmed = rawLine.trim();

      // HR: dòng chỉ có --- hoặc ***
      if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
        closeLists();
        out.push(`<hr class="my-3 border-slate-700" />`);
        continue;
      }

      // Heading: # ...
      const headingMatch = rawLine.match(/^#\s+(.*)$/);
      if (headingMatch) {
        closeLists();
        const title = formatInline(escapeHtml(headingMatch[1]));
        out.push(
          `<h2 class="mt-2 mb-2 text-xl font-bold text-white">${title}</h2>`
        );
        continue;
      }

      // Unordered: - item
      const ulMatch = rawLine.match(/^\s*-\s+(.*)$/);
      if (ulMatch) {
        if (inOl) {
          out.push("</ol>");
          inOl = false;
        }
        if (!inUl) {
          out.push(`<ul class="my-2 list-disc pl-6">`);
          inUl = true;
        }
        out.push(`<li>${formatInline(escapeHtml(ulMatch[1]))}</li>`);
        continue;
      }

      // Ordered: 1. item (hoặc 2. 3. ...)
      const olMatch = rawLine.match(/^\s*\d+\.\s+(.*)$/);
      if (olMatch) {
        if (inUl) {
          out.push("</ul>");
          inUl = false;
        }
        if (!inOl) {
          out.push(`<ol class="my-2 list-decimal pl-6">`);
          inOl = true;
        }
        out.push(`<li>${formatInline(escapeHtml(olMatch[1]))}</li>`);
        continue;
      }

      // dòng thường
      closeLists();

      // dòng trống
      if (trimmed === "") {
        out.push(`<div class="h-3"></div>`);
        continue;
      }

      out.push(`<p class="my-1">${formatInline(escapedLine)}</p>`);
    }

    closeLists();

    const block = out.join("");
    html += `<div class="text-slate-200">${block}</div>`;
  }

  return html.trim() || `<em class="text-slate-400">Xem trước nội dung…</em>`;
}
