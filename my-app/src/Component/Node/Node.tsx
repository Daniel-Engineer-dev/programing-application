"use client";

export default function NotesPage() {
  return (
    <div className="text-white px-10 py-8">
      <h1 className="text-3xl font-bold mb-4">Ghi chú</h1>
      <p className="text-gray-300 mb-4">
        Bạn có thể ghi lại mẹo, công thức hoặc ý tưởng quan trọng khi luyện
        code.
      </p>

      <div className="bg-[#15192f] rounded-xl p-4">
        <textarea
          className="w-full h-48 bg-transparent border border-gray-600 rounded-lg px-3 py-2 text-sm outline-none resize-none"
          placeholder="Ví dụ: Cách tối ưu hoá Two Pointers, mẹo nhớ công thức DP, template BFS/DFS..."
        />
        <div className="flex justify-end mt-3">
          <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm">
            Lưu ghi chú (mock)
          </button>
        </div>
      </div>
    </div>
  );
}
