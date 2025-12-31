import { NextResponse } from "next/server";
import { db } from "@/src/api/firebase/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  documentId,
} from "firebase/firestore";

export async function GET(req: Request, context: { params: { id: string } }) {
  try {
    // FIX LỖI PROMISE
    const { id } = await context.params;

    if (!id)
      return NextResponse.json({ error: "Missing Path ID" }, { status: 400 });

    // SỬ DỤNG COLLECTION CHÍNH XÁC: "learning_paths"
    const pathRef = doc(db, "learning_paths", id);
    const pathSnap = await getDoc(pathRef);

    if (!pathSnap.exists()) {
      return NextResponse.json({ error: "Path not found" }, { status: 404 });
    }

    const pathData = pathSnap.data();
    const lessons = pathData.lessons || [];
    const topicIds = lessons.map((lesson: any) => lesson.ref).filter(Boolean);

    let detailedLessons = lessons;

    if (topicIds.length > 0) {
      // Truy vấn chi tiết Topics dựa trên ref (tối đa 10 ID)
      const topicsQuery = query(
        collection(db, "topics"),
        where(documentId(), "in", topicIds.slice(0, 10))
      );
      const topicsSnap = await getDocs(topicsQuery);

      const topicsMap = new Map();
      topicsSnap.docs.forEach((doc) => {
        topicsMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

      // Hợp nhất dữ liệu
      detailedLessons = lessons.map((lesson: any) => {
        const topicDetail = topicsMap.get(lesson.ref);
        if (topicDetail) {
          return {
            ...lesson,
            desc: topicDetail.desc,
            icon: topicDetail.icon,
            level: topicDetail.level,
            id: topicDetail.id,
          };
        }
        return lesson;
      });
    }

    return NextResponse.json(
      {
        id: pathSnap.id,
        ...pathData,
        lessons: detailedLessons, // Trả về danh sách bài học đã được làm giàu
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("API Error fetching path:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
