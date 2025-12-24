"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  X,
  Database,
  Code2,
  Terminal,
} from "lucide-react";

// Định nghĩa Interface (giúp TypeScript an toàn hơn)
interface Topic {
  id: string;
  title: string;
  desc: string;
  icon: string;
}
interface Path {
  id: string;
  title: string;
  desc: string;
  progress: number;
}
interface Guide {
  id: string;
  title: string;
  summary: string;
  author: string;
  level: string;
  type: string;
}
interface MergedItem {
  id: string;
  title: string;
  type: "topic" | "path" | "guide";
}

export default function ExplorePage() {
  // Sửa lỗi TypeScript: Dùng các Interface đã định nghĩa
  const [topics, setTopics] = useState<Topic[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);

  // SEARCH
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<MergedItem[]>([]);
  const [allData, setAllData] = useState<any[]>([]); // Dùng any[] cho dữ liệu thô để dễ merge

  // TẢI TẤT CẢ DỮ LIỆU (topic + path + guide)
  useEffect(() => {
    async function load() {
      try {
        // 1. Fetch Topics + Paths
        const res1 = await fetch("/api/explore");
        const data1 = await res1.json();
        setTopics(data1.topics || []);
        setPaths(data1.learningPaths || []);

        // 2. Fetch Guides
        const res2 = await fetch("/api/explore/guides");
        const data2 = await res2.json();

        // FIX LỖI: Kiểm tra nếu data2 trả về mảng trực tiếp HOẶC đối tượng chứa key 'guides'
        const fetchedGuides = Array.isArray(data2) ? data2 : data2.guides || [];
        setGuides(fetchedGuides);

        // 3. Tạo list tổng hợp để search
        const merged: MergedItem[] = [
          ...(data1.topics || []).map((t: any) => ({
            id: t.id,
            title: t.title,
            type: "topic" as const,
          })),
          ...(data1.learningPaths || []).map((p: any) => ({
            id: p.id,
            title: p.title,
            type: "path" as const,
          })),
          // FIX: Dùng fetchedGuides để đảm bảo dữ liệu guides được thêm vào
          ...(fetchedGuides || []).map((g: any) => ({
            id: g.id,
            title: g.title,
            type: "guide" as const,
          })),
        ];

        setAllData(merged);
      } catch (err) {
        console.error("Error loading explore page:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // SEARCH FILTER (Giữ nguyên logic của bạn)
  useEffect(() => {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }

    const lower = keyword.toLowerCase();

    const filtered = allData.filter((item) =>
      item.title.toLowerCase().includes(lower)
    );

    setResults(filtered);
  }, [keyword, allData]);

  // ICON RENDER (Giữ nguyên logic của bạn)
  const renderIcon = (icon: string) => {
    if (icon === "database") return <Database />;
    if (icon === "terminal") return <Terminal />;
    return <Code2 />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {/* HERO / SEARCH BOX (Giữ nguyên) */}
      <div className="text-center pt-16 pb-10">
        <h1 className="text-4xl font-bold mb-4 text-white">
          Khám phá các chủ đề lập trình
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto mb-10">
          Đi sâu vào bộ sưu tập toàn diện các hướng dẫn, bài toán và lộ trình
          học tập để trau dồi kỹ năng lập trình của bạn.
        </p>

        {/* SEARCH BOX */}
        <div className="relative mx-auto max-w-xl mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm kiếm chủ đề, lộ trình, hướng dẫn..."
            className="w-full rounded-xl bg-slate-800 py-3.5 pl-12 pr-4 text-sm outline-none text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-600"
          />

          {/* SEARCH RESULT DROPDOWN */}
          {results.length > 0 && (
            <div className="absolute z-30 mt-2 w-full bg-slate-800 rounded-xl border border-slate-700 shadow-xl">
              {results.map((item) => (
                <Link
                  key={item.id}
                  href={`/explore/${item.type}/${item.id}`}
                  className="block px-4 py-3 hover:bg-slate-700 transition rounded-xl"
                  onClick={() => setKeyword("")}
                >
                  <p className="text-white font-semibold">{item.title}</p>
                  <p className="text-xs text-slate-400 capitalize">
                    {item.type}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MAIN */}
      <main className="max-w-5xl mx-auto px-6">
        {/* TOPICS (Giữ nguyên) */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-white mb-6">Chủ đề nổi bật</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {topics.map((t) => (
              <Link
                key={t.id}
                href={`/explore/topic/${t.id}`}
                className="group block rounded-2xl border border-slate-700 bg-slate-800 p-6 hover:bg-slate-750 transition"
              >
                <div className="h-10 w-10 mb-4 flex items-center justify-center rounded-lg bg-blue-600/10 text-blue-500 group-hover:bg-blue-600 group-hover:text-white">
                  {renderIcon(t.icon)}
                </div>
                <h3 className="font-bold text-white mb-2">{t.title}</h3>
                <p className="text-sm text-slate-400">{t.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* LEARNING PATHS (Giữ nguyên) */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-white mb-6">
            Lộ trình học tập
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {paths.map((p) => (
              <Link
                key={p.id}
                href={`/explore/path/${p.id}`}
                className="block rounded-2xl border border-slate-700 bg-slate-800 p-6 hover:bg-slate-750 transition"
              >
                <h3 className="font-bold text-white">{p.title}</h3>
                <p className="text-sm text-slate-400 mt-2">{p.desc}</p>
                <div className="mt-4">
                  <div className="h-2 bg-slate-700 rounded-full">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <p className="text-xs mt-2 text-slate-500">
                    Hoàn thành {p.progress}%
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* GUIDES (Hướng dẫn mới) */}
        <section className="mb-24">
          <h2 className="text-xl font-bold text-white mb-6">Hướng dẫn mới</h2>

          {/* FIX LỖI: Kiểm tra guides.length trước khi render */}
          {guides && guides.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {guides.map((g) => (
                <Link
                  key={g.id}
                  href={`/explore/guide/${g.id}`}
                  className="flex gap-4 rounded-2xl border border-slate-700 bg-slate-800 p-4 hover:bg-slate-750 transition"
                >
                  <div className="h-24 w-36 rounded-lg bg-gradient-to-br from-blue-900 to-slate-800" />
                  <div className="flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-white">{g.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Bởi {g.author}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="rounded bg-blue-900/50 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                        {g.level}
                      </span>
                      <span className="rounded bg-slate-700 px-2 py-0.5 text-[10px]">
                        {g.type}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            // Hiển thị thông báo nếu không có hướng dẫn
            <div className="text-slate-500">
              Hiện chưa có hướng dẫn mới nào.
            </div>
          )}
        </section>
      </main>

      {/* FOOTER (Giữ nguyên) */}
      <footer className="border-t border-slate-800 text-center text-xs text-slate-500 py-8">
        <p>© 2024 Code Pro. Bảo lưu mọi quyền.</p>
      </footer>
    </div>
  );
}
