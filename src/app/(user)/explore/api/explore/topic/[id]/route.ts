import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { marked } from "marked"; // Thư viện xử lý Markdown (cần npm install marked)

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    // FIX LỖI PROMISE
    const { id } = await context.params;

    if (!id)
      return NextResponse.json({ error: "Missing Topic ID" }, { status: 400 });

    const ref = doc(db, "topics", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return NextResponse.json(
        { error: "Topic not found in Firestore" },
        { status: 404 }
      );
    }

    const topicData = snap.data();

    // Xử lý Markdown sang HTML cho nội dung chi tiết
    const content = topicData.content || "";
    const formattedContent = formatMarkdownContent(content);
    const htmlContent = marked.parse(formattedContent);

    return NextResponse.json(
      {
        id: snap.id,
        ...topicData,
        htmlContent: htmlContent, // Trường mới cho Client
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("API Error fetching topic:", err);
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

