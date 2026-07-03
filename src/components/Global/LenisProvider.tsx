"use client";

import { ReactLenis } from "lenis/react";
import { usePathname } from "next/navigation";

// Các trang dạng "workspace" giải bài dùng layout IDE toàn màn hình (position: fixed,
// không cuộn ở cấp document, chỉ cuộn trong các panel con). Lenis root sẽ chiếm wheel
// event và khiến các panel con không cuộn được → tắt Lenis trên các trang này.
const isWorkspaceRoute = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "problems" && segments.length >= 2) return true; // /problems/<slug>
  if (segments[0] === "contests" && segments.length >= 3) return true; // /contests/<id>/<problemId>
  return false;
};

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  // Không dùng smooth-scroll toàn cục ở trang chủ và các trang giải bài (IDE)
  if (isHomepage || isWorkspaceRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <ReactLenis 
      root 
      options={{ 
        duration: 1.2, 
        lerp: 0.1, 
        smoothWheel: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}
