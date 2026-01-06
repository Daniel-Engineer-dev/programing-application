"use client";

import { useMemo, useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/src/userHook/hooks/userAuth";
import { db } from "@/src/api/firebase/firebase";
import { addDoc, collection, doc, serverTimestamp, updateDoc, getDoc } from "firebase/firestore";
import { ShoppingCart, ArrowLeft } from "lucide-react";

const LOGIN_PATH = "/routes/auth/login";
const PURCHASE_PATH = "/routes/avatar/settings/buy";
const SHOP_PATH = "/routes/shop";

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "₫";

type Product = { id: string; name: string; price: number };

// ✅ đổi path này theo ảnh QR m upload
// -> đặt file ở: /public/qr/bank.png
const QR_IMAGE_SRC = "/qr/bank.png";

// ✅ Modal KHÔNG có nút OK (tùy chọn showCloseButton)
function Modal({
  open,
  title,
  message,
  children,
  showCloseButton = false,
  onClose,
}: {
  open: boolean;
  title: string;
  message?: string;
  children?: React.ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={() => (showCloseButton && onClose ? onClose() : undefined)}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-bold">{title}</div>
            {message ? <div className="mt-2 text-slate-300">{message}</div> : null}
          </div>

          {showCloseButton ? (
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700"
            >
              Đóng
            </button>
          ) : null}
        </div>

        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { productId } = useParams<{ productId: string }>();
  const { user, loading } = useAuth();

  const [quantity, setQuantity] = useState<number>(1);

  // Product từ Firebase
  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  // Form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [payMethod, setPayMethod] = useState<"COD" | "BANK">("COD");

  // modal lỗi
  const [errOpen, setErrOpen] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // modal QR
  const [qrOpen, setQrOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // ✅ modal thành công (không nút)
  const [paidOpen, setPaidOpen] = useState(false);

  // Lấy thông tin sản phẩm từ Firebase
  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({
            id: docSnap.id,
            name: data.name,
            price: data.price,
          });
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setProduct(null);
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Guard login
  useEffect(() => {
    if (loading) return;
    if (!user) {
      const returnTo = encodeURIComponent(`/routes/checkout/${productId}`);
      router.push(`${LOGIN_PATH}?returnTo=${returnTo}`);
    }
  }, [user, loading, router, productId]);

  const shippingFee = useMemo(() => {
    if (!product) return 0;
    return product.price >= 500000 ? 0 : 25000;
  }, [product]);

  const subTotal = useMemo(() => {
    if (!product) return 0;
    return product.price * quantity;
  }, [product, quantity]);

  const total = useMemo(() => subTotal + shippingFee, [subTotal, shippingFee]);

  const showError = (msg: string) => {
    setErrMsg(msg);
    setErrOpen(true);
  };

  const createOrder = async () => {
    if (!user || !product) return null;

    const ref = await addDoc(collection(db, "users", user.uid, "orders"), {
      productId: product.id,
      productName: product.name,
      amountVND: product.price,
      quantity,
      shippingFee,
      totalVND: total,
      status: "PENDING",
      payMethod,
      buyer: { fullName, phone, address, note },
      purchasedAt: serverTimestamp(),
    });

    return ref.id;
  };

  const placeOrder = async () => {
    if (!user || !product) return;

    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      showError("Vui lòng nhập đủ Họ tên / Số điện thoại / Địa chỉ.");
      return;
    }

    // COD: tạo đơn xong về lịch sử (PENDING)
    if (payMethod === "COD") {
      await createOrder();
      router.push(PURCHASE_PATH);
      return;
    }

    // BANK: tạo đơn xong hiện QR ẢNH để quét
    const oid = await createOrder();
    if (!oid) return;

    setCreatedOrderId(oid);
    setQrOpen(true);
  };

  // ✅ chỉ bấm "Xác nhận đã thanh toán" mới chạy
  const confirmPaid = async () => {
    if (!user || !createdOrderId) return;

    await updateDoc(doc(db, "users", user.uid, "orders", createdOrderId), {
      status: "PAID",
    });

    // đóng QR, hiện modal thành công rồi tự về lịch sử
    setQrOpen(false);
    setPaidOpen(true);

    setTimeout(() => {
      router.push(PURCHASE_PATH);
    }, 900);
  };

  if (loading || loadingProduct) {
    return <div className="min-h-screen bg-slate-950 text-white p-8">Đang tải...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8">
        Không tìm thấy sản phẩm.{" "}
        <button className="underline text-blue-400" onClick={() => router.push(SHOP_PATH)}>
          Quay lại cửa hàng
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      {/* Modal lỗi: có nút Đóng */}
      <Modal
        open={errOpen}
        title="Thiếu thông tin"
        message={errMsg}
        showCloseButton
        onClose={() => setErrOpen(false)}
      />

      {/* ✅ Modal QR: dùng ảnh QR của m upload + bỏ dòng localhost bên dưới */}
      <Modal
        open={qrOpen}
        title="Quét QR để thanh toán"
        message='Dùng app ngân hàng để quét mã QR. Sau đó bấm "Xác nhận đã thanh toán".'
      >
        <div className="flex flex-col items-center gap-3">
          <div className="bg-white p-3 rounded-xl">
            <Image
              src={QR_IMAGE_SRC}
              alt="Bank QR"
              width={260}
              height={260}
              className="rounded-lg"
              priority
            />
          </div>

          <button
            onClick={confirmPaid}
            className="mt-2 w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-semibold"
          >
            Xác nhận đã thanh toán
          </button>
        </div>
      </Modal>

      {/* ✅ Modal thành công: không nút, tự redirect */}
      <Modal open={paidOpen} title="Thanh toán thành công" message="Đang chuyển về lịch sử giao dịch..." />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent flex items-center gap-3">
          <ShoppingCart className="text-blue-400" size={40} />
          Thanh toán
        </h1>
        <button
          onClick={() => router.push(SHOP_PATH)}
          className="bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 px-6 py-3 rounded-xl border border-slate-600 transition-all hover:scale-105 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl"
        >
          <ArrowLeft size={18} />
          Quay lại cửa hàng
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-6 backdrop-blur-sm shadow-xl">
            <h2 className="text-xl font-bold mb-5">Thông tin người đặt hàng</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-slate-300 text-sm">Họ và tên</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-2 w-full bg-slate-950/80 border border-slate-700 px-4 py-3 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm">Số điện thoại</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 w-full bg-slate-950 border border-slate-700 px-4 py-2 rounded"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-slate-300 text-sm">Địa chỉ</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-2 w-full bg-slate-950 border border-slate-700 px-4 py-2 rounded"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-slate-300 text-sm">Ghi chú</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-2 w-full bg-slate-950 border border-slate-700 px-4 py-2 rounded"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-6 backdrop-blur-sm shadow-xl">
            <h2 className="text-xl font-bold mb-5">Hình thức thanh toán</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 bg-slate-950/40 border border-slate-700 rounded-lg p-5 cursor-pointer hover:border-blue-500/50 hover:bg-slate-800/50 transition-all">
                <input type="radio" checked={payMethod === "COD"} onChange={() => setPayMethod("COD")} className="w-4 h-4" />
                <div>
                  <div className="font-semibold">COD</div>
                  <div className="text-slate-300 text-sm">Thanh toán khi nhận hàng</div>
                </div>
              </label>

              <label className="flex items-center gap-3 bg-slate-950/40 border border-slate-700 rounded-lg p-5 cursor-pointer hover:border-blue-500/50 hover:bg-slate-800/50 transition-all">
                <input type="radio" checked={payMethod === "BANK"} onChange={() => setPayMethod("BANK")} className="w-4 h-4" />
                <div>
                  <div className="font-semibold">Chuyển khoản</div>
                  <div className="text-slate-300 text-sm">Mã QR</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-6 h-fit backdrop-blur-sm shadow-xl">
          <h2 className="text-xl font-bold mb-5">Đơn hàng</h2>

          <div className="bg-slate-950/40 border border-slate-700 rounded-lg p-5 shadow-inner">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{product.name}</div>

                <div className="mt-3 flex items-center gap-3">
                  <span className="text-slate-300 text-sm">Số lượng:</span>
                  <button
                    className="w-9 h-9 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-semibold">{quantity}</span>
                  <button
                    className="w-9 h-9 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="font-bold">{formatVND(product.price)}</div>
            </div>

            <div className="border-t border-slate-700 my-4" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Tạm tính</span>
              <span>{formatVND(subTotal)}</span>
            </div>

            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-slate-300">Phí vận chuyển</span>
              <span>{shippingFee === 0 ? "Miễn phí" : formatVND(shippingFee)}</span>
            </div>

            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-slate-300">Tổng thanh toán</span>
              <span className="font-semibold">{formatVND(total)}</span>
            </div>
          </div>

          <button
            onClick={placeOrder}
            className="mt-5 w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl font-semibold"
          >
            Đặt hàng
          </button>
        </div>
      </div>
    </div >
  );
}
