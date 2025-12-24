"use client";

export default function ProfilePage() {
  return (
    <div className="text-white bg-slate-950 min-h-screen p-8">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-2">Hồ sơ</h1>
      <p className="text-slate-400 mb-8">
        Cập nhật ảnh đại diện và thông tin cá nhân của bạn.
      </p>

      {/* Avatar + info */}
      <div className="flex items-center mb-10">
        <img
          src="/avatar.png"
          className="w-20 h-20 rounded-full border border-slate-700"
        />
        <div className="ml-4">
          <h2 className="text-xl font-semibold">Tên người dùng</h2>
          <p className="text-slate-400">email@gmail.com</p>
        </div>
        <button className="ml-auto bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
          Tải ảnh mới
        </button>
      </div>

      {/* Display name + Username */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block mb-2 text-sm text-slate-400">
            Tên hiển thị
          </label>
          <input className="bg-slate-900 border border-slate-700 w-full px-4 py-2 rounded" />
        </div>

        <div>
          <label className="block mb-2 text-sm text-slate-400">
            Tên người dùng
          </label>
          <input className="bg-slate-900 border border-slate-700 w-full px-4 py-2 rounded" />
        </div>
      </div>

      {/* Email */}
      <div className="mb-12">
        <label className="block mb-2 text-sm text-slate-400">Email</label>
        <div className="flex">
          <input className="bg-slate-900 border border-slate-700 w-full px-4 py-2 rounded-l" />
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-r">
            Thay đổi
          </button>
        </div>
      </div>

      {/* Change password */}
      <h2 className="text-xl font-bold mb-4">Thay đổi mật khẩu</h2>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block mb-2 text-sm text-slate-400">
            Mật khẩu hiện tại
          </label>
          <input
            type="password"
            className="bg-slate-900 border border-slate-700 w-full px-4 py-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm text-slate-400">
            Xác nhận mật khẩu
          </label>
          <input
            type="password"
            className="bg-slate-900 border border-slate-700 w-full px-4 py-2 rounded"
          />
        </div>
      </div>

      <div className="flex">
        <button className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded mr-3">
          Hủy
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded">
          Lưu thay đổi
        </button>
      </div>
    </div>
  );
}
