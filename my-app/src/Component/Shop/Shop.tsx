"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/userHook/hooks/userAuth";

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
  image: string; // path trong public
  spec: ProductSpec;
};

const LOGIN_PATH = "/routes/auth/login";
const formatVND = (n: number) => n.toLocaleString("vi-VN") + "₫";

export default function ShopPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [openProduct, setOpenProduct] = useState<Product | null>(null);

  const products = useMemo<Product[]>(
    () => [
      {
        id: "kbd",
        name: "Bàn phím Codepro",
        price: 1299000,
        image: "/products/keyboard.jpg",
        spec: {
          brand: "Codepro",
          material: "Nhựa ABS + keycap PBT",
          size: "438 x 135 x 40 mm",
          function: "Gõ code, LED, chống ghosting",
          color: "Đen",
          warranty: "12 tháng",
          details: "Bàn phím gọn, phù hợp setup học tập/làm việc.",
        },
      },
      {
        id: "mouse",
        name: "Chuột không dây Codepro",
        price: 899000,
        image: "/products/mouse.jpg",
        spec: {
          brand: "Codepro",
          material: "Nhựa ABS cao cấp",
          size: "120 x 65 x 40 mm",
          function: "Wireless 2.4G, DPI tùy chỉnh",
          color: "Đen",
          warranty: "12 tháng",
          details: "Chuột nhẹ tay, phù hợp học tập/coding.",
        },
      },
      {
        id: "mousepad",
        name: "Lót chuột Codepro",
        price: 159000,
        image: "/products/mousepad.jpg",
        spec: {
          brand: "Codepro",
          material: "Vải polyester + đế cao su",
          size: "300x800mm",
          function: "Chống trượt, dễ cuộn, dễ vệ sinh",
          color: "Đen",
          warranty: "3 tháng",
          details: "Bề mặt mịn, tracking tốt, chống trượt.",
        },
      },
      {
        id: "backpack",
        name: "Ba lô Codepro",
        price: 549000,
        image: "/products/backpack.jpg",
        spec: {
          brand: "Codepro",
          material: "Polyester 600D chống nước",
          size: "15.6 inch",
          function: "Ngăn laptop chống sốc, nhiều ngăn phụ",
          color: "Đen",
          warranty: "6 tháng",
          details: "Ba lô tối giản, đựng laptop chắc chắn.",
        },
      },
      {
        id: "cap",
        name: "Nón Codepro",
        price: 199000,
        image: "/products/cap.jpg",
        spec: {
          brand: "Codepro",
          material: "Cotton",
          size: "Free size",
          function: "Che nắng, thời trang",
          color: "Đen",
          warranty: "Không áp dụng",
          details: "Logo thêu, dễ phối đồ, thoáng khí.",
        },
      },
      {
        id: "tee",
        name: "Áo thun Codepro",
        price: 299000,
        image: "/products/tshirt.jpg",
        spec: {
          brand: "Codepro",
          material: "Cotton 100%",
          size: "S/M/L/XL",
          function: "Thời trang, thấm hút mồ hôi tốt",
          color: "Đen",
          warranty: "Đổi size trong vòng 7 ngày",
          details: "Vải dày, in bền màu, mặc thoải mái.",
        },
      },
      {
        id: "note",
        name: "Sổ ghi chú Codepro",
        price: 149000,
        image: "/products/notebook.jpg",
        spec: {
          brand: "Codepro",
          material: "Giấy 100gsm",
          size: "A5",
          function: "Ghi chú học tập",
          color: "Đen",
          warranty: "Không áp dụng",
          details: "Thiết kế gọn, phù hợp ghi chú học tập.",
        },
      },
      {
        id: "badge",
        name: "Huy hiệu Codepro",
        price: 69000,
        image: "/products/badge.jpg",
        spec: {
          brand: "Codepro",
          material: "Nhựa",
          size: "Tròn: Ø25mm, Ø32mm, Ø50mm",
          function: "Trang trí",
          color: "Trắng",
          warranty: "Không áp dụng",
          details: "Gắn balo/laptop sleeve, nhỏ gọn, chắc chắn.",
        },
      },
    ],
    []
  );

  const goCheckout = (p: Product) => {
    if (loading) return;
    if (!user) {
      const returnTo = encodeURIComponent(`/routes/checkout/${p.id}`);
      router.push(`${LOGIN_PATH}?returnTo=${returnTo}`);
      return;
    }
    router.push(`/routes/checkout/${p.id}`);
  };

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

              {/* Bỏ dòng mô tả ngoài card → chỉ để icon i */}
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

      {/* Modal mô tả: chỉ tên, bỏ đoạn mô tả trên đầu + bỏ mua ngay */}
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
