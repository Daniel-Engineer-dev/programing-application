"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/src/api/firebase/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import ChallengeModal from "./ChallengeModal";
import {
  FiPlus,
  FiTrash2,
  FiBookOpen,
  FiChevronRight,
  FiZap,
} from "react-icons/fi";

export default function SaveChallengesPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [solvedProblemIds, setSolvedProblemIds] = useState<string[]>([]); // Lưu ID các bài đã giải
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        fetchData(user.uid);
      } else {
        setUserId(null);
        setChallenges([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async (uid: string) => {
    setLoading(true);
    try {
      // 1. Lấy danh sách thử thách
      const challengeSnap = await getDocs(
        collection(db, "users", uid, "savechallenges")
      );
      const challengesData = challengeSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 2. Lấy danh sách các bài tập đã Accepted của User
      const submissionSnap = await getDocs(
        query(
          collection(db, "users", uid, "submissions"),
          where("status", "==", "Accepted")
        )
      );
      const solvedIds = submissionSnap.docs.map((doc) => doc.data().problemId);

      setSolvedProblemIds(solvedIds);
      setChallenges(challengesData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (challengeId: string) => {
    if (userId && confirm("Bạn muốn xóa danh sách này?")) {
      await deleteDoc(doc(db, "users", userId, "savechallenges", challengeId));
      fetchData(userId);
    }
  };

  // Hàm tính % hoàn thành
  const calculateProgress = (problemIds: string[]) => {
    if (!problemIds || problemIds.length === 0) return 0;
    const solvedCount = problemIds.filter((id) =>
      solvedProblemIds.includes(id)
    ).length;
    return Math.round((solvedCount / problemIds.length) * 100);
  };

  if (!userId && !loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617] text-slate-400">
        Vui lòng đăng nhập để tiếp tục.
      </div>
    );

  return (
    <div className="p-8 bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-900 min-h-screen text-white font-sans relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent tracking-tight">
              Thử thách đã lưu
            </h1>
            <p className="text-slate-400 mt-3 text-lg">
              Quản lý các danh sách học tập cá nhân của bạn
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 px-6 py-3.5 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-2xl hover:shadow-blue-500/50"
          >
            <FiPlus size={20} /> Tạo danh sách
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
          </div>
        ) : challenges.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center border border-blue-500/20 bg-gradient-to-br from-slate-900/50 to-blue-900/20 backdrop-blur-xl rounded-3xl py-28 px-4 shadow-2xl">
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-8 rounded-3xl mb-8 border border-blue-500/30 shadow-lg shadow-blue-500/10">
              <FiBookOpen className="w-20 h-20 text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
              Chưa có danh sách nào
            </h2>
            <p className="text-slate-400 text-center max-w-md mb-10 leading-relaxed text-lg">
              Bạn chưa tạo danh sách nào. Hãy kết hợp các bài tập để tạo nên một
              danh sách riêng biệt cho mình!
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-10 py-4 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-2xl hover:shadow-blue-500/50"
            >
              Bắt đầu ngay
            </button>
          </div>
        ) : (
          /* Challenge Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((ch) => {
              const progress = calculateProgress(ch.problemIds || []);
              return (
                <div
                  key={ch.id}
                  className="group relative bg-gradient-to-br from-slate-900/50 to-blue-900/20 border border-blue-500/30 p-6 rounded-2xl hover:border-blue-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 backdrop-blur-xl"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className="p-3.5 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl group-hover:from-blue-500/20 group-hover:to-cyan-500/20 border border-blue-500/20 transition-all">
                      <FiZap className="text-blue-400 w-7 h-7" />
                    </div>
                    <button
                      onClick={() => handleDelete(ch.id)}
                      className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-2.5 rounded-lg transition-all"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>

                  <h3 className="text-xl font-bold text-slate-100 mb-3 truncate group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-400 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                    {ch.name}
                  </h3>

                  <div className="flex justify-between items-end mb-3">
                    <span className="bg-gradient-to-r from-slate-800 to-blue-900/30 border border-blue-500/20 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-blue-400">
                      {ch.problemIds?.length || 0} PROBLEMS
                    </span>
                    <span className="text-sm font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                      {progress}%
                    </span>
                  </div>

                  {/* Progress Bar Thực tế */}
                  <div className="w-full bg-slate-800/50 h-2 rounded-full mb-6 overflow-hidden border border-blue-500/20">
                    <div
                      className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  <button
                    onClick={() =>
                      router.push(`/routes/avatar/settings/saved/${ch.id}`)
                    }
                    className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-slate-800 to-blue-900/40 group-hover:from-blue-600 group-hover:to-cyan-600 border border-blue-500/20 group-hover:border-blue-500/40 py-3.5 rounded-xl font-bold transition-all group-hover:shadow-lg group-hover:shadow-blue-500/30"
                  >
                    Tiếp tục học <FiChevronRight size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <ChallengeModal
          onClose={() => setIsModalOpen(false)}
          onRefresh={() => fetchData(userId!)}
        />
      )}
    </div>
  );
}
