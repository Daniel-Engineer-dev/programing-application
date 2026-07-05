"use client";

import PageTransition from "@/components/transitions/pageTransition";
import { useState } from "react";
import { BookOpen, Calendar, User, ArrowRight, Search } from "lucide-react";
import Link from "next/link";

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: "programming" | "algorithms" | "career" | "news";
  categoryLabel: string;
  author: string;
  date: string;
  readTime: string;
  gradient: string;
}

export const samplePosts: BlogPost[] = [
  {
    id: "1",
    title: "Cẩm nang ôn luyện LeetCode từ con số 0",
    excerpt: "Chia sẻ lộ trình chi tiết giúp bạn làm quen và bứt phá các bài tập LeetCode từ dễ đến khó để chuẩn bị phỏng vấn vào các tập đoàn công nghệ lớn.",
    category: "algorithms",
    categoryLabel: "Giải Thuật",
    author: "Trí Đức",
    date: "02/07/2026",
    readTime: "8 phút đọc",
    gradient: "from-blue-600 to-indigo-600",
  },
  {
    id: "2",
    title: "Next.js 16 và những thay đổi đáng chú ý",
    excerpt: "Khám phá các tính năng mới nhất trong Next.js 16 bao gồm tối ưu hóa Server Actions, cải tiến compiler và các kỹ thuật tối ưu hóa SEO vượt bậc.",
    category: "programming",
    categoryLabel: "Lập Trình",
    author: "Dũng Dương",
    date: "28/06/2026",
    readTime: "5 phút đọc",
    gradient: "from-emerald-600 to-teal-600",
  },
  {
    id: "3",
    title: "Cách viết Clean Code cho người mới bắt đầu",
    excerpt: "Viết mã sạch không khó nhưng cần tư duy đúng đắn. Hãy cùng điểm qua những quy tắc vàng giúp code của bạn dễ đọc, dễ bảo trì và chuyên nghiệp hơn.",
    category: "programming",
    categoryLabel: "Lập Trình",
    author: "Trí Đức",
    date: "15/06/2026",
    readTime: "6 phút đọc",
    gradient: "from-purple-600 to-pink-600",
  },
  {
    id: "4",
    title: "Bí quyết phỏng vấn Big Tech thành công",
    excerpt: "Những kinh nghiệm thực tế về chuẩn bị hồ sơ, luyện giải thuật trực tiếp và rèn luyện kỹ năng giao tiếp khi phỏng vấn với các kỹ sư Google, Meta.",
    category: "career",
    categoryLabel: "Sự Nghiệp",
    author: "Trung Hiếu",
    date: "10/06/2026",
    readTime: "10 phút đọc",
    gradient: "from-orange-600 to-red-600",
  },
  {
    id: "5",
    title: "CodePro chính thức khởi động Giải đấu hè 2026",
    excerpt: "Cơ hội tranh tài cùng hơn 5,000 lập trình viên cả nước với giải thưởng lên đến 50 triệu đồng và nhiều cơ hội tuyển dụng hấp dẫn từ các nhà tài trợ.",
    category: "news",
    categoryLabel: "Tin Tức",
    author: "CodePro Ban Tổ Chức",
    date: "05/06/2026",
    readTime: "3 phút đọc",
    gradient: "from-sky-600 to-blue-600",
  },
  {
    id: "6",
    title: "Tối ưu hóa hiệu năng Database cho ứng dụng lớn",
    excerpt: "Tìm hiểu các kỹ thuật tối ưu cơ sở dữ liệu nâng cao như đánh chỉ mục (indexing), sharding, caching và tối ưu hóa câu lệnh query cho ứng dụng chịu tải cao.",
    category: "programming",
    categoryLabel: "Lập Trình",
    author: "Dũng Dương",
    date: "01/07/2026",
    readTime: "7 phút đọc",
    gradient: "from-blue-600 to-cyan-600",
  },
];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    { value: "all", label: "Tất Cả" },
    { value: "programming", label: "Lập Trình" },
    { value: "algorithms", label: "Cấu Trúc Dữ Liệu & Giải Thuật" },
    { value: "career", label: "Góc Sự Nghiệp" },
    { value: "news", label: "Tin Tức" },
  ];

  const filteredPosts = samplePosts.filter((post) => {
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
              <BookOpen size={16} />
              <span>CodePro Blog</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              Góc Kiến Thức & Trải Nghiệm Lập Trình
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Nơi cập nhật những xu hướng công nghệ mới nhất, cẩm nang giải thuật, và các câu chuyện sự nghiệp đầy cảm hứng.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-800 pb-6">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === cat.value
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Blog Grid */}
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.id}`}
                  className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden hover:border-slate-700 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group"
                >
                  {/* Decorative Gradient Header */}
                  <div className={`h-4 bg-gradient-to-r ${post.gradient}`}></div>
                  
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Category Badge */}
                      <span className="inline-block text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                        {post.categoryLabel}
                      </span>
                      
                      <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800/60">
                        <span className="flex items-center gap-1">
                          <User size={13} />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={13} />
                          {post.date}
                        </span>
                      </div>

                      {/* Read Link */}
                      <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                        <span>{post.readTime}</span>
                        <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Đọc thêm <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              Không tìm thấy bài viết nào khớp với bộ lọc hiện tại.
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
}
