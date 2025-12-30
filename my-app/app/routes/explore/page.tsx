"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Database, Code2, Terminal } from "lucide-react";

// --- Interfaces ---
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
  const [topics, setTopics] = useState<Topic[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);

  // SEARCH STATES
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<MergedItem[]>([]);
  const [allData, setAllData] = useState<MergedItem[]>([]);

  // 1. TẢI DỮ LIỆU
  useEffect(() => {
    async function load() {
      try {
        const res1 = await fetch("/routes/explore/api/explore");
        const data1 = await res1.json();

        setTopics(data1.topics || []);
        setPaths(data1.learningPaths || []);

        const res2 = await fetch("/routes/explore/api/explore/guides");
        const data2 = await res2.json();
        const fetchedGuides = Array.isArray(data2) ? data2 : data2.guides || [];
        setGuides(fetchedGuides);

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
          ...(fetchedGuides || []).map((g: any) => ({
            id: g.id,
            title: g.title,
            type: "guide" as const,
          })),
        ];

        setAllData(merged);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu Explore:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // 2. SEARCH FILTER
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

  const renderIcon = (icon: string) => {
    if (icon === "database") return <Database size={20} />;
    if (icon === "terminal") return <Terminal size={20} />;
    return <Code2 size={20} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        Đang tải dữ liệu hệ thống...
      </div>
    );
  }

  const baseUrl = "/routes/explore/explorePage";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {/* HEADER & SEARCH */}
      <div className="text-center pt-16 pb-10">
        <h1 className="text-4xl font-bold mb-4 text-white">
          Khám phá lập trình
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto mb-10 px-4">
          Học tập thông qua các lộ trình và hướng dẫn thực tế.
        </p>

        <div className="relative mx-auto max-w-xl px-4">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm chủ đề, lộ trình..."
              className="w-full rounded-xl bg-slate-800 py-3.5 pl-12 pr-4 text-sm outline-none text-white focus:ring-2 focus:ring-blue-600 border border-slate-700"
            />
          </div>

          {results.length > 0 && (
            <div className="absolute z-30 mt-2 w-[calc(100%-2rem)] bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
              {results.map((item) => (
                <Link
                  key={item.id}
                  href={`${baseUrl}/${item.type}/${item.id}`}
                  className="block px-4 py-3 hover:bg-slate-700 text-left border-b border-slate-700 last:border-0"
                  onClick={() => setKeyword("")}
                >
                  <p className="text-white font-medium">{item.title}</p>
                  <p className="text-[10px] text-blue-400 uppercase tracking-wider">
                    {item.type}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 pb-20">
        {/* TOPICS */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-white mb-6">Chủ đề phổ biến</h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {topics.map((t) => (
              <Link
                key={t.id}
                href={`${baseUrl}/topic/${t.id}`}
                className="group block rounded-2xl border border-slate-700 bg-slate-800 p-6 hover:border-blue-500/50 transition-all"
              >
                <div className="h-10 w-10 mb-4 flex items-center justify-center rounded-lg bg-blue-600/10 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {renderIcon(t.icon)}
                </div>
                <h3 className="font-bold text-white mb-2">{t.title}</h3>
                <p className="text-sm text-slate-400 line-clamp-2">{t.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* PATHS - Đã lược bỏ thanh tiến độ */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-white mb-6">
            Lộ trình học tập
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {paths.map((p) => (
              <Link
                key={p.id}
                href={`${baseUrl}/path/${p.id}`}
                className="block rounded-2xl border border-slate-700 bg-slate-800 p-6 hover:bg-slate-750/50 transition shadow-sm"
              >
                <h3 className="font-bold text-white text-lg">{p.title}</h3>
                <p className="text-sm text-slate-400 mt-2">{p.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* GUIDES */}
        <section>
          <h2 className="text-xl font-bold text-white mb-6">
            Hướng dẫn mới nhất
          </h2>
          {guides.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {guides.map((g) => (
                <Link
                  key={g.id}
                  href={`${baseUrl}/guide/${g.id}`}
                  className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800 p-3 hover:bg-slate-750 transition"
                >
                  <div className="h-20 w-28 flex-shrink-0 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-600">
                    <Database size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm truncate">
                      {g.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Tác giả: {g.author}
                    </p>
                    <div className="flex gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-400 text-[9px] font-bold uppercase">
                        {g.level}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center border border-dashed border-slate-700 rounded-xl text-slate-500">
              Chưa có dữ liệu hướng dẫn.
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-slate-800 py-10 text-center text-xs text-slate-600">
        © 2025 Programming App.
      </footer>
    </div>
  );
}
