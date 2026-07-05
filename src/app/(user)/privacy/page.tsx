"use client";

import PageTransition from "@/components/transitions/pageTransition";
import { Shield, Eye, Calendar } from "lucide-react";

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. Thu thập thông tin cá nhân",
      content:
        "Khi bạn đăng ký tài khoản trên CodePro, chúng tôi thu thập các thông tin cơ bản bao gồm: Tên hiển thị (username), Địa chỉ Email, Ảnh đại diện, và Lịch sử nộp bài tập của bạn. Các thông tin này được thu thập trực tiếp qua cổng xác thực Google OAuth hoặc do bạn cung cấp trong hồ sơ cá nhân. Chúng tôi hoàn toàn không lưu trữ mật khẩu của bạn nếu bạn đăng nhập thông qua bên thứ ba.",
    },
    {
      title: "2. Cách thức sử dụng thông tin",
      content:
        "Chúng tôi sử dụng dữ liệu thu thập được cho các mục đích hợp pháp sau: Quản lý và xác thực tài khoản đăng nhập; Hiển thị tên và thứ hạng của bạn trên Bảng xếp hạng cộng đồng (Leaderboard); Lưu trữ tiến độ giải bài tập để hiển thị lịch sử học tập; Gửi email thông báo về các cuộc thi giải thuật mới hoặc thay đổi quan trọng trên hệ thống; Nâng cao chất lượng dịch vụ và cá nhân hóa trải nghiệm học tập của bạn.",
    },
    {
      title: "3. Bảo mật và lưu trữ dữ liệu",
      content:
        "Dữ liệu của bạn được lưu trữ an toàn bằng dịch vụ cơ sở dữ liệu đám mây Firebase (thuộc hạ tầng Google Cloud) có phân quyền bảo mật chặt chẽ. Chúng tôi áp dụng các biện pháp mã hóa SSL/TLS khi truyền dữ liệu. Chỉ những kỹ sư vận hành hệ thống được chỉ định mới có quyền truy cập dữ liệu để xử lý kỹ thuật. Dữ liệu của bạn sẽ được lưu giữ cho đến khi tài khoản bị xóa hoặc khi bạn gửi yêu cầu xóa dữ liệu chính thức.",
    },
    {
      title: "4. Chia sẻ thông tin với bên thứ ba",
      content:
        "CodePro cam kết tuyệt đối không bán, trao đổi hoặc cho thuê thông tin cá nhân của bạn cho bên thứ ba vì mục đích tiếp thị thương mại. Thông tin về lịch sử giải bài và trình độ kỹ thuật chỉ được chia sẻ cho các nhà tuyển dụng đối tác khi bạn bật tính năng 'Tìm việc' trong hồ sơ cá nhân và chủ động chọn gửi CV của mình.",
    },
    {
      title: "5. Quyền lợi của bạn đối với dữ liệu cá nhân",
      content:
        "Bạn có toàn quyền truy cập, chỉnh sửa hoặc cập nhật các thông tin cá nhân của mình trong trang Hồ sơ cá nhân. Bạn cũng có quyền yêu cầu chúng tôi xóa hoàn toàn tài khoản và dữ liệu liên quan khỏi hệ thống bằng cách gửi email trực tiếp tới bộ phận hỗ trợ kỹ thuật support@codepro.vn.",
    },
    {
      title: "6. Liên hệ và giải quyết khiếu nại",
      content:
        "Nếu bạn có bất kỳ thắc mắc hoặc khiếu nại nào liên quan đến cách thức xử lý dữ liệu và chính sách bảo mật của CodePro, vui lòng liên hệ với Đại diện bảo mật thông tin của chúng tôi qua địa chỉ email support@codepro.vn để được hỗ trợ giải quyết thỏa đáng trong vòng 3 ngày làm việc.",
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4 border-b border-slate-800 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium">
              <Shield size={16} />
              <span>Bảo Mật</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Chính Sách Bảo Mật
            </h1>
            <div className="flex items-center justify-center gap-4 text-xs sm:text-sm text-slate-500 pt-2">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                Cập nhật lần cuối: 05/07/2026
              </span>
              <span className="flex items-center gap-1">
                <Eye size={14} />
                Công khai
              </span>
            </div>
          </div>

          {/* Privacy Content List */}
          <div className="space-y-8 bg-slate-900/10 border border-slate-800/60 rounded-2xl p-6 sm:p-10">
            {sections.map((section, idx) => (
              <div key={idx} className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {section.title}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed text-justify">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* Contact footer inside privacy */}
          <div className="text-center text-xs sm:text-sm text-slate-500 pt-4">
            Chúng tôi luôn coi trọng việc bảo vệ quyền riêng tư của bạn. Mọi đóng góp ý kiến vui lòng gửi về hòm thư điện tử{" "}
            <a href="mailto:support@codepro.vn" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              support@codepro.vn
            </a>
            .
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
