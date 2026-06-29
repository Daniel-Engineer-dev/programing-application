"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/contexts/authContext";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  Plus,
  Save,
  Trash2,
  FileText,
  Loader2,
  ChevronRight,
  Calendar,
} from "lucide-react";

type Note = {
  id: string;
  title: string;
  content: string;
  updatedAt: any;
};

export default function NotesPage() {
  const { user } = useAuthContext();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Lấy danh sách ghi chú thời gian thực
  useEffect(() => {
    if (!user?.uid) return;
    const notesRef = collection(db, "users", user.uid, "notes");
    const q = query(notesRef, orderBy("updatedAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[];
      setNotes(notesList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Hàm tạo ghi chú mới (Reset form)
  const handleNewNote = () => {
    setSelectedNote(null);
    setTitle("");
    setContent("");
  };

  // 3. Hàm chọn ghi chú để xem/sửa
  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
  };

  // 4. Hàm Lưu (Thêm mới hoặc Cập nhật)
  const handleSave = async () => {
    if (!user?.uid || !title.trim()) return;
    setIsSaving(true);
    try {
      const notesRef = collection(db, "users", user.uid, "notes");

      if (selectedNote) {
        // Cập nhật ghi chú cũ
        await updateDoc(doc(db, "users", user.uid, "notes", selectedNote.id), {
          title,
          content,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Thêm ghi chú mới
        const newDoc = await addDoc(notesRef, {
          title,
          content,
          updatedAt: serverTimestamp(),
        });
        setSelectedNote({
          id: newDoc.id,
          title,
          content,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      alert("Lỗi khi lưu ghi chú!");
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Hàm Xóa ghi chú
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.uid || !confirm("Bạn có chắc chắn muốn xóa ghi chú này?"))
      return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "notes", id));
      if (selectedNote?.id === id) handleNewNote();
    } catch (error) {
      alert("Lỗi khi xóa!");
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
      {/* SIDEBAR: DANH SÁCH GHI CHÚ */}
      <aside className="relative z-10 w-80 border-r border-slate-900 bg-slate-900/50 flex flex-col">
        <div className="p-5 border-b border-slate-900 flex items-center justify-between">
          <h2 className="font-bold text-lg text-white">Ghi chú ({notes.length})</h2>
          <button
            onClick={handleNewNote}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {loading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="animate-spin text-slate-600" />
            </div>
          ) : (
            notes.map((n) => (
              <div
                key={n.id}
                onClick={() => selectNote(n)}
                className={`p-4 border-b border-slate-900 cursor-pointer transition-colors hover:bg-slate-850/50 group relative
                ${
                  selectedNote?.id === n.id
                    ? "bg-slate-850 border-l-2 border-l-blue-600"
                    : ""
                }`}
              >
                <h3 className="font-semibold text-base truncate pr-6 group-hover:text-blue-400 transition-colors">
                  {n.title || "Ghi chú không tên"}
                </h3>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                  <Calendar size={11} />{" "}
                  {n.updatedAt?.toDate
                    ? n.updatedAt.toDate().toLocaleDateString()
                    : "Vừa xong"}
                </div>
                <button
                  onClick={(e) => handleDelete(n.id, e)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* MAIN: EDITOR */}
      <main className="relative z-10 flex-1 flex flex-col p-8 bg-slate-950">
        <div className="max-w-4xl w-full mx-auto flex flex-col h-full">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề ghi chú..."
            className="bg-transparent text-3xl font-bold outline-none mb-6 placeholder:text-slate-800 text-white border-b border-transparent focus:border-slate-800 pb-2"
          />

          <div className="flex-1 relative mb-8">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bắt đầu viết nội dung tại đây..."
              className="w-full h-full bg-slate-900 border border-slate-800 rounded-xl p-5 text-base outline-none focus:border-slate-800 transition-colors resize-none scrollbar-thin scrollbar-thumb-slate-800 text-slate-200"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              Lưu ghi chú
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
