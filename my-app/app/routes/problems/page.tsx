// app/problems/page.tsx
import ProblemsTable from "@/src/component/ProblemsTable/ProblemsTable";
import PageTransition from "@/src/pageTransition/pageTransition";

export default function ProblemsPage() {
  return (
    <PageTransition>
      <div className="py-6">
        <h1 className="mb-4 text-2xl font-bold px-12">Danh sách bài toán</h1>
        <ProblemsTable />
      </div>
    </PageTransition>
  );
}
