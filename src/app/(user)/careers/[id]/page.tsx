"use client";

import { use, useState } from "react";
import PageTransition from "@/components/transitions/pageTransition";
import { sampleJobs } from "../page";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, DollarSign, Calendar, Send, CheckCircle, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

const jobDetails: Record<
  string,
  {
    responsibilities: string[];
    requirements: string[];
    benefits: string[];
  }
> = {
  "1": {
    responsibilities: [
      "Thiết kế, xây dựng và tối ưu hóa hệ thống biên dịch và chạy thử code trực tuyến (Online Judge) đảm bảo độ trễ thấp và an toàn bảo mật.",
      "Cải tiến cấu trúc front-end Next.js 16, tối ưu hóa các linh kiện giao diện để nâng cao điểm số Lighthouse (SEO, Performance).",
      "Thiết kế và phát triển RESTful APIs/GraphQL APIs bằng Node.js (NestJS/Express) phục vụ lượng request lớn từ phía người dùng.",
      "Tối ưu hóa cơ sở dữ liệu Firestore/PostgreSQL, thiết lập các chỉ mục và cơ chế lưu trữ đệm (caching) bằng Redis.",
    ],
    requirements: [
      "Tối thiểu 3 năm kinh nghiệm lập trình Fullstack sử dụng React/Next.js và Node.js.",
      "Hiểu biết sâu sắc về kiến trúc ứng dụng web, cơ chế SSR, SSG, ISR của Next.js.",
      "Có kinh nghiệm làm việc với các hệ thống Realtime, WebSockets hoặc xử lý hàng đợi (Queue - BullMQ/RabbitMQ).",
      "Tư duy thuật toán tốt, nắm vững các cấu trúc dữ liệu và giải thuật cơ bản.",
    ],
    benefits: [
      "Mức lương cứng cạnh tranh từ 2,000$ - 3,500$ (tùy năng lực).",
      "Làm việc theo mô hình Hybrid (2 ngày remote/tuần), 12 ngày phép năm và các ngày nghỉ lễ theo quy định.",
      "Lương tháng 13 cùng thưởng kết quả kinh doanh cuối năm hấp dẫn.",
      "Môi trường khởi nghiệp trẻ trung, năng động, thúc đẩy sự sáng tạo cá nhân.",
    ],
  },
  "2": {
    responsibilities: [
      "Nghiên cứu, thử nghiệm và tích hợp các mô hình ngôn ngữ lớn (OpenAI GPT, Google Gemini, Anthropic Claude) vào hệ sinh thái CodePro.",
      "Xây dựng tính năng chấm điểm và gợi ý giải thuật tự động cho học viên dựa trên mã nguồn họ nộp.",
      "Tối ưu hóa các kỹ thuật RAG (Retrieval-Augmented Generation) để huấn luyện trợ lý AI trên cơ sở dữ liệu đề bài và lời giải của CodePro.",
      "Phát triển hệ thống chatbot hỗ trợ đắc lực cho học viên trong quá trình luyện code theo thời gian thực.",
    ],
    requirements: [
      "Có kinh nghiệm tối thiểu 1.5 năm làm việc trực tiếp với các bài toán xử lý ngôn ngữ tự nhiên (NLP) hoặc phát triển ứng dụng dựa trên LLMs.",
      "Thành thạo Python và các thư viện Machine Learning phổ biến (PyTorch, TensorFlow, LangChain, LlamaIndex).",
      "Hiểu rõ các kỹ thuật Prompt Engineering, Fine-tuning mô hình ngôn ngữ.",
      "Có tư duy logic tốt, khả năng nghiên cứu tài liệu kỹ thuật tiếng Anh vượt trội.",
    ],
    benefits: [
      "Mức lương thỏa thuận hấp dẫn tương xứng với năng lực thực tế.",
      "Thời gian làm việc linh hoạt, hỗ trợ 100% làm việc từ xa (Remote).",
      "Trợ cấp chi phí Internet và trang thiết bị làm việc tại nhà.",
      "Cơ hội làm việc cùng các chuyên gia hàng đầu về AI tại Việt Nam.",
    ],
  },
  "3": {
    responsibilities: [
      "Biên soạn các đề bài thuật toán mới, đa dạng các chủ đề toán học và giải thuật (Greedy, DP, Graph, Tree).",
      "Viết các bài giải mẫu chi tiết bằng nhiều ngôn ngữ lập trình khác nhau (C++, Java, Python, JavaScript).",
      "Thiết kế hình ảnh, sơ đồ minh họa thuật toán trực quan để chèn vào các bài viết cẩm nang giải thuật.",
      "Phối hợp với đội ngũ giảng viên để biên soạn và chuẩn hóa các slide bài giảng, lộ trình học tập trên nền tảng.",
    ],
    requirements: [
      "Có thành tích tốt trong các kỳ thi học sinh giỏi Tin học quốc gia, Olympic tin học sinh viên, hoặc Codeforces/LeetCode rank cao.",
      "Khả năng diễn đạt bằng văn viết tốt, rõ ràng, dễ hiểu đối với học viên mới.",
      "Thành thạo tối thiểu 2 trong 4 ngôn ngữ: C++, Python, Java, JavaScript.",
      "Có tính tự giác cao, tuân thủ đúng tiến độ bàn giao nội dung.",
    ],
    benefits: [
      "Thu nhập hấp dẫn tính theo số lượng bài viết và mức độ khó của đề bài biên soạn.",
      "Học hỏi kỹ năng truyền đạt kiến thức chuyên môn, làm việc hoàn toàn từ xa linh động thời gian.",
      "Được tài trợ 100% tài khoản PRO trên hệ thống CodePro.",
      "Được đào tạo trực tiếp từ Founder về kỹ thuật viết tài liệu chuẩn quốc tế.",
    ],
  },
};

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const job = sampleJobs.find((j) => j.id === id);
  const detail = jobDetails[id];

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    cvUrl: "",
    coverLetter: "",
  });
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus("submitting");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSubmitStatus("success");
      setFormData({ fullName: "", email: "", phone: "", cvUrl: "", coverLetter: "" });
    } catch {
      setSubmitStatus("error");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!job || !detail) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center text-slate-100">
        <p className="text-lg text-slate-400 mb-4">Vị trí tuyển dụng không tồn tại hoặc đã đóng nhận hồ sơ.</p>
        <Link href="/careers" className="text-blue-400 hover:underline flex items-center gap-1">
          <ArrowLeft size={16} /> Quay lại trang Tuyển dụng
        </Link>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Back button */}
          <div className="border-b border-slate-800 pb-4">
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
            >
              <ArrowLeft size={16} />
              <span>Quay lại trang Tuyển dụng</span>
            </Link>
          </div>

          {/* Job Overview */}
          <div className="space-y-4">
            <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full">
              {job.department}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              {job.title}
            </h1>
            
            {/* Meta Info */}
            <div className="flex flex-wrap gap-6 text-sm text-slate-400 pt-2">
              <span className="flex items-center gap-1.5">
                <MapPin size={16} className="text-blue-400" />
                {job.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={16} className="text-blue-400" />
                {job.type}
              </span>
              <span className="flex items-center gap-1.5">
                <DollarSign size={16} className="text-blue-400" />
                {job.salary}
              </span>
            </div>
          </div>

          {/* Job Description details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
            
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-10">
              
              {/* Job Responsibilities */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white border-l-4 border-blue-500 pl-3">Mô tả công việc</h2>
                <ul className="list-disc list-outside pl-4 space-y-2 text-slate-300 text-sm sm:text-base leading-relaxed">
                  {detail.responsibilities.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Job Requirements */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white border-l-4 border-blue-500 pl-3">Yêu cầu ứng viên</h2>
                <ul className="list-disc list-outside pl-4 space-y-2 text-slate-300 text-sm sm:text-base leading-relaxed">
                  {detail.requirements.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Job Benefits */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white border-l-4 border-blue-500 pl-3">Quyền lợi được hưởng</h2>
                <ul className="list-disc list-outside pl-4 space-y-2 text-slate-300 text-sm sm:text-base leading-relaxed">
                  {detail.benefits.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Recruitment Process */}
              <div className="space-y-6 bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
                <h2 className="text-xl font-bold text-white">Quy trình tuyển dụng tại CodePro</h2>
                
                <div className="relative border-l-2 border-blue-900 pl-6 ml-2 space-y-6 text-sm">
                  <div className="relative">
                    <span className="absolute -left-[31px] top-1 bg-blue-600 rounded-full w-4 h-4 flex items-center justify-center border border-slate-950"></span>
                    <h3 className="font-bold text-white">Vòng 1: Lọc Hồ sơ (CV Screen)</h3>
                    <p className="text-slate-400 mt-1">Đánh giá độ phù hợp của CV với vị trí ứng tuyển trong 2-3 ngày làm việc.</p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[31px] top-1 bg-blue-900 rounded-full w-4 h-4 flex items-center justify-center border border-slate-950"></span>
                    <h3 className="font-bold text-white">Vòng 2: Phỏng vấn Kỹ thuật (Technical Interview)</h3>
                    <p className="text-slate-400 mt-1">Trao đổi sâu về kỹ năng chuyên môn, lập trình và tư duy giải thuật qua Google Meet.</p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[31px] top-1 bg-blue-900 rounded-full w-4 h-4 flex items-center justify-center border border-slate-950"></span>
                    <h3 className="font-bold text-white">Vòng 3: System Design / Văn hóa</h3>
                    <p className="text-slate-400 mt-1">Thảo luận về cách thiết kế hệ thống và khả năng làm việc nhóm, độ phù hợp với văn hóa công ty.</p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[31px] top-1 bg-emerald-500 rounded-full w-4 h-4 flex items-center justify-center border border-slate-950"></span>
                    <h3 className="font-bold text-white">Vòng 4: Thỏa thuận Offer</h3>
                    <p className="text-slate-400 mt-1">Đề xuất mức lương thưởng chi tiết và chào mừng bạn gia nhập đội ngũ.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Sidebar Application Form */}
            <div id="apply" className="lg:col-span-4 space-y-6">
              
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6 sticky top-24">
                <div className="flex items-center gap-2 text-white">
                  <FileText size={20} className="text-blue-400" />
                  <h2 className="text-lg font-bold">Nộp đơn ứng tuyển</h2>
                </div>

                {submitStatus === "success" && (
                  <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">
                    <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Nộp CV thành công!</span>
                      Đội ngũ nhân sự sẽ liên hệ với bạn trong vòng 48 giờ làm việc.
                    </div>
                  </div>
                )}

                {submitStatus === "error" && (
                  <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Gửi thất bại!</span>
                      Vui lòng kiểm tra lại đường dẫn CV hoặc kết nối mạng.
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
                  <div className="space-y-1">
                    <label htmlFor="fullName" className="text-slate-400 font-semibold">Họ và tên</label>
                    <input
                      required
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={submitStatus === "submitting"}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="email" className="text-slate-400 font-semibold">Email liên hệ</label>
                    <input
                      required
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={submitStatus === "submitting"}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="phone" className="text-slate-400 font-semibold">Số điện thoại</label>
                    <input
                      required
                      type="text"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={submitStatus === "submitting"}
                      placeholder="0987654321"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="cvUrl" className="text-slate-400 font-semibold">Link CV (Google Drive/Dropbox)</label>
                    <input
                      required
                      type="url"
                      id="cvUrl"
                      name="cvUrl"
                      value={formData.cvUrl}
                      onChange={handleChange}
                      disabled={submitStatus === "submitting"}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="coverLetter" className="text-slate-400 font-semibold">Thư giới thiệu (Không bắt buộc)</label>
                    <textarea
                      id="coverLetter"
                      name="coverLetter"
                      rows={3}
                      value={formData.coverLetter}
                      onChange={handleChange}
                      disabled={submitStatus === "submitting"}
                      placeholder="Viết lời chào ngắn gửi tới nhà tuyển dụng..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={submitStatus === "submitting"}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 font-bold text-white transition-all hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                  >
                    {submitStatus === "submitting" ? (
                      <span>Đang nộp hồ sơ...</span>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Nộp hồ sơ ứng tuyển</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

            </div>

          </div>

        </div>
      </div>
    </PageTransition>
  );
}
