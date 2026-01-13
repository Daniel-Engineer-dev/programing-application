"use client";

import { useAuthContext } from "@/src/userHook/context/authContext";
import { db } from "@/src/api/firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { ShieldCheck, User as UserIcon } from "lucide-react";

export default function SetupAdminPage() {
  const { user } = useAuthContext();
  const [status, setStatus] = useState("");

  const makeMeAdmin = async () => {
    if (!user) return setStatus("Vui lòng đăng nhập trước.");
    try {
      await updateDoc(doc(db, "users", user.uid), { role: "admin" });
      setStatus("Thành công! Bạn đã là Admin. Hãy truy cập /admin");
    } catch (e) {
      console.error(e);
      setStatus("Lỗi cập nhật vai trò.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center space-y-6 shadow-2xl">
        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-500">
             <ShieldCheck size={32} />
        </div>
        
        <div>
            <h1 className="text-2xl font-bold text-white">Cài Đặt Admin Tạm Thời</h1>
            <p className="text-slate-400 text-sm mt-2">Dùng trang này để tự cấp quyền Admin cho tài khoản của bạn.</p>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                <UserIcon size={20} />
            </div>
            <div className="overflow-hidden">
                <p className="text-xs text-slate-500 font-bold uppercase">Tài khoản hiện tại</p>
                <p className="text-sm text-white truncate">{user?.email || "Chưa đăng nhập"}</p>
            </div>
        </div>
        
        <button 
            onClick={makeMeAdmin}
            disabled={!user}
            className="w-full bg-linear-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20"
        >
            Cấp Quyền Admin Ngay
        </button>
        
        {status && (
            <div className={`p-3 rounded-lg text-sm font-medium ${status.includes("Thành công") ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                {status}
            </div>
        )}
      </div>
    </div>
  );
}
