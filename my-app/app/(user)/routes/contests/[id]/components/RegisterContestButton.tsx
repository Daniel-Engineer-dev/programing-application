"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/src/api/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  deleteDoc,
  onSnapshot,
  updateDoc
} from "firebase/firestore";

type Props = {
  contestId: string;
  contestStatus?: "live" | "upcoming" | string;
};

export default function RegisterContestButton({
  contestId,
  contestStatus,
}: Props) {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const btnColor = useMemo(() => {
    const isLive = contestStatus === "live";
    return isLive
      ? "bg-red-600 hover:bg-red-700 shadow-red-600/30"
      : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30";
  }, [contestStatus]);

  const [virtualStatus, setVirtualStatus] = useState<"NONE" | "ONGOING" | "FINISHED">("NONE");

  // ✅ Check user đã đăng ký chưa bằng cách xem doc tồn tại không
   // 1. Listen to Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid || null);
      if (!user) {
          setRegistered(false);
          setVirtualStatus("NONE");
      }
      setChecking(false);
    });
    return () => unsub();
  }, []);

  // 2. Real-time Listeners for Registration & Virtual Status
  useEffect(() => {
      if (!uid || !contestId) {
          if (!uid && !checking) { // If finished checking and no user, we are done
             // already handled in auth listener
          }
          return;
      }

      // Listener 1: Registration Status
      const regRef = doc(db, "contests", contestId, "registrations", uid);
      const unsubReg = onSnapshot(regRef, (snap) => {
          setRegistered(snap.exists());
      });

      // Listener 2: Virtual Status
      const virtualRef = doc(db, "contests", contestId, "virtual_participations", uid);
      const unsubVirtual = onSnapshot(virtualRef, (vSnap) => {
          if (vSnap.exists()) {
             const data = vSnap.data();
             setVirtualStatus(data.status || "ONGOING");
          } else {
             setVirtualStatus("NONE");
          }
      });

      return () => {
          unsubReg();
          unsubVirtual();
      };
  }, [uid, contestId, checking]);

  const handleStartVirtual = async () => {
      if (!uid) return router.push("/routes/auth/login");
      try {
          setSubmitting(true);
          const virtualRef = doc(db, "contests", contestId, "virtual_participations", uid);
          
          await runTransaction(db, async (tx) => {
              const docSnap = await tx.get(virtualRef);
              // Cho phép nếu chưa tham gia hoặc đã kết thúc (Thi lại)
              if (!docSnap.exists() || docSnap.data().status === "FINISHED") {
                  tx.set(virtualRef, {
                      startTime: serverTimestamp(),
                      status: "ONGOING",
                      userId: uid,
                      createdAt: serverTimestamp()
                  });
                  
                  // Init virtual leaderboard entry? Maybe later.
              }
          });
          
          
          setVirtualStatus("ONGOING"); 
      } catch (e) {
          console.error(e);
          alert("Lỗi khi bắt đầu thi ảo");
      } finally {
          setSubmitting(false);
      }
  };

  const handleEndVirtual = async () => {
      if (!uid) return;
      if (!confirm("Bạn có chắc chắn muốn kết thúc thi ảo?")) return;
      
      try {
          const virtualRef = doc(db, "contests", contestId, "virtual_participations", uid);
          await updateDoc(virtualRef, { position: "FINISHED", status: "FINISHED" }); // Update status
          setVirtualStatus("FINISHED"); 
      } catch (e) {
          console.error(e);
          alert("Lỗi khi kết thúc thi ảo");
      }
  };

  const handleRegister = async () => {
    // chưa login -> đi login
    if (!uid) {
      router.push("/routes/auth/login");
      return;
    }

    if (registered || submitting) return;

    try {
      setSubmitting(true);
      
      const contestRef = doc(db, "contests", contestId);
      const regRef = doc(db, "contests", contestId, "registrations", uid);

      const userRef = doc(db, "users", uid);
      const lbRef = doc(db, "contests", contestId, "leaderboard", uid);

      await runTransaction(db, async (tx) => {
        // READ ALL
        const regSnap = await tx.get(regRef);
        const contestSnap = await tx.get(contestRef);

        const userSnap = await tx.get(userRef);
        const lbSnap = await tx.get(lbRef);

        // Nếu đã đăng ký -> không làm gì
        if (regSnap.exists()) return;

        // Lấy số participants hiện tại
        const currentParticipants = contestSnap.exists()
          ? Number(contestSnap.data().participants || 0)
          : 0;

        const username =
          (userSnap.exists() && (userSnap.data() as any).username) ||
          `user_${uid.slice(0, 6)}`;

        // WRITE AFTER ALL READS
        tx.set(regRef, {
          userId: uid,
          createdAt: serverTimestamp(),
        });

        tx.update(contestRef, {
          participants: currentParticipants + 1,
        });

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

      setRegistered(true);
    } catch (e) {
      console.error("Register contest error:", e);
      alert("Không thể đăng ký lúc này. Thử lại sau nhé.");
    } finally {
      setSubmitting(false);
    }
  };

  // Contest đã kết thúc
  if (contestStatus === "ENDED" || contestStatus === "ended") {
    // Nếu chưa đăng nhập -> hiện Đã kết thúc (disable)
    if (!uid) {
        return (
            <button disabled className="w-full py-3 rounded-xl text-slate-400 font-bold bg-slate-800 border border-slate-700 cursor-not-allowed">
                Đã kết thúc
            </button>
        );
    }

    // Checking status
    if (checking) return null; // or spinner
    
    if (virtualStatus === "ONGOING") {
        return (
            <button 
                onClick={handleEndVirtual} 
                className="w-full py-3 rounded-xl text-white font-bold bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30"
            >
                Kết thúc thi ảo
            </button>
        );
    }
    


    return (
      <button
        onClick={handleStartVirtual}
        disabled={submitting}
        className="w-full py-3 rounded-xl text-white font-bold bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/30 transition-all"
      >
        {submitting ? "Đang xử lý..." : "Bắt đầu thi ảo"}
      </button>
    );
  }

  // Đang check
  if (checking) {
    return (
      <button
        disabled
        className="w-full py-3 rounded-xl text-white font-bold shadow-lg bg-slate-700 opacity-70 cursor-not-allowed"
      >
        Đang kiểm tra...
      </button>
    );
  }

  // ✅ Đang thi ảo -> Hiện nút Kết thúc
  if (virtualStatus === "ONGOING") {
    return (
        <button 
            onClick={handleEndVirtual} 
            className="w-full py-3 rounded-xl text-white font-bold bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30"
        >
            Kết thúc thi ảo
        </button>
    );
  }

  // ✅ Đã đăng ký
  if (registered) {
    return (
      <button
        disabled
        className="w-full py-3 rounded-xl text-slate-300 font-bold shadow-lg bg-slate-700/60 border border-slate-600 cursor-not-allowed"
      >
        Đã đăng ký
      </button>
    );
  }

  // Chưa đăng ký
  return (
    <button
      onClick={handleRegister}
      disabled={submitting}
      className={`w-full py-3 rounded-xl text-white font-bold shadow-lg transition-all ${btnColor} ${
        submitting ? "opacity-80 cursor-wait" : ""
      }`}
    >
      {submitting ? "Đang đăng ký..." : "Đăng ký Contest"}
    </button>
  );
}
