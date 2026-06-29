"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Layers, FileText, ArrowLeft, User, BookMarked, Clock, Printer, BookmarkCheck, Bookmark, Check } from "lucide-react";
import Link from "next/link";
import { useAuthContext } from "@/contexts/authContext";
import { db } from "@/lib/firebase";
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
  const [isRead, setIsRead] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setFetchError(null);

    const load = async () => {
      try {
        const res = await fetch(`/explore/api/explore/guides/${id}`);
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
                setIsRead(snap.data().read || false);
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

  const handleMarkAsRead = async () => {
    if (!user) {
        toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
        return;
    }
    try {
        const newState = !isRead;
        setIsRead(newState);
        const ref = doc(db, "users", user.uid, "interactions", `guide_${id}`);
        await setDoc(ref, {
            read: newState,
            type: 'guide',
            updatedAt: serverTimestamp()
        }, { merge: true });
        
        if (newState) toast.success("Đã đánh dấu đã đọc!");
        else toast.info("Đã bỏ đánh dấu");
    } catch (error) {
        setIsRead(!isRead);
        toast.error("Có lỗi xảy ra");
        console.error(error);
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
            href="/explore"
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl transition-colors"
          >
            <ArrowLeft size={16} />
            Quay lại khám phá
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 text-white relative">
      {/* Hero Header */}
      <div className="relative w-full h-[280px] md:h-[320px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${
              guide.backgroundImage ||
              "https://images.unsplash.com/photo-1517694712202-14dd9538aa97"
            }')`,
          }}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-slate-950/80" />

        <div className="relative z-10 max-w-6xl mx-auto h-full flex flex-col justify-end p-6 md:p-12">
          {/* Back Button */}
          <Link
            href="/explore"
            className="absolute top-8 left-6 md:left-12 flex items-center text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold tracking-widest uppercase">
              Quay lại
            </span>
          </Link>

          <header className="article-header mb-2">
            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white tracking-tight leading-tight">
              {guide.title}
            </h1>

            {/* Meta Labels */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400">
                <User className="w-3.5 h-3.5 mr-1.5 text-pink-400" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {guide.author}
                </span>
              </div>
              <div className="flex items-center bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400">
                <Layers className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {guide.level}
                </span>
              </div>
              <div className="flex items-center bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400">
                <FileText className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
                <span className="text-xs font-semibold uppercase tracking-wider">
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
          <div className="lg:col-span-2 space-y-10">
            {/* Introduction */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tóm tắt & Giới thiệu
                </h2>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
                <p className="text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-pink-500">
                  {guide.desc}
                </p>
              </div>
            </section>

            {/* Main Content */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Nội dung hướng dẫn
                </h2>
              </div>
              <div
                className="prose prose-sm md:prose-base prose-invert max-w-none
                  prose-headings:font-bold prose-headings:tracking-tight
                  prose-h1:text-2xl prose-h1:mb-4 prose-h1:text-white prose-h1:pb-2 prose-h1:border-b prose-h1:border-slate-800
                  prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:text-slate-105 prose-h2:pb-1 prose-h2:border-b prose-h2:border-slate-800/60
                  prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 prose-h3:text-slate-200
                  prose-p:text-slate-300 prose-p:leading-7 prose-p:mb-4
                  prose-strong:text-white prose-strong:font-bold
                  prose-em:text-pink-300 prose-em:italic
                  prose-a:text-pink-400 prose-a:no-underline hover:prose-a:text-pink-300 hover:prose-a:underline prose-a:transition-colors
                  prose-code:text-orange-400 prose-code:bg-slate-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none prose-code:border prose-code:border-slate-800
                  prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl prose-pre:shadow-sm
                  prose-ul:text-slate-300 prose-ul:my-4
                  prose-ol:text-slate-300 prose-ol:my-4
                  prose-li:my-1.5 prose-li:leading-6
                  prose-blockquote:border-l-2 prose-blockquote:border-pink-500 prose-blockquote:bg-slate-900/50 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:italic prose-blockquote:text-slate-400 prose-blockquote:rounded-r-lg
                  prose-img:rounded-xl prose-img:shadow-sm prose-img:my-6
                  prose-hr:border-slate-800 prose-hr:my-8
                  prose-table:border prose-table:border-slate-800 prose-table:rounded-lg prose-table:overflow-hidden
                  prose-th:bg-slate-900 prose-th:text-slate-200 prose-th:font-semibold prose-th:px-3 prose-th:py-2
                  prose-td:border-slate-800 prose-td:px-3 prose-td:py-2"
                dangerouslySetInnerHTML={{ __html: guide.htmlContent }}
              />
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-10 space-y-6 animate-in fade-in slide-in-from-right-4 duration-700" style={{ animationDelay: '200ms' }}>
              {/* Author Card */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
                <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-6 pb-4 border-b border-slate-800">
                  Thông tin bài viết
                </h3>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center group/item hover:bg-slate-800/30 p-2.5 rounded-lg transition-colors">
                    <span className="text-xs font-medium text-slate-450">
                      Tác giả
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {guide.author}
                    </span>
                  </li>
                  <li className="flex justify-between items-center group/item hover:bg-slate-800/30 p-2.5 rounded-lg transition-colors">
                    <span className="text-xs font-medium text-slate-450">
                      Cấp độ
                    </span>
                    <span className="text-xs font-bold text-pink-400 uppercase">
                      {guide.level}
                    </span>
                  </li>
                  <li className="flex justify-between items-center group/item hover:bg-slate-800/30 p-2.5 rounded-lg transition-colors">
                    <span className="text-xs font-medium text-slate-450">
                      Định dạng
                    </span>
                    <span className="text-xs font-semibold text-orange-450">
                      {guide.type}
                    </span>
                  </li>
                  <li className="flex justify-between items-center group/item hover:bg-slate-800/30 p-2.5 rounded-lg transition-colors">
                    <span className="text-xs font-medium text-slate-450 flex items-center gap-1.5">
                      <Clock size={12} />
                      Thời gian đọc
                    </span>
                    <span className="text-xs font-semibold text-slate-355">
                      ~10 phút
                    </span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
                <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-4">
                  Hành động
                </h3>
                <div className="space-y-2">
                  <button 
                      onClick={handleSaveGuide}
                      className={`w-full px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors border flex items-center justify-center gap-2
                      ${isSaved 
                          ? 'bg-slate-800 hover:bg-slate-700 text-pink-400 border border-pink-500/20' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                      }`}
                  >
                    {isSaved ? (
                        <>
                          <BookmarkCheck className="w-3.5 h-3.5" />
                          Đã lưu
                        </>
                    ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" />
                          Lưu hướng dẫn
                        </>
                    )}
                  </button>
                  <button 
                      onClick={handleMarkAsRead}
                      className={`w-full px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2
                      ${isRead 
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm' 
                          : 'bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                      }`}
                  >
                    {isRead ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Đã đọc
                        </>
                    ) : (
                        "Đánh dấu đã đọc"
                    )}
                  </button>
                  <button 
                      onClick={handlePrint}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors border border-slate-700 flex items-center justify-center gap-2"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    In tài liệu
                  </button>
                </div>
              </div>

              {/* Info Note */}
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-500 leading-relaxed italic">
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
