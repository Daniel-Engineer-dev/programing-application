"use client";

import UserSidebar from "@/src/Component/UserSidebar/UserSidebar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full min-h-screen bg-slate-950 text-white">
      {/* SIDEBAR TRÁI */}
      <div className="w-[260px] bg-slate-800 border-r border-slate-700">
        <UserSidebar />
      </div>

      {/* NỘI DUNG BÊN PHẢI */}
      <div className="flex-1 p-8 bg-slate-950">{children}</div>
    </div>
  );
}
