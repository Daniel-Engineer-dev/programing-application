"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Map, CheckCircle2, Circle, Bookmark, BookmarkCheck } from "lucide-react";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { db } from "@/src/api/firebase/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

// --- Interfaces ---
interface Lesson {
  id: string;
  title: string;
  ref: string;
  desc?: string;
  backgroundImage?: string;
}

interface PathDetailData {
  id: string;
  title: string;
  desc: string;
  backgroundImage?: string;
  lessons: Lesson[];
}

export default function PathDetail() {
  const { id } = useParams<{ id: string }>();
  const [path, setPath] = useState<PathDetailData | null>(null);
  const { user } = useAuthContext();
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await fetch(`/routes/explore/api/explore/path/${id}`);
        if (!res.ok) {
            if (res.status === 404) {
                setError(true);
                return;
            }
            throw new Error(`Status: ${res.status}`);
        }
        const data: PathDetailData = await res.json();
        
        // Dynamically fetch Topic Details (desc, image) to minimize stored path data
        if (data.lessons && data.lessons.length > 0) {
            const enrichedLessons = await Promise.all(data.lessons.map(async (lesson) => {
                // If data is missing (optimized storage), fetch from Topic
                if (!lesson.desc || !lesson.backgroundImage) {
                    try {
                        const topicRef = doc(db, "topics", lesson.ref);
                        const topicSnap = await getDoc(topicRef);
                        if (topicSnap.exists()) {
                            const topicData = topicSnap.data();
                            return {
                                ...lesson,
                                desc: topicData.desc || lesson.desc || "",
                                backgroundImage: topicData.backgroundImage || lesson.backgroundImage || ""
                            };
                        }
                    } catch (e) {
                        console.error("Error fetching topic details:", e);
                    }
                }
                return lesson;
            }));
            data.lessons = enrichedLessons;
        }

        setPath(data);
      } catch (error) {
        console.error("Error loading path detail:", error);
        // Treat fetch errors (like network fail or JSON parse fail) as generic error for now, 
        // or specifically strictly as 404 if we want. But usually safe to show Error UI.
        setError(true);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!user || !path || path.lessons.length === 0) return;

    const checkProgress = async () => {
        const completed = new Set<string>();
        for (const lesson of path.lessons) {
            try {
                // lesson.ref is the topic id
                const ref = doc(db, "users", user.uid, "interactions", `topic_${lesson.ref}`);
                const snap = await getDoc(ref);
                if (snap.exists() && snap.data().completed) {
                    completed.add(lesson.ref);
                }
            } catch (e) {
                console.error(e);
            }
        }
        setCompletedLessonIds(completed);
        const percent = Math.round((completed.size / path.lessons.length) * 100);
        setProgress(percent);

        // Auto-mark Path as Completed
        if (user) {
            try {
                const isPathCompleted = percent === 100;
                const pathRef = doc(db, "users", user.uid, "interactions", `path_${path.id}`);
                // Only update if necessary (to reduce writes/toasts could require fetching first, but merge is safe)
                await setDoc(pathRef, {
                    completed: isPathCompleted,
                    type: 'path',
                    updatedAt: serverTimestamp()
                }, { merge: true });
            } catch (err) {
                console.error("Error auto-completing path:", err);
            }
        }
    };
    checkProgress();
  }, [user, path]);

  // Fetch Saved State
  useEffect(() => {
    if (!user || !id) return;
    const checkSaved = async () => {
        try {
            const ref = doc(db, "users", user.uid, "interactions", `path_${id}`);
            const snap = await getDoc(ref);
            if (snap.exists() && snap.data().saved) {
                setIsSaved(true);
            }
        } catch (e) {
            console.error(e);
        }
    };
    checkSaved();
  }, [user, id]);

  const handleSavePath = async () => {
    if (!user) {
        toast.error("Vui lòng đăng nhập để lưu lộ trình");
        return;
    }
    try {
        const newState = !isSaved;
        setIsSaved(newState);
        const ref = doc(db, "users", user.uid, "interactions", `path_${id}`);
        await setDoc(ref, {
            saved: newState,
            type: 'path',
            updatedAt: serverTimestamp()
        }, { merge: true });

        if (newState) toast.success("Đã lưu lộ trình");
        else toast.info("Đã bỏ lưu lộ trình");
    } catch (e) {
        setIsSaved(!isSaved);
        toast.error("Có lỗi xảy ra");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-4">
          <h1 className="text-4xl font-bold text-slate-200 mb-4">404</h1>
          <p className="text-slate-400 mb-8">Không tìm thấy lộ trình này hoặc đã bị xóa.</p>
          <Link href="/routes/explore" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold transition-all">
              Quay lại Khám Phá
          </Link>
      </div>
    )
  }

  if (!path)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="w-16 h-16 border-4 border-slate-700 border-t-purple-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 rounded-full animate-ping" />
          </div>
          <p className="text-lg text-slate-400 animate-pulse">Đang tải lộ trình...</p>
        </div>
      </div>
    );

  const baseUrl = "/routes/explore/explorePage";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Hero Header */}
      <div className="relative w-full h-[400px] md:h-[450px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
          style={{
            backgroundImage: `url('${
              path.backgroundImage ||
              "https://images.unsplash.com/photo-1517694712202-14dd9538aa97"
            }')`,
          }}
        />
        
        {/* Enhanced Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-slate-900/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20" />

        <div className="relative z-10 max-w-6xl mx-auto h-full flex flex-col justify-end p-6 md:p-12">
          {/* Back Button with Glow */}
          <Link
            href="/routes/explore"
            className="absolute top-10 left-6 md:left-12 flex items-center text-slate-100/80 hover:text-white transition-all duration-300 group"
          >
            <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/10 rounded-lg blur-xl transition-all duration-300" />
            <ArrowLeft className="relative w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="relative text-xs font-semibold tracking-widest uppercase">
              Quay lại
            </span>
          </Link>

          {/* Icon Badge */}
          <div className="inline-flex mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl blur-lg opacity-50" />
              <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-xl">
                <Map size={24} className="text-white" />
              </div>
            </div>
          </div>

          {/* Title with Gradient */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent leading-tight">
            {path.title}
          </h1>
          <p className="text-slate-300 text-xl leading-relaxed max-w-3xl italic">
            {path.desc}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto p-6 md:p-12">
        {/* Section Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-12 w-1.5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Nội dung lộ trình
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {path.lessons.length} bài học · Học theo trình tự
            </p>
          </div>
        </div>

        {path.lessons.length > 0 ? (
          <div className="grid gap-6">
            {path.lessons.map((lesson, index) => (
              <Link
                key={lesson.ref}
                href={`${baseUrl}/topic/${lesson.ref}`}
                className="group relative overflow-hidden rounded-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/20"
                style={{
                  animation: `fade-in 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-10"
                  style={{
                    backgroundImage: `url('${
                      lesson.backgroundImage ||
                      "https://images.unsplash.com/photo-1555066931-4365d14bab8c"
                    }')`,
                  }}
                />
                
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/90" />

                {/* Gradient Border on Hover */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-500" />

                {/* Content */}
                <div className="relative flex items-center p-6 md:p-8 gap-6 border border-slate-700 group-hover:border-purple-500/50 rounded-2xl transition-colors duration-300">
                  {/* Number Badge with gradient */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
                      <div className="relative w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                        <span className="text-2xl font-bold text-white">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lesson Info */}
                  <div className="flex-grow min-w-0">
                    <h3 className="text-2xl font-semibold text-white group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-pink-300 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 mb-2">
                      {lesson.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors line-clamp-2">
                      {lesson.desc}
                    </p>
                    
                    {/* Progress Indicator */}
                    <div className="flex items-center gap-2 mt-4">
                      {completedLessonIds.has(lesson.ref) ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-green-400 uppercase tracking-wider font-semibold">
                              Đã hoàn thành
                            </span>
                          </>
                      ) : (
                          <>
                            <Circle className="w-3 h-3 text-slate-600" />
                            <span className="text-xs text-slate-500 uppercase tracking-wider">
                              Chưa hoàn thành
                            </span>
                          </>
                      )}
                    </div>
                  </div>

                  {/* Arrow Icon */}
                  <div className="flex-shrink-0 text-slate-600 group-hover:text-purple-400 transition-all duration-300 group-hover:translate-x-1">
                    <ArrowLeft className="w-6 h-6 rotate-180" />
                  </div>
                </div>

                {/* Bottom Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-2xl" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-800">
            <div className="inline-flex mb-4">
              <div className="p-4 bg-slate-800 rounded-2xl">
                <Map size={48} className="text-slate-600" />
              </div>
            </div>
            <p className="text-slate-400 font-medium text-lg">
              Lộ trình này đang được cập nhật nội dung
            </p>
            <p className="text-slate-600 text-sm mt-2">
              Vui lòng quay lại sau
            </p>
          </div>
        )}

        {/* Progress Summary */}
        {path.lessons.length > 0 && (
          <div className="mt-12 p-8 bg-gradient-to-r from-slate-900/50 to-slate-900/30 backdrop-blur-xl rounded-2xl border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Tiến độ học tập
                </h3>
                <p className="text-sm text-slate-400">
                  Hoàn thành {completedLessonIds.size}/{path.lessons.length} bài học
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {progress}%
                </div>
                <p className="text-xs text-slate-500 mt-1">Hoàn thành</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSavePath}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 font-semibold text-sm
                    ${isSaved 
                        ? 'bg-purple-900/50 border-purple-500/50 text-purple-200' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                    }`}
                >
                    {isSaved ? (
                        <>
                            <BookmarkCheck className="w-4 h-4" />
                            Đã lưu lộ trình
                        </>
                    ) : (
                        <>
                            <Bookmark className="w-4 h-4" />
                            Lưu lộ trình
                        </>
                    )}
                </button>
            </div>

            <div className="mt-6 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
