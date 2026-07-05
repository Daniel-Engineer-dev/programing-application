"use client";

import PageTransition from "@/components/transitions/pageTransition";
import { FileText, ShieldAlert, Calendar } from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      title: "1. Chấp thuận điều khoản",
      content:
        "Bằng việc truy cập, đăng ký và sử dụng dịch vụ trên nền tảng CodePro, bạn đồng ý tuân thủ tất cả các điều khoản và điều kiện được nêu tại đây. Nếu bạn không đồng ý với bất kỳ phần nào của điều khoản này, vui lòng ngừng sử dụng dịch vụ ngay lập tức.",
    },
    {
      title: "2. Quyền sở hữu trí tuệ",
      content:
        "Tất cả nội dung bao gồm hệ thống đề bài, lời giải mẫu, tài liệu học tập, mã nguồn, đồ họa, logo, và các thành phần giao diện trên CodePro đều thuộc quyền sở hữu trí tuệ độc quyền của CodePro hoặc được cấp phép hợp pháp. Người dùng không được phép sao chép, phân phối hoặc tái xuất bản thương mại khi chưa được sự đồng ý bằng văn bản từ chúng tôi.",
    },
    {
      title: "3. Quy định sử dụng tài khoản",
      content:
        "Bạn chịu trách nhiệm bảo mật thông tin đăng nhập cá nhân (đặc biệt là tài khoản Google liên kết). Bạn không được phép chia sẻ quyền sử dụng tài khoản cho người khác. Mọi hành vi gian lận testcase, tấn công từ chối dịch vụ (DDoS) lên hệ thống chấm bài trực tuyến, hoặc sử dụng công cụ tự động (bot) gửi bài liên tục sẽ bị khóa tài khoản vĩnh viễn mà không cần báo trước.",
    },
    {
      title: "4. Dịch vụ PRO và Thanh toán",
      content:
        "CodePro cung cấp gói dịch vụ nâng cấp (PRO) với các tính năng chuyên sâu như giải bài mẫu nâng cao, đánh giá độ phức tạp code tự động bằng AI. Mọi giao dịch thanh toán gói PRO đều là tự nguyện, bảo mật qua ví điện tử và cổng ngân hàng liên kết. Các gói dịch vụ đã mua không được hỗ trợ hoàn tiền, trừ trường hợp lỗi hệ thống phát sinh từ phía CodePro kéo dài quá 48 giờ liên tục.",
    },
    {
      title: "5. Giới hạn trách nhiệm",
      content:
        "Chúng tôi nỗ lực tối đa để đảm bảo hệ thống chấm bài và biên dịch hoạt động liên tục 24/7. Tuy nhiên, CodePro không chịu trách nhiệm đối với bất kỳ sự gián đoạn dịch vụ tạm thời nào do sự cố kỹ thuật ngoài tầm kiểm soát hoặc các nhà cung cấp hạ tầng đám mây thứ ba. Các đề bài thuật toán trên CodePro mang tính chất tham khảo học tập, chúng tôi không cam kết kết quả học tập tuyệt đối hay đảm bảo đỗ phỏng vấn tại các doanh nghiệp đối tác.",
    },
    {
      title: "6. Thay đổi điều khoản dịch vụ",
      content:
        "CodePro có quyền cập nhật, sửa đổi nội dung điều khoản này vào bất kỳ lúc nào để phù hợp với quy định pháp luật và các tính năng mới của hệ thống. Ngày cập nhật mới nhất sẽ được ghi rõ ở phần đầu trang. Việc bạn tiếp tục sử dụng nền tảng sau khi điều khoản được cập nhật đồng nghĩa với việc bạn chấp thuận các thay đổi đó.",
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4 border-b border-slate-800 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium">
              <FileText size={16} />
              <span>Pháp Lý</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Điều Khoản Dịch Vụ
            </h1>
            <div className="flex items-center justify-center gap-4 text-xs sm:text-sm text-slate-500 pt-2">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                Cập nhật lần cuối: 05/07/2026
              </span>
              <span className="flex items-center gap-1">
                <ShieldAlert size={14} />
                Phiên bản 1.2
              </span>
            </div>
          </div>

          {/* Terms Content List */}
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

          {/* Contact footer inside terms */}
          <div className="text-center text-xs sm:text-sm text-slate-500 pt-4">
            Mọi câu hỏi hoặc khiếu nại liên quan đến điều khoản dịch vụ này, vui lòng liên hệ bộ phận hỗ trợ qua email{" "}
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
