"use client";

import { ReactLenis } from "lenis/react";
import { usePathname } from "next/navigation";

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  if (isHomepage) {
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
