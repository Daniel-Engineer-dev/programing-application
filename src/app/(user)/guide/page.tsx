"use client";

import PageTransition from "@/components/transitions/pageTransition";
import { BookOpen, UserPlus, FileCode2, PlayCircle, MessageSquareCode, Lightbulb, Sparkles, Terminal } from "lucide-react";

export default function GuidePage() {
  const steps = [
    {
      icon: UserPlus,
      step: "Bước 1",
      title: "Khởi tạo tài khoản",
      description: "Đăng nhập nhanh chóng thông qua tài khoản Google. Hoàn thiện thông tin cá nhân và cài đặt avatar để định danh trong cộng đồng.",
    },
    {
      icon: FileCode2,
      step: "Bước 2",
      title: "Lựa chọn bài tập",
      description: "Truy cập danh mục bài tập, lọc theo độ khó (Dễ, Trung bình, Khó) hoặc theo các thuật toán cụ thể như Quy hoạch động, Đồ thị, Tree...",
    },
    {
      icon: PlayCircle,
      step: "Bước 3",
      title: "Giải bài & Nộp bài",
      description: "Sử dụng IDE tích hợp để viết code trực tiếp, chọn ngôn ngữ mong muốn (C++, Python...), chạy thử (Run Code) trước khi nộp bài chính thức (Submit).",
    },
    {
      icon: MessageSquareCode,
      step: "Bước 4",
      title: "Thảo luận & Tối ưu",
      description: "Xem các giải pháp tối ưu của cộng đồng tại tab Thảo Luận, chia sẻ code của mình hoặc sử dụng Trợ lý AI CodePro để tìm lỗi sai.",
    },
  ];

  const tips = [
    {
      icon: Sparkles,
      title: "Sử dụng trợ lý AI hiệu quả",
      description: "Khi gặp lỗi WA (Wrong Answer) hay TLE, hãy nhấp vào nút 'Hỏi AI' trong IDE. AI sẽ phân tích thuật toán và đưa ra gợi ý sửa lỗi mà không tiết lộ trực tiếp toàn bộ code.",
    },
    {
      icon: Lightbulb,
      title: "Luyện tập theo lộ trình",
      description: "Thay vì giải ngẫu nhiên, hãy vào phần 'Khám phá' để học theo các lộ trình được sắp xếp từ cơ bản (Cú pháp cơ bản, Đệ quy) đến nâng cao.",
    },
    {
      icon: Terminal,
      title: "Tận dụng Phím tắt trong IDE",
      description: "Sử dụng phím tắt Ctrl+Enter để chạy thử code nhanh, Ctrl+/ để đóng mở ghi chú, giúp bạn tăng tốc độ giải bài trong các cuộc thi thực tế.",
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-20">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium">
              <BookOpen size={16} />
              <span>Hướng Dẫn</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              Hướng Dẫn Sử Dụng CodePro
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Làm quen nhanh chóng với các tính năng cốt lõi để nâng cao hiệu suất học tập và rèn luyện tư duy lập trình mỗi ngày.
            </p>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-12">
            <h2 className="text-3xl font-bold text-center text-white">Lộ Trình Bắt Đầu Nhanh</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div
                    key={idx}
                    className="relative p-6 rounded-xl border border-slate-800 bg-slate-900/30 space-y-4 hover:border-blue-500/20 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{s.step}</span>
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                          <Icon size={20} />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-white">{s.title}</h3>
                      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{s.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pro Tips Section */}
          <div className="space-y-12 bg-slate-900/10 border border-slate-800/80 rounded-2xl p-8 sm:p-10">
            <h2 className="text-3xl font-bold text-center text-white">Mẹo Luyện Code Đỉnh Cao</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
              {tips.map((t, idx) => {
                const Icon = t.icon;
                return (
                  <div key={idx} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                        <Icon size={20} />
                      </div>
                      <h3 className="text-lg font-bold text-white">{t.title}</h3>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{t.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
