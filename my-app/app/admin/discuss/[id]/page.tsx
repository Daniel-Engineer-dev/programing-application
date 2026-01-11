"use client";

import { markdownToHtml } from "@/src/Component/Discussion/Markdown";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { db } from "@/src/api/firebase/firebase";
import { useAuthContext } from "@/src/userHook/context/authContext";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  writeBatch,
  DocumentSnapshot
} from "firebase/firestore";

import {
  ArrowLeft,
  MessageSquare,
  Clock,
  User,
  Trash2,
  Edit2,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

// --- TYPES ---
interface CommentItem {
  id: string;
  parentId: string | null;
  authorUid: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  repliesCount: number;
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
  authorAvatar?: string;
  viewsCount: number;
  tags: string[];
}

export default function AdminDiscussionDetail() {
  const params = useParams<{ id: string }>();
  const discussionId = params.id;
  const router = useRouter();
  const { user } = useAuthContext();

  const [discussion, setDiscussion] = useState<DiscussionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Post State
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostContent, setEditPostContent] = useState("");

  // Comments State
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const COMMENTS_PER_PAGE = 30;
  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  // Highlighting Logic
  const searchParams = useSearchParams();
  const highlightParam = searchParams.get("highlight");
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
      if (highlightParam && comments.length > 0) {
          // Attempt to scroll to comment if present
          const el = document.getElementById(`comment-${highlightParam}`);
          if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              setHighlightId(highlightParam);
              // Clear highlight to trigger fade out (transition defined in CSS)
              const timer = setTimeout(() => setHighlightId(null), 2000);
              return () => clearTimeout(timer);
          }
      }
  }, [highlightParam, comments]);

  // --- FETCHING ---
  const fetchDiscussion = async () => {
    try {
      const ref = doc(db, "discussions", discussionId as string);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data();
        setDiscussion({
          id: snap.id,
          title: d.title || "",
          content: d.content || "",
          excerpt: d.excerpt || "",
          repliesCount: d.repliesCount || 0,
          createdAt: d.createdAt?.toDate().toLocaleString() || "",
          authorName: d.authorName || d.author?.name || d.author?.email?.split('@')[0] || "Người dùng",
          authorUid: d.authorUid || "",
          authorAvatar: d.authorAvatar || d.author?.photoUrl,
          viewsCount: d.viewsCount || 0,
          tags: d.tags || [],
        });
        setEditPostTitle(d.title || "");
        setEditPostContent(d.content || "");
      } else {
        setDiscussion(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải bài viết");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (reset = false) => {
    if (reset) {
        setComments([]);
        lastDocRef.current = null;
    }
    setLoadingComments(true);
    try {
        let q = query(
            collection(db, "discussions", discussionId as string, "comments"),
            orderBy("createdAt", "desc"),
            limit(COMMENTS_PER_PAGE)
        );
        
        if (!reset && lastDocRef.current) {
            q = query(q, startAfter(lastDocRef.current));
        }

        const snap = await getDocs(q);
        if (!snap.empty) {
            lastDocRef.current = snap.docs[snap.docs.length - 1];
            const items = snap.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    parentId: data.parentId || null,
                    authorUid: data.authorUid,
                    authorName: data.authorName || data.author?.name || data.author?.email?.split('@')[0] || "Người dùng",
                    authorAvatar: data.authorAvatar || data.author?.photoUrl,
                    content: data.content,
                    createdAt: data.createdAt?.toDate().toLocaleString(),
                    updatedAt: data.updatedAt?.toDate().toLocaleString(),
                    repliesCount: data.repliesCount || 0
                } as CommentItem;
            });
            setComments(prev => reset ? items : [...prev, ...items]);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingComments(false);
    }
  };
  
  useEffect(() => {
    if (discussionId) {
        fetchDiscussion();
        fetchComments(true);
    }
  }, [discussionId]);

  // --- ACTIONS --- (Keep same logic)
  const handleUpdatePost = async () => {
      if (!editPostTitle.trim() || !editPostContent.trim()) return alert("Không được để trống");
      try {
          await updateDoc(doc(db, "discussions", discussionId as string), {
              title: editPostTitle,
              content: editPostContent,
              updatedAt: serverTimestamp()
          });
          setDiscussion(prev => prev ? ({ ...prev, title: editPostTitle, content: editPostContent }) : null);
          setIsEditingPost(false);
          toast.success("Đã cập nhật bài viết");
      } catch (error) {
          toast.error("Lỗi cập nhật");
      }
  };

  const handleDeletePost = async () => {
      if (!confirm("CẢNH BÁO: Xoá vĩnh viễn bài đăng này?\nTất cả bình luận và báo cáo liên quan cũng sẽ bị xoá.")) return;
      try {
          toast.info("Đang xử lý xoá...");

          // 1. Delete Discussion Reports
          const discussionReportsSnap = await getDocs(collection(db, "discussions", discussionId as string, "reports"));
          const batch1 = writeBatch(db);
          discussionReportsSnap.docs.forEach((doc) => batch1.delete(doc.ref));
          await batch1.commit();

          // 2. Delete Comments and their Reports
          const commentsSnap = await getDocs(collection(db, "discussions", discussionId as string, "comments"));
          for (const commentDoc of commentsSnap.docs) {
              const commentReportsSnap = await getDocs(collection(db, "discussions", discussionId as string, "comments", commentDoc.id, "reports"));
              if (!commentReportsSnap.empty) {
                  const batchRep = writeBatch(db);
                  commentReportsSnap.docs.forEach((r) => batchRep.delete(r.ref));
                  await batchRep.commit();
              }
              await deleteDoc(commentDoc.ref);
          }

          // 3. Delete Discussion Main Doc
          await deleteDoc(doc(db, "discussions", discussionId as string));
          
          toast.success("Đã xoá bài viết");
          router.push("/admin/discuss");
      } catch (error) {
          console.error(error);
          toast.error("Lỗi xoá bài");
      }
  };

  const handleAddComment = async () => {
       if (!newCommentText.trim() || !user) return;
       try {
           const data = {
               content: newCommentText.trim(),
               authorUid: user.uid,
               author: {
                   uid: user.uid,
                   name: "ADMIN",
                   photoUrl: user.photoURL
               },
               createdAt: serverTimestamp(),
               parentId: null,
               likesCount: 0,
               dislikesCount: 0,
               repliesCount: 0,
               isAdminComment: true
           };
           await addDoc(collection(db, "discussions", discussionId as string, "comments"), data);
           await updateDoc(doc(db, "discussions", discussionId as string), {
               repliesCount: increment(1)
           });
           setNewCommentText("");
           fetchComments(true); 
           toast.success("Đã gửi bình luận");
       } catch (error) {
           toast.error("Lỗi gửi bình luận");
       }
  };

  const handleDeleteComment = async (cid: string) => {
      if (!confirm("Xoá bình luận này?")) return;
      try {
          await deleteDoc(doc(db, "discussions", discussionId as string, "comments", cid));
          await updateDoc(doc(db, "discussions", discussionId as string), {
              repliesCount: increment(-1)
          });
          setComments(prev => prev.filter(c => c.id !== cid));
          toast.success("Đã xoá bình luận");
      } catch (error) {
          toast.error("Lỗi xoá bình luận");
      }
  };

  const handleEditComment = async (cid: string, currentContent: string) => {
      const newContent = prompt("Admin sửa nội dung bình luận:", currentContent);
      if (newContent !== null && newContent.trim() !== "" && newContent !== currentContent) {
          try {
              await updateDoc(doc(db, "discussions", discussionId as string, "comments", cid), {
                  content: newContent.trim(),
                  updatedAt: serverTimestamp()
              });
              setComments(prev => prev.map(c => c.id === cid ? { ...c, content: newContent.trim() } : c));
              toast.success("Đã sửa bình luận");
          } catch(e) {
              toast.error("Lỗi khi lưu");
          }
      }
  }

  // --- RENDER ---
  if (loading || !discussion) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-500">
        <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            Đang tải dữ liệu...
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200">
      
      {/* Top Bar Navigation */}
      <div className="sticky top-0 z-30 border-b border-slate-800/50 bg-slate-950/80 p-4 backdrop-blur-xl transition-all">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
            <Link href="/admin/discuss" className="group flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                <div className="p-1 rounded-full group-hover:bg-slate-800 transition-colors">
                    <ArrowLeft size={18} />
                </div>
                Quay lại danh sách
            </Link>
            
            <div className="flex gap-3">
                {!isEditingPost ? (
                    <>
                        <button 
                            onClick={() => setIsEditingPost(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 transition-all text-sm font-bold shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                        >
                            <Edit2 size={16} strokeWidth={2.5} /> Sửa Bài
                        </button>
                        <button 
                            onClick={handleDeletePost}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/20 transition-all text-sm font-bold shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                        >
                            <Trash2 size={16} strokeWidth={2.5} /> Xoá Bài
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={() => setIsEditingPost(false)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">Huỷ bỏ</button>
                        <button onClick={handleUpdatePost} className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:shadow-lg hover:shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5">Lưu Thay Đổi</button>
                    </>
                )}
            </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl p-6 md:p-10 space-y-10">
            
            {/* POST CARD */}
            <article className="relative rounded-3xl border border-slate-800/60 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
                
                {isEditingPost ? (
                    <div className="space-y-6 relative z-10">
                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-300 uppercase tracking-wide">Tiêu đề bài viết</label>
                            <input 
                                value={editPostTitle}
                                onChange={e => setEditPostTitle(e.target.value)}
                                className="w-full rounded-xl border border-slate-700/50 bg-slate-950/50 px-5 py-4 text-xl font-bold text-white shadow-inner focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                placeholder="Nhập tiêu đề..."
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-300 uppercase tracking-wide">Nội dung (Markdown)</label>
                            <textarea 
                                value={editPostContent}
                                onChange={e => setEditPostContent(e.target.value)}
                                rows={18}
                                className="w-full rounded-xl border border-slate-700/50 bg-slate-950/50 px-5 py-4 font-mono text-sm text-slate-200 shadow-inner focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all scrollbar-hide"
                                placeholder="Nhập nội dung..."
                            />
                        </div>
                    </div>
                ) : (
                    <div className="relative z-10">
                        {/* Header: Title -> Excerpt -> Tags -> Metadata */}
                        <div className="mb-10 border-b border-slate-800/50 pb-8">
                             <h1 className="mb-4 text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 leading-tight">
                                {discussion.title}
                             </h1>
                             <p className="mb-6 text-base text-slate-400 leading-relaxed max-w-3xl">{discussion.excerpt}</p>
                             
                             <div className="flex flex-wrap items-center justify-between gap-6">
                                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
                                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                                        {discussion.authorAvatar ? (
                                            <div className="relative h-5 w-5 overflow-hidden rounded-full ring-1 ring-slate-600">
                                                <Image src={discussion.authorAvatar} alt="" fill className="object-cover" />
                                            </div>
                                        ) : (
                                            <User size={16} />
                                        )}
                                        <span className="text-slate-200">{discussion.authorName}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-slate-800/30 px-3 py-1.5 rounded-full">
                                        <Clock size={14} className="text-slate-500" />
                                        {discussion.createdAt}
                                    </div>
                                    <div className="flex items-center gap-4 px-2">
                                        <span className="flex items-center gap-1.5 hover:text-blue-400 transition-colors cursor-default">
                                            <MessageSquare size={16} /> {discussion.repliesCount}
                                        </span>
                                        <span className="flex items-center gap-1.5 hover:text-purple-400 transition-colors cursor-default">
                                            <Eye size={16} /> {discussion.viewsCount}
                                        </span>
                                    </div>
                                </div>

                                {discussion.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                    {discussion.tags.map((tag) => (
                                        <span
                                        key={tag}
                                        className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                                        >
                                        #{tag}
                                        </span>
                                    ))}
                                    </div>
                                )}
                             </div>
                        </div>

                        {/* Content */}
                        <div className="prose prose-invert prose-lg max-w-none text-slate-300 leading-loose">
                             {(() => {
                                 const html = markdownToHtml(discussion.content);
                                 return <div dangerouslySetInnerHTML={{ __html: html }} />;
                             })()}
                        </div>
                    </div>
                )}
            </article>

            {/* COMMENTS SECTION */}
            <section className="space-y-8">
                <div className="flex items-center gap-4 px-2">
                     <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                     <h2 className="text-2xl font-bold text-white">
                        Bình luận <span className="text-slate-500 text-lg ml-2 font-normal">({discussion.repliesCount})</span>
                     </h2>
                </div>

                {/* Comment Input */}
                <div className="rounded-3xl border border-slate-700/50 bg-slate-900/60 p-1 shadow-2xl backdrop-blur-md">
                    <div className="rounded-[20px] bg-slate-950/50 p-6 border border-slate-800/30">
                        <textarea 
                            value={newCommentText}
                            onChange={e => setNewCommentText(e.target.value)}
                            placeholder="Viết bình luận với quyền Admin..."
                            rows={3}
                            className="w-full resize-none bg-transparent text-slate-200 placeholder-slate-500 outline-none text-base leading-relaxed scrollbar-hide"
                        />
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-800/50">
                            <span className="text-xs font-medium text-slate-500 flex items-center gap-2">
                                <ShieldCheck size={14} className="text-blue-500" />
                                Đang bình luận dưới danh nghĩa Admin
                            </span>
                            <button 
                                onClick={handleAddComment}
                                disabled={!newCommentText.trim()}
                                className="rounded-xl bg-white text-slate-900 px-6 py-2.5 text-sm font-bold shadow-lg shadow-white/10 transition-all hover:bg-slate-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
                            >
                                Gửi Bình Luận
                            </button>
                        </div>
                    </div>
                </div>

                {/* Comment List */}
                <div className="space-y-6">
                    {comments.map(c => (
                        <div 
                            key={c.id} 
                            id={`comment-${c.id}`}
                            className={`group relative flex gap-5 rounded-3xl border p-6 transition-all duration-700 ${
                                highlightId === c.id 
                                ? "bg-blue-900/20 border-blue-500/40 shadow-[0_0_40px_rgba(59,130,246,0.15)]" 
                                : "bg-slate-900/40 border-slate-800/50 hover:bg-slate-900/60 hover:border-slate-700"
                            }`}
                        >
                            {/* Avatar */}
                            <div className="shrink-0">
                                <div className="h-12 w-12 overflow-hidden rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shadow-lg">
                                    {c.authorAvatar ? (
                                        <div className="relative h-full w-full">
                                            <Image src={c.authorAvatar} alt={c.authorName} fill className="object-cover" />
                                        </div>
                                    ) : (
                                        <User size={24} />
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold text-base ${c.authorName === 'ADMIN' ? 'text-blue-400' : 'text-slate-200'}`}>{c.authorName}</span>
                                            {c.authorName === 'ADMIN' && <ShieldCheck size={14} className="text-blue-500" />}
                                        </div>
                                        <span className="text-xs text-slate-500 font-medium">{c.createdAt}</span>
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                                        <button 
                                            onClick={() => handleEditComment(c.id, c.content)}
                                            className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                            title="Sửa nội dung"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteComment(c.id)}
                                            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                            title="Xoá bình luận"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-950/30 p-4 rounded-xl border border-slate-800/30">
                                    {c.content}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {loadingComments && (
                        <div className="py-8 flex justify-center">
                            <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-slate-400 animate-spin"></div>
                        </div>
                    )}
                    
                    {!loadingComments && comments.length === 0 && (
                        <div className="py-16 text-center text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                             <MessageSquare size={48} className="mx-auto mb-4 text-slate-700" opacity={0.5} />
                            <p className="font-medium">Chưa có bình luận nào.</p>
                            <p className="text-xs mt-1 opacity-70">Hãy là người đầu tiên bình luận!</p>
                        </div>
                    )}
                </div>
            </section>
      </main>
    </div>
  );
}
