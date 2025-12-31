"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/src/userHook/hooks/userAuth";
import { db } from "@/src/api/firebase/firebase";
import { doc, onSnapshot, Timestamp, updateDoc } from "firebase/firestore";

const LOGIN_PATH = "/routes/auth/login";
const PURCHASE_PATH = "/routes/avatar/settings/buy";

type OrderStatus = "PAID" | "PENDING" | "CANCELLED";

type Order = {
  id: string;
  productName: string;
  amountVND: number;
  quantity: number;
  shippingFee: number;
  totalVND: number;
  status: OrderStatus;
  payMethod?: "COD" | "BANK";
  purchasedAt?: Timestamp;
  buyer?: {
    fullName?: string;
    phone?: string;
    address?: string;
    note?: string;
  };
};

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "₫";

function pad2(x: number) {
  return String(x).padStart(2, "0");
}
function formatDateDDMMYYYY(ts?: Timestamp) {
  if (!ts) return "--/--/----";
  const d = ts.toDate();
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function remainingMillis(ts?: Timestamp) {
  if (!ts) return 0;
  const created = ts.toDate().getTime();
  const now = Date.now();
  return 5 * 60 * 1000 - (now - created);
}
function remainingText(ts?: Timestamp) {
  const ms = remainingMillis(ts);
  if (ms <= 0) return "00:00";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${pad2(m)}:${pad2(s)}`;
}

function statusLabel(s: OrderStatus) {
  if (s === "PAID") return { text: "Đã thanh toán", cls: "text-green-400" };
  if (s === "PENDING") return { text: "Đang chờ", cls: "text-yellow-400" };
  return { text: "Đã huỷ", cls: "text-red-400" };
}

/** Modal 1 nút OK (dùng cho success / error) */
function Modal({
  open,
  title,
  message,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <div className="text-xl font-bold">{title}</div>
        <div className="mt-2 text-slate-300">{message}</div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-semibold"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

/** Modal xác nhận (dùng cho Huỷ đơn) */
function ConfirmModal({
  open,
  title,
  message,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <div className="text-xl font-bold">{title}</div>
        <div className="mt-2 text-slate-300">{message}</div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700"
          >
            Quay lại
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-semibold"
          >
            Huỷ đơn
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const router = useRouter();
  const { orderId } = useParams<{ orderId: string }>();
  const { user, loading } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [fetching, setFetching] = useState(true);

  // edit fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  // tick countdown
  const [, forceTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMsg, setModalMsg] = useState("");
  const [afterCloseGoBack, setAfterCloseGoBack] = useState(false);

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const showModal = (title: string, message: string, goBackAfterClose = false) => {
    setModalTitle(title);
    setModalMsg(message);
    setAfterCloseGoBack(goBackAfterClose);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    const goBack = afterCloseGoBack;
    setAfterCloseGoBack(false);
    if (goBack) router.push(PURCHASE_PATH);
  };

  // login guard
  useEffect(() => {
    if (loading) return;
    if (!user) {
      const returnTo = encodeURIComponent(`/routes/orders/${orderId}`);
      router.push(`${LOGIN_PATH}?returnTo=${returnTo}`);
    }
  }, [user, loading, router, orderId]);

  // realtime order
  useEffect(() => {
    if (!user) return;

    setFetching(true);
    const ref = doc(db, "users", user.uid, "orders", orderId);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setOrder(null);
          setFetching(false);
          return;
        }
        const data: any = snap.data();
        const o: Order = {
          id: snap.id,
          productName: data.productName ?? "Sản phẩm",
          amountVND: Number(data.amountVND ?? 0),
          quantity: Number(data.quantity ?? 1),
          shippingFee: Number(data.shippingFee ?? 0),
          totalVND: Number(data.totalVND ?? 0),
          status: (data.status ?? "PENDING") as OrderStatus,
          payMethod: data.payMethod,
          purchasedAt: data.purchasedAt as Timestamp | undefined,
          buyer: data.buyer ?? {},
        };

        setOrder(o);
        setFullName(o.buyer?.fullName ?? "");
        setPhone(o.buyer?.phone ?? "");
        setAddress(o.buyer?.address ?? "");
        setNote(o.buyer?.note ?? "");

        setFetching(false);
      },
      (err) => {
        console.error(err);
        setOrder(null);
        setFetching(false);
      }
    );

    return () => unsub();
  }, [user, orderId]);

  const editable = useMemo(() => {
    if (!order) return false;
    if (order.status === "CANCELLED") return false;
    return remainingMillis(order.purchasedAt) > 0;
  }, [order]);

  const saveEdits = async () => {
    if (!user || !order) return;
    if (!editable) return;

    try {
      await updateDoc(doc(db, "users", user.uid, "orders", order.id), {
        buyer: { fullName, phone, address, note },
      });

      showModal("Đã lưu", "Thông tin nhận hàng đã được cập nhật.", true);
    } catch (e) {
      console.error(e);
      showModal("Lỗi", "Không thể lưu chỉnh sửa. Vui lòng thử lại.", false);
    }
  };

  const cancelOrder = async () => {
    if (!user || !order) return;
    if (!editable) return;

    try {
      await updateDoc(doc(db, "users", user.uid, "orders", order.id), {
        status: "CANCELLED",
      });

      showModal("Đã huỷ đơn", "Đơn hàng đã chuyển sang trạng thái Đã huỷ.", true);
    } catch (e) {
      console.error(e);
      showModal("Lỗi", "Không thể huỷ đơn. Vui lòng thử lại.", false);
    }
  };

  // ✅ NEW: xác nhận thanh toán (chỉ bấm được sau khi hết 5 phút)
  const confirmPaid = async () => {
    if (!user || !order) return;

    // chỉ cho phép khi hết 5 phút và đơn đang chờ
    if (editable) return;
    if (order.status !== "PENDING") return;
    if (order.status === "CANCELLED") return;

    // Nếu bạn muốn CHỈ cho BANK mới có nút này, bật dòng dưới:
    // if (order.payMethod !== "BANK") return;

    try {
      await updateDoc(doc(db, "users", user.uid, "orders", order.id), {
        status: "PAID",
      });

      showModal("Thanh toán thành công", "Đơn hàng đã chuyển sang trạng thái Đã thanh toán.", true);
    } catch (e) {
      console.error(e);
      showModal("Lỗi", "Không thể xác nhận thanh toán. Vui lòng thử lại.", false);
    }
  };

  if (loading || fetching) {
    return <div className="min-h-screen bg-slate-950 text-white p-8">Đang tải...</div>;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8">
        Không tìm thấy đơn hàng.
        <div className="mt-4">
          <button
            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded border border-slate-700"
            onClick={() => router.push(PURCHASE_PATH)}
          >
            Quay lại lịch sử giao dịch
          </button>
        </div>
      </div>
    );
  }

  const st = statusLabel(order.status);

  // ✅ NEW: điều kiện hiển thị nút xác nhận thanh toán
  const showConfirmPaidBtn =
    order.status === "PENDING" && order.status !== "CANCELLED"; // PAID/CANCELLED => không hiện

  const confirmPaidDisabled = editable; // trong 5 phút => disable

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <Modal open={modalOpen} title={modalTitle} message={modalMsg} onClose={closeModal} />

      <ConfirmModal
        open={confirmCancelOpen}
        title="Xác nhận huỷ đơn"
        message="Bạn có chắc muốn huỷ đơn hàng này không?"
        onCancel={() => setConfirmCancelOpen(false)}
        onConfirm={() => {
          setConfirmCancelOpen(false);
          cancelOrder();
        }}
      />

      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Chi tiết đơn hàng</h1>
            <div className="mt-2 text-slate-300">
              Trạng thái: <span className={st.cls}>{st.text}</span>
              <span className="mx-2">•</span>
              Ngày đặt: {formatDateDDMMYYYY(order.purchasedAt)}
            </div>
          </div>

          <button
            onClick={() => router.push(PURCHASE_PATH)}
            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded border border-slate-700"
          >
            Quay lại
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* LEFT */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Thông tin đơn hàng</h2>
              <div className="text-sm text-slate-300">
                Thời gian chỉnh sửa còn lại:{" "}
                <span className="font-mono text-white">
                  {order.status === "CANCELLED" ? "--:--" : remainingText(order.purchasedAt)}
                </span>
              </div>
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-950/40 border border-slate-700 rounded-lg p-4">
                <div className="text-slate-300">Sản phẩm</div>
                <div className="font-semibold">{order.productName}</div>
              </div>
              <div className="bg-slate-950/40 border border-slate-700 rounded-lg p-4">
                <div className="text-slate-300">Số lượng</div>
                <div className="font-semibold">{order.quantity}</div>
              </div>
              <div className="bg-slate-950/40 border border-slate-700 rounded-lg p-4">
                <div className="text-slate-300">Đơn giá</div>
                <div className="font-semibold">{formatVND(order.amountVND)}</div>
              </div>
              <div className="bg-slate-950/40 border border-slate-700 rounded-lg p-4">
                <div className="text-slate-300">Phí ship</div>
                <div className="font-semibold">
                  {order.shippingFee === 0 ? "Miễn phí" : formatVND(order.shippingFee)}
                </div>
              </div>
              <div className="bg-slate-950/40 border border-slate-700 rounded-lg p-4 md:col-span-2">
                <div className="text-slate-300">Tổng thanh toán</div>
                <div className="font-semibold text-lg">{formatVND(order.totalVND)}</div>
              </div>
            </div>

            {!editable ? (
              <div className="mt-4 text-slate-300 text-sm">
                {order.status === "CANCELLED"
                  ? "Đơn đã huỷ nên không thể thao tác."
                  : "Hết thời gian chỉnh sửa nên đơn hàng đã bị khoá thao tác."}
              </div>
            ) : (
              <div className="mt-4 text-slate-300 text-sm">
                Trong 5 phút bạn có thể chỉnh sửa thông tin nhận hàng / huỷ đơn.
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Thông tin nhận hàng</h2>

            {order.status === "CANCELLED" ? (
              <div className="text-slate-300 text-sm">Đơn đã huỷ nên không thể chỉnh sửa.</div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 text-sm">Họ và tên</label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={!editable}
                      className="mt-2 w-full bg-slate-950 border border-slate-700 px-4 py-2 rounded disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm">Số điện thoại</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={!editable}
                      className="mt-2 w-full bg-slate-950 border border-slate-700 px-4 py-2 rounded disabled:opacity-60"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-slate-300 text-sm">Địa chỉ</label>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={!editable}
                      className="mt-2 w-full bg-slate-950 border border-slate-700 px-4 py-2 rounded disabled:opacity-60"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-slate-300 text-sm">Ghi chú</label>
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      disabled={!editable}
                      className="mt-2 w-full bg-slate-950 border border-slate-700 px-4 py-2 rounded disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={saveEdits}
                    disabled={!editable}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-semibold disabled:opacity-60"
                  >
                    Lưu chỉnh sửa
                  </button>

                  <button
                    onClick={() => setConfirmCancelOpen(true)}
                    disabled={!editable}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-semibold disabled:opacity-60"
                  >
                    Huỷ đơn
                  </button>

                  {/* ✅ NEW: Xác nhận thanh toán */}
                  {showConfirmPaidBtn ? (
                    <button
                      onClick={confirmPaid}
                      disabled={confirmPaidDisabled}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-semibold disabled:opacity-60"
                      title={
                        confirmPaidDisabled
                          ? "Trong 5 phút đầu đơn còn có thể chỉnh sửa nên chưa thể xác nhận thanh toán."
                          : "Xác nhận đơn đã thanh toán"
                      }
                    >
                      Xác nhận thanh toán
                    </button>
                  ) : null}
                </div>

                {/* ✅ hint nhỏ dưới nút */}
                {showConfirmPaidBtn && confirmPaidDisabled ? (
                  <div className="mt-3 text-xs text-slate-400">
                    Vui lòng nhấn nút "Xác nhận thanh toán" sau khi bạn đã thanh toán và nhận hàng.
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
