"use client";
import ProblemDetails from "@/src/Component/ProblemDetail/ProblemDetail";
import { db } from "@/src/api/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import EditorPanel from "@/src/Component/EditorPanel/EditorPanel";
import { useState, useEffect, use } from "react"; // Thêm 'use' để giải nén params


export default function ContestProblemPage({
  params,
}: {
  params: Promise<{ id: string; problemID: string }>;
}) {
  // 1. Giải nén cả contestId (id) và problemID
  const resolvedParams = use(params);
  const contestId = resolvedParams.id;
  const problemID = resolvedParams.problemID;

  const [problem, setProblem] = useState<any>(null);
  const [contestProblemTitle, setContestProblemTitle] = useState(""); // Lưu Title từ Contest
  const [contestProblemLogicId, setContestProblemLogicId] = useState(""); // Lưu ID Logic (A, B...)
  const [loading, setLoading] = useState(true);
  const [sourceCode, setSourceCode] = useState("");
  const [language, setLanguage] = useState("cpp");

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        // 2. Dùng problemID để lấy dữ liệu bài toán từ bảng "problems" chung
        const probRef = doc(db, "problems", problemID);
        const probSnap = await getDoc(probRef);

        const contestRef = doc(db, "contests", contestId);
        const contestSnap = await getDoc(contestRef);

        if (probSnap.exists() && contestSnap.exists()) {
          const probData = probSnap.data();
          const contestData = contestSnap.data();

          const problemInContest = contestData.problems?.find(
            (p: any) => p.problemID === problemID
          );

          setContestProblemTitle(problemInContest?.title || probData.title);
          setContestProblemLogicId(problemInContest?.id || "");

          setProblem({
            ...probData,
            id: probSnap.id,
          });
        }
      } catch (error) {
        console.error("Error fetching problem:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [problemID, contestId]);

  const handleRestoreCode = (
    restoredCode: string,
    restoredLanguage: string
  ) => {
    setSourceCode(restoredCode);
    setLanguage(restoredLanguage);
  };

  if (loading)
    return (
      <div className="bg-slate-950 h-screen text-white p-5">
        Đang tải đề bài...
      </div>
    );
  if (!problem)
    return (
      <div className="bg-slate-950 h-screen text-white p-5">
        Không tìm thấy bài tập
      </div>
    );

  return (
    <div className="flex h-screen w-full bg-slate-950 fixed">
      <ProblemDetails
        title={problem.title}
        problemId={problem.id}
        difficulty={problem.difficulty}
        description={problem.description}
        examples={problem.examples || []}
        constraints={problem.constraints || []}
        tags={problem.tags || []}
        editorial={problem.editorial}
        onRestoreCode={handleRestoreCode}
        isContestMode={true}
      />

      <EditorPanel
        problemId={problem.id}
        contestId={contestId}
        contestProblemLogicId={contestProblemLogicId}
        problemTitle={contestProblemTitle}
        initialCode={sourceCode}
        currentLanguage={language}
        onCodeChange={(val) => setSourceCode(val)}
        onLanguageChange={(lang) => setLanguage(lang)}
      />
    </div>
  );
}
