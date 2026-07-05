"use client";

import PageTransition from "@/components/transitions/pageTransition";
import { Award, Target, Rocket, Shield, Heart } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const stats = [
    { label: "Thành viên tích cực", value: "50,000+" },
    { label: "Bài tập thuật toán", value: "1,000+" },
    { label: "Cuộc thi đã tổ chức", value: "150+" },
    { label: "Tỷ lệ hài lòng", value: "98%" },
  ];

  const values = [
    {
      icon: Target,
      title: "Sứ mệnh",
      description:
        "Mang đến nền tảng luyện tập lập trình chất lượng cao nhất, giúp lập trình viên Việt Nam nâng cao tư duy thuật toán và kỹ năng thực hành.",
    },
    {
      icon: Rocket,
      title: "Tầm nhìn",
      description:
        "Trở thành cộng đồng và hệ sinh thái học tập công nghệ hàng đầu tại Đông Nam Á, kết nối tài năng với các doanh nghiệp toàn cầu.",
    },
    {
      icon: Shield,
      title: "Chất lượng",
      description:
        "Mọi bài tập, bài giải mẫu và tài liệu đều được biên soạn kỹ lưỡng bởi đội ngũ kỹ sư giàu kinh nghiệm từ các tập đoàn lớn.",
    },
    {
      icon: Heart,
      title: "Cộng đồng",
      description:
        "Xây dựng văn hóa chia sẻ, hỗ trợ lẫn nhau cùng tiến bộ thông qua hệ thống thảo luận và đánh giá mã nguồn văn minh.",
    },
  ];

  const team = [
    {
      name: "Trí Đức",
      role: "Founder & CEO",
      bio: "Cựu kỹ sư phần mềm tại Google, đam mê giáo dục tin học và thuật toán.",
      avatar: "/images/avatar_triduc.png",
    },
    {
      name: "Dũng Dương",
      role: "Co-Founder & CTO",
      bio: "Chuyên gia hệ thống lớn, chịu trách nhiệm xây dựng nền tảng biên dịch trực tuyến.",
      avatar: "/images/avatar_dungduong.png",
    },
    {
      name: "Mạnh Hà",
      role: "Lead AI Engineer",
      bio: "Chuyên gia NLP & LLMs, phát triển hệ thống gợi ý giải thuật thông minh.",
      avatar: "/images/avatar_manhha.png",
    },
    {
      name: "Trung Hiếu",
      role: "Product Manager",
      bio: "Định hướng trải nghiệm học tập gamification giúp học viên hứng thú luyện code mỗi ngày.",
      avatar: "/images/avatar_trunghieu.png",
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-20">
          
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium">
              <Award size={16} />
              <span>Về Chúng Tôi</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-400 bg-clip-text text-transparent">
              Chinh Phục Đỉnh Cao Lập Trình
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              CodePro không chỉ là một trang web giải bài tập thuật toán. Chúng tôi là một cộng đồng năng động, nơi chia sẻ tri thức và thúc đẩy sự phát triển của các thế hệ lập trình viên tài năng.
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center shadow-lg transition-all hover:border-blue-500/30 hover:-translate-y-1"
              >
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-400 mb-2">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Core Values Section */}
          <div className="space-y-12">
            <h2 className="text-3xl font-bold text-center text-white">Giá Trị Cốt Lõi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((val, idx) => {
                const Icon = val.icon;
                return (
                  <div
                    key={idx}
                    className="flex gap-4 p-6 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="flex-shrink-0 p-3 rounded-lg bg-blue-500/10 text-blue-400 self-start">
                      <Icon size={24} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white">{val.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{val.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team Section */}
          <div className="space-y-12">
            <h2 className="text-3xl font-bold text-center text-white">Đội Ngũ Ban Điều Hành</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="relative mx-auto w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500/30 bg-slate-800">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="object-cover w-full h-full scale-[1.18]"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{member.name}</h3>
                      <p className="text-sm text-blue-400">{member.role}</p>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-900/40 via-blue-950/40 to-slate-900/40 border border-blue-900/60 p-8 sm:p-12 text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Bắt đầu nâng tầm kỹ năng của bạn hôm nay</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              Hàng ngàn lập trình viên đang ngày đêm giải bài và cải thiện thứ hạng trên CodePro. Bạn đã sẵn sàng chưa?
            </p>
            <div className="pt-4">
              <Link
                href="/problems"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-500 hover:-translate-y-0.5"
              >
                Khám Phá Bài Tập
              </Link>
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
