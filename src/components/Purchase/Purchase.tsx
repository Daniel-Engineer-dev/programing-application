"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { ShoppingBag, Search, Calendar, Filter } from "lucide-react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";

const LOGIN_PATH = "/auth/login";
const SHOP_PATH = "/shop";

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

  // Custom Dropdown State & Ref
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statusOptions: { value: "ALL" | OrderStatus; label: string }[] = [
    { value: "ALL", label: "Tất cả trạng thái" },
    { value: "PAID", label: "Đã thanh toán" },
    { value: "PENDING", label: "Đang chờ" },
    { value: "CANCELLED", label: "Đã huỷ" },
  ];

  const currentStatusLabel = statusOptions.find(opt => opt.value === status)?.label || "Tất cả trạng thái";

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
      const returnTo = encodeURIComponent("/avatar/settings/buy");
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
    <div className="text-white bg-slate-950 min-h-screen p-8 relative">
      <div className="relative z-10">
      <div className="flex items-start justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white">Lịch sử giao dịch</h1>
          <p className="text-slate-400 text-base">
            Theo dõi các đơn hàng và trạng thái thanh toán của bạn.
          </p>
        </div>

        <button
          onClick={() => router.push(SHOP_PATH)}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <ShoppingBag size={18} />
          <span>Cửa hàng</span>
        </button>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="h-11 w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-blue-600 pl-12 pr-4 rounded-lg text-white outline-none transition-colors text-sm font-medium"
            placeholder="Tìm theo mã đơn hàng hoặc tên sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="h-11 w-48 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-blue-600 pl-12 pr-8 rounded-lg text-white outline-none transition-colors flex items-center justify-between gap-2 cursor-pointer text-left text-sm font-semibold relative"
          >
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <span className="truncate pr-2 block w-full">{currentStatusLabel}</span>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</span>
          </button>
          
          {dropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden z-20">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setStatus(opt.value);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-850 ${
                    status === opt.value
                      ? "text-blue-400 font-bold bg-slate-850/50"
                      : "text-slate-350"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
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
            className="h-11 w-48 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-blue-600 pl-12 pr-4 rounded-lg text-white outline-none transition-colors text-sm font-semibold"
            calendarClassName="bg-slate-900 text-white border border-slate-700"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-sm font-semibold">
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

          <tbody className="divide-y divide-slate-800">
            {fetching ? (
              <tr className="border-t border-slate-800">
                <td className="p-3 text-slate-400" colSpan={7}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr className="border-t border-slate-800">
                <td className="p-3 text-slate-400" colSpan={7}>
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
                    className="hover:bg-slate-850/50 transition-colors cursor-pointer group border-l-2 border-l-transparent hover:border-l-blue-600 border-b border-slate-800"
                    onClick={() => router.push(`/orders/${o.id}`)}
                  >
                    <td className="p-4 font-bold text-slate-300 group-hover:text-blue-400 transition-colors">{displayOrderCode(o.id)}</td>
                    <td className="p-4 group-hover:text-blue-300 transition-colors">{o.productName}</td>
                    <td className="p-4 font-semibold">{o.quantity}</td>
                    <td className="p-4 text-slate-450">{formatDateDDMMYYYY(o.purchasedAt)}</td>
                    <td className="p-4 font-semibold text-emerald-400">{formatVND(money)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                        o.status === 'PAID' ? 'bg-green-950/40 text-green-400 border border-green-900/50' :
                        o.status === 'PENDING' ? 'bg-yellow-950/40 text-yellow-455 border border-yellow-900/50' :
                        'bg-red-950/40 text-red-400 border border-red-900/50'
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
