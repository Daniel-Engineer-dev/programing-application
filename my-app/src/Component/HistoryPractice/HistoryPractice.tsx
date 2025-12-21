"use client";

export default function HistoryPracticePage() {
  return (
    <div className="text-white bg-slate-950 p-8 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Lịch sử luyện tập</h1>

      <div className="bg-slate-900 border border-slate-700 p-6 rounded">
        <table className="w-full text-left">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="p-3">Nộp lần cuối</th>
              <th>Bài tập</th>
              <th>Kết quả</th>
              <th>Số lần nộp</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-t border-slate-700">
              <td className="p-3">2 ngày trước</td>
              <td>136. Single Number</td>
              <td>
                <span className="text-green-400">Chấp nhận</span>
              </td>
              <td>3</td>
            </tr>

            <tr className="border-t border-slate-700">
              <td className="p-3">1 tuần trước</td>
              <td>53. Maximum Subarray</td>
              <td>
                <span className="text-red-400">Sai đáp án</span>
              </td>
              <td>5</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
