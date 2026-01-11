"use client";

import React, { useEffect, useState } from "react";
import { Calendar, Users, Bell, Trophy, Clock, Zap } from "lucide-react";
import Link from "next/link";
import PageTransition from "@/src/pageTransition/pageTransition";

import { db } from "@/src/api/firebase/firebase";
import { useAuthContext } from "@/src/userHook/context/authContext";

import {
  collection,
  getDocs,
  query,
  Query,
  DocumentData,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

// --- INTERFACE ---
interface RawContest {
  id: string;
  title: string;
  status: string;

  // ví dụ: "November 25, 2025 at 2:59:46 PM UTC+7"
  time: string;

  participants: number;

  length: number;
}

interface Contest extends RawContest {
  dateText: string;
  timeText: string;
  lengthHHMM: string;
  isRegistered: boolean;
  computedStatus: "UPCOMING" | "ONGOING" | "ENDED";
}

// --- FETCH CONTESTS ---
async function fetchContestData(): Promise<RawContest[]> {
  const contestsCollectionRef = collection(db, "contests");
  const q: Query<DocumentData> = query(contestsCollectionRef);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((d) => ({
    ...(d.data() as Omit<RawContest, "id">),
    id: d.id,
  }));
}

// ===== helpers =====
function minutesToHHMM(mins: number) {
  const m = Number(mins);
  if (!Number.isFinite(m) || m <= 0) return "00:00";
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// Parse "November 25, 2025 at 2:59:46 PM UTC+7" -> Date
function parseWeirdTimeString(input: string): Date {
  let s = input.replace(" at ", " ");
  s = s.replace(/UTC([+-]\d+)/, "GMT$1"); // UTC+7 -> GMT+7
  s = s.replace(/\u202F/g, " "); // narrow no-break space (nếu có)

  const d = new Date(s);
  return d;
}

function formatVNDate(d: Date) {
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatVNTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

type ContestStatus = "UPCOMING" | "ONGOING" | "ENDED";

function getContestStatus(start: Date, lengthMinutes: number): ContestStatus {
  const now = new Date();
  const startMs = start.getTime();
  const endMs = startMs + Number(lengthMinutes ?? 0) * 60 * 1000;

  if (now.getTime() < startMs) return "UPCOMING";
  if (now.getTime() >= startMs && now.getTime() <= endMs) return "ONGOING";
  return "ENDED";
}

export default function ContestPage() {
  const { user, loading: authLoading } = useAuthContext();
  const uid = user?.uid ?? null;

  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ONGOING" | "UPCOMING" | "ENDED">(
    "ENDED"
  );

  // Load contests + check registered
  useEffect(() => {
    if (authLoading) return;

    const loadData = async () => {
      try {
        setLoading(true);

        const rawData = await fetchContestData();

        const base: Contest[] = rawData.map((item) => {
          const d = parseWeirdTimeString(item.time);
          const dateText = formatVNDate(d);
          const timeText = formatVNTime(d);
          const lengthHHMM = minutesToHHMM(item.length);
          const computedStatus = getContestStatus(d, item.length);

          return {
            ...item,
            dateText,
            timeText,
            lengthHHMM,
            isRegistered: false,
            computedStatus,
          };
        });

        if (!uid) {
          setContests(base);
          setError(null);
          return;
        }

        const withReg = await Promise.all(
          base.map(async (c) => {
            if (!c.id) return { ...c, isRegistered: false }; // Safety check for bad IDs
            
            const regRef = doc(db, "contests", c.id, "registrations", uid);
            const snap = await getDoc(regRef);
            return { ...c, isRegistered: snap.exists() };
          })
        );

        setContests(withReg);
        setError(null);
      } catch (err) {
        console.error("Lỗi khi tải contests:", err);
        setError("Lỗi tải dữ liệu. Vui lòng kiểm tra console.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authLoading, uid]);

  // Đăng ký nhanh ngay ở list
  const handleQuickRegister = async (
    e: React.MouseEvent,
    contestId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!uid) {
      alert("Vui lòng đăng nhập để đăng ký contest!");
      return;
    }

    try {
      setRegisteringId(contestId);

      const contestRef = doc(db, "contests", contestId);
      const regRef = doc(db, "contests", contestId, "registrations", uid);
      const userRef = doc(db, "users", uid);
      const lbRef = doc(db, "contests", contestId, "leaderboard", uid);

      await runTransaction(db, async (tx) => {
        // ===== READ TẤT CẢ TRƯỚC =====
        const regSnap = await tx.get(regRef);
        if (regSnap.exists()) return;

        const contestSnap = await tx.get(contestRef);
        const userSnap = await tx.get(userRef);
        const lbSnap = await tx.get(lbRef); // ✅ ĐƯA LÊN TRƯỚC

        const currentParticipants = contestSnap.exists()
          ? Number(contestSnap.data()?.participants || 0)
          : 0;

        const username =
          (userSnap.exists() && (userSnap.data() as any).username) ||
          `user_${uid.slice(0, 6)}`;

        // ===== WRITE SAU =====
        tx.set(regRef, { userId: uid, createdAt: serverTimestamp() });

        if (contestSnap.exists()) {
          tx.update(contestRef, { participants: currentParticipants + 1 });
        } else {
          tx.set(
            contestRef,
            { participants: currentParticipants + 1 },
            { merge: true }
          );
        }

        if (!lbSnap.exists()) {
          tx.set(lbRef, {
            uid,
            username,
            acceptedCount: 0,
            penalty: 0,
            acceptedProblems: {},
            attemptedProblems: {},
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      });

      // update UI
      setContests((prev) =>
        prev.map((c) =>
          c.id === contestId
            ? {
                ...c,
                isRegistered: true,
                participants: Number(c.participants || 0) + 1,
              }
            : c
        )
      );
    } catch (error) {
      console.error("Lỗi khi đăng ký contest:", error);
      alert("Không thể đăng ký lúc này. Thử lại sau nhé.");
    } finally {
      setRegisteringId(null);
    }
  };

  const filteredContests = contests.filter(
    (c) => c.computedStatus === activeTab
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900 text-slate-100 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <main className="mx-auto max-w-6xl px-6 py-16 relative z-10">
          {/* Hero Header */}
          <div className="text-center mb-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm border border-red-500/30">
              <Trophy className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-sm text-red-300 font-medium">Cuộc Thi Lập Trình</span>
            </div>

            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-red-400 via-rose-400 to-orange-400 bg-clip-text text-transparent animate-gradient">
              Các cuộc thi Lập trình
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Kiểm tra kỹ năng của bạn, cạnh tranh với những người khác và giành
              những giải thưởng hấp dẫn trong các cuộc thi lập trình
            </p>
          </div>

          {/* Tab Buttons */}
          <div className="flex flex-wrap gap-3 justify-center mb-10 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-3 max-w-2xl mx-auto">
            <button
              onClick={() => setActiveTab("ONGOING")}
              className={`flex-1 min-w-[120px] px-5 py-3 rounded-xl text-sm font-semibold border transition-all ${
                activeTab === "ONGOING"
                  ? "bg-gradient-to-r from-red-500 to-orange-500 text-white border-red-500/50 shadow-lg shadow-red-500/30"
                  : "bg-transparent text-slate-400 border-white/10 hover:bg-white/5"
              }`}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              Đang diễn ra
            </button>

            <button
              onClick={() => setActiveTab("UPCOMING")}
              className={`flex-1 min-w-[120px] px-5 py-3 rounded-xl text-sm font-semibold border transition-all ${
                activeTab === "UPCOMING"
                  ? "bg-gradient-to-r from-red-500 to-orange-500 text-white border-red-500/50 shadow-lg shadow-red-500/30"
                  : "bg-transparent text-slate-400 border-white/10 hover:bg-white/5"
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Sắp diễn ra
            </button>

            <button
              onClick={() => setActiveTab("ENDED")}
              className={`flex-1 min-w-[120px] px-5 py-3 rounded-xl text-sm font-semibold border transition-all ${
                activeTab === "ENDED"
                  ? "bg-gradient-to-r from-red-500 to-orange-500 text-white border-red-500/50 shadow-lg shadow-red-500/30"
                  : "bg-transparent text-slate-400 border-white/10 hover:bg-white/5"
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              Đã kết thúc
            </button>
          </div>

          {/* Contest List */}
          <div className="space-y-5">
            {(loading || authLoading) && (
              <div className="text-center py-20 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
                <div className="inline-block w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400">Đang tải danh sách cuộc thi...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-10 backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                <Bell size={32} className="mx-auto mb-3 text-red-400" />
                <p className="font-semibold text-red-400">{error}</p>
              </div>
            )}

            {!loading &&
              !authLoading &&
              !error &&
              filteredContests.length === 0 && (
                <div className="text-center py-20 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
                  <Trophy size={48} className="mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400 text-lg">
                    Không có cuộc thi nào trong mục này.
                  </p>
                </div>
              )}

            {!loading &&
              !authLoading &&
              !error &&
              filteredContests.map((contest, index) => (
                <Link
                  key={contest.id}
                  href={`/routes/contests/${contest.id}`}
                  className="block"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl hover:shadow-2xl hover:shadow-red-500/20 hover:border-red-500/50 hover:bg-white/10 transition-all duration-300 hover:scale-[1.01] animate-fadeIn">
                    {/* Left */}
                    <div className="space-y-4 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
                          <Trophy className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-red-300 transition-colors">
                            {contest.title}
                          </h3>

                          {/* Status Badge */}
                          <div className="inline-flex items-center gap-2 mb-3">
                            {contest.computedStatus === "ONGOING" && (
                              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold uppercase flex items-center gap-1.5 shadow-lg">
                                <Zap className="w-3 h-3" />
                                Đang diễn ra
                              </span>
                            )}
                            {contest.computedStatus === "UPCOMING" && (
                              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold uppercase flex items-center gap-1.5 shadow-lg">
                                <Clock className="w-3 h-3" />
                                Sắp diễn ra
                              </span>
                            )}
                            {contest.computedStatus === "ENDED" && (
                              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-slate-600 to-slate-700 text-slate-300 text-xs font-bold uppercase shadow-lg">
                                Đã kết thúc
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Info Badges */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-3 py-2 rounded-lg bg-red-500/10 text-red-300 border border-red-500/30 font-medium">
                          <Calendar className="w-3 h-3 inline mr-1.5" />
                          {contest.dateText}
                        </span>

                        <span className="px-3 py-2 rounded-lg bg-orange-500/10 text-orange-300 border border-orange-500/30 font-medium">
                          <Clock className="w-3 h-3 inline mr-1.5" />
                          {contest.timeText}
                        </span>

                        <span className="px-3 py-2 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 font-medium">
                          ⏳ {contest.lengthHHMM}
                        </span>

                        <span className="px-3 py-2 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium">
                          <Users className="w-3 h-3 inline mr-1.5" />
                          {contest.participants} người
                        </span>
                      </div>
                    </div>

                    {/* Right Button */}
                    <div className="md:ml-6">
                      {contest.computedStatus === "ENDED" ? (
                        <button
                          disabled
                          className="w-full md:w-auto rounded-xl bg-slate-800/50 px-6 py-3 text-sm font-semibold text-slate-500 border border-slate-700/50 cursor-not-allowed"
                        >
                          Đã kết thúc
                        </button>
                      ) : contest.isRegistered ? (
                        <button
                          disabled
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className="w-full md:w-auto rounded-xl bg-green-500/20 px-6 py-3 text-sm font-semibold text-green-400 border border-green-500/30 cursor-not-allowed flex items-center gap-2 justify-center"
                        >
                          <Trophy className="w-4 h-4" />
                          Đã tham gia
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleQuickRegister(e, contest.id)}
                          disabled={registeringId === contest.id}
                          className={`w-full md:w-auto rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-6 py-3 text-sm font-semibold text-white hover:from-red-500 hover:to-orange-500 transition-all shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:scale-105 ${
                            registeringId === contest.id
                              ? "opacity-80 cursor-wait"
                              : ""
                          }`}
                        >
                          {registeringId === contest.id
                            ? "Đang đăng ký..."
                            : "Đăng ký ngay"}
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </main>

        <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500 relative z-10 backdrop-blur-xl">
          © 2024 Code Pro. Đã đăng ký Bản quyền.
        </footer>

        <style jsx>{`
          @keyframes gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-gradient {
            background-size: 200% 200%;
            animation: gradient 3s ease infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out forwards;
          }
          .delay-1000 { animation-delay: 1s; }
          .delay-2000 { animation-delay: 2s; }
        `}</style>
      </div>
    </PageTransition>
  );
}
