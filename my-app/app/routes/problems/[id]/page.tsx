"use client";
import ProblemDetails from "@/src/Component/ProblemDetail/ProblemDetail";
import { db } from "@/src/api/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import EditorPanel from "@/src/Component/EditorPanel/EditorPanel";
import { useState, useEffect } from "react";

export default function ProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [sourceCode, setSourceCode] = useState("");
  const [language, setLanguage] = useState("cpp"); // Đặt mặc định là cpp cho đồng bộ

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const resolvedParams = await params;
        const ref = doc(db, "problems", resolvedParams.id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();

          // Chuyển đổi Timestamp thủ công cho các trường phức tạp
          const editorial = data.editorial
            ? {
                ...data.editorial,
                lastUpdated:
                  data.editorial.lastUpdated?.toDate().toISOString() || null,
              }
            : null;

          const baseData = {
            ...data,
            id: snap.id,
            editorial: editorial,
          };

          // Fix lỗi "Plain Object": Loại bỏ mọi class instance còn sót lại
          const safeData = JSON.parse(JSON.stringify(baseData));

          setProblem(safeData);
        }
      } catch (error) {
        console.error("Error fetching problem:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [params]);

  const handleRestoreCode = (
    restoredCode: string,
    restoredLanguage: string
  ) => {
    setSourceCode(restoredCode);
    setLanguage(restoredLanguage);
  };

  if (loading)
    return (
      <div className="bg-slate-950 h-screen text-white p-5">Loading...</div>
    );
  if (!problem)
    return (
      <div className="bg-slate-950 h-screen text-white p-5">
        Problem not found
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
      />

      <EditorPanel
        problemId={problem.id}
        initialCode={sourceCode}
        currentLanguage={language}
        onCodeChange={(val) => setSourceCode(val)}
        onLanguageChange={(lang) => setLanguage(lang)}
      />
    </div>
  );
}
