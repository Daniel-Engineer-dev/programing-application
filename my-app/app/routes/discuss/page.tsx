"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/src/api/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Clock,
} from "lucide-react";

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

          const createdAtDate = data.createdAt
            ? data.createdAt.toDate()
            : null;

          return {
            id: d.id,
            title: data.title ?? "",
            excerpt: data.excerpt ?? "",
            repliesCount: data.repliesCount ?? 0,
            likesCount: data.likesCount ?? 0,
            dislikesCount: data.dislikesCount ?? 0,
            viewsCount: data.viewsCount ?? 0,
            createdAt: createdAtDate
              ? createdAtDate.toLocaleString()
              : "",
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
      result = result.filter((d) =>
        d.title.toLowerCase().includes(keyword)
      );
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
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Trang Thảo Luận
            </h1>
            <p className="text-sm text-slate-400">
              Khám phá chủ đề, đặt câu hỏi và chia sẻ kiến thức của bạn.
            </p>
          </div>
          <button
            onClick={() => router.push("/routes/discuss/new")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Tạo bài đăng mới 
          </button>
        </div>

        {/* Search + filter bar */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Tìm kiếm thảo luận..."
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Lọc theo chủ đề */}
            <div>
              <label className="mr-2 text-xs text-slate-400">
                Chủ đề
              </label>
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {topicOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Sắp xếp */}
            <div>
              <label className="mr-2 text-xs text-slate-400">
                Sắp xếp
              </label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "recent" | "popular")
                }
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="recent">Gần đây</option>
                <option value="popular">Phổ biến</option>
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <p className="text-slate-400">Đang tải danh sách...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-500">
            Không tìm thấy thảo luận nào phù hợp.
          </p>
        ) : (
          <div className="space-y-4">
            {filtered.map((d) => (
              <Link
                key={d.id}
                href={`/routes/discuss/${d.id}`}
                className="block rounded-xl border border-slate-800 bg-slate-900/70 p-5 hover:border-blue-500 hover:bg-slate-800/70"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-blue-300">
                      {d.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {d.excerpt}
                    </p>

                    {d.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {d.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex shrink-0 flex-col items-end gap-1 text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <ThumbsUp size={14} /> {d.likesCount}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ThumbsDown size={14} /> {d.dislikesCount}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye size={14} /> {d.viewsCount}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare size={14} />{" "}
                        {d.repliesCount} Phản hồi
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={14} /> {d.createdAt}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
