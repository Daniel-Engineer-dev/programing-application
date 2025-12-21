// app/api/explore/guides/[id]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/src/api/firebase";
import { doc, getDoc } from "firebase/firestore";
import { marked } from "marked";

export async function GET(req: Request, context: { params: { id: string } }) {
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
    const htmlContent = marked.parse(contentToParse);

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
