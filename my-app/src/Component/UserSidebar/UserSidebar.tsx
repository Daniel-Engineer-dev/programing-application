"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, ShoppingCart, BookmarkCheck, Clock, FileText } from "lucide-react";

export default function UserSidebar() {
  const pathname = usePathname();

  const menu = [
    { label: "Hồ sơ", href: "/routes/avatar/settings", icon: User },
    { label: "Giao dịch & mua hàng", href: "/routes/avatar/settings/buy", icon: ShoppingCart },
    { label: "Danh sách của tôi", href: "/routes/avatar/settings/saved", icon: BookmarkCheck },
    { label: "Lịch sử luyện tập", href: "/routes/avatar/settings/history", icon: Clock },
    { label: "Ghi chú", href: "/routes/avatar/settings/notes", icon: FileText },
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
              group relative block px-4 py-3.5 rounded-xl
              text-sm font-semibold
              transition-all duration-300
              flex items-center gap-3
              overflow-hidden
              ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-xl shadow-blue-500/30" 
                  : "text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-slate-800 hover:to-slate-700"
              }
            `}
          >
            {/* Background glow effect khi active */}
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-600/20 blur-xl opacity-50"></div>
            )}
            
            {/* Icon */}
            <Icon 
              size={18} 
              className={`relative z-10 transition-transform group-hover:scale-110 ${
                isActive ? "" : "group-hover:text-blue-400"
              }`} 
            />
            
            {/* Label */}
            <span className="relative z-10">{item.label}</span>
            
            {/* Active indicator */}
            {isActive && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full"></div>
            )}
            
            {/* Hover shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </Link>
        );
      })}
    </div>
  );
}
