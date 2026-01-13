"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Layers, FileText, ArrowLeft, User, BookMarked, Clock, Printer, BookmarkCheck, Bookmark } from "lucide-react";
import Link from "next/link";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { db } from "@/src/api/firebase/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

// --- Interfaces ---
interface GuideDetailData {
  title: string;
  author: string;
  level: string;
  type: string;
  desc: string;
  htmlContent: string;
  backgroundImage?: string;
  id?: string;
}

export default function GuideDetail() {
  const { id } = useParams<{ id: string }>();
  const [guide, setGuide] = useState<GuideDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { user } = useAuthContext();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setFetchError(null);

    const load = async () => {
      try {
        const res = await fetch(`/routes/explore/api/explore/guides/${id}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);

        const data: GuideDetailData = await res.json();
        setGuide(data);
      } catch (e: any) {
        setFetchError(`Lỗi: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Fetch Interaction
  useEffect(() => {
    if (!user || !id) return;
    const checkInteraction = async () => {
        try {
            const ref = doc(db, "users", user.uid, "interactions", `guide_${id}`);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                setIsSaved(snap.data().saved || false);
            }
        } catch (error) {
            console.error(error);
        }
    };
    checkInteraction();
  }, [user, id]);

  const handleSaveGuide = async () => {
    if (!user) {
        toast.error("Vui lòng đăng nhập để lưu hướng dẫn");
        return;
    }
    try {
        const newState = !isSaved;
        setIsSaved(newState);
        const ref = doc(db, "users", user.uid, "interactions", `guide_${id}`);
        await setDoc(ref, {
            saved: newState,
            type: 'guide',
            updatedAt: serverTimestamp()
        }, { merge: true });
        
        if (newState) toast.success("Đã lưu hướng dẫn");
        else toast.info("Đã bỏ lưu hướng dẫn");
    } catch (error) {
        setIsSaved(!isSaved);
        toast.error("Có lỗi xảy ra");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="w-16 h-16 border-4 border-slate-700 border-t-pink-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-pink-500/20 rounded-full animate-ping" />
          </div>
          <p className="text-lg text-slate-400 animate-pulse">Đang tải hướng dẫn...</p>
        </div>
      </div>
    );

  if (fetchError || !guide)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-10">
        <div className="text-center max-w-md">
          <div className="inline-flex mb-4 p-4 bg-red-900/20 rounded-2xl">
            <FileText size={48} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Không tìm thấy hướng dẫn</h2>
          <p className="text-slate-400 mb-6">{fetchError}</p>
          <Link
            href="/routes/explore"
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl transition-colors"
          >
            <ArrowLeft size={16} />
            Quay lại khám phá
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      {/* Hero Header */}
      <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${
              guide.backgroundImage ||
              "https://images.unsplash.com/photo-1517694712202-14dd9538aa97"
            }')`,
          }}
        />
        
        {/* Enhanced Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-slate-900/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-pink-900/20 to-orange-900/20" />

        <div className="relative z-10 max-w-6xl mx-auto h-full flex flex-col justify-end p-6 md:p-12">
          {/* Back Button */}
          <Link
            href="/routes/explore"
            className="absolute top-10 left-6 md:left-12 flex items-center text-slate-100/80 hover:text-white transition-all duration-300 group"
          >
            <div className="absolute inset-0 bg-pink-500/0 group-hover:bg-pink-500/10 rounded-lg blur-xl transition-all duration-300" />
            <ArrowLeft className="relative w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="relative text-xs font-semibold tracking-widest uppercase">
              Quay lại
            </span>
          </Link>

          <header className="mb-6">
            {/* Icon Badge */}
            <div className="inline-flex mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-orange-600 rounded-xl blur-lg opacity-50" />
                <div className="relative bg-gradient-to-br from-pink-600 to-orange-600 p-3 rounded-xl">
                  <BookMarked size={24} className="text-white" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-pink-100 to-orange-100 bg-clip-text text-transparent leading-tight">
              {guide.title}
            </h1>

            {/* Meta Labels */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-lg">
                <User className="w-4 h-4 mr-2 text-pink-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  {guide.author}
                </span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-lg">
                <Layers className="w-4 h-4 mr-2 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  {guide.level}
                </span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-lg">
                <FileText className="w-4 h-4 mr-2 text-orange-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  {guide.type}
                </span>
              </div>
            </div>
          </header>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto p-6 md:p-12">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {/* Introduction */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-1 bg-gradient-to-b from-pink-500 to-orange-500 rounded-full" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  Giới thiệu
                </h2>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 via-orange-600 to-pink-600 rounded-2xl opacity-20 group-hover:opacity-30 blur transition-opacity duration-500" />
                <div className="relative bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 shadow-2xl">
                  <div className="absolute top-6 left-6 text-pink-500/20 text-6xl font-serif">"</div>
                  <p className="text-lg text-slate-300 leading-relaxed italic pl-8">
                    {guide.desc}
                  </p>
                </div>
              </div>
            </section>

            {/* Main Content */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-1 bg-gradient-to-b from-pink-500 to-orange-500 rounded-full" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  Nội dung hướng dẫn
                </h2>
              </div>
              <div
                className="prose prose-lg prose-invert max-w-none
                  prose-headings:font-bold prose-headings:tracking-tight
                  prose-h1:text-4xl prose-h1:mb-6 prose-h1:bg-gradient-to-r prose-h1:from-white prose-h1:to-slate-400 prose-h1:bg-clip-text prose-h1:text-transparent
                  prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:bg-gradient-to-r prose-h2:from-pink-300 prose-h2:to-orange-300 prose-h2:bg-clip-text prose-h2:text-transparent
                  prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-pink-200
                  prose-p:text-slate-300 prose-p:leading-8 prose-p:mb-6
                  prose-strong:text-white prose-strong:font-bold
                  prose-em:text-pink-300 prose-em:italic
                  prose-a:text-pink-400 prose-a:no-underline hover:prose-a:text-pink-300 hover:prose-a:underline prose-a:transition-colors
                  prose-code:text-orange-400 prose-code:bg-slate-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-slate-900/50 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded-xl prose-pre:shadow-2xl
                  prose-ul:text-slate-300 prose-ul:my-6
                  prose-ol:text-slate-300 prose-ol:my-6
                  prose-li:my-2 prose-li:leading-7
                  prose-blockquote:border-l-4 prose-blockquote:border-pink-500 prose-blockquote:bg-slate-900/50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:italic prose-blockquote:text-slate-400 prose-blockquote:rounded-r-xl
                  prose-img:rounded-xl prose-img:shadow-2xl prose-img:my-8
                  prose-hr:border-slate-700 prose-hr:my-12
                  prose-table:border prose-table:border-slate-700 prose-table:rounded-lg prose-table:overflow-hidden
                  prose-th:bg-slate-800 prose-th:text-white prose-th:font-bold prose-th:px-4 prose-th:py-3
                  prose-td:border-slate-700 prose-td:px-4 prose-td:py-3"
                dangerouslySetInnerHTML={{ __html: guide.htmlContent }}
              />
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-10 space-y-6 animate-in fade-in slide-in-from-right-4 duration-700" style={{ animationDelay: '200ms' }}>
              {/* Author Card */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-orange-600 rounded-2xl opacity-20 group-hover:opacity-30 blur transition-opacity duration-500" />
                <div className="relative bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-2xl">
                  <h3 className="text-sm font-bold tracking-widest uppercase bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent mb-6 pb-4 border-b border-slate-700">
                    Thông tin bài viết
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex justify-between items-center group/item hover:bg-slate-800/50 p-3 rounded-lg transition-colors">
                      <span className="text-sm font-medium text-slate-400">
                        Tác giả
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {guide.author}
                      </span>
                    </li>
                    <li className="flex justify-between items-center group/item hover:bg-slate-800/50 p-3 rounded-lg transition-colors">
                      <span className="text-sm font-medium text-slate-400">
                        Cấp độ
                      </span>
                      <span className="text-sm font-bold text-pink-400 uppercase">
                        {guide.level}
                      </span>
                    </li>
                    <li className="flex justify-between items-center group/item hover:bg-slate-800/50 p-3 rounded-lg transition-colors">
                      <span className="text-sm font-medium text-slate-400">
                        Định dạng
                      </span>
                      <span className="text-sm font-semibold text-orange-300">
                        {guide.type}
                      </span>
                    </li>
                    <li className="flex justify-between items-center group/item hover:bg-slate-800/50 p-3 rounded-lg transition-colors">
                      <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
                        <Clock size={14} />
                        Thời gian đọc
                      </span>
                      <span className="text-sm font-semibold text-slate-300">
                        ~10 phút
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-pink-600 rounded-2xl opacity-20 group-hover:opacity-30 blur transition-opacity duration-500" />
                <div className="relative bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-2xl">
                  <h3 className="text-sm font-bold tracking-widest uppercase bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent mb-4">
                    Hành động
                  </h3>
                  <div className="space-y-2">
                    <button 
                        onClick={handleSaveGuide}
                        className={`w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2
                        ${isSaved 
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white' 
                            : 'bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 text-white'
                        }`}
                    >
                      {isSaved ? (
                          <>
                            <BookmarkCheck className="w-4 h-4" />
                            Đã lưu
                          </>
                      ) : (
                          <>
                            <BookMarked className="w-4 h-4" />
                            Lưu hướng dẫn
                          </>
                      )}
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 border border-slate-700 flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      In tài liệu
                    </button>
                  </div>
                </div>
              </div>

              {/* Info Note */}
              <div className="p-4 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 leading-relaxed italic">
                  Tài liệu này được đồng bộ từ Firebase Cloud Firestore
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
