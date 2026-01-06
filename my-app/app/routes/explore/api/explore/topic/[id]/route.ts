import { NextResponse } from "next/server";
import { db } from "@/src/api/firebase/firebase";
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
    const htmlContent = marked.parse(topicData.content || "");

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
