// Component/NavBar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/problems", label: "Problems" },
  { href: "/explore", label: "Explore" },
  { href: "/discuss", label: "Discuss" },
  { href: "/contests", label: "Contests" },
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

  return (
    <header
      className={`sticky top-0 z-50 bg-white/80 backdrop-blur ${
        elevated ? "border-b shadow-sm" : "border-b"
      }`}
    >
      <nav className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Logo" width={28} height={28} />
          <span className="text-lg font-semibold tracking-tight">
            DVD HAND SOME
          </span>
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
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right: Auth placeholder */}
        <div className="hidden md:block">
          <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
            Sign In
          </button>
        </div>

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
            <li>
              <button className="mt-2 w-full rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
                Sign In
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
