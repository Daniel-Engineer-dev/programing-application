// Component/NavBar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

import { signOut } from "firebase/auth";
import { auth } from "@/src/api/firebase";

const links = [
  { href: "/routes/problems", label: "Problems" },
  { href: "/routes/explore", label: "Explore" },
  { href: "/routes/discuss", label: "Discuss" },
  { href: "/routes/contests", label: "Contests" },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [elevated, setElevated] = useState(false);
  const pathname = usePathname();

  // Đổ bóng khi scroll nhẹ
  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const handleLogout = async () => {
    await signOut(auth);
  };
  return (
    <header
      className={`sticky top-0 z-50 bg-white/80 backdrop-blur ${
        elevated ? "border-b shadow-sm" : "border-b"
      }`}
    >
      <nav className="flex h-14 w-full items-center justify-between px-4 bg-white shadow">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/codepro.png" alt="Logo" width={150} height={150} />
          {/* <span className="text-lg font-semibold tracking-tight">CODE PRO</span> */}
        </Link>

        {/* Desktop menu */}
        <ul className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`text-sm transition-colors ${
                  isActive(l.href)
                    ? "text-blue-600"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                <button className=" hover:bg-blue-700 hover:text-white font-bold py-2 px-4 rounded-full hover:cursor-pointer transition-all duration-300 hover:duration-0">
                  {l.label}
                </button>
              </Link>
            </li>
          ))}
        </ul>
        {/* Right: Auth placeholder */}
        <Link href="/routes/auth/login" className="hidden md:block">
          <button className=" hover:bg-blue-700 hover:text-white font-bold py-2 px-4 rounded-full hover:cursor-pointer transition-all duration-300 hover:duration-0">
            Sign In
          </button>
        </Link>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((s) => !s)}
          className="inline-flex items-center rounded-md border px-2 py-1.5 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          ☰
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div id="mobile-menu" className="border-t bg-white md:hidden">
          <ul className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-2 py-2 text-sm ${
                    isActive(l.href)
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-gray-50"
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
