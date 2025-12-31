"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { User, Layers, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Định nghĩa Interface (Standardized: Đổi 'desc' thành 'summary' để khớp với Firestore Guides)
interface GuideDetailData {
  title: string;
  author: string;
  level: string;
  type: string;
  desc: string;
  htmlContent: string;
  id?: string;
}

export default function GuideDetail() {
  const { id } = useParams<{ id: string }>();
  // Thêm trạng thái lỗi để xử lý fetch thất bại
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

        if (!res.ok) {
          // Bắt lỗi HTTP status khác 200
          throw new Error(
            `Failed to fetch guide details: Status ${res.status}`
          );
        }

        const data: GuideDetailData = await res.json();
        setGuide(data);
      } catch (e: any) {
        // Ghi lỗi và hiển thị thông báo lỗi
        console.error("Fetch error:", e.message);
        setFetchError(`Không thể tải nội dung chi tiết. Lỗi: ${e.message}`);
        setGuide(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // --- LOGIC HIỂN THỊ TRẠNG THÁI ---

  if (loading)
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center text-lg">
        Đang tải nội dung hướng dẫn...
      </div>
    );

  if (fetchError) {
    return (
      <div className="min-h-screen bg-slate-900 text-red-400 flex flex-col items-center justify-center p-10">
        <h1 className="text-2xl font-bold mb-4">Lỗi tải dữ liệu</h1>
        <p className="text-center">{fetchError}</p>
        <p className="text-sm text-slate-500 mt-4">
          Vui lòng kiểm tra Console để xem lỗi API Server (404/500).
        </p>
      </div>
    );
  }

  // Nếu tải xong mà guide vẫn null (không bao giờ xảy ra nếu logic đúng)
  if (!guide) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        {/* Nút Quay Lại (Đã sửa đường dẫn về /explore thông thường) */}
        <Link
          href="/routes/explore"
          className="flex items-center text-slate-400 hover:text-blue-400 mb-8 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Quay lại Khám phá
        </Link>

        {/* TIÊU ĐỀ & META */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-white leading-tight">
            {guide.title}
          </h1>
          <div className="flex flex-wrap items-center text-sm text-slate-400 space-x-4">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1 text-slate-500" />
              <span className="font-medium text-slate-300">
                Bởi {guide.author}
              </span>
            </div>
            <span className="flex items-center">
              <Layers className="w-4 h-4 mr-1 text-slate-500" />
              <span className="ml-1 font-medium capitalize text-blue-400">
                {guide.level}
              </span>
            </span>
            <span className="flex items-center">
              <FileText className="w-4 h-4 mr-1 text-slate-500" />
              Loại: {guide.type}
            </span>
          </div>
        </header>

        {/* TÓM TẮT & NỘI DUNG */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {/* Hộp desc  */}
            <h2 className="text-2xl font-bold mb-4 text-white border-b border-slate-700/50 pb-2">
              Tóm tắt
            </h2>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg mb-8">
              <p className="text-slate-300 leading-relaxed italic">
                "{guide.desc}"
              </p>
            </div>

            {/* PHẦN NỘI DUNG CHÍNH - LIÊN KẾT TỪ FIREBASE (HTML) */}
            <section className="mt-10">
              <h2 className="text-2xl font-bold mb-4 text-white border-b border-slate-700/50 pb-2">
                Nội dung bài viết
              </h2>

              {/* SỬ DỤNG DANGEROUSLYSETINNERHTML */}
              <div
                className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-slate-300 min-h-60 guide-content-rendered"
                dangerouslySetInnerHTML={{ __html: guide.htmlContent }}
              />
            </section>
          </div>

          {/* Sidebar */}
          <aside className="md:col-span-1">
            <div className="sticky top-10 p-4 bg-slate-800 rounded-xl border border-slate-700 shadow-xl">
              <h3 className="font-bold mb-3 border-b border-slate-700 pb-2 text-white">
                Thông tin nhanh
              </h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex justify-between">
                  <span className="font-medium text-slate-300">Tác giả:</span>
                  <span>{guide.author}</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium text-slate-300">Cấp độ:</span>
                  <span className="capitalize text-blue-400 font-medium">
                    {guide.level}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium text-slate-300">Loại:</span>
                  <span>{guide.type}</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
