"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
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
    <div className="p-8 bg-slate-950 min-h-screen text-white font-sans relative">
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Thử thách đã lưu
            </h1>
            <p className="text-slate-400 mt-2 text-base">
              Quản lý các danh sách học tập cá nhân của bạn
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-none"
          >
            <FiPlus size={18} /> Tạo danh sách
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
          </div>
        ) : challenges.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center border border-slate-800 bg-slate-900 rounded-2xl py-20 px-4 shadow-sm">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl mb-6">
              <FiBookOpen className="w-16 h-16 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Chưa có danh sách nào
            </h2>
            <p className="text-slate-450 text-center max-w-md mb-8 leading-relaxed text-sm">
              Bạn chưa tạo danh sách nào. Hãy kết hợp các bài tập để tạo nên một
              danh sách riêng biệt cho mình!
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors"
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
                  className="group relative bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-slate-700 transition-colors shadow-sm"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 transition-colors">
                      <FiZap className="text-blue-400 w-5 h-5" />
                    </div>
                    <button
                      onClick={() => handleDelete(ch.id)}
                      className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 mb-2 truncate group-hover:text-blue-400 transition-colors">
                    {ch.name}
                  </h3>

                  <div className="flex justify-between items-end mb-3">
                    <span className="bg-slate-950 border border-slate-800 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {ch.problemIds?.length || 0} PROBLEMS
                    </span>
                    <span className="text-xs font-bold text-green-400">
                      {progress}%
                    </span>
                  </div>

                  {/* Progress Bar Thực tế */}
                  <div className="w-full bg-slate-950 h-1.5 rounded-full mb-5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500 shadow-none"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  <button
                    onClick={() =>
                      router.push(`/avatar/settings/saved/${ch.id}`)
                    }
                    className="w-full flex items-center justify-center gap-2 bg-slate-950 group-hover:bg-blue-600 border border-slate-800 group-hover:border-blue-500 py-2.5 rounded-lg text-sm font-semibold transition-all text-slate-300 group-hover:text-white"
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
