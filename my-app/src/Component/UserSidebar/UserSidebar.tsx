"use client";

import { usePathname } from "next/navigation";
import { auth } from "@/src/api/firebase";

export default function UserSidebar() {
  const menu = [
    { label: "Hồ sơ", href: "/routes/avatar/settings" },
    { label: "Giao dịch & mua hàng", href: "/routes/avatar/settings/buy" },
    { label: "Danh sách của tôi", href: "/routes/avatar/settings/saved" },
    { label: "Lịch sử luyện tập", href: "/routes/avatar/settings/history" },
    { label: "Ghi chú", href: "/routes/avatar/settings/notes" },
  ];
  return (
    <div className="p-6 space-y-2">
      {menu.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="
            block px-3 py-2 rounded-md
            text-slate-200
            hover:bg-slate-700
            transition
          "
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}
