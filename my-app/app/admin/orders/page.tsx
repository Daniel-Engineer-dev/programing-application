"use client";

import { useEffect, useState } from "react";
import { db } from "@/src/api/firebase/firebase";
import { collectionGroup, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc, Timestamp, where } from "firebase/firestore";
import { ShoppingCart, CheckCircle, XCircle, Clock, Filter, Search, Eye, Trash2, Edit, Save, X } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type OrderStatus = "PAID" | "PENDING" | "CANCELLED";

type Order = {
  id: string; // Order Document ID
  refPath: string; // Path to update doc (users/{uid}/orders/{oid})
  productId: string;
  productName: string;
  amountVND: number;
  quantity: number;
  totalVND?: number;
  status: OrderStatus;
  buyer: {
    fullName: string;
    phone: string;
    address: string;
    note: string;
  };
  payMethod: "COD" | "BANK";
  purchasedAt?: Timestamp;
};

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "₫";

function formatDate(ts?: Timestamp) {
  if (!ts) return "--/--/---- HH:mm";
  const d = ts.toDate();
  return d.toLocaleString("vi-VN");
}

const statusConfig = {
    PAID: { label: "Đã thanh toán", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30", icon: CheckCircle },
    PENDING: { label: "Đang chờ", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: Clock },
    CANCELLED: { label: "Đã hủy", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: XCircle },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal detail
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Order["buyer"]>({
      fullName: "", phone: "", address: "", note: ""
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);

  useEffect(() => {
    setLoading(true);
    // Realtime listener using collectionGroup
    const q = query(collectionGroup(db, "orders"), orderBy("purchasedAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Order[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
            id: d.id,
            refPath: d.ref.path,
            ...data,
            purchasedAt: data.purchasedAt,
            } as Order;
        });
        setOrders(list);
        setLoading(false);
    }, (error: any) => {
        console.error("Error fetching orders:", error);
         if (error?.message?.includes("index")) {
            alert("Cần tạo Index cho Collection Group 'orders'. Xem console.");
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Set edit data when modal opens
  useEffect(() => {
    if (selectedOrder) {
        setEditData(selectedOrder.buyer || { fullName: "", phone: "", address: "", note: "" });
        setIsEditing(false);
        
        // Update selectedOrder details from realtime list (in case status changed elsewhere)
        const fresh = orders.find(o => o.id === selectedOrder.id);
        if (fresh && fresh !== selectedOrder) {
            // Only update if fields changed to avoid loop - actually logic for editing takes precedence
            // But if status changes, we want to know.
            // Simplified: We rely on local state updates for instant feedback, 
            // but if another admin changes it, 'orders' will update. 
            // We should keep selectedOrder in sync if we are just viewing.
        }
    }
  }, [selectedOrder]); // Removing orders dependency to avoid modal flicker or reset

  const handleUpdateStatus = async (order: Order, newStatus: OrderStatus) => {
    if (!confirm(`Xác nhận đổi trạng thái đơn hàng sang: ${newStatus}?`)) return;
    
    try {
        await updateDoc(doc(db, order.refPath), { status: newStatus });
        // No need to manually setOrders, onSnapshot will handle it.
        // But for selectedOrder inside Modal, we should update it locally to reflect immediate change visually
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        alert("Cập nhật trạng thái thành công!");
    } catch (error) {
         console.error("Error updating status:", error);
         alert("Lỗi khi cập nhật trạng thái!");
    }
  };

  const handleDeleteOrder = async (order: Order) => {
      if (!confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN đơn hàng này?\n\nHành động này không thể hoàn tác!`)) return;

      try {
          await deleteDoc(doc(db, order.refPath));
          // onSnapshot handles list update
          setSelectedOrder(null);
          alert("Đã xóa đơn hàng vĩnh viễn!");
      } catch (error) {
          console.error("Error deleting order:", error);
          alert("Lỗi khi xóa đơn hàng!");
      }
  };

  const handleSaveBuyerInfo = async () => {
      if (!selectedOrder || !editData) return;
      
      try {
          await updateDoc(doc(db, selectedOrder.refPath), { buyer: editData });
          // onSnapshot handles list update
          setSelectedOrder(prev => prev ? { ...prev, buyer: editData } : null);
          setIsEditing(false);
          alert("Cập nhật thông tin khách hàng thành công!");
      } catch (error) {
          console.error("Error saving buyer info:", error);
          alert("Lỗi khi lưu thông tin!");
      }
  };

  // Filtering
  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    const matchSearch = searchTerm === "" || 
        (o.buyer?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
        (o.buyer?.phone || "").includes(searchTerm);
    
    let matchDate = true;
    if (dateFilter && o.purchasedAt) {
        const d = o.purchasedAt.toDate();
        matchDate = d.getDate() === dateFilter.getDate() &&
                    d.getMonth() === dateFilter.getMonth() &&
                    d.getFullYear() === dateFilter.getFullYear();
    }

    return matchStatus && matchSearch && matchDate;
  });

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-3 drop-shadow-sm">
            <ShoppingCart size={36} className="text-emerald-400" />
            Quản Lý Đơn Hàng
          </h1>
          <p className="text-slate-400 mt-2 text-lg font-medium">Theo dõi và xử lý đơn đặt hàng</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-900/40 backdrop-blur-xl p-4 rounded-2xl border border-slate-800/60 shadow-2xl flex flex-col md:flex-row gap-4 items-center relative z-50">
        <div className="relative flex-1 w-full md:w-auto group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
            <input 
                placeholder="Tìm tên khách, SĐT..." 
                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-200 transition-all placeholder:text-slate-600"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="relative w-full md:w-auto group">
            <div className={`absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none transition-colors ${statusFilter !== 'ALL' ? 'text-emerald-400' : 'text-slate-500'}`}>
                <Filter size={18} />
            </div>
             <select 
                className="w-full md:w-48 bg-slate-950/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-8 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none text-slate-200 cursor-pointer transition-all hover:bg-slate-900"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
            >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Đang chờ xử lý</option>
                <option value="PAID">Đã thanh toán</option>
                <option value="CANCELLED">Đã hủy</option>
            </select>
        </div>

        <div className="relative w-full md:w-auto">
             <div className="absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none text-slate-500 z-10">
                <Clock size={18} />
             </div>
             <DatePicker
                selected={dateFilter}
                onChange={(d) => setDateFilter(d)}
                dateFormat="dd/MM/yyyy"
                placeholderText="Lọc theo ngày"
                className="w-full md:w-40 bg-slate-950/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-200 cursor-pointer text-center transition-all hover:bg-slate-900 relative z-20"
                popperClassName="z-50"
                isClearable
             />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900/40 rounded-3xl border border-slate-800/60 overflow-hidden shadow-2xl backdrop-blur-md">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-950/40 text-slate-400 uppercase text-xs font-bold tracking-wider border-b border-slate-800/50">
                    <th className="px-6 py-6 font-bold">Mã Đơn</th>
                    <th className="px-6 py-6 font-bold">Khách Hàng</th>
                    <th className="px-6 py-6 font-bold">Sản Phẩm</th>
                    <th className="px-6 py-6 font-bold">Tổng Tiền</th>
                    <th className="px-6 py-6 font-bold">Ngày Mua</th>
                    <th className="px-6 py-6 font-bold">Trạng Thái</th>
                    <th className="px-6 py-6 font-bold text-right">Chi Tiết</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm">
                {loading ? (
                     <tr>
                        <td colSpan={7} className="p-20 text-center">
                            <div className="inline-block w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                        </td>
                    </tr>
                ) : filtered.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="py-24 text-center text-slate-500">
                            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShoppingCart size={32} className="opacity-30" />
                            </div>
                            <p className="font-medium">Không tìm thấy đơn hàng nào.</p>
                        </td>
                    </tr>
                ) : (
                    filtered.map(order => {
                        const status = statusConfig[order.status] || statusConfig["PENDING"];
                        const StatusIcon = status.icon;
                        const total = order.totalVND ?? (order.amountVND * order.quantity);

                        return (
                            <tr key={order.id} className="hover:bg-emerald-500/5 transition-all duration-200 group">
                                <td className="px-6 py-5">
                                    <span className="font-mono text-xs text-slate-500 bg-slate-950/50 px-2 py-1 rounded border border-slate-800/50">
                                        #{order.id.slice(0, 8)}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="font-bold text-slate-200 max-w-[150px] truncate group-hover:text-emerald-400 transition-colors">{order.buyer?.fullName || "N/A"}</div>
                                    <div className="text-xs text-slate-500 font-medium">{order.buyer?.phone}</div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="font-medium text-slate-300 max-w-[200px] truncate">{order.productName}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">x{order.quantity}</div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="font-bold text-amber-400 font-mono text-base">{formatVND(total)}</span>
                                </td>
                                <td className="px-6 py-5 text-slate-400 text-xs font-medium">{formatDate(order.purchasedAt)}</td>
                                <td className="px-6 py-5">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${status.color} ${status.bg} ${status.border}`}>
                                        <StatusIcon size={12} strokeWidth={3} />
                                        {status.label}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <button 
                                        onClick={() => setSelectedOrder(order)}
                                        className="p-2.5 bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-xl transition-all border border-transparent hover:border-emerald-500/30 group-hover:translate-x-0 translate-x-2 opacity-60 group-hover:opacity-100"
                                    >
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900/90 border border-slate-700/50 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-950/30 relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 opacity-50"></div>
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Chi tiết đơn hàng
                            <span className="text-xs font-normal text-slate-400 bg-slate-800/50 px-2 py-1 rounded-full border border-slate-700/50 font-mono">#{selectedOrder.id.slice(0,8)}</span>
                        </h2>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="relative z-10 text-slate-400 hover:text-white p-2 hover:bg-slate-800/50 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm overflow-y-auto custom-scrollbar">
                    {/* Buyer Info */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                            <h3 className="font-bold text-emerald-400 uppercase tracking-widest text-xs flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                Thông tin khách hàng
                            </h3>
                            {!isEditing ? (
                                <button onClick={() => setIsEditing(true)} className="text-xs flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors font-bold px-2 py-1 hover:bg-emerald-500/10 rounded">
                                    <Edit size={14} /> Sửa
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => setIsEditing(false)} className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 bg-slate-800 rounded">Hủy</button>
                                    <button onClick={handleSaveBuyerInfo} className="text-xs flex items-center gap-1 text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded font-bold shadow-lg shadow-emerald-500/20">
                                        <Save size={14} /> Lưu
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="space-y-4">
                            <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/50">
                                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Họ tên</span>
                                {isEditing ? (
                                    <input 
                                        className="w-full bg-slate-900/80 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                        value={editData.fullName}
                                        onChange={e => setEditData({...editData, fullName: e.target.value})}
                                    />
                                ) : (
                                    <span className="font-bold text-slate-200 text-base">{selectedOrder.buyer?.fullName}</span>
                                )}
                            </div>
                            <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/50">
                                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Số điện thoại</span>
                                {isEditing ? (
                                    <input 
                                        className="w-full bg-slate-900/80 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                        value={editData.phone}
                                        onChange={e => setEditData({...editData, phone: e.target.value})}
                                    />
                                ) : (
                                    <span className="font-mono text-slate-200 text-sm tracking-wide">{selectedOrder.buyer?.phone}</span>
                                )}
                            </div>
                            <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/50">
                                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Địa chỉ</span>
                                {isEditing ? (
                                    <textarea 
                                        className="w-full bg-slate-900/80 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none"
                                        rows={3}
                                        value={editData.address}
                                        onChange={e => setEditData({...editData, address: e.target.value})}
                                    />
                                ) : (
                                    <span className="text-slate-300 block break-words leading-relaxed text-sm">{selectedOrder.buyer?.address}</span>
                                )}
                            </div>
                            <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/50">
                                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Ghi chú</span>
                                {isEditing ? (
                                    <textarea 
                                        className="w-full bg-slate-900/80 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none"
                                        rows={2}
                                        value={editData.note}
                                        onChange={e => setEditData({...editData, note: e.target.value})}
                                    />
                                ) : (
                                    <span className="text-slate-400 italic block break-words">{selectedOrder.buyer?.note || "Không có ghi chú"}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order Info */}
                    <div className="space-y-6">
                         <h3 className="font-bold text-blue-400 uppercase tracking-widest text-xs border-b border-slate-700/50 pb-2 flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                             Thông tin đơn hàng
                         </h3>
                         <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-800/50 space-y-4">
                            <div>
                                <span className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Sản phẩm</span>
                                <span className="font-bold text-slate-100 text-lg leading-snug block">{selectedOrder.productName}</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                                <div>
                                    <span className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Đơn giá</span>
                                    <span className="font-mono text-slate-300">{formatVND(selectedOrder.amountVND)}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Số lượng</span>
                                    <span className="font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded">x{selectedOrder.quantity}</span>
                                </div>
                            </div>
                            <div className="pt-2">
                                 <span className="block text-slate-400 text-xs mb-1">Tổng tiền thanh toán</span>
                                 <span className="font-extrabold text-amber-400 text-3xl font-mono tracking-tight shadow-amber-500/10 drop-shadow-sm">
                                    {formatVND(selectedOrder.totalVND ?? (selectedOrder.amountVND * selectedOrder.quantity))}
                                 </span>
                            </div>
                         </div>

                         <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-800/50 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 text-xs font-bold uppercase">Phương thức</span>
                                <span className="font-bold bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-xs border border-slate-700">
                                    {selectedOrder.payMethod}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 text-xs font-bold uppercase">Ngày mua</span>
                                <span className="font-mono text-slate-300 text-xs">{formatDate(selectedOrder.purchasedAt)}</span>
                            </div>
                         </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-700/50 bg-slate-950/30 flex justify-between items-center mt-auto">
                    {/* LEft side: Delete Button */}
                    <div>
                         <button 
                            onClick={() => handleDeleteOrder(selectedOrder)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-xs font-bold border border-transparent hover:border-red-500/20"
                            title="Xóa vĩnh viễn"
                        >
                            <Trash2 size={16} /> <span className="hidden sm:inline">Xóa đơn hàng</span>
                        </button>
                    </div>
                    
                    {/* Right side: Actions */}
                    <div className="flex gap-3 items-center">
                         {selectedOrder.status === "PENDING" && (
                             <>
                                <button 
                                    onClick={() => handleUpdateStatus(selectedOrder, "CANCELLED")}
                                    className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all font-bold text-xs border border-slate-700"
                                >
                                    Hủy đơn
                                </button>
                                <button 
                                    onClick={() => handleUpdateStatus(selectedOrder, "PAID")}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500 transition-all font-bold text-xs shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 flex items-center gap-2"
                                >
                                    <CheckCircle size={14} /> Đã thu tiền
                                </button>
                             </>
                         )}
                         {selectedOrder.status === "PAID" && (
                            <button 
                                onClick={() => handleUpdateStatus(selectedOrder, "CANCELLED")}
                                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all font-bold text-xs border border-slate-700"
                            >
                                Hủy & Hoàn tác
                            </button>
                         )}
                         {selectedOrder.status === "CANCELLED" && (
                            <button 
                                onClick={() => handleUpdateStatus(selectedOrder, "PENDING")}
                                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all font-bold text-xs border border-slate-700"
                            >
                                Mở lại đơn
                            </button>
                         )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
