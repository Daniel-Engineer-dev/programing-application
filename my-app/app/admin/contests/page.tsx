"use client";

import { useState, useEffect } from "react";
import { db } from "@/src/api/firebase/firebase";
import { collection, getDocs, deleteDoc, doc, query } from "firebase/firestore";
import Link from "next/link";
import { Plus, Edit, Trash2, Search, Trophy, Calendar, Clock, Users } from "lucide-react";
import { format } from "date-fns";

type Contest = {
  id: string;
  title: string;
  description: string;
  startTime: string; // ISO string 
  endTime: string;
  participants?: any; // Can be number or array
  problems?: any[];
  status?: "upcoming" | "ongoing" | "ended";
};

export default function ContestsAdminPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      setError("");
      const q = query(collection(db, "contests"));
      const snapshot = await getDocs(q);
      
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        let start: Date = new Date();
        let end: Date = new Date();
        let isParsed = false;
        
        try {
            // Handle Legacy Schema mixed with New Schema
            if (data.time && (data.length !== undefined)) {
                let parsedStart = new Date(data.time);
                
                if (isNaN(parsedStart.getTime())) {
                     let timeStr = data.time
                        .replace(" at ", " ")
                        .replace(/UTC([+-]\d+)/, "GMT$1")
                        .replace(/\u202F/g, " ");

                     if (timeStr.match(/00:\d{2}:\d{2}\s*AM/)) {
                        timeStr = timeStr.replace("00:", "12:");
                     }
                     
                     parsedStart = new Date(timeStr);
                }

                if (!isNaN(parsedStart.getTime())) {
                    start = parsedStart;
                    const len = Number(data.length) || 180;
                    end = new Date(start.getTime() + len * 60 * 1000);
                    isParsed = true;
                }
            } 
            
            // Fallback: If legacy parsing failed or didn't exist, try standard fields
            if (!isParsed) {
                start = new Date(data.startTime || Date.now());
                end = new Date(data.endTime || Date.now());
            }

            // Final safety checks
            if (isNaN(start.getTime())) start = new Date();
            if (isNaN(end.getTime())) end = new Date(start.getTime() + 60*60*1000);

        } catch (e) {
            console.error("Date parsing error for contest", doc.id, e);
            // defaults are already set to new Date() at init, but reset to be sure
            start = new Date();
            end = new Date();
        }

        const now = new Date();
        let status: "upcoming" | "ongoing" | "ended" = "upcoming";
        if (now > end) status = "ended";
        else if (now >= start && now <= end) status = "ongoing";

        return {
          ...data,
          id: doc.id, // Ensure Firestore ID is used, not overridden by potential empty 'id' field in data
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          status
        };
      }) as Contest[];
      
      // Sort: Newest first
      list.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      
      setContests(list);
    } catch (err: any) {
      console.error("Error fetching contests:", err);
      setError(err.message || "Lỗi tải dữ liệu. Vui lòng kiểm tra kết nối.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa cuộc thi này? Hành động này không thể hoàn tác.")) return;
    try {
      await deleteDoc(doc(db, "contests", id));
      setContests(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      alert("Xóa thất bại");
    }
  };

  const filteredContests = contests.filter(c => 
    c.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent flex items-center gap-3 drop-shadow-sm">
             <Trophy className="text-yellow-400" size={36} />
             Quản Lý Cuộc Thi
          </h1>
          <p className="text-slate-400 mt-2 text-lg font-medium flex items-center gap-2">
            Đấu trường trí tuệ và tranh tài
            {!loading && <span className="text-xs bg-slate-800/50 border border-slate-700/50 px-2 py-0.5 rounded-full text-slate-400 font-mono">Total: {contests.length}</span>}
          </p>
        </div>
        <Link href="/admin/contests/new">
          <button className="group relative bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 overflow-hidden">
             <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <Plus size={22} className="group-hover:rotate-90 transition-transform relative z-10" /> 
            <span className="relative z-10">Tạo Cuộc Thi</span>
          </button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-red-400 font-bold mb-4 flex items-center gap-4 backdrop-blur-sm">
            <div className="p-2 bg-red-500/20 rounded-full"><span className="text-xl">⚠️</span></div>
            <div>
                <p>Đã xảy ra lỗi khi tải dữ liệu</p>
                <p className="text-xs font-mono font-normal opacity-80 mt-1">{error}</p>
            </div>
        </div>
      )}

      <div className="bg-slate-900/40 backdrop-blur-xl p-2 rounded-2xl border border-slate-800/60 shadow-2xl">
         <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl opacity-20 group-focus-within:opacity-100 transition duration-300 blur-sm"></div>
            <div className="relative flex items-center bg-slate-950 rounded-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-400 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm cuộc thi..." 
                    className="w-full bg-transparent border-none rounded-xl pl-12 pr-4 py-4 outline-none text-slate-200 placeholder:text-slate-600 font-medium"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {filteredContests.map((c, idx) => (
            <div key={`contest-${c.id || idx}`} className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 hover:border-yellow-500/30 transition-all shadow-2xl backdrop-blur-md group relative overflow-hidden group hover:shadow-yellow-500/5">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="absolute top-0 right-0 p-8 opacity-5 text-yellow-500 group-hover:opacity-10 transition-opacity duration-500 rotate-12 transform scale-150">
                    <Trophy size={150} />
                </div>
                
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                        <div className="flex items-start gap-6">
                             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 flex items-center justify-center border border-yellow-500/20 text-yellow-500 shadow-lg shadow-yellow-500/10 group-hover:scale-105 transition-transform duration-300">
                                <Trophy size={32} />
                             </div>
                             <div>
                                <h3 className="text-2xl font-bold text-slate-100 group-hover:text-yellow-400 transition-colors">{c.title}</h3>
                                <div className="flex items-center gap-3 text-xs font-mono text-slate-500 mt-2">
                                    <span className="bg-slate-950/50 px-2 py-1 rounded border border-slate-800/50">ID: {c.id}</span>
                                </div>
                             </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border shadow-sm ${
                             c.status === 'ongoing' ? 'bg-green-500/10 text-green-400 border-green-500/20 animate-pulse shadow-green-500/20' :
                             c.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/20' :
                             'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                            {c.status === 'upcoming' ? 'Sắp Diễn Ra' : c.status === 'ongoing' ? 'Đang Diễn Ra' : 'Đã Kết Thúc'}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50 flex items-center gap-4 hover:bg-slate-900/50 transition-colors">
                            <div className="p-2 bg-slate-800/50 rounded-lg text-slate-400">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Thời Gian Bắt Đầu</p>
                                <p className="text-sm text-slate-200 font-mono font-medium">{format(new Date(c.startTime), "dd/MM/yyyy • HH:mm")}</p>
                            </div>
                        </div>
                        <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50 flex items-center gap-4 hover:bg-slate-900/50 transition-colors">
                            <div className="p-2 bg-slate-800/50 rounded-lg text-slate-400">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Thời Gian Kết Thúc</p>
                                <p className="text-sm text-slate-200 font-mono font-medium">{format(new Date(c.endTime), "dd/MM/yyyy • HH:mm")}</p>
                            </div>
                        </div>
                         <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50 flex items-center gap-4 hover:bg-slate-900/50 transition-colors">
                            <div className="p-2 bg-slate-800/50 rounded-lg text-slate-400">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Số Lượng Tham Gia</p>
                                <p className="text-sm text-slate-200 font-mono font-medium">
                                    <span className="text-lg font-bold text-white mr-1">
                                    {Array.isArray(c.participants) 
                                        ? c.participants.length 
                                        : (typeof c.participants === 'number' ? c.participants : 0)}
                                    </span>
                                    thí sinh
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-slate-800/50">
                        <Link 
                            href={`/admin/contests/${c.id}`}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-sm font-bold border border-slate-700/50 hover:border-slate-600 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                            <Edit size={16} strokeWidth={2.5} /> Chỉnh Sửa
                        </Link>
                        <button 
                            onClick={() => handleDelete(c.id)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all text-sm font-bold border border-red-500/20 hover:border-red-500/30 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                            <Trash2 size={16} strokeWidth={2.5} /> Xóa
                        </button>
                    </div>
                </div>
            </div>
        ))}
        {filteredContests.length === 0 && !loading && !error && (
             <div className="flex flex-col items-center justify-center py-32 text-slate-500">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                    <Trophy size={40} className="opacity-30" />
                </div>
                <p className="font-medium text-lg">Chưa có cuộc thi nào.</p>
                <p className="text-sm opacity-60 mt-1">Hãy tạo cuộc thi mới để bắt đầu thử thách!</p>
            </div>
        )}
        {loading && (
             <div className="p-20 text-center">
                 <div className="inline-block w-10 h-10 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
                 <p className="text-slate-500 font-medium">Đang tải danh sách...</p>
             </div>
        )}
      </div>
    </div>
  );
}
