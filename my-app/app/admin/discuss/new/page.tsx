"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/src/api/firebase/firebase";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminNewDiscussionPage() {
  const router = useRouter();
  const { user } = useAuthContext();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung.");
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const tagList = tags.split(",").map(t => t.trim()).filter(Boolean);
      
      await addDoc(collection(db, "discussions"), {
        title: title.trim(),
        excerpt: content.slice(0, 150), // Simple auto-excerpt
        content: content.trim(),
        repliesCount: 0,
        likesCount: 0,
        dislikesCount: 0,
        viewsCount: 0,
        tags: tagList,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        author: {
          uid: user.uid,
          name: "ADMIN",
          photoUrl: user.photoURL
        },
      });

      toast.success("Đã đăng bài thành công!");
      router.push("/admin/discuss");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi đăng bài.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200">
      {/* Header */}
      <div className="border-b border-slate-800/50 bg-slate-950/80 p-4 backdrop-blur-md sticky top-0 z-30 transition-all">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link href="/admin/discuss" className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors group">
            <div className="p-1 rounded-full group-hover:bg-slate-800 transition-colors">
                <ArrowLeft size={18} />
            </div>
            Quay lại danh sách
          </Link>
          <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Đăng Bài Mới (Admin)</h1>
          <div className="w-[100px]"></div> {/* Spacer */}
        </div>
      </div>

      <div className="mx-auto max-w-4xl p-6 md:p-10">
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
            
            <div className="relative z-10 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-300 uppercase tracking-wide mb-3">Tiêu đề bài viết</label>
                    <input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Nhập tiêu đề..."
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-5 py-4 text-xl font-bold text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-inner placeholder:text-slate-600"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-300 uppercase tracking-wide mb-3">Thẻ (Tags)</label>
                    <input 
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="Ví dụ: Thông báo, Update, Quy định..."
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-5 py-3 text-sm text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-inner placeholder:text-slate-600"
                    />
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                        Phân cách các thẻ bằng dấu phẩy
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-300 uppercase tracking-wide mb-3">Nội dung (Markdown)</label>
                    <div className="relative">
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={15}
                            placeholder="Viết nội dung bài viết..."
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-5 py-4 font-mono text-sm text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-y shadow-inner scrollbar-hide placeholder:text-slate-600 leading-relaxed"
                        />
                        <div className="absolute bottom-4 right-4 text-xs text-slate-600 font-medium pointer-events-none px-2 py-1 bg-slate-900/80 rounded">Markdown Supported</div>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-800/50">
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        <Send size={18} strokeWidth={2.5} />
                        {loading ? "Đang xử lý..." : "Đăng Bài Ngay"}
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
