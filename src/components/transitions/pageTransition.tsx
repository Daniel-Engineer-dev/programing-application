"use client";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [displayedPath, setDisplayedPath] = useState(pathname);
  const [isAnimating, setIsAnimating] = useState(false);

  // Nếu pathname thay đổi → bắt đầu animation
  useEffect(() => {
    if (pathname !== displayedPath) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setDisplayedPath(pathname); // chỉ render trang mới sau khi animation cũ kết thúc
        setIsAnimating(false);
      }, 400); // thời gian khớp với duration bên dưới

      return () => clearTimeout(timeout);
    }
  }, [pathname, displayedPath]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={displayedPath}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className={`absolute w-full ${
          isAnimating ? "pointer-events-none" : ""
        }`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
