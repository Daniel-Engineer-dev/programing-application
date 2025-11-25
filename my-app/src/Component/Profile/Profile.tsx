"use client";

import Image from "next/image";
import UserSidebar from "@/src/Component/UserSidebar/UserSidebar";
import { auth } from "@/src/api/firebase";

export default function ProfilePage() {
  const user = auth.currentUser;
  const displayName = user?.displayName || "";
  const email = user?.email || "";
  const photoURL = user?.photoURL || "/avatar.png";

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex">
      <main className="flex-1 p-10">
        <h1 className="text-3xl font-bold">Hồ sơ</h1>
        <p className="text-gray-400 mt-2">Cập nhật thông tin cá nhân.</p>

        {/* Header */}
        <div className="mt-8 flex items-center gap-6">
          <Image
            src={photoURL}
            width={90}
            height={90}
            alt="avatar"
            className="rounded-full"
          />
          <div>
            <h2 className="text-xl font-semibold">{displayName}</h2>
            <p className="text-gray-400">{email}</p>
          </div>
          <button className="ml-auto bg-gray-600 px-4 py-2 rounded-lg hover:bg-gray-500">
            Tải ảnh mới
          </button>
        </div>

        {/* Inputs */}
        <div className="mt-10 grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-400">Tên hiển thị</label>
            <input
              className="mt-2 w-full bg-[#121a28] border border-gray-700 px-3 py-2 rounded-lg"
              defaultValue={displayName}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">Tên người dùng</label>
            <input
              className="mt-2 w-full bg-[#121a28] border border-gray-700 px-3 py-2 rounded-lg"
              defaultValue={displayName}
            />
          </div>
        </div>

        {/* Email */}
        <div className="mt-6">
          <label className="text-sm text-gray-400">Email</label>
          <input
            className="mt-2 w-full bg-[#121a28] border border-gray-700 px-3 py-2 rounded-lg"
            value={email}
            disabled
          />
        </div>

        {/* Password */}
        <h3 className="text-xl font-semibold mt-10">Thay đổi mật khẩu</h3>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <input
            type="password"
            placeholder="Mật khẩu hiện tại"
            className="bg-[#121a28] border border-gray-700 px-3 py-2 rounded-lg"
          />
          <input
            type="password"
            placeholder="Xác nhận mật khẩu mới"
            className="bg-[#121a28] border border-gray-700 px-3 py-2 rounded-lg"
          />
        </div>

        <div className="mt-6 w-1/2">
          <input
            type="password"
            placeholder="Mật khẩu mới"
            className="bg-[#121a28] border border-gray-700 px-3 py-2 rounded-lg"
          />
        </div>

        <div className="flex justify-end gap-4 mt-10">
          <button className="px-5 py-2 border border-gray-600 rounded-lg hover:bg-gray-700">
            Hủy
          </button>
          <button className="px-5 py-2 bg-blue-600 rounded-lg hover:bg-blue-500">
            Lưu thay đổi
          </button>
        </div>
      </main>
    </div>
  );
}
