"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  FileCode, 
  Settings, 
  LogOut, 
  Trophy, 
  ShoppingBag, 
  ShoppingCart, 
  Compass, 
  Map, 
  BookOpen, 
  Layers, 
  ChevronDown, 
  ChevronRight,
  MessageSquare
} from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();
  // State to manage expanded groups. Default "Khám Phá" open for visibility.
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Khám Phá"]);

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const menuItems = [
    { name: "Tổng Quan", href: "/admin", icon: LayoutDashboard },
    { name: "Người Dùng", href: "/admin/users", icon: Users },
    { name: "Bài Tập", href: "/admin/problems", icon: FileCode },
    { name: "Cuộc Thi", href: "/admin/contests", icon: Trophy },
    { 
      name: "Khám Phá", 
      icon: Compass,
      children: [
        { name: "Chủ Đề", href: "/admin/explore/topics", icon: Layers },
        { name: "Lộ Trình", href: "/admin/explore/paths", icon: Map },
        { name: "Hướng Dẫn", href: "/admin/explore/guides", icon: BookOpen },
      ]
    },
    { name: "Thảo Luận", href: "/admin/discuss", icon: MessageSquare },
    { name: "Cửa Hàng", href: "/admin/shop", icon: ShoppingBag },
    { name: "Đơn Hàng", href: "/admin/orders", icon: ShoppingCart },
    { name: "Thông Báo", href: "/admin/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 min-h-screen flex flex-col shadow-2xl z-50">
      <div className="h-20 border-b border-slate-800 bg-slate-900/50 flex justify-center items-center relative overflow-hidden group/logo">
         {/* Glow effect underneath */}
         <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-hover/logo:opacity-50 transition-opacity duration-700"></div>
        
        <Link href="/" className="relative w-40 h-full flex items-center justify-center">
            <Image
                src="/codepro.png"
                alt="CodePro Admin"
                width={160}
                height={160}
                className="object-contain brightness-150 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                priority
            />
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          // Handle Parent with Children
          if (item.children) {
            const isExpanded = expandedGroups.includes(item.name);
            const hasActiveChild = item.children.some(c => pathname?.startsWith(c.href));
            
            return (
                <div key={item.name} className="mb-1">
                    <button 
                        onClick={() => toggleGroup(item.name)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group border border-transparent ${
                            hasActiveChild || isExpanded 
                            ? "bg-slate-800 text-slate-100 border-slate-700/50 shadow-lg" 
                            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon size={20} className={`transition-colors duration-300 ${hasActiveChild ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" : "text-slate-500 group-hover:text-blue-300"}`} />
                            <span className="font-medium">{item.name}</span>
                        </div>
                        {isExpanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                    </button>
                    
                    {/* Submenu */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-96 mt-1 space-y-1 opacity-100" : "max-h-0 opacity-0"}`}>
                        {item.children.map(child => {
                            const isChildActive = pathname === child.href || pathname?.startsWith(child.href + "/");
                            return (
                                <Link
                                    key={child.href}
                                    href={child.href}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ml-4 text-sm transition-all duration-300 border-l-2 ${
                                        isChildActive
                                        ? "border-blue-500 bg-blue-500/10 text-blue-300 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]"
                                        : "border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                                    }`}
                                >
                                    <child.icon size={18} />
                                    <span>{child.name}</span>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )
          }

          // Handle Single Item
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group border ${
                isActive
                  ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] translate-x-1"
                  : "border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 hover:translate-x-1"
              }`}
            >
              <item.icon size={20} className={`transition-all duration-300 ${isActive ? "text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.6)]" : "text-slate-500 group-hover:text-slate-300"}`} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/30">
        <Link 
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-300 group font-bold"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Thoát Admin</span>
        </Link>
      </div>
    </aside>
  );
}
