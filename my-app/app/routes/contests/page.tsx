import React from "react";
import { Bell, Clock, Calendar, Users, ChevronRight } from "lucide-react";
import Link from "next/link";
import PageTransition from "@/src/pageTransition/pageTransition";

export default function ContestPage() {
  // Dữ liệu giả lập các cuộc thi (giống trong ảnh)
  const contests = [
    {
      id: 1,
      title: "Cuộc thi hàng tuần #135",
      status: "live", // Trạng thái: đang diễn ra
      timeText: "Kết thúc trong 2h 15m",
      participants: "2,458",
      buttonText: "Tham gia cuộc thi",
    },
    {
      id: 2,
      title: "Code Pro hai tuần một lần #42",
      status: "upcoming", // Trạng thái: sắp tới
      timeText: "Bắt đầu: 25 tháng 5, 10:00 PM UTC",
      participants: "982",
      buttonText: "Đăng ký ngay",
    },
    {
      id: 3,
      title: "Thử thách Cấu trúc Dữ liệu",
      status: "upcoming",
      timeText: "Bắt đầu: 1 tháng 6, 02:00 PM UTC",
      participants: "471",
      buttonText: "Đăng ký ngay",
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-900 font-sans text-slate-300">
        <main className="mx-auto max-w-5xl px-6 py-16">
          {/* --- 2. Hero Section --- */}
          <div className="text-center mb-16">
            <h1 className="text-3xl font-bold text-white md:text-4xl mb-4">
              Các cuộc thi Lập trình
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Kiểm tra kỹ năng của bạn, cạnh tranh với những người khác và giành
              những giải thưởng hấp dẫn trong các cuộc thi lập trình của chúng
              tôi.
            </p>
          </div>

          {/* --- 3. Tabs Navigation --- */}
          <div className="border-b border-slate-800 mb-8 flex gap-8">
            <button className="pb-3 text-sm font-medium text-blue-500 border-b-2 border-blue-500">
              Sắp diễn ra & Trực tiếp
            </button>
            <button className="pb-3 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors">
              Cuộc thi đã qua
            </button>
          </div>

          {/* --- 4. Contest List --- */}
          <div className="space-y-6">
            {contests.map((contest) => (
              <div
                key={contest.id}
                className="rounded-xl bg-slate-800 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm border border-transparent hover:border-slate-700 transition-all"
              >
                {/* Thông tin cuộc thi (Bên trái) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {/* Chấm đỏ nhấp nháy nếu là Live */}
                    {contest.status === "live" && (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}

                    <h3 className="text-lg md:text-xl font-bold text-white">
                      {contest.title}
                    </h3>

                    {/* Badge "Trực tiếp" */}
                    {contest.status === "live" && (
                      <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-500 border border-red-500/20">
                        Trực tiếp
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      {contest.status === "live" ? (
                        <Clock size={16} />
                      ) : (
                        <Calendar size={16} />
                      )}
                      <span>{contest.timeText}</span>
                    </div>
                    <div className="hidden sm:block text-slate-600">|</div>
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      <span>
                        {contest.participants}{" "}
                        {contest.status === "live"
                          ? "người tham gia"
                          : "người đã đăng ký"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nút hành động (Bên phải) */}
                <div>
                  {contest.status === "live" ? (
                    <button className="w-full md:w-auto rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                      {contest.buttonText}
                    </button>
                  ) : (
                    <button className="w-full md:w-auto rounded-lg bg-slate-700 px-6 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-600 hover:text-white transition-colors">
                      {contest.buttonText}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Footer (Giản lược) */}
        <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
          © 2024 Code Pro. Đã đăng ký Bản quyền.
        </footer>
      </div>
    </PageTransition>
  );
}
