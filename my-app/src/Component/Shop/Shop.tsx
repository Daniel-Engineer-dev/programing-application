"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/userHook/hooks/userAuth";
import { db } from "@/src/api/firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";

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
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Cửa hàng Codepro</h1>

        <button
          onClick={() => router.push("/routes/avatar/settings/buy")}
          className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded border border-slate-700"
        >
          Quay lại lịch sử giao dịch
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center text-slate-400 py-12">
          Chưa có sản phẩm nào.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
              {/* Ảnh sản phẩm */}
              <div className="h-72 md:h-80 lg:h-96 bg-slate-800 relative">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">{p.name}</h2>
                  <span className="bg-amber-200 text-slate-900 px-3 py-1 rounded-lg text-sm font-semibold">
                    {formatVND(p.price)}
                  </span>
                </div>

                {/* Icon thông tin */}
                <div className="mt-4 flex items-center justify-end">
                  <button
                    className="relative group w-9 h-9 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 grid place-items-center"
                    onClick={() => setOpenProduct(p)}
                    aria-label="Thông tin sản phẩm"
                  >
                    <span className="text-white font-bold">i</span>
                    <span className="pointer-events-none absolute -top-9 right-0 opacity-0 group-hover:opacity-100 transition text-xs bg-black/70 px-2 py-1 rounded">
                      Mô tả sản phẩm
                    </span>
                  </button>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => goCheckout(p)}
                    className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold"
                  >
                    Mua ngay
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal mô tả */}
      {openProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setOpenProduct(null)}>
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">{openProduct.name}</h3>
              </div>

              <button
                onClick={() => setOpenProduct(null)}
                className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded border border-slate-700"
              >
                Đóng
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-5 text-sm">
              <div className="bg-slate-950/40 border border-slate-700 rounded-lg p-4">
                <div className="text-slate-300">Thương hiệu</div>
                <div className="font-semibold">{openProduct.spec.brand}</div>
              </div>
              <div className="bg-slate-950/40 border border-slate-700 rounded-lg p-4">
                <div className="text-slate-300">Chất liệu</div>
                <div className="font-semibold">{openProduct.spec.material}</div>
              </div>
              <div className="bg-slate-950/40 border border-slate-700 rounded-lg p-4">
                <div className="text-slate-300">Kích thước</div>
                <div className="font-semibold">{openProduct.spec.size}</div>
              </div>
              <div className="bg-slate-950/40 border border-slate-700 rounded-lg p-4">
                <div className="text-slate-300">Chức năng</div>
                <div className="font-semibold">{openProduct.spec.function}</div>
              </div>
              <div className="bg-slate-950/40 border border-slate-700 rounded-lg p-4">
                <div className="text-slate-300">Màu sắc</div>
                <div className="font-semibold">{openProduct.spec.color}</div>
              </div>
              <div className="bg-slate-950/40 border border-slate-700 rounded-lg p-4">
                <div className="text-slate-300">Bảo hành</div>
                <div className="font-semibold">{openProduct.spec.warranty}</div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="text-slate-300">Giá</div>
              <div className="text-lg font-bold">{formatVND(openProduct.price)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
