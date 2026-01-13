import { db } from "@/src/api/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

export interface Problem {
  id: string;
  title: string;
  problemID: string;
}

export interface ContestDetail {
  id: string;
  title: string;
  status: string;
  participants: number;
  time: string;
  description: string;
  problems: Problem[];
  length: number;
  startTime?: any;
  startAt?: any;
}

export async function fetchContestDetailsServer(
  contestId: string
): Promise<ContestDetail | null> {
  if (!contestId) return null;
  try {
    const contestRef = doc(db, "contests", contestId);
    const contestDoc = await getDoc(contestRef);

    if (!contestDoc.exists()) return null;

    const data = contestDoc.data();
    return {
      id: contestDoc.id,
      title: data.title,
      status: data.status,
      participants: data.participants,
      time: data.time,
      description: data.description,
      problems: Array.isArray(data.problems) ? data.problems : [],
      length: data.length,
    } as ContestDetail;
  } catch (error) {
    console.error("Error fetching contest:", error);
    return null;
  }
}
