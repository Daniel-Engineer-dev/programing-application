import React from "react";
import {
  Calendar,
  Users,
  BookOpen,
  Send,
  Trophy,
  Frown,
  ChevronRight,
  List,
} from "lucide-react";
import Link from "next/link";
import { fetchContestDetailsServer } from "./lib/fetchContest";
import TabLink from "./components/TabLink";
import OverviewTab from "./components/OverviewTab";
import SubmissionTab from "./components/SubmissionTab";
import LeaderboardTab from "./components/LeaderboardTab";
import AllSubmissionsTab from "./components/AllSubmissionsTab";
import RegisterContestButton from "./components/RegisterContestButton";


function minutesToHHMM(mins: number) {
  const m = Number(mins);
  if (!Number.isFinite(m) || m <= 0) return "00:00";
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function parseWeirdTimeString(input: string): Date {
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

function getContestStatus(start: Date, lengthMinutes: number): ContestStatus {
  const now = new Date();
  const startMs = start.getTime();
  const endMs = startMs + Number(lengthMinutes ?? 0) * 60 * 1000;

  if (now.getTime() < startMs) return "UPCOMING";
  if (now.getTime() >= startMs && now.getTime() <= endMs) return "ONGOING";
  return "ENDED";
}

export default async function ContestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; highlight?: string }>;
}) {
  const { id } = await params;
  const { tab: currentTab, highlight } = await searchParams;
  const tab = currentTab ?? "overview";

  const contest = await fetchContestDetailsServer(id);

  if (!contest) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <Frown size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Không tìm thấy Contest</h1>
        <Link href="/routes/contests" className="mt-6 text-blue-400 underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const d = parseWeirdTimeString(contest.time);
  const dateText = formatVNDate(d);
  const timeText = formatVNTime(d);
  const lengthHHMM = minutesToHHMM(contest.length);
  const computedStatus = getContestStatus(d, contest.length); // "UPCOMING" | "ONGOING" | "ENDED"
  const isUpcoming = computedStatus === "UPCOMING";
  const safeTab = isUpcoming ? "overview" : tab;

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-300">
      <main className="mx-auto max-w-[95%] px-6 py-16">
        <div className="bg-slate-800 p-8 rounded-xl mb-10 shadow-lg border border-slate-700">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-white">{contest.title}</h1>
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
              <TabLink
                href="?tab=submissions"
                active={safeTab === "submissions"}
                label="Nộp bài"
                icon={<Send size={16} />}
              />
              <TabLink
                href="?tab=all-submissions"
                active={safeTab === "all-submissions"}
                label="Danh sách bài nộp"
                icon={<List size={16} />}
              />
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

            {!isUpcoming && safeTab === "submissions" && (
              <div className="w-full max-w-4xl mx-auto">
                <SubmissionTab
                  problems={contest.problems}
                  contestId={contest.id}
                />
              </div>
            )}

            {!isUpcoming && safeTab === "all-submissions" && (
              <div className="w-full max-w-4xl mx-auto">
                <AllSubmissionsTab 
                  contestId={id} 
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
                    const href = `/routes/contests/${id}/${p.problemID}`;

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
                contestStatus={computedStatus}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
