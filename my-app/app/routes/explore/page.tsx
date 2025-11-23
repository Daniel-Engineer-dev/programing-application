import {
  Search,
  ChevronDown,
  X,
  Code2,
  Database,
  Terminal,
  Bell,
  User,
} from "lucide-react";
import Link from "next/link";
import PageTransition from "@/src/pageTransition/pageTransition";

export default function ExplorePage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-900 font-sans text-slate-300">
        <main className="mx-auto max-w-5xl px-6 py-12">
          {/* --- 2. Hero Section & Search --- */}
          <section className="mb-16 text-center">
            <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Khám phá các chủ đề lập trình
            </h1>
            <p className="mx-auto max-w-2xl text-slate-400 mb-8">
              Đi sâu vào bộ sưu tập toàn diện các hướng dẫn, bài toán và lộ
              trình học tập để trau dồi kỹ năng lập trình của bạn.
            </p>

            {/* Search Bar */}
            <div className="relative mx-auto mb-6 max-w-xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm kiếm chủ đề, hướng dẫn, hoặc bài toán..."
                className="w-full rounded-xl bg-slate-800 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Tags / Filters */}
            <div className="flex flex-wrap justify-center gap-3">
              {/* Dropdowns */}
              <button className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium hover:bg-slate-700">
                Độ khó <ChevronDown size={14} />
              </button>
              <button className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium hover:bg-slate-700">
                Loại <ChevronDown size={14} />
              </button>

              {/* Active Tags (Blue pills) */}
              <button className="flex items-center gap-1 rounded-lg bg-blue-600/20 px-3 py-1.5 text-xs font-medium text-blue-400 border border-blue-500/30">
                Người mới bắt đầu <X size={12} />
              </button>
              <button className="flex items-center gap-1 rounded-lg bg-blue-600/20 px-3 py-1.5 text-xs font-medium text-blue-400 border border-blue-500/30">
                Video <X size={12} />
              </button>
            </div>
          </section>

          {/* --- 3. Chủ đề nổi bật (Featured Topics) --- */}
          <section className="mb-12">
            <h2 className="mb-6 text-xl font-bold text-white">
              Chủ đề nổi bật
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Cấu trúc dữ liệu",
                  icon: <Database />,
                  desc: "Nắm vững mảng, danh sách liên kết, cây và các khái niệm nền tảng khác.",
                },
                {
                  title: "Thuật toán",
                  icon: <Code2 />,
                  desc: "Học các kỹ thuật sắp xếp, tìm kiếm và tối ưu hóa.",
                },
                {
                  title: "JavaScript",
                  icon: <Terminal />,
                  desc: "Tìm hiểu sâu về ngôn ngữ của web, từ cơ bản đến nâng cao.",
                },
              ].map((topic, i) => (
                <div
                  key={i}
                  className="group cursor-pointer rounded-2xl border border-slate-700 bg-slate-800 p-6 transition-all hover:border-slate-600 hover:bg-slate-750"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {topic.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-slate-400">{topic.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* --- 4. Lộ trình học tập (Learning Paths) --- */}
          <section className="mb-12">
            <h2 className="mb-6 text-xl font-bold text-white">
              Lộ trình học tập
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Card 1: Có progress */}
              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white">
                    Chuẩn bị cho phỏng vấn
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Danh sách các bài toán và khái niệm được tuyển chọn để bạn
                    vượt qua cuộc phỏng vấn kỹ thuật tiếp theo.
                  </p>
                </div>
                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="h-2 w-full rounded-full bg-slate-700">
                    <div className="h-2 w-[45%] rounded-full bg-blue-600"></div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Hoàn thành 45%</p>
                </div>
              </div>

              {/* Card 2: Chưa bắt đầu */}
              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white">
                    Làm chủ React
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Đi từ người mới bắt đầu đến chuyên gia với hướng dẫn toàn
                    diện về hệ sinh thái React.
                  </p>
                </div>
                <div className="mt-6">
                  <div className="h-2 w-full rounded-full bg-slate-700"></div>
                  <p className="mt-2 text-xs text-slate-500">Chưa bắt đầu</p>
                </div>
              </div>
            </div>
          </section>

          {/* --- 5. Hướng dẫn mới (New Guides) --- */}
          <section className="mb-20">
            <h2 className="mb-6 text-xl font-bold text-white">Hướng dẫn mới</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Guide 1 */}
              <div className="flex gap-4 rounded-2xl border border-slate-700 bg-slate-800 p-4 transition-colors hover:bg-slate-750">
                {/* Placeholder Image */}
                <div className="h-24 w-36 shrink-0 rounded-lg bg-linear-to-br from-blue-900 to-slate-800"></div>

                <div className="flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white">
                      Hiểu về Quy hoạch động
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Bởi Jane Doe</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded bg-blue-900/50 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                      Trung cấp
                    </span>
                    <span className="rounded bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
                      Bài viết
                    </span>
                  </div>
                </div>
              </div>

              {/* Guide 2 */}
              <div className="flex gap-4 rounded-2xl border border-slate-700 bg-slate-800 p-4 transition-colors hover:bg-slate-750">
                {/* Placeholder Image */}
                <div className="h-24 w-36 shrink-0 rounded-lg bg-linear-to-br from-orange-100 to-orange-200"></div>

                <div className="flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white">
                      Cơ bản về thiết kế hệ thống
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Bởi Code Pro</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded bg-blue-900/50 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                      Người mới bắt đầu
                    </span>
                    <span className="rounded bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
                      Video
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* --- 6. Footer --- */}
        <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row px-6">
            <p>© 2024 Code Pro. Bảo lưu mọi quyền.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-slate-300">
                Giới thiệu
              </Link>
              <Link href="#" className="hover:text-slate-300">
                Điều khoản dịch vụ
              </Link>
              <Link href="#" className="hover:text-slate-300">
                Liên hệ
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
