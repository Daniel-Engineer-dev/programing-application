"use client";

import { usePathname } from "next/navigation";
import { auth } from "@/src/api/firebase";

export default function UserSidebar() {
  const user = auth.currentUser;

  const displayName = user?.displayName || user?.email?.split("@")[0] || "";
  const email = user?.email || "";
  const photoURL = user?.photoURL || "/avatar.png";

  const menu = [
    { label: "Hồ sơ", href: "/routes/avatar/settings" },
    { label: "Giao dịch & mua hàng", href: "/routes/avatar/settings/buy" },
    { label: "Danh sách của tôi", href: "/routes/avatar/settings/saved" },
    { label: "Lịch sử luyện tập", href: "/routes/avatar/settings/history" },
    { label: "Ghi chú", href: "/routes/avatar/settings/notes" },
  ];

  return (
    <aside className="w-64 bg-[#0f1624] min-h-screen text-white px-6 py-6 flex flex-col justify-between border-r border-gray-700">
      <div>
        <div className="flex flex-col items-center text-center mb-4">
          <img src={photoURL} className="w-16 h-16 rounded-full border mb-2" />
          <p className="font-semibold">{displayName}</p>
          <p className="text-sm text-gray-300">{email}</p>
        </div>

        <nav className="flex flex-col space-y-3 mt-6">
          {menu.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:bg-[#1a2333] px-3 py-2 rounded transition"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <button className="text-left text-gray-300 hover:text-white">
        Đăng xuất
      </button>
    </aside>
  );
}
