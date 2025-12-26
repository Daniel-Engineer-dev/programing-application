"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function UserSidebar() {
  const pathname = usePathname();

  const menu = [
    { label: "Hồ sơ", href: "/routes/avatar/settings" },
    { label: "Giao dịch & mua hàng", href: "/routes/avatar/settings/buy" },
    { label: "Danh sách của tôi", href: "/routes/avatar/settings/saved" },
    { label: "Lịch sử luyện tập", href: "/routes/avatar/settings/history" },
    { label: "Ghi chú", href: "/routes/avatar/settings/notes" },
  ];

  return (
    <div className="p-6 space-y-2">
      {menu.map((item) => {
        // Kiểm tra xem trang hiện tại có khớp với href của item hay không
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              block px-3 py-2 rounded-md
              text-sm font-medium
              transition-all duration-200
              ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" // Màu khi đang ở trang này
                  : "text-slate-300 hover:bg-slate-700 hover:text-white" // Màu khi ở trang khác
              }
            `}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
