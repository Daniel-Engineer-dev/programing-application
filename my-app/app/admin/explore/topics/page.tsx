"use client";

import { useEffect, useState } from "react";
import { db } from "@/src/api/firebase/firebase";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { Plus, Search, Trash2, Pencil, Compass, Filter } from "lucide-react";
import { toast } from "sonner";

export default function TopicsListPage() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Realtime Listener
    const q = query(collection(db, "topics"));
    // Note: 'orderBy' might need an index if fields vary, keeping it simple for now or strictly client sort
    // Let's rely on client sort if data is small, or use snapshot data order
    const unsub = onSnapshot(collection(db, "topics"), (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTopics(list);
        setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa chủ đề "${title}"?`)) return;
    try {
        await deleteDoc(doc(db, "topics", id));
        toast.success("Xóa chủ đề thành công");
    } catch (e) {
        toast.error("Lỗi khi xóa");
    }
  };

  const filteredTopics = topics.filter(t => 
    t.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
          <div className="animate-spin mr-2 w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full"></div>
          Đang tải...
      </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3 drop-shadow-sm">
            <Compass className="text-emerald-400" size={36} />
            Quản Lý Chủ Đề
          </h1>
          <p className="text-slate-400 mt-2 text-lg font-medium">Danh mục bài học và kiến thức nền tảng</p>
        </div>
        <Link 
            href="/admin/explore/topics/new"
            className="group relative bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 overflow-hidden"
        >
             <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <Plus size={22} className="group-hover:rotate-90 transition-transform relative z-10" />
            <span className="relative z-10">Thêm Chủ Đề</span>
        </Link>
      </div>

      {/* Filter / Search */}
       <div className="bg-slate-900/40 backdrop-blur-xl p-2 rounded-2xl border border-slate-800/60 shadow-2xl max-w-2xl">
         <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl opacity-20 group-focus-within:opacity-100 transition duration-300 blur-sm"></div>
            <div className="relative flex items-center bg-slate-950 rounded-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm chủ đề..." 
                    value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-none rounded-xl pl-12 pr-4 py-4 outline-none text-slate-200 placeholder:text-slate-600 font-medium transition-all"
                />
            </div>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredTopics.map((topic) => (
              <div key={topic.id} className="group flex flex-col bg-slate-900/40 border border-slate-800/60 rounded-3xl overflow-hidden hover:border-emerald-500/30 transition-all hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 backdrop-blur-md relative">
                   <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                  {/* Image Area */}
                  <div className="relative h-56 overflow-hidden bg-slate-950/50">
                      {topic.backgroundImage ? (
                          <img 
                            src={topic.backgroundImage} 
                            alt={topic.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90 group-hover:brightness-100"
                          />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-900">
                             <Compass size={64} className="opacity-20 group-hover:opacity-40 transition-opacity text-emerald-500" />
                          </div>
                      )}
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-80" />
                      
                      <div className="absolute bottom-4 left-6 right-6">
                           <h3 className="text-2xl font-bold text-white mb-1 line-clamp-1 drop-shadow-md group-hover:text-emerald-400 transition-colors">
                            {topic.title}
                          </h3>
                      </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 pt-2 flex flex-col flex-1 relative z-10">
                      <p className="text-slate-400 text-sm line-clamp-2 mb-6 flex-1 min-h-[40px] leading-relaxed">
                          {topic.desc || "Chưa có mô tả chi tiết cho chủ đề này."}
                      </p>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-4 border-t border-slate-800/50 mt-auto">
                          <Link 
                            href={`/admin/explore/topics/${topic.id}`}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 rounded-xl font-bold transition-all border border-slate-700/50 hover:border-emerald-500/30 text-sm"
                          >
                              <Pencil size={16} strokeWidth={2.5} />
                              Chỉnh sửa
                          </Link>
                          <button 
                             onClick={() => handleDelete(topic.id, topic.title)}
                             className="p-2.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-500/30"
                             title="Xóa chủ đề"
                          >
                              <Trash2 size={18} strokeWidth={2.5} />
                          </button>
                      </div>
                  </div>
              </div>
          ))}
          
          {filteredTopics.length === 0 && !loading && (
             <div className="col-span-full py-24 text-center text-slate-500 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center">
                  <Compass size={48} className="opacity-20 mb-4" />
                  <p className="font-medium text-lg">Không tìm thấy chủ đề nào</p>
                  <p className="text-sm opacity-60">Thử tìm kiếm từ khóa khác hoặc tạo mới</p>
              </div>
          )}
      </div>
    </div>
  );
}
