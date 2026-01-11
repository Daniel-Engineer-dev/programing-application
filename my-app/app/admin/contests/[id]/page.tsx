"use client";

import ContestForm from "../../../../src/Component/Admin/ContestForm";
import { db } from "@/src/api/firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import React from "react";

export default function EditContestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [initialData, setInitialData] = useState<any>(null);
  
  // Unwrap params using React.use()
  const { id } = React.use(params);

  useEffect(() => {
    if (id) {
      getDoc(doc(db, "contests", id)).then(snap => {
        if (snap.exists()) {
            setInitialData({ ...snap.data(), id: snap.id });
        }
      });
    }
  }, [id]);

  const handleUpdate = async (data: any) => {
    try {
      await updateDoc(doc(db, "contests", id), data);
      router.refresh(); // Force data revalidation
      router.push("/admin/contests");
    } catch (error) {
      alert("Failed to update contest");
    }
  };

  if (!initialData) return <div className="p-12 text-center text-slate-500">Đang tải dữ liệu...</div>;

  return <ContestForm initialData={initialData} onSubmit={handleUpdate} isEdit={true} />;
}
