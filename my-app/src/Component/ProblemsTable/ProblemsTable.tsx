"use client";

import Link from "next/link";
import { Search, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { db } from "@/src/api/firebase/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

type Problem = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  acceptance: number; // Giờ sẽ dùng làm con số tĩnh hiển thị % hoàn thành
  tags: string[];
};

const badgeColor = (d: Problem["difficulty"]) =>
  d === "Easy"
    ? "text-white bg-green-800"
    : d === "Medium"
    ? "text-white bg-yellow-800"
    : "text-white bg-red-800";

export default function ProblemsTable() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [user, setUser] = useState<User | null>(null);

  // State lưu trạng thái bài tập: { "two-sum": "Solved", "slug-2": "Attempted" }
  const [statusMap, setStatusMap] = useState<
    Record<string, "Solved" | "Attempted">
  >({});

  // 1. Lắng nghe trạng thái đăng nhập
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

  // 3. Lắng nghe lịch sử nộp bài để xác định trạng thái (Solved/Attempted)
  useEffect(() => {
    if (!user) {
      setStatusMap({});
      return;
    }

    // Truy vấn vào users -> {uid} -> submissions
    const subsRef = collection(db, "users", user.uid, "submissions");

    // Lắng nghe realtime để cập nhật dấu tick ngay khi nộp bài thành công
    return onSnapshot(subsRef, (snapshot) => {
      const newStatusMap: Record<string, "Solved" | "Attempted"> = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const pId = data.problemId;
        const currentStatus = data.status;

        // Logic ưu tiên: Nếu đã có một bản ghi Accepted thì luôn là Solved
        if (newStatusMap[pId] !== "Solved") {
          newStatusMap[pId] =
            currentStatus === "Accepted" ? "Solved" : "Attempted";
        }
      });

      setStatusMap(newStatusMap);
    });
  }, [user]);

  return (
    <section className="mt-6 px-12 pb-16 pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm bài tập..."
            className="w-full rounded-lg bg-slate-800 py-3 pl-10 pr-4 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 border border-transparent transition-all"
          />
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700">
            Độ khó <ChevronDown className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700">
            Chủ đề <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
        <table className="min-w-full table-fixed text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr className="text-left">
              <th className="w-12 px-4 py-3">#</th>
              <th className="px-4 py-3">Đề bài</th>
              <th className="w-28 px-4 py-3">Độ khó</th>
              <th className="w-32 px-4 py-3">Hoàn thành</th>
              <th className="px-4 py-3">Nhãn</th>
              <th className="w-36 px-4 py-3">Trạng thái</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700">
            {problems.map((p, i) => {
              const status = statusMap[p.id] || "Todo";

              const statusUI = {
                Solved: {
                  color: "text-green-500",
                  label: "Solved",
                  icon: <CheckIcon />,
                },
                Attempted: {
                  color: "text-yellow-500",
                  label: "Attempted",
                  icon: <XIcon />,
                },
                Todo: { color: "text-slate-500", label: "-", icon: null },
              }[status];

              return (
                <tr
                  key={p.id}
                  className="hover:bg-slate-900/50 text-white transition-colors"
                >
                  <td className="px-4 py-4 text-slate-500">{i + 1}</td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/routes/problems/${p.id}`}
                      className="font-bold hover:text-blue-400 transition-colors"
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badgeColor(
                        p.difficulty
                      )}`}
                    >
                      {p.difficulty}
                    </span>
                  </td>
                  {/* Số liệu tĩnh: 65% là ví dụ, bạn có thể dùng field p.acceptance từ DB */}
                  <td className="px-4 py-4 text-slate-400 italic">65.2%</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {p.tags?.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] text-slate-400 border border-slate-600"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div
                      className={`flex items-center gap-1.5 text-xs font-medium ${statusUI.color}`}
                    >
                      {statusUI.icon}
                      {statusUI.label}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// Icon Components
const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
