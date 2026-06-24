// app/problems/page.tsx
import ProblemsTable from "@/components/ProblemsTable/ProblemsTable";
import PageTransition from "@/components/transitions/pageTransition";

export default function ProblemsPage() {
  return (
    <PageTransition>
      <ProblemsTable />
    </PageTransition>
  );
}
