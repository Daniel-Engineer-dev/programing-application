"use client";
import { markdownToHtml } from "@/src/Component/Discussion/Markdown";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/src/api/firebase";
import { useAuthContext } from "@/src/userHook/context/authContext";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  writeBatch,
  setDoc,
} from "firebase/firestore";

import {
  ArrowLeft,
  MessageSquare,
  Clock,
  User,
  Frown,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  Flag,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";

type VoteType = "like" | "dislike" | null;
type SortKey = "BEST" | "MOST_VOTES" | "NEWEST";

interface CommentItem {
  id: string;
  parentId: string | null;
  authorUid: string;
  authorName: string;
  content: string;
  createdAt: string;
  createdAtTs?: any;
  updatedAt?: string;
  likesCount: number;
  dislikesCount: number;
  repliesCount: number; // số reply của comment cha
}

interface DiscussionDetail {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  repliesCount: number; // ✅ CHỈ tính bình luận cha
  createdAt: string;
  authorName: string;
  authorUid: string;
  likesCount: number;
  dislikesCount: number;
  viewsCount: number;
  tags: string[];
}

/** Escape HTML */
function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** Auto-link URL http/https */
function linkifyTextToHtml(text: string) {
  const safe = escapeHtml(text);
  const withBr = safe.replace(/\n/g, "<br />");
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  return withBr.replace(
    urlRegex,
    (url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline hover:text-blue-300">${url}</a>`
  );
}

export default function DiscussionDetailPage() {
  const params = useParams<{ id: string }>();
  const discussionId = params.id;
  const router = useRouter();
  const { user } = useAuthContext();

  const [discussion, setDiscussion] = useState<DiscussionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const hasIncrementedViewRef = useRef(false);

  // ✅ menu 3 chấm cho bài đăng
  const [postMenuOpen, setPostMenuOpen] = useState(false);

  // vote bài
  const [currentVote, setCurrentVote] = useState<VoteType>(null);

  // ====== REPORT BÀI ======
  const [reportPostOpen, setReportPostOpen] = useState(false);
  const [reportPostSelected, setReportPostSelected] = useState<string[]>([]);
  const [reportPostOther, setReportPostOther] = useState("");
  const [reportPostSubmitting, setReportPostSubmitting] = useState(false);
  const [reportPostSuccessOpen, setReportPostSuccessOpen] = useState(false);

  // ====== COMMENT STATE ======
  const PAGE_SIZE = 5;
  const REPLIES_PREVIEW = 3;

  const [sortKey, setSortKey] = useState<SortKey>("BEST");
  const [sortOpen, setSortOpen] = useState(false);

  const [parentDocs, setParentDocs] = useState<CommentItem[]>([]);
  const [repliesMap, setRepliesMap] = useState<Record<string, CommentItem[]>>({});
  const [repliesLastDocMap, setRepliesLastDocMap] = useState<Record<string, any>>({});
  const [loadingRepliesMap, setLoadingRepliesMap] = useState<Record<string, boolean>>({});

  const [commentVoteMap, setCommentVoteMap] = useState<Record<string, VoteType>>({});

  const [newCommentText, setNewCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [postingReply, setPostingReply] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // xoá modal (bài)
  const [confirmPostDeleteOpen, setConfirmPostDeleteOpen] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);

  // xoá modal (comment)
  const [confirmCommentDeleteOpen, setConfirmCommentDeleteOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{ id: string; parentId: string | null } | null>(null);
  const [deletingComment, setDeletingComment] = useState(false);

  // ====== REPORT COMMENT ======
  const [reportCommentOpen, setReportCommentOpen] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportCommentSelected, setReportCommentSelected] = useState<string[]>([]);
  const [reportCommentOther, setReportCommentOther] = useState("");
  const [reportCommentSubmitting, setReportCommentSubmitting] = useState(false);
  const [reportCommentSuccessOpen, setReportCommentSuccessOpen] = useState(false);

  const REPORT_REASONS = [
    "Quảng cáo / Spam",
    "Nội dung khiêu dâm",
    "Nội dung bạo lực",
    "Kích động thù hằn / khủng bố",
    "Nội dung bất hợp pháp",
    "Lăng mạ / quấy rối người khác",
    "Nội dung không phù hợp",
    "Khác",
  ];

  const canEditPost = user && discussion && discussion.authorUid === user.uid;
  const canReportPost = user && discussion && discussion.authorUid !== user.uid;

  // =========================
  // ✅ SYNC repliesCount = tổng comment CHA hiện có (tất cả trang)
  // + cập nhật field discussions.repliesCount để ngoài trang thảo luận đồng bộ luôn
  // =========================
  const syncPostParentCount = async (did: string) => {
    const commentsCol = collection(db, "discussions", did, "comments");
    const countQ = query(commentsCol, where("parentId", "==", null));
    const countSnap = await getCountFromServer(countQ);
    const parentCount = countSnap.data().count ?? 0;

    setDiscussion((p) => (p ? { ...p, repliesCount: parentCount } : p));

    // update vào doc để trang list (ngoài discuss) lấy đúng
    await updateDoc(doc(db, "discussions", did), { repliesCount: parentCount }).catch(() => {});
    return parentCount;
  };

  // =========================
  // LOAD DISCUSSION + VIEW
  // =========================
  useEffect(() => {
    if (!discussionId) return;
    if (hasIncrementedViewRef.current) return;
    hasIncrementedViewRef.current = true;

    const run = async () => {
      try {
        const ref = doc(db, "discussions", discussionId as string);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setDiscussion(null);
          setLoading(false);
          return;
        }

        const data: any = snap.data();
        const currentViews = data.viewsCount ?? 0;

        setDiscussion({
          id: snap.id,
          title: data.title ?? "(Không có tiêu đề)",
          content: data.content ?? "",
          excerpt: data.excerpt ?? "",
          repliesCount: data.repliesCount ?? 0, // sẽ sync lại ngay dưới
          createdAt: data.createdAt ? data.createdAt.toDate().toLocaleString() : "",
          authorName: data.author?.name ?? "Ẩn danh",
          authorUid: data.author?.uid ?? "",
          likesCount: data.likesCount ?? 0,
          dislikesCount: data.dislikesCount ?? 0,
          viewsCount: currentViews + 1,
          tags: data.tags ?? [],
        });

        await updateDoc(ref, { viewsCount: increment(1) });

        // ✅ đồng bộ repliesCount theo tổng comment cha hiện có
        await syncPostParentCount(snap.id);
      } catch (e) {
        console.error("Lỗi tải bài:", e);
        setDiscussion(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [discussionId]);

  // =========================
  // LOAD POST VOTE
  // =========================
  useEffect(() => {
    const run = async () => {
      if (!discussionId || !user) {
        setCurrentVote(null);
        return;
      }
      try {
        const voteRef = doc(db, "discussions", discussionId as string, "votes", user.uid);
        const voteSnap = await getDoc(voteRef);
        if (voteSnap.exists()) {
          const v: any = voteSnap.data();
          setCurrentVote(v.type === "like" || v.type === "dislike" ? v.type : null);
        } else {
          setCurrentVote(null);
        }
      } catch (e) {
        console.error("Lỗi tải vote bài:", e);
      }
    };
    run();
  }, [discussionId, user]);

  // =========================
  // POST VOTE HANDLER
  // =========================
  const handleVotePost = async (type: "like" | "dislike") => {
    if (!discussion) return;
    if (!user) {
      alert("Bạn cần đăng nhập để bình chọn.");
      return;
    }

    const postRef = doc(db, "discussions", discussion.id);
    const voteRef = doc(db, "discussions", discussion.id, "votes", user.uid);

    try {
      if (currentVote === type) {
        await updateDoc(postRef, {
          ...(type === "like" ? { likesCount: increment(-1) } : { dislikesCount: increment(-1) }),
        });
        await deleteDoc(voteRef);

        setCurrentVote(null);
        setDiscussion((p) =>
          p
            ? {
                ...p,
                likesCount: p.likesCount - (type === "like" ? 1 : 0),
                dislikesCount: p.dislikesCount - (type === "dislike" ? 1 : 0),
              }
            : p
        );
        return;
      }

      if (currentVote === null) {
        await updateDoc(postRef, {
          ...(type === "like" ? { likesCount: increment(1) } : { dislikesCount: increment(1) }),
        });
        await setDoc(voteRef, { type });

        setCurrentVote(type);
        setDiscussion((p) =>
          p
            ? {
                ...p,
                likesCount: p.likesCount + (type === "like" ? 1 : 0),
                dislikesCount: p.dislikesCount + (type === "dislike" ? 1 : 0),
              }
            : p
        );
        return;
      }

      const incLike = type === "like" ? 1 : -1;
      const incDislike = type === "dislike" ? 1 : -1;

      await updateDoc(postRef, { likesCount: increment(incLike), dislikesCount: increment(incDislike) });
      await setDoc(voteRef, { type });

      setCurrentVote(type);
      setDiscussion((p) => (p ? { ...p, likesCount: p.likesCount + incLike, dislikesCount: p.dislikesCount + incDislike } : p));
    } catch (e) {
      console.error("Lỗi vote bài:", e);
    }
  };

  // =========================
  // DELETE POST
  // =========================
  const handleDeletePost = async () => {
    if (!discussion) return;
    try {
      setDeletingPost(true);
      await deleteDoc(doc(db, "discussions", discussion.id));
      alert("Đã xoá bài đăng.");
      router.push("/routes/discuss");
    } catch (e) {
      console.error("Lỗi xoá bài:", e);
      alert("Có lỗi khi xoá bài. Vui lòng thử lại.");
    } finally {
      setDeletingPost(false);
      setConfirmPostDeleteOpen(false);
    }
  };

  // =========================
  // LOAD PARENT COMMENTS
  // =========================
  const [parentPage, setParentPage] = useState(1);

  const fetchParentPage = async (page: number) => {
    if (!discussionId) return;

    setParentDocs([]);
    setRepliesMap({});
    setRepliesLastDocMap({});
    setLoadingRepliesMap({});

    const order = "desc";

    try {
      let last: any = null;
      let parents: any[] = [];

      for (let p = 1; p <= page; p++) {
        const base = collection(db, "discussions", discussionId as string, "comments");
        let qParent = query(base, where("parentId", "==", null), orderBy("createdAt", order as any), limit(PAGE_SIZE));
        if (last) qParent = query(qParent, startAfter(last));

        const snap = await getDocs(qParent);
        if (snap.empty) {
          parents = [];
          last = null;
          break;
        }
        parents = snap.docs;
        last = snap.docs[snap.docs.length - 1];
      }

      const mapped: CommentItem[] = parents.map((d) => {
        const c: any = d.data();
        return {
          id: d.id,
          parentId: c.parentId ?? null,
          authorUid: c.author?.uid ?? "",
          authorName: c.author?.name ?? "Ẩn danh",
          content: c.content ?? "",
          createdAt: c.createdAt ? c.createdAt.toDate().toLocaleString() : "",
          createdAtTs: c.createdAt ?? null,
          updatedAt: c.updatedAt ? c.updatedAt.toDate().toLocaleString() : undefined,
          likesCount: c.likesCount ?? 0,
          dislikesCount: c.dislikesCount ?? 0,
          repliesCount: c.repliesCount ?? 0,
        };
      });

      setParentDocs(mapped);

      for (const parent of mapped) {
        await fetchRepliesPreview(parent.id);
        await fetchUserVoteForComment(parent.id);
      }
    } catch (e) {
      console.error("Lỗi tải bình luận:", e);
    }
  };

  useEffect(() => {
    if (!discussionId) return;
    fetchParentPage(parentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discussionId, sortKey, parentPage]);

  // =========================
  // LOAD REPLIES PREVIEW
  // =========================
  const fetchRepliesPreview = async (parentId: string) => {
    if (!discussionId) return;
    setLoadingRepliesMap((p) => ({ ...p, [parentId]: true }));

    try {
      const base = collection(db, "discussions", discussionId as string, "comments");
      const qReplies = query(base, where("parentId", "==", parentId), orderBy("createdAt", "asc"), limit(REPLIES_PREVIEW));
      const snap = await getDocs(qReplies);

      const mapped: CommentItem[] = snap.docs.map((d) => {
        const c: any = d.data();
        return {
          id: d.id,
          parentId: c.parentId ?? parentId,
          authorUid: c.author?.uid ?? "",
          authorName: c.author?.name ?? "Ẩn danh",
          content: c.content ?? "",
          createdAt: c.createdAt ? c.createdAt.toDate().toLocaleString() : "",
          createdAtTs: c.createdAt ?? null,
          updatedAt: c.updatedAt ? c.updatedAt.toDate().toLocaleString() : undefined,
          likesCount: c.likesCount ?? 0,
          dislikesCount: c.dislikesCount ?? 0,
          repliesCount: c.repliesCount ?? 0,
        };
      });

      const last = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;

      setRepliesMap((p) => ({ ...p, [parentId]: mapped }));
      setRepliesLastDocMap((p) => ({ ...p, [parentId]: last }));

      for (const r of mapped) await fetchUserVoteForComment(r.id);
    } catch (e) {
      console.error("Lỗi tải phản hồi:", e);
    } finally {
      setLoadingRepliesMap((p) => ({ ...p, [parentId]: false }));
    }
  };

  // =========================
  // LOAD MORE REPLIES
  // =========================
  const handleLoadMoreReplies = async (parentId: string) => {
    if (!discussionId) return;

    const last = repliesLastDocMap[parentId];
    if (!last) return;

    setLoadingRepliesMap((p) => ({ ...p, [parentId]: true }));
    try {
      const base = collection(db, "discussions", discussionId as string, "comments");
      const qMore = query(base, where("parentId", "==", parentId), orderBy("createdAt", "asc"), startAfter(last), limit(REPLIES_PREVIEW));
      const snap = await getDocs(qMore);

      const mapped: CommentItem[] = snap.docs.map((d) => {
        const c: any = d.data();
        return {
          id: d.id,
          parentId: c.parentId ?? parentId,
          authorUid: c.author?.uid ?? "",
          authorName: c.author?.name ?? "Ẩn danh",
          content: c.content ?? "",
          createdAt: c.createdAt ? c.createdAt.toDate().toLocaleString() : "",
          createdAtTs: c.createdAt ?? null,
          updatedAt: c.updatedAt ? c.updatedAt.toDate().toLocaleString() : undefined,
          likesCount: c.likesCount ?? 0,
          dislikesCount: c.dislikesCount ?? 0,
          repliesCount: c.repliesCount ?? 0,
        };
      });

      const newLast = snap.docs.length ? snap.docs[snap.docs.length - 1] : last;

      setRepliesMap((p) => ({ ...p, [parentId]: [...(p[parentId] ?? []), ...mapped] }));
      setRepliesLastDocMap((p) => ({ ...p, [parentId]: newLast }));

      for (const r of mapped) await fetchUserVoteForComment(r.id);
    } catch (e) {
      console.error("Lỗi tải thêm phản hồi:", e);
    } finally {
      setLoadingRepliesMap((p) => ({ ...p, [parentId]: false }));
    }
  };

  // =========================
  // CLIENT SORT (BEST / MOST_VOTES)
  // =========================
  const sortedParents = useMemo(() => {
    const arr = [...parentDocs];

    const score = (c: CommentItem) => (c.likesCount ?? 0) - (c.dislikesCount ?? 0);
    const votes = (c: CommentItem) => (c.likesCount ?? 0) + (c.dislikesCount ?? 0);

    if (sortKey === "BEST") {
      return arr.sort((a, b) => {
        const sa = score(a);
        const sb = score(b);
        if (sb !== sa) return sb - sa;
        const ta = a.createdAtTs?.toMillis?.() ?? 0;
        const tb = b.createdAtTs?.toMillis?.() ?? 0;
        return tb - ta;
      });
    }

    if (sortKey === "MOST_VOTES") {
      return arr.sort((a, b) => {
        const va = votes(a);
        const vb = votes(b);
        if (vb !== va) return vb - va;
        const ta = a.createdAtTs?.toMillis?.() ?? 0;
        const tb = b.createdAtTs?.toMillis?.() ?? 0;
        return tb - ta;
      });
    }

    // NEWEST: đã query desc rồi
    return arr;
  }, [parentDocs, sortKey]);

  // =========================
  // COMMENT CREATE (PARENT) + ✅ đồng bộ repliesCount của bài (chỉ tính comment cha)
  // =========================
  const handleCreateComment = async () => {
    if (!discussionId) return;
    if (!user) {
      alert("Bạn cần đăng nhập để bình luận.");
      return;
    }
    if (!newCommentText.trim()) {
      alert("Vui lòng nhập nội dung bình luận.");
      return;
    }

    try {
      setPostingComment(true);

      const base = collection(db, "discussions", discussionId as string, "comments");
      await addDoc(base, {
        parentId: null,
        content: newCommentText.trim(),
        createdAt: serverTimestamp(),
        updatedAt: null,
        likesCount: 0,
        dislikesCount: 0,
        repliesCount: 0,
        author: {
          uid: user.uid,
          name: user.displayName || user.email || "Người dùng",
        },
      });

      // ✅ tăng repliesCount của BÀI (chỉ tính comment cha)
      await updateDoc(doc(db, "discussions", discussionId as string), {
        repliesCount: increment(1),
      });
      setDiscussion((p) => (p ? { ...p, repliesCount: p.repliesCount + 1 } : p));

      setNewCommentText("");
      setParentPage(1);
      await fetchParentPage(1);
    } catch (e) {
      console.error("Lỗi tạo bình luận:", e);
      alert("Có lỗi khi đăng bình luận. Vui lòng thử lại.");
    } finally {
      setPostingComment(false);
    }
  };

  // =========================
  // REPLY CREATE (KHÔNG tính vào repliesCount của bài)
  // =========================
  const handleCreateReply = async (parentId: string) => {
    if (!discussionId) return;
    if (!user) {
      alert("Bạn cần đăng nhập để trả lời.");
      return;
    }
    if (!replyText.trim()) {
      alert("Vui lòng nhập nội dung trả lời.");
      return;
    }

    try {
      setPostingReply(true);

      const base = collection(db, "discussions", discussionId as string, "comments");
      const parentRef = doc(db, "discussions", discussionId as string, "comments", parentId);

      await addDoc(base, {
        parentId,
        content: replyText.trim(),
        createdAt: serverTimestamp(),
        updatedAt: null,
        likesCount: 0,
        dislikesCount: 0,
        repliesCount: 0,
        author: {
          uid: user.uid,
          name: user.displayName || user.email || "Người dùng",
        },
      });

      await updateDoc(parentRef, { repliesCount: increment(1) });

      setReplyText("");
      setReplyingTo(null);

      await fetchRepliesPreview(parentId);
      await fetchParentPage(parentPage);
    } catch (e) {
      console.error("Lỗi trả lời:", e);
      alert("Có lỗi khi gửi trả lời. Vui lòng thử lại.");
    } finally {
      setPostingReply(false);
    }
  };

  // =========================
  // EDIT COMMENT
  // =========================
  const handleStartEdit = (c: CommentItem) => {
    setEditingId(c.id);
    setEditingText(c.content);
    setReplyingTo(null);
  };

  const handleSaveEdit = async () => {
    if (!discussionId || !editingId) return;
    if (!user) {
      alert("Bạn cần đăng nhập.");
      return;
    }
    if (!editingText.trim()) {
      alert("Nội dung không được để trống.");
      return;
    }

    try {
      setSavingEdit(true);
      const ref = doc(db, "discussions", discussionId as string, "comments", editingId);
      await updateDoc(ref, { content: editingText.trim(), updatedAt: serverTimestamp() });

      setEditingId(null);
      setEditingText("");

      await fetchParentPage(parentPage);
      for (const pid of Object.keys(repliesMap)) await fetchRepliesPreview(pid);
    } catch (e) {
      console.error("Lỗi chỉnh sửa:", e);
      alert("Có lỗi khi chỉnh sửa. Vui lòng thử lại.");
    } finally {
      setSavingEdit(false);
    }
  };

  // =========================
  // DELETE COMMENT (XOÁ THẬT)
  // ✅ nếu xoá comment cha: giảm repliesCount của bài -1 (chỉ tính comment cha)
  // =========================
  const openDeleteComment = (id: string, parentId: string | null) => {
    setCommentToDelete({ id, parentId });
    setConfirmCommentDeleteOpen(true);
  };

  const handleDeleteComment = async () => {
    if (!discussionId || !commentToDelete) return;
    if (!user) {
      alert("Bạn cần đăng nhập.");
      return;
    }

    const { id, parentId } = commentToDelete;

    try {
      setDeletingComment(true);

      const batch = writeBatch(db);

      if (parentId === null) {
        // xoá comment cha -> xoá replies
        const base = collection(db, "discussions", discussionId as string, "comments");
        const qReplies = query(base, where("parentId", "==", id));
        const snap = await getDocs(qReplies);
        snap.docs.forEach((d) => batch.delete(d.ref));

        // ✅ giảm repliesCount của bài (chỉ tính comment cha)
        batch.update(doc(db, "discussions", discussionId as string), {
          repliesCount: increment(-1),
        });
      } else {
        // xoá reply -> giảm repliesCount của parent
        const parentRef = doc(db, "discussions", discussionId as string, "comments", parentId);
        batch.update(parentRef, { repliesCount: increment(-1) });
      }

      const ref = doc(db, "discussions", discussionId as string, "comments", id);
      batch.delete(ref);

      await batch.commit();

      setConfirmCommentDeleteOpen(false);
      setCommentToDelete(null);

      // ✅ cập nhật UI repliesCount của bài ngay
      if (parentId === null) {
        setDiscussion((p) => (p ? { ...p, repliesCount: Math.max(0, p.repliesCount - 1) } : p));
      }

      await fetchParentPage(parentPage);
      if (parentId) await fetchRepliesPreview(parentId);
    } catch (e) {
      console.error("Lỗi xoá bình luận:", e);
      alert("Có lỗi khi xoá bình luận. Vui lòng thử lại.");
    } finally {
      setDeletingComment(false);
    }
  };

  // =========================
  // COMMENT VOTE
  // =========================
  const fetchUserVoteForComment = async (commentId: string) => {
    if (!discussionId || !user) return;
    try {
      const ref = doc(db, "discussions", discussionId as string, "comments", commentId, "votes", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const v: any = snap.data();
        setCommentVoteMap((p) => ({ ...p, [commentId]: v.type === "like" || v.type === "dislike" ? v.type : null }));
      } else {
        setCommentVoteMap((p) => ({ ...p, [commentId]: null }));
      }
    } catch (e) {
      console.error("Lỗi tải vote comment:", e);
    }
  };

  const handleVoteComment = async (commentId: string, type: "like" | "dislike", parentIdForRefresh?: string) => {
    if (!discussionId) return;
    if (!user) {
      alert("Bạn cần đăng nhập để bình chọn.");
      return;
    }

    const commentRef = doc(db, "discussions", discussionId as string, "comments", commentId);
    const voteRef = doc(db, "discussions", discussionId as string, "comments", commentId, "votes", user.uid);

    const current = commentVoteMap[commentId] ?? null;

    try {
      if (current === type) {
        await updateDoc(commentRef, {
          ...(type === "like" ? { likesCount: increment(-1) } : { dislikesCount: increment(-1) }),
        });
        await deleteDoc(voteRef);
        setCommentVoteMap((p) => ({ ...p, [commentId]: null }));
      } else if (current === null) {
        await updateDoc(commentRef, {
          ...(type === "like" ? { likesCount: increment(1) } : { dislikesCount: increment(1) }),
        });
        await setDoc(voteRef, { type });
        setCommentVoteMap((p) => ({ ...p, [commentId]: type }));
      } else {
        const incLike = type === "like" ? 1 : -1;
        const incDislike = type === "dislike" ? 1 : -1;
        await updateDoc(commentRef, { likesCount: increment(incLike), dislikesCount: increment(incDislike) });
        await setDoc(voteRef, { type });
        setCommentVoteMap((p) => ({ ...p, [commentId]: type }));
      }

      await fetchParentPage(parentPage);
      if (parentIdForRefresh) await fetchRepliesPreview(parentIdForRefresh);
    } catch (e) {
      console.error("Lỗi vote comment:", e);
    }
  };

  // =========================
  // REPORT HELPERS
  // =========================
  const toggleReason = (arr: string[], reason: string) => (arr.includes(reason) ? arr.filter((x) => x !== reason) : [...arr, reason]);

  const submitReportPost = async () => {
    if (!discussionId || !discussion) return;
    if (!user) return alert("Bạn cần đăng nhập để báo cáo.");
    if (reportPostSelected.length === 0) return alert("Vui lòng chọn ít nhất 1 lý do báo cáo.");
    if (reportPostSelected.includes("Khác") && !reportPostOther.trim()) return alert("Vui lòng nhập nội dung cho mục 'Khác'.");

    try {
      setReportPostSubmitting(true);
      await addDoc(collection(db, "discussions", discussionId as string, "reports"), {
        reasons: reportPostSelected,
        details: reportPostSelected.includes("Khác") ? reportPostOther.trim() : "",
        reporter: { uid: user.uid, name: user.displayName || user.email || "Người dùng" },
        createdAt: serverTimestamp(),
      });

      setReportPostOpen(false);
      setReportPostSelected([]);
      setReportPostOther("");
      setReportPostSuccessOpen(true);
    } catch (e) {
      console.error("Lỗi báo cáo bài:", e);
      alert("Có lỗi khi báo cáo. Vui lòng thử lại.");
    } finally {
      setReportPostSubmitting(false);
    }
  };

  const openReportComment = (commentId: string) => {
    setReportingCommentId(commentId);
    setReportCommentSelected([]);
    setReportCommentOther("");
    setReportCommentOpen(true);
  };

  const submitReportComment = async () => {
    if (!discussionId || !reportingCommentId) return;
    if (!user) return alert("Bạn cần đăng nhập để báo cáo.");
    if (reportCommentSelected.length === 0) return alert("Vui lòng chọn ít nhất 1 lý do báo cáo.");
    if (reportCommentSelected.includes("Khác") && !reportCommentOther.trim()) return alert("Vui lòng nhập nội dung cho mục 'Khác'.");

    try {
      setReportCommentSubmitting(true);
      await addDoc(collection(db, "discussions", discussionId as string, "comments", reportingCommentId, "reports"), {
        reasons: reportCommentSelected,
        details: reportCommentSelected.includes("Khác") ? reportCommentOther.trim() : "",
        reporter: { uid: user.uid, name: user.displayName || user.email || "Người dùng" },
        createdAt: serverTimestamp(),
      });

      setReportCommentOpen(false);
      setReportingCommentId(null);
      setReportCommentSelected([]);
      setReportCommentOther("");
      setReportCommentSuccessOpen(true);
    } catch (e) {
      console.error("Lỗi báo cáo bình luận:", e);
      alert("Có lỗi khi báo cáo. Vui lòng thử lại.");
    } finally {
      setReportCommentSubmitting(false);
    }
  };

  // =========================
  // UI LABELS
  // =========================
  const sortLabel = useMemo(() => {
    switch (sortKey) {
      case "BEST":
        return "Hay nhất";
      case "MOST_VOTES":
        return "Nhiều lượt bình chọn nhất";
      case "NEWEST":
        return "Mới nhất";
      default:
        return "Hay nhất";
    }
  }, [sortKey]);

  const commentScore = (c: CommentItem) => (c.likesCount ?? 0) - (c.dislikesCount ?? 0);
  const commentVotes = (c: CommentItem) => (c.likesCount ?? 0) + (c.dislikesCount ?? 0);

  const renderCommentCard = (c: CommentItem, isReply: boolean, parentIdForReplyList?: string) => {
    const isOwner = user && c.authorUid === user.uid;
    const canReport = user && c.authorUid !== user.uid;

    const current = commentVoteMap[c.id] ?? null;
    const isLiked = current === "like";
    const isDisliked = current === "dislike";

    return (
      <div key={c.id} className={`rounded-xl border border-slate-700 bg-slate-900/40 p-4 ${isReply ? "ml-8" : ""}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <User size={14} />
              <span className="font-semibold">{c.authorName}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{c.createdAt}</span>
              {c.updatedAt && <span className="text-slate-500">(đã chỉnh sửa)</span>}
            </div>

            {editingId === c.id ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Nhập nội dung..."
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setEditingText("");
                    }}
                    className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-600"
                    disabled={savingEdit}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-900"
                    disabled={savingEdit}
                  >
                    {savingEdit ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: linkifyTextToHtml(c.content) }} />
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* ✅ UI Báo cáo bình luận (icon + mở modal multi-select) */}
            {canReport && (
              <button
                type="button"
                onClick={() => openReportComment(c.id)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-slate-200 hover:border-slate-500"
                title="Báo cáo bình luận"
              >
                <Flag size={16} />
              </button>
            )}

            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => handleStartEdit(c)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-slate-200 hover:border-slate-500"
                  title="Chỉnh sửa"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => openDeleteComment(c.id, c.parentId)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-red-300 hover:border-red-400"
                  title="Xoá"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => handleVoteComment(c.id, "like", parentIdForReplyList)}
            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 transition-colors ${
              isLiked
                ? "border-blue-500 bg-blue-600/20 text-blue-300"
                : "border-slate-700 bg-slate-800 text-slate-300 hover:border-blue-500 hover:text-blue-300"
            }`}
          >
            <ThumbsUp size={16} />
            <span>{c.likesCount}</span>
          </button>

          <button
            type="button"
            onClick={() => handleVoteComment(c.id, "dislike", parentIdForReplyList)}
            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 transition-colors ${
              isDisliked
                ? "border-red-500 bg-red-600/20 text-red-300"
                : "border-slate-700 bg-slate-800 text-slate-300 hover:border-red-500 hover:text-red-300"
            }`}
          >
            <ThumbsDown size={16} />
            <span>{c.dislikesCount}</span>
          </button>

          <span className="ml-2 text-xs text-slate-400">
            Điểm: {commentScore(c)} • Bình chọn: {commentVotes(c)}
          </span>

          {!isReply && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setReplyText("");
                setReplyingTo((prev) => (prev === c.id ? null : c.id));
              }}
              className="ml-auto rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-slate-200 hover:border-slate-500"
            >
              Trả lời
            </button>
          )}
        </div>

        {!isReply && replyingTo === c.id && (
          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/60 p-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Nhập câu trả lời..."
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText("");
                }}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-600"
                disabled={postingReply}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleCreateReply(c.id)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-900"
                disabled={postingReply}
              >
                {postingReply ? "Đang gửi..." : "Gửi trả lời"}
              </button>
            </div>
          </div>
        )}

        {!isReply && (
          <div className="mt-4 space-y-3">
            {(repliesMap[c.id] ?? []).map((r) => renderCommentCard(r, true, c.id))}

            {c.repliesCount > (repliesMap[c.id]?.length ?? 0) && (
              <button
                type="button"
                onClick={() => handleLoadMoreReplies(c.id)}
                className="ml-8 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                disabled={loadingRepliesMap[c.id]}
              >
                {loadingRepliesMap[c.id] ? "Đang tải..." : "Xem thêm phản hồi"}
                <ChevronDown size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // =========================
  // RENDER
  // =========================
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">Đang tải bài đăng...</div>;
  }

  if (!discussion) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-6 text-white">
        <Frown size={48} className="mb-4 text-red-500" />
        <h1 className="mb-2 text-2xl font-bold">Không tìm thấy chủ đề</h1>
        <p className="text-slate-400">ID không tồn tại hoặc đã bị xoá.</p>
        <Link href="/routes/discuss" className="mt-6 text-blue-400 underline hover:text-blue-300">
          Quay lại trang thảo luận
        </Link>
      </div>
    );
  }

  const isPostLiked = currentVote === "like";
  const isPostDisliked = currentVote === "dislike";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <main className="relative mx-auto max-w-4xl space-y-10 px-6 py-12">
        <Link
          href="/routes/discuss"
          className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
          title="Quay lại trang thảo luận"
        >
          <ArrowLeft size={18} />
        </Link>

        {/* Header */}
        <header className="border-b border-slate-700 pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="mb-3 text-3xl font-bold text-white">{discussion.title}</h1>
              <p className="mb-4 text-slate-400">{discussion.excerpt}</p>

              {discussion.tags.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {discussion.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400 border border-slate-700">
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
                  {discussion.repliesCount} phản hồi
                </span>
                <span className="flex items-center gap-2">
                  <Eye size={16} />
                  {discussion.viewsCount} lượt xem
                </span>
              </div>
            </div>

            {/* ✅ Tác giả: dấu 3 chấm dọc -> menu 2 dòng */}
            {canEditPost && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPostMenuOpen((o) => !o)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-slate-200 hover:border-slate-400"
                  title="Tuỳ chọn"
                >
                  <MoreVertical size={18} />
                </button>

                {postMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl z-10">
                    <button
                      type="button"
                      onClick={() => {
                        setPostMenuOpen(false);
                        router.push(`/routes/discuss/${discussion.id}/edit`);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                    >
                      <Edit2 size={16} />
                      Chỉnh sửa bài đăng
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPostMenuOpen(false);
                        setConfirmPostDeleteOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-slate-800"
                    >
                      <Trash2 size={16} />
                      Xoá bài đăng
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ✅ LỖI 1: Báo cáo 1 hàng */}
            {canReportPost && (
              <button
                type="button"
                onClick={() => setReportPostOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-slate-400 whitespace-nowrap leading-none"
              >
                <Flag size={16} />
                <span className="whitespace-nowrap">Báo cáo</span>
              </button>
            )}
          </div>

          <div className="mt-4 flex gap-3 text-sm">
            <button
              type="button"
              onClick={() => handleVotePost("like")}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 transition-colors ${
                isPostLiked
                  ? "border-blue-500 bg-blue-600/20 text-blue-300"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:border-blue-500 hover:text-blue-300"
              }`}
            >
              <ThumbsUp size={16} />
              <span>{discussion.likesCount}</span>
            </button>

            <button
              type="button"
              onClick={() => handleVotePost("dislike")}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 transition-colors ${
                isPostDisliked
                  ? "border-red-500 bg-red-600/20 text-red-300"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:border-red-500 hover:text-red-300"
              }`}
            >
              <ThumbsDown size={16} />
              <span>{discussion.dislikesCount}</span>
            </button>
          </div>
        </header>

        {(() => {
  const contentHtml = markdownToHtml(discussion?.content || "");
  return <div dangerouslySetInnerHTML={{ __html: contentHtml }} />;
})()}



        {/* Comments */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
              <MessageSquare size={20} /> Bình luận
            </h2>

            {/* ✅ Sort: chỉ 3 dòng */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortOpen((o) => !o)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-slate-500"
              >
                Sắp xếp: <span className="font-semibold">{sortLabel}</span>
                <ChevronDown size={16} />
              </button>

              {sortOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl z-10">
                  {[
                    { key: "BEST" as const, label: "Hay nhất" },
                    { key: "MOST_VOTES" as const, label: "Nhiều lượt bình chọn nhất" },
                    { key: "NEWEST" as const, label: "Mới nhất" },
                  ].map((it) => (
                    <button
                      key={it.key}
                      type="button"
                      onClick={() => {
                        setSortKey(it.key);
                        setSortOpen(false);
                        setParentPage(1);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                        sortKey === it.key ? "bg-slate-800 text-white" : "text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      {it.label}
                      {sortKey === it.key && <span className="text-emerald-400">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ✅ Placeholder đúng yêu cầu */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Nhập bình luận của bạn..."
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleCreateComment}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-900"
                disabled={postingComment}
              >
                {postingComment ? "Đang đăng..." : "Đăng bình luận"}
              </button>
            </div>
          </div>

          {sortedParents.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
          ) : (
            <div className="space-y-4">{sortedParents.map((c) => renderCommentCard(c, false))}</div>
          )}

          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setParentPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500 disabled:opacity-40"
              disabled={parentPage === 1}
              title="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200">Trang {parentPage}</span>

            <button
              type="button"
              onClick={() => setParentPage((p) => p + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500"
              title="Trang sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </section>

        {/* =========================
            ✅ LỖI “BẤM KHÔNG HIỆN”
            -> tăng z-index lên cực cao cho tất cả modal
           ========================= */}

        {/* Modal xoá bài */}
        {confirmPostDeleteOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
            <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-900/40 text-red-400">
                  <AlertCircle size={20} />
                </div>
                <h2 className="text-lg font-semibold text-white">Xác nhận xoá</h2>
              </div>
              <p className="mb-6 text-sm text-slate-300">Bạn có chắc chắn muốn xoá bài đăng này không? Hành động này không thể hoàn tác.</p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmPostDeleteOpen(false)}
                  className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-600"
                  disabled={deletingPost}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleDeletePost}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-red-900"
                  disabled={deletingPost}
                >
                  {deletingPost ? "Đang xoá..." : "Xoá bài"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal xoá comment */}
        {confirmCommentDeleteOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
            <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-900/40 text-red-400">
                  <AlertCircle size={20} />
                </div>
                <h2 className="text-lg font-semibold text-white">Xác nhận xoá</h2>
              </div>
              <p className="mb-6 text-sm text-slate-300">Bạn có chắc chắn muốn xoá bình luận này không? Hành động này không thể hoàn tác.</p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmCommentDeleteOpen(false)}
                  className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-600"
                  disabled={deletingComment}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleDeleteComment}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-red-900"
                  disabled={deletingComment}
                >
                  {deletingComment ? "Đang xoá..." : "Xoá"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== MODAL BÁO CÁO BÀI (multi-select) ===== */}
        {reportPostOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
            <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Báo cáo nội dung</h2>
                <button type="button" onClick={() => setReportPostOpen(false)} className="rounded-lg p-2 text-slate-300 hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>

              <p className="mb-3 text-sm text-slate-400">Bạn có thể chọn nhiều lý do.</p>

              <div className="space-y-2">
                {REPORT_REASONS.map((r) => {
                  const selected = reportPostSelected.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReportPostSelected((p) => toggleReason(p, r))}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        selected ? "border-blue-500 bg-blue-600/20 text-blue-200" : "border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500"
                      }`}
                    >
                      {selected ? "✓ " : ""}
                      {r}
                    </button>
                  );
                })}
              </div>

              {reportPostSelected.includes("Khác") && (
                <div className="mt-4">
                  <label className="mb-1 block text-sm font-semibold text-slate-200">Nội dung bổ sung</label>
                  <textarea
                    value={reportPostOther}
                    onChange={(e) => setReportPostOther(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Nhập thêm nội dung bạn muốn báo cáo..."
                  />
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReportPostOpen(false)}
                  className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-600"
                  disabled={reportPostSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={submitReportPost}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-900"
                  disabled={reportPostSubmitting}
                >
                  {reportPostSubmitting ? "Đang gửi..." : "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== MODAL BÁO CÁO BÀI THÀNH CÔNG ===== */}
        {reportPostSuccessOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
            <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-900/40 text-emerald-400">
                  <CheckCircle2 size={20} />
                </div>
                <h2 className="text-lg font-semibold text-white">Báo cáo thành công</h2>
              </div>
              <p className="mb-6 text-sm text-slate-300">Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét nội dung này.</p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setReportPostSuccessOpen(false)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== MODAL BÁO CÁO BÌNH LUẬN (multi-select) ===== */}
        {reportCommentOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
            <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Báo cáo bình luận</h2>
                <button type="button" onClick={() => setReportCommentOpen(false)} className="rounded-lg p-2 text-slate-300 hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>

              <p className="mb-3 text-sm text-slate-400">Bạn có thể chọn nhiều lý do.</p>

              <div className="space-y-2">
                {REPORT_REASONS.map((r) => {
                  const selected = reportCommentSelected.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReportCommentSelected((p) => toggleReason(p, r))}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        selected ? "border-blue-500 bg-blue-600/20 text-blue-200" : "border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500"
                      }`}
                    >
                      {selected ? "✓ " : ""}
                      {r}
                    </button>
                  );
                })}
              </div>

              {reportCommentSelected.includes("Khác") && (
                <div className="mt-4">
                  <label className="mb-1 block text-sm font-semibold text-slate-200">Nội dung bổ sung</label>
                  <textarea
                    value={reportCommentOther}
                    onChange={(e) => setReportCommentOther(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Nhập thêm nội dung bạn muốn báo cáo..."
                  />
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReportCommentOpen(false)}
                  className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-600"
                  disabled={reportCommentSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={submitReportComment}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-900"
                  disabled={reportCommentSubmitting}
                >
                  {reportCommentSubmitting ? "Đang gửi..." : "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== MODAL BÁO CÁO BÌNH LUẬN THÀNH CÔNG ===== */}
        {reportCommentSuccessOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
            <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-900/40 text-emerald-400">
                  <CheckCircle2 size={20} />
                </div>
                <h2 className="text-lg font-semibold text-white">Báo cáo thành công</h2>
              </div>
              <p className="mb-6 text-sm text-slate-300">Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét nội dung này.</p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setReportCommentSuccessOpen(false)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
