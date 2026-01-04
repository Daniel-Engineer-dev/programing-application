"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/src/api/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Clock } from "lucide-react";

interface ContestCountdownProps {
  contestId: string;
  realStartTime: number; // millis
  lengthMinutes: number;
}

export default function ContestCountdown({
  contestId,
  realStartTime,
  lengthMinutes,
}: ContestCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [status, setStatus] = useState<"LOADING" | "UPCOMING" | "REAL" | "VIRTUAL" | "ENDED">("LOADING");
  const [targetTime, setTargetTime] = useState<number>(0);

  useEffect(() => {
    let unsubVirtual: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      // 1. Check Virtual first (if logged in)
      if (user) {
          const virtualRef = doc(db, "contests", contestId, "virtual_participations", user.uid);
          unsubVirtual = onSnapshot(virtualRef, (vSnap) => {
              if (vSnap.exists() && vSnap.data().status === "ONGOING") {
                  const vData = vSnap.data();
                  const vStart = vData.startTime?.toMillis() || Date.now();
                  setTargetTime(vStart + lengthMinutes * 60 * 1000);
                  setStatus("VIRTUAL");
              } else {
                  // Not virtual, check real
                  checkRealContest();
              }
          });
      } else {
          checkRealContest();
      }
    });

    const checkRealContest = () => {
      const now = Date.now();
      const realEnd = realStartTime + lengthMinutes * 60 * 1000;
      
      if (now < realStartTime) {
          setTargetTime(realStartTime);
          setStatus("UPCOMING"); 
      } else if (now < realEnd) {
          setTargetTime(realEnd);
          setStatus("REAL");
      } else {
          setStatus("ENDED");
      }
    };

    return () => {
        unsubAuth();
        if (unsubVirtual) unsubVirtual();
    };
  }, [contestId, realStartTime, lengthMinutes]);

  useEffect(() => {
    if (status === "LOADING" || status === "ENDED") return;

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft("00:00:00");
        handleTimeUp();
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(
          `${h.toString().padStart(2, "0")}:${m
            .toString()
            .padStart(2, "0")}:${s.toString().padStart(2, "0")}`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [status, targetTime]);

  const handleTimeUp = async () => {
      if (status === "UPCOMING") {
          window.location.reload(); // Contest started
      } else if (status === "VIRTUAL") {
          const user = auth.currentUser;
          if (user) {
              try {
                const virtualRef = doc(db, "contests", contestId, "virtual_participations", user.uid);
                await updateDoc(virtualRef, { status: "FINISHED" });
                window.location.reload(); 
              } catch (e) {
                  console.error("Error finishing virtual contest", e);
              }
          }
      } else {
          window.location.reload();
      }
  };

  if (status === "LOADING" || status === "ENDED") return null;

  let label = "Thời gian còn lại";
  let colorClass = "bg-blue-900/90 border-blue-500 text-blue-100";
  let iconColor = "text-blue-300";

  if (status === "VIRTUAL") {
      label = "Thi Ảo (Virtual)";
      colorClass = "bg-purple-900/90 border-purple-500 text-purple-100";
      iconColor = "text-purple-300";
  } else if (status === "UPCOMING") {
      label = "Sắp diễn ra";
      colorClass = "bg-yellow-900/90 border-yellow-500 text-yellow-100";
      iconColor = "text-yellow-300";
  }

  return (
    <div className={`fixed bottom-6 right-24 p-4 rounded-xl shadow-2xl border flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 ${colorClass}`}>
      <Clock className={`animate-pulse ${iconColor}`} />
      <div>
          <div className="text-xs font-bold opacity-80 uppercase tracking-wider">
              {label}
          </div>
          <div className="text-2xl font-mono font-bold tracking-widest">
            {timeLeft || "--:--:--"}
          </div>
      </div>
    </div>
  );
}
