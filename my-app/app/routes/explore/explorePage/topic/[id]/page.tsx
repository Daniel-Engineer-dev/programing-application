"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Database,
  Code2,
  Terminal,
  ArrowLeft,
  Layers,
  FileText,
  PlayCircle,
} from "lucide-react";

interface TopicDetailData {
  id: string;
  title: string;
  desc: string;
  icon: string;
  level: string;
  type: string;
  htmlContent: string;
  videoUrl?: string;
  order: number;
}

// Hàm hỗ trợ lấy ID từ URL YouTube để tạo link Embed
const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  const id = match && match[2].length === 11 ? match[2] : null;
  return id ? `https://www.youtube.com/embed/${id}` : null;
};

const renderIcon = (icon: string) => {
  if (icon === "database") return <Database className="w-8 h-8" />;
  if (icon === "terminal") return <Terminal className="w-8 h-8" />;
  return <Code2 className="w-8 h-8" />;
};

export default function TopicDetail() {
  const { id } = useParams<{ id: string }>();
  const [topic, setTopic] = useState<TopicDetailData | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await fetch(`/routes/explore/api/explore/topic/${id}`);

        if (!res.ok) {
          throw new Error(
            `Failed to fetch topic details: Status ${res.status}`
          );
        }

        const data: TopicDetailData = await res.json();
        setTopic(data);
      } catch (e) {
        console.error("Fetch error:", e);
        setTopic(null);
      }
    };
    load();
  }, [id]);

  if (!topic)
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center text-lg pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <h1 className="text-2xl font-bold mb-2">Đang tải dữ liệu...</h1>
        <p className="text-slate-400">Vui lòng chờ trong giây lát.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/routes/explore"
          className="flex items-center text-slate-400 hover:text-blue-400 mb-8 transition group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Quay lại Khám phá
        </Link>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-3/4">
            {/* 1. Header: Icon & Title */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-shrink-0 h-14 w-14 flex items-center justify-center rounded-xl bg-blue-600/10 text-blue-500 border border-blue-500/20">
                {renderIcon(topic.icon)}
              </div>
              <h1 className="text-4xl font-extrabold text-white leading-tight">
                {topic.title}
              </h1>
            </div>

            {/* 2. Meta Tags */}
            <div className="flex flex-wrap items-center text-sm text-slate-400 gap-3 mb-6">
              <span className="flex items-center bg-slate-800 rounded-full px-3 py-1 border border-slate-700">
                <Layers className="w-4 h-4 mr-1 text-blue-500" />
                Cấp độ:{" "}
                <span className="ml-1 font-medium capitalize text-blue-400">
                  {topic.level}
                </span>
              </span>
              <span className="flex items-center bg-slate-800 rounded-full px-3 py-1 border border-slate-700">
                <FileText className="w-4 h-4 mr-1 text-slate-500" />
                Loại: {topic.type}
              </span>
            </div>

            {/* 3. Tóm tắt (Desc) */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-lg mb-10">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Tóm tắt chủ đề
              </h2>
              <p className="text-slate-300 leading-relaxed italic">
                "{topic.desc}"
              </p>
            </div>

            {/* 4. Video Section (MỚI) */}
            {topic.videoUrl && (
              <section className="mb-10">
                <div className="flex items-center space-x-2 mb-4">
                  <PlayCircle className="w-6 h-6 text-red-500" />
                  <h2 className="text-2xl font-bold text-white">
                    Video bài giảng
                  </h2>
                </div>
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-700 bg-black shadow-2xl">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={getYouTubeEmbedUrl(topic.videoUrl) || ""}
                    title={topic.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              </section>
            )}

            {/* 5. Nội dung chi tiết */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-white border-b border-slate-700/50 pb-2">
                Nội dung chi tiết
              </h2>
              <div
                className="bg-slate-800/30 p-6 rounded-xl border border-slate-700 text-slate-300 min-h-60 guide-content-rendered prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: topic.htmlContent }}
              />
            </section>
          </div>

          {/* Sidebar */}
          <aside className="md:w-1/4">
            <div className="sticky top-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <h3 className="font-bold mb-4 text-blue-400">
                Thông tin bổ sung
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bài học này thuộc chương trình đào tạo lập trình cơ bản. Hãy đảm
                bảo bạn đã nắm vững các kiến thức trước đó.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
