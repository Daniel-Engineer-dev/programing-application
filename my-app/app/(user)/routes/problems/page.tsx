// app/problems/page.tsx
import ProblemsTable from "@/src/Component/ProblemsTable/ProblemsTable";
import PageTransition from "@/src/pageTransition/pageTransition";

export default function ProblemsPage() {
  return (
    <PageTransition>
      <ProblemsTable />
    </PageTransition>
  );
}
