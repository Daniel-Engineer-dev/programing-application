"use client";

import { use } from "react";
import PageTransition from "@/components/transitions/pageTransition";
import { samplePosts } from "../page";
import Link from "next/link";
import { Calendar, User, ArrowLeft, Clock, Share2, Bookmark } from "lucide-react";

// Mock detailed contents for each blog post
const postContents: Record<string, { subtitle: string; contentHtml: React.ReactNode }> = {
  "1": {
    subtitle: "Hành trình từ con số 0 đến việc làm tại các tập đoàn công nghệ lớn.",
    contentHtml: (
      <div className="space-y-6">
        <p>
          Luyện thuật toán trên LeetCode đã trở thành một tiêu chuẩn không thể thiếu đối với các kỹ sư phần mềm muốn chinh phục các vòng phỏng vấn kỹ thuật của các tập đoàn công nghệ lớn (Big Tech). Tuy nhiên, đối với người mới bắt đầu, việc nhìn vào hàng ngàn câu hỏi với đủ loại thẻ đề bài từ Arrays, Linked Lists, Cây đến Quy hoạch động có thể gây choáng ngợp cực kỳ.
        </p>
        <h3 className="text-xl font-bold text-white mt-8">Giai đoạn 1: Xây dựng nền tảng vững chắc (1-2 tháng đầu)</h3>
        <p>
          Đừng vội giải bài ngay lập tức. Trước tiên, hãy chắc chắn rằng bạn hiểu rõ các cấu trúc dữ liệu cơ bản như: Mảng (Arrays), Chuỗi (Strings), Danh sách liên kết (Linked Lists), Ngăn xếp & Hàng đợi (Stack & Queue), và các cấu trúc cây cơ bản. Tìm hiểu kỹ về độ phức tạp thuật toán (Big O notation) để biết cách đánh giá thời gian chạy và bộ nhớ của thuật toán.
        </p>
        <blockquote className="border-l-4 border-emerald-500 pl-4 py-2 italic text-slate-300 bg-slate-900/40 rounded-r-lg">
          "Sai lầm lớn nhất của người mới là cố giải các câu hỏi trung bình/khó khi chưa nắm chắc các thao tác cơ bản trên mảng và danh sách liên kết."
        </blockquote>
        <h3 className="text-xl font-bold text-white mt-8">Giai đoạn 2: Luyện tập theo dạng bài (Pattern-based learning)</h3>
        <p>
          Thay vì giải ngẫu nhiên, hãy giải theo các mẫu thuật toán phổ biến (Patterns). Một số mẫu cực kỳ kinh điển bao gồm:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-2 text-slate-400">
          <li><strong>Two Pointers (Hai con trỏ):</strong> Thường dùng cho mảng đã sắp xếp.</li>
          <li><strong>Sliding Window (Cửa sổ trượt):</strong> Giải quyết các bài toán về mảng con hoặc chuỗi con liên tục.</li>
          <li><strong>Breadth-First Search (BFS) & Depth-First Search (DFS):</strong> Dùng cho duyệt đồ thị và cây.</li>
          <li><strong>Binary Search (Tìm kiếm nhị phân):</strong> Khi cần tìm kiếm trên một không gian tìm kiếm đã sắp xếp.</li>
        </ul>
        <h3 className="text-xl font-bold text-white mt-8">Giai đoạn 3: Rèn luyện tính kỷ luật</h3>
        <p>
          Hãy giải ít nhất 1-2 bài mỗi ngày. Nếu sau 30-40 phút suy nghĩ mà vẫn chưa tìm ra hướng giải, hãy đọc lời giải chi tiết (Solution) hoặc xem video giải thích. Việc tự nghĩ quá lâu khi chưa có đủ kiến thức nền tảng sẽ làm bạn nản lòng. Điều quan trọng là sau khi xem giải, hãy tự tay viết lại code từ đầu.
        </p>
      </div>
    ),
  },
  "2": {
    subtitle: "Đánh giá chi tiết các tính năng mới đột phá trong phiên bản Next.js 16.",
    contentHtml: (
      <div className="space-y-6">
        <p>
          Next.js phiên bản 16 vừa chính thức được phát hành với hàng loạt cập nhật tập trung vào việc tối ưu hóa hiệu năng, rút ngắn thời gian khởi động môi trường phát triển và nâng cấp hệ thống Server Components lên một tầm cao mới.
        </p>
        <h3 className="text-xl font-bold text-white mt-8">1. Trình biên dịch mới mạnh mẽ</h3>
        <p>
          Với việc chuyển giao hoàn toàn sang Turbopack và cải tiến compiler nội bộ, Next.js 16 mang đến tốc độ Fast Refresh nhanh hơn tới 40% và thời gian build production giảm tới 25%. Điều này giải quyết bài toán nhức nhối về thời gian chờ đợi trên các dự án lớn.
        </p>
        <h3 className="text-xl font-bold text-white mt-8">2. Tối ưu hóa Server Actions và Form State</h3>
        <p>
          Hỗ trợ đầy đủ React 19 giúp Next.js 16 tích hợp sẵn các hook như `useActionState` và `useFormStatus`. Việc quản lý trạng thái tải (loading state), xử lý lỗi khi gửi form lên server trở nên cực kỳ tinh gọn mà không cần viết quá nhiều boilerplate code.
        </p>
        <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto text-xs font-mono text-emerald-400 leading-relaxed">
{`// Ví dụ sử dụng Server Action mới trong Next.js 16
"use client";
import { useActionState } from "react";
import { submitContactForm } from "./actions";

export default function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactForm, null);
  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      <button disabled={isPending}>Gửi liên hệ</button>
    </form>
  );
}`}
        </pre>
      </div>
    ),
  },
  "3": {
    subtitle: "Viết mã nguồn dễ đọc, dễ hiểu và dễ bảo trì để nâng tầm bản thân.",
    contentHtml: (
      <div className="space-y-6">
        <p>
          Bất kỳ ai cũng có thể viết code mà máy tính có thể hiểu được. Nhưng những lập trình viên giỏi sẽ viết code mà con người có thể hiểu được. Viết code sạch (Clean Code) là một trong những kỹ năng cốt lõi phân biệt một lập trình viên trung bình và một kỹ sư phần mềm xuất sắc.
        </p>
        <h3 className="text-xl font-bold text-white mt-8">Nguyên tắc đặt tên có ý nghĩa</h3>
        <p>
          Tên biến, tên hàm và tên lớp cần thể hiện rõ ràng mục đích của chúng. Hãy tránh các tên biến vô nghĩa như `x`, `y`, `temp` hoặc viết tắt quá mức trừ khi đó là các biến chạy trong vòng lặp ngắn.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <span className="text-red-400 font-bold block mb-1">❌ Code chưa sạch:</span>
            <code className="text-slate-300 text-xs font-mono">let d = 86400; // time in sec</code>
          </div>
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <span className="text-emerald-400 font-bold block mb-1">✅ Code sạch:</span>
            <code className="text-slate-300 text-xs font-mono">const SECONDS_IN_A_DAY = 86400;</code>
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mt-8">Hàm chỉ nên thực hiện một việc (Single Responsibility)</h3>
        <p>
          Mỗi hàm chỉ nên chịu trách nhiệm cho một tác vụ cụ thể duy nhất. Nếu một hàm của bạn dài quá 30 dòng hoặc chứa nhiều logic rẽ nhánh phức tạp không liên quan, hãy cân nhắc tách nhỏ hàm đó ra. Điều này giúp việc viết unit test trở nên dễ dàng hơn bao giờ hết.
        </p>
      </div>
    ),
  },
  "4": {
    subtitle: "Quy trình chuẩn bị toàn diện về thuật toán, system design và văn hóa doanh nghiệp.",
    contentHtml: (
      <div className="space-y-6">
        <p>
          Phỏng vấn vào các tập đoàn công nghệ lớn như Google, Meta, Microsoft hay Amazon luôn là một thử thách cam go. Để vượt qua các vòng phỏng vấn này đòi hỏi bạn cần có một sự chuẩn bị kỹ lưỡng từ kiến thức kỹ thuật đến kỹ năng mềm.
        </p>
        <h3 className="text-xl font-bold text-white mt-8">Vòng phỏng vấn Coding (Thuật toán)</h3>
        <p>
          Đây là vòng thi bắt buộc. Bạn sẽ phải giải quyết 1-2 bài toán thuật toán trong khoảng 45 phút. Bí quyết ở đây không chỉ là viết code chạy đúng, mà là khả năng giao tiếp: hãy giải thích tư duy của bạn cho người phỏng vấn nghe trước khi bắt đầu viết code (Think out loud).
        </p>
        <h3 className="text-xl font-bold text-white mt-8">Vòng phỏng vấn Thiết kế hệ thống (System Design)</h3>
        <p>
          Dành cho các vị trí từ Mid-level trở lên. Bạn cần thiết kế một hệ thống lớn (ví dụ: thiết kế Youtube, Messenger). Hãy tập trung vào khả năng mở rộng (scalability), tính sẵn sàng cao (availability), phân vùng dữ liệu và tối ưu hóa chi phí.
        </p>
      </div>
    ),
  },
  "5": {
    subtitle: "Cơ hội cọ xát tư duy, khẳng định bản thân và rinh giải thưởng khủng cùng CodePro.",
    contentHtml: (
      <div className="space-y-6">
        <p>
          Giải đấu lập trình thường niên CodePro Summer Cup 2026 chính thức được khởi động. Đây là sân chơi trí tuệ đỉnh cao dành riêng cho các bạn học sinh, sinh viên và lập trình viên chuyên nghiệp trên toàn quốc.
        </p>
        <h3 className="text-xl font-bold text-white mt-8">Thể thức thi đấu</h3>
        <p>
          Giải đấu diễn ra hoàn toàn trực tuyến trên nền tảng CodePro. Các thí sinh sẽ giải quyết 6 bài toán thuật toán từ dễ đến nâng cao trong thời gian 3 tiếng. Thứ hạng sẽ được tính dựa trên số lượng bài giải đúng và thời gian nộp bài (Penalty time).
        </p>
        <h3 className="text-xl font-bold text-white mt-8">Cơ cấu giải thưởng</h3>
        <ul className="list-disc list-inside pl-4 space-y-2 text-slate-400">
          <li><strong>Giải Nhất:</strong> 25,000,000 VNĐ tiền mặt cùng cúp vô địch CodePro.</li>
          <li><strong>Giải Nhì:</strong> 15,000,000 VNĐ tiền mặt.</li>
          <li><strong>Giải Ba:</strong> 7,000,000 VNĐ tiền mặt.</li>
          <li>Top 20 thí sinh xuất sắc nhất sẽ được đặc cách vào vòng phỏng vấn trực tiếp tại các công ty tài trợ.</li>
        </ul>
      </div>
    ),
  },
  "6": {
    subtitle: "Làm thế nào để cơ sở dữ liệu của bạn chịu tải hàng triệu request mỗi ngày.",
    contentHtml: (
      <div className="space-y-6">
        <p>
          Khi ứng dụng của bạn tăng trưởng lượng người dùng nhanh chóng, Database thường là nút thắt cổ chai (bottleneck) đầu tiên làm giảm tốc độ hệ thống. Việc tối ưu hóa Database là nhiệm vụ sống còn của các kỹ sư hệ thống lớn.
        </p>
        <h3 className="text-xl font-bold text-white mt-8">1. Đánh chỉ mục (Indexing) đúng cách</h3>
        <p>
          Index giúp tăng tốc truy vấn dữ liệu nhưng làm giảm tốc độ của các câu lệnh ghi (Insert, Update, Delete). Hãy phân tích các câu lệnh truy vấn thường dùng thông qua lệnh `EXPLAIN` để đánh index trên các trường dữ liệu phù hợp.
        </p>
        <h3 className="text-xl font-bold text-white mt-8">2. Sử dụng Cache (Bộ nhớ đệm)</h3>
        <p>
          Đừng truy vấn trực tiếp cơ sở dữ liệu cho các thông tin ít thay đổi. Hãy sử dụng Redis làm tầng cache để lưu các kết quả truy vấn thường xuyên, giảm tải tối đa cho hệ thống Database chính.
        </p>
        <h3 className="text-xl font-bold text-white mt-8">3. Phân vùng dữ liệu (Database Sharding & Replication)</h3>
        <p>
          Thiết lập kiến trúc Master-Slave để phân tách luồng Ghi (ghi vào Master) và luồng Đọc (đọc từ Slave). Khi dữ liệu quá lớn, thực hiện Sharding (chia nhỏ dữ liệu ra các database vật lý độc lập) để phân tán tải trọng.
        </p>
      </div>
    ),
  },
};

