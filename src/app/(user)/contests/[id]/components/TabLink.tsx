import React from "react";
import Link from "next/link";

interface TabLinkProps {
  href: string;
  active: boolean;
  label: string;
  icon: React.ReactNode;
}

export default function TabLink({ href, active, label, icon }: TabLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 ${
        active
          ? "text-blue-500 border-blue-500"
          : "text-slate-400 border-transparent hover:text-slate-200"
      }`}
    >
      {icon} {label}
    </Link>
  );
}
