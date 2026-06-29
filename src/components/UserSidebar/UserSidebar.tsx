"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, ShoppingCart, BookmarkCheck, Clock, FileText } from "lucide-react";

export default function UserSidebar() {
  const pathname = usePathname();

  const menu = [
    { label: "Hồ sơ", href: "/avatar/settings", icon: User },
    { label: "Giao dịch & mua hàng", href: "/avatar/settings/buy", icon: ShoppingCart },
    { label: "Danh sách của tôi", href: "/avatar/settings/saved", icon: BookmarkCheck },
    { label: "Lịch sử luyện tập", href: "/avatar/settings/history", icon: Clock },
    { label: "Ghi chú", href: "/avatar/settings/notes", icon: FileText },
  ];

  return (
    <div className="p-6 space-y-2">
      {menu.map((item) => {
        // Kiểm tra xem trang hiện tại có khớp với href của item hay không
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              group relative block px-4 py-3 rounded-lg
              text-sm font-semibold
              transition-all duration-250
              flex items-center gap-3
              ${
                isActive
                  ? "bg-blue-600 text-white" 
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }
            `}
          >
            {/* Icon */}
            <Icon 
              size={18} 
              className={`transition-colors ${
                isActive ? "text-white" : "text-slate-400 group-hover:text-white"
              }`} 
            />
            
            {/* Label */}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
