"use client";

import PageTransition from "@/components/transitions/pageTransition";
import { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle, AlertTriangle } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    // Giả lập gửi thông tin liên hệ trong 1.5 giây
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium">
              <MessageSquare size={16} />
              <span>Liên Hệ</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              Kết Nối Với Chúng Tôi
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Bạn có câu hỏi, ý kiến đóng góp hoặc cơ hội hợp tác? Hãy gửi lời nhắn cho đội ngũ CodePro ngay.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8">
            
            {/* Contact Form Section */}
            <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <h2 className="text-2xl font-bold text-white">Gửi tin nhắn liên hệ</h2>
              
              {status === "success" && (
                <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
                  <CheckCircle size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Gửi thành công!</span>
                    Cảm ơn bạn đã liên hệ. Đội ngũ CodePro sẽ phản hồi lại bạn qua email sớm nhất có thể.
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Lỗi hệ thống!</span>
                    Đã xảy ra lỗi trong quá trình gửi. Vui lòng thử lại sau hoặc gửi trực tiếp tới support@codepro.vn.
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-xs font-semibold text-slate-400">Họ và tên</label>
                    <input
                      required
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={status === "submitting"}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-xs font-semibold text-slate-400">Địa chỉ Email</label>
                    <input
                      required
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={status === "submitting"}
                      placeholder="example@domain.com"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-xs font-semibold text-slate-400">Tiêu đề tin nhắn</label>
                  <input
                    required
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    disabled={status === "submitting"}
                    placeholder="Hỏi về khóa học, tài khoản..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-xs font-semibold text-slate-400">Nội dung chi tiết</label>
                  <textarea
                    required
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    disabled={status === "submitting"}
                    placeholder="Nhập lời nhắn của bạn tại đây..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                >
                  {status === "submitting" ? (
                    <span>Đang gửi thông tin...</span>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Gửi tin nhắn</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Contact Info Section */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
                <h2 className="text-xl font-bold text-white">Thông tin liên lạc</h2>
                
                <div className="space-y-5">
                  <div className="flex gap-4 items-start">
                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                      <Mail size={18} />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block font-medium">Hỗ trợ Email</span>
                      <a href="mailto:support@codepro.vn" className="text-sm font-semibold text-slate-200 hover:text-blue-400 transition-colors">
                        support@codepro.vn
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                      <Phone size={18} />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block font-medium">Hotline hỗ trợ</span>
                      <span className="text-sm font-semibold text-slate-200">
                        +84 123 456 789
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block font-medium">Trụ sở chính</span>
                      <span className="text-sm font-semibold text-slate-200 leading-relaxed block">
                        Khu Công nghệ cao, Quận 9, TP. Hồ Chí Minh, Việt Nam
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-3">
                <h3 className="text-lg font-bold text-white">Thời gian làm việc</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  Đội ngũ chăm sóc khách hàng của chúng tôi hoạt động liên tục từ Thứ Hai đến Thứ Sáu, từ 8:00 đến 17:30. Các email nhận được ngoài giờ làm việc sẽ được xử lý vào ngày làm việc tiếp theo.
                </p>
              </div>

            </div>

          </div>

        </div>
      </div>
    </PageTransition>
  );
}
