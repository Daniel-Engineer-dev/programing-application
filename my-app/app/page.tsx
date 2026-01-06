// app/page.tsx
"use client";
import PageTransition from "@/src/pageTransition/pageTransition";
import Link from "next/link";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/src/api/firebase/firebase";

interface Article {
  id: number;
  title: string;
  description: string;
  url: string;
  gradient: string;
  iconBg: string;
}

export default function HomePage() {
  const { user } = useAuthContext();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Scroll animation refs
  const [isVisible, setIsVisible] = useState([false, false, false]);
  const imageRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

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

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observers = imageRefs.map((ref, index) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(prev => {
                const newState = [...prev];
                newState[index] = true;
                return newState;
              });
            }
          });
        },
        { threshold: 0.2 }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return observer;
    });

    return () => {
      observers.forEach((observer, index) => {
        if (imageRefs[index].current) {
          observer.unobserve(imageRefs[index].current);
        }
      });
    };
  }, []);

  const cardsPerPage = 3;
  const totalSlides = Math.ceil(articles.length / cardsPerPage);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

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

  return (
    <PageTransition>
      {/* Hero Section với Gradient Background */}
      <section className="relative mt-8 mx-50 overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-2xl blur-3xl animate-pulse"></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

        {/* Glass Card Container */}
        <div className="relative rounded-2xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            {/* CỘT TRÁI: Nội dung chính */}
            <div className="space-y-6 relative z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-sm font-medium text-blue-400">50K+ người dùng đang hoạt động</span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl leading-tight">
                Luyện thuật toán mỗi ngày với{" "}
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                  Code Pro
                </span>
              </h1>
              
              <p className="text-lg text-slate-300 max-w-lg leading-relaxed">
                Hơn <span className="font-bold text-blue-400">1000+</span> bài tập từ dễ đến khó. 
                Theo dõi tiến độ, làm thử, nộp bài, xem giải mẫu.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                {/* Nút Bắt đầu với Gradient */}
                <Link
                  href={user ? "/routes/problems" : "/routes/auth/login"}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-4 font-semibold text-white shadow-lg shadow-blue-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/60 hover:scale-105"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Bắt đầu ngay
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                </Link>

                {/* Nút Tài liệu Glassmorphism */}
                <Link
                  href="/routes/explore"
                  className="group rounded-xl border border-slate-600/50 bg-slate-700/30 backdrop-blur-sm px-8 py-4 font-semibold text-slate-200 transition-all duration-300 hover:bg-slate-700/50 hover:border-slate-500 hover:text-white hover:shadow-lg"
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

            {/* CỘT PHẢI: Thông tin nổi bật */}
            <div className="flex flex-col gap-6 md:pl-10 justify-center relative z-10">
              {/* Dòng text nổi bật với gradient */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-12 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full"></div>
                  <p className="text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                    The Most Effective Way to Get Into
                  </p>
                </div>

                {/* Danh sách Logo với Enhanced Animations */}
                <div className="flex flex-wrap gap-4">
                  {companies.map((company, index) => (
                    <div
                      key={index}
                      className="group relative flex h-14 w-24 items-center justify-center rounded-xl bg-white p-3 border border-slate-200 transition-all duration-500 hover:scale-110 hover:-translate-y-2 cursor-pointer shadow-lg hover:shadow-2xl"
                      title={company.name}
                      style={{
                        animation: `float ${3 + index * 0.5}s ease-in-out infinite`,
                        animationDelay: `${index * 0.2}s`,
                      }}
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
                      {/* Glow Effect on Hover */}
                      <div 
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                        style={{ background: company.glowColor }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thống kê với Gradient Cards */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="relative overflow-hidden rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl"></div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">1000+</p>
                  <p className="text-sm text-slate-400 font-medium">Bài tập</p>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/20 rounded-full blur-2xl"></div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">50K+</p>
                  <p className="text-sm text-slate-400 font-medium">Người dùng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles Section */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          {/* Tiêu đề */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-sm mb-4">
              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-medium text-blue-400">Xu hướng</span>
            </div>
            
            <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent md:text-5xl mb-4">
              Thông tin nổi bật
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              Cập nhật những tin tức mới nhất và thú vị nhất trong thế giới công nghệ
            </p>
          </div>

          {/* Carousel Navigation */}
          <div className="relative">
            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              aria-label="Previous slide"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={nextSlide}
              disabled={currentSlide === totalSlides - 1}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              aria-label="Next slide"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Cards Container with Transition */}
            <div className="overflow-hidden">
              {loading ? (
                // Loading skeleton
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
                <div 
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 transition-all duration-500 ease-in-out"
                style={{
                  transform: `translateX(0)`,
                }}
              >
                {visibleProblems.map((problem, index) => (
              <a
                key={problem.id}
                href={problem.url}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => setHoveredCard(problem.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 transition-all duration-500 hover:border-slate-600 hover:bg-slate-800/80 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden"
                style={{
                  animation: `slideUp 0.6s ease-out ${index * 0.1}s both`,
                }}
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${problem.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                {/* Animated Border Glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl"></div>

                <div className="relative z-10">
                  {/* Icon Badge */}
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${problem.iconBg} mb-4 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300 mb-3">
                    {problem.title}
                  </h3>

                  <p className="text-sm leading-relaxed text-slate-400 group-hover:text-slate-300 line-clamp-3 transition-colors duration-300">
                    {problem.description}
                  </p>
                </div>

                {/* Read More Link */}
                <div className="relative z-10 mt-6 flex items-center text-sm font-semibold text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  Đọc bài báo gốc
                  <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>

                {/* Corner Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </a>
                ))}
              </div>
              )}
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'w-8 bg-gradient-to-r from-blue-500 to-purple-500'
                      : 'w-2 bg-slate-600 hover:bg-slate-500'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Competitive Programming Showcase */}
      <section className="py-20 px-6 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-sm mb-4">
              <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-medium text-purple-400">Lập trình thi đấu</span>
            </div>
            
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent md:text-5xl mb-4">
              Thử thách bản thân
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              Nâng cao kỹ năng giải thuật thông qua các cuộc thi lập trình competitive programming
            </p>
          </div>

          {/* Image Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Image 1: Coding Competition */}
            <div 
              ref={imageRefs[0]}
              className={`group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm transition-all duration-700 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 ${
                isVisible[0] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: '0ms' }}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/images/coding_competition.png"
                  alt="Competitive Programming Arena"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-xl font-bold text-white mb-2">Sân chơi code</h3>
                <p className="text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Tham gia các cuộc thi lập trình với hàng nghìn thí sinh
                </p>
              </div>
            </div>

            {/* Image 2: Algorithm Visualization */}
            <div 
              ref={imageRefs[1]}
              className={`group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm transition-all duration-700 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 ${
                isVisible[1] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: '150ms' }}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/images/algorithm_visualization.png"
                  alt="Algorithm Visualization"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-xl font-bold text-white mb-2">Thuật toán & Cấu trúc dữ liệu</h3>
                <p className="text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Trực quan hóa các thuật toán phức tạp với công nghệ hiện đại
                </p>
              </div>
            </div>

            {/* Image 3: Achievement Trophy */}
            <div 
              ref={imageRefs[2]}
              className={`group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm transition-all duration-700 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20 ${
                isVisible[2] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: '300ms' }}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/images/code_trophy.png"
                  alt="Coding Achievement"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-xl font-bold text-white mb-2">Thành tựu & Xếp hạng</h3>
                <p className="text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Giành chiến thắng và leo lên top của bảng xếp hạng
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 text-center">
            <Link
              href="/routes/problems"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <span>Bắt đầu thử thách</span>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Keyframes cho animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </PageTransition>
  );
}
