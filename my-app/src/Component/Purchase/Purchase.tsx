"use client";

export default function PurchasePage() {
  return (
    <div className="text-white bg-slate-950 min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">
        Quản lý Gói & Lịch sử Mua hàng
      </h1>

      {/* Premium Box */}
      <div className="bg-slate-900 border border-slate-700 p-6 rounded mb-10">
        <h2 className="text-lg font-semibold mb-2">Premium Hàng Năm</h2>
        <p className="text-green-400">
          ● Đang hoạt động - Gia hạn vào 25/12/2024
        </p>
        <button className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
          Quản lý Gói
        </button>
      </div>

      {/* Search / Filter */}
      <div className="flex gap-4 mb-6">
        <input
          className="bg-slate-900 border border-slate-700 px-4 py-2 rounded w-1/2"
          placeholder="Tìm theo mã đơn hàng, tên sản phẩm..."
        />
        <select className="bg-slate-900 border border-slate-700 px-4 py-2 rounded">
          <option>Tất cả trạng thái</option>
        </select>
        <input
          type="date"
          className="bg-slate-900 border border-slate-700 px-4 py-2 rounded"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-700 rounded overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="p-3">Mã đơn hàng</th>
              <th>Chi tiết</th>
              <th>Ngày</th>
              <th>Số tiền</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-t border-slate-700">
              <td className="p-3">#A8B2-C5D1</td>
              <td>Gói Premium - 1 năm</td>
              <td>25/12/2023</td>
              <td>2.299.000₫</td>
              <td>
                <span className="text-green-400">Đã thanh toán</span>
              </td>
              <td>📄</td>
            </tr>

            <tr className="border-t border-slate-700">
              <td className="p-3">#2EF7-G3H9</td>
              <td>Khóa học Cấu trúc dữ liệu</td>
              <td>12/11/2023</td>
              <td>499.000₫</td>
              <td>
                <span className="text-yellow-400">Đang chờ</span>
              </td>
              <td>📄</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
