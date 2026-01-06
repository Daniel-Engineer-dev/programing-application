"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { db } from "@/src/api/firebase/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import Link from "next/link";
import { Clock, Code2, CheckCircle2, XCircle, Hash } from "lucide-react";

// Định nghĩa kiểu dữ liệu cho một bản ghi nộp bài
type Submission = {
  id: string;
  problemId: string;
  problemTitle: string;
  status: string;
  timestamp: any;
};

// Kiểu dữ liệu sau khi đã nhóm theo bài tập
type HistoryItem = {
  problemId: string;
  problemTitle: string;
  lastStatus: string;
  lastSubmitted: any;
  submissionCount: number;
};

export default function HistoryPracticePage() {
  const { user } = useAuthContext();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    // Truy vấn lấy tất cả bài nộp của user, sắp xếp theo thời gian mới nhất
    const subsRef = collection(db, "users", user.uid, "submissions");
    const q = query(subsRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allSubmissions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Submission[];

      // Logic: Nhóm dữ liệu theo problemId
      const grouped = allSubmissions.reduce((acc, curr) => {
        if (!acc[curr.problemId]) {
          acc[curr.problemId] = {
            problemId: curr.problemId,
            problemTitle: curr.problemTitle || "Không rõ tên",
            lastStatus: curr.status,
            lastSubmitted: curr.timestamp,
            submissionCount: 1,
          };
        } else {
          acc[curr.problemId].submissionCount += 1;
        }
        return acc;
      }, {} as Record<string, HistoryItem>);

      setHistory(Object.values(grouped));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Hàm định dạng thời gian thân thiện (Ví dụ: 2 giờ trước)
  const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return "...";
    const date = timestamp.toDate();
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Vừa xong";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="text-white bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-900 p-4 md:p-12 min-h-screen relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-2xl border border-blue-500/30 backdrop-blur-xl shadow-lg">
            <Clock className="text-blue-400" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent">Lịch sử luyện tập</h1>
            <p className="text-slate-400 text-base mt-1">
              Theo dõi quá trình chinh phục thuật toán của bạn
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900/50 to-blue-900/20 border border-blue-500/20 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gradient-to-r from-slate-800/90 to-blue-900/40 text-blue-300 text-xs uppercase tracking-wider border-b border-blue-500/20">
              <tr>
                <th className="p-4 font-semibold">
                  <Hash size={16} />
                </th>
                <th className="p-4 font-semibold">Bài tập</th>
                <th className="p-4 font-semibold text-center">
                  Kết quả gần nhất
                </th>
                <th className="p-4 font-semibold text-center">Số lần nộp</th>
                <th className="p-4 font-semibold text-right text-nowrap">
                  Nộp lần cuối
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-blue-500/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500">
                    Bạn chưa nộp bài tập nào.
                  </td>
                </tr>
              ) : (
                history.map((item, index) => (
                  <tr
                    key={item.problemId}
                    className="hover:bg-gradient-to-r hover:from-slate-800/40 hover:to-blue-900/20 transition-all duration-300 group border-l-4 border-l-transparent hover:border-l-blue-500"
                  >
                    <td className="p-5 text-blue-400/50 font-mono font-bold">
                      {index + 1}
                    </td>
                    <td className="p-5">
                      <Link
                        href={`/routes/problems/${item.problemId}`}
                        className="flex items-center gap-2 font-bold text-slate-200 group-hover:text-blue-400 group-hover:translate-x-1 transition-all"
                      >
                        <Code2 size={16} className="text-slate-500" />
                        {item.problemTitle}
                      </Link>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center">
                        {item.lastStatus === "Accepted" ? (
                          <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-400 text-xs font-bold border border-green-500/30 shadow-lg shadow-green-500/10">
                            <CheckCircle2 size={14} /> Chấp nhận
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500/10 to-rose-500/10 text-red-400 text-xs font-bold border border-red-500/30 shadow-lg shadow-red-500/10">
                            <XCircle size={14} /> {item.lastStatus || "Lỗi"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-400 text-xs font-bold border border-blue-500/30 min-w-[50px]">
                        {item.submissionCount}
                      </span>
                    </td>
                    <td className="p-5 text-right text-slate-400 text-sm font-medium">
                      {formatRelativeTime(item.lastSubmitted)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
