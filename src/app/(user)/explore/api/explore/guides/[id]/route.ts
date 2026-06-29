// app/api/explore/guides/[id]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { marked } from "marked";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const ref = doc(db, "guides", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    const guideData = snap.data();

    // 1. Chuyển đổi trường 'content' (Markdown từ Firebase) sang HTML an toàn
    const contentToParse = guideData.content || "";
    const formattedContent = formatMarkdownContent(contentToParse);
    const htmlContent = marked.parse(formattedContent);

    // 2. Trả về dữ liệu
    return NextResponse.json(
      {
        id: snap.id,
        ...guideData,
        htmlContent: htmlContent,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("API Error fetching guide:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

function formatMarkdownContent(content: string): string {
  if (!content) return "";
  return content.split('\n').map(line => {
    const trimmed = line.trim();
    
    // 1. Convert numbered titles to h3: "1. Bản chất" -> "### 1. Bản chất"
    const numberHeadingMatch = /^(\d+)\.\s+(.+)$/.exec(trimmed);
    if (numberHeadingMatch) {
      return `### ${trimmed}`;
    }
    
    // 2. Convert letter titles to h4: "A. Tìm kiếm" -> "#### A. Tìm kiếm"
    const letterHeadingMatch = /^([A-Z])\.\s+(.+)$/.exec(trimmed);
    if (letterHeadingMatch) {
      return `#### ${trimmed}`;
    }
    
    // 3. Bold definition terms: "Đỉnh (Vertex/Node): ..." -> "**Đỉnh (Vertex/Node):** ..."
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0 && !line.includes("http://") && !line.includes("https://")) {
      const firstPart = line.substring(0, colonIndex);
      const secondPart = line.substring(colonIndex + 1);
      
      // Check if it starts with bullet list markers like "- " or "* "
      const bulletMatch = /^([\s]*[-*]\s+)(.+)$/.exec(firstPart);
      if (bulletMatch) {
        const bulletPrefix = bulletMatch[1];
        const term = bulletMatch[2].trim();
        if (term.length > 0 && term.length < 40 && !term.includes("<")) {
          return `${bulletPrefix}**${term}:**${secondPart}`;
        }
      } else {
        const term = firstPart.trim();
        if (term.length > 0 && term.length < 40 && !term.includes("<")) {
          return `**${term}:**${secondPart}`;
        }
      }
    }
    
    return line;
  }).join('\n');
}
