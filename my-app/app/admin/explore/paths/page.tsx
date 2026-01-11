"use client";

import { useEffect, useState } from "react";
import { db } from "@/src/api/firebase/firebase";
import { collection, deleteDoc, doc, onSnapshot, query } from "firebase/firestore";
import Link from "next/link";
import { Plus, Search, Trash2, Pencil, Map } from "lucide-react";
import { toast } from "sonner";

export default function PathsListPage() {
  const [paths, setPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "learning_paths"), (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPaths(list);
        setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa lộ trình "${title}"?`)) return;
    try {
        await deleteDoc(doc(db, "learning_paths", id));
        toast.success("Xóa lộ trình thành công");
    } catch (e) {
        toast.error("Lỗi khi xóa");
    }
  };

  const filteredPaths = paths.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
          <div className="animate-spin mr-2 w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          Đang tải...
      </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3 drop-shadow-sm">
            <Map className="text-blue-400" size={36} />
            Quản Lý Lộ Trình
          </h1>
          <p className="text-slate-400 mt-2 text-lg font-medium">Xây dựng lộ trình học tập bài bản</p>
        </div>
        <Link 
            href="/admin/explore/paths/new"
             className="group relative bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 overflow-hidden"
        >
             <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <Plus size={22} className="group-hover:rotate-90 transition-transform relative z-10" />
            <span className="relative z-10">Tạo Lộ Trình</span>
        </Link>
      </div>

       <div className="bg-slate-900/40 backdrop-blur-xl p-2 rounded-2xl border border-slate-800/60 shadow-2xl max-w-2xl">
         <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-sky-500 rounded-xl opacity-20 group-focus-within:opacity-100 transition duration-300 blur-sm"></div>
            <div className="relative flex items-center bg-slate-950 rounded-xl">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm lộ trình..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-none rounded-xl pl-12 pr-4 py-4 outline-none text-slate-200 placeholder:text-slate-600 font-medium transition-all"
                />
            </div>
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredPaths.map((path) => (
              <div key={path.id} className="group flex flex-col bg-slate-900/40 border border-slate-800/60 rounded-3xl overflow-hidden hover:border-blue-500/30 transition-all hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 backdrop-blur-md relative">
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                  <div className="relative h-64 overflow-hidden bg-slate-950/50">
                      {path.backgroundImage ? (
                          <img 
                            src={path.backgroundImage} 
                            alt={path.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90 group-hover:brightness-100"
                          />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-900">
                             <Map size={64} className="opacity-20 group-hover:opacity-40 transition-opacity text-blue-500" />
                          </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90" />
                      
                      <div className="absolute bottom-6 left-8 right-8">
                           <h3 className="text-3xl font-bold text-white mb-2 leading-tight drop-shadow-lg group-hover:text-sky-400 transition-colors">
                            {path.title}
                          </h3>
                          <div className="flex items-center gap-2">
                               <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/20">
                                   <Map size={12} />
                                   {path.lessons?.length || 0} bài học
                               </span>
                          </div>
                      </div>
                  </div>

                  <div className="p-8 flex flex-col flex-1 relative z-10">
                      <p className="text-slate-400 text-sm line-clamp-2 mb-6 leading-relaxed flex-1 min-h-[40px]">
                          {path.desc || "Thông tin lộ trình đang được cập nhật."}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-800/50">
                           <Link 
                                href={`/admin/explore/paths/${path.id}`}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-blue-500/20 text-slate-300 hover:text-blue-400 rounded-xl font-bold transition-all border border-slate-700/50 hover:border-blue-500/30 text-sm mr-4"
                            >
                                <Pencil size={16} strokeWidth={2.5} />
                                Chỉnh sửa nội dung
                            </Link>

                          <div className="flex items-center gap-2">
                            <button 
                                onClick={() => handleDelete(path.id, path.title)}
                                className="p-3 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-500/30"
                                title="Xóa lộ trình"
                            >
                                <Trash2 size={18} strokeWidth={2.5} />
                            </button>
                          </div>
                      </div>
                  </div>
              </div>
          ))}

          {filteredPaths.length === 0 && !loading && (
             <div className="col-span-full py-24 text-center text-slate-500 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center">
                  <Map size={48} className="opacity-20 mb-4" />
                  <p className="font-medium text-lg">Không tìm thấy lộ trình nào</p>
                  <p className="text-sm opacity-60">Hãy bắt đầu tạo lộ trình học tập đầu tiên!</p>
              </div>
          )}
      </div>
    </div>
  );
}
