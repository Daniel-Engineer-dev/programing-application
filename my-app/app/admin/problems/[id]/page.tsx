"use client";

import ProblemForm from "@/src/Component/Admin/ProblemForm";
import { useParams } from "next/navigation";

export default function EditProblemPage() {
  const params = useParams();
  const id = params.id as string;

  return <ProblemForm problemId={id} />;
}
