"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/src/api/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import {
  FiChevronLeft,
  FiPlay,
  FiCheckCircle,
  FiPlus,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import AddProblemModal from "@/src/Component/SaveChallenges/AddProblemModal";

export default function ChallengeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [challenge, setChallenge] = useState<any>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // State quản lý mở modal thêm bài

  const fetchChallengeData = async (uid: string) => {
    try {
      const subSnap = await getDocs(
        query(
          collection(db, "users", uid, "submissions"),
          where("status", "==", "Accepted")
        )
      );
      const solved = subSnap.docs.map((doc) => doc.data().problemId);
      setCompletedIds(solved);

      const chalDoc = await getDoc(
        doc(db, "users", uid, "savechallenges", id as string)
      );
      if (chalDoc.exists()) {
        const data = chalDoc.data();
        setChallenge(data);
        if (data.problemIds?.length > 0) {
          const allProbsSnap = await getDocs(collection(db, "problems"));
          const filtered = allProbsSnap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((p) => data.problemIds.includes(p.id));
          setProblems(filtered);
        } else {
          setProblems([]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchChallengeData(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [id]);

  // HÀM XÓA BÀI TẬP KHỎI THỬ THÁCH
  const removeProblem = async (problemId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    if (confirm("Bạn có chắc chắn muốn xóa bài tập này khỏi thử thách?")) {
      try {
        const chalRef = doc(
          db,
          "users",
          user.uid,
          "savechallenges",
          id as string
        );
        await updateDoc(chalRef, {
          problemIds: arrayRemove(problemId),
        });
        // Cập nhật state UI nhanh
        setProblems((prev) => prev.filter((p) => p.id !== problemId));
        setChallenge((prev: any) => ({
          ...prev,
          problemIds: prev.problemIds.filter(
            (pid: string) => pid !== problemId
          ),
        }));
      } catch (e) {
        console.error("Lỗi khi xóa bài tập:", e);
      }
    }
  };

  // Logic tính toán thống kê (Giữ nguyên)
  const totalSolved = problems.filter((p) =>
    completedIds.includes(p.id)
  ).length;
  const stats = {
    easy: {
      solved: problems.filter(
        (p) =>
          p.difficulty?.toLowerCase() === "easy" && completedIds.includes(p.id)
      ).length,
      total: problems.filter((p) => p.difficulty?.toLowerCase() === "easy")
        .length,
    },
    medium: {
      solved: problems.filter(
        (p) =>
          p.difficulty?.toLowerCase() === "medium" &&
          completedIds.includes(p.id)
      ).length,
      total: problems.filter((p) => p.difficulty?.toLowerCase() === "medium")
        .length,
    },
    hard: {
      solved: problems.filter(
        (p) =>
          p.difficulty?.toLowerCase() === "hard" && completedIds.includes(p.id)
      ).length,
      total: problems.filter((p) => p.difficulty?.toLowerCase() === "hard")
        .length,
    },
  };

  const percentage =
    problems.length > 0 ? (totalSolved / problems.length) * 100 : 0;
  const radius = 45;
  const dashArray = 2 * Math.PI * radius;
  const dashOffset = dashArray - (percentage / 100) * dashArray;

  if (loading)
    return (
      <div className="p-8 text-white bg-[#020617] min-h-screen">
        Đang tải...
      </div>
    );

  return (
    <div className="p-8 bg-[#020617] min-h-screen text-white font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm font-medium"
          >
            <FiChevronLeft /> Quay lại
          </button>

          {/* NÚT THÊM BÀI TẬP MỚI */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl font-bold transition text-sm"
          >
            <FiPlus /> Thêm bài tập
          </button>
        </div>

        {/* TOP SECTION: THÔNG TIN VÀ TIẾN ĐỘ */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-[2rem] p-8 shadow-2xl mb-10">
          <div className="flex flex-col md:flex-row gap-10 items-start md:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-2xl shadow-inner">
                  ⭐
                </div>
                <div>
                  <h1 className="text-4xl font-bold uppercase text-white tracking-tight">
                    {challenge?.name}
                  </h1>
                  <p className="text-slate-400 text-sm font-medium">
                    {problems.length} bài tập
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 bg-slate-900/50 p-6 rounded-[1.5rem] border border-slate-800/50">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    stroke="#1e293b"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    stroke="#10b981"
                    strokeWidth="7"
                    fill="transparent"
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black">
                    {totalSolved}
                    <span className="text-slate-500 text-sm">
                      /{problems.length}
                    </span>
                  </span>
                  <span className="text-[9px] text-emerald-400 font-black tracking-widest uppercase">
                    Solved
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-[100px]">
                {Object.entries(stats).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center text-[11px] font-bold"
                  >
                    <span
                      className={
                        key === "easy"
                          ? "text-emerald-400"
                          : key === "medium"
                          ? "text-yellow-500"
                          : "text-rose-500"
                      }
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </span>
                    <span className="text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md">
                      {value.solved}/{value.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BẢNG DANH SÁCH BÀI TẬP */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase tracking-[0.2em] border-b border-slate-800/50 bg-slate-900/50">
                <th className="px-8 py-6 font-bold text-white">Trạng thái</th>
                <th className="px-8 py-6 font-bold text-white">Bài tập</th>
                <th className="px-8 py-6 font-bold text-white text-center">
                  Độ khó
                </th>
                <th className="px-8 py-6 font-bold text-white text-right">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {problems.map((prob, index) => {
                const isSolved = completedIds.includes(prob.id);
                return (
                  <tr
                    key={prob.id}
                    className="border-b border-slate-800/30 hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-8 py-6">
                      {isSolved ? (
                        <div className="flex items-center justify-center w-6 h-6 bg-emerald-500/20 rounded-full animate-pulse">
                          <FiCheckCircle className="text-emerald-400 w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-slate-700" />
                      )}
                    </td>
                    <td className="px-8 py-6 font-bold">
                      <span
                        className={
                          isSolved ? "text-emerald-400/80" : "text-slate-200"
                        }
                      >
                        {index + 1}. {prob.title || prob.id}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-wider">
                      <span
                        className={
                          prob.difficulty?.toLowerCase() === "easy"
                            ? "text-emerald-400"
                            : prob.difficulty?.toLowerCase() === "medium"
                            ? "text-yellow-500"
                            : "text-rose-500"
                        }
                      >
                        {prob.difficulty || "EASY"}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() =>
                            router.push(`/routes/problems/${prob.id}`)
                          }
                          className="bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white w-9 h-9 rounded-xl transition-all flex items-center justify-center"
                        >
                          <FiPlay className="fill-current w-3.5 h-3.5" />
                        </button>

                        {/* NÚT XÓA TỪNG BÀI TẬP */}
                        <button
                          onClick={() => removeProblem(prob.id)}
                          className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white w-9 h-9 rounded-xl transition-all flex items-center justify-center"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {problems.length === 0 && (
            <div className="py-20 text-center text-slate-500 italic">
              Thử thách này hiện chưa có bài tập nào.
            </div>
          )}
        </div>
      </div>

      {/* MODAL THÊM BÀI TẬP */}
      {isModalOpen && (
        <AddProblemModal
          onClose={() => setIsModalOpen(false)}
          onRefresh={() => fetchChallengeData(auth.currentUser?.uid || "")}
          challengeId={id as string}
          existingIds={challenge?.problemIds || []} // Truyền list ID đã có để ẩn đi
        />
      )}
    </div>
  );
}
