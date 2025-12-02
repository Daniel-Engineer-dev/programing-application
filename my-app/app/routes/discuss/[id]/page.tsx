"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/src/api/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  orderBy,
  query,
  updateDoc,
  increment,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import {
  MessageSquare,
  Clock,
  User,
  Frown,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Edit2,
  MoreVertical,
  Trash2,
  AlertCircle,
} from "lucide-react";
import CommentForm from "@/src/Component/Discussion/CommentForm";
import { useAuthContext } from "@/src/userHook/context/authContext";

interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface DiscussionDetail {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  repliesCount: number;
  createdAt: string;
  authorName: string;
  authorUid: string;
  likesCount: number;
  dislikesCount: number;
  viewsCount: number;
  tags: string[];
  comments: Comment[];
}

type VoteType = "like" | "dislike" | null;

export default function DiscussionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { user } = useAuthContext();

  const [discussion, setDiscussion] = useState<DiscussionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // chặn gọi tăng view nhiều lần (StrictMode / re-render)
  const hasIncrementedViewRef = useRef(false);

  // menu & delete modal
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // vote state
  const [currentVote, setCurrentVote] = useState<VoteType>(null);

  // ====== LOAD DISCUSSION + COMMENTS + VIEWS ======
  useEffect(() => {
    if (!id) return;
    if (hasIncrementedViewRef.current) return;
    hasIncrementedViewRef.current = true;

    const fetchDiscussionDetail = async () => {
      try {
        const ref = doc(db, "discussions", id as string);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setDiscussion(null);
          return;
        }

        const data: any = snap.data();

        const commentsRef = collection(db, "discussions", id as string, "comments");
        const q = query(commentsRef, orderBy("createdAt", "asc"));
        const commentsSnap = await getDocs(q);

        const comments: Comment[] = commentsSnap.docs.map((d) => {
          const c: any = d.data();
          return {
            id: d.id,
            authorName: c.author?.name ?? "Ẩn danh",
            content: c.content,
            createdAt: c.createdAt ? c.createdAt.toDate().toLocaleString() : "",
          };
        });

        const currentViews = data.viewsCount ?? 0;

        const detail: DiscussionDetail = {
          id: snap.id,
          title: data.title,
          content: data.content,
          excerpt: data.excerpt,
          repliesCount: data.repliesCount ?? comments.length,
          createdAt: data.createdAt
            ? data.createdAt.toDate().toLocaleString()
            : "",
          authorName: data.author?.name ?? "Ẩn danh",
          authorUid: data.author?.uid ?? "",
          likesCount: data.likesCount ?? 0,
          dislikesCount: data.dislikesCount ?? 0,
          viewsCount: currentViews + 1, // hiển thị local
          tags: data.tags ?? [],
          comments,
        };

        setDiscussion(detail);

        await updateDoc(ref, {
          viewsCount: increment(1),
        });
      } catch (err) {
        console.error("Lỗi fetch discussion detail:", err);
        setDiscussion(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscussionDetail();
  }, [id]);

  // ====== LOAD USER VOTE (LIKE/DISLIKE) ======
  useEffect(() => {
    const fetchVote = async () => {
      if (!id || !user) {
        setCurrentVote(null);
        return;
      }
      try {
        const voteRef = doc(db, "discussions", id as string, "votes", user.uid);
        const voteSnap = await getDoc(voteRef);
        if (voteSnap.exists()) {
          const data: any = voteSnap.data();
          if (data.type === "like" || data.type === "dislike") {
            setCurrentVote(data.type);
          } else {
            setCurrentVote(null);
          }
        } else {
          setCurrentVote(null);
        }
      } catch (err) {
        console.error("Lỗi khi load vote:", err);
      }
    };

    fetchVote();
  }, [id, user]);

  // ====== VOTE HANDLER (LIKE/DISLIKE TOGGLE) ======
  const handleVote = async (type: "like" | "dislike") => {
    if (!discussion) return;
    if (!user) {
      alert("Bạn cần đăng nhập để bình chọn.");
      return;
    }

    const ref = doc(db, "discussions", discussion.id);
    const voteRef = doc(db, "discussions", discussion.id, "votes", user.uid);

    try {
      if (currentVote === type) {
        // Bấm lại cùng nút -> huỷ vote
        await updateDoc(ref, {
          ...(type === "like"
            ? { likesCount: increment(-1) }
            : { dislikesCount: increment(-1) }),
        });
        await deleteDoc(voteRef);

        setCurrentVote(null);
        setDiscussion((prev) =>
          prev
            ? {
                ...prev,
                likesCount: prev.likesCount - (type === "like" ? 1 : 0),
                dislikesCount: prev.dislikesCount - (type === "dislike" ? 1 : 0),
              }
            : prev
        );
      } else if (currentVote === null) {
        // Vote lần đầu
        await updateDoc(ref, {
          ...(type === "like"
            ? { likesCount: increment(1) }
            : { dislikesCount: increment(1) }),
        });
        await setDoc(voteRef, { type });

        setCurrentVote(type);
        setDiscussion((prev) =>
          prev
            ? {
                ...prev,
                likesCount: prev.likesCount + (type === "like" ? 1 : 0),
                dislikesCount: prev.dislikesCount + (type === "dislike" ? 1 : 0),
              }
            : prev
        );
      } else {
        // Đang like -> bấm dislike (hoặc ngược lại)
        const incLike = type === "like" ? 1 : -1;
        const incDislike = type === "dislike" ? 1 : -1;

        await updateDoc(ref, {
          likesCount: increment(incLike),
          dislikesCount: increment(incDislike),
        });
        await setDoc(voteRef, { type });

        setCurrentVote(type);
        setDiscussion((prev) =>
          prev
            ? {
                ...prev,
                likesCount: prev.likesCount + incLike,
                dislikesCount: prev.dislikesCount + incDislike,
              }
            : prev
        );
      }
    } catch (err) {
      console.error("Lỗi khi vote:", err);
    }
  };

  // ====== DELETE POST ======
  const handleDelete = async () => {
    if (!discussion) return;
    try {
      setDeleting(true);
      const ref = doc(db, "discussions", discussion.id);
      await deleteDoc(ref);
      setDeleting(false);
      setConfirmOpen(false);
      alert("Đã xoá bài đăng thành công.");
      router.push("/routes/discuss");
    } catch (err) {
      console.error("Lỗi khi xoá bài:", err);
      setDeleting(false);
      alert("Có lỗi xảy ra khi xoá bài. Vui lòng thử lại.");
    }
  };
 
  // ====== RELOAD COMMENTS AFTER ADDING ======
const reloadComments = async () => {
  if (!discussion) return;

  try {
    const commentsRef = collection(db, "discussions", discussion.id, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc"));
    const commentsSnap = await getDocs(q);

    const comments: Comment[] = commentsSnap.docs.map((d) => {
      const c: any = d.data();
      return {
        id: d.id,
        authorName: c.author?.name ?? "Ẩn danh",
        content: c.content,
        createdAt: c.createdAt ? c.createdAt.toDate().toLocaleString() : "",
      };
    });

    setDiscussion((prev) =>
      prev
        ? {
            ...prev,
            comments,
            repliesCount: comments.length,
          }
        : prev
    );
  } catch (err) {
    console.error("Lỗi khi reload comments:", err);
  }
};

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        Đang tải chủ đề...
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-6 text-white">
        <Frown size={48} className="mb-4 text-red-500" />
        <h1 className="mb-2 text-2xl font-bold">Không tìm thấy chủ đề</h1>
        <p className="text-slate-400">
          ID: không tồn tại hoặc đã bị xoá.
        </p>
        <Link
          href="/routes/discuss"
          className="mt-6 text-blue-400 underline hover:text-blue-300"
        >
          Quay lại Trang Thảo luận
        </Link>
      </div>
    );
  }

  const canEdit = user && discussion.authorUid === user.uid;
  const isLiked = currentVote === "like";
  const isDisliked = currentVote === "dislike";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <main className="relative mx-auto max-w-4xl space-y-10 px-6 py-12">
        {/* Header */}
        <header className="border-b border-slate-700 pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="mb-3 text-3xl font-bold text-white">
                {discussion.title}
              </h1>
              <p className="mb-4 text-slate-400">{discussion.excerpt}</p>

              {/* tags */}
              {discussion.tags.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {discussion.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400 border border-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <User size={16} />
                  {discussion.authorName}
                </span>
                <span className="flex items-center gap-2">
                  <Clock size={16} />
                  {discussion.createdAt}
                </span>
                <span className="flex items-center gap-2">
                  <MessageSquare size={16} />
                  {discussion.repliesCount} Phản hồi
                </span>
                <span className="flex items-center gap-2">
                  <Eye size={16} />
                  {discussion.viewsCount} lượt xem
                </span>
              </div>
            </div>

            {/* Menu 3 chấm: chỉ tác giả */}
            {canEdit && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-slate-200 hover:border-slate-400"
                >
                  <MoreVertical size={18} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-700 bg-slate-800 py-1 text-sm shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push(`/routes/discuss/${discussion.id}/edit`);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-200 hover:bg-slate-700"
                    >
                      <Edit2 size={14} /> Chỉnh sửa bài đăng
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmOpen(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-400 hover:bg-slate-700 hover:text-red-300"
                    >
                      <Trash2 size={14} /> Xoá bài đăng
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Votes */}
          <div className="mt-4 flex gap-3 text-sm">
            <button
              type="button"
              onClick={() => handleVote("like")}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 transition-colors ${
                isLiked
                  ? "border-blue-500 bg-blue-600/20 text-blue-300"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:border-blue-500 hover:text-blue-300"
              }`}
            >
              <ThumbsUp size={16} />
              <span>{discussion.likesCount}</span>
            </button>
            <button
              type="button"
              onClick={() => handleVote("dislike")}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 transition-colors ${
                isDisliked
                  ? "border-red-500 bg-red-600/20 text-red-300"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:border-red-500 hover:text-red-300"
              }`}
            >
              <ThumbsDown size={16} />
              <span>{discussion.dislikesCount}</span>
            </button>
          </div>
        </header>

   <section className="prose prose-invert max-w-none">
  {(() => {
    const raw = discussion.content || "";

    // Nếu là HTML (có dấu <) thì giữ nguyên
    const html = raw.includes("<")
      ? raw
      : raw.replace(/\n/g, "<br />");

    return (
      <div
        className="leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  })()}
</section>



        {/* Comments */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <MessageSquare size={20} /> Thảo luận ({discussion.comments.length})
          </h2>

          {discussion.comments.length === 0 ? (
            <p className="text-sm text-slate-500">
              Chưa có bình luận nào. Hãy là người đầu tiên!
            </p>
          ) : (
            <div className="space-y-4">
              {discussion.comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-slate-700 bg-slate-800/70 p-4"
                >
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-2">
                      <User size={14} /> {c.authorName}
                    </span>
                    <span>{c.createdAt}</span>
                  </div>
                  <p className="whitespace-pre-line text-sm text-slate-200">
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Form comment */}
     {/* Form comment */}
<CommentForm
  discussionId={discussion.id}
  onCommentAdded={reloadComments}
/>



        </section>

        {/* Modal xác nhận xoá */}
        {confirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-900/40 text-red-400">
                  <AlertCircle size={20} />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Bạn có chắc chắn?
                </h2>
              </div>
              <p className="mb-6 text-sm text-slate-300">
                Bạn có chắc chắn muốn xoá bài đăng này không? Hành động này
                không thể hoàn tác.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-600"
                  disabled={deleting}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-red-900"
                  disabled={deleting}
                >
                  {deleting ? "Đang xoá..." : "Xóa bài đăng"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
