"use client";

import ContestForm from "../../../../src/Component/Admin/ContestForm";
import { db } from "@/src/api/firebase/firebase";
import { setDoc, doc, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function NewContestPage() {
  const router = useRouter();

  const handleCreate = async (data: any) => {
    try {
      const { id, ...contestData } = data;
      
      // Use setDoc with custom ID if provided, otherwise fallback to auto-id (though form enforces ID)
      if (id) {
          await setDoc(doc(db, "contests", id), {
            ...contestData,
            createdAt: new Date().toISOString(),
            participants: 0 
          });
      } else {
          // Should not happen if validation works, but safe fallback
          const { addDoc } = await import("firebase/firestore"); // lazy load just in case
          await addDoc(collection(db, "contests"), {
            ...contestData,
            createdAt: new Date().toISOString(),
            participants: 0
          });
      }

      router.refresh(); // Force data revalidation
      router.push("/admin/contests");
    } catch (error) {
      console.error(error);
      alert("Failed to create contest");
    }
  };

  return <ContestForm onSubmit={handleCreate} isEdit={false} />;
}
