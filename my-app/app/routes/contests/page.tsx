"use client";
import React, { useState, useEffect } from "react";
import { Clock, Calendar, Users, Bell } from "lucide-react";
import Link from "next/link";
// Cần đảm bảo đường dẫn này đúng:
import PageTransition from "@/src/pageTransition/pageTransition";

// LƯU Ý QUAN TRỌNG: Các hàm và import sau đây (liên quan đến Firebase)
// đang được đặt trong Client Component ("use client"), điều này KHÔNG được khuyến khích
// trong môi trường Next.js production.
import { db } from "@/src/api/firebase";
import {
  collection,
  getDocs,
  query,
  Query,
  DocumentData,
} from "firebase/firestore";

// --- INTERFACE CHUNG ---
interface RawContest {
  id: string;
  title: string;
  status: string;
  time: string;
  participants: number;
}

interface Contest {
  id: string;
  title: string;
  status: string;
  time: string;
  participants: number;
  buttonText: string;
}

// --- HÀM LẤY DỮ LIỆU (Tái sử dụng logic API Route nhưng chạy trực tiếp) ---
/**
 * @function fetchContestData
 * @description Lấy dữ liệu trực tiếp từ Firestore. Hàm này được gọi trong useEffect
 * và chạy trên trình duyệt.
 */
async function fetchContestData(): Promise<RawContest[]> {
  try {
    const contestsCollectionRef = collection(db, "contests");
    const q: Query<DocumentData> = query(contestsCollectionRef);

    const querySnapshot = await getDocs(q);

    const contests: RawContest[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<RawContest, "id">),
    }));

    return contests;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách contests (Client-side):", error);
    // Vẫn throw lỗi để useEffect bắt được
    throw new Error("Không thể truy cập dữ liệu Firestore.");
  }
}

// --- COMPONENT CHÍNH (Client Component) ---
export default function ContestPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Gọi hàm fetch dữ liệu trực tiếp
        const rawData = await fetchContestData();

        // Định dạng dữ liệu
        const formattedData: Contest[] = rawData.map((item) => {
          let buttonText =
            item.status === "live" ? "Tham gia cuộc thi" : "Đăng ký ngay";
          let timeText =
            item.status === "live"
              ? "Kết thúc trong Xh Ym"
              : `Bắt đầu: ${item.time}`;

          return {
            ...item,
            time: timeText,
            buttonText: buttonText,
          };
        });

        setContests(formattedData);
        setError(null);
      } catch (err) {
        console.error("Lỗi Fetch bị bắt:", err);
        setError("Lỗi tải dữ liệu. Vui lòng kiểm tra console.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-900 font-sans text-slate-300">
        <main className="mx-auto max-w-5xl px-6 py-16">
          {/* --- 2. Hero Section --- */}
          <div className="text-center mb-16">
            <h1 className="text-3xl font-bold text-white md:text-4xl mb-4">
              Các cuộc thi Lập trình
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Kiểm tra kỹ năng của bạn, cạnh tranh với những người khác và giành
              những giải thưởng hấp dẫn trong các cuộc thi lập trình của chúng
              tôi.
            </p>
          </div>

          {/* --- 3. Tabs Navigation --- */}
          <div className="border-b border-slate-800 mb-8 flex gap-8">
            <button className="pb-3 text-sm font-medium text-blue-500 border-b-2 border-blue-500">
              Sắp diễn ra & Trực tiếp
            </button>
            <button className="pb-3 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors">
              Cuộc thi đã qua
            </button>
          </div>

          {/* --- 4. Contest List --- */}
          <div className="space-y-6">
            {loading && (
              <div className="text-center py-10 text-slate-500">
                <div className="flex justify-center items-center space-x-2">
                  <div className="w-4 h-4 rounded-full animate-pulse bg-blue-500"></div>
                  <div className="w-4 h-4 rounded-full animate-pulse bg-blue-500 delay-150"></div>
                  <div className="w-4 h-4 rounded-full animate-pulse bg-blue-500 delay-300"></div>
                </div>
                <p className="mt-3">Đang tải danh sách cuộc thi...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-10 text-red-400 bg-red-900/20 rounded-xl p-6">
                <Bell size={24} className="mx-auto mb-3" />
                <p className="font-semibold">{error}</p>
                <p className="text-sm text-red-500/80 mt-2">
                  Kiểm tra console và đảm bảo cấu hình Firebase của bạn chính
                  xác trên Client-side.
                </p>
              </div>
            )}

            {!loading && !error && contests.length === 0 && (
              <div className="text-center py-10 text-slate-500">
                <Bell size={24} className="mx-auto mb-4" />
                <p>Không tìm thấy cuộc thi nào sắp diễn ra.</p>
              </div>
            )}

            {!loading &&
              !error &&
              contests.map((contest) => (
                <Link
                  key={contest.id}
                  href={`/routes/contests/${contest.id}`}
                  className="block"
                >
                  <div className="rounded-xl bg-slate-800 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm border border-transparent hover:border-slate-700 transition-all">
                    {/* Thông tin cuộc thi (Bên trái) */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        {/* Chấm đỏ nhấp nháy nếu là Live */}
                        {contest.status === "live" && (
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                        )}

                        <h3 className="text-lg md:text-xl font-bold text-white">
                          {contest.title}
                        </h3>

                        {/* Badge "Trực tiếp" */}
                        {contest.status === "live" && (
                          <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-500 border border-red-500/20">
                            Trực tiếp
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          {contest.status === "live" ? (
                            <Clock size={16} />
                          ) : (
                            <Calendar size={16} />
                          )}
                          <span>{contest.time}</span>
                        </div>
                        <div className="hidden sm:block text-slate-600">|</div>
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          <span>
                            {contest.participants}{" "}
                            {contest.status === "live"
                              ? "người tham gia"
                              : "người đã đăng ký"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Nút hành động (Bên phải) */}
                    <div>
                      {contest.status === "live" ? (
                        <button className="w-full md:w-auto rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                          {contest.buttonText}
                        </button>
                      ) : (
                        <button className="w-full md:w-auto rounded-lg bg-slate-700 px-6 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-600 hover:text-white transition-colors">
                          {contest.buttonText}
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </main>

        {/* Footer (Giản lược) */}
        <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
          © 2024 Code Pro. Đã đăng ký Bản quyền.
        </footer>
      </div>
    </PageTransition>
  );
}
