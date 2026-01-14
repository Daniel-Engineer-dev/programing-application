"use client";
import ProblemDetails from "@/src/Component/ProblemDetail/ProblemDetail";
import { db } from "@/src/api/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import EditorPanel from "@/src/Component/EditorPanel/EditorPanel";
import { useState, useEffect, use } from "react"; 
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { toast } from "sonner";
import { collection, query, where, getDocs } from "firebase/firestore";


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
  
  const { user } = useAuthContext();
  const router = useRouter();

  // Helper function to calculate contest status
  const getContestStatus = (start: Date, lengthMinutes: number, now: Date) => {
    const startMs = start.getTime();
    const endMs = startMs + Number(lengthMinutes ?? 0) * 60 * 1000;
    if (now.getTime() < startMs) return "UPCOMING";
    if (now.getTime() >= startMs && now.getTime() <= endMs) return "ONGOING";
    return "ENDED";
  };
  
  // Clean time string helper
  const parseWeirdTimeString = (input: string): Date => {
      if (!input) return new Date();
      let s = input.replace(" at ", " ");
      s = s.replace(/UTC([+-]\d+(?::\d+)?)/, "GMT$1");
      s = s.replace(/\u202F/g, " ");
      return new Date(s);
  };

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

          // New: Check access permissions
          if (contestData) {
             const now = new Date();
             const status = getContestStatus(parseWeirdTimeString(contestData.time), contestData.length, now);
             
             if (status === "ONGOING") {
                if (!user) {
                    toast.error("Vui lòng đăng nhập và đăng ký tham gia cuộc thi!");
                    router.push(`/routes/contests/${contestId}`);
                    return;
                }
                
                // Check if user is registered
                const regRef = doc(db, "contests", contestId, "registrations", user.uid);
                const regSnap = await getDoc(regRef);
                
                // Check virtual participation as fallback
                const virtualRef = doc(db, "contests", contestId, "virtual_participations", user.uid);
                const virtualSnap = await getDoc(virtualRef);
                const isVirtual = virtualSnap.exists() && virtualSnap.data().status === "ONGOING";

                if (!regSnap.exists() && !isVirtual) {
                    toast.error("Bạn chưa đăng ký tham gia cuộc thi này!");
                    router.push(`/routes/contests/${contestId}`);
                    return;
                }
             } else if (status === "UPCOMING") {
                 toast.error("Cuộc thi chưa bắt đầu!");
                 router.push(`/routes/contests/${contestId}`);
                 return;
             }
          }

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
  }, [problemID, contestId, user, router]);

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
