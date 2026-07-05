"use client";

import PageTransition from "@/components/transitions/pageTransition";
import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "account" | "learning" | "payment";
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  const categories = [
    { value: "all", label: "Tất Cả" },
    { value: "account", label: "Tài Khoản" },
    { value: "learning", label: "Học Tập & Luyện Code" },
    { value: "payment", label: "Thanh Toán & Nâng Cấp" },
  ];

  const faqs: FAQItem[] = [
    {
      id: "1",
      category: "account",
      question: "Làm thế nào để tạo tài khoản trên CodePro?",
      answer: "Bạn chỉ cần nhấp vào nút 'Đăng ký' ở thanh điều hướng trên cùng, sau đó đăng ký bằng tài khoản Google một cách nhanh chóng hoặc sử dụng email và mật khẩu của mình.",
    },
    {
      id: "2",
      category: "learning",
      question: "Trình biên dịch của CodePro hỗ trợ những ngôn ngữ lập trình nào?",
      answer: "Hiện tại, CodePro hỗ trợ biên dịch trực tiếp 4 ngôn ngữ phổ biến nhất trong lập trình thi đấu và phỏng vấn: C++, Java, Python 3 và JavaScript.",
    },
    {
      id: "3",
      category: "learning",
      question: "Làm sao để biết code của tôi chạy đúng hay sai?",
      answer: "Khi bạn bấm 'Nộp bài', hệ thống sẽ chạy code của bạn qua bộ Testcase chuẩn được ẩn sẵn. Bạn sẽ nhận được các trạng thái tương tự chuẩn LeetCode như AC (Accepted), WA (Wrong Answer), TLE (Time Limit Exceeded), hoặc MLE (Memory Limit Exceeded).",
    },
    {
      id: "4",
      category: "payment",
      question: "Gói thành viên PRO của CodePro có thời hạn bao lâu?",
      answer: "Chúng tôi cung cấp hai lựa chọn nâng cấp: Gói Tháng (30 ngày) và Gói Năm (365 ngày) với quyền lợi truy cập toàn bộ kho bài giải mẫu chi tiết cùng tính năng sửa lỗi bằng Trợ lý AI.",
    },
    {
      id: "5",
      category: "account",
      question: "Tôi có thể thay đổi tên người dùng (username) không?",
      answer: "Có, bạn hoàn toàn có thể thay đổi tên người dùng và hình đại diện của mình bất cứ lúc nào trong trang cài đặt Hồ sơ cá nhân của mình.",
    },
    {
      id: "6",
      category: "payment",
      question: "Hệ thống hỗ trợ những phương thức thanh toán nào?",
      answer: "CodePro hỗ trợ thanh toán trực tuyến bảo mật thông qua ví Momo, chuyển khoản ngân hàng quét mã VietQR tự động xác nhận trong vòng 1-2 phút.",
    },
  ];

  const toggleFAQ = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium">
              <HelpCircle size={16} />
              <span>Giải Đáp</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Câu Hỏi Thường Gặp
            </h1>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">
              Tìm kiếm lời giải đáp nhanh chóng cho những vấn đề thường gặp khi sử dụng nền tảng học CodePro.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="space-y-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Nhập từ khóa tìm kiếm câu hỏi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm sm:text-base text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    selectedCategory === cat.value
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Accordion List */}
          {filteredFaqs.length > 0 ? (
            <div className="space-y-4">
              {filteredFaqs.map((faq) => {
                const isOpen = !!openIds[faq.id];
                return (
                  <div
                    key={faq.id}
                    className="border border-slate-800 bg-slate-900/20 rounded-xl overflow-hidden transition-all duration-200"
                  >
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full flex items-center justify-between p-5 text-left font-bold text-sm sm:text-base text-white hover:bg-slate-900/40 transition-colors"
                    >
                      <span className="pr-4">{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp size={18} className="text-blue-400 shrink-0" />
                      ) : (
                        <ChevronDown size={18} className="text-slate-400 shrink-0" />
                      )}
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                        >
                          <div className="p-5 pt-0 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/40">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              Không tìm thấy câu hỏi nào phù hợp với từ khóa của bạn.
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
}
