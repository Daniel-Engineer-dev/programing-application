"use client";

import { motion } from "framer-motion";
import { Gem, Award, Rocket, CheckCircle2, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function PointsPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden flex items-center justify-center">
      {/* Các đốm sáng nền (Blur Orbs) - Không cần config Tailwind vẫn chạy được */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-4xl px-6 text-center"
      >
        {/* Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Coming Soon
        </motion.div>

        {/* Icon chính */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto w-24 h-24 bg-linear-to-br from-blue-500 to-purple-600 rounded-3xl rotate-12 flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-8"
        >
          <Gem size={48} className="text-white -rotate-12" />
        </motion.div>

        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter">
          Tích lũy điểm <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-500">
            Xây dựng sự nghiệp
          </span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
          Tính năng cộng điểm đang được hoàn thiện. Bạn sẽ sớm có thể đổi điểm
          lấy các huy hiệu hiếm và thăng hạng trên bảng tổng sắp toàn cầu.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            {
              icon: <CheckCircle2 />,
              title: "Nhiệm vụ",
              desc: "Giải bài tập nhận point",
            },
            { icon: <Award />, title: "Huy hiệu", desc: "Chứng nhận năng lực" },
            {
              icon: <Rocket />,
              title: "Thăng hạng",
              desc: "Đua top cùng bạn bè",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="text-blue-500 mb-3 flex justify-center">
                {item.icon}
              </div>
              <h3 className="text-white font-bold mb-1">{item.title}</h3>
              <p className="text-slate-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> Quay về trang chủ
        </Link>
      </motion.div>
    </div>
  );
}
