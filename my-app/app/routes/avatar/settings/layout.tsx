"use client";

import UserSidebar from "@/src/Component/UserSidebar/UserSidebar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", width: "100%" }}>
      <div style={{ width: "260px" }}>
        <UserSidebar />
      </div>

      <div style={{ flex: 1, padding: "20px" }}>{children}</div>
    </div>
  );
}
