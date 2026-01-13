"use client";

import { useState, useEffect } from "react";
import { db } from "@/src/api/firebase/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { Bell, Save, AlertTriangle, Trash2, Clock } from "lucide-react";

export default function AdminSettingsPage() {
  const [content, setContent] = useState("");
  const [duration, setDuration] = useState(1); // Default 1 minute
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    // Realtime Sync & Auto-Clean
    const unsub = onSnapshot(doc(db, "system", "config"), async (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const ann = data?.announcement;
            if (ann) {
                // Update local state first to reflect DB
                if (ann.active !== undefined) setCurrentStatus(ann.active);
                if (ann.content !== undefined) setContent(ann.content);
                setExpiresAt(ann.expiresAt || null);

                // Initial Check: If ALREADY expired when we load data, clean it immediately.
                const now = new Date();
                const isExpired = ann.active && ann.expiresAt && new Date(ann.expiresAt) < now;

                if (isExpired) {
                     console.log("Auto-cleaning expired announcement (Initial Check)...");
                     // Optimistic UI update
                     setCurrentStatus(false);
                     setContent("");
                     setExpiresAt(null);

                     await setDoc(doc(db, "system", "config"), {
                        announcement: {
                            active: false,
                            content: "",
                            updatedAt: now.toISOString(),
                            expiresAt: null
                        }
                    }, { merge: true });
                }
            }
        }
    });

    return () => unsub();
  }, []);

  // Timer Effect: Monitors expiration while page is open
  useEffect(() => {
    if (!currentStatus || !expiresAt) return;

    const interval = setInterval(async () => {
        const now = new Date();
        const expireDate = new Date(expiresAt);
        
        if (now > expireDate) {
            console.log("Timer detected expiration. Cleaning...");
            clearInterval(interval);
            
            // Immediate UI update
            setCurrentStatus(false);
            setContent("");
            setExpiresAt(null); // Stop timer

            // Update DB
            await setDoc(doc(db, "system", "config"), {
                announcement: {
                    active: false,
                    content: "",
                    updatedAt: now.toISOString(),
                    expiresAt: null
                }
            }, { merge: true });
        }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [currentStatus, expiresAt]);

  const handleSave = async () => {
    if (!content.trim()) return alert("Vui lòng nhập nội dung!");
    
    // Validate Duration: Positive Integer >= 1
    if (!Number.isInteger(duration) || duration < 1) {
        return alert("Thời gian hiển thị phải là số nguyên dương (tối thiểu 1 phút)!");
    }
    
    setLoading(true);
    try {
      const now = new Date();
      // Calculate Expiration
      const expiresAt = new Date(now.getTime() + duration * 60000).toISOString();

      await setDoc(doc(db, "system", "config"), {
        announcement: {
          content,
          active: true,
          updatedAt: now.toISOString(),
          expiresAt: expiresAt
        }
      }, { merge: true });
      
      setCurrentStatus(true);
      alert(`Đã PHÁT thông báo thành công! (Tự tắt sau: ${duration} phút)`);
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Lỗi khi lưu!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
      if (!confirm("Bạn có chắc chắn muốn DỪNG và XÓA nội dung thông báo?")) return;

      setLoading(true);
      try {
        await setDoc(doc(db, "system", "config"), {
            announcement: {
                content: "", 
                active: false,
                updatedAt: new Date().toISOString(),
                expiresAt: null
            }
        }, { merge: true });
        
        setContent(""); 
        setCurrentStatus(false);
        alert("Đã DỪNG và XÓA thông báo!");
      } catch (error) {
          console.error("Error deleting:", error);
          alert("Lỗi khi dừng!");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent flex items-center gap-3 drop-shadow-sm">
            <Bell size={36} className="text-purple-400" />
            Cài Đặt Hệ Thống
          </h1>
          <p className="text-slate-400 mt-2 text-lg font-medium">Quản lý cấu hình và thông báo toàn cục</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
        {/* Notification Config Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-800/60 overflow-hidden shadow-2xl relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="p-8 border-b border-slate-800/60 bg-slate-950/30">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-500/10">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Banner Thông Báo</h2>
                        <p className="text-slate-400 text-sm">Hiển thị thông báo khẩn cấp hoặc bảo trì trên toàn trang web</p>
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-8 relative z-10">
                 {/* Status Indicator */}
                 <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
                     <div className="flex items-center gap-4">
                         <div className={`relative flex h-12 w-12 items-center justify-center rounded-full border-4 transition-all duration-500 ${currentStatus ? 'border-green-500/30 bg-green-500/10' : 'border-slate-700 bg-slate-800'}`}>
                             {currentStatus && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-20"></span>
                             )}
                             <div className={`h-3 w-3 rounded-full transition-all duration-500 ${currentStatus ? 'bg-green-500 shadow-[0_0_10px_2px_rgba(34,197,94,0.5)]' : 'bg-slate-500'}`}></div>
                         </div>
                         <div>
                             <span className="block font-bold text-slate-200 text-lg">Trạng thái phát sóng</span>
                             {currentStatus ? (
                                 <span className="text-green-400 font-bold text-sm tracking-wide uppercase flex items-center gap-1.5">
                                     <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                     Đang Hoạt Động
                                 </span>
                             ) : (
                                 <span className="text-slate-500 font-bold text-sm tracking-wide uppercase">Đang Tắt</span>
                             )}
                         </div>
                     </div>
                     
                     <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-700 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/50 transition-all shadow-sm w-full md:w-auto">
                         <Clock className="text-purple-400" size={20} />
                         <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Thời gian:</span>
                            <input
                                type="number"
                                min="1"
                                value={duration}
                                onChange={e => setDuration(Number(e.target.value))}
                                className="bg-transparent text-white text-lg outline-none w-16 text-right font-bold font-mono placeholder-slate-600 focus:text-purple-400 transition-colors"
                                placeholder="1"
                            />
                            <span className="text-slate-500 text-sm font-bold">phút</span>
                         </div>
                     </div>
                 </div>

                 {/* Content Input */}
                 <div className="space-y-3">
                     <label className="flex items-center gap-2 font-bold text-sm text-slate-300 uppercase tracking-wider">
                        <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                        Nội dung hiển thị
                     </label>
                     <div className="relative group/input">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-0 group-focus-within/input:opacity-20 transition duration-300 blur-sm"></div>
                        <textarea 
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            className="relative w-full h-40 bg-slate-950/80 border border-slate-700/80 rounded-xl p-5 text-white outline-none focus:border-purple-500 transition-all resize-none text-base shadow-inner placeholder:text-slate-600/50 leading-relaxed"
                            placeholder="Nhập nội dung thông báo tại đây... (Ví dụ: Hệ thống bảo trì lúc 22:00, vui lòng lưu dữ liệu!)"
                        />
                     </div>
                 </div>

                 <div className="pt-6 border-t border-slate-800/60 flex flex-col md:flex-row justify-between gap-4">
                     <button 
                        onClick={handleDelete}
                        disabled={loading || !currentStatus}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/20 hover:border-red-500/30 w-full md:w-auto"
                     >
                         <Trash2 size={20} />
                         Dừng & Xóa
                     </button>

                     <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                     >
                         <Save size={20} />
                         {loading ? "Đang xử lý..." : "Lưu & Phát Ngay"}
                     </button>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
}
