import { NextResponse } from "next/server";
import { db } from "@/src/api/firebase/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    const topicsSnap = await getDocs(collection(db, "topics"));
    const pathsSnap = await getDocs(collection(db, "learning_paths"));
    const guidesSnap = await getDocs(collection(db, "guides"));

    const topics = topicsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const learningPaths = pathsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    const guides = guidesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ topics, learningPaths, guides });
  } catch (err) {
    return NextResponse.json({ error: "Explore API error" }, { status: 500 });
  }
}
