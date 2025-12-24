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
} from "lucide-react";

interface TopicDetailData {
  id: string;
  title: string;
  desc: string;
  icon: string;
  level: string;
  type: string;
  htmlContent: string; // Nội dung HTML đã được xử lý từ Server
  order: number;
}

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
        const res = await fetch(`/api/explore/topic/${id}`);

        if (!res.ok) {
          // Hiển thị lỗi fetch rõ ràng
          throw new Error(
            `Failed to fetch topic details: Status ${res.status}`
          );
        }

        const data: TopicDetailData = await res.json();
        setTopic(data);
      } catch (e) {
        console.error("Fetch error:", e);
        // THÊM: Nếu lỗi, đặt topic là null để hiển thị màn hình lỗi/tải
        setTopic(null);
      }
    };
    load();
  }, [id]);

  if (!topic)
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center text-lg pt-20">
        <h1 className="text-2xl font-bold mb-4">Lỗi hoặc Đang tải</h1>
        <p className="text-slate-400">
          Vui lòng kiểm tra Console để xem lỗi API Server.
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/routes/explore"
          className="flex items-center text-slate-400 hover:text-blue-400 mb-8 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Quay lại Khám phá
        </Link>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-3/4">
            {/* Tiêu đề, Icon, Meta */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-shrink-0 h-14 w-14 flex items-center justify-center rounded-xl bg-blue-600/10 text-blue-500">
                {renderIcon(topic.icon)}
              </div>
              <h1 className="text-4xl font-extrabold text-white leading-tight">
                {topic.title}
              </h1>
            </div>
            <div className="flex flex-wrap items-center text-sm text-slate-400 space-x-4 mb-6">
              <span className="flex items-center bg-slate-800 rounded-full px-3 py-1">
                <Layers className="w-4 h-4 mr-1 text-blue-500" />
                Cấp độ:{" "}
                <span className="ml-1 font-medium capitalize text-blue-400">
                  {topic.level}
                </span>
              </span>
              <span className="flex items-center bg-slate-800 rounded-full px-3 py-1">
                <FileText className="w-4 h-4 mr-1 text-slate-500" />
                Loại: {topic.type}
              </span>
            </div>

            {/* 3. Mô tả ngắn (desc) */}
            <h2 className="text-xl font-bold mb-3 text-white">
              Tóm tắt chủ đề
            </h2>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
              <p className="text-slate-300 leading-relaxed italic">
                "{topic.desc}"
              </p>
            </div>

            {/* 4. Nội dung chi tiết (htmlContent) */}
            <section className="mt-10">
              <h2 className="text-2xl font-bold mb-4 text-white border-b border-slate-700/50 pb-2">
                Nội dung chi tiết
              </h2>

              <div
                className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-slate-300 min-h-60 guide-content-rendered"
                dangerouslySetInnerHTML={{ __html: topic.htmlContent }}
              />
            </section>
          </div>

          {/* Sidebar (Mục lục hoặc các chủ đề liên quan) */}
          <aside className="md:w-1/4">
            {/* Nội dung Sidebar giữ nguyên */}
          </aside>
        </div>
      </div>
    </div>
  );
}
