"use client";

import { useEffect, useState, use } from "react";
import { db } from "@/src/api/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import PathForm from "@/src/Component/Admin/Explore/PathForm";

export default function EditPathPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
        try {
            const snap = await getDoc(doc(db, "learning_paths", resolvedParams.id));
            if (snap.exists()) {
                setData({ id: snap.id, ...snap.data() });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetch();
  }, [resolvedParams.id]);

  if (loading) return <div className="p-10 text-center text-slate-400">Đang tải...</div>;
  if (!data) return <div className="p-10 text-center text-red-500">Không tìm thấy lộ trình!</div>;

  return (
    <div className="p-6 min-h-screen">
      <PathForm initialData={data} isEditing={true} />
    </div>
  );
}
