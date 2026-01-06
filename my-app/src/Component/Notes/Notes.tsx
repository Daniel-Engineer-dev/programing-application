"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { db } from "@/src/api/firebase/firebase";
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
    <div className="flex h-[calc(100vh-64px)] bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-900 text-slate-200 overflow-hidden font-sans relative">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      {/* SIDEBAR: DANH SÁCH GHI CHÚ */}
      <aside className="relative z-10 w-80 border-r border-blue-500/20 bg-gradient-to-br from-slate-900/50 to-blue-900/20 backdrop-blur-xl flex flex-col">
        <div className="p-5 border-b border-blue-500/20 flex items-center justify-between">
          <h2 className="font-bold text-xl bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Ghi chú ({notes.length})</h2>
          <button
            onClick={handleNewNote}
            className="p-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all active:scale-95 shadow-lg hover:shadow-blue-500/50"
          >
            <Plus size={20} />
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
                className={`p-4 border-b border-blue-500/10 cursor-pointer transition-all hover:bg-gradient-to-r hover:from-slate-800/40 hover:to-blue-900/20 group relative
                ${
                  selectedNote?.id === n.id
                    ? "bg-gradient-to-r from-slate-800/60 to-blue-900/30 border-l-4 border-l-blue-500 shadow-lg"
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
      <main className="relative z-10 flex-1 flex flex-col p-8">
        <div className="max-w-4xl w-full mx-auto flex flex-col h-full">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề ghi chú..."
            className="bg-transparent text-4xl font-bold outline-none mb-8 placeholder:text-slate-800 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
          />

          <div className="flex-1 relative mb-8">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bắt đầu viết nội dung tại đây..."
              className="w-full h-full bg-gradient-to-br from-slate-900/50 to-blue-900/20 border border-blue-500/30 rounded-2xl p-6 text-lg outline-none focus:border-blue-400 focus:shadow-lg focus:shadow-blue-500/20 transition-all resize-none scrollbar-thin scrollbar-thumb-blue-500/30 backdrop-blur-xl"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="flex items-center gap-2.5 px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-2xl hover:shadow-blue-500/50"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              Lưu ghi chú
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
