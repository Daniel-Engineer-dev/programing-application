"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

import { useAuthContext } from "@/contexts/authContext";
import UserMenu from "@/components/AvatarUser/AvatarUser";
import { MessageSquare } from "lucide-react";
import ChatUI from "../ChatUI/ChatUI";
const links = [
  { href: "/problems", label: "Bài Tập", theme: "blue" },
  { href: "/explore", label: "Khám Phá", theme: "green" },
  { href: "/discuss", label: "Thảo Luận", theme: "purple" },
  { href: "/contests", label: "Cuộc thi", theme: "red" },
];

// Function to get theme colors for each page
const getThemeColors = (theme: string, isActive: boolean) => {
  const themes = {
    blue: {
      active: "text-white bg-blue-600 border-blue-500",
      hover: "hover:bg-slate-800 hover:text-white",
      mobileBg: "bg-blue-600",
    },
    green: {
      active: "text-white bg-blue-600 border-blue-500",
      hover: "hover:bg-slate-800 hover:text-white",
      mobileBg: "bg-blue-600",
    },
    purple: {
      active: "text-white bg-blue-600 border-blue-500",
      hover: "hover:bg-slate-800 hover:text-white",
      mobileBg: "bg-blue-600",
    },
    red: {
      active: "text-white bg-blue-600 border-blue-500",
      hover: "hover:bg-slate-800 hover:text-white",
      mobileBg: "bg-blue-600",
    },
  };

  return themes[theme as keyof typeof themes] || themes.blue;
};

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [elevated, setElevated] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const { user, username } = useAuthContext();

  // Đổ bóng khi scroll nhẹ (Fix lỗi render dây chuyền)
  useEffect(() => {
    const onScroll = () => {
      const isElevated = window.scrollY > 4;
      setElevated((prev) => (prev !== isElevated ? isElevated : prev));
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Listen for unread count updates
  useEffect(() => {
    const updateUnreadCount = () => {
      const count = parseInt(localStorage.getItem('chatUnreadCount') || '0');
      setUnreadCount(count);
    };
    
    // Initial load
    updateUnreadCount();
    
    // Listen for updates
    window.addEventListener('chat-unread-updated', updateUnreadCount);
    return () => window.removeEventListener('chat-unread-updated', updateUnreadCount);
  }, []);

  // Hàm kiểm tra route hiện tại chính xác hơn
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-slate-950/95 backdrop-blur transition-all ${
        elevated
          ? "border-b border-slate-800 shadow-sm"
          : "border-b border-transparent"
      }`}
    >
      <nav className="flex h-14 w-full items-center justify-between px-4">
        {/* Left: Logo */}
        <Link
          href="/"
          className="relative flex items-center justify-center h-full w-32 overflow-hidden"
        >
          <Image
            src="/codepro.png"
            alt="Logo"
            width={150}
            height={150}
            className="brightness-150 max-w-none object-center"
          />
        </Link>

        {/* Desktop menu */}
        <ul className="hidden items-center gap-2 md:flex">
          {links.map((l) => {
            const colors = getThemeColors(l.theme, isActive(l.href));
            return (
              <li key={l.href}>
                <Link href={l.href}>
                  <button
                    className={`text-sm font-bold py-2 px-4 rounded-lg transition-colors duration-200 border ${
                      isActive(l.href)
                        ? colors.active
                        : `text-slate-300 border-transparent ${colors.hover}`
                    }`}
                  >
                    {l.label}
                  </button>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Right: User Menu / Auth */}
        <div className="flex items-center gap-4">
          {user && (
            <button
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Thảo luận"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("toggle-chat"))
              }
            >
              <MessageSquare size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-slate-950">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}
          {!user ? (
            <Link href="/auth/login" className="hidden md:block">
              <button className="text-white bg-blue-600 hover:bg-blue-700 font-bold py-2 px-6 rounded-lg transition-colors border border-blue-500">
                Đăng nhập
              </button>
            </Link>
          ) : (
            /* UserMenu sẽ tự lấy data từ AuthContext đã link với collection 'users' */
            <UserMenu name={username} />
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen((s) => !s)}
            className="inline-flex items-center rounded-md border border-slate-700 p-2 md:hidden text-white hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div
          id="mobile-menu"
          className="border-t border-slate-800 bg-slate-950 md:hidden animate-in slide-in-from-top duration-200"
        >
          <ul className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            {links.map((l) => {
              const colors = getThemeColors(l.theme, isActive(l.href));
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(l.href)
                        ? `${colors.mobileBg} text-white`
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
