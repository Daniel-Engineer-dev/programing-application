"use client";

import { useEffect, useState } from "react";
import { db } from "@/src/api/firebase/firebase";
import { collection, getDocs, deleteDoc, doc, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { Plus, Trash2, Edit, Search, FileCode } from "lucide-react";

type Problem = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
};

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const q = query(collection(db, "problems"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Problem[];
      setProblems(list);
    } catch (error) {
      console.error("Failed to fetch problems", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài tập này?")) return;
    try {
      await deleteDoc(doc(db, "problems", id));
      setProblems(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      alert("Xóa thất bại");
    }
  };

  const filtered = problems.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-sm flex items-center gap-3">
             <FileCode className="text-blue-400" size={36} />
             Quản Lý Bài Tập
          </h1>
          <p className="text-slate-400 mt-2 text-lg font-medium">Kho tàng kiến thức và thử thách</p>
        </div>
        <Link href="/admin/problems/new">
          <button className="group relative bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-0.5 overflow-hidden">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <Plus size={22} className="group-hover:rotate-90 transition-transform relative z-10" /> 
            <span className="relative z-10">Thêm Bài Mới</span>
          </button>
        </Link>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-xl p-2 rounded-2xl border border-slate-800/60 shadow-2xl">
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-20 group-focus-within:opacity-100 transition duration-300 blur-sm"></div>
            <div className="relative flex items-center bg-slate-950 rounded-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm bài tập theo tên..." 
                    className="w-full bg-transparent border-none rounded-xl pl-12 pr-4 py-4 outline-none text-slate-200 placeholder:text-slate-600 font-medium"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-950/40 text-slate-400 border-b border-slate-800/50 uppercase text-xs tracking-wider font-bold">
                    <th className="px-8 py-6">Tên Bài</th>
                    <th className="px-6 py-6">Độ Khó</th>
                    <th className="px-6 py-6">Thẻ (Tags)</th>
                    <th className="px-6 py-6 text-right">Hành Động</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
                {filtered.map(p => (
                    <tr key={p.id} className="group hover:bg-blue-500/5 transition-all duration-200">
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-all shadow-sm border border-blue-500/10 group-hover:border-blue-500/30">
                                    <FileCode size={24} strokeWidth={1.5} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-200 text-lg block group-hover:text-blue-400 transition-colors mb-1">{p.title}</span>
                                    <span className="text-[10px] text-slate-500 font-mono bg-slate-950/50 px-1.5 py-0.5 rounded w-fit">{p.id}</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-5">
                            <span className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border shadow-sm ${
                                p.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-green-500/10' :
                                p.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-yellow-500/10' :
                                'bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/10'
                            }`}>
                                {p.difficulty}
                            </span>
                        </td>
                        <td className="px-6 py-5">
                            <div className="flex flex-wrap gap-2">
                                {p.tags.map(t => (
                                    <span key={t} className="px-2.5 py-1 bg-slate-800/60 text-slate-300 rounded-md text-[11px] font-semibold border border-slate-700/60">
                                        #{t}
                                    </span>
                                ))}
                            </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-3 opacity-60 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-300">
                                <Link href={`/admin/problems/${p.id}`}>
                                    <button className="p-2.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-xl transition-all border border-transparent hover:border-blue-500/30">
                                        <Edit size={18} />
                                    </button>
                                </Link>
                                <button 
                                    onClick={() => handleDelete(p.id)}
                                    className="p-2.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-500/30"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {filtered.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                     <FileCode size={32} className="opacity-30" />
                </div>
                <p className="font-medium">Không tìm thấy bài tập nào.</p>
            </div>
        )}
        {loading && (
             <div className="p-12 text-center">
                 <div className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                 <p className="mt-2 text-slate-500 text-sm">Đang tải...</p>
             </div>
        )}
      </div>
    </div>
  );
}
