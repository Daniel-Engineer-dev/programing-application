
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { useContestSubmission } from "@/src/hooks/useContestSubmission";

// 2. Import Firebase
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { auth, db } from "@/src/api/firebase/firebase";

// --- TYPE DEFINITIONS ---
type TestCase = {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean; // Thêm trường này để phân biệt
};

type RunResult = {
  passed: boolean | null;
  actualOutput: string;
  stderr: string;
  status: "Pending" | "Accepted" | "Wrong Answer" | "Runtime Error";
  runtime: string; // Thêm mới
  memory: string; // Thêm mới
};

type SubmissionResult = {
  total: number;
  passed: number;
  status: "Accepted" | "Wrong Answer" | "Runtime Error" | "Pending";
  runtime: string; // Thêm mới
  memory: string; // Thêm mới
};
type EditorPanelProps = {
  problemId: string;
  contestId?: string;
  problemTitle: string;
  initialCode: string; // Mã nguồn nhận từ page.tsx
  currentLanguage: string; // Ngôn ngữ nhận từ page.tsx
  onCodeChange: (code: string) => void; // Hàm báo cho page.tsx khi gõ code
  onLanguageChange: (lang: string) => void; // Hàm báo cho page.tsx khi đổi ngôn ngữ
  contestProblemLogicId?: string; // ID logic trong contest (A, B, C...)
};

