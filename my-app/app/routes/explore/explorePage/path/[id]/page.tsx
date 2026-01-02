"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// --- Interfaces ---
interface Lesson {
  id: string;
  title: string;
  ref: string;
  desc: string;
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

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await fetch(`/routes/explore/api/explore/path/${id}`);
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        const data: PathDetailData = await res.json();
        setPath(data);
      } catch (error) {
        console.error("Error loading path detail:", error);
        setPath(null);
      }
    };
    load();
  }, [id]);

  if (!path)
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center text-lg">
        <div className="animate-pulse tracking-widest uppercase text-sm">
          Đang tải lộ trình...
        </div>
      </div>
    );

  const baseUrl = "/routes/explore/explorePage";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans antialiased">
      {/* 1. HEADER VỚI KIỂU CHỮ THANH LỊCH */}
      <div className="relative w-full h-[350px] md:h-[400px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] scale-105"
          style={{
            backgroundImage: `url('${
              path.backgroundImage ||
              "https://images.unsplash.com/photo-1517694712202-14dd9538aa97"
            }')`,
          }}
        />
        <div className="absolute inset-0 bg-slate-900/50 bg-gradient-to-t from-slate-900 via-slate-900/10 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto h-full flex flex-col justify-end p-6 md:p-12">
          {/* Nút quay lại kiểu mỏng */}
          <Link
            href="/routes/explore"
            className="absolute top-10 left-6 md:left-12 flex items-center text-slate-100/80 hover:text-white transition group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase italic">
              Quay lại Khám phá
            </span>
          </Link>

          {/* Tiêu đề lộ trình font-semibold */}
          <h1 className="text-4xl md:text-5xl font-semibold text-white leading-[1.2] tracking-tight mb-4 drop-shadow-md">
            {path.title}
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-2xl font-normal opacity-90 italic">
            {path.desc}
          </p>
        </div>
      </div>

      {/* 2. NỘI DUNG BÀI HỌC TỐI GIẢN (ĐÃ BỎ ICON TÍM/XANH) */}
      <main className="max-w-5xl mx-auto p-6 md:p-12">
        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-blue-500 mb-8 border-l-4 border-blue-600 pl-4">
          Nội dung lộ trình ({path.lessons.length} bài học)
        </h2>

        {path.lessons.length > 0 ? (
          <div className="grid gap-6">
            {path.lessons.map((lesson, index) => (
              <Link
                key={lesson.ref}
                href={`${baseUrl}/topic/${lesson.ref}`}
                className="group relative flex flex-col md:flex-row gap-5 overflow-hidden rounded-[2rem] border border-slate-800 hover:border-blue-500/40 transition-all shadow-xl min-h-[100px]"
              >
                {/* Background Image cho từng bài học mờ ảo */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-20"
                  style={{
                    backgroundImage: `url('${
                      lesson.backgroundImage ||
                      "https://images.unsplash.com/photo-1555066931-4365d14bab8c"
                    }')`,
                  }}
                />
                <div className="absolute inset-0 bg-slate-900/80 group-hover:bg-slate-900/60 transition-colors" />

                {/* Nội dung bài học con với kiểu chữ sắc nét */}
                <div className="relative z-10 flex items-center p-8 w-full">
                  <div className="flex-grow">
                    <h3 className="text-white text-xl font-semibold tracking-tight group-hover:text-blue-400 transition-colors">
                      <span className="text-blue-500/50 mr-2 font-light italic">
                        {index + 1}.
                      </span>{" "}
                      {lesson.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-2 font-normal leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                      {lesson.desc}
                    </p>
                  </div>

                  <div className="hidden md:block ml-4 text-slate-700 group-hover:text-blue-400 transition-all group-hover:translate-x-1">
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-slate-800/20 rounded-[3rem] border border-dashed border-slate-800">
            <p className="text-slate-500 tracking-widest uppercase text-xs font-bold">
              Lộ trình này đang được cập nhật nội dung.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
