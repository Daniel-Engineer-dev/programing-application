import PageTransition from "@/src/pageTransition/pageTransition";
import {
  Search,
  Plus,
  MessageSquare,
  Clock,
  ChevronDown,
  Bell,
  Menu,
} from "lucide-react";

export default function DiscussionPage() {
  // Dữ liệu mẫu mô phỏng nội dung trong ảnh
  const discussions = [
    {
      id: 1,
      title: 'Làm thế nào để giải "Two Sum" bằng hash map?',
      excerpt:
        "Tôi đang gặp khó khăn trong việc hiểu cách tiếp cận bằng hash map cho bài toán Two Sum. Ai đó có thể giải thích độ phức tạp về thời gian và cách nó hoạt động từng bước không?",
      replies: 12,
      time: "2 giờ trước",
    },
    {
      id: 2,
      title: 'Giải pháp tối ưu cho "Median of Two Sorted Arrays"?',
      excerpt:
        "Đây là một trong những bài toán khó nhất tôi từng gặp. Giải pháp O(log(m+n)) thật khó hiểu. Tôi đang tìm kiếm các góc nhìn khác hoặc những lời giải thích đơn giản hơn.",
      replies: 45,
      time: "8 giờ trước",
    },
    {
      id: 3,
      title: "Thảo luận về các mẫu Quy hoạch động",
      excerpt:
        "Hãy cùng nhau tổng hợp một danh sách các mẫu DP phổ biến. Tôi sẽ bắt đầu với Knapsack (0/1, không giới hạn) và Dãy con chung dài nhất. Còn những mẫu nào khác?",
      replies: 128,
      time: "1 ngày trước",
    },
    {
      id: 4,
      title: "Mẹo cho các cuộc phỏng vấn Thiết kế hệ thống?",
      excerpt:
        "Tôi sắp có một cuộc phỏng vấn lớn và yếu về Thiết kế hệ thống. Những tài nguyên và chủ đề tốt nhất để tập trung là gì? Mọi lời khuyên đều được đánh giá cao!",
      replies: 76,
      time: "3 ngày trước",
    },
    {
      id: 5,
      title: "Khi nào nên sử dụng BFS và DFS?",
      excerpt:
        "Tôi luôn bối rối không biết nên sử dụng thuật toán duyệt nào cho các bài toán đồ thị. Có quy tắc chung nào hoặc các tình huống cụ thể cho mỗi loại không?",
      replies: 31,
      time: "5 ngày trước",
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-900 font-sans text-slate-300">
        <main className="mx-auto max-w-6xl px-6 py-10">
          {/* --- 2. Header Section --- */}
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Trang Thảo luận
              </h1>
              <p className="text-slate-400">
                Khám phá chủ đề, đặt câu hỏi và chia sẻ kiến thức của bạn.
              </p>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20">
              <Plus size={18} />
              Tạo Chủ đề Mới
            </button>
          </div>

          {/* --- 3. Search & Filters Bar --- */}
          <div className="flex flex-col gap-4 md:flex-row mb-8">
            {/* Search Input (Flexible width) */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm kiếm thảo luận..."
                className="w-full rounded-lg bg-slate-800 border border-slate-700 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
              {["Chuyên mục", "Gần đây", "Phổ biến"].map((filter) => (
                <button
                  key={filter}
                  className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  {filter}
                  <ChevronDown size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* --- 4. Discussion List --- */}
          <div className="space-y-4">
            {discussions.map((item) => (
              <div
                key={item.id}
                className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-800/50 p-6 transition-all hover:border-slate-600 hover:bg-slate-800 hover:shadow-md"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                      {item.excerpt}
                    </p>
                  </div>

                  {/* Metadata (Replies & Time) */}
                  <div className="flex items-center gap-6 text-xs font-medium text-slate-500 shrink-0 pt-1">
                    <div className="flex items-center gap-1.5 hover:text-slate-300">
                      <MessageSquare size={16} />
                      {item.replies} Trả lời
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={16} />
                      {item.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
