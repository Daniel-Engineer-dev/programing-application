"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { useAuth } from "@/src/userHook/hooks/userAuth";
import { db } from "@/src/api/firebase/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";

const LOGIN_PATH = "/routes/auth/login";
const SHOP_PATH = "/routes/shop";

type OrderStatus = "PAID" | "PENDING" | "CANCELLED";

type Order = {
  id: string;
  productId: string;
  productName: string;
  amountVND: number;
  quantity: number;
  totalVND?: number;
  status: OrderStatus;
  purchasedAt?: Timestamp; // có thể là Timestamp hoặc null nếu mới tạo và serverTimestamp chưa resolve
};

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "₫";

function pad2(x: number) {
  return String(x).padStart(2, "0");
}

// dd/MM/yyyy
function formatDateDDMMYYYY(ts?: Timestamp) {
  if (!ts) return "--/--/----";
  const d = ts.toDate();
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function sameDay(ts: Timestamp | undefined, target: Date) {
  if (!ts) return false;
  const d = ts.toDate();
  return (
    d.getFullYear() === target.getFullYear() &&
    d.getMonth() === target.getMonth() &&
    d.getDate() === target.getDate()
  );
}

function statusLabel(s: OrderStatus) {
  if (s === "PAID") return { text: "Đã thanh toán", cls: "text-green-400" };
  if (s === "PENDING") return { text: "Đang chờ", cls: "text-yellow-400" };
  return { text: "Đã huỷ", cls: "text-red-400" };
}

function displayOrderCode(id: string) {
  return "#" + id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
}

// countdown (5 phút) – chỉ hiển thị nếu chưa huỷ
function remainingText(ts?: Timestamp) {
  if (!ts) return "--:--";
  const created = ts.toDate().getTime();
  const now = Date.now();
  const diff = 5 * 60 * 1000 - (now - created);
  if (diff <= 0) return "00:00";
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${pad2(m)}:${pad2(s)}`;
}

export default function PurchasePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // tick để countdown chạy
  const [, forceTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // guard login
  useEffect(() => {
    if (loading) return;
    if (!user) {
      const returnTo = encodeURIComponent("/routes/avatar/settings/buy");
      router.push(`${LOGIN_PATH}?returnTo=${returnTo}`);
    }
  }, [user, loading, router]);

  // realtime orders
  useEffect(() => {
    if (!user) return;

    setFetching(true);
    const q = query(
      collection(db, "users", user.uid, "orders"),
      orderBy("purchasedAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: Order[] = snap.docs.map((doc) => {
          const data: any = doc.data();
          const st = (data.status ?? "PENDING") as OrderStatus;
          return {
            id: doc.id,
            productId: data.productId ?? "",
            productName: data.productName ?? "Sản phẩm",
            amountVND: Number(data.amountVND ?? 0),
            quantity: Number(data.quantity ?? 1),
            totalVND: data.totalVND != null ? Number(data.totalVND) : undefined,
            status: st,
            purchasedAt: data.purchasedAt as Timestamp | undefined,
          };
        });
        setOrders(items);
        setFetching(false);
      },
      (err) => {
        console.error(err);
        setOrders([]);
        setFetching(false);
      }
    );

    return () => unsub();
  }, [user]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    return orders.filter((o) => {
      const code = displayOrderCode(o.id).toLowerCase();
      const name = (o.productName || "").toLowerCase();

      const okSearch = !s || code.includes(s) || name.includes(s);
      const okStatus = status === "ALL" ? true : o.status === status;
      const okDate = !selectedDate ? true : sameDay(o.purchasedAt, selectedDate);

      return okSearch && okStatus && okDate;
    });
  }, [orders, search, status, selectedDate]);

  return (
    <div className="text-white bg-slate-950 min-h-screen p-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Lịch sử giao dịch</h1>
          <p className="text-slate-300">
            Theo dõi các đơn hàng và trạng thái thanh toán của bạn.
          </p>
        </div>

        <button
          onClick={() => router.push(SHOP_PATH)}
          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
        >
          🛍️ <span>Cửa hàng</span>
        </button>
      </div>

      <div className="flex gap-4 mt-8 mb-6">
        <input
          className="bg-slate-900 border border-slate-700 px-4 py-3 rounded w-1/2"
          placeholder="Tìm theo mã đơn hàng hoặc tên sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="bg-slate-900 border border-slate-700 px-4 py-3 rounded"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PAID">Đã thanh toán</option>
          <option value="PENDING">Đang chờ</option>
          <option value="CANCELLED">Đã huỷ</option>
        </select>

        <DatePicker
          selected={selectedDate}
          onChange={(d) => setSelectedDate(d)}
          dateFormat="dd/MM/yyyy"
          placeholderText="dd/mm/yyyy"
          isClearable
          popperPlacement="bottom-end"
          className="bg-slate-900 border border-slate-700 px-4 py-3 rounded w-48 text-white outline-none"
          calendarClassName="bg-slate-900 text-white border border-slate-700"
        />
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800 text-slate-200">
            <tr>
              <th className="p-3">Mã đơn hàng</th>
              <th>Sản phẩm</th>
              <th>Số lượng</th>
              <th>Ngày mua</th>
              <th>Số tiền</th>
              <th>Trạng thái</th>
              <th>Điều chỉnh đơn hàng</th>
            </tr>
          </thead>

          <tbody>
            {fetching ? (
              <tr className="border-t border-slate-700">
                <td className="p-3 text-slate-300" colSpan={7}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr className="border-t border-slate-700">
                <td className="p-3 text-slate-300" colSpan={7}>
                  Không có giao dịch phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              filtered.map((o) => {
                const st = statusLabel(o.status);
                const money =
                  o.totalVND != null ? o.totalVND : o.amountVND * o.quantity;

                const countdown =
                  o.status === "CANCELLED" ? "--:--" : remainingText(o.purchasedAt);

                return (
                  <tr
                    key={o.id}
                    className="border-t border-slate-700 hover:bg-slate-800/40 cursor-pointer"
                    onClick={() => router.push(`/routes/orders/${o.id}`)}
                  >
                    <td className="p-3 font-semibold">{displayOrderCode(o.id)}</td>
                    <td>{o.productName}</td>
                    <td className="font-semibold">{o.quantity}</td>
                    <td>{formatDateDDMMYYYY(o.purchasedAt)}</td>
                    <td className="font-semibold">{formatVND(money)}</td>
                    <td>
                      <span className={st.cls}>{st.text}</span>
                    </td>
                    <td className="font-mono">{countdown}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
