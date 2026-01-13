"use client";

import { db } from "@/src/api/firebase/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Search, Plus, Check } from "lucide-react";
import { useEffect, useState } from "react";

type Problem = {
  id: string;
  title: string;
  difficulty: string;
  tags: string[];
};

type Props = {
  onSelect: (problem: Problem) => void;
  excludeIds: string[];
  onClose: () => void;
};

export default function ProblemPicker({ onSelect, excludeIds, onClose }: Props) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const q = query(collection(db, "problems"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Problem[];
      setProblems(list);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = problems.filter(p => 
    !excludeIds.includes(p.id) && 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-2xl">
            <div>
                <h3 className="text-xl font-bold text-slate-100">Chọn Bài Tập</h3>
                <p className="text-sm text-slate-400">Thêm bài tập vào cuộc thi</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                Đóng
            </button>
        </div>

        <div className="p-4 bg-slate-900/50 border-b border-slate-800">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                    type="text"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 text-slate-200 transition-all placeholder:text-slate-600"
                    placeholder="Tìm kiếm bài tập..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    autoFocus
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {loading ? (
                <div className="p-12 text-center text-slate-500">Đang tải danh sách...</div>
            ) : filtered.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                    {searchTerm ? "Không tìm thấy bài tập nào khớp." : "Đã chọn hết bài tập."}
                </div>
            ) : (
                filtered.map(p => (
                    <button 
                        key={`picker-${p.id}`}
                        onClick={() => onSelect(p)}
                        className="w-full text-left p-3 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-between group border border-transparent hover:border-slate-700"
                    >
                        <div>
                            <div className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{p.title}</div>
                            <div className="flex gap-2 text-xs mt-1">
                                <span className={`px-1.5 py-0.5 rounded uppercase font-bold ${
                                    p.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400' :
                                    p.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                    'bg-red-500/10 text-red-400'
                                }`}>
                                    {p.difficulty}
                                </span>
                                <span className="text-slate-500 font-mono">#{p.id}</span>
                            </div>
                        </div>
                        <div className="bg-blue-500/10 text-blue-400 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <Plus size={18} />
                        </div>
                    </button>
                ))
            )}
        </div>
      </div>
    </div>
  );
}
