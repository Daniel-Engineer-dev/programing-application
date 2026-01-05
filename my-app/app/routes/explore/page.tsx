"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

// --- Interfaces ---
// Đảm bảo tất cả các interface đều có thuộc tính backgroundImage
interface Topic {
  id: string;
  title: string;
  desc: string;
  backgroundImage?: string;
}
interface Path {
  id: string;
  title: string;
  desc: string;
  backgroundImage?: string;
}
interface Guide {
  id: string;
  title: string;
  author: string;
  level: string;
  backgroundImage?: string;
}

export default function ExplorePage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. TẢI DỮ LIỆU TỪ API
  useEffect(() => {
    async function loadData() {
      try {
        // Fetch topics and learning paths
        const res1 = await fetch("/routes/explore/api/explore");
        const data1 = await res1.json();
        setTopics(data1.topics || []);
        setPaths(data1.learningPaths || []);

        // Fetch guides
        const res2 = await fetch("/routes/explore/api/explore/guides");
        const data2 = await res2.json();
        const fetchedGuides = Array.isArray(data2) ? data2 : data2.guides || [];
        setGuides(fetchedGuides);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const baseUrl = "/routes/explore/explorePage";

  // 2. COMPONENT CARD DÙNG CHUNG - Hiển thị background riêng biệt
  const CustomCard = ({ href, title, subtitle, badge, bgImage }: any) => (
    <Link
      href={href}
      className="group relative block h-48 w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 transition-all shadow-lg"
    >
      {/* Hình nền riêng cho mỗi card */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
        style={{
          // Sử dụng link từ Firestore, nếu không có sẽ lấy ảnh mặc định
          backgroundImage: `url('${
            bgImage ||
            "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070"
          }')`,
        }}
      />

      {/* Lớp phủ tối (Overlay) để chữ nổi bật trên mọi loại hình nền */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-80" />

      {/* Nội dung chữ đè lên ảnh */}
      <div className="absolute bottom-0 left-0 p-5 w-full">
        {badge && (
          <span className="px-2 py-0.5 rounded bg-blue-600 text-[10px] font-bold uppercase text-white mb-2 inline-block">
            {badge}
          </span>
        )}
        <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 drop-shadow-md">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-slate-200 mt-1 line-clamp-1 opacity-90">
            {subtitle}
          </p>
        )}
      </div>
    </Link>
  );

  if (loading)
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {/* Header & Search */}
      <div className="text-center pt-16 pb-10">
        <h1 className="text-4xl font-bold mb-4 text-white">
          Khám phá lập trình
        </h1>
        <div className="relative mx-auto max-w-xl px-4">
          <input
            placeholder="Tìm kiếm chủ đề..."
            className="w-full rounded-xl bg-slate-800 py-3.5 px-12 text-sm text-white outline-none border border-slate-700 focus:ring-2 focus:ring-blue-600"
          />
          <Search
            className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500"
            size={18}
          />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 pb-20">
        {/* PHẦN CHỦ ĐỀ - Mỗi cái 1 hình */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-white mb-6">Chủ đề phổ biến</h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {topics.map((t) => (
              <CustomCard
                key={t.id}
                href={`${baseUrl}/topic/${t.id}`}
                title={t.title}
                subtitle={t.desc}
                bgImage={t.backgroundImage} // Lấy hình riêng từ Firestore
              />
            ))}
          </div>
        </section>

        {/* PHẦN LỘ TRÌNH - Mỗi cái 1 hình */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-white mb-6">
            Lộ trình học tập
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {paths.map((p) => (
              <CustomCard
                key={p.id}
                href={`${baseUrl}/path/${p.id}`}
                title={p.title}
                subtitle={p.desc}
                badge="Lộ trình"
                bgImage={p.backgroundImage} // Lấy hình riêng từ Firestore
              />
            ))}
          </div>
        </section>

        {/* PHẦN HƯỚNG DẪN - Mỗi cái 1 hình */}
        <section>
          <h2 className="text-xl font-bold text-white mb-6">
            Hướng dẫn mới nhất
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {guides.map((g) => (
              <CustomCard
                key={g.id}
                href={`${baseUrl}/guide/${g.id}`}
                title={g.title}
                subtitle={`Tác giả: ${g.author}`}
                badge={g.level}
                bgImage={g.backgroundImage} // Lấy hình riêng từ Firestore
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
