import { NextResponse } from "next/server";
import { db } from "@/src/api/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    const topicsSnap = await getDocs(collection(db, "topics"));
    const pathsSnap = await getDocs(collection(db, "learning_paths"));
    const guidesSnap = await getDocs(collection(db, "guides"));

    const topics = topicsSnap.docs.map((d) => ({
      id: d.id,
      type: "topic",
      ...d.data(),
    }));
    const paths = pathsSnap.docs.map((d) => ({
      id: d.id,
      type: "path",
      ...d.data(),
    }));
    const guides = guidesSnap.docs.map((d) => ({
      id: d.id,
      type: "guide",
      ...d.data(),
    }));

    return NextResponse.json({
      topics,
      paths,
      guides,
    });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
