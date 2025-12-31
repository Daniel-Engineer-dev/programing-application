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
    <div className="text-white bg-slate-950 p-4 md:p-12 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-600/20 rounded-xl">
            <Clock className="text-blue-500" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Lịch sử luyện tập</h1>
            <p className="text-slate-400 text-sm">
              Theo dõi quá trình chinh phục thuật toán của bạn
            </p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
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

            <tbody className="divide-y divide-slate-800">
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
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="p-4 text-slate-600 font-mono">
                      {index + 1}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/routes/problems/${item.problemId}`}
                        className="flex items-center gap-2 font-bold text-slate-200 group-hover:text-blue-400 transition-colors"
                      >
                        <Code2 size={16} className="text-slate-500" />
                        {item.problemTitle}
                      </Link>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        {item.lastStatus === "Accepted" ? (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">
                            <CheckCircle2 size={14} /> Chấp nhận
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20">
                            <XCircle size={14} /> {item.lastStatus || "Lỗi"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                        {item.submissionCount}
                      </span>
                    </td>
                    <td className="p-4 text-right text-slate-400 text-sm">
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
