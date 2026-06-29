"use client";

import UserSidebar from "@/components/UserSidebar/UserSidebar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full min-h-screen bg-slate-950 text-white">
      {/* SIDEBAR TRÁI */}
      <div className="w-[260px] bg-slate-950 border-r border-slate-900 shrink-0">
        <UserSidebar />
      </div>

      {/* NỘI DUNG BÊN PHẢI */}
      <div className="flex-1 bg-slate-950 relative overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
