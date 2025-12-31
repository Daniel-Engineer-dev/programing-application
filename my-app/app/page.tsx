// app/page.tsx
"use client";
import PageTransition from "@/src/pageTransition/pageTransition";
import Link from "next/link";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { useState } from "react";
import Image from "next/image";
export default function HomePage() {
  const { user } = useAuthContext();
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const problems = [
    {
      id: 1,
      title: "AI ảnh hưởng đến thị trường IT như thế nào?",
      description:
        "Trong một buổi phỏng vấn trực tuyến trên nền tảng X vào tháng một, tỷ phú công nghệ Elon Musk đã chia sẻ rằng Trí tuệ nhân tạo (AI) đã học tất cả những kiến thức do nhân loại tạo ra...",
      url: "https://vnexpress.net/ai-anh-huong-the-nao-den-thi-truong-tuyen-dung-it-4867758.html", // Link thật
    },
    {
      id: 2,
      title: "Cơ hội kết nối nhân lực IT ngành tài chính ngân hàng",
      description:
        "Nền tảng tuyển dụng ITviec.com ra mắt chuyên trang việc làm IT ngành tài chính - ngân hàng, mở ra cơ hội kết nối nguồn nhân lực, hôm 18/6...",
      url: "https://vnexpress.net/co-hoi-ket-noi-nhan-luc-it-nganh-tai-chinh-ngan-hang-4756867.html", // Link thật
    },
    {
      id: 3,
      title: "Cơ hội săn nhân sự IT trẻ cho doanh nghiệp",
      description:
        'Trường Đại học Công nghệ TP HCM (HUTECH) tổ chức chuỗi "Ngày hội Tuyển dụng và Triển lãm Công nghệ thông tin" trong tháng 3...',
      url: "https://vnexpress.net/co-hoi-san-nhan-su-it-tre-cho-doanh-nghiep-4713739.html", // Link thật
    },
  ];
  const companies = [
    {
      name: "Meta",
      logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg",
      color: "group-hover:border-blue-500/50",
    },
    {
      name: "Apple",
      logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
      color: "group-hover:border-white/50",
    },
    {
      name: "Amazon",
      logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
      color: "group-hover:border-orange-500/50",
    },
    {
      name: "Netflix",
      logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
      color: "group-hover:border-red-600/50",
    },
    {
      name: "Google",
      // Sử dụng link logo Google đầy đủ màu sắc
      logo: "https://www.gstatic.com/images/branding/googlelogo/svg/googlelogo_clr_74x24px.svg",
      color: "group-hover:border-green-500/50",
    },
  ];
  return (
    <PageTransition>
      {/* Hero Section */}
      <section className="mt-8 mx-50">
        {/* Card Container */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-8 md:p-12 shadow-xl">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            {/* CỘT TRÁI: Nội dung chính */}
            <div className="space-y-6">
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl leading-tight">
                Luyện thuật toán mỗi ngày với{" "}
                <span className="text-blue-500">Code Pro</span>
              </h1>
              <p className="text-lg text-slate-400 max-w-lg">
                Hơn 1000+ bài tập từ dễ đến khó. Theo dõi tiến độ, làm thử, nộp
                bài, xem giải mẫu.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                {/* Nút Bắt đầu */}
                <Link
                  href={user ? "/routes/problems" : "/routes/auth/login"}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                  Bắt đầu ngay
                </Link>

                {/* Nút Tài liệu (Sửa hover cho hợp Dark mode) */}
                <Link
                  href="/"
                  className="rounded-lg border border-slate-600 px-6 py-3 font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  Tài liệu
                </Link>
              </div>
            </div>

            {/* CỘT PHẢI: Thông tin nổi bật (Thay thế ảnh cũ) */}
            <div className="flex flex-col gap-6 md:pl-10 justify-center">
              {/* Dòng text cam nổi bật */}
              <div className="space-y-4">
                <p className="text-sm font-bold uppercase tracking-wider text-orange-400">
                  The Most Effective Way to Get Into
                </p>

                {/* Danh sách Logo (Phiên bản màu sắc & hiệu ứng mới) */}
                <div className="flex flex-wrap gap-4">
                  {companies.map((company, index) => (
                    <div
                      key={index}
                      className={`flex h-12 w-20 items-center justify-center rounded-xl bg-white p-2.5 
      border border-transparent transition-all duration-300 
      hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] 
      group cursor-pointer ${company.color}`}
                      title={company.name}
                    >
                      <div className="relative h-full w-full">
                        <Image
                          src={company.logo}
                          alt={company.name}
                          fill
                          // Bỏ grayscale để hiện màu gốc, object-contain để không bị méo ảnh
                          className="object-contain transition-transform duration-300"
                          unoptimized // Thêm thuộc tính này nếu bạn dùng link SVG trực tiếp từ bên ngoài để tránh lỗi render
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thống kê phụ (Optional - để lấp đầy không gian nếu cần) */}
              <div className="mt-4 flex gap-8 border-t border-slate-700 pt-6">
                <div>
                  <p className="text-2xl font-bold text-white">1000+</p>
                  <p className="text-sm text-slate-500">Bài tập</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">50K+</p>
                  <p className="text-sm text-slate-500">Người dùng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          {/* --- Phần Tiêu đề --- */}
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Thông tin nổi bật
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Những thông tin thú vị trong tuần qua
            </p>
          </div>

          {/* --- Phần Danh sách thẻ (Grid) --- */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {problems.map((problem) => (
              <a
                key={problem.id}
                href={problem.url} // Sử dụng link VnExpress đã thêm ở trên
                target="_blank" // Mở bài báo ở tab mới (khuyên dùng cho link ngoài)
                rel="noopener noreferrer" // Bảo mật khi mở tab mới
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-700 bg-slate-800 p-6 transition-all hover:border-slate-600 hover:bg-slate-750 hover:shadow-lg hover:shadow-blue-900/10 cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      {problem.title}
                    </h3>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-400 line-clamp-3">
                    {problem.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center text-sm font-medium text-blue-500 opacity-0 transition-opacity group-hover:opacity-100">
                  Đọc bài báo gốc
                  <span className="ml-1 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
