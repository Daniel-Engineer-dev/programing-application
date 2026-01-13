"use client";

import { useEffect, useState } from "react";
import { Users, FileCode, AlertTriangle } from "lucide-react";
import { db } from "@/src/api/firebase/firebase";
import { collection, collectionGroup, getCountFromServer, query, where } from "firebase/firestore";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: { total: 0, new: 0 },
    problems: { total: 0, new: 0 },
    reports: { total: 0, pending: 0 } // Pending logic might need status field, for now just total
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Users Stats
        const usersColl = collection(db, "users");
        const totalUsersSnap = await getCountFromServer(usersColl);
        const newUsersSnap = await getCountFromServer(query(usersColl, where("createdAt", ">=", startOfMonth)));

        // 2. Problems Stats
        const problemsColl = collection(db, "problems");
        const totalProblemsSnap = await getCountFromServer(problemsColl);
        const newProblemsSnap = await getCountFromServer(query(problemsColl, where("createdAt", ">=", startOfMonth)));

        // 3. Reports Stats (Collection Group)
        const reportsQuery = collectionGroup(db, "reports");
        const totalReportsSnap = await getCountFromServer(reportsQuery);
        // Assuming we want to count specific type or just all? For now all.
        // For "Pending", if we had a status field we could query it. 
        // Based on previous code, report structure is simple. We'll show Total Reports.

        setStats({
          users: { total: totalUsersSnap.data().count, new: newUsersSnap.data().count },
          problems: { total: totalProblemsSnap.data().count, new: newProblemsSnap.data().count },
          reports: { total: totalReportsSnap.data().count, pending: 0 }
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-slate-400">Đang tải thống kê...</div>;

  return (
    <div>
      <h1 className="text-4xl font-extrabold mb-10 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
        Tổng Quan Hệ Thống
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Users Card */}
        <div className="relative group overflow-hidden bg-slate-900/40 p-8 rounded-3xl border border-slate-800/60 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-blue-500/10">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 rotate-12 transform scale-150">
            <Users size={120} className="text-blue-500" />
          </div>
          <div className="relative z-10 space-y-4">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Users size={24} className="text-white" />
             </div>
             <div>
                <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Tổng Người Dùng</h3>
                <p className="text-5xl font-black text-white mt-2 tracking-tight">{stats.users.total.toLocaleString()}</p>
             </div>
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/10 text-xs font-bold text-blue-400">
                <span>+{stats.users.new} tháng này</span>
             </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none"></div>
        </div>
        
        {/* Problems Card */}
        <div className="relative group overflow-hidden bg-slate-900/40 p-8 rounded-3xl border border-slate-800/60 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-emerald-500/10">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 rotate-12 transform scale-150">
            <FileCode size={120} className="text-emerald-500" />
          </div>
          <div className="relative z-10 space-y-4">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <FileCode size={24} className="text-white" />
             </div>
             <div>
                <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Tổng Bài Tập</h3>
                <p className="text-5xl font-black text-white mt-2 tracking-tight">{stats.problems.total.toLocaleString()}</p>
             </div>
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/10 text-xs font-bold text-emerald-400">
                <span>+{stats.problems.new} bài mới</span>
             </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none"></div>
        </div>

        {/* Reports Card */}
        <div className="relative group overflow-hidden bg-slate-900/40 p-8 rounded-3xl border border-slate-800/60 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-red-500/10">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 rotate-12 transform scale-150">
            <AlertTriangle size={120} className="text-red-500" />
          </div>
          <div className="relative z-10 space-y-4">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                <AlertTriangle size={24} className="text-white" />
             </div>
             <div>
                <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Báo Cáo Vi Phạm</h3>
                <p className="text-5xl font-black text-white mt-2 tracking-tight">{stats.reports.total.toLocaleString()}</p>
             </div>
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/10 text-xs font-bold text-red-400">
                <span>Cần xử lý ngay</span>
             </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
}
