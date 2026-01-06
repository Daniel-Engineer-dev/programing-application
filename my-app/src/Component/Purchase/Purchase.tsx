"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { useAuth } from "@/src/userHook/hooks/userAuth";
import { db } from "@/src/api/firebase/firebase";
import { ShoppingBag, Search, Calendar, Filter } from "lucide-react";
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
    <div className="text-white bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-900 min-h-screen p-8 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="relative z-10">
      <div className="flex items-start justify-between gap-6 mb-10">
        <div>
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent">Lịch sử giao dịch</h1>
          <p className="text-slate-300 text-lg">
            Theo dõi các đơn hàng và trạng thái thanh toán của bạn.
          </p>
        </div>

        <button
          onClick={() => router.push(SHOP_PATH)}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 px-6 py-3.5 rounded-xl font-semibold flex items-center gap-2.5 shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105"
        >
          <ShoppingBag size={20} />
          <span>Cửa hàng</span>
        </button>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="bg-gradient-to-br from-slate-900/80 to-blue-900/20 border border-blue-500/30 pl-12 pr-4 py-3.5 rounded-xl w-full text-white outline-none focus:border-blue-400 focus:shadow-lg focus:shadow-blue-500/20 transition-all backdrop-blur-xl"
            placeholder="Tìm theo mã đơn hàng hoặc tên sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <select
            className="bg-gradient-to-br from-slate-900/80 to-blue-900/20 border border-blue-500/30 pl-12 pr-8 py-3.5 rounded-xl text-white outline-none focus:border-blue-400 transition-all appearance-none cursor-pointer backdrop-blur-xl"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="ALL" className="bg-slate-900">Tất cả trạng thái</option>
            <option value="PAID" className="bg-slate-900">Đã thanh toán</option>
            <option value="PENDING" className="bg-slate-900">Đang chờ</option>
            <option value="CANCELLED" className="bg-slate-900">Đã huỷ</option>
          </select>
        </div>

        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} />
          <DatePicker
            selected={selectedDate}
            onChange={(d) => setSelectedDate(d)}
            dateFormat="dd/MM/yyyy"
            placeholderText="dd/mm/yyyy"
            isClearable
            popperPlacement="bottom-end"
            className="bg-gradient-to-br from-slate-900/80 to-blue-900/20 border border-blue-500/30 pl-12 pr-4 py-3.5 rounded-xl w-48 text-white outline-none focus:border-blue-400 transition-all backdrop-blur-xl"
            calendarClassName="bg-slate-900 text-white border border-slate-700"
          />
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900/50 to-blue-900/20 border border-blue-500/20 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-gradient-to-r from-slate-800/90 to-blue-900/40 text-blue-300 border-b border-blue-500/20">
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

          <tbody className="divide-y divide-blue-500/10">
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
                    className="hover:bg-gradient-to-r hover:from-slate-800/40 hover:to-blue-900/20 transition-all duration-300 cursor-pointer group border-l-4 border-l-transparent hover:border-l-blue-500"
                    onClick={() => router.push(`/routes/orders/${o.id}`)}
                  >
                    <td className="p-4 font-bold text-blue-400">{displayOrderCode(o.id)}</td>
                    <td className="p-4 group-hover:text-blue-300 transition-colors">{o.productName}</td>
                    <td className="p-4 font-semibold">{o.quantity}</td>
                    <td className="p-4">{formatDateDDMMYYYY(o.purchasedAt)}</td>
                    <td className="p-4 font-semibold text-emerald-400">{formatVND(money)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${
                        o.status === 'PAID' ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10' :
                        o.status === 'PENDING' ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-400 border border-yellow-500/30 shadow-lg shadow-yellow-500/10' :
                        'bg-gradient-to-r from-red-500/10 to-rose-500/10 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/10'
                      }`}>{st.text}</span>
                    </td>
                    <td className="p-4 font-mono text-slate-400">{countdown}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
