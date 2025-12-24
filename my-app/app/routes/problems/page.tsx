// app/problems/page.tsx
import ProblemsTable from "@/src/Component/ProblemsTable/ProblemsTable";
import PageTransition from "@/src/pageTransition/pageTransition";

export default function ProblemsPage() {
  return (
    <PageTransition>
      <div className="py-6">
        <h1 className="mb-4 text-2xl font-bold px-12 text-white">
          Danh sách bài toán
        </h1>
        <p className="mb-4 px-12 text-slate-300">
          Nâng cao kỹ năng của bạn với bộ sưu tập 1000 bài toán lập trình của
          chúng tôi
        </p>
        <ProblemsTable />
      </div>
    </PageTransition>
  );
}
