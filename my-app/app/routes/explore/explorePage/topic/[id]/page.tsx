"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PlayCircle, Layers, FileText } from "lucide-react";

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

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await fetch(`/routes/explore/api/explore/topic/${id}`);
        const data = await res.json();
        setTopic(data);
      } catch (e) {
        console.error("Fetch error:", e);
      }
    };
    load();
  }, [id]);

  if (!topic)
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        Đang tải...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans antialiased">
      {/* 1. HERO HEADER: Định dạng font chữ thanh lịch và dễ nhìn */}
      <div className="relative w-full h-[350px] md:h-[400px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${
              topic.backgroundImage ||
              "https://images.unsplash.com/photo-1517694712202-14dd9538aa97"
            }')`,
          }}
        />
        {/* Lớp phủ dốc màu chuyên nghiệp */}
        <div className="absolute inset-0 bg-slate-900/40 bg-gradient-to-t from-slate-900 via-slate-900/10 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto h-full flex flex-col justify-end p-6 md:p-12">
          {/* Nút quay lại: Chữ mỏng và khoảng cách rộng (tracking-wide) */}
          <Link
            href="/routes/explore"
            className="absolute top-10 left-6 md:left-12 flex items-center text-slate-100/80 hover:text-white transition group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-semibold tracking-widest uppercase italic">
              Quay lại Khám phá
            </span>
          </Link>

          <header className="mb-6">
            {/* TIÊU ĐỀ: Sử dụng font-semibold với tracking-tight để giống mẫu */}
            <h1 className="text-4xl md:text-5xl font-semibold text-white leading-[1.2] tracking-tight mb-4 drop-shadow-md">
              {topic.title}
            </h1>

            {/* CÁC NHÃN META: Font chữ nhỏ, đậm và có độ giãn cách */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
                <Layers className="w-4 h-4 mr-2 text-blue-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  Cấp độ: {topic.level}
                </span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
                <FileText className="w-4 h-4 mr-2 text-slate-300" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  Loại: {topic.type}
                </span>
              </div>
            </div>
          </header>
        </div>
      </div>

      {/* 2. PHẦN NỘI DUNG CHI TIẾT */}
      <main className="max-w-5xl mx-auto p-6 md:p-12">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-12">
            {/* Tóm tắt: Font chữ Italic và leading thoáng */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-white tracking-tight border-b border-slate-800 pb-2">
                Introduction
              </h2>
              <div className="bg-slate-800/30 p-8 rounded-2xl border border-slate-800/50 shadow-sm">
                <p className="text-lg text-slate-300 leading-relaxed font-normal opacity-90">
                  "{topic.desc}"
                </p>
              </div>
            </section>

            {/* Nội dung bài giảng: Tối ưu typography cho văn bản dài */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-white tracking-tight border-b border-slate-800 pb-2">
                Chi tiết bài học
              </h2>
              <div
                className="prose prose-lg prose-invert max-w-none text-slate-300 leading-8 
                prose-p:font-normal prose-p:text-slate-300/90 prose-p:mb-6 
                prose-strong:text-white prose-strong:font-bold prose-headings:text-white"
                dangerouslySetInnerHTML={{ __html: topic.htmlContent }}
              />
            </section>
          </div>

          {/* SIDEBAR: Định dạng kiểu chữ thông tin theo dạng thẻ danh sách */}
          <aside className="md:col-span-1">
            <div className="sticky top-10 p-6 bg-slate-800/80 border border-slate-700 rounded-2xl shadow-xl backdrop-blur-sm">
              <h3 className="text-sm font-bold tracking-widest uppercase text-blue-500 mb-6 border-b border-slate-700 pb-4">
                Thông tin học tập
              </h3>
              <ul className="space-y-6">
                <li className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">
                    Trạng thái:
                  </span>
                  <span className="text-sm font-semibold text-white">
                    Sẵn sàng
                  </span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">
                    Cấp độ:
                  </span>
                  <span className="text-sm font-bold text-blue-400 uppercase tracking-tight">
                    {topic.level}
                  </span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">
                    Định dạng:
                  </span>
                  <span className="text-sm font-semibold text-slate-200">
                    {topic.type}
                  </span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
