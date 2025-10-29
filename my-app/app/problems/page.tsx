// app/problems/page.tsx
import ProblemsTable from "@/Component/ProblemsTable";

export default function ProblemsPage() {
  return (
    <div className="py-6">
      <h1 className="mb-4 text-2xl font-bold">Danh sách bài toán</h1>
      <ProblemsTable />
    </div>
  );
}
