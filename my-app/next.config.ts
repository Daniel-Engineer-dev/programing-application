import type { NextConfig } from "next";

const nextConfig = {
  eslint: {
    // Bỏ qua lỗi ESLint hoàn toàn khi build project
    ignoreDuringBuilds: true,
  },
  // Các cấu hình khác của bạn...
} as NextConfig;

export default nextConfig;
