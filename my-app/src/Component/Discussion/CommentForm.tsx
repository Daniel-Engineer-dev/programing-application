"use client";

import { useState } from "react";
import { db } from "@/src/api/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
  increment,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

import { useAuthContext } from "@/src/userHook/context/authContext"; // ✅ ĐÚNG 100%



interface CommentFormProps {
  discussionId: string;
  onCommentAdded?: () => void;
}


export default function CommentForm({
  discussionId,
  onCommentAdded,
}: CommentFormProps) {

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // LẤY USER + USERNAME TỪ AUTH CONTEXT
  const { user, username } = useAuthContext(); // ✅ ĐÚNG 100%

  // 🔒 CHƯA LOGIN -> KHÔNG CHO COMMENT
  if (!user) {
    return (
      <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/70 p-4 text-sm text-slate-300">
        <p>
          Bạn cần{" "}
          <a
            href="/routes/auth/login"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            đăng nhập
          </a>{" "}
          để tham gia bình luận.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Nội dung bình luận không được để trống.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await addDoc(
        collection(db, "discussions", discussionId, "comments"),
        {
          content: content.trim(),
          createdAt: serverTimestamp(),
          author: {
            uid: user.uid,
            name: username || user.displayName || user.email || "Người dùng",
            avatarUrl: user.photoURL || null,
          },
        }
      );

      // tăng số lượng comment
      await updateDoc(doc(db, "discussions", discussionId), {
        repliesCount: increment(1),
      });

      setContent("");
      if (onCommentAdded) onCommentAdded();
      router.refresh(); // refresh server component
    } catch (err) {
      console.error("Lỗi khi gửi comment:", err);
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        placeholder="Viết bình luận của bạn..."
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition-colors"
      >
        {loading ? "Đang gửi..." : "Gửi bình luận"}
      </button>
    </form>
  );
}
