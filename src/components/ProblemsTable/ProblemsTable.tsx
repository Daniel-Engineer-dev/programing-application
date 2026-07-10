"use client";

import Link from "next/link";
import {
  Search,
  ChevronDown,
  CheckCircle2,
  Circle,
  FilterX,
  Hash,
  Tag,
  Clock,
  Sparkles,
  Code2,
  X,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

type Problem = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  order?: number;
};

// Số thứ tự bài lấy từ tiền tố ID (vd "76-two-sum" -> 76), dùng làm khóa sắp xếp phụ
const problemNo = (id: string) => {
  const m = String(id).match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
};

type StatusType = "Solved" | "Attempted" | "Todo";

export default function ProblemsTable() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, StatusType>>({});

  // State Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // State UI Dropdowns
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);

  // 1. Theo dõi Auth
  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
  }, []);

  // 2. Lấy danh sách bài tập
  useEffect(() => {
    return onSnapshot(collection(db, "problems"), (snapshot) => {
      const list = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Problem)
      );
      // Ưu tiên các bài có 'order' (bài đã kiểm thử) lên đầu, phần còn lại theo số thứ tự bài
      list.sort((a, b) => {
        const oa = typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
        const ob = typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;
        if (oa !== ob) return oa - ob;
        return problemNo(a.id) - problemNo(b.id);
      });
      setProblems(list);
    });
  }, []);

  // 3. Lấy trạng thái từ users -> uid -> submissions
  useEffect(() => {
    if (!user) {
      setStatusMap({});
      return;
    }
    const subsRef = collection(db, "users", user.uid, "submissions");
    return onSnapshot(subsRef, (snapshot) => {
      const newStatusMap: Record<string, StatusType> = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const pId = data.problemId;
        const result = data.status;
        if (newStatusMap[pId] !== "Solved") {
          newStatusMap[pId] = result === "Accepted" ? "Solved" : "Attempted";
        }
      });
      setStatusMap(newStatusMap);
    });
  }, [user]);

  // Logic Lọc
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const matchName = p.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchDifficulty =
        selectedDifficulty === "All" || p.difficulty === selectedDifficulty;
      // Multi-tag filter: show if problem has ALL of the selected tags (AND logic)
      const matchTag = selectedTags.length === 0 || 
        selectedTags.every(tag => p.tags?.includes(tag));
      return matchName && matchDifficulty && matchTag;
    });
  }, [problems, searchTerm, selectedDifficulty, selectedTags]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    problems.forEach((p) => p.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [problems]);

  // Calculate stats
  const stats = useMemo(() => {
    const solved = Object.values(statusMap).filter((s) => s === "Solved").length;
    const attempted = Object.values(statusMap).filter((s) => s === "Attempted").length;
    const total = problems.length;
    return { solved, attempted, total };
  }, [statusMap, problems]);

  return (
    <section className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="hidden"></div>

      <div className="relative z-10 px-4 md:px-12 py-12">
        {/* Hero Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-slate-900 border border-slate-800">
            <Code2 className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300 font-medium">Thư Viện Bài Tập</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 text-white">
            Danh Sách Bài Tập
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            Nâng cao kỹ năng lập trình của bạn với các thử thách đa dạng
          </p>

          {/* Stats Cards */}
          {user && (
            <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-lg px-6 py-4 min-w-[160px]">
                <div className="text-3xl font-bold text-green-400">
                  {stats.solved}
                </div>
                <div className="text-sm text-slate-400 mt-1">Đã hoàn thành</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg px-6 py-4 min-w-[160px]">
                <div className="text-3xl font-bold text-yellow-400">
                  {stats.attempted}
                </div>
                <div className="text-sm text-slate-400 mt-1">Đang thực hiện</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg px-6 py-4 min-w-[160px]">
                <div className="text-3xl font-bold text-blue-400">
                  {stats.total}
                </div>
                <div className="text-sm text-slate-400 mt-1">Tổng số bài</div>
              </div>
            </div>
          )}
        </div>

        {/* THANH TÌM KIẾM VÀ BỘ LỌC */}
        <div className="mb-8 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm max-w-6xl mx-auto relative z-50">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Tìm kiếm */}
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                placeholder="Tìm tên bài tập..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl bg-slate-800/50 py-3 pl-12 pr-4 text-sm text-white placeholder-slate-400 outline-none border border-slate-700/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Lọc Độ Khó */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsDiffOpen(!isDiffOpen);
                    setIsTagOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold transition-all
                    ${
                      selectedDifficulty !== "All"
                        ? "border-blue-500/50 bg-blue-600/15 text-blue-300"
                        : "border-slate-700/50 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
                    }`}
                >
                  {selectedDifficulty === "All" ? "Độ khó" : selectedDifficulty === "Easy" ? "Dễ" : selectedDifficulty === "Medium" ? "Trung bình" : "Khó"}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      isDiffOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isDiffOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10 backdrop-blur-xl bg-slate-900/95 p-2 shadow-2xl z-[9999]"
                    >
                      {["All", "Easy", "Medium", "Hard"].map((d) => (
                        <button
                          key={d}
                          onClick={() => {
                            setSelectedDifficulty(d);
                            setIsDiffOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                            selectedDifficulty === d
                              ? "bg-blue-500/20 text-blue-400"
                              : "text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          {d === "All" ? "Tất cả độ khó" : d === "Easy" ? "Dễ" : d === "Medium" ? "Trung bình" : "Khó"}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Lọc Chủ Đề */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsTagOpen(!isTagOpen);
                    setIsDiffOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all
                    ${
                      selectedTags.length > 0
                        ? "border-blue-500/50 bg-blue-600/15 text-blue-300"
                        : "border-slate-700/50 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
                    }`}
                >
                  <Tag size={14} />
                  Chủ đề {selectedTags.length > 0 && `(${selectedTags.length})`}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      isTagOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isTagOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 max-h-64 overflow-y-auto rounded-xl border border-white/10 backdrop-blur-xl bg-slate-900/95 p-2 shadow-2xl z-[9999]"
                    >
                      <div className="mb-2 pb-2 border-b border-white/10 flex justify-between items-center">
                        <span className="text-xs text-slate-400 px-3">Chọn nhiều chủ đề</span>
                        {selectedTags.length > 0 && (
                          <button
                            onClick={() => setSelectedTags([])}
                            className="text-xs text-blue-400 hover:text-blue-300 px-2"
                          >
                            Xóa tất cả
                          </button>
                        )}
                      </div>
                      {allTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                        <button
                          key={tag}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTags(prev => prev.filter(t => t !== tag));
                            } else {
                              setSelectedTags(prev => [...prev, tag]);
                            }
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                            isSelected
                              ? "bg-blue-500/20 text-blue-400"
                              : "text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? "border-blue-400 bg-blue-500/30"
                              : "border-slate-600"
                          }`}>
                            {isSelected && (
                              <CheckCircle2 size={12} className="text-blue-400" />
                            )}
                          </div>
                          {tag}
                        </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Nút Reset */}
              {(searchTerm ||
                selectedDifficulty !== "All" ||
                selectedTags.length > 0) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedDifficulty("All");
                    setSelectedTags([]);
                  }}
                  className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors active:scale-95"
                  title="Xóa bộ lọc"
                >
                  <FilterX size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* BẢNG BÀI TẬP */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm max-w-6xl mx-auto relative z-10">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-blue-600 text-white border-b border-blue-500">
                  <th className="w-16 px-6 py-4 font-semibold text-center">
                    <Hash size={16} className="mx-auto" />
                  </th>
                  <th className="px-6 py-4 font-bold text-left uppercase tracking-wide text-sm">
                    Đề bài
                  </th>
                  <th className="w-32 px-6 py-4 font-bold text-left uppercase tracking-wide text-sm">
                    Độ khó
                  </th>
                  <th className="w-48 px-6 py-4 font-bold text-left uppercase tracking-wide text-sm">
                    Chủ đề
                  </th>
                  <th className="w-40 px-6 py-4 font-bold text-right uppercase tracking-wide text-sm">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                  {filteredProblems.map((p, i) => {
                    const status = statusMap[p.id] || "Todo";

                    return (
                      <motion.tr
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        key={p.id}
                        className="hover:bg-white/5 transition-all group"
                      >
                        <td className="px-6 py-5 text-slate-500 font-mono text-center text-xs">
                          {i + 1}
                        </td>
                        <td className="px-6 py-5">
                          <Link
                            href={`/problems/${p.id}`}
                            className="text-slate-100 font-bold group-hover:text-blue-300 transition-colors inline-block"
                          >
                            {p.title}
                          </Link>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold border shadow-lg whitespace-nowrap
                            ${
                              p.difficulty === "Easy"
                                ? "bg-green-500/10 text-green-400 border-green-500/30"
                                : p.difficulty === "Medium"
                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                                : "bg-red-500/10 text-red-400 border-red-500/30"
                            }`}
                          >
                            {p.difficulty === "Easy" ? "Dễ" : p.difficulty === "Medium" ? "Trung bình" : "Khó"}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex gap-2 flex-wrap">
                            {p.tags?.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-300 text-[10px] font-medium backdrop-blur-sm hover:bg-slate-700/80 transition-colors"
                              >
                                {tag}
                              </span>
                            ))}
                            {p.tags?.length > 2 && (
                              <span className="px-2.5 py-1 rounded-lg bg-slate-800/50 border border-slate-700/30 text-slate-400 text-[10px] font-medium">
                                +{p.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right font-bold text-[11px] uppercase tracking-wide">
                          {status === "Solved" && (
                            <div className="flex items-center justify-end gap-2 text-green-400">
                              <CheckCircle2 size={16} className="animate-pulse" />
                              <span>Hoàn thành</span>
                            </div>
                          )}
                          {status === "Attempted" && (
                            <div className="flex items-center justify-end gap-2 text-yellow-400">
                              <Clock size={16} />
                              <span>Đang làm</span>
                            </div>
                          )}
                          {status === "Todo" && (
                            <div className="flex items-center justify-end gap-2 text-slate-500">
                              <Circle size={16} />
                              <span>Chưa làm</span>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {filteredProblems.length === 0 && (
            <div className="py-20 text-center">
              <Code2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">Không tìm thấy bài tập nào...</p>
            </div>
          )}
        </div>
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
        .delay-1000 { animation-delay: 1s; }
        .delay-2000 { animation-delay: 2s; }
      `}</style>
    </section>
  );
}
