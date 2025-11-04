// app/page.tsx
"use client";
import PageTransition from "@/src/pageTransition/pageTransition";
import Image from "next/image";
import Link from "next/link";
import { useAuthContext } from "@/src/userHook/context/authContext";

export default function HomePage() {
  const { user } = useAuthContext();
  return (
    <PageTransition>
      {/* Hero */}
      <section className="mt-4 rounded-2xl border bg-white p-6 mx-6">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left ">
          <Image
            src="/hero.png"
            alt="ProgHub Hero"
            width={160}
            height={160}
            className="mx-auto rounded-xl"
            priority
          />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Luyện thuật toán mỗi ngày với Code Pro
            </h1>
            <p className="text-gray-600">
              Hơn 1000+ bài tập từ dễ đến khó. Theo dõi tiến độ, làm thử, nộp
              bài, xem giải mẫu.
            </p>
            <div className="flex gap-3 pt-2">
              {/* Dẫn sang trang Problems */}
              <Link
                href={user ? "/routes/problems" : "/routes/auth/login"}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Bắt đầu
              </Link>

              <Link
                href="/"
                className="rounded-md border px-4 py-2 hover:bg-gray-50"
              >
                Tài liệu
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
