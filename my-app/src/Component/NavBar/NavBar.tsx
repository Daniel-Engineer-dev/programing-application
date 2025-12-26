"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

import { useAuthContext } from "@/src/userHook/context/authContext";
import UserMenu from "@/src/Component/AvatarUser/AvatarUser";

const links = [
  { href: "/routes/problems", label: "Bài Tập" },
  { href: "/routes/explore", label: "Khám Phá" },
  { href: "/routes/discuss", label: "Thảo Luận" },
  { href: "/routes/contests", label: "Cuộc thi" },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [elevated, setElevated] = useState(false);
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

  // Hàm kiểm tra route hiện tại chính xác hơn
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-blue-950/80 backdrop-blur transition-all ${
        elevated
          ? "border-b border-blue-800 shadow-lg"
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
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href}>
                <button
                  className={`text-sm font-bold py-2 px-4 rounded-full transition-all duration-300 ${
                    isActive(l.href)
                      ? "text-blue-400 bg-white/10" // Màu khi đang ở trang này
                      : "text-slate-300 hover:bg-blue-700 hover:text-white" // Màu khi bình thường
                  }`}
                >
                  {l.label}
                </button>
              </Link>
            </li>
          ))}
        </ul>

        {/* Right: User Menu / Auth */}
        <div className="flex items-center gap-4">
          {!user ? (
            <Link href="/routes/auth/login" className="hidden md:block">
              <button className="text-white hover:bg-blue-700 font-bold py-2 px-6 rounded-full transition-all border border-blue-700/50">
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
            className="inline-flex items-center rounded-md border border-slate-700 px-2 py-1.5 md:hidden text-white"
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
          className="border-t border-blue-800 bg-blue-950 md:hidden animate-in slide-in-from-top duration-300"
        >
          <ul className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(l.href)
                      ? "bg-blue-700 text-white"
                      : "text-slate-300 hover:bg-blue-800 hover:text-white"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
