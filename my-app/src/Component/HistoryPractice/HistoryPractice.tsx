"use client";

interface PracticeRow {
  time: string;
  problem: string;
  result: "Chấp nhận" | "Sai đáp án";
  submit: number;
}

export default function HistoryPracticePage() {
  const rows: PracticeRow[] = [
    {
      time: "2 ngày trước",
      problem: "136. Single Number",
      result: "Chấp nhận",
      submit: 3,
    },
    {
      time: "5 ngày trước",
      problem: "20. Valid Parentheses",
      result: "Chấp nhận",
      submit: 1,
    },
    {
      time: "1 tuần trước",
      problem: "53. Maximum Subarray",
      result: "Sai đáp án",
      submit: 5,
    },
    {
      time: "2 tuần trước",
      problem: "1. Two Sum",
      result: "Chấp nhận",
      submit: 2,
    },
  ];

  return (
    <div className="text-white px-10 py-8">
      <h1 className="text-3xl font-bold mb-6">Lịch sử luyện tập</h1>

      <div className="bg-[#15192f] rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 text-sm font-semibold px-6 py-3 border-b border-gray-700">
          <span>Nộp lần cuối</span>
          <span>Bài tập</span>
          <span>Kết quả cuối</span>
          <span>Số lần nộp</span>
        </div>

        {rows.map((row, idx) => (
          <div
            key={idx}
            className="grid grid-cols-4 text-sm px-6 py-3 border-t border-gray-800"
          >
            <span>{row.time}</span>
            <span>{row.problem}</span>
            <span>
              {row.result === "Chấp nhận" ? (
                <span className="px-2 py-1 rounded-full bg-green-600/30 text-green-300 text-xs">
                  {row.result}
                </span>
              ) : (
                <span className="px-2 py-1 rounded-full bg-red-600/30 text-red-300 text-xs">
                  {row.result}
                </span>
              )}
            </span>
            <span>{row.submit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