export default function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const post = samplePosts.find((p) => p.id === id);
  const detail = postContents[id];

  if (!post || !detail) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center text-slate-100">
        <p className="text-lg text-slate-400 mb-4">Bài viết không tồn tại hoặc đã bị gỡ bỏ.</p>
        <Link href="/blog" className="text-emerald-400 hover:underline flex items-center gap-1">
          <ArrowLeft size={16} /> Quay lại trang Blog
        </Link>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Back button & Action buttons */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
            >
              <ArrowLeft size={16} />
              <span>Quay lại trang Blog</span>
            </Link>

            <div className="flex items-center gap-3 text-slate-500">
              <button className="hover:text-white transition-colors" aria-label="Share">
                <Share2 size={16} />
              </button>
              <button className="hover:text-white transition-colors" aria-label="Bookmark">
                <Bookmark size={16} />
              </button>
            </div>
          </div>

          {/* Blog Meta Header */}
          <div className="space-y-4">
            <span className="inline-block text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              {post.categoryLabel}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              {post.title}
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 leading-relaxed font-light">
              {detail.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 pt-2">
              <span className="flex items-center gap-1.5">
                <User size={15} />
                <span className="font-medium text-slate-300">{post.author}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={15} />
                {post.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={15} />
                {post.readTime}
              </span>
            </div>
          </div>

          {/* Decorative Gradient Bar */}
          <div className={`h-1.5 bg-gradient-to-r ${post.gradient} rounded-full`}></div>

          {/* Blog Content */}
          <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm sm:text-base space-y-6 pt-4">
            {detail.contentHtml}
          </div>

          {/* Footer of the blog post */}
          <div className="border-t border-slate-800 pt-8 mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Tác giả</span>
              <span className="text-sm font-bold text-white">{post.author}</span>
              <span className="text-xs text-slate-400 block">Đội ngũ kỹ sư tại CodePro</span>
            </div>

            <div>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Xem các bài viết khác
              </Link>
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
