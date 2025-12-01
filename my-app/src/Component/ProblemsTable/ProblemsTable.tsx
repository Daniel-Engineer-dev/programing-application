"use client";

import Link from "next/link";
import { Search, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/src/api/firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";

type Problem = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  acceptance: number;
  tags: string[];
  status?: "Solved" | "Attempted" | "Todo";
};

const badgeColor = (d: Problem["difficulty"]) =>
  d === "Easy"
    ? "text-white font-bold bg-green-800"
    : d === "Medium"
    ? "text-white font-bold bg-yellow-800"
    : "text-white font-bold bg-red-800";

export default function ProblemsTable() {
  const [problems, setProblems] = useState<Problem[]>([]);

  useEffect(() => {
    // Lắng nghe realtime Firestore
    const unsub = onSnapshot(collection(db, "problems"), (snapshot) => {
      const list: Problem[] = snapshot.docs.map((doc) => doc.data() as Problem);
      setProblems(list);
    });

    return () => unsub(); // cleanup
  }, []);

  return (
    <section className="mt-6 px-12 pb-16 pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        {/* Search */}
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm bài tập..."
            className="w-full rounded-lg bg-slate-800 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent focus:border-blue-500 transition-all"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
          <button className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">
            Độ khó <ChevronDown className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">
            Chủ đề <ChevronDown className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">
            Độ phổ biến <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-slate-800">
        <table className="min-w-full table-fixed text-sm">
          <thead className="bg-blue-950 text-white">
            <tr className="text-left">
              <th className="w-12 px-4 py-3">#</th>
              <th className="px-4 py-3">Đề bài</th>
              <th className="w-28 px-4 py-3">Độ khó</th>
              <th className="w-32 px-4 py-3">Hoàn thành</th>
              <th className="px-4 py-3">Nhãn</th>
              <th className="w-28 px-4 py-3">Trạng thái</th>
            </tr>
          </thead>

          <tbody>
            {problems.map((p, i) => (
              <tr key={p.id} className="hover:bg-slate-900 text-white">
                <td className="px-4 py-3">{i + 1}</td>

                <td className="px-4 py-3">
                  <Link
                    href={`/routes/problems/${p.id}`}
                    className="font-bold hover:text-blue-600"
                  >
                    {p.title}
                  </Link>
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs ${badgeColor(
                      p.difficulty
                    )}`}
                  >
                    {p.difficulty}
                  </span>
                </td>

                <td className="px-4 py-3">{Math.round(p.acceptance * 100)}%</td>

                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {p.tags?.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-blue px-2 py-0.5 text-xs"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`text-xs ${
                      p.status === "Solved"
                        ? "text-green-600"
                        : p.status === "Attempted"
                        ? "text-yellow-700"
                        : "text-gray-500"
                    }`}
                  >
                    {p.status ?? "-"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
