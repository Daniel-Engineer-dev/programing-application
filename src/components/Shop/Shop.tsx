"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
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

const LOGIN_PATH = "/auth/login";
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
      const returnTo = encodeURIComponent(`/checkout/${p.id}`);
      router.push(`${LOGIN_PATH}?returnTo=${returnTo}`);
      return;
    }
    router.push(`/checkout/${p.id}`);
  };

  if (loadingProducts) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8">
        <div className="text-center text-slate-300">Đang tải sản phẩm...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="hidden"></div>
      
      <div className="relative z-10">
      <div className="flex items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-5xl font-bold text-white flex items-center gap-3">
            <ShoppingBag className="text-blue-400" size={48} />
            Cửa hàng Codepro
          </h1>
          <p className="text-slate-400 mt-3 text-lg">Khám phá các sản phẩm chất lượng cao</p>
        </div>

        <button
          onClick={() => router.push("/avatar/settings/buy")}
          className="bg-slate-900 hover:bg-slate-800 px-6 py-3 rounded-lg border border-slate-700 transition-colors font-semibold"
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
              className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-blue-500/60 transition-colors duration-200 shadow-sm"
              style={{animationDelay: `${index * 100}ms`}}
            >
              {/* Ảnh sản phẩm */}
              <div className="h-72 md:h-80 lg:h-96 bg-slate-800 relative overflow-hidden">
                {/* Shimmer effect */}
                <div className="hidden"></div>
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                    No Image
                  </div>
                )}
                {/* Sparkle badge */}
                <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                  <Sparkles size={12} />
                  Mới
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h2 className="font-bold text-xl group-hover:text-blue-300 transition-colors">{p.name}</h2>
                  <span className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold">
                    {formatVND(p.price)}
                  </span>
                </div>

                {/* Icon thông tin */}
                <div className="mt-4 flex items-center justify-end">
                  <button
                    className="relative group/info flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 transition-colors text-sm font-semibold"
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
                    className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
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
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">{openProduct.name}</h3>
              </div>

              <button
                onClick={() => setOpenProduct(null)}
                className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg border border-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6 text-sm">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 hover:border-blue-500/40 transition-colors">
                <div className="text-blue-300 font-semibold mb-1">Thương hiệu</div>
                <div className="font-bold text-lg">{openProduct.spec.brand}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 hover:border-blue-500/40 transition-colors">
                <div className="text-blue-300 font-semibold mb-1">Chất liệu</div>
                <div className="font-bold text-lg">{openProduct.spec.material}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 hover:border-blue-500/40 transition-colors">
                <div className="text-blue-300 font-semibold mb-1">Kích thước</div>
                <div className="font-bold text-lg">{openProduct.spec.size}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 hover:border-blue-500/40 transition-colors">
                <div className="text-blue-300 font-semibold mb-1">Chức năng</div>
                <div className="font-bold text-lg">{openProduct.spec.function}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 hover:border-blue-500/40 transition-colors">
                <div className="text-blue-300 font-semibold mb-1">Màu sắc</div>
                <div className="font-bold text-lg">{openProduct.spec.color}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 hover:border-blue-500/40 transition-colors">
                <div className="text-blue-300 font-semibold mb-1">Bảo hành</div>
                <div className="font-bold text-lg">{openProduct.spec.warranty}</div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between p-5 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="text-blue-300 font-semibold">Giá</div>
              <div className="text-2xl font-bold text-orange-400">{formatVND(openProduct.price)}</div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
