"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/src/api/firebase/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { MessageSquare, ThumbsUp, ThumbsDown, Eye, Clock, Search, Plus, Sparkles } from "lucide-react";

interface DiscussionSummary {
  id: string;
  title: string;
  excerpt: string;
  repliesCount: number;
  likesCount: number;
  dislikesCount: number;
  viewsCount: number;
  createdAt: string;
  createdAtSort: number; // dùng để sort
  tags: string[];
}

export default function DiscussionListPage() {
  const [discussions, setDiscussions] = useState<DiscussionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // lọc & sort
  const [topicFilter, setTopicFilter] = useState<string>("Tất cả chủ đề");
  const [topicOptions, setTopicOptions] = useState<string[]>(["Tất cả chủ đề"]);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");

  const router = useRouter();

  useEffect(() => {
    const fetchDiscussions = async () => {
      try {
        const q = query(
          collection(db, "discussions"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);

        const topicsSet = new Set<string>();

        const list: DiscussionSummary[] = snap.docs.map((d) => {
          const data: any = d.data();
          const tags: string[] = data.tags ?? [];
          tags.forEach((t) => topicsSet.add(t));

          const createdAtDate = data.createdAt ? data.createdAt.toDate() : null;

          return {
            id: d.id,
            title: data.title ?? "",
            excerpt: data.excerpt ?? "",
            repliesCount: data.repliesCount ?? 0,
            likesCount: data.likesCount ?? 0,
            dislikesCount: data.dislikesCount ?? 0,
            viewsCount: data.viewsCount ?? 0,
            createdAt: createdAtDate ? createdAtDate.toLocaleString() : "",
            createdAtSort: createdAtDate ? createdAtDate.getTime() : 0,
            tags,
          };
        });

        setDiscussions(list);

        const topicsArray = Array.from(topicsSet).sort((a, b) =>
          a.localeCompare(b, "vi")
        );
        setTopicOptions(["Tất cả chủ đề", ...topicsArray]);
      } catch (err) {
        console.error("Lỗi tải danh sách discuss:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscussions();
  }, []);

  // áp dụng search + lọc + sort
  const filtered = (() => {
    let result = [...discussions];

    // search theo tiêu đề
    if (search.trim()) {
      const keyword = search.toLowerCase();
      result = result.filter((d) => d.title.toLowerCase().includes(keyword));
    }

    // lọc theo chủ đề
    if (topicFilter !== "Tất cả chủ đề") {
      result = result.filter((d) => d.tags.includes(topicFilter));
    }

    // sort
    if (sortBy === "recent") {
      result.sort((a, b) => b.createdAtSort - a.createdAtSort);
    } else {
      // phổ biến: ưu tiên nhiều like + nhiều phản hồi
      result.sort(
        (a, b) =>
          b.likesCount + b.repliesCount - (a.likesCount + a.repliesCount)
      );
    }

    return result;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-1/4 left-1/3 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-12 relative z-10">
        {/* Hero Header with Gradient */}
        <div className="mb-10 text-center relative">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-purple-500/30">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-sm text-purple-300 font-medium">Cộng Đồng Thảo Luận</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
            Trang Thảo Luận
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Khám phá chủ đề, đặt câu hỏi và chia sẻ kiến thức của bạn cùng cộng đồng
          </p>
        </div>

        {/* Search + Filter Bar - Glassmorphism */}
        <div className="mb-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search Input */}
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-400 transition-colors" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-100 placeholder-slate-400 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="Tìm kiếm thảo luận..."
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Topic Filter */}
              <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/50">
                <label className="text-xs font-medium text-slate-300">Chủ đề</label>
                <select
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                  className="bg-transparent text-sm text-slate-100 outline-none cursor-pointer"
                >
                  {topicOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-slate-800">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Filter */}
              <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/50">
                <label className="text-xs font-medium text-slate-300">Sắp xếp</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "recent" | "popular")}
                  className="bg-transparent text-sm text-slate-100 outline-none cursor-pointer"
                >
                  <option value="recent" className="bg-slate-800">Gần đây</option>
                  <option value="popular" className="bg-slate-800">Phổ biến</option>
                </select>
              </div>

              {/* Create Button */}
              <button
                onClick={() => router.push("/routes/discuss/new")}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden md:inline">Tạo bài mới</span>
              </button>
            </div>
          </div>
        </div>

        {/* Discussion List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-400">Đang tải danh sách...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
            <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">
              Không tìm thấy thảo luận nào phù hợp.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map((d, index) => (
              <Link
                key={d.id}
                href={`/routes/discuss/${d.id}`}
                className="block group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* Content */}
                    <div className="flex-1">
                      <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:to-blue-300 transition-all mb-2">
                        {d.title}
                      </h2>
                      <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                        {d.excerpt}
                      </p>

                      {/* Tags */}
                      {d.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {d.tags.map((t) => (
                            <span
                              key={t}
                              className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-300 backdrop-blur-sm"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col gap-2 lg:items-end">
                      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1.5 hover:text-green-400 transition-colors">
                          <ThumbsUp size={14} />
                          <span className="font-medium">{d.likesCount}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 hover:text-red-400 transition-colors">
                          <ThumbsDown size={14} />
                          <span className="font-medium">{d.dislikesCount}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 hover:text-blue-400 transition-colors">
                          <Eye size={14} />
                          <span className="font-medium">{d.viewsCount}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 hover:text-purple-400 transition-colors">
                          <MessageSquare size={14} />
                          <span className="font-medium">{d.repliesCount}</span>
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock size={12} />
                        {d.createdAt}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

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
        .delay-1000 { animation-delay: 1s; }
        .delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
}
