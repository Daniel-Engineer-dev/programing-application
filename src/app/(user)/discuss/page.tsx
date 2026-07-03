"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { MessageSquare, ThumbsUp, ThumbsDown, Eye, Clock, Search, Plus, Sparkles, ChevronDown, Check } from "lucide-react";

interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (val: string) => void;
}

function CustomDropdown({ label, value, options, onChange }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selected = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 bg-slate-950 hover:bg-slate-900 text-sm text-slate-200 rounded-xl px-4 py-2 border border-slate-800 cursor-pointer transition-all min-w-[170px] h-[46px] outline-none focus:border-blue-500/70"
      >
        <div className="flex flex-col items-start text-left">
          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 leading-none mb-1">{label}</span>
          <span className="font-semibold text-slate-200 leading-tight text-xs truncate max-w-[120px]">{selected?.label || value}</span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180 text-blue-400" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 min-w-[200px] max-h-64 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/95 p-1.5 shadow-2xl z-50 backdrop-blur-md animate-dropdownFade">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-all duration-150 ${
                  isSelected
                    ? "bg-blue-600/15 text-blue-400 font-semibold"
                    : "text-slate-300 hover:bg-slate-900 hover:text-slate-100"
                }`}
              >
                <span className="truncate pr-2">{opt.label}</span>
                {isSelected && <Check size={12} className="text-blue-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
    <div className="min-h-screen bg-slate-950 text-slate-100 relative">
      <main className="mx-auto max-w-6xl px-6 py-12 relative z-10">
        {/* Hero Header */}
        <div className="mb-10 text-center relative">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-slate-900 border border-slate-800">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-slate-300 font-medium">Cộng Đồng Thảo Luận</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 text-white">
            Trang Thảo Luận
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Khám phá chủ đề, đặt câu hỏi và chia sẻ kiến thức của bạn cùng cộng đồng
          </p>
        </div>

        {/* Search + Filter Bar */}
        <div className="mb-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search Input */}
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 transition-all"
                placeholder="Tìm kiếm thảo luận..."
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <CustomDropdown
                label="Chủ đề"
                value={topicFilter}
                options={topicOptions.map((opt) => ({ value: opt, label: opt }))}
                onChange={setTopicFilter}
              />

              <CustomDropdown
                label="Sắp xếp"
                value={sortBy}
                options={[
                  { value: "recent", label: "Gần đây" },
                  { value: "popular", label: "Phổ biến" },
                ]}
                onChange={(val) => setSortBy(val as "recent" | "popular")}
              />

              {/* Create Button */}
              <button
                onClick={() => router.push("/discuss/new")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors duration-200 h-[46px]"
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
            <div className="inline-block w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-400">Đang tải danh sách...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
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
                href={`/discuss/${d.id}`}
                className="block group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 hover:border-purple-500/60 transition-all duration-200 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* Content */}
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors mb-2">
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
                              className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300"
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
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-dropdownFade {
          animation: dropdownFade 0.15s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
