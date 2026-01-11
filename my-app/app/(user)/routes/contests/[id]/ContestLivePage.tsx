"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  BookOpen,
  Send,
  Trophy,
  ChevronRight,
  List,
} from "lucide-react";
import Link from "next/link";
import { ContestDetail } from "./lib/fetchContest";
import { db } from "@/src/api/firebase/firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import TabLink from "./components/TabLink";
import OverviewTab from "./components/OverviewTab";
import SubmissionTab from "./components/SubmissionTab";
import LeaderboardTab from "./components/LeaderboardTab";
import AllSubmissionsTab from "./components/AllSubmissionsTab";
import RegisterContestButton from "./components/RegisterContestButton";
import { useAuth } from "@/src/userHook/hooks/userAuth";

// --- Helper Functions ---
function minutesToHHMM(mins: number) {
  const m = Number(mins);
  if (!Number.isFinite(m) || m <= 0) return "00:00";
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function parseWeirdTimeString(input: string): Date {
  if (!input) return new Date();
  let s = input.replace(" at ", " ");
  s = s.replace(/UTC([+-]\d+(?::\d+)?)/, "GMT$1");
  s = s.replace(/\u202F/g, " ");
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

function getContestStatus(start: Date, lengthMinutes: number, now: Date): ContestStatus {
  const startMs = start.getTime();
  const endMs = startMs + Number(lengthMinutes ?? 0) * 60 * 1000;

  if (now.getTime() < startMs) return "UPCOMING";
  if (now.getTime() >= startMs && now.getTime() <= endMs) return "ONGOING";
  return "ENDED";
}

// --- Main Component ---
export default function ContestLivePage({
  initialContest,
  serverNow,
}: {
  initialContest: ContestDetail;
  serverNow?: number;
}) {
  const [contest, setContest] = useState<ContestDetail>(initialContest);
  // Use serverNow for initial state to match SSR, avoiding hydration mismatch
  const [now, setNow] = useState(new Date(serverNow || Date.now())); // State for real-time clock
  const { user } = useAuth();
  
  // Registration State
  const [isRegistered, setIsRegistered] = useState(false);

  // Virtual State
  const [virtualState, setVirtualState] = useState<{
      isVirtual: boolean;
      virtualStart: number;
  }>({ isVirtual: false, virtualStart: 0 });
  
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "overview";
  const highlight = searchParams.get("highlight");

  // Real-time clock ticker
  useEffect(() => {
    const interval = setInterval(() => {
        setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Check Registration Status
  useEffect(() => {
    if (!user?.uid || !contest.id) {
        setIsRegistered(false);
        return;
    }
    const regRef = doc(db, "contests", contest.id, "registrations", user.uid);
    const unsub = onSnapshot(regRef, (snap) => {
        setIsRegistered(snap.exists());
    });
    return () => unsub();
  }, [user?.uid, contest.id]);

  // Check Virtual Status & Start Time
  useEffect(() => {
    if (!user?.uid || !contest.id) return;
    
    const vRef = doc(db, "contests", contest.id, "virtual_participations", user.uid);
    const unsub = onSnapshot(vRef, { includeMetadataChanges: true }, (snap) => {
        if (snap.exists()) {
            const data = snap.data();
            // Check if explicitly ONGOING
            if (data.status === "ONGOING") {
                 let vStart = 0;
                 if (data.startTime?.toMillis) vStart = data.startTime.toMillis();
                 else if (data.startTime) vStart = new Date(data.startTime).getTime();
                 
                 setVirtualState({
                     isVirtual: true,
                     virtualStart: vStart
                 });
            } else {
                setVirtualState({ isVirtual: false, virtualStart: 0 });
            }
        } else {
            setVirtualState({ isVirtual: false, virtualStart: 0 });
        }
    });

    return () => unsub();
  }, [user?.uid, contest.id]);

  // Real-time subscription to contest data (Keep existing)
  useEffect(() => {
    if (!initialContest?.id) return;
    // ... (keep existing implementation or assume it's stable)
    const unsub = onSnapshot(doc(db, "contests", initialContest.id), (docSnap) => {
        if (docSnap.exists()) {
             // ... update contest state
             const data = docSnap.data();
             setContest(prev => ({ ...prev, ...data, id: docSnap.id } as ContestDetail));
        }
    });
    return () => unsub();
  }, [initialContest.id]);

// --- Helper for Countdown ---
function formatDuration(ms: number) {
  if (ms < 0) return "00:00:00";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)));
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

  // --- Calculations ---
  // Global Times
  const d = parseWeirdTimeString(contest.time);
  const dateText = formatVNDate(d);
  const timeText = formatVNTime(d);
  const lengthHHMM = minutesToHHMM(contest.length);

  const globalStartMs = d.getTime();
  const lengthMs = Number(contest.length ?? 0) * 60 * 1000;
  const globalEndMs = globalStartMs + lengthMs;
  
  const globalStatus = getContestStatus(d, contest.length, now);

  // Determine Effective Status & Times
  let effectiveStatus: ContestStatus = globalStatus;
  let effectiveStartMs = globalStartMs;
  let effectiveEndMs = globalEndMs;

  if (virtualState.isVirtual && virtualState.virtualStart > 0) {
      // If virtual is active, we override logic
      effectiveStartMs = virtualState.virtualStart;
      effectiveEndMs = effectiveStartMs + lengthMs;
      
      // Calculate status based on user's specific timer
      if (now.getTime() < effectiveStartMs) effectiveStatus = "UPCOMING"; // Unlikely for virtual but possible
      else if (now.getTime() > effectiveEndMs) effectiveStatus = "ENDED";
      else effectiveStatus = "ONGOING";
  }

  const isUpcoming = effectiveStatus === "UPCOMING";
  const safeTab = isUpcoming ? "overview" : tab;

  // Render Countdown Badge
  const renderCountdownBadge = () => {
      // Hides if Ended
      if (effectiveStatus === "ENDED") return null;
      
      const isOngoing = effectiveStatus === "ONGOING";
      const diff = isOngoing ? effectiveEndMs - now.getTime() : effectiveStartMs - now.getTime();
      
      // If diff is negative but status wasn't caught yet (race condition), hide or show 0
      if (diff < 0) return null;

      const label = isOngoing ? "Còn lại" : "Bắt đầu trong";
      const colorClass = isOngoing ? "text-emerald-400" : "text-blue-400";
      const bgClass = isOngoing ? "bg-emerald-500/10 border-emerald-500/20" : "bg-blue-500/10 border-blue-500/20";
      const icon = isOngoing ? "⏳" : "⏱️";

      return (
          <span className={`px-2 py-1 rounded-lg ${bgClass} ${colorClass} border inline-flex items-center gap-2 animate-pulse`}>
              <span className="font-semibold">{icon} {label}:</span>
              <span className="font-mono font-bold tabular-nums">{formatDuration(diff)}</span>
          </span>
      );
  };
  
  // Logic to show submission tabs
  // Show if ONGOING (Real or Virtual)
  // We already calculated effectiveStatus to handle this.
  // If virtual ended locally, effectiveStatus becomes ENDED -> Tab Hidden.
  const showSubmissionTabs = effectiveStatus === "ONGOING";

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-300 animate-in fade-in duration-500">
      <main className="mx-auto max-w-[95%] px-6 py-16">
        <div className="bg-slate-800 p-8 rounded-xl mb-10 shadow-lg border border-slate-700 pr-24"> {/* Added pr-24 (~6rem/96px) to header only */}
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-white transition-all">{contest.title}</h1>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 inline-flex items-center gap-2">
                <span className="font-semibold text-blue-400">📅 Bắt đầu:</span>
                <span>{dateText}</span>
              </span>

              <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <span className="font-semibold text-emerald-400">⏰ Giờ:</span>{" "}
                {timeText}
              </span>

              <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
                <span className="font-semibold text-purple-400">
                  ⏳ Thời gian:
                </span>{" "}
                {lengthHHMM}
              </span>

              <span className="px-2 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20">
                <span className="font-semibold text-sky-400">👥</span>{" "}
                {contest.participants} người đăng ký
              </span>

              {/* Real-time Countdown Badge */}
              {renderCountdownBadge()}
            </div>
          </div>
        </div>

        <div className="flex gap-6 border-b border-slate-700 mb-8 overflow-x-auto">
            <TabLink
              href="?tab=overview"
              active={safeTab === "overview"}
              label="Tổng quan"
              icon={<BookOpen size={16} />}
            />
            {!isUpcoming && (
              <>
                {/* Submit Tab: Only show if ONGOING (Real or Virtual) AND Registered/Virtual */}
                {effectiveStatus === "ONGOING" && (isRegistered || virtualState.isVirtual) && (
                    <TabLink
                    href="?tab=submissions"
                    active={safeTab === "submissions"}
                    label="Nộp bài"
                    icon={<Send size={16} />}
                    />
                )}

                {/* Only show if Registered or Virtual */}
                {(isRegistered || virtualState.isVirtual) && (
                  <TabLink
                    href="?tab=all-submissions"
                    active={safeTab === "all-submissions"}
                    label="Danh sách bài nộp"
                    icon={<List size={16} />}
                  />
                )}
                
                <TabLink
                  href="?tab=leaderboard"
                  active={safeTab === "leaderboard"}
                  label="Bảng xếp hạng"
                  icon={<Trophy size={16} />}
                />
              </>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            className={`space-y-6 ${
              safeTab !== "overview" ? "md:col-span-3" : "md:col-span-2"
            }`}
          >
            {safeTab === "overview" && <OverviewTab contest={contest} />}

            {!isUpcoming && safeTab === "submissions" && (isRegistered || virtualState.isVirtual) && (
              <div className="w-full max-w-4xl mx-auto">
                <SubmissionTab
                  problems={contest.problems}
                  contestId={contest.id}
                />
              </div>
            )}

            {!isUpcoming && safeTab === "all-submissions" && (isRegistered || virtualState.isVirtual) && (
              <div className="w-full max-w-4xl mx-auto">
                <AllSubmissionsTab 
                  contestId={contest.id} 
                  highlightId={highlight as string} 
                  problems={contest.problems}
                />
              </div>
            )}

            {!isUpcoming && safeTab === "leaderboard" && (
              <LeaderboardTab
                contestId={contest.id}
                problems={contest.problems}
              />
            )}
          </div>

          {safeTab === "overview" && (
            <div className="md:col-span-1 space-y-8">
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-md">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Danh sách Đề bài
                </h3>
                <div className="space-y-2">
                  {contest.problems.map((p) => {
                    const href = `/routes/contests/${contest.id}/${p.problemID}`;

                    if (isUpcoming) {
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-700 opacity-60 cursor-not-allowed"
                          title="Tạm khóa truy cập đề bài"
                        >
                          <span className="font-mono font-bold text-white w-8">
                            {p.id}
                          </span>
                          <span className="flex-1 text-slate-300 truncate text-sm ml-2">
                            {p.title}
                          </span>
                          <ChevronRight size={16} className="text-slate-600" />
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={p.id}
                        href={href}
                        className="flex items-center justify-between p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors group"
                      >
                        <span className="font-mono font-bold text-white w-8">
                          {p.id}
                        </span>
                        <span className="flex-1 text-slate-300 truncate text-sm ml-2">
                          {p.title}
                        </span>
                        <ChevronRight
                          size={16}
                          className="text-slate-500 group-hover:text-white"
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
              <RegisterContestButton
                contestId={contest.id}
                contestStatus={effectiveStatus}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
