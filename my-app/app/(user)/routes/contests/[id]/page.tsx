import React from "react";
import { Frown } from "lucide-react";
import Link from "next/link";
import { fetchContestDetailsServer } from "./lib/fetchContest";
import ContestLivePage from "./ContestLivePage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const contest = await fetchContestDetailsServer(id);

  if (!contest) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <Frown size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Không tìm thấy Contest</h1>
        <Link href="/routes/contests" className="mt-6 text-blue-400 underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return <ContestLivePage initialContest={contest} serverNow={Date.now()} />;
}
