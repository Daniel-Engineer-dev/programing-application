// app/page.tsx
"use client";
import PageTransition from "@/components/transitions/pageTransition";
import Link from "next/link";
import { useAuthContext } from "@/contexts/authContext";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, type Variants } from "framer-motion";

interface Article {
  id: number;
  title: string;
  description: string;
  url: string;
  gradient: string;
  iconBg: string;
  image?: string;
  imageUrl?: string;
  thumbnail?: string;
  coverImage?: string;
}

const viewportOnce = { once: true, margin: "-100px" } as const;

const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.08,
    },
  },
};

const cardReveal: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const fallbackArticleImages = [
  "/images/coding_competition.png",
  "/images/algorithm_visualization.png",
  "/images/code_trophy.png",
];

const getArticleImage = (article: Article, index: number) =>
  article.imageUrl ||
  article.image ||
  article.thumbnail ||
  article.coverImage ||
  fallbackArticleImages[index % fallbackArticleImages.length];

export default function HomePage() {
  const { user } = useAuthContext();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // ===== Scroll Snap trên browser scrollbar =====
  useEffect(() => {
    const html = document.documentElement;
    // Áp dụng scroll-snap lên html → dùng thanh scroll trình duyệt
    html.style.scrollSnapType = "y mandatory";
    // Trừ đi chiều cao navbar (sticky) khi snap
    html.style.scrollPaddingTop = "3.5rem";

    return () => {
      html.style.scrollSnapType = "";
      html.style.scrollPaddingTop = "";
    };
  }, []);

  // Fetch articles from Firebase
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const articlesRef = collection(db, "articles");
        const q = query(articlesRef, orderBy("id"));
        const querySnapshot = await getDocs(q);

        const fetchedArticles: Article[] = [];
        querySnapshot.forEach((doc) => {
          fetchedArticles.push(doc.data() as Article);
        });

        setArticles(fetchedArticles);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const cardsPerPage = 3;
  const totalSlides = Math.max(1, Math.ceil(articles.length / cardsPerPage));
  const canSlide = articles.length > cardsPerPage;

  const nextSlide = () => {
    if (!canSlide) return;
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    if (!canSlide) return;
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  useEffect(() => {
    if (currentSlide >= totalSlides) {
      setCurrentSlide(0);
    }
  }, [currentSlide, totalSlides]);

  const visibleProblems = articles.slice(
    currentSlide * cardsPerPage,
    (currentSlide + 1) * cardsPerPage
  );

  const companies = [
    {
      name: "Meta",
      logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg",
      glowColor: "rgba(59, 130, 246, 0.5)",
    },
    {
      name: "Apple",
      logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
      glowColor: "rgba(148, 163, 184, 0.5)",
    },
    {
      name: "Amazon",
      logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
      glowColor: "rgba(249, 115, 22, 0.5)",
    },
    {
      name: "Google",
      logo: "https://www.gstatic.com/images/branding/googlelogo/svg/googlelogo_clr_74x24px.svg",
      glowColor: "rgba(34, 197, 94, 0.5)",
    },
  ];

  /* Chiều cao hiển thị thực = viewport - navbar */
  const sectionHeight = "h-[calc(100vh-3.5rem)]";

  return (
    <PageTransition>
      {/* ===== SECTION 1: Hero ===== */}
      <section
        style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
        className={`relative flex ${sectionHeight} w-full items-center overflow-hidden px-4 py-6`}
      >
        {/* Glass Card Container */}
        <div className="relative mx-auto w-full max-w-7xl rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-sm md:p-12">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            {/* CỘT TRÁI */}
            <div className="space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-blue-400">50K+ người dùng đang hoạt động</span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl leading-tight">
                Luyện thuật toán mỗi ngày với{" "}
                <span className="text-blue-400">Code Pro</span>
              </h1>

              <p className="text-lg text-slate-300 max-w-lg leading-relaxed">
                Hơn <span className="font-bold text-blue-400">1000+</span> bài tập từ dễ đến khó.
                Theo dõi tiến độ, làm thử, nộp bài, xem giải mẫu.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href={user ? "/problems" : "/auth/login"}
                  className="group relative overflow-hidden rounded-lg bg-blue-600 px-8 py-4 font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Bắt đầu ngay
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>

                <Link
                  href="/explore"
                  className="group rounded-lg border border-slate-700 bg-slate-900 px-8 py-4 font-semibold text-slate-200 transition-colors duration-200 hover:bg-slate-800 hover:border-slate-600 hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    Tài liệu
                    <svg className="w-5 h-5 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>

            {/* CỘT PHẢI */}
            <div className="flex flex-col gap-6 md:pl-10 justify-center relative z-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                  <p className="text-sm font-bold uppercase tracking-wider text-blue-300">
                    The Most Effective Way to Get Into
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  {companies.map((company, index) => (
                    <div
                      key={index}
                      className="group relative flex h-14 w-24 items-center justify-center rounded-lg bg-white p-3 border border-slate-200 transition-colors duration-200 cursor-pointer shadow-sm hover:border-blue-300"
                      title={company.name}
                    >
                      <div className="relative h-full w-full">
                        <Image
                          src={company.logo}
                          alt={company.name}
                          fill
                          className="object-contain transition-all duration-500 group-hover:scale-110"
                          unoptimized
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="relative overflow-hidden rounded-lg border border-slate-700 bg-slate-950 p-4 transition-colors duration-200 hover:border-blue-500/60">
                  <p className="text-3xl font-bold text-blue-400">1000+</p>
                  <p className="text-sm text-slate-400 font-medium">Bài tập</p>
                </div>
                <div className="relative overflow-hidden rounded-lg border border-slate-700 bg-slate-950 p-4 transition-colors duration-200 hover:border-blue-500/60">
                  <p className="text-3xl font-bold text-blue-400">50K+</p>
                  <p className="text-sm text-slate-400 font-medium">Người dùng</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce opacity-50">
          <span className="text-xs text-slate-400">Cuộn xuống</span>
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ===== SECTION 2: Featured Articles ===== */}
      <motion.section
        style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
        className={`flex ${sectionHeight} w-full items-center px-6 py-8`}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={sectionReveal}
      >
        <div className="mx-auto max-w-7xl w-full">
          {/* Tiêu đề — compact hơn */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 mb-3">
              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-medium text-blue-400">Xu hướng</span>
            </div>

            <h2 className="text-3xl font-bold text-white md:text-4xl mb-2">
              Thông tin nổi bật
            </h2>
            <p className="text-base text-slate-400 max-w-2xl mx-auto">
              Cập nhật những tin tức mới nhất và thú vị nhất trong thế giới công nghệ
            </p>
          </div>

          {/* Carousel */}
          <div className="relative">
            {/* Prev / Next buttons */}
            <button
              onClick={prevSlide}
              disabled={!canSlide || currentSlide === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-20 flex items-center justify-center w-12 h-12 rounded-lg bg-slate-800 text-white border border-slate-700 transition-colors duration-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous slide"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={nextSlide}
              disabled={!canSlide || currentSlide === totalSlides - 1}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-20 flex items-center justify-center w-12 h-12 rounded-lg bg-slate-800 text-white border border-slate-700 transition-colors duration-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next slide"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Cards */}
            <div className="overflow-hidden">
              {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 animate-pulse"
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-700 mb-4"></div>
                      <div className="h-6 bg-slate-700 rounded mb-3 w-3/4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-700 rounded"></div>
                        <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <motion.div
                  key={currentSlide}
                  className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                >
                  {visibleProblems.map((problem, index) => (
                    <motion.a
                      key={problem.id}
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors duration-200 hover:border-blue-500/60 hover:bg-slate-800 cursor-pointer overflow-hidden"
                      variants={cardReveal}
                    >
                      <div className="relative z-10">
                        <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                          <img
                            src={getArticleImage(problem, index)}
                            alt={problem.title}
                            className="h-full w-full object-cover opacity-95 transition-opacity duration-200 group-hover:opacity-100"
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.src =
                                fallbackArticleImages[index % fallbackArticleImages.length];
                            }}
                          />
                        </div>

                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 mb-3">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>

                        <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors duration-200 mb-2">
                          {problem.title}
                        </h3>

                        <p className="text-sm leading-relaxed text-slate-400 group-hover:text-slate-300 line-clamp-2 transition-colors duration-300">
                          {problem.description}
                        </p>
                      </div>

                      <div className="relative z-10 mt-4 flex items-center text-sm font-semibold text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        Đọc bài báo gốc
                        <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </motion.a>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "w-8 bg-blue-600"
                      : "w-2 bg-slate-600 hover:bg-slate-500"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===== SECTION 3: Competitive Programming Showcase ===== */}
      <motion.section
        style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
        className={`flex ${sectionHeight} w-full items-center bg-slate-950 px-6 py-8`}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={sectionReveal}
      >
        <div className="mx-auto max-w-7xl w-full">
          {/* Header — compact */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 mb-3">
              <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-medium text-purple-400">Lập trình thi đấu</span>
            </div>

            <h2 className="text-3xl font-bold text-white md:text-4xl mb-2">
              Thử thách bản thân
            </h2>
            <p className="text-base text-slate-400 max-w-2xl mx-auto">
              Nâng cao kỹ năng giải thuật thông qua các cuộc thi lập trình competitive programming
            </p>
          </div>

          {/* Image Grid */}
          <motion.div className="grid gap-6 md:grid-cols-3" variants={staggerContainer}>
            <motion.div
              className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition-all duration-500 hover:border-blue-500/60"
              variants={cardReveal}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/images/coding_competition.png"
                  alt="Competitive Programming Arena"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-xl font-bold text-white mb-2">Sân chơi code</h3>
                <p className="text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Tham gia các cuộc thi lập trình với hàng nghìn thí sinh
                </p>
              </div>
            </motion.div>

            <motion.div
              className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition-all duration-500 hover:border-blue-500/60"
              variants={cardReveal}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/images/algorithm_visualization.png"
                  alt="Algorithm Visualization"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-xl font-bold text-white mb-2">Thuật toán & Cấu trúc dữ liệu</h3>
                <p className="text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Trực quan hóa các thuật toán phức tạp với công nghệ hiện đại
                </p>
              </div>
            </motion.div>

            <motion.div
              className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition-all duration-500 hover:border-blue-500/60"
              variants={cardReveal}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/images/code_trophy.png"
                  alt="Coding Achievement"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-xl font-bold text-white mb-2">Thành tựu & Xếp hạng</h3>
                <p className="text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Giành chiến thắng và leo lên top của bảng xếp hạng
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <Link
              href="/problems"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200"
            >
              <span>Bắt đầu thử thách</span>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </motion.section>
    </PageTransition>
  );
}
