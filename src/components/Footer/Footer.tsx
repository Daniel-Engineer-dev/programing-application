"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Facebook,
  Github,
  Youtube,
  Mail,
  MapPin,
  Send,
} from "lucide-react";

// Các trang dạng "workspace" giải bài (layout IDE toàn màn hình, position: fixed)
// không hiển thị footer để tránh phá vỡ bố cục và scroll.
const isWorkspaceRoute = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  // /problems/<slug>  → trang giải bài
  if (segments[0] === "problems" && segments.length >= 2) return true;
  // /contests/<id>/<problemId>  → trang giải bài trong cuộc thi
  if (segments[0] === "contests" && segments.length >= 3) return true;
  return false;
};

const productLinks = [
  { href: "/problems", label: "Bài Tập" },
  { href: "/explore", label: "Khám Phá" },
  { href: "/discuss", label: "Thảo Luận" },
  { href: "/contests", label: "Cuộc thi" },
];

const companyLinks = [
  { href: "/about", label: "Về chúng tôi" },
  { href: "/blog", label: "Blog" },
  { href: "/careers", label: "Tuyển dụng" },
  { href: "/contact", label: "Liên hệ" },
];

const supportLinks = [
  { href: "/faq", label: "Câu hỏi thường gặp" },
  { href: "/guide", label: "Hướng dẫn sử dụng" },
  { href: "/terms", label: "Điều khoản dịch vụ" },
  { href: "/privacy", label: "Chính sách bảo mật" },
];

const socials = [
  { href: "https://facebook.com", label: "Facebook", icon: Facebook },
  { href: "https://github.com", label: "GitHub", icon: Github },
  { href: "https://youtube.com", label: "YouTube", icon: Youtube },
];

export default function Footer() {
  const pathname = usePathname();

  // Ẩn footer trên các trang giải bài (IDE toàn màn hình)
  if (isWorkspaceRoute(pathname)) return null;

  return (
    <footer className="border-t border-blue-900/60 bg-blue-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          {/* Brand + newsletter */}
          <div className="max-w-sm">
            <Link
              href="/"
              className="relative flex h-12 w-44 items-center overflow-hidden"
            >
              <Image
                src="/codepro.png"
                alt="CodePro"
                width={200}
                height={200}
                className="max-w-none object-center brightness-150"
              />
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-slate-400">
              Nền tảng luyện tập lập trình, tham gia cuộc thi và trao đổi kiến
              thức cùng cộng đồng lập trình viên Việt Nam.
            </p>

            <form
              className="mt-6 flex items-center gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                required
                placeholder="Nhập email của bạn"
                className="w-full rounded-lg border border-blue-800 bg-blue-900/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <button
                type="submit"
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/30"
              >
                <Send size={15} />
                Đăng ký
              </button>
            </form>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-12 lg:gap-20">
            {/* Product */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-white">
                Sản phẩm
              </h3>
              <ul className="mt-4 space-y-3">
                {productLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-400 transition-colors hover:text-blue-300"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-white">
                Công ty
              </h3>
              <ul className="mt-4 space-y-3">
                {companyLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-400 transition-colors hover:text-blue-300"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-white">
                Hỗ trợ
              </h3>
              <ul className="mt-4 space-y-3">
                {supportLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-400 transition-colors hover:text-blue-300"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact row */}
        <div className="mt-12 flex flex-col gap-4 border-t border-blue-900/60 pt-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            <span className="flex items-center gap-2">
              <Mail size={15} className="text-blue-400" />
              support@codepro.vn
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={15} className="text-blue-400" />
              Hà Nội, Việt Nam
            </span>
          </div>

          <div className="flex items-center gap-2">
            {socials.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-800 bg-blue-900/40 text-slate-400 transition-all hover:-translate-y-0.5 hover:border-blue-500/50 hover:bg-blue-500/15 hover:text-blue-300"
                >
                  <Icon size={17} />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-blue-900/60 bg-blue-950/80">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} CodePro. Bản quyền đã được bảo hộ.</p>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="transition-colors hover:text-blue-300">
              Điều khoản
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-blue-300"
            >
              Bảo mật
            </Link>
            <Link
              href="/cookies"
              className="transition-colors hover:text-blue-300"
            >
              Cookie
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
