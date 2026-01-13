"use client";

import { useEffect, useState, use } from "react";
import { db } from "@/src/api/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import TopicForm from "@/src/Component/Admin/Explore/TopicForm";

export default function EditTopicPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
        try {
            const snap = await getDoc(doc(db, "topics", resolvedParams.id));
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
  if (!data) return <div className="p-10 text-center text-red-500">Không tìm thấy chủ đề!</div>;

  return (
    <div className="p-6 min-h-screen">
      <TopicForm initialData={data} isEditing={true} />
    </div>
  );
}
