"use client";

interface Order {
  id: string;
  name: string;
  date: string;
  money: string;
  status: "Đã thanh toán" | "Đang chờ" | "Thất bại";
}

export default function PurchasePage() {
  const orders: Order[] = [
    {
      id: "#A8B2-C5D1",
      name: "Gói Premium - 1 Năm",
      date: "25/12/2023",
      money: "2.299.000đ",
      status: "Đã thanh toán",
    },
    {
      id: "#2EF7-G3H9",
      name: "Khóa học Cấu trúc Dữ liệu",
      date: "12/11/2023",
      money: "499.000đ",
      status: "Đang chờ",
    },
    {
      id: "#1J5J1-K8L4",
      name: "Khóa học Thuật toán Nâng cao",
      date: "05/10/2023",
      money: "599.000đ",
      status: "Thất bại",
    },
  ];

  return (
    <div className="text-white px-10 py-8">
      <h1 className="text-3xl font-bold mb-2">
        Quản lý gói & Lịch sử mua hàng
      </h1>

      {/* Gói Premium */}
      <section className="mt-6 mb-8">
        <h2 className="text-lg font-semibold mb-3">Gói Premium của bạn</h2>
        <div className="bg-[#15192f] rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold mb-1">Premium Hàng Năm</p>
            <p className="text-sm text-gray-300">
              • Đang hoạt động – Gia hạn vào 25/12/2024
            </p>
          </div>
          <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium">
            Quản lý gói
          </button>
        </div>
      </section>

      {/* Lịch sử giao dịch */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Lịch sử giao dịch</h2>

        <div className="bg-[#15192f] rounded-xl overflow-hidden">
          <div className="grid grid-cols-5 text-sm font-semibold px-6 py-3 border-b border-gray-700">
            <span>Mã đơn hàng</span>
            <span>Chi tiết</span>
            <span>Ngày</span>
            <span>Số tiền</span>
            <span>Trạng thái</span>
          </div>

          {orders.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-5 text-sm px-6 py-3 border-t border-gray-800"
            >
              <span>{item.id}</span>
              <span>{item.name}</span>
              <span>{item.date}</span>
              <span>{item.money}</span>
              <span>
                {item.status === "Đã thanh toán" && (
                  <span className="px-2 py-1 rounded-full bg-green-600/30 text-green-300 text-xs">
                    {item.status}
                  </span>
                )}
                {item.status === "Đang chờ" && (
                  <span className="px-2 py-1 rounded-full bg-yellow-600/30 text-yellow-300 text-xs">
                    {item.status}
                  </span>
                )}
                {item.status === "Thất bại" && (
                  <span className="px-2 py-1 rounded-full bg-red-600/30 text-red-300 text-xs">
                    {item.status}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
