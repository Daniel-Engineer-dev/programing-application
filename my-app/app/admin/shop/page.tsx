"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/src/api/firebase/firebase";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2, Search, Package } from "lucide-react";
import Image from "next/image";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  spec: {
    brand: string;
    details: string;
  };
};

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "₫";

export default function AdminShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      setProducts(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, "products", id));
      alert("Đã xóa sản phẩm thành công!");
    } catch (error) {
      console.error(error);
      alert("Lỗi khi xóa sản phẩm!");
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3 drop-shadow-sm">
            <Package size={36} className="text-blue-400" />
            Quản Lý Cửa Hàng
          </h1>
          <p className="text-slate-400 mt-2 text-lg font-medium">Trung tâm quản lý sản phẩm và kho hàng</p>
        </div>
        <Link
          href="/admin/shop/new"
          className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-2xl flex items-center gap-3 font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all hover:-translate-y-0.5 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <Plus size={22} className="relative z-10 group-hover:rotate-90 transition-transform" />
          <span className="relative z-10">Thêm Sản Phẩm</span>
        </Link>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-xl p-2 rounded-2xl border border-slate-800/60 shadow-2xl">
         <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-20 group-focus-within:opacity-100 transition duration-300 blur-sm"></div>
            <div className="relative flex items-center bg-slate-950 rounded-xl">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                <input
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none rounded-xl pl-12 pr-4 py-4 outline-none text-slate-200 placeholder:text-slate-600 font-medium"
                />
            </div>
        </div>
      </div>

      <div className="bg-slate-900/40 rounded-3xl border border-slate-800/60 overflow-hidden shadow-2xl backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/40 text-slate-400 uppercase text-xs font-bold tracking-wider border-b border-slate-800/50">
              <th className="px-8 py-6">Hình ảnh</th>
              <th className="px-6 py-6">Tên sản phẩm</th>
              <th className="px-6 py-6">Giá bán</th>
              <th className="px-6 py-6">Thương hiệu</th>
              <th className="px-6 py-6 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {loading ? (
                <tr>
                    <td colSpan={5} className="p-20 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    </td>
                </tr>
            ) : filtered.length === 0 ? (
                <tr>
                    <td colSpan={5} className="py-24 text-center text-slate-500">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package size={32} className="opacity-30" />
                        </div>
                        <p className="font-medium">Chưa có sản phẩm nào.</p>
                    </td>
                </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-blue-500/5 transition-all duration-200 group">
                  <td className="px-8 py-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900 shadow-md group-hover:border-blue-500/30 transition-colors relative">
                        {p.image ? (
                             <img src={p.image} alt={p.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                                <Package size={24} />
                            </div>
                        )}
                       
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-200 text-lg group-hover:text-blue-400 transition-colors">{p.name}</div>
                    <div className="text-xs text-slate-500 line-clamp-1 mt-1 font-medium">{p.spec?.details}</div>
                  </td>
                  <td className="px-6 py-4">
                      <span className="font-mono text-amber-400 font-bold text-lg">{formatVND(p.price)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 rounded-lg bg-slate-800/80 text-xs font-bold text-slate-300 border border-slate-700/80 uppercase tracking-wide">
                        {p.spec?.brand || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-60 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-300">
                        <Link
                        href={`/admin/shop/${p.id}`}
                        className="p-2.5 bg-slate-800 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-xl transition-all border border-transparent hover:border-blue-500/30"
                        title="Chỉnh sửa"
                        >
                        <Edit size={18} />
                        </Link>
                        <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-2.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-500/30"
                        title="Xóa"
                        >
                        <Trash2 size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
