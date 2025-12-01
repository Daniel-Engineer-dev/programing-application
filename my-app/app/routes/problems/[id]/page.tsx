// app/problems/[id]/page.tsx
import ProblemDetails from "@/src/component/ProblemDetail/ProblemDetail";
import { db } from "@/src/api/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import EditorPanel from "@/src/component/EditorPanel/EditorPanel";
export default async function ProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const problemId = resolvedParams.id;

  const ref = doc(db, "problems", problemId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return <div>Problem not found</div>;

  const problem = snap.data();

  return (
    <div className="flex h-screen w-full bg-slate-950 fixed">
      <ProblemDetails
        title={problem.title}
        difficulty={problem.difficulty}
        description={problem.description}
        examples={problem.examples}
        constraints={problem.constraints}
      />

      {/* Editor component */}
      <EditorPanel />
    </div>
  );
}