export default function EditorPanel({
  problemId,
  contestId,
  problemTitle,
  initialCode,
  currentLanguage,
  onCodeChange,
  onLanguageChange,
  contestProblemLogicId,
}: EditorPanelProps) {
  const router = useRouter();
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [isPageLoading, setIsPageLoading] = useState(true);

  // --- STATE EDITOR ---
  // Ưu tiên sử dụng giá trị từ Props
  const [language, setLanguage] = useState(currentLanguage || "cpp");
  const [code, setCode] = useState(initialCode || "");
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});

  // --- STATE TEST CASES ---
  const [publicTestCases, setPublicTestCases] = useState<TestCase[]>([]); // Chỉ hiện trên Tab
  const [allTestCases, setAllTestCases] = useState<TestCase[]>([]); // Dùng để Submit

  // --- STATE RUN & SUBMIT ---
  const [runResults, setRunResults] = useState<RunResult[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  const [isRunning, setIsRunning] = useState(false); // Loading cho nút Chạy thử
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading cho nút Nộp bài
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null); // Kết quả nộp bài
  // --- EFFECT: ĐỒNG BỘ KHI KHÔI PHỤC CODE TỪ LỊCH SỬ ---
  useEffect(() => {
    if (initialCode !== undefined) {
      setCode(initialCode);
    }
  }, [initialCode]);

  useEffect(() => {
    if (currentLanguage) {
      setLanguage(currentLanguage);
    }
  }, [currentLanguage]);

  // --- EFFECT: LẤY DỮ LIỆU TỪ FIREBASE ---
  useEffect(() => {
    if (!problemId) return;

    const fetchData = async () => {
      setIsPageLoading(true);
      try {
        const problemRef = doc(db, "problems", problemId);
        const problemSnap = await getDoc(problemRef);

        if (problemSnap.exists()) {
          const data = problemSnap.data();
          const fetchedTemplates = data.defaultCode || {};
          setTemplates(fetchedTemplates);
          setCodeMap(fetchedTemplates);

          // Chỉ đặt code mặc định nếu hiện tại Editor đang trống
          if (!initialCode) {
            const defaultLang = "cpp";
            const defaultCode = fetchedTemplates[defaultLang] || "";
            setLanguage(defaultLang);
            setCode(defaultCode);
            onLanguageChange(defaultLang);
            onCodeChange(defaultCode);
          }
        }

        // ... giữ nguyên logic lấy Test Cases ...
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchData();
  }, [problemId]);

  // --- HANDLER: Thay đổi nội dung Editor ---
  const handleEditorChange = (val: string | undefined) => {
    const newCode = val || "";
    setCode(newCode); // Cập nhật UI ngay lập tức
    onCodeChange(newCode); // Báo lên Component cha
  };
  // --- EFFECT: LẤY DỮ LIỆU TỪ FIREBASE ---
  useEffect(() => {
    if (!problemId) return;

    const fetchData = async () => {
      setIsPageLoading(true);
      try {
        // A. Lấy Templates
        const problemRef = doc(db, "problems", problemId);
        const problemSnap = await getDoc(problemRef);

        if (problemSnap.exists()) {
          const data = problemSnap.data();
          const fetchedTemplates = data.defaultCode || {};
          setTemplates(fetchedTemplates);
          setCodeMap(fetchedTemplates);
          setCode(fetchedTemplates["cpp"] || "");
        }

        // B. Lấy Test Cases (Lấy hết, sau đó lọc)
        const testCasesRef = collection(db, "problems", problemId, "testCases");
        const testCasesSnap = await getDocs(testCasesRef);


        const problemData = problemSnap.exists() ? problemSnap.data() : null;
        const examples = problemData?.examples || [];

        const allTests: TestCase[] = [];
        const publicTests: TestCase[] = [];

        testCasesSnap.forEach((doc) => {
          const t = doc.data();
          const isHidden = t.isHidden === true || t.isHidden === "true";

          const testCaseObj = {
            id: doc.id,
            input: t.input,
            expectedOutput: t.expected || t.expectedOutput || t.output || "",
            isHidden: isHidden,
          };

          allTests.push(testCaseObj); // Lưu tất cả vào đây để Submit

          if (!isHidden) {
            publicTests.push(testCaseObj); // Chỉ lưu public để hiện Tab
          }
        });

        // FALLBACK: Nếu không có test case nào trong sub-collection, dùng examples từ document chính
        if (allTests.length === 0 && examples.length > 0) {
          const fallbackTests = examples.map((ex: any, idx: number) => ({
            id: `example-${idx}`,
            input: ex.input || "",
            expectedOutput: ex.output || "",
            isHidden: false,
          }));
          
          allTests.push(...fallbackTests);
          publicTests.push(...fallbackTests);
        }

        setAllTestCases(allTests);
        setPublicTestCases(publicTests.slice(0, 3)); // Lấy tối đa 3 test public để hiện tab
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchData();
  }, [problemId]);

  // --- HANDLER: Đổi ngôn ngữ ---
  const handleLanguageChange = (newLang: string) => {
    setCodeMap((prev) => ({ ...prev, [language]: code }));
    setLanguage(newLang);
    const nextCode = codeMap[newLang] || templates[newLang] || "";
    setCode(nextCode);
    // Báo lên Component cha (page.tsx)
    onLanguageChange(newLang);
    onCodeChange(nextCode);
  };

  // --- HANDLER: Chạy Code (Chỉ chạy Public Test Cases) ---
  const handleRun = async () => {
    setIsRunning(true);
    // Reset kết quả cũ
    setRunResults(
      publicTestCases.map(() => ({
        passed: null,
        actualOutput: "",
        stderr: "",
        status: "Pending",
        runtime: "",
        memory: "",
      }))
    );
    setSubmissionResult(null); // Ẩn modal kết quả nộp bài nếu đang mở

    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    try {
      const newResults = publicTestCases.map(
        () =>
          ({
            passed: null,
            actualOutput: "",
            stderr: "",
            status: "Pending",
          } as RunResult)
      );

      for (let i = 0; i < publicTestCases.length; i++) {
        const tc = publicTestCases[i];
        try {
          const response = await axios.post("/routes/piston", {
            source_code: code,
            language: language,
            stdin: tc.input,
            problemId: problemId,
          });

          const resultData = response.data;
          const expected = tc.expectedOutput.trim();
          const actual = resultData.stdout ? resultData.stdout.trim() : "";
          const stderr = resultData.stderr || "";
          const runtime = resultData.time
            ? `${(resultData.time * 1000).toFixed(0)} ms`
            : "0 ms";
          const memory = resultData.memory
            ? `${(resultData.memory / 1024 / 1024).toFixed(2)} MB`
            : "0 MB";

          let status: RunResult["status"] = "Accepted";
          let passed = true;

          if (stderr) {
            status = "Runtime Error";
            passed = false;
          } else if (actual !== expected) {
            status = "Wrong Answer";
            passed = false;
          }

          newResults[i] = {
            passed,
            actualOutput: actual,
            stderr,
            status,
            runtime,
            memory,
          };
          setRunResults([...newResults]);
        } catch (error) {
          console.error(`Lỗi test case ${i}`, error);
        }
        if (i < publicTestCases.length - 1) await delay(300);
      }
    } finally {
      setIsRunning(false);
    }
  };

  // --- STATE USER ---
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // --- HANDLER: Nộp bài (Chạy TẤT CẢ Test Cases & Tính điểm) ---
  const { submitCode: submitContest, isSubmitting: isContestSubmitting, result: contestResult, error: contestError } = useContestSubmission({ 
    contestId: contestId || "", 
    userId: user?.uid 
  });

  useEffect(() => {
    if (contestResult) {
       setSubmissionResult({
         ...contestResult,
         status: contestResult.status as any 
       });
    }
  }, [contestResult]);
  
  useEffect(() => {
      if (contestError) {
          alert(contestError);
      }
  }, [contestError]);

  const handleSubmit = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để nộp bài!");
      return;
    }

    if (contestId) {
        // Sử dụng allTestCases đã load thay vì problem?.exampleTestCases
        const submissionId = await submitContest(
            code,
            language,
            contestProblemLogicId || problemId, // Logic ID (A) or fallback to doc ID
            problemId, // Actual Doc ID
            problemTitle,
            allTestCases 
        );

        if (submissionId) {
             router.push(`/routes/contests/${contestId}?tab=all-submissions&highlight=${submissionId}`);
        }
        return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    let passedCount = 0;
    let finalStatus: SubmissionResult["status"] = "Accepted";
    let maxRuntime = 0;
    let maxMemory = 0;

    try {
      for (let i = 0; i < allTestCases.length; i++) {
        const tc = allTestCases[i];

        try {
          const response = await axios.post("/routes/piston", {
            source_code: code,
            language: language,
            stdin: tc.input,
            problemId: problemId,
          });

          const resultData = response.data;
          const expected = tc.expectedOutput.trim();
          const actual = resultData.stdout ? resultData.stdout.trim() : "";
          const stderr = resultData.stderr || "";
          maxRuntime = Math.max(maxRuntime, resultData.time || 0);
          maxMemory = Math.max(maxMemory, resultData.memory || 0);

          if (stderr) {
            finalStatus = "Runtime Error";
          } else if (actual === expected) {
            passedCount++;
          } else {
            if (finalStatus === "Accepted") finalStatus = "Wrong Answer";
          }
        } catch (error) {
          console.error("Lỗi server submit:", error);
          finalStatus = "Runtime Error";
        }

        if (i < allTestCases.length - 1) await delay(300);
      }

      const result = {
        total: allTestCases.length,
        passed: passedCount,
        status: passedCount === allTestCases.length ? "Accepted" : finalStatus,
        runtime: `${(maxRuntime * 1000).toFixed(0)} ms`,
        memory: `${(maxMemory / 1024 / 1024).toFixed(2)} MB`,
      };

      setSubmissionResult(result);

      await saveSubmissionToFirestore({
        problemId,
        problemTitle,
        status: result.status,
        passed: result.passed,
        total: result.total,
        runtime: result.runtime,
        memory: result.memory,
        language: language,
        code: code,
      });

    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="w-[55%] flex flex-col mt-2 mr-5 mb-15 ml-1 rounded-2xl border-slate-700 border h-[90vh] bg-slate-950 items-center justify-center">
        <span className="text-gray-400 text-sm">Loading...</span>
      </div>
    );
  }
  /* 
   * ĐỒNG BỘ LỊCH SỬ NỘP BÀI
   * Luôn lưu vào Global History (users/{uid}/submissions) để tính vào profile chung.
   * Nếu đang trong Contest, lưu thêm vào Contest Submissions.
   */
  const saveSubmissionToFirestore = async (submissionData: {
    problemId: string;
    problemTitle: string;
    status: string;
    passed: number;
    total: number;
    runtime: string;
    memory: string;
    language: string;
    code: string;
  }) => {
    const user = auth.currentUser;
    if (!user) return; // Nếu chưa đăng nhập thì không lưu

    try {
      // 1. LUÔN LƯU VÀO GLOBAL HISTORY (Lịch sử luyện tập chung)
      const globalSubRef = collection(db, "users", user.uid, "submissions");
      await addDoc(globalSubRef, {
        ...submissionData,
        timestamp: serverTimestamp(), // Thời gian nộp bài theo server
        contestId: contestId || null, // Lưu thêm contestId nếu có để biết nguồn gốc
      });
      console.log("Đã lưu vào Lịch sử chung (Global History)");

      // 2. NẾU ĐANG TRONG CONTEST -> LƯU THÊM VÀO CONTEST HISTORY
      if (contestId) {
        const contestSubRef = collection(
          db,
          "contests",
          contestId,
          "user",
          user.uid,
          "submissions"
        );
        await addDoc(contestSubRef, {
          ...submissionData,
          userId: user.uid,
          userName: user.displayName || "User",
          contestId: contestId,
          timestamp: serverTimestamp(),
        });
        console.log("Đã lưu vào Contest History");
      }
    } catch (error) {
      console.error("Lỗi khi lưu bài nộp:", error);
    }
  };

  const updateLeaderboardIfAC = async (opts: {
    contestId: string;
    problemId: string;
  }) => {
    const user = auth.currentUser;
    if (!user) return;

    const { contestId, problemId } = opts;
    const lbRef = doc(db, "contests", contestId, "leaderboard", user.uid);

    let penaltyMinutes = 0;
    
    // 1. Tính Time Penalty (phút từ lúc bắt đầu contest)
    try {
      const contestSnap = await getDoc(doc(db, "contests", contestId));
      const data = contestSnap.data();
      const rawTime = data?.time || data?.startAt || data?.startTime;

      let startTimeMillis = 0;

      if (rawTime?.toMillis) {
        startTimeMillis = rawTime.toMillis();
      } else if (typeof rawTime === "string") {
        let s = rawTime.replace(" at ", " ");
        s = s.replace(/UTC([+-]\d+)/, "GMT$1");
        s = s.replace(/\u202F/g, " ");
        let d = new Date(s);
        
        if (isNaN(d.getTime())) {
             const todayStr = new Date().toLocaleDateString("en-US");
             d = new Date(`${todayStr} ${s}`);
        }
        startTimeMillis = d.getTime();
      } else if (typeof rawTime === "number") {
          startTimeMillis = rawTime;
      }

      if (startTimeMillis > 0 && !isNaN(startTimeMillis)) {
        penaltyMinutes = Math.max(
          0,
          Math.floor((Date.now() - startTimeMillis) / 60000)
        );
      }
    } catch (e) {
      console.error("Error calc penalty time:", e);
    }

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(lbRef);
      const cur = snap.exists() ? snap.data() : {};

      const acceptedProblems = (cur.acceptedProblems ?? {}) as Record<
        string,
        { penaltyMinutes?: number; acceptedAt?: any }
      >;

      // ✅ Nếu đã AC rồi thì không cộng điểm nữa
      if (acceptedProblems[problemId]) return;
      
      // 2. Lấy số lần nộp sai để tính phạt (20 phút / lần)
      const wrongSubmissionsMap = (cur.wrongSubmissions ?? {}) as Record<string, number>;
      const wrongCount = wrongSubmissionsMap[problemId] || 0;
      
      const additionalPenalty = wrongCount * 20;
      const totalProblemPenalty = penaltyMinutes + additionalPenalty;

      tx.set(
        lbRef,
        {
          uid: user.uid,
          acceptedCount: Number(cur.acceptedCount ?? 0) + 1,
          penalty: Number(cur.penalty ?? 0) + totalProblemPenalty,
          acceptedProblems: {
            ...acceptedProblems,
            [problemId]: { 
                penaltyMinutes: totalProblemPenalty, 
                acceptedAt: serverTimestamp() 
            },
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });
  };

  const markAttemptedProblem = async (opts: {
    contestId: string;
    problemId: string;
    isAccepted: boolean;
  }) => {
    const user = auth.currentUser;
    if (!user) return;

    const { contestId, problemId, isAccepted } = opts;
    const lbRef = doc(db, "contests", contestId, "leaderboard", user.uid);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(lbRef);
      const cur = snap.exists() ? snap.data() : {};
      
      const attempted = (cur.attemptedProblems ?? {}) as Record<string, boolean>;
      const wrongSubmissions = (cur.wrongSubmissions ?? {}) as Record<string, number>;
      const acceptedProblems = (cur.acceptedProblems ?? {}) as Record<string, any>;

      // Nếu đã AC rồi thì không tính sai nữa
      if (acceptedProblems[problemId]) return;

      const newWrongCount = wrongSubmissions[problemId] || 0;

      tx.set(
        lbRef,
        {
          uid: user.uid,
          attemptedProblems: { ...attempted, [problemId]: true },
          // Nếu KHÔNG phải AC -> tăng số lần sai
          wrongSubmissions: isAccepted 
            ? wrongSubmissions 
            : { ...wrongSubmissions, [problemId]: newWrongCount + 1 },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });
  };

  return (
    <div className="w-[55%] flex flex-col mt-2 mr-5 mb-15 ml-1 rounded-2xl border-slate-700 border h-[90vh] relative">
      {/* --- MODAL KẾT QUẢ NỘP BÀI (Overlay) --- */}
      {submissionResult && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center rounded-2xl backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full animate-in fade-in zoom-in duration-200">
            {/* Icon Trạng Thái */}
            <div
              className={`mb-4 p-4 rounded-full ${
                submissionResult.status === "Accepted"
                  ? "bg-green-900/30 text-green-500"
                  : "bg-red-900/30 text-red-500"
              }`}
            >
              {submissionResult.status === "Accepted" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>

            <h2
              className={`text-2xl font-bold mb-2 ${
                submissionResult.status === "Accepted"
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {submissionResult.status}
            </h2>

            <div className="text-gray-300 mb-6 text-center">
              Bạn đã vượt qua{" "}
              <span className="font-bold text-white">
                {submissionResult.passed}
              </span>{" "}
              /{" "}
              <span className="font-bold text-white">
                {submissionResult.total}
              </span>{" "}
              test cases.
            </div>
            {/* Thêm vào bên trong Modal submissionResult */}
            <div className="grid grid-cols-2 gap-4 w-full mb-6">
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center">
                <div className="text-xs text-gray-500 uppercase">Runtime</div>
                <div className="text-white font-mono">
                  {submissionResult.runtime}
                </div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center">
                <div className="text-xs text-gray-500 uppercase">Memory</div>
                <div className="text-white font-mono">
                  {submissionResult.memory}
                </div>
              </div>
            </div>
            <button
              onClick={() => setSubmissionResult(null)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium transition-colors border border-slate-600"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="p-3 flex items-center justify-between bg-slate-950 rounded-t-2xl border-b border-slate-700">
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="rounded border px-2 py-1 text-sm border-slate-700 bg-slate-800 text-white font-bold cursor-pointer outline-none"
        >
          {Object.keys(templates).length > 0 ? (
            Object.keys(templates).map((lang) => (
              <option key={lang} value={lang}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </option>
            ))
          ) : (
            <>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </>
          )}
        </select>

        <div className="flex gap-2">
          {/* Nút Chạy thử */}
          <button
            onClick={handleRun}
            disabled={isRunning || isSubmitting || publicTestCases.length === 0}
            className={`rounded px-4 py-1 text-sm font-semibold transition-all flex items-center gap-2 ${
              isRunning
                ? "bg-slate-700 text-gray-400 cursor-not-allowed"
                : "bg-slate-700 text-white hover:bg-slate-600"
            }`}
          >
            {isRunning ? "Running..." : "▶ Chạy thử"}
          </button>

          {/* Nút Nộp bài */}
          <button
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting || isContestSubmitting || allTestCases.length === 0}
            className={`rounded px-4 py-1 text-sm font-semibold transition-all flex items-center gap-2 ${
              isSubmitting || isContestSubmitting
                ? "bg-green-800 text-gray-300 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-500"
            }`}
          >
            {isSubmitting || isContestSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Submitting...
              </>
            ) : (
              "Nộp bài"
            )}
          </button>
        </div>
      </div>

      {/* EDITOR */}
      <div className="flex-1 overflow-hidden relative">
        <Editor
          height="100%"
          language={language === "cpp" ? "cpp" : language}
          theme="vs-dark"
          value={code} // Gán giá trị code từ state đã được đồng bộ
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
          }}
        />
      </div>

      {/* OUTPUT PANEL (Chỉ hiển thị cho Chạy thử) */}
      <div className="h-[40%] bg-slate-950 flex flex-col rounded-b-2xl border-t border-slate-700">
        {publicTestCases.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Không có Test Case mẫu nào để hiển thị.
          </div>
        )}

        {publicTestCases.length > 0 && (
          <>
            <div className="flex bg-slate-900 border-b border-slate-800 shrink-0">
              {publicTestCases.map((tc, index) => {
                const result = runResults[index];
                return (
                  <button
                    key={tc.id}
                    onClick={() => setActiveTab(index)}
                    className={`px-4 py-2 text-xs font-bold flex items-center gap-2 transition-colors border-r border-slate-800 ${
                      activeTab === index
                        ? "bg-slate-950 text-white border-t-2 border-t-blue-500"
                        : "text-gray-500 hover:bg-slate-800"
                    }`}
                  >
                    Case {index + 1}
                    {result && result.status !== "Pending" && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          result.stderr
                            ? "bg-yellow-500"
                            : result.passed
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 p-4 overflow-y-auto font-mono text-sm scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
              <div className="space-y-4 pb-4">
                {runResults[activeTab] &&
                  runResults[activeTab].status !== "Pending" && (
                    <div className="flex gap-4 mb-2">
                      <div className="text-[10px] bg-slate-800 px-2 py-1 rounded border border-slate-700 text-white">
                        <span className="text-white">Runtime:</span>{" "}
                        {runResults[activeTab].runtime}
                      </div>
                      <div className="text-[10px] bg-slate-800 px-2 py-1 rounded border border-slate-700 text-white">
                        <span className="text-white">Memory:</span>{" "}
                        {runResults[activeTab].memory}
                      </div>
                    </div>
                  )}
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">
                    Input:
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg text-gray-300 border border-slate-700 whitespace-pre-wrap">
                    {publicTestCases[activeTab]?.input}
                  </div>
                </div>
                {runResults[activeTab] &&
                  runResults[activeTab].status !== "Pending" && (
                    <div>
                      <div className="text-xs text-gray-500 uppercase mb-1">
                        Actual Output:
                      </div>
                      {runResults[activeTab].stderr ? (
                        <div className="bg-red-900/20 p-3 rounded-lg text-red-400 border border-red-900/50 whitespace-pre-wrap">
                          {runResults[activeTab].stderr}
                        </div>
                      ) : (
                        <div
                          className={`p-3 rounded-lg border whitespace-pre-wrap ${
                            runResults[activeTab].passed
                              ? "bg-slate-800 text-white border-slate-700"
                              : "bg-red-900/10 text-red-200 border-red-900/30"
                          }`}
                        >
                          {runResults[activeTab].actualOutput || (
                            <span className="text-gray-500 italic">
                              No output
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">
                    Expected Output:
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg text-gray-300 border border-slate-700 whitespace-pre-wrap">
                    {publicTestCases[activeTab]?.expectedOutput}
                  </div>
                </div>
                {!runResults[activeTab] ||
                runResults[activeTab].status === "Pending" ? (
                  <div className="text-gray-500 italic text-xs mt-4 text-center">
                    Nhấn "▶ Chạy thử" để xem kết quả.
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
