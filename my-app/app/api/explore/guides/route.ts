// app/api/explore/guides/route.ts

import { NextResponse } from "next/server";
import { db } from "@/src/api/firebase/firebase";
import { collection, getDocs, query } from "firebase/firestore";

export async function GET() {
  try {
    // FIX: Loại bỏ orderBy và limit để đảm bảo fetch tất cả dữ liệu
    // mà không gây lỗi 500 do thiếu index hoặc lỗi dữ liệu.
    const q = query(
      collection(db, "guides")
      // Không dùng orderBy hay limit
    );

    const querySnapshot = await getDocs(q);

    const guidesList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // FIX: Trả về đúng cấu trúc (có key 'guides')
    return NextResponse.json({ guides: guidesList }, { status: 200 });
  } catch (err: any) {
    console.error("API Error fetching guides list:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
