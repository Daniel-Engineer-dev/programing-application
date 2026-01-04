"use client";

import React, { useEffect, useState } from "react";
import { Calendar, Users, Bell } from "lucide-react";
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
    id: d.id,
    ...(d.data() as Omit<RawContest, "id">),
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
      <div className="min-h-screen bg-slate-900 font-sans text-slate-300">
        <main className="mx-auto max-w-5xl px-6 py-16">
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

          <div className="flex flex-wrap gap-2 justify-center mb-8">
            <button
              onClick={() => setActiveTab("ONGOING")}
              className={`px-4 py-2 rounded-lg text-sm border transition ${
                activeTab === "ONGOING"
                  ? "bg-white/10 text-white border-slate-600"
                  : "bg-transparent text-slate-400 border-slate-800 hover:border-slate-700"
              }`}
            >
              Đang diễn ra
            </button>

            <button
              onClick={() => setActiveTab("UPCOMING")}
              className={`px-4 py-2 rounded-lg text-sm border transition ${
                activeTab === "UPCOMING"
                  ? "bg-white/10 text-white border-slate-600"
                  : "bg-transparent text-slate-400 border-slate-800 hover:border-slate-700"
              }`}
            >
              Sắp diễn ra
            </button>

            <button
              onClick={() => setActiveTab("ENDED")}
              className={`px-4 py-2 rounded-lg text-sm border transition ${
                activeTab === "ENDED"
                  ? "bg-white/10 text-white border-slate-600"
                  : "bg-transparent text-slate-400 border-slate-800 hover:border-slate-700"
              }`}
            >
              Đã kết thúc
            </button>
          </div>

          <div className="space-y-6">
            {(loading || authLoading) && (
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
              </div>
            )}

            {!loading &&
              !authLoading &&
              !error &&
              filteredContests.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-white">
                  Không có cuộc thi nào trong mục này.
                </div>
              )}

            {!loading &&
              !authLoading &&
              !error &&
              filteredContests.map((contest) => (
                <Link
                  key={contest.id}
                  href={`/routes/contests/${contest.id}`}
                  className="block"
                >
                  <div className="rounded-xl bg-slate-800 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm border border-transparent hover:border-slate-700 transition-all">
                    {/* Left */}
                    <div className="space-y-3">
                      <h3 className="text-lg md:text-xl font-bold text-white">
                        {contest.title}
                      </h3>

                      {/* CHIP/BADGE nổi bật */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          <span className="font-semibold text-blue-400">
                            📅 Bắt đầu:
                          </span>{" "}
                          {contest.dateText}
                        </span>

                        <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          <span className="font-semibold text-emerald-400">
                            ⏰ Giờ:
                          </span>{" "}
                          {contest.timeText}
                        </span>

                        <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          <span className="font-semibold text-purple-400">
                            ⏳ Thời gian:
                          </span>{" "}
                          {contest.lengthHHMM}
                        </span>

                        <span className="px-2 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20">
                          <span className="font-semibold text-sky-400">👥</span>{" "}
                          {contest.participants} người đăng ký
                        </span>
                      </div>
                    </div>

                    {/* Right Button */}
                    <div>
                      {contest.computedStatus === "ENDED" ? (
                        <button
                          disabled
                          className="w-full md:w-auto rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-500 border border-slate-700 cursor-not-allowed"
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
                          className="w-full md:w-auto rounded-lg bg-slate-700/60 px-6 py-2.5 text-sm font-medium text-slate-300 border border-slate-600 cursor-not-allowed"
                        >
                          Đã tham gia
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleQuickRegister(e, contest.id)}
                          disabled={registeringId === contest.id}
                          className={`w-full md:w-auto rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 ${
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

        <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
          © 2024 Code Pro. Đã đăng ký Bản quyền.
        </footer>
      </div>
    </PageTransition>
  );
}
