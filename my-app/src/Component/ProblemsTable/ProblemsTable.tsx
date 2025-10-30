// Component/ProblemsTable.tsx
import Link from "next/link";

type Problem = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  acceptance: number; // 0..1
  tags: string[];
  status?: "Solved" | "Attempted" | "Todo";
};

const problems: Problem[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    acceptance: 0.48,
    tags: ["Array", "Hash Table"],
    status: "Solved",
  },
  {
    id: "add-two-numbers",
    title: "Add Two Numbers",
    difficulty: "Medium",
    acceptance: 0.39,
    tags: ["Linked List", "Math"],
    status: "Attempted",
  },
  {
    id: "lru-cache",
    title: "LRU Cache",
    difficulty: "Hard",
    acceptance: 0.27,
    tags: ["Design", "Hash Table"],
    status: "Todo",
  },
];

const badgeColor = (d: Problem["difficulty"]) =>
  d === "Easy"
    ? "text-green-700 bg-green-50 border-green-200"
    : d === "Medium"
    ? "text-yellow-700 bg-yellow-50 border-yellow-200"
    : "text-red-700 bg-red-50 border-red-200";

export default function ProblemsTable() {
  return (
    <section className="mt-6 px-12 pb-16 pt-6">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-xl font-semibold">Problems</h2>
        <input
          placeholder="Search problems..."
          className="w-64 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="min-w-full table-fixed text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="w-[48px] px-4 py-3">#</th>
              <th className="px-4 py-3">Title</th>
              <th className="w-28 px-4 py-3">Difficulty</th>
              <th className="w-32 px-4 py-3">Acceptance</th>
              <th className="px-4 py-3">Tags</th>
              <th className="w-28 px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((p, i) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/problems/${p.id}`}
                    className="font-medium hover:text-blue-600"
                  >
                    {p.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 text-xs ${badgeColor(
                      p.difficulty
                    )}`}
                  >
                    {p.difficulty}
                  </span>
                </td>
                <td className="px-4 py-3">{Math.round(p.acceptance * 100)}%</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-gray-100 px-2 py-0.5 text-xs"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs ${
                      p.status === "Solved"
                        ? "text-green-600"
                        : p.status === "Attempted"
                        ? "text-yellow-700"
                        : "text-gray-500"
                    }`}
                  >
                    {p.status ?? "-"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
