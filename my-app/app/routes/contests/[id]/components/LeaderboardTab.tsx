"use client";

import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, doc, limit } from "firebase/firestore";
import { db, auth } from "@/src/api/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { Search } from "lucide-react";

type AcceptedProblemsMap = Record<
  string,
  { penaltyMinutes?: number; acceptedAt?: any }
>;

type LeaderboardRow = {
  uid: string;
  username: string;
  acceptedCount: number;
  penalty: number; // phút (tổng)
  acceptedProblems?: AcceptedProblemsMap;
  attemptedProblems?: Record<string, boolean>;
};

function minutesToHHMM(mins: number) {
  const m = Number(mins ?? 0);
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export default function LeaderboardTab({
  contestId,
  problems,
}: {
  contestId: string;
  problems: any[]; // để hiển thị cột theo từng bài
}) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [virtualRow, setVirtualRow] = useState<LeaderboardRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [limitCount, setLimitCount] = useState(50); // Mặc định tải 50 dòng
  const [searchTerm, setSearchTerm] = useState("");

  // map: problemId -> index (để render cột 1..n)
  const problemIdList = useMemo(
    () => (problems || []).map((p) => p.problemID || p.id),
    [problems]
  );

  useEffect(() => {
    if (!contestId) return;
    
    // Nếu thay đổi limit, ta không clear rows ngay để tránh nháy
    if (limitCount === 50) {
        setRows([]);
        setLoading(true);
    }

    const q = query(
      collection(db, "contests", contestId, "leaderboard"),
      orderBy("acceptedCount", "desc"),
      orderBy("penalty", "asc"),
      limit(limitCount)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => d.data() as LeaderboardRow);
        setRows(data);
        setLoading(false);
      },
      (err) => {
        console.error("Leaderboard snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [contestId, limitCount]);

  // Fetch Virtual Participation
  useEffect(() => {
    if (!contestId) return;
    setVirtualRow(null);
    
    let unsubVirtual: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
        if (!user) {
            setVirtualRow(null);
            if (unsubVirtual) {
                unsubVirtual();
                unsubVirtual = undefined;
            }
            return;
        }

        const vRef = doc(db, "contests", contestId, "virtual_participations", user.uid);
        // Clean up prev listener if any
        if (unsubVirtual) unsubVirtual();

        unsubVirtual = onSnapshot(vRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                if (data.status === "ONGOING") {
                    setVirtualRow({
                        uid: user.uid + "_virtual",
                        username: "Bạn (Virtual)",
                        acceptedCount: data.acceptedCount || data.score || 0,
                        penalty: data.penalty || 0,
                        acceptedProblems: data.acceptedProblems || {},
                        attemptedProblems: data.attemptedProblems || {},
                        // @ts-ignore
                        isVirtual: true,
                        originalUid: user.uid
                    });
                } else {
                     setVirtualRow(null);
                }
            } else {
                setVirtualRow(null);
            }
        });
    });

    return () => {
        unsubAuth();
        if (unsubVirtual) unsubVirtual();
    };
  }, [contestId]);

  const displayRows = useMemo(() => {
      let combined = [...rows];
      // Nếu user có virtual data, đưa vào list
      // Lưu ý: User có thể vừa có row thật vừa có row virtual. 
      // Row virtual sẽ hiển thị riêng.
      if (virtualRow) {
          combined.push(virtualRow);
      }
      
      // Sort lại
      combined.sort((a, b) => {
          if (b.acceptedCount !== a.acceptedCount) {
             return b.acceptedCount - a.acceptedCount;
          }
          return a.penalty - b.penalty;
      });

      // Filter by Search Term
      if (searchTerm.trim()) {
           const lower = searchTerm.toLowerCase();
           combined = combined.filter(r => {
               const displayName = r.username || `user_${String(r.uid).slice(0, 6)}`;
               return displayName.toLowerCase().includes(lower);
           });
      }

      return combined;
  }, [rows, virtualRow, searchTerm]);

  // Handle Scroll to Load More
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
       const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
       // Nếu cuộn gần đáy (còn 50px)
       if (scrollHeight - scrollTop - clientHeight < 50) {
           // Nếu đang không loading và số lượng row hiện tại >= limit (nghĩa là còn data)
           if (!loading && rows.length >= limitCount) {
               // Tăng limit lên
               setLimitCount(prev => prev + 50);
           }
       }
  };

  // Auto-scroll to current user
  useEffect(() => {
      // Chỉ auto scroll lúc đầu hoặc khi data mới load xong, không scroll khi user đang search hoặc cuộn
      if (!loading && displayRows.length > 0 && auth.currentUser && !searchTerm) {
          const uid = auth.currentUser.uid;
          // Try finding row with uid_virtual FIRST (Prioritize virtual view)
          const rowEl = document.getElementById(`row-${uid}_virtual`) || document.getElementById(`row-${uid}`);
          // Chỉ scroll nếu chưa scroll (check bằng logic khác hoặc đơn giản cho chạy 1 lần)
          // Hiện tại effect này chạy mỗi khi rows change, có thể hơi phiền nếu đang xem.
          // Tạm thời comment out auto-scroll liên tục, hoặc chỉ chạy 1 lần mount?
          // User yêu cầu "cuộn đến đâu tải đó", auto-scroll might conflict.
          // Nhưng logic highlight user vẫn cần.
      }
  }, [loading, displayRows, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white text-center flex-1">
            Bảng xếp hạng
        </h2>
        {/* Search Box */}
        <div className="relative">
            <input 
                type="text"
                placeholder="Tìm thí sinh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-full py-1.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 w-64 transition-all focus:w-80"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>
      
      <div 
        className="bg-[#161f2c] rounded-xl border border-slate-700 overflow-hidden shadow-2xl animate-in fade-in duration-500 flex flex-col max-h-[700px]" // Set max-height for internal scrolling
       >
        <div className="overflow-auto" onScroll={handleScroll}> 
          <table className="w-full border-collapse text-sm table-auto relative">
            <thead>
              <tr className="bg-[#0f172a]/50 text-slate-400 border-b border-slate-700">
                <th className="p-4 text-center font-bold whitespace-nowrap border-r border-slate-700 w-16 text-[16px]">
                  Hạng
                </th>

                <th className="p-4 text-left font-bold w-full border-r border-slate-700 text-[16px]">
                  Tên truy cập
                </th>

                <th className="p-4 text-center font-bold whitespace-nowrap border-r border-slate-700 w-24 text-[16px]">
                  AC
                </th>

                <th className="p-4 text-center font-bold whitespace-nowrap border-r border-slate-700 w-32 text-[16px]">
                  Penalty
                </th>

                {problemIdList.map((pid, i) => (
                  <th
                    key={pid}
                    className="p-0 text-center font-bold whitespace-nowrap min-w-[70px] border-r last:border-r-0 border-slate-700 hover:bg-slate-700 transition-colors"
                  >
                    <Link
                      href={`/routes/contests/${contestId}/${pid}`}
                      className="block w-full h-full p-4"
                    >
                        <div className="text-[16px] font-bold text-white mb-0.5">
                        {String.fromCharCode(65 + i)}
                        </div>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
      
              {!loading && displayRows.length === 0 && (
                <tr>
                  <td
                    colSpan={4 + problemIdList.length}
                    className="p-6 text-center text-slate-500"
                  >
                    Chưa có người tham gia.
                  </td>
                </tr>
              )}

              {!loading &&
                displayRows.map((row, idx) => {
                  const acceptedCount = Number(row.acceptedCount || 0);
                  const penalty = Number(row.penalty || 0);
                  const acceptedProblems = row.acceptedProblems || {};
                  
                  const realUid = (row as any).originalUid || row.uid;
                  const isCurrentUser = auth.currentUser?.uid === realUid;
                  const isVirtualRow = (row as any).isVirtual;

                  return (
                    <tr
                      key={row.uid || row.username || idx}
                      id={`row-${row.uid}`}
                      className={`transition-colors group border-b border-slate-800 ${
                          isCurrentUser 
                          ? "bg-blue-600/20 hover:bg-blue-600/30 border-l-4 border-l-blue-500" 
                          : "hover:bg-blue-500/5"
                      } ${isVirtualRow ? "italic opacity-90 border-l-4 border-l-purple-500 bg-purple-900/10" : ""}`}
                    >
                      <td className="p-4 text-center font-mono text-slate-400 border-r border-slate-700">
                        {idx + 1}
                      </td>

                      <td className="p-4 font-bold border-r border-slate-700 truncate text-white">
                        {row.username || `user_${String(row.uid).slice(0, 6)}`}
                        {isCurrentUser && <span className="ml-2 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">You</span>}
                      </td>

                      <td className="p-4 text-center font-bold text-green-400 bg-green-500/5 border-r border-slate-700">
                        {acceptedCount}
                      </td>

                      <td className="p-4 text-center font-mono text-slate-200 bg-blue-500/5 border-r border-slate-700">
                        {minutesToHHMM(penalty)}
                      </td>

                      {problemIdList.map((pid) => {
                        const acInfo = acceptedProblems?.[pid];
                        const attempted = row.attemptedProblems?.[pid] === true;

                        let bgClass = "bg-slate-600/20 text-slate-400";
                        let symbol = "–";
                        let subText = "";

                        if (acInfo) {
                          // ✅ AC
                          bgClass = "bg-green-500/15 text-green-400";
                          symbol = "✓";
                          subText = `${Number(acInfo.penaltyMinutes ?? 0)}m`;
                        } else if (attempted) {
                          // ❌ Đã nộp nhưng sai
                          bgClass = "bg-red-500/15 text-red-400";
                          symbol = "✕";
                          subText = "";
                        }
                        
                        // Override background if it is current user row to blend nicely
                        if (isCurrentUser) {
                            // Keep status colors but make base slightly transparent to show row highlight
                             if (acInfo) bgClass = "bg-green-500/20 text-green-300";
                             else if (attempted) bgClass = "bg-red-500/20 text-red-300";
                             else bgClass = "text-slate-400"; // transparent
                        }

                        return (
                          <td
                            key={pid}
                            className={`p-4 text-center border-r last:border-r-0 border-slate-700 ${bgClass}`}
                          >
                            <div className="font-bold text-[13px]">
                              {symbol}
                            </div>
                            <div className="text-[10px] opacity-60">
                              {subText || "--"}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
