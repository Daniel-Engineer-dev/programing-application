"use client";

import { useState, useEffect, useMemo } from "react";
import { db, auth } from "@/src/api/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { X, Code2, Clock, HardDrive, Filter } from "lucide-react";
import { CodeBlock } from "@/src/Component/CodeBlock/CodeBlock";

export default function AllSubmissionsTab({
  contestId,
  highlightId,
  problems = [],
}: {
  contestId: string;
  highlightId?: string;
  problems?: any[];
}) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter State
  const [statusFilter, setStatusFilter] = useState("All");
  const [problemIdFilter, setProblemIdFilter] = useState("All");

  // State cho highlight tạm thời
  const [activeHighlightId, setActiveHighlightId] = useState<string | undefined>(highlightId);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);

  useEffect(() => {
    setActiveHighlightId(highlightId);
    if (highlightId) {
      const timer = setTimeout(() => {
        setActiveHighlightId(undefined);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightId]);

  // Logic lọc bài nộp
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchStatus = statusFilter === "All" || sub.status === statusFilter;
      const matchProblem =
        problemIdFilter === "All" || sub.problemId === problemIdFilter;
      return matchStatus && matchProblem;
    });
  }, [submissions, statusFilter, problemIdFilter]);

  // Hàm định dạng thời gian nộp
  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Đang cập nhật...";
    const date = timestamp.toDate();
    return (
      date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) +
      " " +
      date.toLocaleDateString("vi-VN")
    );
  };

  useEffect(() => {
    if (!contestId) return;

    // 1. Lắng nghe trạng thái đăng nhập
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 2. Nếu có user, bắt đầu lắng nghe dữ liệu submissions
        const q = query(
          collection(
            db,
            "contests",
            contestId,
            "user",
            user.uid,
            "submissions"
          ),
          orderBy("timestamp", "desc")
        );

        const unsubscribeSnapshot = onSnapshot(
          q,
          (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setSubmissions(data);
            setLoading(false);
          },
          (error) => {
            console.error("Lỗi lấy submissions:", error);
            setLoading(false);
          }
        );

        // Cleanup snapshot
        return () => unsubscribeSnapshot();
      } else {
        // Nếu chưa đăng nhập
        setSubmissions([]);
        setLoading(false);
      }
    });

    // Cleanup auth listener
    return () => unsubscribeAuth();
  }, [contestId]);

  // Loader hiển thị khi đang xác thực hoặc lấy dữ liệu lần đầu
  // Auto-scroll logic
  useEffect(() => {
    if (!loading && highlightId && submissions.length > 0) {
      const row = document.getElementById(`submission-${highlightId}`);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [loading, highlightId, submissions]);

  if (loading) {
    return (
      <div className="flex justify-center p-10 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-3" />
        Đang tải danh sách...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white text-center">
        Danh sách bài nộp của tôi
      </h2>

      {/* --- FILTERS --- */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        {/* Status Filter */}
        <div className="relative group w-full sm:w-[220px]">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-blue-400 transition-colors z-10">
                <Filter size={16} />
             </div>
             <select 
               value={statusFilter}
               onChange={e => setStatusFilter(e.target.value)}
               className="w-full h-10 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg pl-10 pr-8 text-sm outline-none focus:border-blue-500 appearance-none cursor-pointer hover:bg-slate-700 transition-colors shadow-sm"
             >
                <option value="All">Tất cả trạng thái</option>
                <option value="Accepted">Accepted</option>
                <option value="Wrong Answer">Wrong Answer</option>
                <option value="Runtime Error">Runtime Error</option>
                <option value="Compilation Error">Compilation Error</option>
                <option value="Pending">Pending</option>
             </select>
             {/* Chevron Icon */}
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
             </div>
        </div>

        {/* Problem Filter */}
        <div className="relative group w-full sm:w-[300px]">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-blue-400 transition-colors z-10">
                <Code2 size={16} />
             </div>
             <select 
               value={problemIdFilter}
               onChange={e => setProblemIdFilter(e.target.value)}
               className="w-full h-10 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg pl-10 pr-8 text-sm outline-none focus:border-blue-500 appearance-none cursor-pointer hover:bg-slate-700 transition-colors shadow-sm truncate"
             >
                <option value="All">Tất cả bài tập</option>
                {problems.map((p) => {
                    const val = p.id || p.problemID;
                    const label = p.id ? `${p.id} - ${p.title}` : p.title;
                    return (
                        <option key={p.id || val} value={val}>
                            {label}
                        </option>
                    );
                })}
             </select>
             {/* Chevron Icon */}
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
             </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl animate-in fade-in duration-500">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm table-auto">
            <thead>
              <tr className="bg-[#0f172a]/50 text-slate-400 border-b border-slate-700">
                <th className="p-4 text-left font-bold border-r border-slate-700">
                  Mã nguồn
                </th>
                <th className="p-4 text-left font-bold border-r border-slate-700">
                  Bài tập
                </th>
                <th className="p-4 text-left font-bold border-r border-slate-700">
                  Ngôn ngữ
                </th>
                <th className="p-4 text-left font-bold border-r border-slate-700">
                  Thời gian
                </th>
                <th className="p-4 text-left font-bold border-r border-slate-700">
                  Bộ nhớ
                </th>
                <th className="p-4 text-left font-bold">Trạng thái</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {filteredSubmissions.map((sub) => {
                const isHighlighted = sub.id === activeHighlightId;
                
                // Format: "A - Title"
                // Tìm thông tin bài để lấy Logic ID (A, B...)
                const matchedProblem = problems.find(
                    (p) => p.problemID === sub.problemDocId || p.id === sub.problemId
                );
                const logicId = matchedProblem?.id || sub.problemId;
                
                // Nếu title chưa có prefix thì thêm vào
                let displayTitle = sub.problemTitle;
                if (logicId && !displayTitle.startsWith(logicId + " -")) {
                    displayTitle = `${logicId} - ${displayTitle}`;
                }

                return (
                <tr
                  key={sub.id}
                  id={`submission-${sub.id}`}
                  className={`transition-colors duration-1000 group ${
                    isHighlighted 
                      ? "bg-purple-500/10 border-l-4 border-l-purple-500" 
                      : "hover:bg-blue-500/5 border-l-4 border-l-transparent"
                  }`}
                >
                  <td className="p-4 text-center border-r border-slate-700">
                    <button
                      onClick={() => setSelectedSub(sub)}
                      className="inline-flex items-center justify-center p-2 hover:bg-slate-700 rounded-lg transition-all text-blue-400 hover:text-blue-300"
                      title="Xem code"
                    >
                      <Code2 size={20} />
                    </button>
                  </td>

                  <td className="p-4 font-bold border-r border-slate-700 text-white font-mono">
                    {displayTitle}
                  </td>

                  <td className="p-4 border-r border-slate-700 text-slate-300">
                    {sub.language}
                  </td>

                  <td className="p-4 border-r border-slate-700 text-slate-300 font-mono">
                    {sub.runtime}
                  </td>

                  <td className="p-4 border-r border-slate-700 text-slate-300 font-mono">
                    {sub.memory}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        sub.status === "Accepted"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>

          {filteredSubmissions.length === 0 && (
            <div className="p-10 text-center text-slate-500 italic">
              {submissions.length === 0 
                ? "Bạn chưa có bài nộp nào trong Contest này."
                : "Không tìm thấy bài nộp phù hợp với bộ lọc."}
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL HIỂN THỊ CHI TIẾT BÀI NỘP --- */}
      {selectedSub && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedSub(null)} // ✅ click overlay mới đóng
        >
          <div
            className="bg-slate-950 border border-slate-800 w-full max-w-4xl rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()} // ✅ click trong modal không đóng
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-4">
                <span
                  className={`text-lg font-bold ${
                    selectedSub.status === "Accepted"
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {selectedSub.status}
                </span>

                <div className="flex gap-3 text-xs text-slate-400">
                  <span className="bg-slate-800 px-2 py-1 rounded flex items-center gap-1">
                    <Clock size={12} /> {selectedSub.runtime || "N/A"}
                  </span>
                  <span className="bg-slate-800 px-2 py-1 rounded flex items-center gap-1">
                    <HardDrive size={12} /> {selectedSub.memory || "N/A"}
                  </span>
                  <span className="bg-slate-800 px-2 py-1 rounded uppercase font-bold text-blue-400">
                    {selectedSub.language || "N/A"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedSub(null)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content (Code) */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <CodeBlock
                code={selectedSub.code || ""}
                language={(selectedSub.language || "javascript").toLowerCase()}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-900/50">
              <span className="text-xs text-slate-500 italic">
                Đã nộp vào: {formatTime(selectedSub.timestamp)}
              </span>

              <button
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all border border-slate-600"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
