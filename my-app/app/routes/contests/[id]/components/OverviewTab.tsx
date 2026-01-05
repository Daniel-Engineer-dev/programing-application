import React from "react";
import { ContestDetail } from "../lib/fetchContest";

export default function OverviewTab({ contest }: { contest: ContestDetail }) {
  return (
    <>
      <h2 className="text-2xl font-semibold text-white">Giới thiệu</h2>
      <div className="text-slate-300 leading-relaxed border-l-4 border-blue-500 pl-4 bg-slate-800 p-4 rounded-lg text-justify">
        <p>{contest.description}</p>
      </div>
      <h2 className="text-2xl font-semibold text-white pt-4">Thông tin</h2>
      <ul className="list-disc list-inside space-y-2 text-slate-400">
        <li>Thời gian: 5 giờ liên tục.</li>
        <li>Số lượng bài: {contest.problems.length} bài toán lập trình.</li>
        <li>Ngôn ngữ: C++, Java, Python.</li>
      </ul>
    </>
  );
}
