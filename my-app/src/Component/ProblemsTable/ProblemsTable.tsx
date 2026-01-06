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
import { db } from "@/src/api/firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

type Problem = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
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
    <section className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-900 text-slate-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 px-4 md:px-12 py-12">
        {/* Hero Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-500/30">
            <Code2 className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-sm text-blue-300 font-medium">Thư Viện Bài Tập</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent animate-gradient">
            Danh Sách Bài Tập
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            Nâng cao kỹ năng lập trình của bạn với các thử thách đa dạng
          </p>

          {/* Stats Cards */}
          {user && (
            <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl px-6 py-4 min-w-[160px]">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {stats.solved}
                </div>
                <div className="text-sm text-slate-400 mt-1">Đã hoàn thành</div>
              </div>
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl px-6 py-4 min-w-[160px]">
                <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {stats.attempted}
                </div>
                <div className="text-sm text-slate-400 mt-1">Đang thực hiện</div>
              </div>
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl px-6 py-4 min-w-[160px]">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {stats.total}
                </div>
                <div className="text-sm text-slate-400 mt-1">Tổng số bài</div>
              </div>
            </div>
          )}
        </div>

        {/* THANH TÌM KIẾM VÀ BỘ LỌC */}
        <div className="mb-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl max-w-6xl mx-auto relative z-50">
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
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all
                    ${
                      selectedDifficulty !== "All"
                        ? "border-blue-500/50 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 shadow-lg shadow-blue-500/20"
                        : "border-slate-700/50 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
                    }`}
                >
                  {selectedDifficulty === "All" ? "Độ khó" : selectedDifficulty}
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
                          {d === "All" ? "Tất cả độ khó" : d}
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
                        ? "border-blue-500/50 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 shadow-lg shadow-blue-500/20"
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
                  className="p-3 rounded-xl border border-red-500/30 bg-gradient-to-r from-red-500/10 to-rose-500/10 text-red-400 hover:from-red-500/20 hover:to-rose-500/20 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/10"
                  title="Xóa bộ lọc"
                >
                  <FilterX size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* BẢNG BÀI TẬP */}
        <div className="overflow-hidden rounded-2xl border border-white/10 backdrop-blur-xl bg-white/5 shadow-2xl max-w-6xl mx-auto relative z-10">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600/80 to-cyan-600/80 text-white border-b border-white/10">
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
                            href={`/routes/problems/${p.id}`}
                            className="text-slate-100 font-bold group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-400 group-hover:bg-clip-text group-hover:text-transparent transition-all inline-block"
                          >
                            {p.title}
                          </Link>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border shadow-lg
                            ${
                              p.difficulty === "Easy"
                                ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30 shadow-green-500/20"
                                : p.difficulty === "Medium"
                                ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30 shadow-yellow-500/20"
                                : "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border-red-500/30 shadow-red-500/20"
                            }`}
                          >
                            {p.difficulty}
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
