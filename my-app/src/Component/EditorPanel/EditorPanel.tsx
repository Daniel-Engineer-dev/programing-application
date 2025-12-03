"use client";
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";

// 2. Import Firebase
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/src/api/firebase/firebase";

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
};

type SubmissionResult = {
  total: number;
  passed: number;
  status: "Accepted" | "Wrong Answer" | "Runtime Error" | "Pending";
};

export default function EditorPanel({ problemId }: { problemId: string }) {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [isPageLoading, setIsPageLoading] = useState(true);

  // --- STATE EDITOR ---
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("");
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

        const allTests: TestCase[] = [];
        const publicTests: TestCase[] = [];

        testCasesSnap.forEach((doc) => {
          const t = doc.data();
          const isHidden = t.isHidden === true || t.isHidden === "true";

          const testCaseObj = {
            id: doc.id,
            input: t.input,
            expectedOutput: t.expected || t.expectedOutput,
            isHidden: isHidden,
          };

          allTests.push(testCaseObj); // Lưu tất cả vào đây để Submit

          if (!isHidden) {
            publicTests.push(testCaseObj); // Chỉ lưu public để hiện Tab
          }
        });

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

          let status: RunResult["status"] = "Accepted";
          let passed = true;

          if (stderr) {
            status = "Runtime Error";
            passed = false;
          } else if (actual !== expected) {
            status = "Wrong Answer";
            passed = false;
          }

          newResults[i] = { passed, actualOutput: actual, stderr, status };
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

  // --- HANDLER: Nộp bài (Chạy TẤT CẢ Test Cases & Tính điểm) ---
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionResult(null); // Reset kết quả trước đó

    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    let passedCount = 0;
    let finalStatus: SubmissionResult["status"] = "Accepted";

    try {
      // Chạy vòng lặp qua ALL test cases
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

          if (stderr) {
            finalStatus = "Runtime Error";
            // Nếu gặp lỗi Runtime, có thể dừng luôn hoặc chạy tiếp tuỳ logic (ở đây chạy tiếp để đếm)
          } else if (actual === expected) {
            passedCount++;
          } else {
            if (finalStatus === "Accepted") finalStatus = "Wrong Answer";
          }
        } catch (error) {
          console.error("Lỗi server submit:", error);
          finalStatus = "Runtime Error";
        }

        // Delay để tránh Rate Limit (quan trọng vì submit chạy nhiều test hơn)
        if (i < allTestCases.length - 1) await delay(300);
      }

      // Sau khi chạy xong hết
      setSubmissionResult({
        total: allTestCases.length,
        passed: passedCount,
        status: passedCount === allTestCases.length ? "Accepted" : finalStatus,
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
            disabled={isRunning || isSubmitting || allTestCases.length === 0}
            className={`rounded px-4 py-1 text-sm font-semibold transition-all flex items-center gap-2 ${
              isSubmitting
                ? "bg-green-800 text-gray-300 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-500"
            }`}
          >
            {isSubmitting ? (
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
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(val: string | undefined) => setCode(val || "")}
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
                    <div
                      className={`text-xs font-bold mb-2 ${
                        runResults[activeTab].passed
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {runResults[activeTab].status}
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
