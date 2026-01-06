"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/userHook/hooks/userAuth";
import { db } from "@/src/api/firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { ShoppingBag, Info, Sparkles, ArrowRight, X } from "lucide-react";

type ProductSpec = {
  brand: string;
  material: string;
  size: string;
  function: string;
  color: string;
  warranty: string;
  details: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  spec: ProductSpec;
};

const LOGIN_PATH = "/routes/auth/login";
const formatVND = (n: number) => n.toLocaleString("vi-VN") + "₫";

export default function ShopPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Lấy danh sách sản phẩm từ Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const list: Product[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      setProducts(list);
      setLoadingProducts(false);
    });

    return () => unsubscribe();
  }, []);

  const goCheckout = (p: Product) => {
    if (loading) return;
    if (!user) {
      const returnTo = encodeURIComponent(`/routes/checkout/${p.id}`);
      router.push(`${LOGIN_PATH}?returnTo=${returnTo}`);
      return;
    }
    router.push(`/routes/checkout/${p.id}`);
  };

  if (loadingProducts) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8">
        <div className="text-center text-slate-300">Đang tải sản phẩm...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-900 text-white p-8 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="relative z-10">
      <div className="flex items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent flex items-center gap-3">
            <ShoppingBag className="text-blue-400" size={48} />
            Cửa hàng Codepro
          </h1>
          <p className="text-slate-400 mt-3 text-lg">Khám phá các sản phẩm chất lượng cao</p>
        </div>

        <button
          onClick={() => router.push("/routes/avatar/settings/buy")}
          className="bg-gradient-to-r from-slate-800 to-blue-900/40 hover:from-slate-700 hover:to-blue-800/40 px-6 py-3 rounded-xl border border-blue-500/30 transition-all hover:scale-105 font-semibold"
        >
          Quay lại lịch sử giao dịch
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center text-slate-400 py-12">
          Chưa có sản phẩm nào.
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p, index) => (
            <div 
              key={p.id} 
              className="group bg-gradient-to-br from-slate-900/50 to-blue-900/20 border border-blue-500/30 rounded-2xl overflow-hidden hover:border-blue-500/60 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 backdrop-blur-xl hover:scale-105"
              style={{animationDelay: `${index * 100}ms`}}
            >
              {/* Ảnh sản phẩm */}
              <div className="h-72 md:h-80 lg:h-96 bg-slate-800 relative overflow-hidden">
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Sparkle badge */}
                <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                  <Sparkles size={12} />
                  Mới
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h2 className="font-bold text-xl group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-400 group-hover:bg-clip-text group-hover:text-transparent transition-all">{p.name}</h2>
                  <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-900 px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:shadow-amber-500/50 transition-shadow">
                    {formatVND(p.price)}
                  </span>
                </div>

                {/* Icon thông tin */}
                <div className="mt-4 flex items-center justify-end">
                  <button
                    className="relative group/info flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all text-sm font-semibold"
                    onClick={() => setOpenProduct(p)}
                    aria-label="Thông tin sản phẩm"
                  >
                    <Info size={16} />
                    Thông tin
                  </button>
                </div>

                <div className="mt-5">
                  <button
                    onClick={() => goCheckout(p)}
                    className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 hover:from-blue-500 hover:via-cyan-500 hover:to-sky-500 px-6 py-3.5 rounded-xl font-bold transition-all hover:scale-105 shadow-2xl hover:shadow-blue-500/50 flex items-center justify-center gap-2"
                  >
                    Mua ngay
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal mô tả */}
      {openProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" onClick={() => setOpenProduct(null)}>
          <div className="w-full max-w-2xl bg-gradient-to-br from-slate-900/95 to-blue-900/30 border border-blue-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{openProduct.name}</h3>
              </div>

              <button
                onClick={() => setOpenProduct(null)}
                className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg border border-slate-700 transition-all hover:scale-110"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6 text-sm">
              <div className="bg-gradient-to-br from-slate-950/60 to-blue-900/20 border border-blue-500/20 rounded-xl p-5 hover:border-blue-500/40 transition-all">
                <div className="text-blue-300 font-semibold mb-1">Thương hiệu</div>
                <div className="font-bold text-lg">{openProduct.spec.brand}</div>
              </div>
              <div className="bg-gradient-to-br from-slate-950/60 to-blue-900/20 border border-blue-500/20 rounded-xl p-5 hover:border-blue-500/40 transition-all">
                <div className="text-blue-300 font-semibold mb-1">Chất liệu</div>
                <div className="font-bold text-lg">{openProduct.spec.material}</div>
              </div>
              <div className="bg-gradient-to-br from-slate-950/60 to-blue-900/20 border border-blue-500/20 rounded-xl p-5 hover:border-blue-500/40 transition-all">
                <div className="text-blue-300 font-semibold mb-1">Kích thước</div>
                <div className="font-bold text-lg">{openProduct.spec.size}</div>
              </div>
              <div className="bg-gradient-to-br from-slate-950/60 to-blue-900/20 border border-blue-500/20 rounded-xl p-5 hover:border-blue-500/40 transition-all">
                <div className="text-blue-300 font-semibold mb-1">Chức năng</div>
                <div className="font-bold text-lg">{openProduct.spec.function}</div>
              </div>
              <div className="bg-gradient-to-br from-slate-950/60 to-blue-900/20 border border-blue-500/20 rounded-xl p-5 hover:border-blue-500/40 transition-all">
                <div className="text-blue-300 font-semibold mb-1">Màu sắc</div>
                <div className="font-bold text-lg">{openProduct.spec.color}</div>
              </div>
              <div className="bg-gradient-to-br from-slate-950/60 to-blue-900/20 border border-blue-500/20 rounded-xl p-5 hover:border-blue-500/40 transition-all">
                <div className="text-blue-300 font-semibold mb-1">Bảo hành</div>
                <div className="font-bold text-lg">{openProduct.spec.warranty}</div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between p-5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl">
              <div className="text-blue-300 font-semibold">Giá</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{formatVND(openProduct.price)}</div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
