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
  const [selectedTag, setSelectedTag] = useState("All");

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
      const matchTag = selectedTag === "All" || p.tags?.includes(selectedTag);
      return matchName && matchDifficulty && matchTag;
    });
  }, [problems, searchTerm, selectedDifficulty, selectedTag]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    problems.forEach((p) => p.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [problems]);

  return (
    <section className="mt-6 px-4 md:px-12 pb-16 pt-6 bg-slate-950 min-h-screen text-slate-300 font-sans">
      {/* THANH TÌM KIẾM VÀ BỘ LỌC */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        {/* Tìm kiếm */}
        <div className="relative flex-1 max-w-xl group">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Tìm tên bài tập..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-slate-900/50 py-3 pl-12 pr-4 text-sm text-white outline-none border border-slate-800 focus:border-blue-500/50 transition-all shadow-inner"
          />
        </div>

        <div className="flex items-center gap-3">
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
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-800"
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
                  className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50"
                >
                  {["All", "Easy", "Medium", "Hard"].map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setSelectedDifficulty(d);
                        setIsDiffOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedDifficulty === d
                          ? "bg-blue-500/20 text-blue-400"
                          : "hover:bg-slate-800"
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
                  selectedTag !== "All"
                    ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-800"
                }`}
            >
              <Tag size={14} />
              {selectedTag === "All" ? "Chủ đề" : selectedTag}
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
                  className="absolute right-0 mt-2 w-56 max-h-64 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 shadow-purple-500/10"
                >
                  <button
                    onClick={() => {
                      setSelectedTag("All");
                      setIsTagOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                      selectedTag === "All"
                        ? "bg-purple-500/20 text-purple-400"
                        : "hover:bg-slate-800"
                    }`}
                  >
                    Tất cả chủ đề
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTag(tag);
                        setIsTagOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedTag === tag
                          ? "bg-purple-500/20 text-purple-400"
                          : "hover:bg-slate-800"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Nút Reset */}
          {(searchTerm ||
            selectedDifficulty !== "All" ||
            selectedTag !== "All") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedDifficulty("All");
                setSelectedTag("All");
              }}
              className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
            >
              <FilterX size={18} />
            </button>
          )}
        </div>
      </div>

      {/* BẢNG BÀI TẬP */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-2xl">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-blue-800 text-white border-b border-slate-800">
              <th className="w-16 px-6 py-4 font-semibold text-center">
                <Hash size={14} className="mx-auto" />
              </th>
              <th className="px-6 py-4 font-semibold text-left uppercase tracking-tighter">
                Đề bài
              </th>
              <th className="w-32 px-6 py-4 font-semibold text-left uppercase tracking-tighter">
                Độ khó
              </th>
              <th className="w-48 px-6 py-4 font-semibold text-left uppercase tracking-tighter">
                Chủ đề
              </th>
              <th className="w-40 px-6 py-4 font-semibold text-right uppercase tracking-tighter">
                Trạng thái
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            <AnimatePresence mode="popLayout">
              {filteredProblems.map((p, i) => {
                const status = statusMap[p.id] || "Todo";

                return (
                  <motion.tr
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    key={p.id}
                    className="hover:bg-blue-500/4 transition-colors group"
                  >
                    <td className="px-6 py-5 text-slate-600 font-mono text-center">
                      {i + 1}
                    </td>
                    <td className="px-6 py-5">
                      <Link
                        href={`/routes/problems/${p.id}`}
                        className="text-slate-200 font-bold group-hover:text-blue-400 transition-colors"
                      >
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border
                        ${
                          p.difficulty === "Easy"
                            ? "bg-green-500/5 text-green-500 border-green-500/20"
                            : p.difficulty === "Medium"
                            ? "bg-yellow-500/5 text-yellow-500 border-yellow-500/20"
                            : "bg-red-500/5 text-red-500 border-red-500/20"
                        }`}
                      >
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-1.5 flex-wrap">
                        {p.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-slate-800/80 text-white text-[10px] border border-slate-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-[11px] uppercase tracking-wide">
                      {status === "Solved" && (
                        <div className="flex items-center justify-end gap-2 text-green-500">
                          <CheckCircle2 size={16} /> <span>Hoàn thành</span>
                        </div>
                      )}
                      {status === "Attempted" && (
                        <div className="flex items-center justify-end gap-2 text-yellow-500">
                          <Clock size={16} /> <span>Đang thực hiện</span>
                        </div>
                      )}
                      {status === "Todo" && (
                        <div className="flex items-center justify-end gap-2 text-slate-600">
                          <Circle size={16} /> <span>Chưa làm</span>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>

        {filteredProblems.length === 0 && (
          <div className="py-20 text-center text-slate-600 italic">
            Không tìm thấy bài tập nào...
          </div>
        )}
      </div>
    </section>
  );
}
