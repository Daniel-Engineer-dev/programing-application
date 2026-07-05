"use client";

import PageTransition from "@/components/transitions/pageTransition";
import { Briefcase, MapPin, Clock, DollarSign, Laptop, Heart, GraduationCap, Plane, Mail } from "lucide-react";
import Link from "next/link";

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  description: string;
}

export const sampleJobs: Job[] = [
  {
    id: "1",
    title: "Senior Fullstack Engineer (Next.js & Node.js)",
    department: "Kỹ thuật",
    location: "TP. Hồ Chí Minh / Hybrid",
    type: "Toàn thời gian",
    salary: "Thỏa thuận (2,000$ - 3,500$)",
    description: "Chịu trách nhiệm thiết kế, tối ưu hệ thống biên dịch mã nguồn trực tiếp (Online Judge), cải tiến cấu trúc front-end Next.js 16 và xây dựng các API mở rộng.",
  },
  {
    id: "2",
    title: "AI Engineer (NLP & LLMs)",
    department: "Nghiên cứu & Phát triển",
    location: "Từ xa / Remote",
    type: "Toàn thời gian",
    salary: "Thỏa thuận",
    description: "Nghiên cứu tích hợp các mô hình ngôn ngữ lớn (LLM) để xây dựng hệ thống gợi ý giải thuật tự động, chatbot hỗ trợ sửa lỗi code cho học viên theo thời gian thực.",
  },
  {
    id: "3",
    title: "Technical Content Writer (Algorithms)",
    department: "Nội dung",
    location: "Từ xa / Remote",
    type: "Bán thời gian",
    salary: "Theo bài viết / Thỏa thuận",
    description: "Biên soạn các đề bài thuật toán chất lượng cao, viết lời giải mẫu chi tiết (bằng C++, Java, Python) và thiết kế sơ đồ trực quan giải thích thuật toán.",
  },
];

export default function CareersPage() {
  const benefits = [
    {
      icon: Laptop,
      title: "Trang thiết bị hiện đại",
      description: "Cung cấp MacBook Pro / Dell XPS đời mới cùng màn hình 4K hỗ trợ tối đa hiệu suất làm việc.",
    },
    {
      icon: Heart,
      title: "Chăm sóc sức khỏe",
      description: "Gói bảo hiểm sức khỏe cao cấp (PVI) cùng chế độ khám sức khỏe định kỳ hàng năm.",
    },
    {
      icon: GraduationCap,
      title: "Đào tạo liên tục",
      description: "Trợ cấp 100% học phí các khóa học trực tuyến (Udemy, Coursera) và sách kỹ thuật chuyên ngành.",
    },
    {
      icon: Plane,
      title: "Du lịch & Team building",
      description: "Du lịch công ty tối thiểu 2 lần/năm, các buổi liên hoan, teambuilding định kỳ hàng tháng.",
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-20">
          
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium">
              <Briefcase size={16} />
              <span>Tuyển Dụng</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-400 bg-clip-text text-transparent">
              Gia Nhập Đội Ngũ CodePro
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Chúng tôi luôn tìm kiếm những kỹ sư tài năng, những con người đam mê giáo dục tin học để cùng kiến tạo nên nền tảng học thuật toán tốt nhất cho hàng triệu lập trình viên Việt Nam.
            </p>
          </div>

          {/* Benefits Section */}
          <div className="space-y-12">
            <h2 className="text-3xl font-bold text-center text-white">Chế Độ Đãi Ngộ & Phúc Lợi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3 hover:border-blue-500/20 transition-all"
                  >
                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 w-fit">
                      <Icon size={22} />
                    </div>
                    <h3 className="text-lg font-bold text-white">{benefit.title}</h3>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Openings Section */}
          <div className="space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-white">Vị Trí Đang Tuyển Dụng</h2>
              <p className="text-slate-400 text-sm sm:text-base">Tìm kiếm cơ hội phù hợp và ứng tuyển ngay hôm nay</p>
            </div>

            <div className="space-y-6">
              {sampleJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-6 sm:p-8 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-4 max-w-3xl">
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full">
                        {job.department}
                      </span>
                      <h3 className="text-xl font-bold text-white">{job.title}</h3>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{job.description}</p>
                    
                    {/* Job Details Meta */}
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} className="text-slate-400" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} className="text-slate-400" />
                        {job.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign size={14} className="text-slate-400" />
                        {job.salary}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
                    <Link
                      href={`/careers/${job.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition-all text-center"
                    >
                      Xem chi tiết JD
                    </Link>
                    <Link
                      href={`/careers/${job.id}#apply`}
                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition-all hover:bg-blue-500 hover:-translate-y-0.5 text-center"
                    >
                      Ứng tuyển ngay
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* General Application Section */}
          <div className="rounded-2xl border border-blue-900/60 bg-gradient-to-r from-blue-900/20 to-slate-900/30 p-8 sm:p-10 text-center space-y-6">
            <div className="mx-auto p-4 rounded-full bg-blue-500/10 text-blue-400 w-fit">
              <Mail size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Chưa tìm thấy vị trí phù hợp?</h2>
              <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
                Đừng ngần ngại gửi CV của bạn và chia sẻ về dự định công việc mong muốn. Chúng tôi luôn sẵn sàng lắng nghe từ những nhân tài tiềm năng.
              </p>
            </div>
            <div>
              <a
                href="mailto:careers@codepro.vn?subject=Ứng tuyển tự do - Hồ sơ ứng viên"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-6 py-3 font-semibold text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
              >
                Gửi CV tới careers@codepro.vn
              </a>
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
