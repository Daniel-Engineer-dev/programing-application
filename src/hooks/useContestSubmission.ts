
import { useState } from "react";
import { collection, doc, addDoc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Client SDK
import axios from "axios";

interface SubmissionResult {
  status: string;
  passed: number;
  total: number;
  runtime: string;
  memory: string;
  submissionId?: string;
}

interface UseContestSubmissionProps {
  contestId: string;
  userId?: string;
}

export function useContestSubmission({ contestId, userId }: UseContestSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseStartTime = (timeVal: any): number => {
    if (!timeVal) return 0;
    if (typeof timeVal.toMillis === 'function') return timeVal.toMillis();
    if (typeof timeVal === 'number') return timeVal;
    if (typeof timeVal === 'string') {
        let s = timeVal.replace(" at ", " ");
        s = s.replace(/UTC([+-]\d+(?::\d+)?)/, "GMT$1");
        s = s.replace(/\u202F/g, " ");
        let d = new Date(s);
        if (isNaN(d.getTime())) {
             const todayStr = new Date().toLocaleDateString("en-US");
             d = new Date(`${todayStr} ${s}`);
        }
        return d.getTime();
    }
    return 0;
  };

  const submitCode = async (
    code: string,
    language: string,
    problemId: string, // Logic ID (A, B, C...) or Real ID if mapped
    actualProblemDocId: string, // Doc ID in 'problems' collection
    problemTitle: string,
    testCases: any[]
  ) => {
    if (!userId || !contestId) {
        setError("Missing user or contest info");
        return;
    }

    setIsSubmitting(true);
    setResult(null);
    setError(null);

    try {
      // 1. Time Check (Client-side validation)
      const contestRef = doc(db, "contests", contestId);
      const contestSnap = await getDoc(contestRef);
      if (!contestSnap.exists()) throw new Error("Contest not found");

      // Verify Registration OR Active Virtual Participation
      const regRef = doc(db, "contests", contestId, "registrations", userId);
      const regSnap = await getDoc(regRef);
      
      let hasValidRegistration = regSnap.exists();
      let isVirtualRegistration = false;

      if (!hasValidRegistration) {
           // Check if virtual participation exists
           const vRef = doc(db, "contests", contestId, "virtual_participations", userId);
           const vSnap = await getDoc(vRef);
           if (vSnap.exists() && vSnap.data().status === "ONGOING") {
               isVirtualRegistration = true;
               hasValidRegistration = true;
           }
      }

      if (!hasValidRegistration) {
          throw new Error("Bạn chưa đăng ký tham gia contest này hoặc chưa bắt đầu thi ảo!");
      }

      const contestData = contestSnap.data();
      const rawTime = contestData?.time || contestData?.startAt || contestData?.startTime;
      const startTimeMillis = parseStartTime(rawTime);
      const lengthMinutes = Number(contestData?.length || 0);
      const endTimeMillis = startTimeMillis + (lengthMinutes * 60 * 1000);
      const now = Date.now();

      let isContestEnded = startTimeMillis > 0 && now > endTimeMillis + 60000;
      let isVirtual = false;
      let virtualStartTimeMillis = 0;

      // Check Virtual Status if real contest ended
      if (isContestEnded && userId) {
          const vRef = doc(db, "contests", contestId, "virtual_participations", userId);
          const vSnap = await getDoc(vRef);
          if (vSnap.exists() && vSnap.data().status === "ONGOING") {
              isVirtual = true;
              const vData = vSnap.data();
              virtualStartTimeMillis = vData.startTime?.toMillis() || Date.now();
              // Check if virtual time ended?
              // The timer component handles strict ending, but we should double check here too
              const virtualEndMillis = virtualStartTimeMillis + (lengthMinutes * 60 * 1000);
              if (now > virtualEndMillis + 60000) {
                 // Virtual ended, treat as late
                 isVirtual = false; 
                 // Optionally auto-close virtual status here, but let's stick to just treating submission as late
              }
          }
      }

      // 2. Execute Code via Piston/Judge0
      let passedCount = 0;
      let finalStatus = "Accepted";
      let maxRuntime = 0;
      let maxMemory = 0;

      try {
        const response = await axios.post("/piston", {
            source_code: code,
            language: language,
            problemId: actualProblemDocId,
            testCases: testCases,
        });

        const resData = response.data;

        // 1. Trường hợp sử dụng Hàng đợi (Judge0)
        if (resData.useQueue && Array.isArray(resData.tokens)) {
          const tokenStr = resData.tokens.join(",");
          let isPolling = true;
          let pollData: any = null;

          while (isPolling) {
            await new Promise(r => setTimeout(r, 1000));
            try {
              const pollRes = await axios.get(`/piston?tokens=${tokenStr}`);
              pollData = pollRes.data;

              if (pollData.finished) {
                isPolling = false;
              }
            } catch (pollError) {
              console.error("Lỗi polling nộp bài contest:", pollError);
              isPolling = false;
            }
          }

          if (pollData && pollData.batch && Array.isArray(pollData.results)) {
            for (let i = 0; i < testCases.length; i++) {
              const tc = testCases[i];
              const runVal = pollData.results.find((r: any) => r.index === i) || pollData.results[i];
              const actualOut = (runVal.stdout || "").trim();
              const expectedOut = tc.expectedOutput.trim();
              const stderr = runVal.stderr || "";

              maxRuntime = Math.max(maxRuntime, runVal.time || 0);
              maxMemory = Math.max(maxMemory, runVal.memory || 0);

              if (stderr) {
                  finalStatus = "Runtime Error";
              } else if (actualOut === expectedOut) {
                  passedCount++;
              } else {
                  if (finalStatus === "Accepted") finalStatus = "Wrong Answer";
              }
            }
          } else {
            finalStatus = "Runtime Error";
          }
        } 
        // 2. Trường hợp Fallback (chạy ngay qua Piston)
        else if (resData.batch && Array.isArray(resData.results)) {
          for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const runVal = resData.results.find((r: any) => r.index === i) || resData.results[i];
            const actualOut = (runVal.stdout || "").trim();
            const expectedOut = tc.expectedOutput.trim();
            const stderr = runVal.stderr || "";

            maxRuntime = Math.max(maxRuntime, runVal.time || 0);
            maxMemory = Math.max(maxMemory, runVal.memory || 0);

            if (stderr) {
                finalStatus = "Runtime Error";
            } else if (actualOut === expectedOut) {
                passedCount++;
            } else {
                if (finalStatus === "Accepted") finalStatus = "Wrong Answer";
            }
          }
        } else {
          finalStatus = "Runtime Error";
        }
      } catch (error) {
        console.error("Lỗi khi nộp bài contest:", error);
        finalStatus = "Runtime Error";
      }

      if (finalStatus === "Accepted" && passedCount < testCases.length) {
          finalStatus = "Wrong Answer"; 
      }

      const submissionResult = {
        status: finalStatus,
        passed: passedCount,
        total: testCases.length,
        runtime: `${(maxRuntime * 1000).toFixed(0)} ms`,
        memory: `${(maxMemory / 1024 / 1024).toFixed(2)} MB`,
        language,
        code
      };
      
      setResult(submissionResult);

      // 3. Update Firestore
      // A. Save Submission History (Contest)
      const docRef = await addDoc(collection(db, "contests", contestId, "user", userId, "submissions"), {
          ...submissionResult,
          problemId: problemId, 
          problemDocId: actualProblemDocId,
          problemTitle,
          userId,
          contestId,
          timestamp: serverTimestamp(),
          isLate: isContestEnded && !isVirtual,
          isVirtual: isVirtual
      });
      
      const submissionId = docRef.id;

      // Update state with ID if needed, or just return it
      setResult({ ...submissionResult, submissionId } as any);

      // B. Save Submission History (Global - Sync)
      await addDoc(collection(db, "users", userId, "submissions"), {
          ...submissionResult,
          submissionId, // Link global back to contest submission ID if useful
          problemId: actualProblemDocId, 
          problemTitle,
          timestamp: serverTimestamp(),
          contestId,
          isLate: isContestEnded && !isVirtual,
          isVirtual: isVirtual
      });

      // C. Update OFFICIAL Leaderboard (Real Time Only)
      if (!isContestEnded) {
        const lbRef = doc(db, "contests", contestId, "leaderboard", userId);
        await runTransaction(db, async (tx) => {
            const lbSnap = await tx.get(lbRef);
            
            if (!lbSnap.exists()) {
               tx.set(lbRef, {
                   uid: userId,
                   acceptedCount: 0,
                   penalty: 0,
                   acceptedProblems: {},
                   attemptedProblems: {},
                   wrongSubmissions: {},
                   updatedAt: serverTimestamp()
               });
            }
            
            const cur = lbSnap.exists() ? lbSnap.data() : {};
            const acceptedProblems = cur?.acceptedProblems || {};
            const wrongSubmissions = cur?.wrongSubmissions || {};
            const attemptedProblems = cur?.attemptedProblems || {};
            
            const newAttempted = { ...attemptedProblems, [actualProblemDocId]: true };

            if (acceptedProblems[actualProblemDocId]) return; 

            if (finalStatus === "Accepted") {
                 let penaltyTime = 0;
                 if (startTimeMillis > 0) {
                     penaltyTime = Math.max(0, Math.floor((now - startTimeMillis) / 60000));
                 }
                 const wrongCount = wrongSubmissions[actualProblemDocId] || 0;
                 const totalPenalty = penaltyTime + (wrongCount * 20);

                 tx.set(lbRef, {
                     uid: userId,
                     acceptedCount: (cur?.acceptedCount || 0) + 1,
                     penalty: (cur?.penalty || 0) + totalPenalty,
                     acceptedProblems: {
                         ...acceptedProblems,
                         [actualProblemDocId]: {
                             penaltyMinutes: totalPenalty,
                             acceptedAt: serverTimestamp()
                         }
                     },
                     attemptedProblems: newAttempted,
                     updatedAt: serverTimestamp()
                 }, { merge: true });

            } else {
                 const newWrongCount = (wrongSubmissions[actualProblemDocId] || 0) + 1;
                 tx.set(lbRef, {
                     uid: userId,
                     wrongSubmissions: {
                         ...wrongSubmissions,
                         [actualProblemDocId]: newWrongCount
                     },
                     attemptedProblems: newAttempted,
                     updatedAt: serverTimestamp()
                 }, { merge: true });
            }
        });
      } 
      
      // D. Update VIRTUAL Tracking (If Virtual)
      else if (isVirtual) {
         const vRef = doc(db, "contests", contestId, "virtual_participations", userId);
         await runTransaction(db, async (tx) => {
             const vSnap = await tx.get(vRef);
             if (!vSnap.exists()) return; // Should exist if isVirtual is true

             const cur = vSnap.data();
             const acceptedProblems = cur.acceptedProblems || {};
             const wrongSubmissions = cur.wrongSubmissions || {};
             const attemptedProblems = cur.attemptedProblems || {};
             
             const newAttempted = { ...attemptedProblems, [actualProblemDocId]: true };

             if (acceptedProblems[actualProblemDocId]) return;

             if (finalStatus === "Accepted") {
                 let penaltyTime = 0;
                 if (virtualStartTimeMillis > 0) {
                     // Calculate penalty based on VIRTUAL Start Time
                     penaltyTime = Math.max(0, Math.floor((now - virtualStartTimeMillis) / 60000));
                 }
                 const wrongCount = wrongSubmissions[actualProblemDocId] || 0;
                 const totalPenalty = penaltyTime + (wrongCount * 20);

                 tx.update(vRef, {
                     score: (cur.score || 0) + 1, // Store as "score" or "acceptedCount" to match? Let's use generic score/penalty approach
                     // But to match leaderboard structure for easier local merging later:
                     acceptedCount: (cur.acceptedCount || (cur.score || 0)) + 1,
                     penalty: (cur.penalty || 0) + totalPenalty,
                     acceptedProblems: {
                         ...acceptedProblems,
                         [actualProblemDocId]: {
                             penaltyMinutes: totalPenalty,
                             acceptedAt: serverTimestamp()
                         }
                     },
                     attemptedProblems: newAttempted,
                 });
             } else {
                 const newWrongCount = (wrongSubmissions[actualProblemDocId] || 0) + 1;
                 tx.update(vRef, {
                     wrongSubmissions: {
                         ...wrongSubmissions,
                         [actualProblemDocId]: newWrongCount
                     },
                     attemptedProblems: newAttempted,
                 });
             }
         });
      }

      return submissionId;

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitCode, isSubmitting, result, error, setError };
}
