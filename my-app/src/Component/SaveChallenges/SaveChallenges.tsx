"use client";

interface SavedItem {
  id: number;
  title: string;
  desc: string;
  difficulty: "Dễ" | "Trung bình" | "Khó";
  status: "Chưa làm" | "Đang làm" | "Hoàn thành";
}

export default function SaveChallengesPage() {
  const items: SavedItem[] = [
    {
      id: 1,
      title: "Xây dựng REST API với Node.js",
      desc: "Tạo các endpoint xác thực người dùng và truy xuất dữ liệu.",
      difficulty: "Trung bình",
      status: "Đang làm",
    },
    {
      id: 2,
      title: "Thử thách bố cục CSS Flexbox",
      desc: "Tạo bố cục đáp ứng phức tạp bằng thuộc tính Flexbox.",
      difficulty: "Dễ",
      status: "Chưa làm",
    },
    {
      id: 3,
      title: "Thuật toán: Đường đi ngắn nhất Dijkstra",
      desc: "Áp dụng Dijkstra để tìm đường đi ngắn nhất trên đồ thị.",
      difficulty: "Khó",
      status: "Hoàn thành",
    },
  ];

  return (
    <div className="text-white px-10 py-8">
      <h1 className="text-3xl font-bold mb-6">Danh sách đã lưu</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-[#15192f] rounded-xl p-5">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="font-semibold text-lg mb-1">{item.title}</h2>
                <p className="text-sm text-gray-300">{item.desc}</p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm">
                Bắt đầu
              </button>
            </div>

            <div className="flex gap-3 text-xs mt-2">
              <span className="px-2 py-1 rounded-full bg-slate-600/40 text-gray-200">
                Độ khó: {item.difficulty}
              </span>
              <span className="px-2 py-1 rounded-full bg-slate-600/40 text-gray-200">
                Trạng thái: {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
