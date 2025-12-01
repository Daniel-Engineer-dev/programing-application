import React from "react";
import {
  ChevronRight,
  Calendar,
  Users,
  Send,
  Trophy,
  BookOpen,
  Frown,
} from "lucide-react";
import Link from "next/link";

// LƯU Ý QUAN TRỌNG: Các import Firebase này sẽ chạy trên SERVER
// vì component chính là Server Component.
import { db } from "@/src/api/firebase";
import {
  collection,
  doc,
  getDoc,
  query,
  orderBy,
  getDocs,
  DocumentData,
  Query,
} from "firebase/firestore";

// --- INTERFACE CHUNG ---
interface Problem {
  id: string;
  title: string;
}

interface ContestDetail {
  id: string;
  title: string;
  status: string;
  participants: number;
  time: string;
  description: string;
  problems: Problem[];
}

// Định nghĩa props để nhận tham số dynamic route
interface ContestDetailPageProps {
  params: {
    id: string; // Tên dynamic segment phải khớp với thư mục [id]
  };
}

// --- LOGIC FETCH DỮ LIỆU (Thay thế cho API Route) ---
/**
 * @function fetchContestDetailsServer
 * @description Lấy dữ liệu chi tiết Contest và Problems từ Firestore.
 * Chạy trên SERVER.
 */
async function fetchContestDetailsServer(
  contestId: string
): Promise<ContestDetail | null> {
  if (!contestId) {
    return null;
  }

  try {
    // 1. Lấy dữ liệu Contest Chính (Document)
    const contestRef = doc(db, "contests", contestId);
    const contestDoc = await getDoc(contestRef);

    if (!contestDoc.exists()) {
      console.warn(`Contest with ID ${contestId} not found`);
      return null;
    }

    const data = contestDoc.data();

    // TẠO OBJECT VÀ LẤY TRƯỜNG PROBLEMS TRỰC TIẾP TỪ DATA
    const contestDetail: ContestDetail = {
      id: contestDoc.id,
      title: data.title,
      status: data.status,
      participants: data.participants,
      time: data.time,
      description: data.description,

      // Lấy danh sách đề bài trực tiếp từ trường 'problems' (dạng Array)
      // Loại bỏ logic Subcollection không cần thiết.
      problems: Array.isArray(data.problems)
        ? data.problems.map((p: any) => ({
            // Đảm bảo mapping các trường con id và title
            id: p.id,
            title: p.title,
          }))
        : [],
    };

    return contestDetail;
  } catch (error) {
    console.error(
      `Lỗi khi lấy dữ liệu contest ${contestId} từ Firebase (Server):`,
      error
    );
    return null;
  }
}

// --- SERVER COMPONENT CHÍNH ---
export default async function ContestDetailPage({
  params,
}: ContestDetailPageProps) {
  const { id: contestId } = await params;

  // Gọi hàm fetch data trực tiếp trên server
  const contestDetails: ContestDetail | null = await fetchContestDetailsServer(
    contestId
  );

  if (!contestDetails) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <Frown size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">
          Không tìm thấy Contest
        </h1>
        <p className="text-slate-400">
          ID Contest: {contestId} không tồn tại hoặc lỗi kết nối.
        </p>
        <Link
          href="/routes/contests"
          className="mt-6 text-blue-400 hover:text-blue-300 transition-colors underline"
        >
          Quay lại danh sách Contest
        </Link>
      </div>
    );
  }

  // Mẫu component cho một dòng bài toán
  const ProblemItem = ({ id, title }: { id: string; title: string }) => (
    <Link
      href={`/problems/${id}`}
      className="flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
    >
      <span className="font-mono font-bold text-lg text-white w-10">{id}</span>
      <span className="flex-1 text-slate-300 truncate">{title}</span>
      <ChevronRight size={18} className="text-slate-400 ml-4" />
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-300">
      <main className="mx-auto max-w-6xl px-6 py-16">
        {/* 1. HEADER & META */}
        <div className="bg-slate-800 p-8 rounded-xl mb-10 shadow-lg border border-slate-700">
          <h1 className="text-3xl font-bold text-white mb-4">
            {contestDetails.title}
          </h1>

          {/* Meta Data */}
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>{contestDetails.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>{contestDetails.participants} người đã đăng ký</span>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                contestDetails.status === "live"
                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                  : "bg-blue-500/10 text-blue-500 border-blue-500/20"
              }`}
            >
              {contestDetails.status === "live"
                ? "Đang diễn ra"
                : "Sắp diễn ra"}
            </span>
          </div>
        </div>

        {/* 2. TAB NAVIGATION (Điều hướng giữa các phần) */}
        <div className="border-b border-slate-700 mb-8 overflow-x-auto">
          <div className="flex whitespace-nowrap space-x-6">
            <Link
              href={`/contests/${contestId}?tab=overview`}
              className="flex items-center gap-2 pb-3 text-sm font-medium text-blue-500 border-b-2 border-blue-500"
            >
              <BookOpen size={16} /> Tổng quan
            </Link>
            <Link
              href={`/contests/${contestId}?tab=problems`}
              className="flex items-center gap-2 pb-3 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Send size={16} /> Bài nộp
            </Link>
            <Link
              href={`/contests/${contestId}?tab=leaderboard`}
              className="flex items-center gap-2 pb-3 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Trophy size={16} /> Bảng xếp hạng
            </Link>
          </div>
        </div>

        {/* 3. NỘI DUNG CHI TIẾT (Giả định đang ở tab Tổng quan) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cột chính (Mô tả) */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold text-white">Giới thiệu</h2>
            <div className="text-slate-300 leading-relaxed border-l-4 border-blue-500 pl-4 bg-slate-800 p-4 rounded-lg text-justify">
              <p>{contestDetails.description}</p>
            </div>

            <h2 className="text-2xl font-semibold text-white pt-4">
              Thông tin
            </h2>
            <ul className="list-disc list-inside space-y-2 text-slate-400">
              <li>Thời gian: 5 giờ liên tục.</li>
              <li>
                Số lượng bài: {contestDetails.problems.length} bài toán lập
                trình.
              </li>
              <li>Ngôn ngữ: C++, Java, Python.</li>
            </ul>
          </div>

          {/* Cột bên (Đề bài và Xếp hạng nhanh) */}
          <div className="md:col-span-1 space-y-8">
            {/* Khu vực Đề bài */}
            <div className="bg-slate-800 p-5 rounded-xl shadow-md space-y-3 border border-slate-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                Danh sách Đề bài
              </h3>
              <div className="space-y-2">
                {contestDetails.problems.length > 0 ? (
                  contestDetails.problems.map((p) => (
                    <ProblemItem key={p.id} id={p.id} title={p.title} />
                  ))
                ) : (
                  <p className="text-slate-500 text-sm italic">
                    Chưa có đề bài nào được thêm.
                  </p>
                )}
              </div>
            </div>

            {/* Nút đăng ký/tham gia nhanh */}
            <button
              className={`w-full py-3 rounded-xl text-white font-bold transition-all shadow-lg ${
                contestDetails.status === "live"
                  ? "bg-red-600 hover:bg-red-700 shadow-red-600/30"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"
              }`}
            >
              {contestDetails.status === "live"
                ? "Tham gia ngay"
                : "Đăng ký Contest"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
