"use client";

import { useEffect, useState } from "react";
import { db } from "@/src/api/firebase/firebase";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { Plus, Search, Trash2, Pencil, BookOpen, User, Layers } from "lucide-react";
import { toast } from "sonner";

export default function GuidesListPage() {
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "guides"), (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGuides(list);
        setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa hướng dẫn "${title}"?`)) return;
    try {
        await deleteDoc(doc(db, "guides", id));
        toast.success("Xóa hướng dẫn thành công");
    } catch (e) {
        toast.error("Lỗi khi xóa");
    }
  };

  const filteredGuides = guides.filter(g => 
    g.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
          <div className="animate-spin mr-2 w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full"></div>
          Đang tải...
      </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-4xl font-extrabold bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent flex items-center gap-3 drop-shadow-sm">
            <BookOpen className="text-orange-400" size={36} />
            Quản Lý Hướng Dẫn
          </h1>
          <p className="text-slate-400 mt-2 text-lg font-medium">Viết và quản lý các bài hướng dẫn, blog công nghệ</p>
        </div>
        <Link 
            href="/admin/explore/guides/new"
             className="group relative bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 overflow-hidden"
        >
             <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <Plus size={22} className="group-hover:rotate-90 transition-transform relative z-10" />
            <span className="relative z-10">Viết Hướng Dẫn</span>
        </Link>
      </div>

       <div className="bg-slate-900/40 backdrop-blur-xl p-2 rounded-2xl border border-slate-800/60 shadow-2xl max-w-2xl">
         <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl opacity-20 group-focus-within:opacity-100 transition duration-300 blur-sm"></div>
            <div className="relative flex items-center bg-slate-950 rounded-xl">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-400 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm hướng dẫn..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-none rounded-xl pl-12 pr-4 py-4 outline-none text-slate-200 placeholder:text-slate-600 font-medium transition-all"
                />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
          {filteredGuides.map((guide) => (
              <div key={guide.id} className="group flex flex-col md:flex-row bg-slate-900/40 border border-slate-800/60 rounded-3xl overflow-hidden hover:border-orange-500/30 transition-all hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1 backdrop-blur-md relative h-full md:h-60">
                   <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                  <div className="w-full md:w-72 relative bg-slate-950/50 shrink-0 overflow-hidden">
                      {guide.backgroundImage ? (
                          <img 
                            src={guide.backgroundImage} 
                            alt={guide.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-900">
                             <BookOpen size={48} className="opacity-20 group-hover:opacity-40 transition-opacity text-orange-500" />
                          </div>
                      )}
                      
                       <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900/80 via-transparent to-transparent opacity-60" />

                      {/* Level Badge */}
                      <div className="absolute top-4 left-4 px-3 py-1 bg-slate-950/80 backdrop-blur-md rounded-lg text-xs font-bold text-white uppercase border border-slate-700/50 shadow-lg">
                          {guide.level}
                      </div>
                  </div>

                  <div className="flex-1 p-6 md:p-8 flex flex-col relative z-10">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-2xl font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1 pr-4">
                            {guide.title}
                        </h3>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-4 font-mono">
                          <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">
                              <User size={12} strokeWidth={2.5} />
                              {guide.author}
                          </span>
                          <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">
                              <Layers size={12} strokeWidth={2.5} />
                              {guide.type}
                          </span>
                      </div>

                      <p className="text-slate-400 text-sm line-clamp-2 md:line-clamp-3 mb-6 leading-relaxed flex-1">
                          {guide.desc || "Chưa có mô tả chi tiết cho hướng dẫn này."}
                      </p>
                      
                      <div className="flex items-center justify-end pt-4 border-t border-slate-800/50 gap-3 mt-auto">
                            <Link 
                                href={`/admin/explore/guides/${guide.id}`}
                                className="px-5 py-2.5 bg-slate-800 hover:bg-orange-500/20 text-slate-300 hover:text-orange-400 rounded-xl transition-all border border-slate-700/50 hover:border-orange-500/30 text-sm font-bold flex items-center gap-2"
                            >
                                <Pencil size={16} strokeWidth={2.5} /> Chỉnh sửa
                            </Link>
                            <button 
                                onClick={() => handleDelete(guide.id, guide.title)}
                                className="p-2.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-500/30"
                            >
                                <Trash2 size={18} strokeWidth={2.5} />
                            </button>
                      </div>
                  </div>
              </div>
          ))}

          {filteredGuides.length === 0 && !loading && (
             <div className="col-span-full py-24 text-center text-slate-500 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center">
                  <BookOpen size={48} className="opacity-20 mb-4" />
                  <p className="font-medium text-lg">Không tìm thấy hướng dẫn nào</p>
                  <p className="text-sm opacity-60">Thử tìm kiếm từ khóa khác hoặc viết bài mới</p>
              </div>
          )}
      </div>
    </div>
  );
}
