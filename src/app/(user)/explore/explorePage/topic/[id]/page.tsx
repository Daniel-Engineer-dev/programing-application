"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PlayCircle, Layers, FileText, BookOpen, Check, Bookmark, BookmarkCheck, Printer } from "lucide-react";
import { useAuthContext } from "@/contexts/authContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

interface TopicDetailData {
  id: string;
  title: string;
  desc: string;
  level: string;
  type: string;
  htmlContent: string;
  videoUrl?: string;
  backgroundImage?: string;
}

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  const id = match && match[2].length === 11 ? match[2] : null;
  return id ? `https://www.youtube.com/embed/${id}` : null;
};

export default function TopicDetail() {
  const { id } = useParams<{ id: string }>();
  const [topic, setTopic] = useState<TopicDetailData | null>(null);
  const { user } = useAuthContext();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [interactionLoading, setInteractionLoading] = useState(true);

  // Fetch Topic Data
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await fetch(`/explore/api/explore/topic/${id}`);
        const data = await res.json();
        setTopic(data);
      } catch (e) {
        console.error("Fetch error:", e);
      }
    };
    load();
  }, [id]);

  // Fetch User Interaction
  useEffect(() => {
    if (!user || !id) {
        setInteractionLoading(false);
        return;
    }
    const checkInteraction = async () => {
      try {
        const ref = doc(db, "users", user.uid, "interactions", `topic_${id}`);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setIsCompleted(data.completed || false);
          setIsSaved(data.saved || false);
        }
      } catch (error) {
        console.error("Error fetching interaction:", error);
      } finally {
        setInteractionLoading(false);
      }
    };
    checkInteraction();
  }, [user, id]);

  const handleMarkComplete = async () => {
    if (!user) {
        toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
        return;
    }
    try {
        const newState = !isCompleted;
        setIsCompleted(newState); // Optimistic update
        const ref = doc(db, "users", user.uid, "interactions", `topic_${id}`);
        await setDoc(ref, { 
            completed: newState,
            type: 'topic',
            updatedAt: serverTimestamp() 
        }, { merge: true });
        
        if (newState) toast.success("Đã đánh dấu hoàn thành!");
    } catch (error) {
        setIsCompleted(!isCompleted); // Revert
        toast.error("Có lỗi xảy ra");
        console.error(error);
    }
  };

  const handleSaveToList = async () => {
    if (!user) {
        toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
        return;
    }
    try {
        const newState = !isSaved;
        setIsSaved(newState); // Optimistic update
        const ref = doc(db, "users", user.uid, "interactions", `topic_${id}`);
        await setDoc(ref, { 
            saved: newState,
            type: 'topic',
            updatedAt: serverTimestamp() 
        }, { merge: true });

        if (newState) toast.success("Đã lưu vào danh sách!");
        else toast.info("Đã xóa khỏi danh sách");
    } catch (error) {
        setIsSaved(!isSaved); // Revert
        toast.error("Có lỗi xảy ra");
        console.error(error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!topic)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500/20 rounded-full animate-ping" />
          </div>
          <p className="text-lg text-slate-400 animate-pulse">Đang tải bài học...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 text-white relative">
      {/* Hero Header */}
      <div className="relative w-full h-[280px] md:h-[320px] overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${
              topic.backgroundImage ||
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
              {topic.title}
            </h1>

            {/* Meta Labels */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400">
                <Layers className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {topic.level}
                </span>
              </div>
              <div className="flex items-center bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400">
                <FileText className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {topic.type}
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
            {/* Introduction Section */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tóm tắt & Giới thiệu
                </h2>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
                <p className="text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-blue-500">
                  {topic.desc}
                </p>
              </div>
            </section>

            {/* YouTube Video Section */}
            {topic.videoUrl && getYouTubeEmbedUrl(topic.videoUrl) && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '50ms' }}>
                <div className="flex items-center justify-between gap-2 mb-4 border-b border-slate-800 pb-2">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Video hướng dẫn
                  </h2>
                  <PlayCircle className="w-4 h-4 text-slate-400" />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  {/* Video Embed */}
                  <div className="relative pt-[56.25%]">
                    <iframe
                      src={getYouTubeEmbedUrl(topic.videoUrl) || ""}
                      className="absolute top-0 left-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="YouTube video"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Main Content Section */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Nội dung chi tiết
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
                  prose-em:text-slate-200 prose-em:italic
                  prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300 hover:prose-a:underline prose-a:transition-colors
                  prose-code:text-blue-400 prose-code:bg-slate-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none prose-code:border prose-code:border-slate-800
                  prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl prose-pre:shadow-sm
                  prose-ul:text-slate-300 prose-ul:my-4
                  prose-ol:text-slate-300 prose-ol:my-4
                  prose-li:my-1.5 prose-li:leading-6
                  prose-blockquote:border-l-2 prose-blockquote:border-slate-700 prose-blockquote:bg-slate-900/50 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:italic prose-blockquote:text-slate-400 prose-blockquote:rounded-r-lg
                  prose-img:rounded-xl prose-img:shadow-sm prose-img:my-6
                  prose-hr:border-slate-800 prose-hr:my-8
                  prose-table:border prose-table:border-slate-800 prose-table:rounded-lg prose-table:overflow-hidden
                  prose-th:bg-slate-900 prose-th:text-slate-200 prose-th:font-semibold prose-th:px-3 prose-th:py-2
                  prose-td:border-slate-800 prose-td:px-3 prose-td:py-2"
                dangerouslySetInnerHTML={{ __html: topic.htmlContent }}
              />
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-10 space-y-6 animate-in fade-in slide-in-from-right-4 duration-700" style={{ animationDelay: '200ms' }}>
              {/* Info Card */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
                <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-6 pb-4 border-b border-slate-800">
                  Thông tin bài học
                </h3>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center group/item hover:bg-slate-800/30 p-2.5 rounded-lg transition-colors">
                    <span className="text-xs font-medium text-slate-450">
                      Trạng thái
                    </span>
                    <span className="text-xs font-semibold text-green-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      Sẵn sàng
                    </span>
                  </li>
                  <li className="flex justify-between items-center group/item hover:bg-slate-800/30 p-2.5 rounded-lg transition-colors">
                    <span className="text-xs font-medium text-slate-450">
                      Cấp độ
                    </span>
                    <span className="text-xs font-bold text-blue-400 uppercase">
                      {topic.level}
                    </span>
                  </li>
                  <li className="flex justify-between items-center group/item hover:bg-slate-800/30 p-2.5 rounded-lg transition-colors">
                    <span className="text-xs font-medium text-slate-450">
                      Định dạng
                    </span>
                    <span className="text-xs font-semibold text-purple-400">
                      {topic.type}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
                <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-4">
                  Hành động
                </h3>
                <div className="space-y-2">
                  <button 
                      onClick={handleMarkComplete}
                      className={`w-full px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2
                      ${isCompleted 
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                  >
                    {isCompleted ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Đã hoàn thành
                        </>
                    ) : (
                        "Đánh dấu hoàn thành"
                    )}
                  </button>
                  <button 
                      onClick={handleSaveToList}
                      className={`w-full px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors border flex items-center justify-center gap-2
                      ${isSaved
                          ? 'bg-blue-900/30 border-blue-500/20 text-blue-400'
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
                          Lưu vào danh sách
                        </>
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
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
