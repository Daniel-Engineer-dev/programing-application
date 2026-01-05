"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Layers, FileText, ArrowLeft, User } from "lucide-react";
import Link from "next/link";

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

  if (loading)
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="animate-pulse tracking-widest uppercase text-xs font-semibold">
          Đang tải nội dung...
        </div>
      </div>
    );

  if (fetchError || !guide)
    return (
      <div className="min-h-screen bg-slate-900 text-red-400 p-10 flex items-center justify-center">
        {fetchError}
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans antialiased">
      {/* 1. HERO HEADER: Typography thanh lịch và dễ nhìn */}
      <div className="relative w-full h-[350px] md:h-[450px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] scale-105"
          style={{
            backgroundImage: `url('${
              guide.backgroundImage ||
              "https://images.unsplash.com/photo-1517694712202-14dd9538aa97"
            }')`,
          }}
        />
        {/* Lớp phủ gradient sâu */}
        <div className="absolute inset-0 bg-slate-900/50 bg-gradient-to-t from-slate-900 via-slate-900/10 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto h-full flex flex-col justify-end p-6 md:p-12">
          {/* Nút quay lại kiểu mỏng tinh tế */}
          <Link
            href="/routes/explore"
            className="absolute top-10 left-6 md:left-12 flex items-center text-slate-100/80 hover:text-white transition group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase italic">
              Quay lại Khám phá
            </span>
          </Link>

          <header className="mb-6">
            {/* TIÊU ĐỀ: Font-semibold, tracking-tight cho độ sắc nét cao */}
            <h1 className="text-4xl md:text-5xl font-semibold text-white leading-[1.2] tracking-tight mb-6 drop-shadow-md">
              {guide.title}
            </h1>

            {/* CÁC NHÃN META: Giữ lại để cung cấp thông tin bài viết */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
                <User className="w-4 h-4 mr-2 text-blue-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  {guide.author}
                </span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
                <Layers className="w-4 h-4 mr-2 text-blue-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  {guide.level}
                </span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
                <FileText className="w-4 h-4 mr-2 text-slate-300" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  {guide.type}
                </span>
              </div>
            </div>
          </header>
        </div>
      </div>

      {/* 2. NỘI DUNG CHI TIẾT */}
      <main className="max-w-5xl mx-auto p-6 md:p-12">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-12">
            {/* Tóm tắt bài viết */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-white tracking-tight border-b border-slate-800 pb-2">
                Giới thiệu
              </h2>
              <div className="bg-slate-800/30 p-8 rounded-2xl border border-slate-800/50 shadow-sm">
                <p className="text-lg text-slate-300 leading-relaxed font-normal italic opacity-90">
                  "{guide.desc}"
                </p>
              </div>
            </section>

            {/* Nội dung chính: Tối ưu khoảng cách dòng giúp dễ đọc */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-white tracking-tight border-b border-slate-800 pb-2">
                Nội dung hướng dẫn
              </h2>
              <div
                className="prose prose-lg prose-invert max-w-none text-slate-300 leading-8 
                prose-p:font-normal prose-p:text-slate-300/90 prose-p:mb-6 
                prose-strong:text-white prose-strong:font-bold prose-headings:text-white"
                dangerouslySetInnerHTML={{ __html: guide.htmlContent }}
              />
            </section>
          </div>

          {/* SIDEBAR: Glassmorphism Card */}
          <aside className="md:col-span-1">
            <div className="sticky top-10 p-6 bg-slate-800/80 border border-slate-700 rounded-2xl shadow-xl backdrop-blur-sm">
              <h3 className="text-sm font-bold tracking-widest uppercase text-blue-500 mb-6 border-b border-slate-700 pb-4">
                Thông tin bài viết
              </h3>
              <ul className="space-y-6">
                <li className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">
                    Tác giả:
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {guide.author}
                  </span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">
                    Cấp độ:
                  </span>
                  <span className="text-sm font-bold text-blue-400 uppercase tracking-tight">
                    {guide.level}
                  </span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">
                    Định dạng:
                  </span>
                  <span className="text-sm font-semibold text-slate-200">
                    {guide.type}
                  </span>
                </li>
              </ul>
              <div className="mt-8 pt-6 border-t border-slate-700 text-[10px] text-slate-500 italic leading-relaxed">
                Tài liệu này được đồng bộ trực tiếp từ hệ thống quản trị
                Firebase Cloud Firestore.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
