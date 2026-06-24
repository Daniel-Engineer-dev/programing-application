import type { NextConfig } from "next";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Cho phép ảnh từ Google
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com", // Cho phép ảnh từ GitHub
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org", // Nguồn chứa logo phổ biến
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // Cho phép ảnh từ Cloudinary
      },
    ],
  },
  // Các cấu hình khác của bạn...
} as NextConfig;

export default nextConfig;
