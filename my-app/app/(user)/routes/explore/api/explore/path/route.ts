import { NextResponse } from "next/server";
import { db } from "@/src/api/firebase/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    const snap = await getDocs(collection(db, "paths"));
    const paths = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ paths });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
