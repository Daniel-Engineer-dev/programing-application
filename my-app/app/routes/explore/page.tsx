"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Search, Map, FileText } from "lucide-react";

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
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  // Filter data based on search query with useMemo to prevent unnecessary re-computation
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return topics;
    return topics.filter(
      (topic) =>
        topic?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic?.desc?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [topics, searchQuery]);

  const filteredPaths = useMemo(() => {
    if (!searchQuery.trim()) return paths;
    return paths.filter(
      (path) =>
        path?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        path?.desc?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [paths, searchQuery]);

  const filteredGuides = useMemo(() => {
    if (!searchQuery.trim()) return guides;
    return guides.filter(
      (guide) =>
        guide?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide?.author?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [guides, searchQuery]);

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
          <div
            className={`relative flex items-center rounded-2xl border transition-all ${
              searchFocused
                ? "border-blue-600 ring-2 ring-blue-600"
                : "border-slate-700"
            } bg-slate-800`}
          >
            <Search
              className="absolute left-5 text-slate-500"
              size={18}
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Tìm kiếm chủ đề, lộ trình, hướng dẫn..."
              className="w-full rounded-2xl bg-transparent py-4 px-14 text-base text-white placeholder:text-slate-500 outline-none"
            />
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 pb-20">
        {/* PHẦN CHỦ ĐỀ - Mỗi cái 1 hình */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-white">Chủ đề phổ biến</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-700 via-slate-800 to-transparent" />
            {searchQuery && (
              <span className="text-sm text-slate-400">
                {filteredTopics.length} kết quả
              </span>
            )}
          </div>
          {filteredTopics.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {filteredTopics.map((t) => (
                <CustomCard
                  key={t.id}
                  href={`${baseUrl}/topic/${t.id}`}
                  title={t.title}
                  subtitle={t.desc}
                  bgImage={t.backgroundImage} // Lấy hình riêng từ Firestore
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <p>Không tìm thấy chủ đề nào phù hợp</p>
            </div>
          )}
        </section>

        {/* PHẦN LỘ TRÌNH - Mỗi cái 1 hình */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-white">Lộ trình học tập</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-700 via-slate-800 to-transparent" />
            {searchQuery && (
              <span className="text-sm text-slate-400">
                {filteredPaths.length} kết quả
              </span>
            )}
          </div>
          {filteredPaths.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredPaths.map((p) => (
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
          ) : (
            <div className="text-center py-16 text-slate-500">
              <Map size={48} className="mx-auto mb-4 opacity-50" />
              <p>Không tìm thấy lộ trình nào phù hợp</p>
            </div>
          )}
        </section>

        {/* PHẦN HƯỚNG DẪN - Mỗi cái 1 hình */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-white">Hướng dẫn mới nhất</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-700 via-slate-800 to-transparent" />
            {searchQuery && (
              <span className="text-sm text-slate-400">
                {filteredGuides.length} kết quả
              </span>
            )}
          </div>
          {filteredGuides.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredGuides.map((g) => (
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
          ) : (
            <div className="text-center py-16 text-slate-500">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>Không tìm thấy hướng dẫn nào phù hợp</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
