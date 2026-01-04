"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/src/api/firebase/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { FiX, FiSearch } from "react-icons/fi";

export default function AddProblemModal({
  onClose,
  onRefresh,
  challengeId,
  existingIds,
}: any) {
  const [allProblems, setAllProblems] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "problems"));
        const probs = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((p) => !existingIds.includes(p.id));
        setAllProblems(probs);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, [existingIds]);

  const handleAdd = async () => {
    if (selectedIds.length === 0) return;
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(
        doc(db, "users", user.uid, "savechallenges", challengeId),
        {
          problemIds: arrayUnion(...selectedIds),
        }
      );
      onRefresh();
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = allProblems.filter((p) =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      {/* Khung Modal bo góc 2rem và nền xanh đen chuẩn ảnh */}
      <div className="bg-[#111827] border border-slate-800 w-full max-w-[480px] rounded-[1.5rem] overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Thêm bài tập</h2>

          {/* Ô tìm kiếm bo tròn nhẹ, nền tối */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Tìm tên bài tập..."
              className="w-full bg-[#1f2937] border border-slate-700 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-blue-500 transition-all text-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <p className="text-sm text-slate-400 mb-3 font-semibold">
            Chọn bài tập ({selectedIds.length}):
          </p>

          {/* Danh sách bài tập: Mỗi bài là 1 khối bg-[#1a2234] như ảnh bạn chụp */}
          <div className="max-h-[320px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {loading ? (
              <div className="text-center py-10 text-slate-500">
                Đang tải...
              </div>
            ) : (
              filtered.map((p) => (
                <div
                  key={p.id}
                  onClick={() =>
                    setSelectedIds((prev) =>
                      prev.includes(p.id)
                        ? prev.filter((i) => i !== p.id)
                        : [...prev, p.id]
                    )
                  }
                  className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${
                    selectedIds.includes(p.id)
                      ? "bg-[#1e293b] border-blue-500/50"
                      : "bg-[#1a2234] border-transparent hover:bg-[#252f48]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox vuông chuẩn ảnh */}
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      readOnly
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-200 leading-tight">
                        {p.title}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">
                        {p.difficulty || "EASY"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer: Căn phải, nút xanh dương chuẩn Codepro */}
        <div className="p-6 flex justify-end items-center gap-4 bg-[#111827]">
          <button
            onClick={onClose}
            className="text-sm font-bold text-slate-500 hover:text-white transition"
          >
            Hủy
          </button>
          <button
            onClick={handleAdd}
            disabled={selectedIds.length === 0}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-slate-700 text-white px-8 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg active:scale-95"
          >
            Thêm
          </button>
        </div>
      </div>
    </div>
  );
}
