"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/src/api/firebase/firebase"; // Đảm bảo có export auth từ firebase config
import { collection, getDocs, addDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function ChallengeModal({
  onClose,
  onRefresh,
}: {
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [name, setName] = useState("");
  const [allProblems, setAllProblems] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        alert("Bạn cần đăng nhập để tạo thử thách!");
        onClose();
      }
    });
    return () => unsubscribe();
  }, [onClose]);

  // 2. Lấy danh sách bài tập từ hệ thống
  useEffect(() => {
    const fetchProblems = async () => {
      const querySnapshot = await getDocs(collection(db, "problems"));
      setAllProblems(
        querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };
    fetchProblems();
  }, []);

  const handleCreate = async () => {
    if (!userId) return alert("Vui lòng đăng nhập!");
    if (!name.trim() || selectedIds.length === 0)
      return alert("Nhập tên và chọn bài!");

    setLoading(true);
    try {
      // LƯU VÀO: users -> {userId} -> savechallenges
      const userChallengesRef = collection(
        db,
        "users",
        userId,
        "savechallenges"
      );

      await addDoc(userChallengesRef, {
        name: name,
        problemIds: selectedIds,
        createdAt: new Date(),
        status: "Đang làm",
      });

      onRefresh();
      onClose();
    } catch (e) {
      console.error("Lỗi khi lưu:", e);
      alert("Lỗi hệ thống khi lưu thử thách.");
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "text-emerald-400 bg-emerald-400/10";
      case "medium":
        return "text-yellow-400 bg-yellow-400/10";
      case "hard":
        return "text-rose-400 bg-rose-400/10";
      default:
        return "text-slate-400 bg-slate-400/10";
    }
  };

  // Filter problems based on search
  const filteredProblems = allProblems.filter(p => 
      (p.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.id || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-lg p-6 shadow-2xl text-white">
        <h2 className="text-xl font-bold mb-4">Tạo Thử Thách Mới</h2>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mb-4 text-white focus:border-blue-500 outline-none"
          placeholder="Tên danh sách ..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        
        <div className="mb-2">
             <input
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-300 focus:border-blue-500 outline-none"
                placeholder="🔍 Tìm kiếm bài tập..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <p className="text-xs text-slate-400 mb-2 font-medium flex justify-between">
          <span>Chọn bài tập:</span>
          <span>Đã chọn: {selectedIds.length}</span>
        </p>
        <div className="max-h-60 overflow-y-auto border border-slate-800 rounded bg-slate-950 p-2 mb-6 custom-scrollbar">
          {filteredProblems.map((p) => (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3 mb-2 rounded-lg cursor-pointer transition ${
                selectedIds.includes(p.id)
                  ? "bg-blue-600/20 border border-blue-600/50"
                  : "bg-slate-800/40 hover:bg-slate-800"
              }`}
              onClick={() =>
                setSelectedIds((prev) =>
                  prev.includes(p.id)
                    ? prev.filter((i) => i !== p.id)
                    : [...prev, p.id]
                )
              }
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(p.id)}
                  readOnly
                  className="accent-blue-500"
                />
                <span className="text-sm font-medium text-slate-200">
                  {p.title || p.id}
                </span>
              </div>

              {/* Phần hiển thị Badge độ khó có màu */}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getDifficultyColor(
                  p.difficulty
                )}`}
              >
                {p.difficulty || "EASY"}
              </span>
            </div>
          ))}
          {filteredProblems.length === 0 && (
              <p className="text-center text-slate-500 text-xs py-4">Không tìm thấy bài tập nào.</p>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition"
          >
            Hủy
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded font-bold text-white disabled:opacity-50 transition shadow-lg shadow-blue-900/20"
          >
            {loading ? "Đang xử lý..." : "Tạo"}
          </button>
        </div>
      </div>
    </div>
  );
}
