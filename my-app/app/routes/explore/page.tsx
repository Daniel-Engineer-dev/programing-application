"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Search, Map, FileText, Sparkles, BookOpen, Compass, TrendingUp } from "lucide-react";

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
      className="group relative block h-52 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:shadow-green-500/20 hover:scale-[1.02] hover:border-green-500/50"
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
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

      {/* Nội dung chữ đè lên ảnh */}
      <div className="absolute bottom-0 left-0 p-6 w-full">
        {badge && (
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-[10px] font-bold uppercase text-white mb-3 inline-block shadow-lg">
            {badge}
          </span>
        )}
        <h3 className="text-xl font-bold text-white leading-tight line-clamp-2 drop-shadow-lg mb-2 group-hover:text-green-300 transition-colors">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-slate-300 line-clamp-2 opacity-90">
            {subtitle}
          </p>
        )}
      </div>

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </Link>
  );

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/30 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/30 to-slate-900 text-slate-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10">
        {/* Header & Search */}
        <div className="text-center pt-16 pb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30">
            <Compass className="w-4 h-4 text-green-400 animate-pulse" />
            <span className="text-sm text-green-300 font-medium">Khám Phá Công Nghệ</span>
          </div>

          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent animate-gradient">
            Khám phá lập trình
          </h1>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Tìm hiểu các chủ đề, lộ trình học tập và hướng dẫn từ cộng đồng
          </p>

          {/* Search Box */}
          <div className="relative mx-auto max-w-2xl px-4">
            <div
              className={`relative flex items-center rounded-2xl border transition-all backdrop-blur-xl bg-white/5 shadow-2xl ${
                searchFocused
                  ? "border-green-500/50 ring-2 ring-green-500/20 shadow-green-500/20"
                  : "border-white/10"
              }`}
            >
              <Search
                className={`absolute left-5 transition-colors ${
                  searchFocused ? "text-green-400" : "text-slate-500"
                }`}
                size={20}
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Tìm kiếm chủ đề, lộ trình, hướng dẫn..."
                className="w-full rounded-2xl bg-transparent py-4 px-14 text-base text-white placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-6 pb-20">
          {/* PHẦN CHỦ ĐỀ - Mỗi cái 1 hình */}
          <section className="mb-20">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                  <BookOpen className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Chủ đề phổ biến
                </h2>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-green-500/30 via-green-500/10 to-transparent" />
              {searchQuery && (
                <span className="text-sm px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">
                  {filteredTopics.length} kết quả
                </span>
              )}
            </div>
            {filteredTopics.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTopics.map((t, index) => (
                  <div
                    key={t.id}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="animate-fadeIn"
                  >
                    <CustomCard
                      href={`${baseUrl}/topic/${t.id}`}
                      title={t.title}
                      subtitle={t.desc}
                      bgImage={t.backgroundImage}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
                <Search size={48} className="mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">Không tìm thấy chủ đề nào phù hợp</p>
              </div>
            )}
          </section>

          {/* PHẦN LỘ TRÌNH - Mỗi cái 1 hình */}
          <section className="mb-20">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                  <Map className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Lộ trình học tập
                </h2>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-green-500/30 via-green-500/10 to-transparent" />
              {searchQuery && (
                <span className="text-sm px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">
                  {filteredPaths.length} kết quả
                </span>
              )}
            </div>
            {filteredPaths.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {filteredPaths.map((p, index) => (
                  <div
                    key={p.id}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="animate-fadeIn"
                  >
                    <CustomCard
                      href={`${baseUrl}/path/${p.id}`}
                      title={p.title}
                      subtitle={p.desc}
                      badge="Lộ trình"
                      bgImage={p.backgroundImage}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
                <Map size={48} className="mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">Không tìm thấy lộ trình nào phù hợp</p>
              </div>
            )}
          </section>

          {/* PHẦN HƯỚNG DẪN - Mỗi cái 1 hình */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Hướng dẫn mới nhất
                </h2>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-green-500/30 via-green-500/10 to-transparent" />
              {searchQuery && (
                <span className="text-sm px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">
                  {filteredGuides.length} kết quả
                </span>
              )}
            </div>
            {filteredGuides.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {filteredGuides.map((g, index) => (
                  <div
                    key={g.id}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="animate-fadeIn"
                  >
                    <CustomCard
                      href={`${baseUrl}/guide/${g.id}`}
                      title={g.title}
                      subtitle={`Tác giả: ${g.author}`}
                      badge={g.level}
                      bgImage={g.backgroundImage}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
                <FileText size={48} className="mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">Không tìm thấy hướng dẫn nào phù hợp</p>
              </div>
            )}
          </section>
        </main>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .delay-1000 { animation-delay: 1s; }
        .delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
}
