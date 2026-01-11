"use client";

import { useState, useEffect, useRef } from "react";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/src/api/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Clock } from "lucide-react";

interface ContestCountdownProps {
  contestId: string;
  realStartTime: number; // millis
  lengthMinutes: number;
}

// --- Helper from ContestLivePage ---
function parseWeirdTimeString(input: any): Date {
  if (!input) return new Date();
  if (input?.toDate) return input.toDate();
  if (input instanceof Date) return input;
  
  if (typeof input !== "string") {
      return new Date(input); 
  }

  let s = input.replace(" at ", " ");
  s = s.replace(/UTC([+-]\d+(?::\d+)?)/, "GMT$1");
  s = s.replace(/\u202F/g, " ");
  const d = new Date(s);
  if (isNaN(d.getTime())) return new Date();
  return d;
}

export default function ContestCountdown({
  contestId,
  realStartTime,
  lengthMinutes,
}: ContestCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [status, setStatus] = useState<"LOADING" | "UPCOMING" | "REAL" | "VIRTUAL" | "ENDED">("LOADING");
  const [targetTime, setTargetTime] = useState<number>(0);

  // Use refs to share real contest data between listeners
  const realContestRef = useRef({ start: realStartTime, length: lengthMinutes });

  // Safe status updater that won't overwrite VIRTUAL mode
  const checkRealContest = (start: number, len: number) => {
    setStatus((prev) => {
      // If currently VIRTUAL, do not overwrite with Real status
      // valid only if the Virtual listener is active and says so.
      // However, here we are inside the state updater.
      if (prev === "VIRTUAL") return prev;

      const now = Date.now();
      const realEnd = start + len * 60 * 1000;

      if (now < start) {
        setTargetTime(start);
        return "UPCOMING";
      } else if (now < realEnd) {
        setTargetTime(realEnd);
        return "REAL";
      } else {
        return "ENDED";
      }
    });
  };
  
  // Force update when falling back from Virtual
  const forceCheckReal = () => {
      const { start, length } = realContestRef.current;
      
      const now = Date.now();
      const realEnd = start + length * 60 * 1000;
       
      // Force update ignoring previous 'VIRTUAL' state (since we are calling this FROM the virtual listener when it ends)
      if (now < start) {
        setTargetTime(start);
        setStatus("UPCOMING");
      } else if (now < realEnd) {
        setTargetTime(realEnd);
        setStatus("REAL");
      } else {
        setStatus("ENDED");
      }
  };

  useEffect(() => {
    let unsubVirtual: (() => void) | undefined;
    let unsubReal: (() => void) | undefined;

    // Listen to REAL contest updates
    unsubReal = onSnapshot(doc(db, "contests", contestId), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const d = parseWeirdTimeString(data.time || data.startTime);
            
            // Update Ref
            realContestRef.current.start = d.getTime();
            realContestRef.current.length = Number(data.length || 0);
            
            // Try to update status (will be blocked if VIRTUAL is active)
            checkRealContest(realContestRef.current.start, realContestRef.current.length);
        }
    });

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
          const virtualRef = doc(db, "contests", contestId, "virtual_participations", user.uid);
          unsubVirtual = onSnapshot(virtualRef, { includeMetadataChanges: true }, (vSnap) => { 
              if (vSnap.exists()) {
                  const vData = vSnap.data();
                  if (vData.status === "ONGOING") {
                        const vStart = vData.startTime?.toMillis() || Date.now();
                        setTargetTime(vStart + realContestRef.current.length * 60 * 1000); 
                        setStatus("VIRTUAL");
                  } else {
                        // If FINISHED or not ongoing, force fallback to Real Clock
                        forceCheckReal();
                  }
              } else {
                  // No virtual data, use real clock (e.g. registration deleted or never started)
                  forceCheckReal();
              }
          });
      }
    });

    return () => {
        unsubAuth();
        if (unsubVirtual) unsubVirtual();
        if (unsubReal) unsubReal();
    };
  }, [contestId]);

  useEffect(() => {
    if (status === "LOADING" || status === "ENDED") return;

    const timer = setInterval(() => {
      const now = Date.now();
      let diff = targetTime - now;

      // Fix: Clamp to max duration if VIRTUAL (handle server time skew)
      if (status === "VIRTUAL") {
          const maxDuration = realContestRef.current.length * 60 * 1000; // use Ref for length
          if (diff > maxDuration) diff = maxDuration;
      }

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
  }, [status, targetTime]); // Removed lengthMinutes dependency, using ref inside

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
    <div className={`fixed bottom-6 right-40 p-4 rounded-xl shadow-2xl border flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 ${colorClass}`}>
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
