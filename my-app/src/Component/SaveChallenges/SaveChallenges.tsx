"use client";

export default function SaveChallengesPage() {
  return (
    <div className="text-white bg-slate-950 min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Thử thách đã lưu</h1>

      <div className="grid grid-cols-4 gap-8">
        {/* Filter */}
        <div className="col-span-1">
          <h2 className="font-semibold mb-4">Bộ lọc</h2>

          <input
            placeholder="Tìm kiếm..."
            className="w-full bg-slate-900 border border-slate-700 px-4 py-2 rounded mb-6"
          />

          {/* Difficulty */}
          <h3 className="mb-2 text-slate-400">Độ khó</h3>
          <div className="space-y-2 mb-6">
            <label>
              <input type="checkbox" /> Dễ
            </label>
            <br />
            <label>
              <input type="checkbox" /> Trung bình
            </label>
            <br />
            <label>
              <input type="checkbox" /> Khó
            </label>
          </div>

          {/* Status */}
          <h3 className="mb-2 text-slate-400">Trạng thái</h3>
          <div className="space-y-2 mb-6">
            <label>
              <input type="checkbox" /> Chưa làm
            </label>
            <br />
            <label>
              <input type="checkbox" /> Đang làm
            </label>
            <br />
            <label>
              <input type="checkbox" /> Hoàn thành
            </label>
          </div>

          <button className="text-blue-400">Xóa bộ lọc</button>
        </div>

        {/* Challenges list */}
        <div className="col-span-3 space-y-6">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded">
            <h2 className="text-xl font-semibold">
              Xây dựng REST API với Node.js
            </h2>
            <p className="text-slate-400 mb-4">
              Tạo các endpoint sử dụng Express.
            </p>

            <span className="text-yellow-400 mr-4">Trung bình</span>
            <span className="text-blue-400 mr-4">Đang làm</span>

            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded float-right">
              Bắt đầu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
